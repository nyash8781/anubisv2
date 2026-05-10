-- Migration 008b: Add send-related columns to proposals
-- Extends migration 008 (proposals) with fields needed for the Send flow.
-- Idempotent — safe to run multiple times.
--
-- Run this in the Supabase SQL editor after migration 008.

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS customer_name  TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS customer_email TEXT        NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS expires_at     TIMESTAMPTZ;

-- Backfill: when an opportunity has email/customer_name, copy into the
-- attached proposal so the Send modal pre-fills correctly.
UPDATE proposals p
SET customer_email = COALESCE(NULLIF(p.customer_email, ''), o.email),
    customer_name  = COALESCE(NULLIF(p.customer_name, ''), o.customer_name)
FROM opportunities o
WHERE p.opportunity_id = o.id
  AND (p.customer_email = '' OR p.customer_name = '');
