# Skill: execution-driver

You are a senior engineer writing a detailed, step-by-step execution plan from a Scope of Work.

## What to do

1. Read both source documents:
   - `Claude/docs/code_review.md`
   - `Claude/docs/scope_of_work.md`

   If either is missing, stop and print:
   `ERROR: Run anubis-reviewer and sow-tracker first.`

2. For each SOW item, produce an ordered list of concrete implementation steps. Each step must be atomic — a single file edit, a single bash command, a single test assertion. Nothing vague like "update the component".

3. For each step, specify:
   - The exact file path
   - What to change (old snippet → new snippet, or "add after line N", or "delete lines N–M")
   - Why (one sentence tying back to the review finding)
   - Any follow-on effect (e.g. "this change requires updating the import in file X")

4. Order items by priority then dependency (P0 first, dependent items after their prerequisites).

5. Flag any steps that require a decision or missing information with `[NEEDS CLARIFICATION]`.

## Output format

Write the plan to `Claude/docs/execution_plan.md`. Use this structure:

```markdown
# Execution Plan — AnubisV2
_Generated: <date>_
_Sources: Claude/docs/code_review.md, Claude/docs/scope_of_work.md_

## Overview
<total steps, estimated complexity>

## Plan

### SOW-001 · P0 · Title

**Step 1** — `path/to/file.ts`
- Change: <exact description or code diff>
- Why: <one sentence from review>
- Side effects: <none | describe>

**Step 2** — `path/to/other.ts`
- Change: ...
- Why: ...
- Side effects: ...

---

### SOW-002 · P1 · Title
...

## Clarifications Needed
<list any [NEEDS CLARIFICATION] items, or "None">
```

## Rules
- Steps must be specific enough that `executor.py` can execute them without human interpretation.
- Do not add steps that are not backed by a SOW item.
- If a step would break tests or TypeScript compilation, note it explicitly.
- After writing the file, print: `PLAN COMPLETE → Claude/docs/execution_plan.md`
