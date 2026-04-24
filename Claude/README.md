# Claude/ — Automation Toolkit

This folder contains the agentic automation pipeline for AnubisV2.
The entire folder can be deleted without affecting the application.

---

## Workflow

```
1. anubis-reviewer   →  Claude/docs/code_review.md
2. sow-tracker       →  Claude/docs/scope_of_work.md
3. execution-driver  →  Claude/docs/execution_plan.md
4. executor.py       →  implements the plan in the repo
```

### Step 1 – Run the 3 skills locally via Claude Code

From inside the repo root, run each skill in order:

```bash
claude skills/anubis-reviewer    # generates code_review.md
claude skills/sow-tracker        # generates scope_of_work.md
claude skills/execution-driver   # generates execution_plan.md
```

Each skill reads the previous skill's output and writes its own document to `Claude/docs/`.

### Step 2 – Run executor.py

Install dependencies once:

```bash
pip install -r Claude/requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...
```

Run the executor:

```bash
python Claude/executor.py \
    --review  Claude/docs/code_review.md \
    --scope   Claude/docs/scope_of_work.md \
    --plan    Claude/docs/execution_plan.md \
    --repo    .
```

Resume an interrupted run:

```bash
python Claude/executor.py \
    --review  Claude/docs/code_review.md \
    --scope   Claude/docs/scope_of_work.md \
    --plan    Claude/docs/execution_plan.md \
    --resume
```

---

## Files

| Path | Purpose |
|------|---------|
| `executor.py` | Agentic loop that reads the 3 docs and drives code changes via Claude Sonnet 4.6 |
| `requirements.txt` | Python deps (`anthropic` SDK) — install with `pip install -r requirements.txt` |
| `skills/anubis-reviewer/SKILL.md` | Skill: full repo code review → `docs/code_review.md` |
| `skills/sow-tracker/SKILL.md` | Skill: SOW from review → `docs/scope_of_work.md` |
| `skills/execution-driver/SKILL.md` | Skill: step-by-step plan from SOW → `docs/execution_plan.md` |
| `docs/` | Output folder for generated documents (git-ignored content) |
