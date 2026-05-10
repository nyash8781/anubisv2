// Public proposal view + accept/decline/request-changes actions.
// NO requireAuth — the token in the URL IS the authorization.
//
// All operations use the admin (service-role) store because the homeowner
// client doesn't have an Anubis account.
//
// Rate limit: enforced in server.js via the same aiRateLimit middleware
// (a stricter dedicated limit would be a Phase 5 polish — for private beta the
// 10 req/min/IP cap is fine).

const { Router } = require('express');
const { z } = require('zod');
const { useSupabase } = require('../db/index');
const { validate } = require('../schemas');
const logger = require('../lib/logger');

const adminStore = useSupabase
  ? require('../db/supabaseStore')
  : require('../db/jsonStore');

const router = Router();

// Helper: validate token, return share link or send the appropriate error response
async function loadValidShareLink(token, res) {
  const link = await adminStore.getShareLinkByTokenAdmin(token);
  if (!link) {
    res.status(404).json({ error: 'Proposal link not found' });
    return null;
  }
  if (link.revoked_at) {
    res.status(410).json({ error: 'This proposal link has been revoked' });
    return null;
  }
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    res.status(410).json({ error: 'This proposal has expired' });
    return null;
  }
  return link;
}

// Strip internal-only fields before serving to the public client.
// CRITICAL: nothing in this allowlist exposes unit_cost, markup, internal notes,
// or any cost-vs-price internals.
function publicProposalDTO(proposal) {
  if (!proposal) return null;
  const items = (proposal.line_items || []).map((i) => ({
    id: i.id,
    item_name: i.item_name,
    description: i.description,
    category: i.category,
    quantity: i.quantity,
    unit: i.unit,
    // Client sees the *total* price for the line — not unit_cost or markup.
    total: i.total,
    optional: i.optional,
    sort_order: i.sort_order,
  }));
  return {
    id: proposal.id,
    proposal_number: proposal.proposal_number,
    title: proposal.title,
    customer_name: proposal.customer_name,
    customer_email: proposal.customer_email,
    service_type: proposal.service_type,
    status: proposal.status,
    template_style: proposal.template_style,
    estimated_start_date: proposal.estimated_start_date,
    due_date: proposal.due_date,
    expires_at: proposal.expires_at,
    scope_of_work: proposal.scope_of_work,
    included_work: proposal.included_work || [],
    assumptions: proposal.assumptions || [],
    exclusions: proposal.exclusions || [],
    client_responsibilities: proposal.client_responsibilities || [],
    subtotal: proposal.subtotal,
    tax_enabled: proposal.tax_enabled,
    tax_rate: proposal.tax_rate,
    tax_amount: proposal.tax_amount,
    discount_amount: proposal.discount_amount,
    total: proposal.total,
    sent_at: proposal.sent_at,
    approved_at: proposal.approved_at,
    line_items: items,
  };
}

