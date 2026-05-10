-- Migration 009: Payments
-- Records every payment request and webhook-confirmed payment.
-- Pairs with the Stripe webhook handler at POST /payments/webhook.
-- Idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS payments (
  id                       UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                  UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id           BIGINT       NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  proposal_id              UUID         REFERENCES proposals(id) ON DELETE SET NULL,
  -- Money
  amount                   NUMERIC      NOT NULL,
  currency                 TEXT         NOT NULL DEFAULT 'usd',
  -- Lifecycle
  status                   TEXT         NOT NULL DEFAULT 'requested'
                                        CHECK (status IN ('requested','pending','succeeded','failed','refunded','manual')),
  description              TEXT         NOT NULL DEFAULT '',
  -- Stripe handles
  stripe_payment_link_id   TEXT,
  stripe_payment_link_url  TEXT,
  stripe_session_id        TEXT,
  stripe_payment_intent_id TEXT,
  -- Audit
  metadata                 JSONB        NOT NULL DEFAULT '{}'::jsonb,
  requested_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  paid_at                  TIMESTAMPTZ,
  failed_at                TIMESTAMPTZ,
  refunded_at              TIMESTAMPTZ,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payments_user_id_idx               ON payments (user_id);
CREATE INDEX IF NOT EXISTS payments_opportunity_idx           ON payments (user_id, opportunity_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS payments_proposal_idx              ON payments (proposal_id);
CREATE INDEX IF NOT EXISTS payments_stripe_session_idx        ON payments (stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS payments_stripe_intent_idx         ON payments (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- Reuse the set_updated_at function defined in migration 001
DROP TRIGGER IF EXISTS payments_updated_at ON payments;
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own payments"
  ON payments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
