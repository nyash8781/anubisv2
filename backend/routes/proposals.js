const { Router } = require('express');
const { randomBytes } = require('crypto');
const { requireAuth } = require('../middleware/auth');
const { getDb, useSupabase } = require('../db/index');
const { supabaseServiceClient } = require('../db/client');
const { validate, proposalSchema, proposalStatusTransitionSchema, proposalSendSchema } = require('../schemas');
const logger = require('../lib/logger');
const { isServiceConfigured, env } = require('../config/env');
const usageService = require('../services/usageService');
const entitlementService = require('../services/entitlementService');

// Admin store for share-link + version-snapshot creation. The send route runs
// under user auth, but the share link rows are looked up later by token via
// the public route which has no auth context — so we create them with the
// admin/service-role client to keep the shape consistent.
const adminStore = useSupabase
  ? require('../db/supabaseStore')
  : require('../db/jsonStore');

function makeShareToken() {
  // 32 URL-safe chars ~= 192 bits of entropy
  return randomBytes(24).toString('base64url');
}

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

const router = Router();

// GET /proposals?opportunity_id=<id>
router.get('/', requireAuth, async (req, res) => {
  const db = getDb(req.user.id);
  try {
    const opportunityId = req.query.opportunity_id !== undefined
      ? Number(req.query.opportunity_id)
      : undefined;
    const proposals = await db.listProposals({ opportunityId });
    res.json(proposals);
  } catch (err) {
    logger.error({ err }, 'GET /proposals failed');
    res.status(500).json({ error: 'Failed to list proposals' });
  }
});

