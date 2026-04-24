# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run install:all       # install deps for root + backend + frontend
npm run dev               # start backend (port 5000) + frontend (port 3000) concurrently
```

### Frontend only (`cd frontend` or use prefix)
```bash
npm run build --prefix frontend
npm run lint --prefix frontend
npx tsc --noEmit          # type-check (no npm script for this)
```

### Backend only
```bash
npm run dev --prefix backend    # nodemon server.js
npm run start --prefix backend  # node server.js (production)
```

### Claude automation pipeline (not part of the app)
```bash
pip install -r Claude/requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...

# Run the 3 skills in order inside Claude Code:
/anubis-reviewer      # → Claude/docs/code_review.md
/sow-tracker          # → Claude/docs/scope_of_work.md
/execution-driver     # → Claude/docs/execution_plan.md

# Then implement with executor.py:
python Claude/executor.py \
  --review Claude/docs/code_review.md \
  --scope  Claude/docs/scope_of_work.md \
  --plan   Claude/docs/execution_plan.md \
  --repo   .
```

## Architecture

Monorepo: `backend/` (Express, Node.js CommonJS) + `frontend/` (Next.js 16, TypeScript). They are fully separate — no shared code between them.

### Frontend — `frontend/`

Next.js App Router with two route groups:
- `app/(marketing)/` — public pages (home, about, pricing, FAQ, login). Wrapped in `MarketingShell`.
- `app/(app)/` — authenticated pages (dashboard, jobs, calendar, outreach, uploads, settings, opportunity/[id]). Wrapped in `AppShell`. The `(app)/layout.tsx` is a client component that uses `useSession()` to redirect unauthenticated users to `/login`.
- `app/auth/callback/` — Supabase OAuth callback handler.

Key lib files:
- `lib/api.ts` — `apiGet / apiPost / apiPut / apiDelete / apiUpload`. Reads `NEXT_PUBLIC_API_URL` (throws at module load if missing). Attaches `Authorization: Bearer <token>` from the Supabase session automatically.
- `lib/auth.ts` — `useSession()` hook returning `Session | null | 'loading'`, and `signOut()`.
- `lib/supabase.ts` — browser Supabase client (reads `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- `lib/server/` — server-only utilities: AI (Claude), email (Resend), SMS (Twilio), storage (R2), payments (Stripe). Files here use `import 'server-only'` and must not be imported from client components.

UI components live in `components/ui/` and are shadcn/ui primitives (Radix UI + Tailwind). Don't add new component libraries.

### Backend — `backend/`

Single-file Express 5 server (`server.js`) with all routes. Key supporting files:
- `ai-provider.js` — wraps `@anthropic-ai/sdk`. Claude-only (Ollama was removed).
- `schemas.js` — Zod schemas for every request body.
- `src/config/env.js` — loads `.env`, exports `getServiceStatus()` which checks which integrations have keys set. The `GET /` health route returns this status.
- `data/jobs.json` — Phase 1 data store (flat JSON). Migration to Supabase is planned; see `docs/MIGRATION_TODO.md`.

Backend routes all follow `/jobs` and `/jobs/:id`. No auth enforcement yet on backend routes (Phase 1 gap).

### Data layer

Phase 1 uses `backend/data/jobs.json` as the database. The `opportunity_id` format is `P<YYMMDD><NNN>` (e.g. `P250424001`). The `migrations/001_opportunities.sql` file defines the target Supabase schema with RLS and triggers for when the migration happens.

### Auth

Supabase magic-link email flow:
1. `POST /auth/v1/otp` with email → sends magic link.
2. Link redirects to `/auth/callback` → session stored in localStorage.
3. `useSession()` reads the session; `(app)/layout.tsx` redirects to `/login` if null.
4. `lib/api.ts` attaches the token to every backend request.

The admin password login lives at `/admin-login` (separate from the magic-link flow).

### Environment variables

Copy `.env.example` files before starting:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

**Required to run at all:**
- `ANTHROPIC_API_KEY` (backend)
- `NEXT_PUBLIC_API_URL` (frontend) — `http://localhost:5000` in dev
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (frontend)
- `SUPABASE_URL` + `SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` (backend)

**Required only when their feature is used:** `RESEND_API_KEY`, `TWILIO_*`, `R2_*`, `STRIPE_*`, `NEXT_PUBLIC_POSTHOG_KEY`. The backend's `GET /` route reports which integrations are active.

### Claude automation — `Claude/`

This folder is self-contained and can be deleted without affecting the app. It contains:
- `executor.py` — agentic loop using Claude Sonnet 4.6 that reads the 3 planning docs and drives file edits and bash commands autonomously.
- `skills/anubis-reviewer/`, `skills/sow-tracker/`, `skills/execution-driver/` — source prompts for the 3 Claude Code slash commands (`.claude/commands/*.md`).
- `docs/` — output folder for generated documents (gitignored).

## Key constraints

- **No Ollama.** Backend is Claude-only (`ai-provider.js`).
- **`lib/server/`** files must never be imported from client components — they use `import 'server-only'`.
- **`lib/api.ts`** throws at module load if `NEXT_PUBLIC_API_URL` is not set — don't import it in server components or during SSR without that env var present.
- **`next.config.js` image hostnames** are explicit (`*.supabase.co`, `*.supabase.in`) — do not use wildcards.
- **Backend is CommonJS** (`"type": "commonjs"` in `backend/package.json`). Use `require()`, not `import`.
- **No test suite.** Use `npx tsc --noEmit` to catch type errors and `npm run lint` for linting.
