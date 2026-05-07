# AnubisV2 — Repo Cleanup Audit

**Date:** 2026-05-06  
**Auditor:** 3-Reviewer Enterprise Cleanup Team (AI-assisted)  
**Backup status:** Backup already confirmed by owner before this audit.

---

## 1. Executive Summary

**What stays:** All source code in `frontend/` and `backend/`, root config files, `.github/`, the `Claude/` automation pipeline, all active public assets, all four migrations.

**What goes:** The `.obsidian/` directory (IDE config partially committed to git — worst hygiene issue), the `_dump/` folder, the empty `obsidian/` directory, four generated report docs in `docs/`, and three generated files in `Claude/docs/`.

**Highest-risk cleanup area:** `.obsidian/workspace.json` is the only currently-tracked file that should not be tracked. Removing it requires `git rm --cached` — everything else is either already gitignored or a physical-disk-only cleanup.

**Files needing manual review:** `docs/CODE_REVIEW.md`, `docs/SETUP_INSTRUCTIONS.md`, `docs/PHASE_2_CHECKLIST.md`, `docs/proposal-system-supabase-schema-notes.md`, `backend/seed-fake-opportunities.js`, `backend/db/client.js`, and `frontend/public/images/tech stack/` SVGs.

**Critical note on docs/:** The entire `docs/` folder is already in `.gitignore` — those files exist only on disk and are NOT in the git repo. Same for `_dump/`, `local/`, `obsidian/`, `.claude/`, `backend/data/jobs.json`, and `Claude/docs/*.md`. The disk still has them and they clutter the working directory.

---

## 2. Full File/Folder Classification Table