// GET /proposals/:id
router.get('/:id', requireAuth, async (req, res) => {
  const db = getDb(req.user.id);
  try {
    const proposal = await db.getProposal(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    res.json(proposal);
  } catch (err) {
    logger.error({ err, id: req.params.id }, 'GET /proposals/:id failed');
    res.status(500).json({ error: 'Failed to load proposal' });
  }
});

// POST /proposals — create with line items in one transaction
router.post('/', requireAuth, validate(proposalSchema), async (req, res) => {
  const db = getDb(req.user.id);
  try {
    const created = await db.createProposal(req.body);
    // Log activity if attached to an opportunity
    if (created.opportunity_id) {
      try {
        await db.logActivity(
          created.opportunity_id,
          req.user.id,
          'proposal_created',
          `Proposal "${created.title || created.proposal_number || 'Untitled'}" created`
        );
      } catch (err) {
        logger.warn({ err }, 'Failed to log proposal_created activity');
      }
    }
    res.status(201).json(created);
  } catch (err) {
    logger.error({ err }, 'POST /proposals failed');
    res.status(500).json({ error: 'Failed to create proposal' });
  }
});

// PUT /proposals/:id — replace fields and (optionally) all line items
router.put('/:id', requireAuth, validate(proposalSchema), async (req, res) => {
  const db = getDb(req.user.id);
  try {
    const updated = await db.updateProposal(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Proposal not found' });
    if (updated.opportunity_id) {
      try {
        await db.logActivity(
          updated.opportunity_id,
          req.user.id,
          'proposal_modified',
          `Proposal "${updated.title || updated.proposal_number || 'Untitled'}" updated`
        );
      } catch (err) {
        logger.warn({ err }, 'Failed to log proposal_modified activity');
      }
    }
    res.json(updated);
  } catch (err) {
    logger.error({ err, id: req.params.id }, 'PUT /proposals/:id failed');
    res.status(500).json({ error: 'Failed to update proposal' });
  }
});

// POST /proposals/:id/status — explicit status transition with auto-timestamps
router.post('/:id/status', requireAuth, validate(proposalStatusTransitionSchema), async (req, res) => {
  const db = getDb(req.user.id);
  const { status } = req.body;
  const now = new Date().toISOString();
  const timestamps = {};
  if (status === 'sent') timestamps.sent_at = now;
  if (status === 'approved') timestamps.approved_at = now;
  try {
    const updated = await db.setProposalStatus(req.params.id, status, timestamps);
    if (!updated) return res.status(404).json({ error: 'Proposal not found' });
    if (updated.opportunity_id) {
      try {
        await db.logActivity(
          updated.opportunity_id,
          req.user.id,
          'proposal_modified',
          `Proposal status changed to "${status}"`
        );
      } catch (err) {
        logger.warn({ err }, 'Failed to log proposal status activity');
      }
    }
    res.json(updated);
  } catch (err) {
    logger.error({ err, id: req.params.id }, 'POST /proposals/:id/status failed');
    res.status(500).json({ error: 'Failed to update proposal status' });
  }
});

// POST /proposals/:id/send
//
// DEFERRED: proposals.send.email, proposals.send.pdf, proposals.send.share_link
//   See local/reports/deferred_implementation.md
//
// Today this:
//   - Validates the proposal is in `ready` state
//   - Marks status = 'sent', stamps sent_at
//   - Logs an activity entry on the linked opportunity
//   - Returns a placeholder share_url so the frontend has a clipboard target
//
// Phase 4 will replace this with: real Resend email + Browserless PDF + a
// `proposal_share_links` row backing the URL with a real token + revoke + expiry.
router.post('/:id/send', requireAuth, validate(proposalSendSchema), async (req, res) => {
  const db = getDb(req.user.id);
  const { to, expires_at } = req.body;
  try {
    // Get organization ID for usage tracking and limit enforcement (Phase E)
    const organizationId = await getOrganizationIdForUser(req.user.id);

    // Check email sending limit (Phase E)
    if (organizationId) {
      const emailCheck = await entitlementService.checkUsageLimit(
        organizationId,
        'emails_sent',
        1
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

    const current = await db.getProposal(req.params.id);
    if (!current) return res.status(404).json({ error: 'Proposal not found' });
    if (current.status !== 'ready' && current.status !== 'sent') {
      return res.status(400).json({
        error: `Proposal must be in 'ready' state to send (currently '${current.status}'). Mark it ready first.`,
      });
    }

    const now = new Date().toISOString();
    const expiryIso = expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const updates = {
      sent_at: now,
      customer_email: to,
      expires_at: expiryIso,
    };
    const updated = await db.setProposalStatus(req.params.id, 'sent', updates);

    // ─── Snapshot the current proposal as a version ─────────────────────────
    let versionRow = null;
    try {
      const versionNumber = await adminStore.getNextVersionNumberAdmin(req.params.id);
      const fullProposal = await adminStore.getProposalForPublicAdmin(req.params.id);
      versionRow = await adminStore.createVersionSnapshotAdmin({
        proposal_id: req.params.id,
        user_id: req.user.id,
        version_number: versionNumber,
        snapshot: fullProposal,
        share_link_id: null, // patched below after share link is created
      });
    } catch (err) {
      logger.warn({ err }, 'Failed to snapshot proposal version (non-fatal)');
    }

    // ─── Create a real share link ────────────────────────────────────────────
    let shareLink = null;
    let shareUrl = null;
    try {
      const token = makeShareToken();
      shareLink = await adminStore.createShareLinkAdmin({
        proposal_id: req.params.id,
        user_id: req.user.id,
        token,
        expires_at: expiryIso,
        version_id: versionRow?.id || null,
      });
      const frontendUrl = (env.frontendUrl || process.env.FRONTEND_URL || '').replace(/\/$/, '');
      shareUrl = `${frontendUrl}/p/${token}`;
    } catch (err) {
      logger.error({ err }, 'Failed to create share link — proposal is marked sent but no public URL');
    }

    // ─── Activity log ────────────────────────────────────────────────────────
    if (updated && updated.opportunity_id) {
      try {
        await db.logActivity(
          updated.opportunity_id,
          req.user.id,
          'proposal_modified',
          `Proposal "${updated.title || updated.proposal_number || 'Untitled'}" sent to ${to}`
        );
      } catch (err) {
        logger.warn({ err }, 'Failed to log proposal_sent activity');
      }
    }

    // ─── DEFERRED: real email + PDF ──────────────────────────────────────────
    // proposals.send.email: send the email via Resend (graceful — same pattern as team invites)
    // proposals.send.pdf: render the public view to PDF via Browserless and attach
    let emailSent = false;
    let emailError = null;
    if (isServiceConfigured('resend') && shareUrl) {
      try {
        const { Resend } = require('resend');
        const resend = new Resend(env.resendApiKey);
        const settings = await db.getSettings().catch(() => ({}));
        const businessName = settings?.businessProfile?.companyName || settings?.business_name || 'Anubis';
        const fromEmail = process.env.RESEND_FROM_EMAIL || `noreply@${process.env.RESEND_DOMAIN || 'example.com'}`;
        const subject = req.body.subject || `Proposal: ${updated.title || updated.proposal_number || 'Your project'}`;
        const messageBody = (req.body.message || `Please find your proposal at the link below.`)
          .replace(/\n/g, '<br>');
        await resend.emails.send({
          from: `${businessName} <${fromEmail}>`,
          to,
          subject,
          html: `
            <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 540px; margin: auto; padding: 24px;">
              <p style="color: #444; line-height: 1.55;">${messageBody}</p>
              <p style="margin: 24px 0;">
                <a href="${shareUrl}"
                   style="display: inline-block; background: #0052FF; color: #fff; text-decoration: none;
                          padding: 12px 20px; border-radius: 8px; font-weight: 600;">
                  Review Proposal
                </a>
              </p>
              <p style="color: #888; font-size: 13px; line-height: 1.5;">
                Or open this link in your browser: <br>
                <a href="${shareUrl}">${shareUrl}</a>
              </p>
            </div>
          `,
          text: `${req.body.message || 'Please find your proposal.'}\n\nReview: ${shareUrl}`,
        });
        emailSent = true;

        // Log usage event (fire-and-forget, Phase E)
        if (organizationId) {
          usageService.log(organizationId, req.user.id, 'email_sent', {
            count: 1,
            template: 'proposal_share',
            proposal_id: req.params.id,
          });
        }
      } catch (err) {
        logger.error({ err }, 'Resend proposal email send failed — share link still created');
        emailError = err.message;
      }
    } else if (!isServiceConfigured('resend')) {
      logger.warn({ proposalId: req.params.id }, '[DEFERRED proposals.send.email] Resend not configured — no email sent');
    }

    // proposals.send.pdf still deferred — public view exists but Browserless not wired.
    logger.info({ proposalId: req.params.id }, '[DEFERRED proposals.send.pdf] PDF generation not yet wired (public view available at share URL)');

    res.json({
      proposal: updated,
      share_url: shareUrl,
      email_sent: emailSent,
      email_error: emailError,
      pdf_attached: false, // truthy when proposals.send.pdf ships
      message: emailSent
        ? `Proposal sent to ${to}. They'll receive an email with the link.`
        : shareUrl
          ? `Proposal marked as sent. Copy the share link to send manually${isServiceConfigured('resend') ? ' (email send failed — see logs)' : ' (configure Resend to enable email)'}.`
          : 'Proposal marked as sent, but share link could not be created. Check server logs.',
    });
  } catch (err) {
    logger.error({ err, id: req.params.id }, 'POST /proposals/:id/send failed');
    res.status(500).json({ error: 'Failed to send proposal' });
  }
});

// DELETE /proposals/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const db = getDb(req.user.id);
  try {
    const ok = await db.deleteProposal(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Proposal not found' });
    res.status(204).end();
  } catch (err) {
    logger.error({ err, id: req.params.id }, 'DELETE /proposals/:id failed');
    res.status(500).json({ error: 'Failed to delete proposal' });
  }
});

module.exports = router;
