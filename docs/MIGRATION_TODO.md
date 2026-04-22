# Anubis-Alpha — Migration TODO

**Purpose:** You have Anubis-Alpha as a scaffold. This walks you through dropping AnubisV2's working code into the new structure. Most of it is copy-paste with a handful of cosmetic swaps.

**Time estimate:** 60–90 minutes if AnubisV2 is clean.

---

## Step 1 — Push to GitHub

The scaffold ships with git already initialized. Your move:

```bash
cd anubis-alpha

# Option A: new repo
# Create empty repo on GitHub named "anubis-alpha" (or whatever you prefer)
git remote add origin git@github.com:YOUR_USERNAME/anubis-alpha.git
git branch -M main
git push -u origin main

# Option B: push as a branch into existing AnubisV2 repo
# (do this if you want to keep history under one repo)
git remote add origin git@github.com:YOUR_USERNAME/AnubisV2.git
git checkout -b alpha
git push -u origin alpha
# Then merge or PR into main when ready
```

---

## Step 2 — Install deps

```bash
npm run install:all
```

If that fails, run separately:
```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

---

## Step 3 — Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Open `backend/.env` and paste your `ANTHROPIC_API_KEY`. That's the only required value to get AI working. Everything else (Supabase, Resend, Twilio, R2, Stripe) is for later phases.

---

## Step 4 — Verify the scaffold boots

```bash
npm run dev
```

You should see:
- Backend at http://localhost:5000 → JSON status page (check `ai.configured: true`)
- Frontend at http://localhost:3000 → marketing landing page
- `/dashboard` → scaffold placeholder inside AppShell (sidebar + topbar visible)

If all three render, the foundation is solid.

---

## Step 5 — Copy the dashboard page

**Source:** `AnubisV2/frontend/app/dashboard/page.tsx`
**Destination:** `anubis-alpha/frontend/app/(app)/dashboard/page.tsx` (overwrite the placeholder)

**Before committing, apply these find-replaces to the pasted code:**

| Find | Replace with | Why |
|---|---|---|
| `bg-yellow-400 text-black` | `bg-action text-action-foreground` | New token for contractor CTAs |
| `text-yellow-400` | `text-action` | Same |
| `bg-[#0b0b0b]` | `bg-background` | Unified token |
| `bg-[#111111]` | `bg-card` | Card surface |
| `bg-[#0d0d0d]` | `bg-muted/40` | Inset surface |
| `border-white/10` | `border-border/40` | Theme-aware border |
| `text-gray-400` | `text-muted-foreground` | Unified token |

**Also remove:** the top navigation block (the three `<Link>` buttons — Dashboard, Landing, Input). AppShell provides sidebar navigation now.

Visit http://localhost:3000/dashboard → working table + filters inside the AppShell.

---

## Step 6 — Copy the opportunity page

**Source:** `AnubisV2/frontend/app/opportunity/[id]/page.tsx`
**Destination:** `anubis-alpha/frontend/app/(app)/opportunity/[id]/page.tsx` (overwrite)

Same cosmetic swaps as Step 5. Plus:

- The `SETTINGS_STORAGE_KEY` constant must stay `"anubis_global_settings"`. Don't rename it.
- Keep the flat shape `{ base_prompt, business_context }` when reading localStorage.
- All `apiGet / apiPost / apiPut` imports already resolve against `lib/api.ts`.

Test at `/opportunity/new`.

---

## Step 7 — Copy the settings page

**Source:** `AnubisV2/frontend/app/input/page.tsx`
**Destination:** `anubis-alpha/frontend/app/(app)/settings/page.tsx` (overwrite)

Same cosmetic swaps. Plus:

- The route is now `/settings`, not `/input`. Update any hardcoded `Link href="/input"` to `/settings`.
- Remove the top-bar nav (AppShell handles it).

---

## Step 8 — Copy shadcn UI primitives you need

The scaffold ships only `button`, `card`, `badge`. If pasted code uses `Input`, `Select`, `Textarea`, `Tabs`, `Avatar`, `Progress`, `Tooltip`, `ScrollArea`, etc., copy them from Anubis_UI:

**Source:** `Anubis_UI/frontend/components/ui/*.tsx`
**Destination:** `anubis-alpha/frontend/components/ui/`

All follow shadcn/new-york style and pick up the unified tokens automatically.

Missing a component? `npx shadcn@latest add <name>` in the frontend directory.

---

## Step 9 — Public folder assets

See `docs/PUBLIC_CLEANUP.md` for the full triage. Minimum to get the landing page rendering clean: copy `placeholder.jpg`, `placeholder-user.jpg`, and `placeholder-logo.svg` from `Anubis_UI/frontend/public/` into `anubis-alpha/frontend/public/`.

**Do not copy:** the `logos/` folder, the `avatars/` folder, `guillermo-rauch.png`, or any of the nine template screenshots. PUBLIC_CLEANUP.md explains why.

---

## Step 10 — Smoke test

1. http://localhost:3000 → marketing landing renders
2. Click "Get Started" → /login renders
3. Manually visit /dashboard → AppShell renders with your real dashboard
4. Click "New Opportunity" → form loads, save returns to dashboard
5. Open an opportunity → detail page loads
6. Click "Generate AI" → Claude response appears (requires ANTHROPIC_API_KEY)
7. `/settings` → configure base prompt + business context
8. Back to opportunity → "Generate AI" now uses your tuned prompt

If all 8 pass, the merge is done.

---

## Step 11 — Deploy to Vercel (when Phase 1 is ready)

1. Import the GitHub repo into Vercel
2. Root directory: `frontend`
3. Add env vars from `frontend/.env.example`
4. For the backend: separate Render service, OR move routes to Vercel `/api/*`. See `docs/CLOUD_ROADMAP.md` §3 (from AnubisV2/docs).

---

## Troubleshooting

**"Module not found: @/components/ui/…"**
→ Primitive isn't in the scaffold. Copy from Anubis_UI or `npx shadcn@latest add <name>`.

**Dashboard renders but yellow buttons look mint**
→ You skipped Step 5's find-replace. `bg-yellow-400` still works but doesn't use the token.

**Generate AI returns 500**
→ `ANTHROPIC_API_KEY` not set in `backend/.env`. Backend logs the exact reason.

**CORS error in browser console**
→ Add your frontend origin to `CORS_ORIGINS` in `backend/.env`.

---

*Friction point removed for the end-user: you're not rebuilding, you're relocating. Every file has a source address and a destination address. The scaffold handled the architecture so your only job is the migration.*
