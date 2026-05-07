-- 004_activities.sql
-- Persistent activity log for all contact actions on an opportunity.
-- Run in Supabase SQL editor after 001, 002, 003.

CREATE TABLE IF NOT EXISTS activities (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id      BIGINT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (
    action_type IN ('call', 'text', 'email', 'manual', 'completed', 'note', 'payment_requested')
  ),
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activities_job_created_idx ON activities (job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activities_user_created_idx ON activities (user_id, created_at DESC);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own activities" ON activities
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
