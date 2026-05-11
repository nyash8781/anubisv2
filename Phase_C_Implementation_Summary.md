# Phase C Implementation Summary — Services & Enforcement

**Date:** 2026-05-10  
**Scope:** Usage tracking, plan-based entitlements, and contractor visibility into plan/usage

---

## Overview

Phase C implements the complete services and enforcement layer for usage tracking and plan-based access control. Contractors can now see their usage metrics and plan tier, while the backend enforces usage limits based on their assigned plan.

---

## Backend Changes

### 1. Database Migrations (All Created)

#### `015_usage_events.sql`
- Creates `usage_events` table for raw event logging
- Fields: `id`, `organization_id`, `user_id`, `event_type`, `input_tokens`, `output_tokens`, `model`, `metadata`, `created_at`
- Enables cost tracking per org/user/event
- RLS policy ensures users can only see their own org's events

#### `016_usage_monthly_rollups.sql`
- Creates `usage_monthly_rollups` table for pre-aggregated monthly totals
- Fields: `id`, `organization_id`, `year`, `month`, `metric_key`, `total_count`, `limit_value`, `created_at`, `updated_at`
- Enables fast queries for "usage this month" dashboard displays
- Indexed on (organization_id, year, month) for performance

### 2. Service Layer (All Created)

#### `backend/services/planService.js`
**Responsibility:** Resolve effective plan limits with org-level override support

**Key Functions:**
- `getPlanForOrganization(organizationId)` — Returns effective plan with 5-minute cache
  - Resolves org_id → organization_plans → plans records
  - Merges plan defaults + org-level overrides
  - Returns: `{ id, plan_id, name, slug, priceMonthly, priceAnnual, startedAt, overrideLimits, limits: [...] }`
- `getEffectiveLimit(metricKey, plan)` — Checks org override, then plan default
  - Returns `-1` for unlimited, or limit value
  - Pattern: check overrides first, fall back to plan limits

**Data Schema:**
```javascript
{
  id: 'plan_xxx',
  plan_id: 'Trial',
  name: 'Trial',
  slug: 'trial',
  priceMonthly: 0,
  priceAnnual: 0,
  startedAt: '2026-01-15T00:00:00Z',
  overrideLimits: { 'ai_generations': 100 },  // org-level overrides
  limits: [
    { metric_key: 'ai_generations', limit_value: 50 },
    { metric_key: 'emails_sent', limit_value: 100 },
    // ... etc
  ]
}
```

#### `backend/services/entitlementService.js`
**Responsibility:** Check usage limits and return enforcement responses

**Key Functions:**
- `checkUsageLimit(organizationId, metricKey, requestedAmount)` — Validate request against current usage
  - Returns: `{ allowed: true }` or `{ allowed: false, reason, used, limit, planName, upgradeUrl }`
  - Implements fail-open pattern: if lookups fail, return `{ allowed: true }`
  - Checks override, then plan limit, then current usage from usage_monthly_rollups
- `canUseFeature(organizationId, featureKey)` — Check feature gate access
  - Currently returns `{ allowed: true }` for all features on all plans
  - Placeholder for Phase F feature flag system

#### `backend/services/usageService.js`
**Responsibility:** Fire-and-forget usage event logging (never blocks requests)

**Key Functions:**
- `log(organizationId, userId, eventType, metadata)` — Enqueue usage event
  - Async, fire-and-forget, catches all errors
  - Never throws or blocks request handler
  - Fields: org_id, user_id, event_type, input_tokens, output_tokens, model, metadata
- `estimateCost(eventType, metadata)` — Calculate cost for usage aggregation
  - AI: `($0.003 per 1K input tokens) + ($0.015 per 1K output tokens)`
  - Email: $0.0005 per email
  - SMS: $0.0075 per message
  - Storage: $0.023 per GB/month
  - Team: $25 per seat/month

### 3. Route Updates

#### `backend/routes/ai.js` — `/POST /generate-job-insights`
**Changes:**
- Added `organizationId` resolution via `getOrganizationIdForUser(req.user.id)`
- Added usage limit check **before** Claude call:
  ```javascript
  const limitCheck = await entitlementService.checkUsageLimit(
    organizationId, 'ai_generations', 1
  );
  if (!limitCheck.allowed) {
    return res.status(402).json({
      error: 'AI generation limit reached',
      reason: limitCheck.reason,
      used: limitCheck.used,
      limit: limitCheck.limit,
      plan: limitCheck.planName,
      upgradeUrl: limitCheck.upgradeUrl,
    });
  }
  ```
