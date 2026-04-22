# Anubis-Alpha — Merge Notes

**Date:** 2026-04-22
**From:** AnubisV2 (operational backend + dashboard) + Anubis_UI (landing + design system)
**To:** Anubis-Alpha — single codebase, two shells

This doc records the structural decisions made in the merge. The operational guide for dropping your existing code in is `MIGRATION_TODO.md`.

---

## Summary of decisions

| Decision | Choice | Why |
|---|---|---|
| Codebase strategy | Single Next.js app with route groups | Two repos = two deploys = two bills |
| Base repo | AnubisV2 | Backend + data model + API client are the valuable working parts |
| Design tokens | Anubis_UI (HSL neutrals + mint primary) | Premium feel for marketing, plays well with shadcn |
| Action color | Preserved as dedicated `--action` token | Keeps contractor muscle memory on dashboard CTAs |
| Backend | Preserved verbatim from AnubisV2 | Nothing broken — don't rewrite it |
| Shadcn primitives | Scaffold ships 3 (button, card, badge); rest copied from Anubis_UI during migration | Keeps the zip light |

---

## Route structure

### Before (two-route flat layout)
```
/               → Landing (Anubis_UI template)
/dashboard      → Working dashboard
/input          → Settings
/opportunity/[id] → Opportunity detail
```

### After (route groups)
```
(marketing)/
  /               → Landing
  /about          → About
  /pricing        → Pricing
  /faq            → FAQ
  /login          → Login (magic link — Phase 1)

(app)/
  /dashboard      → Dashboard (was /dashboard)
  /jobs           → Redirects to /dashboard (kanban view in Phase 2)
  /calendar       → Phase 2 stub
  /outreach       → Phase 2 stub
  /uploads        → Phase 2 stub
  /settings       → Settings (was /input)
  /opportunity/[id] → Opportunity detail
```

The parentheses in `(marketing)` and `(app)` mean Next.js treats these as route *groups* — they don't add segments to the URL, they just give each group its own layout. `(marketing)/page.tsx` renders at `/`, not `/marketing/`.

---

## Design token reconciliation

### The problem
AnubisV2 used hardcoded hex (`#0b0b0b`, `bg-yellow-400`) throughout the dashboard. Anubis_UI used CSS-variable HSL tokens with a mint primary. Both files couldn't coexist — they produced different looking buttons, different card backgrounds, different radii.

### The decision
One token set, lives in `frontend/app/globals.css`:

- **`--background` / `--foreground`** — dark neutrals from Anubis_UI
- **`--card`** — darkened (`220 13% 11%`) so cards are visible against the dark background. Anubis_UI originally had this near-white, which killed readability on a dark body.
- **`--primary`** — mint/teal from Anubis_UI (`165 96% 71%`) — used for marketing CTAs, brand highlights, premium feel
- **`--action`** (new) — field-action yellow (`48 96% 53%` ≈ Tailwind `yellow-400`) — preserved for contractor workflow CTAs (Save, Generate AI, Mark Completed)
- **`--border` / `--muted` / `--accent`** — all derived consistently so shadcn primitives just work

### Why two CTA colors
Two different audiences, two different jobs:

- Marketing visitor → mint `--primary` → "premium product, worth paying for"
- Contractor at 6 AM in the truck → yellow `--action` → "the button I tap to save the job"

They're different because the intent is different. Mixing them would dilute both. Keeping them scoped by surface (marketing = mint, app = action yellow on primary buttons) is the whole point of route groups.

---

## Shell components

### `MarketingShell`
- Sticky top header with logo + nav (Home / About / Pricing / FAQ) + "Sign in" + "Get Started"
- Footer with copyright + secondary links
- Lives in `components/marketing-shell.tsx`
- Wrapped via `app/(marketing)/layout.tsx`

### `AppShell`
- Left sidebar (hidden on mobile, visible `md:` and up): logo, nav with icons + badges, "Alpha build" info card
- Top bar: search input, notifications, avatar
- Lives in `components/app-shell.tsx`
- Wrapped via `app/(app)/layout.tsx`
- Active route highlighting based on `usePathname()`

Both shells use the same tokens, same font family, same radii — that's what makes the product feel unified even though the surfaces are different.

---

## What was preserved verbatim

- **Backend** — `server.js`, `schemas.js`, `src/config/env.js`. Zero behavioral change.
- **`ai-provider.js`** — simplified to Claude-only (Ollama local-AI path removed per instruction).
- **`lib/api.ts`** — identical from AnubisV2, already wired through `NEXT_PUBLIC_API_URL`.
- **`lib/utils.ts`** — identical `cn()` helper.
- **Opportunity data model** — all existing fields (first_name, last_name, opportunity_id, milestone, status, etc.) unchanged.
- **localStorage settings key** — `anubis_global_settings` with flat shape `{ base_prompt, business_context }`. Do not rename (P1-02 fix).
- **All P1/P2/P3 fixes** from the CODE_REVIEW baseline.

---

## What changed structurally

1. **Two route groups** replace the flat route layout.
2. **Shells are mandatory** — no page renders without either MarketingShell or AppShell wrapping it. This is what prevents drift between the two surfaces.
3. **`/input` renamed to `/settings`** — update any bookmarks or hardcoded links. The old route is gone.
4. **`--action` token** formalizes what was previously `bg-yellow-400` everywhere. Cosmetic find-replace during migration.
5. **Marketing shell header has a functional nav** with Home/About/Pricing/FAQ — routes that existed as ideas in the design doc now have real files.

---

## What was NOT done (deferred)

| Deferred | Why | When |
|---|---|---|
| Supabase auth | Week of work on its own; needs DB schema + RLS | Phase 1 |
| JSON file → Postgres migration | Same as above | Phase 1 |
| Restyling existing dashboard/opportunity/settings to use tokens | Cosmetic; won't break anything if you leave the yellow for now | Optional, during migration |
| Shadcn primitives beyond button/card/badge | Kept scaffold light; copy from Anubis_UI as needed | During migration |
| Proposal Builder, Homeowner Portal, Change Orders, etc. | Phase 2 feature work | Weeks 3–5 |

---

## Open questions for the next session

1. **Brand name** — is it staying "Anubis" or rebranding before launch?
2. **Premium tier feature split** — the Pricing page ships with my suggested split ($15 Starter / $59 Pro / Custom Team). Confirm or redraw.
3. **Domain** — needed before Week 6 for SSL / email setup.
4. **Logo** — placeholder `<Sparkles />` icon in both shells. Swap once brand is locked.

---

*Friction point removed for the end-user: your existing dashboard and opportunity pages will still work after Step 4 of the migration, even if you skip the cosmetic swaps. The structure is the hard part. The paint job can wait.*