| Path | Classification | Keep/Delete/Review | Reason |
|---|---|---|---|
| `.env.example` | KEEP_REPO_CONFIG | Keep | Root master env template |
| `.gitignore` | KEEP_REPO_CONFIG | Keep | Core repo config |
| `CLAUDE.md` | KEEP_CURRENT_DOC | Keep | Project instructions for Claude Code |
| `LICENSE` | KEEP_GITHUB_INFO | Keep | License file |
| `README.md` | KEEP_GITHUB_INFO | Keep | Primary project doc |
| `package.json` | KEEP_REPO_CONFIG | Keep | Root concurrency scripts |
| `package-lock.json` | KEEP_REPO_CONFIG | Keep | Lock file |
| `.git/` | KEEP_REPO_CONFIG | Keep | Never touch |
| `.github/workflows/ci.yml` | KEEP_GITHUB_INFO | Keep | CI pipeline |
| `.obsidian/workspace.json` | DELETE_UNUSED_ARTIFACT | Delete | IDE config committed to git; not app code |
| `.obsidian/graph.json` | DELETE_UNUSED_ARTIFACT | Delete | Untracked IDE config; not app code |
| `.obsidian/app.json` | DELETE_UNUSED_ARTIFACT | Delete | Obsidian IDE config; not app code |
| `.obsidian/appearance.json` | DELETE_UNUSED_ARTIFACT | Delete | Obsidian IDE config; not app code |
| `.obsidian/core-plugins.json` | DELETE_UNUSED_ARTIFACT | Delete | Obsidian IDE config; not app code |
| `.obsidian/2025-04-26 - Code Review - Seniro.txt` | DELETE_OLD_PROMPT | Delete | April 2025 AI-generated code review saved in Obsidian |
| `.claude/` | KEEP_REPO_CONFIG | Keep (gitignored by design) | Claude Code commands + settings |
| `Claude/README.md` | KEEP_CURRENT_DOC | Keep | Documents the automation pipeline |
| `Claude/requirements.txt` | KEEP_REPO_CONFIG | Keep | Python deps for executor |
| `Claude/executor.py` | KEEP_ACTIVE_CODE | Keep | AI pipeline runner |
| `Claude/skills/anubis-reviewer/SKILL.md` | KEEP_ACTIVE_CODE | Keep | Source prompt for anubis-reviewer command |
| `Claude/skills/execution-driver/SKILL.md` | KEEP_ACTIVE_CODE | Keep | Source prompt for execution-driver command |
| `Claude/skills/sow-tracker/SKILL.md` | KEEP_ACTIVE_CODE | Keep | Source prompt for sow-tracker command |
| `Claude/docs/.gitkeep` | KEEP_REPO_CONFIG | Keep | Preserves gitignored output directory |
| `Claude/docs/code_review.md` | DELETE_GENERATED_PACKAGE | Delete | Generated output; gitignored by design |
| `Claude/docs/execution_plan.md` | DELETE_GENERATED_PACKAGE | Delete | Generated output; gitignored by design |
| `Claude/docs/scope_of_work.md` | DELETE_GENERATED_PACKAGE | Delete | Generated output; gitignored by design |
| `docs/CODE_REVIEW.md` | MANUAL_REVIEW | Review | Detailed engineering review; may be useful reference |
| `docs/CODE_REVIEW_OPPORTUNITY_REDESIGN.md` | DELETE_OLD_PROMPT | Delete | AI-generated review artifact; gitignored |
| `docs/COUNCIL_REVIEW_RUNS_1_2_3.md` | DELETE_OLD_PROMPT | Delete | AI run reports; clearly generated artifact; gitignored |
| `docs/ENTERPRISE_COUNCIL_REPORT.md` | DELETE_OLD_PROMPT | Delete | AI-generated council report artifact; gitignored |
| `docs/PHASE_2_CHECKLIST.md` | MANUAL_REVIEW | Review | Active planning doc; might be useful |
| `docs/SETUP_INSTRUCTIONS.md` | MANUAL_REVIEW | Review | Setup guide; potentially useful for onboarding |
| `docs/STRATEGY_COUNCIL.md` | DELETE_OLD_PROMPT | Delete | AI-generated strategy artifact; gitignored |
| `docs/proposal-system-supabase-schema-notes.md` | MANUAL_REVIEW | Review | Schema notes; may have live reference value |
| `_dump/` (entire directory) | DELETE_BACKUP | Delete | Gitignored dump folder; backup artifacts |
| `obsidian/` (empty dir) | DELETE_UNUSED_ARTIFACT | Delete | Empty directory; gitignored; serves no purpose |
| `local/` (entire directory) | KEEP_REPO_CONFIG | Keep (gitignored by design) | Machine-local scripts; gitignored by intent |
| `backend/server.js` | KEEP_ACTIVE_CODE | Keep | Main entry point |
| `backend/ai-provider.js` | KEEP_ACTIVE_CODE | Keep | Claude integration |
| `backend/schemas.js` | KEEP_ACTIVE_CODE | Keep | Zod validation schemas |
| `backend/package.json` | KEEP_REPO_CONFIG | Keep | Backend dependencies |
| `backend/package-lock.json` | KEEP_REPO_CONFIG | Keep | Backend lock file |
| `backend/vercel.json` | KEEP_REPO_CONFIG | Keep | Deployment config |
| `backend/.env` | KEEP_REPO_CONFIG | Keep (gitignored, never tracked) | Real secrets; gitignored by design |
| `backend/.env.example` | KEEP_REPO_CONFIG | Keep | Backend env template |
| `backend/seed-fake-opportunities.js` | MANUAL_REVIEW | Review | Dev seeder; not production code; verify if needed |
| `backend/config/env.js` | KEEP_ACTIVE_CODE | Keep | Env loader |
| `backend/data/jobs.json` | MANUAL_REVIEW | Review | Flat-file DB; gitignored; verify if empty or has dev data |
| `backend/db/index.js` | KEEP_ACTIVE_CODE | Keep | Store selector |
| `backend/db/jsonStore.js` | KEEP_ACTIVE_CODE | Keep | JSON flat-file store |
| `backend/db/supabaseStore.js` | KEEP_ACTIVE_CODE | Keep | Supabase store |
| `backend/db/client.js` | MANUAL_REVIEW | Review | Not documented in CLAUDE.md; verify if imported |
| `backend/lib/logger.js` | KEEP_ACTIVE_CODE | Keep | Pino logger |
| `backend/middleware/auth.js` | KEEP_ACTIVE_CODE | Keep | Auth middleware |
| `backend/middleware/rateLimiter.js` | KEEP_ACTIVE_CODE | Keep | Rate limiter |
| `backend/migrations/001_opportunities.sql` | KEEP_ACTIVE_CODE | Keep | Active migration |
| `backend/migrations/002_user_settings.sql` | KEEP_ACTIVE_CODE | Keep | Active migration |
| `backend/migrations/003_indexes.sql` | KEEP_ACTIVE_CODE | Keep | Active migration |
| `backend/migrations/004_activities.sql` | KEEP_ACTIVE_CODE | Keep | Active migration (new, untracked) |
| `backend/routes/ai.js` | KEEP_ACTIVE_CODE | Keep | AI routes |
| `backend/routes/jobs.js` | KEEP_ACTIVE_CODE | Keep | Jobs CRUD routes |
| `backend/routes/settings.js` | KEEP_ACTIVE_CODE | Keep | Settings routes |
| `backend/routes/stats.js` | KEEP_ACTIVE_CODE | Keep | Stats routes |
| `backend/routes/outreach.js` | KEEP_ACTIVE_CODE | Keep | Outreach routes (new, untracked) |
| `backend/services/jobService.js` | KEEP_ACTIVE_CODE | Keep | Job business logic |
| `frontend/.env.local` | KEEP_REPO_CONFIG | Keep (gitignored, never tracked) | Real frontend secrets; gitignored |
| `frontend/.env.example` | KEEP_REPO_CONFIG | Keep | Frontend env template |
| `frontend/tsconfig.tsbuildinfo` | DELETE_TEMP | Delete | TS build cache; gitignored by `*.tsbuildinfo` rule |
| `frontend/next-env.d.ts` | DELETE_TEMP | Delete | Auto-generated Next.js types; gitignored |
| `frontend/components.json` | KEEP_REPO_CONFIG | Keep | shadcn/ui config |
| `frontend/instrumentation.ts` | KEEP_ACTIVE_CODE | Keep | Sentry/OTel instrumentation |
| `frontend/middleware.ts` | KEEP_ACTIVE_CODE | Keep | Next.js middleware |
| `frontend/next.config.js` | KEEP_REPO_CONFIG | Keep | Next.js config |
| `frontend/package.json` | KEEP_REPO_CONFIG | Keep | Frontend dependencies |
| `frontend/package-lock.json` | KEEP_REPO_CONFIG | Keep | Frontend lock file |
| `frontend/postcss.config.js` | KEEP_REPO_CONFIG | Keep | PostCSS config |
| `frontend/sentry.client.config.ts` | KEEP_REPO_CONFIG | Keep | Sentry client config |
| `frontend/sentry.edge.config.ts` | KEEP_REPO_CONFIG | Keep | Sentry edge config |
| `frontend/sentry.server.config.ts` | KEEP_REPO_CONFIG | Keep | Sentry server config |
| `frontend/tailwind.config.ts` | KEEP_REPO_CONFIG | Keep | Tailwind config |
| `frontend/tsconfig.json` | KEEP_REPO_CONFIG | Keep | TypeScript config |
| `frontend/vercel.json` | KEEP_REPO_CONFIG | Keep | Deployment config |
| `frontend/app/` (all pages) | KEEP_ACTIVE_CODE | Keep | All Next.js app routes |
| `frontend/components/opportunity/` (all) | KEEP_ACTIVE_CODE | Keep | Opportunity sub-components |
| `frontend/components/proposal/` (all) | KEEP_ACTIVE_CODE | Keep | Proposal sub-components |
| `frontend/components/ui/` (all) | KEEP_ACTIVE_CODE | Keep | shadcn/ui primitives |
| `frontend/components/app-shell.tsx` | KEEP_ACTIVE_CODE | Keep | App nav shell |
| `frontend/components/marketing-shell.tsx` | KEEP_ACTIVE_CODE | Keep | Marketing layout |
| `frontend/components/posthog-provider.tsx` | KEEP_ACTIVE_CODE | Keep | Analytics provider |
| `frontend/components/theme-provider.tsx` | KEEP_ACTIVE_CODE | Keep | Theme wrapper |
| `frontend/hooks/use-mobile.tsx` | KEEP_ACTIVE_CODE | Keep | Mobile breakpoint hook |
| `frontend/hooks/use-toast.ts` | KEEP_ACTIVE_CODE | Keep | Toast hook |
| `frontend/lib/api.ts` | KEEP_ACTIVE_CODE | Keep | API client |
| `frontend/lib/auth-context.tsx` | KEEP_ACTIVE_CODE | Keep | Auth provider |
| `frontend/lib/auth.ts` | KEEP_ACTIVE_CODE | Keep | Deprecated but tracked; keep until cleaned by code owner |
| `frontend/lib/supabase.ts` | KEEP_ACTIVE_CODE | Keep | Supabase browser client |
| `frontend/lib/utils.ts` | KEEP_ACTIVE_CODE | Keep | General utilities |
| `frontend/lib/providers/` (all) | KEEP_ACTIVE_CODE | Keep | AI, document, PDF provider abstractions |
| `frontend/lib/server/` (all) | KEEP_ACTIVE_CODE | Keep | Server-only utilities |
| `frontend/lib/services/` (all) | KEEP_ACTIVE_CODE | Keep | Proposal services |
| `frontend/types/job.ts` | KEEP_ACTIVE_CODE | Keep | Canonical job types |
| `frontend/types/proposal.ts` | KEEP_ACTIVE_CODE | Keep | Proposal types |
| `frontend/public/apple-icon.png` | KEEP_PUBLIC_ASSET | Keep | App icon |
| `frontend/public/icon-dark-32x32.png` | KEEP_PUBLIC_ASSET | Keep | Favicon variant |
| `frontend/public/icon-light-32x32.png` | KEEP_PUBLIC_ASSET | Keep | Favicon variant |
| `frontend/public/icon.svg` | KEEP_PUBLIC_ASSET | Keep | Primary icon |
| `frontend/public/images/tech stack/` (all SVGs) | MANUAL_REVIEW | Review | Verify used by marketing pages before keeping |

