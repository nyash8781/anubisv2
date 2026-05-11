# Phases D, E, F Implementation Summary — Usage Enforcement & Admin Controls

**Date:** 2026-05-10  
**Scope:** Soft warnings for approaching limits (Phase D), usage enforcement on additional routes (Phase E), and admin controls for limit overrides and feature flags (Phase F) 

---

## Overview

Phases D, E, and F extend the Phase C infrastructure to provide contractors with:
- **Phase D:** Soft warnings when approaching usage limits (80%+) with upgrade modals and dashboard usage counters
- **Phase E:** Usage enforcement on email, SMS, and team member routes with HTTP 402 responses when limits exceeded
- **Phase F:** Admin controls for limit overrides, feature flags, and impersonation (deferred for database setup)

---

## Phase D: Soft Warnings & Upgrade Modals

### Completed Implementation

#### D.1 UpgradeModal Component

**File:** `frontend/components/settings/UpgradeModal.tsx`

- **Features:**
  - Dialog-based modal using Radix UI primitives
  - Displays current plan tier with pricing
  - Shows available upgrade plans (Trial, Starter, Growth, Enterprise)
  - Displays usage bars for metrics that exceeded 80%
  - "Upgrade Now" button links to pricing page
  - "Maybe Later" button dismisses modal
  - Color-coded plan cards (current plan highlighted)

- **Props:**
  ```typescript
  type UpgradeModalProps = {
    open: boolean
    onClose: () => void
    currentPlan: { name: string; slug: string } | null
    usage: Array<{ metricKey: string; used: number; limit: number; percentage: number }>
    limitedMetrics: string[]
  }
  ```

#### D.2 Settings Page Integration

**File:** `frontend/app/(app)/settings/page.tsx` (modified)

- **Changes:**
  - Imported `UpgradeModal` component
  - Added state: `showUpgradeModal` and `limitedMetrics`
  - Modified `loadUsage()` callback to detect metrics >= 80%
    - Filters usage data to find metrics exceeding 80%
    - Sets `limitedMetrics` with exceeding metric keys
    - Automatically opens modal when any metric >= 80%
  - Renders `<UpgradeModal>` component with usage data
  - Modal displays below usage metrics section on usage-plan tab

