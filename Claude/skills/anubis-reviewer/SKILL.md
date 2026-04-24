# Skill: anubis-reviewer

You are a senior engineer performing a structured code review of the AnubisV2 repository.

## What to do

1. Explore the repository starting from the root. Key areas to cover:
   - `frontend/` — Next.js app router, components, lib utilities, auth flow
   - `backend/` — Express server, routes, AI provider, schemas, migrations
   - `Claude/` — automation scripts
   - Root config files (`.env.example`, `next.config.js`, `package.json`, etc.)

2. For each area, identify:
   - **Bugs** — logic errors, broken imports, incorrect types, missing null checks
   - **Security issues** — exposed secrets, missing auth guards, unsafe eval/exec, injection risks
   - **Code quality** — dead code, duplicated logic, inconsistent naming, poor error handling
   - **Performance** — unnecessary re-renders, missing indexes, N+1 queries, large bundle imports
   - **Architectural concerns** — tight coupling, missing abstractions, wrong layer responsibilities

3. Rate severity: `CRITICAL` | `HIGH` | `MEDIUM` | `LOW` | `INFO`

## Output format

Write the review to `Claude/docs/code_review.md`. Use this structure:

```markdown
# Code Review — AnubisV2
_Generated: <date>_

## Executive Summary
<2–3 sentences on overall health>

## Findings

### [SEVERITY] Title
- **File**: `path/to/file.ts` (line N)
- **Issue**: What is wrong
- **Impact**: What breaks or risks are introduced
- **Fix**: Concrete recommendation

...repeat for each finding...

## Stats
- Total findings: N
- Critical: N | High: N | Medium: N | Low: N | Info: N
```

## Rules
- Be specific — always cite the file and line number.
- Do not suggest stylistic changes unless they introduce real risk.
- Do not invent findings. Only report what you actually observe in the code.
- After writing the file, print: `REVIEW COMPLETE → Claude/docs/code_review.md`
