# Anubis-Alpha — Features Status

**Last updated:** 2026-04-22 (post-merge)

The full version of this doc lives in your AnubisV2 repo at `docs/FEATURES.md` — it covers every open issue and missing feature in detail. This is the Alpha-specific update.

---

## Features by location in the new structure

| Feature | Route | Status | Notes |
|---|---|---|---|
| Marketing landing | `/` | Scaffold — styled | Ready. Copy improvements welcome. |
| About | `/about` | Scaffold — stub copy | Expand as brand voice solidifies. |
| Pricing | `/pricing` | Scaffold — proposed tiers | 3 tiers with proposed feature split. Confirm in Week 3. |
| FAQ | `/faq` | Scaffold — 6 entries | Expand as real questions come in. |
| Login | `/login` | Scaffold — placeholder | Phase 1: Supabase magic link. Dev bypass button works today. |
| Dashboard | `/dashboard` | **Needs migration** | Drop AnubisV2 dashboard code here. See MIGRATION_TODO.md Step 4. |
| Jobs | `/jobs` | Redirects to `/dashboard` | Kanban view in Phase 2. |
| Calendar | `/calendar` | Phase 2 stub | Ships weeks 4–5. |
| Outreach | `/outreach` | Phase 2 stub | Ships week 3. |
| Uploads | `/uploads` | Phase 2 stub | Ships week 4. |
| Settings | `/settings` | **Needs migration** | Was `/input` in AnubisV2. See MIGRATION_TODO.md Step 6. |
| Opportunity detail | `/opportunity/[id]` | **Needs migration** | See MIGRATION_TODO.md Step 5. |

---

## Backend features — unchanged

All preserved from AnubisV2 baseline. See `server.js` + `ai-provider.js` + `schemas.js` + `src/config/env.js`.

| Feature | Endpoint | Status |
|---|---|---|
| List opportunities | `GET /jobs` | Working |
| Get opportunity | `GET /jobs/:id` | Working |
| Create opportunity | `POST /jobs` | Working (zod validated) |
| Update opportunity | `PUT /jobs/:id` | Working (zod validated) |
| Delete opportunity | `DELETE /jobs/:id` | Working |
| Log contact action | `POST /jobs/:id/action` | Working (zod validated) |
| Generate AI insights | `POST /generate-job-insights` | Working (provider-agnostic) |
| Service status | `GET /` | Working |
| Health check | `GET /health` | Working |

---

## P1 issues — all addressed in scaffold

- ✅ P1-01 — AI provider abstracted (Ollama + Claude strategy)
- ✅ P1-02 — Settings key + shape aligned; backend inserts prompt correctly
- ✅ P1-03 — React.Fragment key fix in dashboard (preserved when you paste)
- ⏸ P1-04 — Auth/multi-tenancy deferred to Phase 1 (Supabase week)

## P2 issues

- ✅ P2-02 — Hardcoded localhost URLs replaced by `lib/api.ts`
- ✅ P2-04 — Zod validation on every POST/PUT
- ⏸ P2-01 — JSON file → Postgres in Phase 1
- ⏸ P2-05 — Sentry in Phase 1

---

## Missing features (roadmap)

Unchanged from the AnubisV2 `docs/FEATURES.md` roadmap table:

| ID | Feature | Phase |
|---|---|---|
| F-01 | Proposal PDF generation | Phase 2 (wk 3) |
| F-02 | Homeowner portal (magic link) | Phase 2 (wk 3) |
| F-03 | Change orders with mobile capture | Phase 2 (wk 4) |
| F-04 | Digital signatures | Phase 2 (wk 4) |
| F-05 | Photo upload with timestamp + geotag | Phase 2 (wk 4) |
| F-06 | Stripe payments | Phase 2 (wk 5) |
| F-07 | Real email/SMS sending | Phase 2 (wk 3–5) |
| F-08 | Onboarding wizard | Phase 3 (wk 6–8) |

See `docs/ROADMAP_CHECKLIST.md` (copy from AnubisV2) for the week-by-week plan.
