-- 005_activities_expand.sql
-- Expands the activities table created in 004.
-- Run in Supabase SQL editor after 001, 002, 003, 004.

-- Drop the narrow check constraint from 004.
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_action_type_check;

-- Re-add with the full Phase 2 event type set.
ALTER TABLE activities ADD CONSTRAINT activities_action_type_check CHECK (
  action_type IN (
    'call', 'text', 'email', 'manual', 'completed', 'note',
    'payment_requested', 'payment_status_changed',
    'status_changed', 'milestone_changed',
    'production_update', 'production_blocked', 'production_unblocked',
    'proposal_created', 'proposal_modified',
    'job_created', 'job_modified', 'system'
  )
);

-- Add human-readable columns for the event stream UI.
ALTER TABLE activities ADD COLUMN IF NOT EXISTS project_name TEXT NOT NULL DEFAULT '';
ALTER TABLE activities ADD COLUMN IF NOT EXISTS action      TEXT NOT NULL DEFAULT '';
ALTER TABLE activities ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