---

## 3. 3-Reviewer Decision Table

| Path | Repo Hygiene | Code Integrity | Product/QA | Final | Reason |
|---|---|---|---|---|---|
| `.obsidian/workspace.json` | DELETE | DELETE | DELETE | **DELETE** | Tracked IDE config; needs `git rm --cached` + add `.obsidian/` to .gitignore |
| `.obsidian/graph.json` | DELETE | DELETE | DELETE | **DELETE** | Untracked Obsidian graph export |
| `.obsidian/app.json` | DELETE | DELETE | DELETE | **DELETE** | Obsidian app settings |
| `.obsidian/appearance.json` | DELETE | DELETE | DELETE | **DELETE** | Obsidian appearance settings |
| `.obsidian/core-plugins.json` | DELETE | DELETE | DELETE | **DELETE** | Obsidian plugin config |
| `.obsidian/2025-04-26 - Code Review - Seniro.txt` | DELETE | DELETE | DELETE | **DELETE** | Old AI-generated code review note saved in Obsidian |
| `Claude/docs/code_review.md` | DELETE | DELETE | DELETE | **DELETE** | Gitignored generated Claude output |
| `Claude/docs/execution_plan.md` | DELETE | DELETE | DELETE | **DELETE** | Gitignored generated Claude output |
| `Claude/docs/scope_of_work.md` | DELETE | DELETE | DELETE | **DELETE** | Gitignored generated Claude output |
| `docs/COUNCIL_REVIEW_RUNS_1_2_3.md` | DELETE | DELETE | DELETE | **DELETE** | Three AI run-report outputs; purely historical |
| `docs/ENTERPRISE_COUNCIL_REPORT.md` | DELETE | DELETE | DELETE | **DELETE** | AI-generated enterprise council artifact |
| `docs/STRATEGY_COUNCIL.md` | DELETE | DELETE | DELETE | **DELETE** | AI-generated strategy artifact; not active planning |
| `docs/CODE_REVIEW_OPPORTUNITY_REDESIGN.md` | DELETE | DELETE | UNSURE | **MANUAL_REVIEW** | Product/QA wants to verify redesign notes captured elsewhere before deletion |
| `_dump/123.text.txt` | DELETE | DELETE | DELETE | **DELETE** | Dump folder junk |
| `_dump/README.md` | DELETE | DELETE | DELETE | **DELETE** | Dump manifest |
| `_dump/Untitled.base` | DELETE | DELETE | DELETE | **DELETE** | Unknown artifact |
| `_dump/Untitled.canvas` | DELETE | DELETE | DELETE | **DELETE** | Obsidian canvas in dump |
| `_dump/dump-manifest.txt` | DELETE | DELETE | DELETE | **DELETE** | Dump manifest |
| `obsidian/` (empty) | DELETE | DELETE | DELETE | **DELETE** | Empty directory; gitignored |
| `frontend/tsconfig.tsbuildinfo` | DELETE | DELETE | DELETE | **DELETE** | TS build cache; auto-regenerated |
| `frontend/next-env.d.ts` | DELETE | DELETE | DELETE | **DELETE** | Auto-generated Next.js types; regenerated on build |
| `docs/CODE_REVIEW.md` | UNSURE | KEEP | KEEP | **MANUAL_REVIEW** | Contains security findings relevant to active code |
| `docs/SETUP_INSTRUCTIONS.md` | KEEP | KEEP | KEEP | **MANUAL_REVIEW** | Useful but gitignored; consider promoting to README |
| `docs/PHASE_2_CHECKLIST.md` | UNSURE | UNSURE | KEEP | **MANUAL_REVIEW** | Active planning; verify currency against current code |
| `docs/proposal-system-supabase-schema-notes.md` | UNSURE | KEEP | KEEP | **MANUAL_REVIEW** | Proposal system is active; verify against migrations |
| `backend/seed-fake-opportunities.js` | UNSURE | DELETE | KEEP | **MANUAL_REVIEW** | Dev seeder; not production; verify team usage |
| `backend/db/client.js` | UNSURE | UNSURE | UNSURE | **MANUAL_REVIEW** | Not in CLAUDE.md; need import trace before deciding |
| `frontend/public/images/tech stack/` | UNSURE | UNSURE | UNSURE | **MANUAL_REVIEW** | Cannot confirm usage without reading marketing pages |