- Changed AI provider call to `generateWithUsage()` which returns token counts
- Added fire-and-forget usage logging:
  ```javascript
  if (organizationId) {
    usageService.log(organizationId, req.user.id, 'ai_generation', {
      input_tokens: aiResult.inputTokens,
      output_tokens: aiResult.outputTokens,
      model: aiResult.model,
      feature_key: 'job_insights',
    });
  }
  ```

#### `backend/routes/settings.js` — `GET /settings/usage`
**New Endpoint:**
- Purpose: Return contractor's plan tier, renewal date, and usage metrics for dashboard
- Auth: `requireAuth`
- Response Schema:
  ```javascript
  {
    plan: {
      name: 'Trial',
      slug: 'trial',
      priceMonthly: 0,
      startedAt: '2026-01-15T00:00:00Z'
    } | null,
    usage: [
      {
        metricKey: 'ai_generations',
        used: 5,
        limit: 50,
        percentage: 10
      },
      // ... one object per metric
    ],
    renewalDate: '2026-02-15T00:00:00Z' | null
  }
  ```

#### `backend/ai-provider.js`
**Changes:**
- Updated `generateWithUsage()` to return token counts from Claude API response
- Return schema:
  ```javascript
  {
    text: string,
    inputTokens: number,
    outputTokens: number,
    model: string
  }
  ```
- Kept legacy `generate()` function for backward compatibility

#### `backend/middleware/requireAdmin.js` (Created in Phase B)
- Validates admin access via `is_admin` JWT claim or `ADMIN_USER_IDS` env var
- Returns 403 if user is not admin

---

## Frontend Changes

### 1. Type Definitions

#### `frontend/types/proposal.ts`
- **Removed:** `BusinessProfile` interface from proposal types
- **Rationale:** Business info now lives in top-level user_settings, not in proposal_settings

#### `frontend/lib/services/proposalSettingsService.ts`
- **Removed:** `businessProfile` field from `DEFAULT_PROPOSAL_SETTINGS`
- **Removed:** `businessProfile` from `mergeProposalSettings()` function
- **Impact:** All proposal-related business info now comes from settings context

### 2. Settings Page Enhancements

#### `frontend/app/(app)/settings/page.tsx`
**New Tabs Added:**
1. **Integrations Tab** (`activeTab === 'integrations'`)
   - Displays integration status badges for 4 services:
     - Resend (Email delivery)
     - Stripe (Payments & invoicing)
     - Twilio (SMS & voice calls)
     - Cloudflare R2 (Document storage)
   - Each badge shows "Connected" or "Not configured"
   - Data sourced from `GET /` endpoint status object
   - Read-only UI (no form controls, not included in save bar)

2. **Usage & Plan Tab** (`activeTab === 'usage-plan'`)
   - Displays plan overview card (if plan exists):
     - Plan name, monthly price, renewal date
     - "Upgrade Plan" CTA button
   - Usage metrics section:
     - One row per metric (ai_generations, emails_sent, sms_sent, storage_gb, team_members)
     - Displays: metric name, used/limit, percentage bar
     - Color coding:
       - Green/Primary: 0-79%
       - Amber/Warning: 80-89%
       - Red/Critical: 90%+
     - Shows warning badges at 80%+ usage
   - Data sourced from `GET /settings/usage` endpoint
   - Read-only UI (not included in save bar)

**Other Changes:**
- Updated sticky save bar to hide for read-only tabs: `['milestones', 'team', 'integrations', 'usage-plan']`
- Added `loadIntegrations()` callback to fetch integration status from `GET /`
- Added `loadUsage()` callback to fetch usage data from `GET /settings/usage`
- Added useEffect hooks to trigger loads when tabs become active (lazy load pattern)

### 3. Admin Interface (Moved Route Structure)

#### `frontend/app/(admin)/` → `frontend/app/(admin)/admin/`
**Reason:** Fixed Next.js App Router conflict — both `(marketing)/` and `(admin)/` had root `page.tsx`

**File Moves:**
- `(admin)/page.tsx` → `(admin)/admin/page.tsx` (Overview)
- `(admin)/companies/page.tsx` → `(admin)/admin/companies/page.tsx` (Company list)
- `(admin)/companies/[id]/page.tsx` → `(admin)/admin/companies/[id]/page.tsx` (Company detail)

