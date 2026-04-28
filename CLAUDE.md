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
| `(app)` | `/dashboard`, `/jobs`, `/settings`, `/opportunity/[id]` | `AppShell` |

> `/calendar`, `/outreach`, `/uploads`, `/proposal` pages exist as files but are **not linked in the nav** — they are placeholder stubs for Phase 2.

`app/(app)/layout.tsx` is the auth guard — it's a client component that calls `useAuth()`. When session is `null`, it redirects to `/login`; when `'loading'`, it renders a spinner; only when a real `Session` object is returned does it render `AppShell`.

Key lib files:
- `lib/api.ts` — `apiGet / apiPost / apiPut / apiDelete / apiUpload`. Throws at **module load** if `NEXT_PUBLIC_API_URL` is missing. Attaches `Authorization: Bearer <token>` from the Supabase session on every call. Do not import from server components.
- `lib/auth.ts` — `useSession(): Session | null | 'loading'` and `signOut()`.
- `lib/supabase.ts` — browser Supabase client. Throws on missing env vars in non-test environments.
- `lib/auth-context.tsx` — `AuthProvider` (single Supabase subscription, provides `session`, `user`, `signOut`). Wrap the app with `<AuthProvider>` in `app/layout.tsx`. Use `useAuth()` inside any client component that needs session state.
- `lib/server/` — server-only utilities (AI, email, SMS, R2, Stripe, Supabase admin). All files use `import 'server-only'`. Never import from client components.

UI components in `components/ui/` are shadcn/ui primitives (Radix UI + Tailwind). Do not add other component libraries.

Opportunity sub-components live in `components/opportunity/`:
- `AIAssistantHub.tsx` — email/SMS output panels + Generate button
- `InstallmentTracker.tsx` — payment installment breakdown
- `ActivityTimeline.tsx` — contact and creation events
- `DocumentsSection.tsx` — document status grid (static placeholder)
- `utils.ts` — `fmtMoney`, `fmtDate` helpers shared by the above

`middleware.ts` — passes all requests through. Auth is enforced client-side by `(app)/layout.tsx` via `useAuth()`. The Supabase browser client stores sessions in **localStorage** (not cookies), so a cookie-based edge check would always redirect to `/login`. Full JWT validation happens on the backend per request.

`app/auth/callback/page.tsx` — handles the Supabase PKCE magic-link callback. Reads `?code=` from the URL, calls `supabase.auth.exchangeCodeForSession(code)`, then redirects to `/dashboard`. Falls back to `getSession()` for implicit-flow tokens.

### Backend — `backend/`

Modular Express 5 server. `server.js` is the thin entry point; all logic is in subdirectories:

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | none | Returns `getServiceStatus()` |
| GET | `/health` | none | `{ status: 'ok' }` |
| GET | `/jobs` | **requireAuth** | Returns all jobs for the authenticated user, normalized |
| GET | `/jobs/:id` | **requireAuth** | Returns single job (user-scoped) |
| POST | `/jobs` | requireAuth | Creates job; validates with `jobUpsertSchema` |
| PUT | `/jobs/:id` | requireAuth | Updates job; validates with `jobUpsertSchema` |
| DELETE | `/jobs/:id` | requireAuth | Deletes job |
| POST | `/jobs/:id/action` | requireAuth | Logs a contact action; validates with `actionSchema` |
| POST | `/generate-job-insights` | requireAuth + rate-limit | Calls Claude; 10 req/min/IP |
| GET | `/stats` | requireAuth | Aggregated stats (total, open, closed, revenue, byMilestone) |
| GET | `/settings` | requireAuth | Returns user's saved AI settings |
| PUT | `/settings` | requireAuth | Upserts user's AI settings |

> **Auth dev mode:** If `SUPABASE_URL` / `SUPABASE_ANON_KEY` are not set, `requireAuth` attaches `{ id: 'dev-user-no-supabase' }` and continues. In production, auth is fully enforced.

