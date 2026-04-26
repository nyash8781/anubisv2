# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Root (runs both services)
```bash
npm run install:all       # install deps for root + backend + frontend
npm run dev               # start backend (port 5000) + frontend (port 3000) concurrently
```

### Frontend (`frontend/`)
```bash
npm run build --prefix frontend
npm run lint --prefix frontend
npx tsc --noEmit          # type-check (no npm script)
```

### Backend (`backend/`)
```bash
npm run dev --prefix backend    # nodemon server.js
npm run start --prefix backend  # node server.js (production)
```

### Claude automation pipeline (`Claude/`)
```bash
pip install -r Claude/requirements.txt
# Run the 3 slash commands in order inside Claude Code:
/anubis-reviewer      # → Claude/docs/code_review.md
/sow-tracker          # → Claude/docs/scope_of_work.md
/execution-driver     # → Claude/docs/execution_plan.md

# Then drive implementation:
python Claude/executor.py \
  --review Claude/docs/code_review.md \
  --scope  Claude/docs/scope_of_work.md \
  --plan   Claude/docs/execution_plan.md \
  --repo   .
```

## Architecture

Monorepo: `backend/` (Express 5, Node.js CommonJS) + `frontend/` (Next.js, TypeScript). No shared code between them.

### Frontend — `frontend/`

Next.js App Router with two route groups:

| Group | Path | Shell |
|---|---|---|
| `(marketing)` | `/`, `/about`, `/pricing`, `/faq`, `/login`, `/admin-login` | `MarketingShell` |
| `(app)` | `/dashboard`, `/jobs`, `/calendar`, `/outreach`, `/uploads`, `/settings`, `/opportunity/[id]`, `/proposal` | `AppShell` |

`app/(app)/layout.tsx` is the auth guard — it's a client component that calls `useSession()`. When session is `null`, it redirects to `/login`; when `'loading'`, it renders a spinner; only when a real `Session` object is returned does it render `AppShell`.

Key lib files:
- `lib/api.ts` — `apiGet / apiPost / apiPut / apiDelete / apiUpload`. Throws at **module load** if `NEXT_PUBLIC_API_URL` is missing. Attaches `Authorization: Bearer <token>` from the Supabase session on every call. Do not import from server components.
- `lib/auth.ts` — `useSession(): Session | null | 'loading'` and `signOut()`.
- `lib/supabase.ts` — browser Supabase client.
- `lib/server/` — server-only utilities (AI, email, SMS, R2, Stripe, Supabase admin). All files use `import 'server-only'`. Never import from client components.

UI components in `components/ui/` are shadcn/ui primitives (Radix UI + Tailwind). Do not add other component libraries.

### Backend — `backend/`

Single-file Express 5 server (`server.js`). All routes:

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | none | Returns `getServiceStatus()` — which integrations are configured |
| GET | `/health` | none | `{ status: 'ok' }` |
| GET | `/jobs` | none | Returns all jobs, normalized |
| GET | `/jobs/:id` | none | Returns single job |
| POST | `/jobs` | none | Creates job; validates with `jobUpsertSchema` |
| PUT | `/jobs/:id` | none | Updates job; validates with `jobUpsertSchema` |
| DELETE | `/jobs/:id` | none | Deletes job |
| POST | `/jobs/:id/action` | none | Logs an action; validates with `actionSchema` |
| POST | `/generate-job-insights` | none | Calls Claude to generate follow-up/upsell text; validates with `generateInsightsSchema` |

> **Phase 1 gap:** no auth enforcement on backend routes. The backend trusts that the frontend attaches a Supabase Bearer token, but does not verify it yet.

Supporting files:
- `ai-provider.js` — wraps `@anthropic-ai/sdk`. Claude-only (Ollama removed).
- `schemas.js` — Zod schemas for every POST/PUT. The `validate(schema)` middleware is used on all mutating routes.
- `src/config/env.js` — loads `.env` (falls back to `.env.example`). Exports `env`, `getServiceStatus()`, `isServiceConfigured(name)`, and `assertServiceConfigured(name)`. Call `assertServiceConfigured('stripe')` at the top of any route that requires a specific integration — it throws a clear error rather than failing silently mid-request.

### Data model

Phase 1 data store is `backend/data/jobs.json` (flat JSON array, auto-created). `opportunity_id` format: `P<YYMMDD><NNN>` (e.g. `P250424001`).

Key field enums (defined in `schemas.js`, mirrored in the frontend `Job` type):
- `milestone`: `'Lead' | 'Site Visit' | 'Proposal' | 'Construction' | 'Completed'`
- `status`: `'Draft' | 'New' | 'Contacted' | 'Closed'`
- `action.type`: `'call' | 'text' | 'email' | 'manual' | 'completed'`

`migrations/001_opportunities.sql` — target Supabase schema with RLS + triggers, for when Phase 1 migration happens.

### Auth

Supabase magic-link email flow:
1. `POST /auth/v1/otp` with email → sends magic link.
2. Link redirects to `app/auth/callback/` → session stored in browser.
3. `useSession()` reads it; `(app)/layout.tsx` redirects to `/login` if null.
4. `lib/api.ts` attaches the token to every backend request.

Admin password login is at `/admin-login` (separate from magic-link).

### CSS design tokens

Two CTA colors are intentional — do not consolidate them:
- `--primary` (mint/teal) — marketing surfaces, brand highlights
- `--action` (yellow, ≈ `yellow-400`) — contractor workflow CTAs (Save, Generate AI, Mark Completed)

All tokens are HSL variables defined in `frontend/app/globals.css` and mapped in `frontend/tailwind.config.ts`. Use `bg-action` / `bg-primary` in Tailwind classes rather than hardcoded hex.

### Environment variables

Copy `.env.example` files before starting:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

The root `.env.example` is the master reference covering all vars. The per-directory copies are what the app actually loads.

**Required to run at all:** `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

**Optional (Phase 2):** `RESEND_API_KEY`, `TWILIO_*`, `R2_*`, `STRIPE_*`, `NEXT_PUBLIC_POSTHOG_KEY`. The backend `GET /` route reports which integrations are active.

### Claude automation — `Claude/`

Self-contained; can be deleted without affecting the app. Skills in `Claude/skills/*/` are the source prompts that `.claude/commands/*.md` are generated from. Generated docs (`Claude/docs/`) are gitignored.

### Local-only — `local/`

Gitignored. Place local scripts, one-off tools, and machine-specific utilities here (e.g. obsidian-map runners, dev helpers). Nothing in this folder should be committed.

### Obsidian knowledge base — `obsidian/`

Gitignored. Contains architecture maps generated by `obsidian-map.js`. For reference only; not part of the app.

## Key constraints

- **No Ollama.** Backend is Claude-only (`ai-provider.js`).
- **Backend is CommonJS.** Use `require()`, not `import`. `"type"` field is absent from `backend/package.json`.
- **`lib/server/`** files use `import 'server-only'` — never import from client components.
- **`lib/api.ts`** throws at module load without `NEXT_PUBLIC_API_URL` — don't import in server components or SSR paths.
- **`next.config.js` image hostnames** are explicit (`*.supabase.co`, `*.supabase.in`). Do not use wildcards.
- **No test suite.** Use `npx tsc --noEmit` for type errors and `npm run lint` for linting.
- **`localStorage` key** `anubis_global_settings` shape `{ base_prompt, business_context }` — do not rename (breaks saved settings for existing users).