---

## 4. Delete Candidate List

| Path | Reason for Deletion | Risk Level |
|---|---|---|
| `.obsidian/workspace.json` | Obsidian IDE config committed to git; needs `git rm --cached` first | Low |
| `.obsidian/graph.json` | Untracked Obsidian graph export; IDE artifact | Low |
| `.obsidian/app.json` | Obsidian IDE settings; no app relevance | Low |
| `.obsidian/appearance.json` | Obsidian appearance config; no app relevance | Low |
| `.obsidian/core-plugins.json` | Obsidian plugin config; no app relevance | Low |
| `.obsidian/2025-04-26 - Code Review - Seniro.txt` | April 2025 AI-generated code review note | Low |
| `Claude/docs/code_review.md` | Gitignored generated output; not source code | Low |
| `Claude/docs/execution_plan.md` | Gitignored generated output; not source code | Low |
| `Claude/docs/scope_of_work.md` | Gitignored generated output; not source code | Low |
| `docs/COUNCIL_REVIEW_RUNS_1_2_3.md` | Three AI run-report outputs; historical only; gitignored | Low |
| `docs/ENTERPRISE_COUNCIL_REPORT.md` | AI-generated enterprise report artifact; gitignored | Low |
| `docs/STRATEGY_COUNCIL.md` | AI-generated strategy artifact; not active planning; gitignored | Low |
| `_dump/123.text.txt` | Dump folder junk; gitignored | Low |
| `_dump/README.md` | Dump folder manifest; gitignored | Low |
| `_dump/Untitled.base` | Unknown format artifact; gitignored | Low |
| `_dump/Untitled.canvas` | Obsidian canvas in dump; gitignored | Low |
| `_dump/dump-manifest.txt` | Dump manifest; gitignored | Low |
| `obsidian/` | Empty directory; gitignored; no purpose | Low |
| `frontend/tsconfig.tsbuildinfo` | TS build cache; gitignored; auto-regenerated on build | Low |
| `frontend/next-env.d.ts` | Auto-generated Next.js types; gitignored; regenerated on build | Low |