Supporting files:
- `ai-provider.js` — wraps `@anthropic-ai/sdk`. Claude-only. 30s timeout. `max_tokens` via `ANTHROPIC_MAX_TOKENS`.
- `schemas.js` — Zod schemas + `validate(schema)` middleware for all mutating routes.
- `config/env.js` — loads `.env`; exits 1 in production if missing.
- `lib/logger.js` — Pino structured logger. Pretty-prints in dev, JSON in prod.
- `middleware/auth.js` — `requireAuth` middleware with Supabase JWT validation.
- `middleware/rateLimiter.js` — `aiRateLimit` (10 req/min/IP).
- `db/index.js` — `getDb(userId)` returns the active store (Supabase when `SUPABASE_SERVICE_ROLE_KEY` is set, JSON flat-file otherwise).
- `db/jsonStore.js` — JSON flat-file store (dev/fallback). User-scoped calls are no-ops.
- `db/supabaseStore.js` — Supabase store using service role key. Manually applies `user_id` filter on every query.
- `services/jobService.js` — Pure business logic: `buildCompactId`, `getDailySequence`, `normalizeJob`, `updateContact`.
- `routes/jobs.js` — CRUD + action routes.
- `routes/ai.js` — `/generate-job-insights`.
- `routes/stats.js` — `/stats`.
- `routes/settings.js` — `/settings` GET + PUT.

### Data model

**Dual-store:** When `SUPABASE_SERVICE_ROLE_KEY` is set, all data goes to Supabase (`opportunities` table) scoped by `user_id`. Without it, falls back to `backend/data/jobs.json` (single-user dev mode, no scoping).

`opportunity_id` format: `P<YYMMDD><NNNN>` (e.g. `P250424001`). Draft status uses the `P` prefix; promoting a draft drops the prefix.

Key field enums (defined in `schemas.js`, canonical TypeScript types in `frontend/types/job.ts`):
- `milestone`: `'Lead' | 'Site Visit' | 'Proposal' | 'Construction' | 'Completed'`
- `status`: `'Draft' | 'New' | 'Contacted' | 'Closed'`
- `action.type`: `'call' | 'text' | 'email' | 'manual' | 'completed'`

**Frontend types:** Always import `Job`, `Milestone`, `JobStatus`, `MILESTONE_ORDER`, `OPEN_MILESTONES` from `@/types/job`. Do not redefine locally in page files.

Migrations:
- `migrations/001_opportunities.sql` — `opportunities` table with RLS + triggers.
- `migrations/002_user_settings.sql` — `user_settings` table: `base_prompt`, `business_context` (top-level columns), and `extra` JSONB (all other settings — business identity, pipeline defaults, proposal config, integrations, UI prefs, etc.).

### Auth

Supabase magic-link email flow:
1. `POST /auth/v1/otp` with email → sends magic link.
2. Link redirects to `/auth/callback?code=<PKCE_CODE>`.
3. `app/auth/callback/page.tsx` calls `supabase.auth.exchangeCodeForSession(code)` → session stored in localStorage.
4. `AuthProvider` (`lib/auth-context.tsx`) subscribes once; `useAuth()` gives any component access to `session`, `user`, `signOut`.
5. `(app)/layout.tsx` uses `useAuth()` and redirects to `/login` if session is null.
6. `lib/api.ts` attaches the token to every backend request.

Admin password login is at `/admin-login` — uses `supabase.auth.signInWithPassword`.

### CSS design tokens

**Single accent system:** `--primary` (Electric Blue, #0052FF → #4D7CFF gradient). The `--action` token is aliased to `--primary` for backward compatibility — do not add new `bg-action` usage. Use `bg-electric` (the gradient utility) for filled buttons/CTAs, and `text-primary` / `bg-primary/10` for text accents and tinted surfaces.

Font stack: `font-display` (Calistoga, headings) · `font-sans` (Inter, body) · `font-mono` (JetBrains Mono, code). Apply `font-display` to page `<h1>` and major section headlines.

All tokens are HSL variables defined in `frontend/app/globals.css` and mapped in `frontend/tailwind.config.ts`. The app uses a **light theme** (`#FAFAFA` background). Do not re-introduce dark mode or hardcoded hex/rgb colors.

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
- **Settings are Supabase-backed.** `GET/PUT /settings` returns `{ base_prompt, business_context, extra: {...} }`. `base_prompt` and `business_context` are top-level columns; everything else (all 80+ fields from the settings page) is stored in the `extra` JSONB column. Do not use localStorage for settings.
