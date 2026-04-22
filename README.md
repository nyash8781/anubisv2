# Anubis — Alpha

> All-in-one SaaS for small contractors. AI-powered opportunity management, homeowner portal, proposals, change orders, and payments — built to make the contractor look like a pro on every customer touchpoint.

**Status:** Alpha (v0.2.0) — merged landing + app shell.
**Previous:** AnubisV2 (operational dashboard) + Anubis_UI (design system).

---

## What changed from AnubisV2 → Alpha

- **Route groups.** `frontend/app/` splits into `(marketing)` and `(app)`. One codebase, two shells.
- **Design tokens reconciled.** One `globals.css` drives both surfaces.
- **AppShell + MarketingShell** added as shared layouts.
- **Backend preserved as-is** with one simplification: Claude-only AI (Ollama removed).

See [`docs/MERGE_NOTES.md`](docs/MERGE_NOTES.md) for the full change log.

---

## Prerequisites

- Node.js 20.9.0 or later
- npm 10+
- An **Anthropic API key** (https://console.anthropic.com)

## Quick start (development)

```bash
npm run install:all

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Edit backend/.env — paste your ANTHROPIC_API_KEY

npm run dev
```

Open **http://localhost:3000**.

## Project structure

```
anubis-alpha/
├── backend/                   Express API — opportunities, AI, contact log
│   ├── server.js
│   ├── ai-provider.js         Anthropic / Claude
│   ├── schemas.js             zod validation
│   └── src/config/env.js      Env loader + service status
├── frontend/
│   ├── app/
│   │   ├── (marketing)/       Home, About, Pricing, FAQ, Login
│   │   └── (app)/             Dashboard, Jobs, Calendar, Outreach, Uploads, Settings, Opportunity
│   ├── components/
│   │   ├── app-shell.tsx
│   │   ├── marketing-shell.tsx
│   │   └── ui/                shadcn primitives
│   ├── lib/api.ts             Single source of truth for backend URL
│   └── public/                See docs/PUBLIC_CLEANUP.md
└── docs/                      Living documentation
```

## Routes

**Public (marketing):**

| Path | Page |
|---|---|
| `/` | Home |
| `/about` | About |
| `/pricing` | Pricing |
| `/faq` | FAQ |
| `/login` | Login (magic link) |

**Authenticated (app):**

| Path | Page |
|---|---|
| `/dashboard` | Opportunity dashboard |
| `/jobs` | Alias for `/dashboard` |
| `/calendar` | Calendar (Phase 2) |
| `/outreach` | Email/SMS composer (Phase 2) |
| `/uploads` | File manager (Phase 2) |
| `/settings` | Global settings (was `/input`) |
| `/opportunity/[id]` | Opportunity detail |

## Documentation

- [`docs/MIGRATION_TODO.md`](docs/MIGRATION_TODO.md) — How to drop AnubisV2 code into this scaffold
- [`docs/PUBLIC_CLEANUP.md`](docs/PUBLIC_CLEANUP.md) — `/public` files to delete/replace
- [`docs/MERGE_NOTES.md`](docs/MERGE_NOTES.md) — Merge decisions
- [`docs/FEATURES.md`](docs/FEATURES.md) — Current feature status

## License

MIT
