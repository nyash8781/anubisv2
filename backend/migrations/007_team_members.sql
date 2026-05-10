-- Migration 007: Team members + assigned_to on opportunities
-- Run in Supabase SQL editor.

-- ── Team members ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id   UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  invite_email    TEXT        NOT NULL,
  role            TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  invited_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS team_members_admin_idx  ON team_members (admin_user_id);
CREATE INDEX IF NOT EXISTS team_members_member_idx ON team_members (member_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS team_members_invite_unique ON team_members (admin_user_id, invite_email);

DROP TRIGGER IF EXISTS team_members_updated_at ON team_members;
CREATE TRIGGER team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Admin sees all their team rows; member sees their own row
CREATE POLICY "Admin manages their team"
  ON team_members FOR ALL
  USING (auth.uid() = admin_user_id)
  WITH CHECK (auth.uid() = admin_user_id);

CREATE POLICY "Member reads own record"
  ON team_members FOR SELECT
  USING (auth.uid() = member_user_id);

-- ── assigned_to on opportunities ───────────────────────────────────────────────
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS opportunities_assigned_to_idx ON opportunities (assigned_to);

-- ── Updated RLS on opportunities to allow team member read access ──────────────
-- Members of an admin's team can read jobs assigned to them or all jobs (admin controls).
-- The simple policy: member can SELECT rows where assigned_to = auth.uid()
-- or where user_id is the admin they belong to and admin allows full access.

-- Drop existing policy if named 'Users own their jobs' (from migration 001)
-- Then recreate with team access.
DROP POLICY IF EXISTS "Users own their jobs" ON opportunities;

-- Admin always has full access
CREATE POLICY "Owner full access"
  ON opportunities FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Team member: read-only on assigned opportunities
CREATE POLICY "Team member reads assigned"
  ON opportunities FOR SELECT
  USING (
    auth.uid() = assigned_to
    OR EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.admin_user_id = opportunities.user_id
        AND tm.member_user_id = auth.uid()
        AND tm.status = 'active'
    )
  );
