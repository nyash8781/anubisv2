const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { getDb } = require('../db/index');
const { supabaseServiceClient } = require('../db/client');
const aiProvider = require('../ai-provider');
const usageService = require('../services/usageService');
const entitlementService = require('../services/entitlementService');
const logger = require('../lib/logger');
const { env, isServiceConfigured } = require('../config/env');

const router = Router();

// Helper: Get organization ID for a user
async function getOrganizationIdForUser(userId) {
  if (!supabaseServiceClient || !userId) return null;
  const { data } = await supabaseServiceClient
    .from('organizations')
    .select('id')
    .eq('owner_user_id', userId)
    .single();
  return data?.id || null;
}

// POST /outreach/generate
// Generate personalized AI messages for selected leads.
// Body: { job_ids: number[], channel: 'email' | 'sms', context?: string }
router.post('/generate', requireAuth, async (req, res) => {
  const { job_ids, channel, context } = req.body;
  if (!Array.isArray(job_ids) || job_ids.length === 0) {
    return res.status(400).json({ error: 'job_ids array is required' });
  }
  if (!['email', 'sms'].includes(channel)) {
    return res.status(400).json({ error: 'channel must be email or sms' });
  }

  const db = getDb(req.user.id);
  try {
    // Get organization ID for usage tracking and limit enforcement (Phase E)
    const organizationId = await getOrganizationIdForUser(req.user.id);

    // Check AI generation limit before generating (Phase E)
    if (organizationId) {
      const limitCheck = await entitlementService.checkUsageLimit(
        organizationId,
        'ai_generations',
        1
      );
      if (!limitCheck.allowed) {
        return res.status(402).json({
          error: 'AI generation limit reached',
          reason: limitCheck.reason,
          used: limitCheck.used,
          limit: limitCheck.limit,
          plan: limitCheck.planName,
          upgradeUrl: limitCheck.upgradeUrl,
        });
      }
    }

    const allJobs = await db.readJobs();
    const selected = allJobs.filter((j) => job_ids.includes(j.id));
    if (selected.length === 0) {
      return res.status(404).json({ error: 'No matching jobs found' });
    }

    const settings = await db.getSettings();
    const businessName = settings?.business_name || 'our company';
    const basePrompt = settings?.base_prompt || '';
    const businessContext = settings?.business_context || '';

    const channelInstructions = channel === 'sms'
      ? 'Write a short, friendly SMS message under 160 characters. Casual but professional tone. No links or formatting.'
      : 'Write a concise, professional outreach email. First line must be "Subject: <subject>". Keep the body under 200 words.';

    const messages = await Promise.all(
      selected.map(async (job) => {
        const name = job.first_name || (job.customer_name || '').split(' ')[0] || 'there';
        const service = job.service || job.scope_of_work || 'your upcoming project';

        const prompt = [
          basePrompt,
          businessContext,
          `You are writing on behalf of ${businessName}.`,
          channelInstructions,
          `Recipient: ${name}. Project interest: ${service}.`,
          context ? `Campaign context: ${context}` : '',
          'Output only the message. No explanations, no labels.',
        ].filter(Boolean).join('\n');

        try {
          const text = await aiProvider.generate(prompt);
          return { job_id: job.id, customer_name: job.customer_name || name, message: text };
        } catch (err) {
          logger.warn({ err, job_id: job.id }, 'Outreach generation failed for job');
          return { job_id: job.id, customer_name: job.customer_name || name, message: null, error: 'Generation failed' };
        }
      })
    );

    res.json({ channel, messages });
  } catch (err) {
    logger.error({ err }, 'POST /outreach/generate failed');
    res.status(500).json({ error: 'Outreach generation failed' });
  }
});

