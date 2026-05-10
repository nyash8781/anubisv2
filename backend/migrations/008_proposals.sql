-- Migration 008: Proposals + line items
-- Run this in the Supabase SQL editor.
-- Adds backend persistence for the Proposal Builder. Replaces the localStorage-only
-- proposal draft store with real, user-scoped, attachable-to-opportunity proposals.

-- ─── proposals ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS proposals (
  id                      UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id          BIGINT      REFERENCES opportunities(id) ON DELETE SET NULL,
  proposal_number         TEXT        NOT NULL DEFAULT '',
  title                   TEXT        NOT NULL DEFAULT '',
  service_type            TEXT        NOT NULL DEFAULT '',
  milestone               TEXT        NOT NULL DEFAULT 'Proposal',
  status                  TEXT        NOT NULL DEFAULT 'draft'
                                      CHECK (status IN ('draft','ready','sent','approved','declined','expired')),
  template_style          TEXT        NOT NULL DEFAULT 'modern',
  estimated_start_date    TEXT        NOT NULL DEFAULT '',
  due_date                TEXT        NOT NULL DEFAULT '',
  -- Scope (JSONB arrays for repeated string fields)
  scope_of_work           TEXT        NOT NULL DEFAULT '',
  included_work           JSONB       NOT NULL DEFAULT '[]'::jsonb,
  assumptions             JSONB       NOT NULL DEFAULT '[]'::jsonb,
  exclusions              JSONB       NOT NULL DEFAULT '[]'::jsonb,
  client_responsibilities JSONB       NOT NULL DEFAULT '[]'::jsonb,
  internal_notes          TEXT        NOT NULL DEFAULT '',
  -- Pricing snapshot (computed by frontend pricingService, stored on save)
  subtotal                NUMERIC     NOT NULL DEFAULT 0,
  taxable_subtotal        NUMERIC     NOT NULL DEFAULT 0,
  tax_enabled             BOOLEAN     NOT NULL DEFAULT FALSE,
  tax_rate                NUMERIC     NOT NULL DEFAULT 0,
  tax_amount              NUMERIC     NOT NULL DEFAULT 0,
  discount_amount         NUMERIC     NOT NULL DEFAULT 0,
  total                   NUMERIC     NOT NULL DEFAULT 0,
  -- Lifecycle timestamps
  preview_generated_at    TIMESTAMPTZ,
  sent_at                 TIMESTAMPTZ,
  approved_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS proposals_user_id_idx           ON proposals (user_id);
CREATE INDEX IF NOT EXISTS proposals_user_opportunity_idx  ON proposals (user_id, opportunity_id);
CREATE INDEX IF NOT EXISTS proposals_user_created_idx      ON proposals (user_id, created_at DESC);

-- updated_at trigger (function defined in migration 001)
DROP TRIGGER IF EXISTS proposals_updated_at ON proposals;
CREATE TRIGGER proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own proposals"
  ON proposals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─── proposal_line_items ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS proposal_line_items (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id         UUID        NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name           TEXT        NOT NULL DEFAULT '',
  description         TEXT        NOT NULL DEFAULT '',
  category            TEXT        NOT NULL DEFAULT 'material',
  room_or_area        TEXT        NOT NULL DEFAULT '',
  phase               TEXT        NOT NULL DEFAULT '',
  vendor              TEXT        NOT NULL DEFAULT '',
  model               TEXT        NOT NULL DEFAULT '',
  sku                 TEXT        NOT NULL DEFAULT '',
  quantity            NUMERIC     NOT NULL DEFAULT 1,
  unit                TEXT        NOT NULL DEFAULT 'ea',
  unit_cost           NUMERIC     NOT NULL DEFAULT 0,
  markup_type         TEXT        NOT NULL DEFAULT 'none'
                                  CHECK (markup_type IN ('percent','fixed','none')),
  markup_value        NUMERIC     NOT NULL DEFAULT 0,
  taxable             BOOLEAN     NOT NULL DEFAULT FALSE,
  optional            BOOLEAN     NOT NULL DEFAULT FALSE,
  included            BOOLEAN     NOT NULL DEFAULT TRUE,
  subtotal            NUMERIC     NOT NULL DEFAULT 0,
  markup_amount       NUMERIC     NOT NULL DEFAULT 0,
  total               NUMERIC     NOT NULL DEFAULT 0,
  source              TEXT        NOT NULL DEFAULT 'manual'
                                  CHECK (source IN ('manual','ai_generated','catalog','document_extract','vendor_quote')),
  source_document_id  TEXT,
  confidence          TEXT        NOT NULL DEFAULT 'high'
                                  CHECK (confidence IN ('high','medium','low','unknown')),
  notes               TEXT        NOT NULL DEFAULT '',
  internal_notes      TEXT        NOT NULL DEFAULT '',
  sort_order          INTEGER     NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS proposal_line_items_proposal_idx ON proposal_line_items (proposal_id, sort_order);
CREATE INDEX IF NOT EXISTS proposal_line_items_user_idx     ON proposal_line_items (user_id);

DROP TRIGGER IF EXISTS proposal_line_items_updated_at ON proposal_line_items;
CREATE TRIGGER proposal_line_items_updated_at
  BEFORE UPDATE ON proposal_line_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE proposal_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own proposal line items"
  ON proposal_line_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ─── opportunities.proposal_id ─────────────────────────────────────────────────
-- Soft link from opportunity to its primary proposal (the one shown in the UI).
-- Not unique — an opportunity may have multiple proposals over time; this points
-- at the "current" one. Listing all proposals for an opportunity uses
-- proposals.opportunity_id, not this column.

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL;
