-- Composite indexes for common query patterns + uniqueness constraint.
-- Run in Supabase SQL Editor after 001 and 002 have been applied.

-- Speed up filtered list queries (jobs by milestone, jobs by status).
CREATE INDEX IF NOT EXISTS opportunities_user_milestone
  ON opportunities (user_id, milestone);

CREATE INDEX IF NOT EXISTS opportunities_user_status
  ON opportunities (user_id, status);

-- Prevent duplicate opportunity IDs per user.
ALTER TABLE opportunities
  ADD CONSTRAINT IF NOT EXISTS opportunities_user_opp_id_unique
  UNIQUE (user_id, opportunity_id);