// POST /outreach/send
// Send generated messages via Resend (email) or Twilio (SMS).
// Body: { messages: [{ job_id, to, message }], channel: 'email' | 'sms' }
router.post('/send', requireAuth, async (req, res) => {
  const { messages, channel } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const db = getDb(req.user.id);
  const organizationId = await getOrganizationIdForUser(req.user.id);
  const settings = await db.getSettings().catch(() => ({}));
  const results = [];

  // Count messages by type (Phase E)
  const emailCount = channel === 'email' ? messages.length : 0;
  const smsCount = channel === 'sms' ? messages.length : 0;

  // Check email limit if sending emails (Phase E)
  if (emailCount > 0 && organizationId) {
    const emailCheck = await entitlementService.checkUsageLimit(
      organizationId,
      'emails_sent',
      emailCount
    );
    if (!emailCheck.allowed) {
      return res.status(402).json({
        error: 'Email sending limit reached',
        reason: emailCheck.reason,
        used: emailCheck.used,
        limit: emailCheck.limit,
        plan: emailCheck.planName,
        upgradeUrl: emailCheck.upgradeUrl,
      });
    }
  }

  // Check SMS limit if sending SMS (Phase E)
  if (smsCount > 0 && organizationId) {
    const smsCheck = await entitlementService.checkUsageLimit(
      organizationId,
      'sms_sent',
      smsCount
    );
    if (!smsCheck.allowed) {
      return res.status(402).json({
        error: 'SMS sending limit reached',
        reason: smsCheck.reason,
        used: smsCheck.used,
        limit: smsCheck.limit,
        plan: smsCheck.planName,
        upgradeUrl: smsCheck.upgradeUrl,
      });
    }
  }

  for (const m of messages) {
    if (!m.to || !m.message) {
      results.push({ job_id: m.job_id, ok: false, error: 'Missing to or message' });
      continue;
    }

    try {
      if (channel === 'email') {
        if (!isServiceConfigured('resend')) {
          results.push({ job_id: m.job_id, ok: false, error: 'Email is not configured (Resend)' });
          continue;
        }
        const { Resend } = require('resend');
        const resend = new Resend(env.resendApiKey);
        const fromEmail = process.env.RESEND_FROM_EMAIL || settings?.company_email || 'noreply@example.com';
        const fromName = settings?.business_name || 'Anubis';

        let subject = 'Following up on your project';
        let body = m.message;
        const lines = m.message.split('\n');
        if (lines[0].toLowerCase().startsWith('subject:')) {
          subject = lines[0].replace(/^subject:\s*/i, '').trim();
          body = lines.slice(1).join('\n').trim();
        }

        await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: m.to,
          subject,
          text: body,
        });
      } else {
        if (!isServiceConfigured('twilio')) {
          results.push({ job_id: m.job_id, ok: false, error: 'SMS is not configured (Twilio)' });
          continue;
        }
        const twilio = require('twilio')(env.twilioAccountSid, env.twilioAuthToken);
        await twilio.messages.create({
          body: m.message,
          from: env.twilioPhoneNumber,
          to: m.to,
        });
      }

      // Log the outreach as a contact action
      try {
        const { updateContact } = require('../services/jobService');
        const job = await db.findJobById(m.job_id);
        if (job) {
          const actionType = channel === 'sms' ? 'text' : 'email';
          const updated = updateContact(job, actionType, settings);
          await db.updateJob(m.job_id, updated);
          await db.logActivity(m.job_id, req.user.id, actionType, 'Outreach campaign message sent');
        }
      } catch { /* non-fatal */ }

      // Log usage event (fire-and-forget, Phase E)
      if (organizationId) {
        if (channel === 'email') {
          usageService.log(organizationId, req.user.id, 'email_sent', {
            count: 1,
            template: 'outreach_personalized',
            job_id: m.job_id,
          });
        } else if (channel === 'sms') {
          usageService.log(organizationId, req.user.id, 'sms_sent', {
            count: 1,
            template: 'outreach_personalized',
            job_id: m.job_id,
          });
        }
      }

      results.push({ job_id: m.job_id, ok: true });
    } catch (err) {
      logger.error({ err, job_id: m.job_id }, 'Outreach send failed');
      results.push({ job_id: m.job_id, ok: false, error: err.message });
    }
  }

  const allOk = results.every((r) => r.ok);
  res.status(allOk ? 200 : 207).json({ results });
});

module.exports = router;
