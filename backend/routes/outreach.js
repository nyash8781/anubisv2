const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { env } = require('../config/env');
const logger = require('../lib/logger');

const router = express.Router();

// POST /outreach/email — send an email via Resend
router.post('/outreach/email', requireAuth, async (req, res, next) => {
  try {
    const { to, subject, body, from_name } = req.body;
    if (!to || !body) return res.status(400).json({ error: 'to and body are required' });

    if (!env.resendApiKey) {
      return res.status(503).json({ error: 'Email service not configured — set RESEND_API_KEY' });
    }

    const { Resend } = require('resend');
    const resend = new Resend(env.resendApiKey);

    const { data, error } = await resend.emails.send({
      from: from_name ? `${from_name} <onboarding@resend.dev>` : 'Anubis <onboarding@resend.dev>',
      to: [to],
      subject: subject || 'Following up on your project',
      text: body,
    });

    if (error) {
      logger.error({ err: error }, 'Resend send error');
      return res.status(502).json({ error: 'Failed to send email', detail: error.message });
    }

    res.json({ ok: true, id: data?.id });
  } catch (err) {
    next(err);
  }
});

// POST /outreach/sms — send an SMS via Twilio
router.post('/outreach/sms', requireAuth, async (req, res, next) => {
  try {
    const { to, body } = req.body;
    if (!to || !body) return res.status(400).json({ error: 'to and body are required' });

    if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioPhoneNumber) {
      return res.status(503).json({ error: 'SMS service not configured — set TWILIO_* env vars' });
    }

    const twilio = require('twilio')(env.twilioAccountSid, env.twilioAuthToken);
    const message = await twilio.messages.create({
      body,
      from: env.twilioPhoneNumber,
      to,
    });

    res.json({ ok: true, sid: message.sid });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