---

## 5. Manual Review List

| Path                                            | Why Unclear                                                                                                                                                       | How To Verify                                                                                                                         | User Notes/Actions.     |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `docs/CODE_REVIEW.md`                           | Contains detailed security findings and engineering review. Gitignored but may be the best written reference for known code issues. Could be current or outdated. | Read; compare issues raised against git log of known fixes; if still relevant, move key content to README or un-gitignore this file   | KEEP                    |
| `docs/CODE_REVIEW_OPPORTUNITY_REDESIGN.md`      | Could be a reference for the current opportunity page design or a pre-redesign artifact                                                                           | Read the date header; compare against the current opportunity page component structure; if redesign is complete, delete               | DELETE                  |
| `docs/SETUP_INSTRUCTIONS.md`                    | May be an active onboarding doc. The entire `docs/` is gitignored so this is invisible to GitHub viewers.                                                         | Read; if current, move key content to README or un-gitignore just this file; then delete                                              | DELETE                  |
| `docs/PHASE_2_CHECKLIST.md`                     | Could be active planning for Phase 2 features                                                                                                                     | Open; check if items match current development priorities; if yes, move to GitHub Issues or a committed `ROADMAP.md`                  | DELETE                  |
| `docs/proposal-system-supabase-schema-notes.md` | Proposal system has active frontend code. Schema notes could be useful reference.                                                                                 | Read; compare against `backend/migrations/` SQL files; if already captured in migrations, delete; otherwise keep                      | DELETE                  |
| `backend/seed-fake-opportunities.js`            | Dev seeder not referenced in CLAUDE.md. Useful for local setup but not production. Currently tracked by git.                                                      | Run `grep -r "seed-fake" backend/` to check imports; if standalone, move to `local/` (gitignored) or delete                           | Move to (GitIgnorned)   |
| `backend/db/client.js`                          | Not documented in CLAUDE.md architecture section                                                                                                                  | Run `grep -r "require.*client" backend/` to check if imported; if not imported anywhere, delete                                       | What does this file do? |
| `frontend/public/images/tech stack/`            | Six SVGs (figma, nextjs, react, resend, shadcn, tailwind-css). Likely on the marketing landing page but unconfirmed.                                              | Search for the filenames in `frontend/app/(marketing)/` pages; if no `<img src>` or import references found, delete the entire folder | Move to (GitIgnorned)   |