**Result:**
- Routes now accessible at `/admin`, `/admin/companies`, `/admin/companies/[id]`
- Admin layout links already point to `/admin` routes (no changes needed)

#### `frontend/app/(admin)/layout.tsx`
- Fixed import: `useAuth` now imported from `@/lib/auth-context` (not `@/lib/auth`)

### 4. Bug Fixes

#### `frontend/components/proposal/ProposalPreviewModal.tsx`
- Removed dependency on `proposalSettings.businessProfile` (no longer exists)
- Created empty mock business profile object to prevent errors:
  ```javascript
  const bp = {
    logoUrl: '',
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    website: '',
    businessAddress: '',
    licenseNumber: '',
  }
  ```
- **TODO:** Future: Pass business info from parent component via props when available

---

## Data Integrity & Safety

### Usage Logging
- **Fire-and-forget pattern:** `usageService.log()` never blocks request handlers
- **Error handling:** All errors caught and logged, never thrown
- **Asynchronous:** Events queued for eventual processing

### Entitlements
- **Fail-open:** If service/database lookup fails, allow request to proceed (safety > enforcement)
- **Caching:** Plan lookups cached for 5 minutes to reduce database load
- **HTTP 402:** Usage limit violations return 402 Payment Required with upgrade messaging

### Admin Authorization
- **Validated server-side:** `requireAdmin` middleware checks JWT claims + env var backup
- **No client-side checks:** Frontend cannot grant/revoke admin privileges

---

## Testing & Verification

### What Works ✅
- **Integrations tab:** Displays status badges for all 4 integrations
- **Usage & Plan tab:** Shows plan info and usage metrics with percentage bars
- **Backend services:** Plan resolution, entitlement checks, usage logging all operational
- **AI endpoint:** Limits enforced before Claude call, returns 402 if exceeded
- **Settings endpoint:** Returns plan + usage data for contractor dashboard
- **Admin interface:** Routes functional at `/admin/companies`, `/admin/companies/[id]`

### Known Limitations
- **Plan card:** May not display if user's plan is not set up in database
- **Hardcoded business profile:** Proposal preview shows empty business info (pending integration)
- **Admin access:** Not yet wired to frontend approval flow (Phase D)

---

## Future Phases

**Phase D: Soft Warnings & UX**
- Warning modal when usage exceeds 80%
- AI generation counter in dashboard
- Feature gate evaluation per contractor

**Phase E: Specialized Routes**
- Usage enforcement on email/SMS endpoints
- Storage limit checks on uploads
- Team member seat enforcement

**Phase F: Feature Flags & Admin Controls**
- Admin company override form (plan, limits, features)
- Feature flag system (organization_feature_overrides table)
- Impersonation capability for support

---

## Files Summary

### Created
- `backend/services/planService.js`
- `backend/services/entitlementService.js`
- `backend/services/usageService.js`
- `backend/migrations/015_usage_events.sql`
- `backend/migrations/016_usage_monthly_rollups.sql`

### Modified
- `backend/routes/ai.js` — Added limit checking + usage logging
- `backend/routes/settings.js` — Added GET /settings/usage endpoint
- `backend/ai-provider.js` — Export token counts from generateWithUsage()
- `frontend/app/(app)/settings/page.tsx` — Added Integrations + Usage & Plan tabs
- `frontend/app/(admin)/layout.tsx` — Fixed useAuth import
- `frontend/app/(admin)/admin/page.tsx` — Moved from (admin)/page.tsx
- `frontend/app/(admin)/admin/companies/page.tsx` — Moved from companies/page.tsx
- `frontend/app/(admin)/admin/companies/[id]/page.tsx` — Moved from companies/[id]/page.tsx
- `frontend/components/proposal/ProposalPreviewModal.tsx` — Removed businessProfile dependency
- `frontend/lib/services/proposalSettingsService.ts` — Removed businessProfile field
- `frontend/types/proposal.ts` — Removed BusinessProfile interface

### Deleted
- `frontend/app/(admin)/page.tsx` (moved)
- `frontend/app/(admin)/companies/` directory (moved)

---

## Next Steps

1. **Phase D:** Implement soft warnings at 80% usage threshold
2. **Phase E:** Wire limit enforcement to email/SMS/storage routes
3. **Phase F:** Add admin override controls and feature flag system
4. **Integration:** Connect business profile info to proposal preview modal
