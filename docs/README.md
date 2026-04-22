# Anubis-Alpha — Docs index

## In this repo

- **[MIGRATION_TODO.md](MIGRATION_TODO.md)** — Step-by-step for dropping AnubisV2 code into this scaffold. **Start here.**
- **[PUBLIC_CLEANUP.md](PUBLIC_CLEANUP.md)** — Which files to delete from `/public` and why.
- **[MERGE_NOTES.md](MERGE_NOTES.md)** — Structural decisions made in the Alpha merge.
- **[FEATURES.md](FEATURES.md)** — Feature status mapped to the new route structure.

## Copy from AnubisV2/docs/ into this folder

Your AnubisV2 repo already has these detailed docs. Copy them verbatim into `anubis-alpha/docs/`:

- `ROADMAP_CHECKLIST.md` — 8-week launch plan, week-by-week, with checkboxes
- `CLOUD_ROADMAP.md` — Stack decisions, budget breakdown, KPI scorecard
- `CODE_REVIEW.md` — Senior-engineer baseline review with all P1/P2/P3 issues

They're still accurate against this scaffold — the feature priorities, stack picks, and cost estimates didn't change in the merge.

---

## Reading order

For a developer new to the project:
1. Root `README.md`
2. `MERGE_NOTES.md` — what changed in the Alpha merge
3. `MIGRATION_TODO.md` — the migration checklist
4. `FEATURES.md` — current feature status
5. `ROADMAP_CHECKLIST.md` (from AnubisV2) — what ships when
6. `CODE_REVIEW.md` (from AnubisV2) — baseline review, for context
7. `CLOUD_ROADMAP.md` (from AnubisV2) — stack reasoning, for context
8. `PUBLIC_CLEANUP.md` — before going public