---

## 6. Final Clean Repo Tree

```
AnubisV2/
├── .env.example
├── .gitignore                         ← needs .obsidian/ added
├── .github/
│   └── workflows/
│       └── ci.yml
├── Claude/
│   ├── README.md
│   ├── requirements.txt
│   ├── executor.py
│   ├── docs/
│   │   └── .gitkeep
│   └── skills/
│       ├── anubis-reviewer/SKILL.md
│       ├── execution-driver/SKILL.md
│       └── sow-tracker/SKILL.md
├── CLAUDE.md
├── LICENSE
├── README.md
├── package.json
├── package-lock.json
├── backend/
│   ├── .env.example
│   ├── ai-provider.js
│   ├── package.json
│   ├── package-lock.json
│   ├── schemas.js
│   ├── server.js
│   ├── vercel.json
│   ├── config/env.js
│   ├── db/
│   │   ├── index.js
│   │   ├── jsonStore.js
│   │   └── supabaseStore.js
│   ├── lib/logger.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── rateLimiter.js
│   ├── migrations/
│   │   ├── 001_opportunities.sql
│   │   ├── 002_user_settings.sql
│   │   ├── 003_indexes.sql
│   │   └── 004_activities.sql
│   ├── routes/
│   │   ├── ai.js
│   │   ├── jobs.js
│   │   ├── outreach.js
│   │   ├── settings.js
│   │   └── stats.js
│   └── services/jobService.js
└── frontend/
    ├── .env.example
    ├── components.json
    ├── instrumentation.ts
    ├── middleware.ts
    ├── next.config.js
    ├── package.json
    ├── package-lock.json
    ├── postcss.config.js
    ├── sentry.client.config.ts
    ├── sentry.edge.config.ts
    ├── sentry.server.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── vercel.json
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── auth/callback/page.tsx
    │   ├── (app)/
    │   │   ├── layout.tsx
    │   │   ├── calendar/page.tsx
    │   │   ├── dashboard/page.tsx
    │   │   ├── jobs/page.tsx
    │   │   ├── opportunity/[id]/page.tsx
    │   │   ├── outreach/page.tsx
    │   │   ├── proposal/page.tsx
    │   │   ├── settings/page.tsx
    │   │   └── uploads/page.tsx
    │   └── (marketing)/
    │       ├── layout.tsx
    │       ├── page.tsx
    │       ├── about/page.tsx
    │       ├── admin-login/page.tsx
    │       ├── faq/page.tsx
    │       ├── login/page.tsx
    │       └── pricing/page.tsx
    ├── components/
    │   ├── app-shell.tsx
    │   ├── marketing-shell.tsx
    │   ├── posthog-provider.tsx
    │   ├── theme-provider.tsx
    │   ├── opportunity/  (14 files)
    │   ├── proposal/     (7 files)
    │   └── ui/           (all shadcn primitives)
    ├── hooks/
    │   ├── use-mobile.tsx
    │   └── use-toast.ts
    ├── lib/
    │   ├── api.ts
    │   ├── auth-context.tsx
    │   ├── auth.ts
    │   ├── supabase.ts
    │   ├── utils.ts
    │   ├── providers/
    │   │   ├── aiProvider.ts
    │   │   ├── documentExtractionProvider.ts
    │   │   └── pdfProvider.ts
    │   ├── server/
    │   │   ├── ai.ts
    │   │   ├── auth.ts
    │   │   ├── email.ts
    │   │   ├── r2.ts
    │   │   ├── sms.ts
    │   │   ├── stripe.ts
    │   │   └── supabase.ts
    │   └── services/
    │       ├── aiProposalService.ts
    │       ├── bomService.ts
    │       ├── pdfService.ts
    │       ├── pricingService.ts
    │       ├── proposalDocumentService.ts
    │       ├── proposalService.ts
    │       └── proposalSettingsService.ts
    ├── public/
    │   ├── apple-icon.png
    │   ├── icon-dark-32x32.png
    │   ├── icon-light-32x32.png
    │   ├── icon.svg
    │   └── images/tech stack/   ← pending manual review
    └── types/
        ├── job.ts
        └── proposal.ts
```