- **User Flow:**
  1. User loads settings → usage tab
  2. Usage data fetched via GET /settings/usage
  3. If any metric >= 80%, modal auto-opens
  4. User sees current plan and upgrade options
  5. Click "Upgrade Now" navigates to pricing
  6. Click "Maybe Later" dismisses (doesn't re-open until page reload)

#### D.3 Dashboard Usage Counter

**File:** `frontend/app/(app)/dashboard/page.tsx` (modified)

- **Changes:**
  - Imported `TrendingUp` icon and added `UsageData` type
  - Added `usageData` and `usageLoading` state
  - Added `loadUsage()` callback to fetch `/settings/usage`
  - Added `useEffect` to fetch usage on component mount
  - Renders usage counter card in Pipeline section
    - Shows "AI Calls This Month: X / Y"
    - Links to settings usage-plan tab
    - Displays loading skeleton during fetch
    - Only shows if usage data available

- **Card Design:**
  - Placed after 4 main pipeline stat cards
  - Flexbox layout with icon + metric + "View Usage" link
  - Hover state with primary color tint
  - Gracefully hidden if usage fetch fails

---

## Phase E: Usage Enforcement on Additional Routes

### Backend Modifications

#### E.1 POST /outreach/generate — AI Generation Limit

**File:** `backend/routes/outreach.js` (modified)

- **Changes:**
  - Imported `supabaseServiceClient`, `usageService`, `entitlementService`
  - Added `getOrganizationIdForUser()` helper function
  - Added AI generation limit check before Claude call
    - Returns 402 if limit exceeded with upgrade info
  - Preserves graceful fail-open: if org lookup fails, proceeds with AI call

- **Request Flow:**
  1. Resolve organization ID from user_id
  2. Check AI generation limit via entitlementService
  3. Return 402 if exceeded (before AI API call)
  4. Otherwise proceed with generation

#### E.2 POST /outreach/send — Email/SMS Limits

**File:** `backend/routes/outreach.js` (modified)

- **Changes:**
  - Added email/SMS count from message array
  - Check email limit if channel === 'email'
    - Returns 402 if email limit exceeded
  - Check SMS limit if channel === 'sms'
    - Returns 402 if SMS limit exceeded
  - After successful send (either channel), log usage:
    - `usageService.log()` with template='outreach_personalized'
    - Counts 1 per message (already validated by limit checks)

- **Limit Enforcement:**
  - All messages checked before ANY sends occur
  - If limit exceeded, return 402 immediately (no partial sends)
  - On success, usage logged for each message type

#### E.3 POST /proposals/:id/send — Email Limit

**File:** `backend/routes/proposals.js` (modified)

- **Changes:**
  - Imported `supabaseServiceClient`, `usageService`, `entitlementService`
  - Added `getOrganizationIdForUser()` helper function
  - Added email limit check at route start
    - Returns 402 before any proposal state changes if limit exceeded
  - After successful Resend email send, logs usage:
    - `usageService.log()` with template='proposal_share'
    - Logs proposal_id for tracking

- **Enforcement Order:**
  1. Check email limit first
  2. Return 402 if exceeded
  3. Mark proposal as sent
  4. Create share link
  5. Send email via Resend
  6. Log usage (fire-and-forget)

#### E.4 POST /team/invite — Seat & Email Limits

**File:** `backend/routes/team.js` (modified)

- **Changes:**
  - Imported `supabaseServiceClient`, `usageService`, `entitlementService`
  - Added `getOrganizationIdForUser()` helper function
  - Added two limit checks at route start:
    - Check `team_members` seat limit
    - Check `emails_sent` limit for invite email
  - Returns 402 if either limit exceeded (before invite row created)
  - After successful email send:
    - Log `email_sent` event
    - Log `team_member_invited` event (counts toward seat usage)
  - Even if Resend not configured, still log `team_member_invited`

- **Enforcement Order:**
  1. Check seat limit
  2. Check email limit
  3. Return 402 if either exceeded
  4. Create invite row
  5. Send email (if configured)
  6. Log both events (fire-and-forget)

### Frontend Modifications

#### E.5 API Error Handling for 402 Responses

**File:** `frontend/lib/api.ts` (modified)

- **Changes:**
  - Modified `handleResponse()` to detect 402 status
  - On 402, throw Error with attached properties:
    - `err.status = 402`
    - `err.reason` — reason limit exceeded
    - `err.used` — current usage count
    - `err.limit` — plan limit
    - `err.plan` — plan name
    - `err.upgradeUrl` — link to upgrade flow
  - Non-402 errors handled as before

- **Usage Pattern in Components:**
  ```typescript
  try {
    await apiPost('/outreach/send', payload)
  } catch (err: any) {
    if (err.status === 402) {
      // Show upgrade modal with limit info
      setShowUpgradeModal(true)
      setLimitedMetric(err.reason)
    } else {
      toast.error(err.message)
    }
  }
  ```

---

## Phase F: Admin Controls & Feature Flags (Deferred)

**Status:** Design complete, implementation deferred pending database schema setup

### F.1 Feature Flag Service (Planned)

**File:** `backend/services/featureFlagService.js` (not yet created)

- **Planned Functions:**
  - `isFeatureEnabled(organizationId, featureKey)` — checks org override, then global flag
  - Org-level overrides stored in `organization_feature_overrides` table
  - Global flags stored in `feature_flags` table
  - Supports expiry dates for time-bound overrides

### F.2 Admin Override Endpoints (Planned)

**File:** `backend/routes/admin.js` (extension pending)

- **Planned Endpoints:**
  - `PUT /admin/companies/:id/limits` — update org limit overrides
  - `PUT /admin/companies/:id/features` — toggle features per org
  - `POST /admin/impersonate/:userId` — start support impersonation
  - All actions audit-logged via usageService

### F.3 Admin UI Components (Planned)

**File:** `frontend/app/(admin)/admin/companies/[id]/page.tsx` (extension pending)

- **Planned Sections:**
  - **Limit Overrides** — input fields for each metric, save button
  - **Feature Flags** — toggles with enable/disable state, expiry picker
  - **Impersonation** — button + warning modal + session badge

---

## Testing & Verification

### Phase D Tests
- ✅ UpgradeModal appears on settings/usage tab when metric >= 80%
- ✅ Modal shows correct current plan and upgrade options
- ✅ "Upgrade Now" button navigates to pricing page
- ✅ Dashboard shows AI usage counter card with correct values
- ✅ Dashboard counter links to settings usage-plan tab

### Phase E Backend Tests
- ✅ POST /outreach/generate returns 402 when AI limit exceeded
- ✅ POST /outreach/send returns 402 when email/SMS limit exceeded
- ✅ POST /proposals/:id/send returns 402 when email limit exceeded
- ✅ POST /team/invite returns 402 when seat or email limit exceeded
- ✅ Usage logged correctly for each message type
- ✅ 402 response includes reason, used, limit, plan, upgradeUrl

### Phase E Frontend Tests
- ✅ 402 errors thrown with attached properties
- ✅ Components can catch 402 and extract limit info
- ⏳ Upgrade modal integration in outreach/proposals/team (optional Phase 2)

### Phase F Tests (Deferred)
- ⏳ Admin can view org limit overrides
- ⏳ Admin can create/update limit override
- ⏳ Overridden limits respected by entitlementService
- ⏳ Admin can toggle features per org
- ⏳ Feature flags checked in route guards

---

## Files Modified Summary

### Created
- `frontend/components/settings/UpgradeModal.tsx`

### Modified
- `frontend/app/(app)/settings/page.tsx` — added upgrade modal state + integration
- `frontend/app/(app)/dashboard/page.tsx` — added usage counter card
- `frontend/lib/api.ts` — added 402 error handling
- `backend/routes/outreach.js` — added AI limit check + email/SMS limit checks + usage logging
- `backend/routes/proposals.js` — added email limit check + usage logging
- `backend/routes/team.js` — added seat + email limit checks + usage logging

### Planned (Phase F)
- `backend/services/featureFlagService.js`
- `backend/migrations/017_organization_feature_flags.sql`
- `backend/routes/admin.js` (extension)
- `frontend/app/(admin)/admin/companies/[id]/page.tsx` (extension)

---

## Key Design Patterns

### Usage Enforcement Pattern
1. **Fail-Open on Lookup:** If org ID resolution fails, allow request (safety > enforcement)
2. **Early Return on 402:** Check limit before any state changes or API calls
3. **Fire-and-Forget Logging:** Usage logging never blocks request (async, errors caught)
4. **Graceful Degradation:** Email sending non-critical; proposal created even if email fails

### Error Communication Pattern
- HTTP 402 Payment Required (standard for billing limits)
- Response includes: `reason`, `used`, `limit`, `planName`, `upgradeUrl`
- Frontend error object has attached properties for easy access
- Components can show context-aware upgrade modals with specific metric info

### Modal/Dialog Pattern
- Dialog component from Radix UI (same as SendModal pattern)
- Parent-controlled state (`open`, `onClose`)
- Auto-opens when thresholds exceeded
- Allows dismiss but doesn't prevent re-showing on next page reload

---

## Future Phases

**Phase F:** Admin Controls
- Implement feature flag service with expiry support
- Add admin override endpoints and audit logging
- Build admin UI for limit overrides and feature toggles
- Add impersonation capability for support staff

**Phase G:** Advanced Features
- Time-based limit resets (not just monthly)
- Burst limits for email/SMS (max per hour, not just total)
- Usage notifications (email at 70%, 85%, 95%)
- Cost estimation and billing integration

---

## Next Steps

1. **Database Setup (Phase F):** Create `organization_feature_overrides` and extend `organization_plans` table
2. **Feature Flag Service (Phase F):** Implement featureFlagService with org + global lookups
3. **Admin UI (Phase F):** Build limit override and feature toggle sections in company detail
4. **Integration Testing:** Verify 402 responses flow correctly end-to-end in frontend routes
5. **Analytics:** Track upgrade modal impressions and upgrade conversions

