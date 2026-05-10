-- Migration 010: Team-member access to activities
-- Lets team members read activities for opportunities assigned to them.
-- Idempotent.

-- Drop the old owner-only policy (created in migration 004) so we can replace it.
DROP POLICY IF EXISTS "users manage own activities" ON activities;
DROP POLICY IF EXISTS "Users manage their own activities" ON activities;

-- Owner policy: full access for the activity's user_id (the contractor account)
CREATE POLICY "Owner manages own activities"
  ON activities FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Team-member READ access: a team member can SELECT activities for any
-- opportunity that has been assigned_to them.
-- Requires migration 007 (team_members table + opportunities.assigned_to column).
CREATE POLICY "Team members read assigned activities"
  ON activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM opportunities o
      WHERE o.id = activities.job_id
        AND o.assigned_to = auth.uid()
    )
  );

-- Note: team members do NOT get write access here. The contractor (owner) is
-- still the only writer. If we want team members to log their own actions
-- later (Phase 5), add a separate INSERT policy keyed on team_members.member_user_id.