> Gitignored but present locally (intentional, not in tree): `.claude/`, `local/`, `backend/.env`, `frontend/.env.local`, `backend/data/jobs.json`, `node_modules/`, `frontend/.next/`

---

## 7. Safe Windows Cleanup Commands

```cmd
:: =============================================================
:: ANUBIS V2 — SAFE CLEANUP COMMANDS
:: Run from: C:\Users\yashn\OneDrive\Desktop\Docs\AI Projects\AnubisV2
:: Backup already confirmed. Commands delete CONFIRMED items only.
:: =============================================================

:: -------------------------------------------------------------
:: STEP 1 — PREVIEW: list all targets before deleting anything
:: -------------------------------------------------------------
dir ".obsidian" /b
dir "_dump" /b
dir "Claude\docs" /b
dir "docs" /b
dir "frontend\tsconfig.tsbuildinfo" 2>nul && echo tsconfig.tsbuildinfo found
dir "frontend\next-env.d.ts" 2>nul && echo next-env.d.ts found
dir "obsidian" /b 2>nul && echo obsidian/ found (empty)

:: -------------------------------------------------------------
:: STEP 2 — REMOVE .obsidian/workspace.json FROM GIT TRACKING
:: Does NOT delete the file — only stops git from tracking it.
:: Run this before any physical deletion.
:: -------------------------------------------------------------
git rm --cached ".obsidian/workspace.json"

:: -------------------------------------------------------------
:: STEP 3 — ADD .obsidian/ TO .gitignore
:: Run after STEP 2.
:: -------------------------------------------------------------
powershell -Command "Add-Content -Path '.gitignore' -Value \"`n# Obsidian IDE config\n.obsidian/\""

:: -------------------------------------------------------------
:: STEP 4 — DELETE .obsidian DIRECTORY (entire)
:: -------------------------------------------------------------
rmdir /s /q ".obsidian"

:: -------------------------------------------------------------
:: STEP 5 — DELETE _dump DIRECTORY (entire)
:: Already gitignored.
:: -------------------------------------------------------------
rmdir /s /q "_dump"

:: -------------------------------------------------------------
:: STEP 6 — DELETE empty obsidian/ DIRECTORY
:: Already gitignored. Empty.
:: -------------------------------------------------------------
rmdir /s /q "obsidian"

:: -------------------------------------------------------------
:: STEP 7 — DELETE generated Claude/docs output files
:: Keep .gitkeep to preserve the directory structure.
:: -------------------------------------------------------------
del "Claude\docs\code_review.md"
del "Claude\docs\execution_plan.md"
del "Claude\docs\scope_of_work.md"

:: -------------------------------------------------------------
:: STEP 8 — DELETE confirmed docs/ generated report artifacts
:: Do NOT delete CODE_REVIEW.md, SETUP_INSTRUCTIONS.md,
:: PHASE_2_CHECKLIST.md, or proposal-system-supabase-schema-notes.md
:: — those are MANUAL_REVIEW items.
:: -------------------------------------------------------------
del "docs\COUNCIL_REVIEW_RUNS_1_2_3.md"
del "docs\ENTERPRISE_COUNCIL_REPORT.md"
del "docs\STRATEGY_COUNCIL.md"

:: -------------------------------------------------------------
:: STEP 9 — DELETE frontend build cache artifacts
:: Both are gitignored and auto-regenerated on next build.
:: -------------------------------------------------------------
del "frontend\tsconfig.tsbuildinfo"
del "frontend\next-env.d.ts"

:: -------------------------------------------------------------
:: STEP 10 — VERIFY
:: -------------------------------------------------------------
git status
```

```powershell
# PowerShell equivalents

# STEP 2 — Remove from git tracking
git rm --cached ".obsidian/workspace.json"

# STEP 3 — Add to .gitignore
"`n# Obsidian IDE config`n.obsidian/" | Add-Content -Path ".gitignore"

# STEP 4 — Delete .obsidian
Remove-Item -Recurse -Force ".obsidian"

# STEP 5 — Delete _dump
Remove-Item -Recurse -Force "_dump"

# STEP 6 — Delete empty obsidian/
Remove-Item -Recurse -Force "obsidian"

# STEP 7 — Delete Claude/docs generated outputs (keep .gitkeep)
Remove-Item -Force "Claude\docs\code_review.md"
Remove-Item -Force "Claude\docs\execution_plan.md"
Remove-Item -Force "Claude\docs\scope_of_work.md"