// ─── GET /public/proposals/:token ─────────────────────────────────────────────
router.get('/:token', async (req, res) => {
  try {
    const link = await loadValidShareLink(req.params.token, res);
    if (!link) return;

    const proposal = await adminStore.getProposalForPublicAdmin(link.proposal_id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    // Best-effort open tracking
    try {
      await adminStore.bumpShareLinkOpenedAdmin(link.id);
    } catch (err) {
      logger.warn({ err }, 'Failed to bump share link open count');
    }

    res.json({
      proposal: publicProposalDTO(proposal),
      // Minimal share-link info — the client doesn't need internals
      link: {
        expires_at: link.expires_at,
      },
    });
  } catch (err) {
    logger.error({ err, token: req.params.token }, 'GET /public/proposals/:token failed');
    res.status(500).json({ error: 'Failed to load proposal' });
  }
});

// ─── POST /public/proposals/:token/accept ─────────────────────────────────────
const acceptSchema = z.object({
  signer_name: z.string().trim().min(1, 'Name is required').max(120),
  signer_email: z.string().trim().email('Valid email is required'),
  signature_text: z.string().trim().min(1, 'Signature is required').max(120),
  agreed_terms: z.boolean().refine((v) => v === true, 'You must agree to the terms'),
});

router.post('/:token/accept', validate(acceptSchema), async (req, res) => {
  try {
    const link = await loadValidShareLink(req.params.token, res);
    if (!link) return;

    const proposal = await adminStore.getProposalForPublicAdmin(link.proposal_id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    if (proposal.status === 'approved') {
      return res.status(409).json({ error: 'This proposal has already been approved' });
    }

    const ipAddress = req.headers['x-forwarded-for']?.toString().split(',')[0].trim()
      || req.socket?.remoteAddress
      || null;

    const signature = await adminStore.recordSignatureAdmin({
      proposal_id: proposal.id,
      user_id: link.user_id,
      share_link_id: link.id,
      signer_name: req.body.signer_name,
      signer_email: req.body.signer_email,
      signature_text: req.body.signature_text,
      agreed_terms: req.body.agreed_terms,
      ip_address: ipAddress,
      user_agent: req.headers['user-agent'] || null,
    });

    const updated = await adminStore.setProposalStatusAdmin(proposal.id, 'approved', {
      approved_at: new Date().toISOString(),
    });

    // Activity log on the linked opportunity
    if (updated && updated.opportunity_id) {
      try {
        await adminStore.adminLogActivity(
          updated.opportunity_id,
          link.user_id,
          'proposal_modified',
          `Proposal approved by ${req.body.signer_name} (${req.body.signer_email})`
        );
      } catch (err) {
        logger.warn({ err }, 'Failed to log proposal_approved activity');
      }
    }

    // DEFERRED: proposals.approval.auto_payment
    // When W3 + this ship together in production, this is where we'd
    // automatically create a deposit payment request via Stripe and email it
    // to the signer. For now, the contractor sees the approval activity in
    // their timeline and can request the deposit manually.
    logger.info({ proposalId: proposal.id }, '[DEFERRED proposals.approval.auto_payment] Auto-deposit not yet wired');

    res.json({
      ok: true,
      signature: { id: signature.id, signed_at: signature.signed_at },
    });
  } catch (err) {
    logger.error({ err, token: req.params.token }, 'POST /public/proposals/:token/accept failed');
    res.status(500).json({ error: 'Failed to accept proposal' });
  }
});

// ─── POST /public/proposals/:token/decline ────────────────────────────────────
const declineSchema = z.object({
  reason: z.string().trim().max(2000).optional().default(''),
});

router.post('/:token/decline', validate(declineSchema), async (req, res) => {
  try {
    const link = await loadValidShareLink(req.params.token, res);
    if (!link) return;
    const proposal = await adminStore.getProposalForPublicAdmin(link.proposal_id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    if (proposal.status === 'declined' || proposal.status === 'approved') {
      return res.status(409).json({ error: `Proposal is already ${proposal.status}` });
    }

    const updated = await adminStore.setProposalStatusAdmin(proposal.id, 'declined');

    if (updated && updated.opportunity_id) {
      try {
        await adminStore.adminLogActivity(
          updated.opportunity_id,
          link.user_id,
          'proposal_modified',
          `Proposal declined${req.body.reason ? ` — ${req.body.reason}` : ''}`
        );
      } catch (err) {
        logger.warn({ err }, 'Failed to log proposal_declined activity');
      }
    }

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'POST /public/proposals/:token/decline failed');
    res.status(500).json({ error: 'Failed to decline proposal' });
  }
});

// ─── POST /public/proposals/:token/request-changes ────────────────────────────
const revisionSchema = z.object({
  message: z.string().trim().min(1, 'A message is required').max(2000),
});

router.post('/:token/request-changes', validate(revisionSchema), async (req, res) => {
  try {
    const link = await loadValidShareLink(req.params.token, res);
    if (!link) return;
    const proposal = await adminStore.getProposalForPublicAdmin(link.proposal_id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    await adminStore.recordRevisionRequestAdmin({
      proposal_id: proposal.id,
      user_id: link.user_id,
      share_link_id: link.id,
      message: req.body.message,
    });

    const updated = await adminStore.setProposalStatusAdmin(proposal.id, 'revision_requested');

    if (updated && updated.opportunity_id) {
      try {
        await adminStore.adminLogActivity(
          updated.opportunity_id,
          link.user_id,
          'proposal_modified',
          `Client requested changes — "${req.body.message.slice(0, 200)}${req.body.message.length > 200 ? '…' : ''}"`
        );
      } catch (err) {
        logger.warn({ err }, 'Failed to log revision_requested activity');
      }
    }

    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'POST /public/proposals/:token/request-changes failed');
    res.status(500).json({ error: 'Failed to record revision request' });
  }
});

module.exports = router;
