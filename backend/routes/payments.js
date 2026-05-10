const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getDb, getAdminDb } = require('../db/index');
const { isServiceConfigured, env } = require('../config/env');
const { validate, paymentRequestSchema, paymentManualMarkSchema } = require('../schemas');
const logger = require('../lib/logger');

const router = express.Router();

// ─── GET /payments?opportunity_id=<id> ─────────────────────────────────────────
router.get('/payments', requireAuth, async (req, res) => {
  const db = getDb(req.user.id);
  try {
    const opportunityId = req.query.opportunity_id !== undefined
      ? Number(req.query.opportunity_id)
      : undefined;
    const rows = await db.listPayments({ opportunityId });
    res.json(rows);
  } catch (err) {
    logger.error({ err }, 'GET /payments failed');
    res.status(500).json({ error: 'Failed to list payments' });
  }
});

// ─── POST /payments/request ────────────────────────────────────────────────────
// Creates a payment record AND (when Stripe is configured) a Stripe payment link.
// Always records the payments row regardless of Stripe config — that's the point
// of recording: even cash/check payments need an audit trail.
router.post('/payments/request', requireAuth, validate(paymentRequestSchema), async (req, res) => {
  const db = getDb(req.user.id);
  const { opportunity_id, proposal_id, amount, currency, description } = req.body;

  let stripePaymentLinkId = null;
  let stripePaymentLinkUrl = null;
  let stripeConfigured = false;

  if (isServiceConfigured('stripe')) {
    try {
      const Stripe = require('stripe');
      const stripe = new Stripe(env.stripeSecretKey, { apiVersion: '2024-06-20' });
      const product = await stripe.products.create({
        name: description || `Payment for opportunity #${opportunity_id}`,
      });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(amount * 100),
        currency: currency || 'usd',
      });
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        metadata: { opportunity_id: String(opportunity_id), proposal_id: proposal_id || '' },
      });
      stripePaymentLinkId = paymentLink.id;
      stripePaymentLinkUrl = paymentLink.url;
      stripeConfigured = true;
    } catch (err) {
      logger.error({ err }, 'Stripe payment link creation failed — recording payment request anyway');
    }
  } else {
    // DEFERRED: payments.stripe_link
    // See local/reports/deferred_implementation.md
    logger.warn('[DEFERRED payments.stripe] Stripe not configured — recording payment request without link');
  }

  try {
    const payment = await db.createPayment({
      opportunity_id,
      proposal_id: proposal_id || null,
      amount,
      currency: currency || 'usd',
      status: 'requested',
      description: description || '',
      stripe_payment_link_id: stripePaymentLinkId,
      stripe_payment_link_url: stripePaymentLinkUrl,
      metadata: { stripe_configured: stripeConfigured },
    });

    // Log activity on the opportunity
    try {
      await db.logActivity(opportunity_id, req.user.id, 'payment_requested',
        `Payment requested: ${currency?.toUpperCase() || 'USD'} ${amount.toFixed(2)}${description ? ` — ${description}` : ''}`);
    } catch (err) {
      logger.warn({ err }, 'Failed to log payment_requested activity');
    }

    res.status(201).json({
      payment,
      stripe_url: stripePaymentLinkUrl,
      stripe_configured: stripeConfigured,
      message: stripeConfigured
        ? 'Payment request created with Stripe link.'
        : 'Payment request recorded. Configure Stripe to enable payment links.',
    });
  } catch (err) {
    logger.error({ err }, 'POST /payments/request failed');
    res.status(500).json({ error: 'Failed to create payment request' });
  }
});

