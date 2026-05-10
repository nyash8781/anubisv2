-- Migration 006: User-defined milestones
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS milestones (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label        TEXT        NOT NULL,
  order_index  INTEGER     NOT NULL DEFAULT 0,
  stale_days   INTEGER     NOT NULL DEFAULT 30,
  color        TEXT        NOT NULL DEFAULT '#0052FF',
  is_terminal  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS milestones_user_id_idx ON milestones (user_id);

-- Updated_at trigger (reuses the function from migration 001 if present)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS milestones_updated_at ON milestones;
CREATE TRIGGER milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Row Level Security
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own milestones"
  ON milestones FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Seed default milestones for existing users ────────────────────────────────
-- Run this manually per-user or handle via the backend on first login.
-- Default pipeline: Lead → Proposal → Construction → Completed
--
-- INSERT INTO milestones (user_id, label, order_index, stale_days, color, is_terminal)
-- VALUES
--   ('<user_id>', 'Lead',         0, 30, '#3B82F6', false),
--   ('<user_id>', 'Proposal',     1, 30, '#F59E0B', false),
--   ('<user_id>', 'Construction', 2, 14, '#F97316', false),
--   ('<user_id>', 'Completed',    3, 0,  '#22C55E', true);
