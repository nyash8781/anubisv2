# Schema Comparison: Current vs. Migrations

## Current Database State (Supabase)

**Existing Tables:**
- job_files
- jobs
- opportunities
- profiles
- user_settings

**Status:** Phase 0 baseline only

---

## COMPLETE_MIGRATIONS.sql Tables to Create

### Phase C (Already built in code, not in DB yet):
- activities
- team_members
- proposals
- payments
- organizations
- plans
- organization_plans
- plan_limits
- usage_events
- usage_monthly_rollups

### Phase F (New):
- organization_feature_overrides
- admin_users

---

## Conflict Analysis

### ⚠️ COLUMN CONFLICTS

**Table: opportunities**
- Current: `id bigserial`, `user_id uuid`
- Migration: `id bigserial`, `user_id uuid`
- **Status:** ✅ Compatible
- **Action:** Migration uses `IF NOT EXISTS` so it won't duplicate

**Table: user_settings**
- Current: `user_id uuid`, `base_prompt text`, `business_context text`, `extra jsonb`
- Migration: Same structure
- **Status:** ✅ Compatible
- **Action:** Migration uses `IF NOT EXISTS`

### ✅ NO CONFLICTS DETECTED

Your current tables and the migration file are compatible. The migration file will:
1. Keep existing tables (opportunities, user_settings, job_files, jobs, profiles)
2. Add missing tables (activities, team_members, proposals, etc.)
3. Extend existing tables with new columns if needed
4. Create all necessary indexes, triggers, and RLS policies

---

## Next Steps

1. **Backup current database** (optional but recommended)
2. **Run COMPLETE_MIGRATIONS.sql** in Supabase SQL Editor
3. **Verify** all 17 migrations executed successfully

No data loss will occur. All changes are additive.