// ─── POST /payments/:id/mark ───────────────────────────────────────────────────
// Manual mark — records cash/check/ACH payments without going through Stripe.
// Updates the payment row + decrements the opportunity balance.
router.post('/payments/:id/mark', requireAuth, validate(paymentManualMarkSchema), async (req, res) => {
  const db = getDb(req.user.id);
  const { status, paid_at, notes } = req.body;
  try {
    const current = await db.getPayment(req.params.id);
    if (!current) return res.status(404).json({ error: 'Payment not found' });
    const now = paid_at || new Date().toISOString();
    const updates = { status };
    if (status === 'succeeded' || status === 'manual') updates.paid_at = now;
    if (status === 'failed') updates.failed_at = now;
    if (status === 'refunded') updates.refunded_at = now;
    if (notes) updates.metadata = { ...(current.metadata || {}), notes };

    const updated = await db.updatePayment(req.params.id, updates);

    // Decrement opportunity balance if newly succeeded/manual (idempotent: only on transition)
    if ((status === 'succeeded' || status === 'manual') && current.status !== 'succeeded' && current.status !== 'manual') {
      try {
        await db.decrementOpportunityBalance(current.opportunity_id, Number(current.amount) || 0);
      } catch (err) {
        logger.warn({ err }, 'Failed to decrement opportunity balance');
      }
    }

    try {
      await db.logActivity(current.opportunity_id, req.user.id, 'payment_status_changed',
        `Payment marked ${status}${notes ? ` — ${notes}` : ''} ($${Number(current.amount).toFixed(2)})`);
    } catch (err) {
      logger.warn({ err }, 'Failed to log payment_status_changed activity');
    }

    res.json(updated);
  } catch (err) {
    logger.error({ err, id: req.params.id }, 'POST /payments/:id/mark failed');
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// ─── POST /payments/webhook ────────────────────────────────────────────────────
// Stripe webhook. MUST be mounted with raw body (see server.js).
//
// DEFERRED: payments.webhook.real_signature_verification
//   Once STRIPE_WEBHOOK_SECRET is configured AND `stripe` SDK is installed, this
//   handler verifies the signature and processes events. Until then, it logs +
//   no-ops without 500-ing (so the route exists and Stripe can be pointed at it
//   for setup testing).
router.post('/payments/webhook', async (req, res) => {
  if (!isServiceConfigured('stripe') || !env.stripeWebhookSecret) {
    logger.warn('[DEFERRED payments.webhook] Stripe webhook secret not set — ignoring incoming event');
    return res.status(200).json({ received: true, processed: false, reason: 'webhook not configured' });
  }

  let Stripe;
  try {
    Stripe = require('stripe');
  } catch {
    logger.warn('[DEFERRED payments.webhook] stripe SDK not installed — ignoring incoming event');
    return res.status(200).json({ received: true, processed: false, reason: 'stripe SDK missing' });
  }

  const stripe = new Stripe(env.stripeSecretKey, { apiVersion: '2024-06-20' });
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.stripeWebhookSecret);
  } catch (err) {
    logger.error({ err: err.message }, 'Stripe webhook signature verification failed');
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  const adminDb = getAdminDb();

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'payment_link.completed') {
      const session = event.data.object;
      const sessionId = session.id;
      const paymentIntentId = session.payment_intent || null;

      const payment = await adminDb.findPaymentByStripeRef({
        session_id: sessionId,
        payment_intent_id: paymentIntentId,
      });

      if (!payment) {
        // Could happen for test events or detached payments — log and ack
        logger.warn({ sessionId, paymentIntentId, eventType: event.type }, 'Webhook received for unknown payment');
        return res.status(200).json({ received: true, processed: false, reason: 'unknown payment ref' });
      }

      if (payment.status === 'succeeded') {
        // Idempotency — already processed
        return res.status(200).json({ received: true, processed: false, reason: 'already succeeded' });
      }

      const updates = {
        status: 'succeeded',
        paid_at: new Date().toISOString(),
        stripe_session_id: sessionId,
        stripe_payment_intent_id: paymentIntentId,
      };
      await adminDb.updatePayment(payment.id, updates);

      try {
        await adminDb.decrementOpportunityBalance(payment.opportunity_id, payment.user_id, Number(payment.amount) || 0);
      } catch (err) {
        logger.warn({ err }, 'Failed to decrement balance from webhook');
      }

      try {
        await adminDb.logActivity(payment.opportunity_id, payment.user_id, 'payment_status_changed',
          `Payment received: $${Number(payment.amount).toFixed(2)} (Stripe)`);
      } catch (err) {
        logger.warn({ err }, 'Failed to log payment activity from webhook');
      }

      return res.status(200).json({ received: true, processed: true });
    }

    // Other events are acked but not processed
    return res.status(200).json({ received: true, processed: false, reason: `event ${event.type} not handled` });
  } catch (err) {
    logger.error({ err, eventType: event.type }, 'Stripe webhook processing failed');
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ─── DEPRECATED: legacy /payments/create-link kept for back-compat ────────────
// Frontend should switch to POST /payments/request
router.post('/payments/create-link', requireAuth, async (req, res) => {
  res.status(410).json({
    error: 'Endpoint moved. Use POST /payments/request instead.',
    new_endpoint: '/payments/request',
  });
});

module.exports = router;