# STEP 8 — Delete confirmed docs/ artifacts
Remove-Item -Force "docs\COUNCIL_REVIEW_RUNS_1_2_3.md"
Remove-Item -Force "docs\ENTERPRISE_COUNCIL_REPORT.md"
Remove-Item -Force "docs\STRATEGY_COUNCIL.md"

# STEP 9 — Delete build cache
Remove-Item -Force "frontend\tsconfig.tsbuildinfo"
Remove-Item -Force "frontend\next-env.d.ts"

# STEP 10 — Verify
git status
```

---

## 8. Post-Cleanup Verification Checklist

### Git & Environment
- [ ] `git status` — `.obsidian/workspace.json` shows as `D` (deleted from tracking); no unexpected files missing
- [ ] `git diff --cached` — review staged deletions before committing
- [ ] `.obsidian/` is now in `.gitignore`
- [ ] `git ls-files | findstr ".env"` — returns only `.env.example` files; no real secrets tracked
- [ ] `git ls-files backend/.env` — returns empty
- [ ] `git ls-files frontend/.env.local` — returns empty
- [ ] `backend/.env.example` still exists
- [ ] `frontend/.env.example` still exists
- [ ] Root `.env.example` still exists

### Install & Build
- [ ] `npm run install:all` — all deps install cleanly
- [ ] `npm run lint --prefix frontend` — no lint errors
- [ ] `npx tsc --noEmit` (from `frontend/`) — no TypeScript errors
- [ ] `npm run build --prefix frontend` — Next.js builds cleanly; `next-env.d.ts` and `tsconfig.tsbuildinfo` regenerate automatically

### Runtime
- [ ] `npm run dev` from root — backend on port 5000, frontend on port 3000
- [ ] `GET http://localhost:5000/health` returns `{ status: 'ok' }`
- [ ] `GET http://localhost:5000/` returns service status
- [ ] `http://localhost:3000/` loads without console errors

### Core Smoke Test
1. [ ] `/login` — login page renders
2. [ ] Magic link login — redirects to `/dashboard`
3. [ ] Dashboard loads — stats cards render
4. [ ] `/jobs` — job list renders, filtering works
5. [ ] `/opportunity/[id]` — all panels load (CommandStrip, QuickActionBar, ClientProfileDrawer, AIAssistantHub, ScopeOfWork, TaskList, InstallmentTracker, ActivityTimeline, DocumentsSection)
6. [ ] Edit a field (e.g. bid amount) — save succeeds, no 401/500
7. [ ] Generate in AIAssistantHub — AI content returned
8. [ ] Add note via NoteModal — saves with timestamp; does not overwrite existing notes
9. [ ] Log contact action via QuickActionBar — action recorded, last contacted date updates
10. [ ] `/settings` — page renders, saves persist
11. [ ] `/outreach` — page renders without crashing
12. [ ] `/proposal` — page renders without crashing
13. [ ] All AppShell nav links — no 404
14. [ ] Browser console — no unhandled JS errors on any page

### Final Repo State
- [ ] `git ls-files | findstr "obsidian"` — returns empty
- [ ] `Claude/docs/.gitkeep` still exists
- [ ] `backend/migrations/` has all four `.sql` files
- [ ] `.github/workflows/ci.yml` still exists
- [ ] `git log --oneline -3` — history intact

---

## 9. Final Recommendation

**Is the repo safe to clean now?**
Yes. Every confirmed delete candidate is either already gitignored (disk-only cleanup) or is a tracked IDE config file that requires one explicit `git rm --cached` command. Zero risk to app code, builds, or deployments.

**What should be deleted first?**
Run Step 2: `git rm --cached ".obsidian/workspace.json"` — this is the only tracked file being removed and must be done before committing. Then run Steps 3–9 in order.

**What should be manually reviewed first?**
Start with `docs/CODE_REVIEW.md` — it contains security findings and is most likely to have active value. Then check `backend/db/client.js` with a quick grep. The `public/images/tech stack/` SVGs can be verified in under a minute by searching marketing page source.

**What should not be touched?**
Do not touch `backend/seed-fake-opportunities.js` until you verify team usage. Do not touch `docs/SETUP_INSTRUCTIONS.md` or `docs/PHASE_2_CHECKLIST.md` without deciding whether to promote them to the main repo. Do not touch any file in `backend/`, `frontend/`, or `Claude/skills/` without a full import trace.

**Safest next step:**
Run the preview commands in Step 1, review the output, then execute Steps 2–10 in order. Commit with:

```
chore: remove obsidian IDE config from git tracking, clean generated artifacts
```

Then resolve the manual review items and commit a follow-up if any are deleted.
