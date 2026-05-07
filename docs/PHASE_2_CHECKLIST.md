# Phase 2 & 3 Roadmap Checklist

> Generated 2026-04-28. Anchored to Enterprise Code Review Council Report (`ENTERPRISE_COUNCIL_REPORT.md`).
> Phase 2 prerequisite: Phase 1 Definition of Done fully met — Supabase live, 5-minute test passes, Sentry active.

---

## Phase 2 — Stable Product (Est. 4–6 weeks after Phase 1 DoD)

### 2A — Data Layer Completion (Week 1)

- [ ] Delete `backend/db/jsonStore.js` — after Supabase confirmed live
- [ ] Rewrite `getStats()` with SQL `GROUP BY + SUM` instead of fetching all rows in Node
- [ ] Execute `004_ai_usage.sql` — `user_ai_usage` table for per-user AI consumption tracking
- [ ] Migrate `opportunity_events` schema (`005_events.sql`)
- [ ] Build real multi-entry Activity Timeline from events table
- [ ] Wire NBA engine to dashboard (daily habit loop)

### 2B — Code Cleanup (Week 1–2)

- [ ] Extract `TabBar` → `components/opportunity/TabBar.tsx`, remove inline duplicates
- [ ] Replace emoji strings in `CollapsibleSection` with Lucide `icon` prop (React.ComponentType)
- [ ] Extract `Settings` type → `frontend/types/settings.ts`
- [ ] Add `role="status"` + `aria-live="polite"` to Toast on opportunity page
- [ ] Add login page OTP resend cooldown (60s)
- [ ] Make `STALE_DAYS` configurable via settings instead of hardcoded 14
- [ ] Consolidate `address_1`/`address` and `mobile_number_1`/`phone` field aliases
- [ ] Deprecate `contact_status` field

### 2C — Communication Integrations (Week 2–3)

- [ ] Wire Resend email — one-click send of AI-generated follow-up from AIAssistantHub
- [ ] Wire Twilio SMS — one-click send of generated SMS/call script
- [ ] Add email/SMS send status to Activity Timeline events
- [ ] Restore Email & SMS settings section with real field validation

### 2D — Document Uploads (Week 3–4)

- [ ] Wire Cloudflare R2 upload (`lib/server/` R2 stub exists) — contracts, BOMs, photos, submittals
- [ ] Replace "Coming in Phase 2" DocumentsSection with real upload grid
- [ ] Add `006_documents.sql` — `opportunity_documents` table scoped by `user_id`
- [ ] File type validation + size limit on backend

### 2E — Payment Milestone Loop (Week 3–4)

> The council called this the one feature that defines enterprise:
> *"The first time a contractor gets paid faster because Anubis reminded them a payment was due and generated the collection email in one click, they will tell every contractor they know."*

- [ ] Wire Stripe (`STRIPE_*` already in `.env.example`) — payment link generation
- [ ] Build `/payments/request` backend route — generates Stripe payment link, emails client
- [ ] Wire "Request Payment" button (currently shows info toast) to real Stripe route
- [ ] Surface overdue payment alerts prominently on dashboard Today's Focus
- [ ] Add payment received webhook handler from Stripe — auto-updates `payments_received`
- [ ] Persist `tasks` array to `opportunities.extra` JSONB

### 2F — Settings Restoration (Week 4)

- [ ] **Proposals & Financials** — proposal generation route + PDF template
- [ ] **Milestones** — `MILESTONE_ORDER` configurable per user, stored in `user_settings.extra`
- [ ] **Integrations** — Twilio/Resend/Stripe live connection test + toggle
- [ ] **Notifications & Automation** — scheduled follow-up reminders (cron or Supabase Edge Functions)
- [ ] **Display & UI** — theme/density prefs (restore last)

---

## Phase 3 — Platform (Est. 6–10 weeks after Phase 2)

### 3A — Backend Hardening

- [ ] TypeScript conversion of backend (CommonJS works now; TS needed at team scale)
- [ ] Add `react-hook-form` to opportunity page
- [ ] `getDb()` multi-tenant isolation audit — RLS policies, service role usage review
- [ ] Add integration test suite hitting real Supabase

### 3B — Homeowner Portal

- [ ] Public-facing route `/portal/[token]` — read-only job status for homeowners
- [ ] Proposal page (`/proposal` stub exists) — generate + send PDF proposals
- [ ] Change order workflow on existing jobs
- [ ] Homeowner payment page via Stripe

### 3C — Calendar & Outreach (Stub Pages)

- [ ] `/calendar` — site visit and follow-up scheduling
- [ ] `/outreach` — bulk follow-up campaigns for stale leads

### 3D — Revenue Expansion Engine

- [ ] Cross-sell/upsell detection from scope-of-work patterns (AI embeddings)
- [ ] Seasonal opportunity scoring
- [ ] Referral tracking
- [ ] Revenue forecast on dashboard

### 3E — Notifications & Automation

- [ ] Supabase Edge Function or cron: daily stale-lead digest
- [ ] Payment overdue auto-reminder sequence (Stripe webhook → Resend/Twilio)
- [ ] Follow-up cadence enforcement (`follow_up_cadence` field exists in schema, not wired)

---

## Summary

| Phase | Focus | Blocker |
|---|---|---|
| **Phase 1** | Foundation — stable data, security, core UX | Supabase migrations + SERVICE_ROLE_KEY |
| **Phase 2** | Stable product — events, comms, docs, payments | Phase 1 DoD + 5-minute test pass |
| **Phase 3** | Platform — portal, TypeScript, expansion engine | Phase 2 payment loop working in prod |
