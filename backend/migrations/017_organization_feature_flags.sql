-- Migration: Create organization feature overrides and admin users tables
-- Date: 2026-05-10
-- Purpose: Enable admin controls for feature flags and limit overrides

-- Create admin_users table to track which users can make admin changes
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create organization_feature_overrides table for per-org feature flags
CREATE TABLE IF NOT EXISTS organization_feature_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature_key VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  reason TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, feature_key)
);

-- Create index for efficient lookups by org + feature
CREATE INDEX IF NOT EXISTS idx_org_feature_overrides_org_feature
  ON organization_feature_overrides(organization_id, feature_key);

-- Create index for expiry cleanup queries
CREATE INDEX IF NOT EXISTS idx_org_feature_overrides_expires
  ON organization_feature_overrides(expires_at) WHERE expires_at IS NOT NULL;

-- Extend organization_plans table with admin override columns
ALTER TABLE organization_plans
ADD COLUMN IF NOT EXISTS override_limits JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS overridden_by_admin_id UUID,
ADD COLUMN IF NOT EXISTS overridden_at TIMESTAMPTZ;

-- Create index for fast lookups of org overrides
CREATE INDEX IF NOT EXISTS idx_org_plans_override_limits
  ON organization_plans(organization_id) WHERE override_limits IS NOT NULL;

-- Enable RLS on admin_users table (only admins can view/modify)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_users_admin_only ON admin_users
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Enable RLS on organization_feature_overrides table
ALTER TABLE organization_feature_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_feature_overrides_admin_only ON organization_feature_overrides
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM admin_users));
