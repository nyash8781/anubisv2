#!/usr/bin/env python3
"""
executor.py — Drives Claude Sonnet 4.6 to implement planned code changes.

Usage:
    python executor.py \\
        --review  docs/code_review.md \\
        --scope   docs/scope_of_work.md \\
        --plan    docs/execution_plan.md \\
        [--repo   /path/to/repo]          # defaults to this script's directory
        [--state  .executor_state.json]   # where to save/load conversation state
        [--resume]                        # pick up where a previous run left off

Requirements:
    pip install anthropic
    export ANTHROPIC_API_KEY=sk-ant-...
"""

import anthropic
import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

MODEL = "claude-sonnet-4-6"
DEFAULT_STATE_FILE = ".executor_state.json"

# ─── Tool Definitions ────────────────────────────────────────────────────────

TOOLS = [
    {
        "name": "read_file",
        "description": "Read the contents of a file in the repository.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Path relative to the repo root (e.g. frontend/lib/api.ts).",
                }
            },
            "required": ["path"],
        },
    },
    {
        "name": "write_file",
        "description": (
            "Create or overwrite a file in the repository. "
            "Always read the file first before overwriting it."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Path relative to the repo root.",
                },
                "content": {
                    "type": "string",
                    "description": "Complete file content to write.",
                },
            },
            "required": ["path", "content"],
        },
    },
    {
        "name": "run_bash",
        "description": (
            "Run a shell command in the repository root. "
            "Use for git operations, syntax checks, listing files, grep, etc. "
            "Stdout and stderr are returned together."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "command": {
                    "type": "string",
                    "description": "Shell command to run (executed via bash -c).",
                }
            },
            "required": ["command"],
        },
    },
    {
        "name": "list_directory",
        "description": "List files inside a directory, optionally filtered by a glob pattern.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Directory path relative to repo root.",
                },
                "pattern": {
                    "type": "string",
                    "description": "Optional glob pattern, e.g. '**/*.ts'. Default: '*'.",
                },
            },
            "required": ["path"],
        },
    },
    {
        "name": "request_clarification",
        "description": (
            "Pause and ask the user a question before proceeding. "
            "Use this whenever:\n"
            "  - The task or path is ambiguous.\n"
            "  - A change could break existing functionality or public APIs.\n"
            "  - A destructive action (delete, rename, overwrite) needs confirmation.\n"
            "  - You need to choose between two equally valid approaches.\n"
            "Always prefer asking over guessing on irreversible actions."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "question": {
                    "type": "string",
                    "description": "The question to display to the user.",
                },
                "context": {
                    "type": "string",
                    "description": "Why you need this clarification (shown to user).",
                },
            },
            "required": ["question"],
        },
    },
]


# ─── Tool Implementations ────────────────────────────────────────────────────

def tool_read_file(repo_root: Path, path: str) -> str:
    target = (repo_root / path).resolve()
    if not str(target).startswith(str(repo_root)):
        return "[ERROR] Path escapes the repository root."
    try:
        return target.read_text(encoding="utf-8")
    except FileNotFoundError:
        return f"[ERROR] File not found: {path}"
    except Exception as exc:
        return f"[ERROR] Could not read {path}: {exc}"


def tool_write_file(repo_root: Path, path: str, content: str) -> str:
    target = (repo_root / path).resolve()
    if not str(target).startswith(str(repo_root)):
        return "[ERROR] Path escapes the repository root."
    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        lines = content.count("\n") + 1
        return f"[OK] Wrote {len(content)} chars ({lines} lines) to {path}"
    except Exception as exc:
        return f"[ERROR] Could not write {path}: {exc}"


def tool_run_bash(repo_root: Path, command: str) -> str:
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=120,
        )
        output = (result.stdout + result.stderr).strip()
        if result.returncode != 0:
            return f"[exit {result.returncode}]\n{output}" if output else f"[exit {result.returncode}]"
        return output or "[OK] Command completed with no output."
    except subprocess.TimeoutExpired:
        return "[ERROR] Command timed out after 120 seconds."
    except Exception as exc:
        return f"[ERROR] {exc}"


def tool_list_directory(repo_root: Path, path: str, pattern: str = "*") -> str:
    target = repo_root / path
    try:
        files = sorted(target.glob(pattern))
        if not files:
            return "[empty — no matching files]"
        return "\n".join(str(f.relative_to(repo_root)) for f in files[:200])
    except Exception as exc:
        return f"[ERROR] {exc}"


def tool_request_clarification(question: str, context: str = "") -> str:
    print("\n" + "─" * 64)
    print("  CLARIFICATION NEEDED")
    if context:
        print(f"\n  Context: {context}")
    print(f"\n  {question}")
    print("─" * 64)
    try:
        answer = input("  Your answer: ").strip()
        print()
        return answer if answer else "(no answer provided — please proceed with your best judgement)"
    except (EOFError, KeyboardInterrupt):
        print("\n[Interrupted]")
        return "(user interrupted the session)"


def dispatch_tool(repo_root: Path, name: str, inp: dict) -> str:
    """Route a tool_use block to the right implementation."""
    if name == "read_file":
        return tool_read_file(repo_root, inp["path"])
    if name == "write_file":
        return tool_write_file(repo_root, inp["path"], inp["content"])
    if name == "run_bash":
        return tool_run_bash(repo_root, inp["command"])
    if name == "list_directory":
        return tool_list_directory(repo_root, inp["path"], inp.get("pattern", "*"))
    if name == "request_clarification":
        return tool_request_clarification(inp["question"], inp.get("context", ""))
    return f"[ERROR] Unknown tool: {name}"


# ─── API Call with Rate-Limit Retry ──────────────────────────────────────────

def call_claude(
    client: anthropic.Anthropic,
    messages: list,
    system: str,
) -> anthropic.types.Message:
    """
    Call Claude Sonnet 4.6 and retry automatically on rate-limit (429) and
    overload (529) errors.  Reads the Retry-After header when present.
    Prints a live countdown so the user knows the script is alive.
    """
    backoff = 60  # seconds; doubles each retry, caps at 3600
    attempt = 0

    while True:
        attempt += 1
        try:
            return client.messages.create(
                model=MODEL,
                max_tokens=8096,
                system=system,
                messages=messages,
                tools=TOOLS,
            )

        except anthropic.RateLimitError as exc:
            # Try to honour the server's Retry-After hint
            retry_after = _parse_retry_after(exc)
            wait = (retry_after + 5) if retry_after else backoff
            ts = _reset_timestamp(wait)
            print(
                f"\n[RATE LIMIT] Usage limit hit (attempt {attempt}). "
                f"Waiting {_fmt_duration(wait)} — resumes at {ts}."
            )
            _countdown(wait)
            backoff = min(backoff * 2, 3600)

        except anthropic.APIStatusError as exc:
            if exc.status_code == 529:
                print(
                    f"\n[OVERLOAD] API overloaded (attempt {attempt}). "
                    f"Waiting {_fmt_duration(backoff)}…"
                )
                _countdown(backoff)
                backoff = min(backoff * 2, 300)
            else:
                raise


def _parse_retry_after(exc: anthropic.RateLimitError) -> int | None:
    """Extract Retry-After seconds from the error's response headers, if present."""
    try:
        val = exc.response.headers.get("retry-after") or exc.response.headers.get("x-ratelimit-reset-requests")
        if val and val.isdigit():
            return int(val)
    except Exception:
        pass
    return None


def _reset_timestamp(seconds: int) -> str:
    from datetime import datetime, timedelta
    return (datetime.now() + timedelta(seconds=seconds)).strftime("%H:%M:%S")


def _fmt_duration(seconds: int) -> str:
    if seconds < 60:
        return f"{seconds}s"
    m, s = divmod(seconds, 60)
    return f"{m}m {s:02d}s"


def _countdown(seconds: int) -> None:
    for remaining in range(seconds, 0, -1):
        print(f"\r  Resuming in {_fmt_duration(remaining)}…  ", end="", flush=True)
        time.sleep(1)
    print("\r  Retrying now…                        ")


# ─── State Persistence ────────────────────────────────────────────────────────

def _serialize_content(content) -> list:
    """Convert SDK content blocks (Pydantic models) to plain dicts for JSON."""
    if isinstance(content, list):
        return [_serialize_content(b) for b in content]
    if hasattr(content, "model_dump"):
        return content.model_dump()
    return content  # already a dict or primitive


def save_state(state_path: Path, messages: list) -> None:
    try:
        state_path.write_text(
            json.dumps({"messages": messages}, indent=2, default=str),
            encoding="utf-8",
        )
    except Exception as exc:
        print(f"[WARN] Could not save state: {exc}")


def load_state(state_path: Path) -> list:
    if not state_path.exists():
        return []
    try:
        data = json.loads(state_path.read_text(encoding="utf-8"))
        return data.get("messages", [])
    except Exception as exc:
        print(f"[WARN] Could not load state file ({exc}) — starting fresh.")
        return []


# ─── Main Agentic Loop ────────────────────────────────────────────────────────

def run(
    repo_root: Path,
    code_review: str,
    scope: str,
    plan: str,
    state_path: Path,
    resume: bool,
) -> None:
    client = anthropic.Anthropic()

    system = f"""You are an expert software engineer implementing planned changes to the Anubis project.

You have three planning documents to work from:

=== CODE REVIEW ===
{code_review}

=== SCOPE OF WORK ===
{scope}

=== EXECUTION PLAN ===
{plan}

Repository root: {repo_root}

─── Rules ────────────────────────────────────────────────────────────────────
1. Work through the execution plan in order, one task at a time.
2. Read files with read_file before editing them — never make blind changes.
3. After each file edit, briefly state what changed and why.
4. Use request_clarification BEFORE any of these:
     • Deleting or renaming files/exports used elsewhere
     • Changing a public API signature
     • A decision the plan doesn't clearly resolve
     • Any destructive or hard-to-reverse action
5. Run bash checks (e.g. node -c, tsc --noEmit) after edits where practical.
6. When all tasks are complete, output a concise summary of every change made.
──────────────────────────────────────────────────────────────────────────────"""

    # Load or initialise the conversation
    messages = load_state(state_path) if resume else []

    if resume and messages:
        print(f"[Executor] Resuming — {len(messages)} messages loaded from {state_path}")
    else:
        messages = [
            {
                "role": "user",
                "content": (
                    "Please implement the execution plan now. "
                    "Start with the first task, read each file before editing it, "
                    "and use request_clarification whenever anything is unclear."
                ),
            }
        ]
        print(f"[Executor] Model  : {MODEL}")
        print(f"[Executor] Repo   : {repo_root}")
        print(f"[Executor] State  : {state_path}\n")

    save_state(state_path, messages)

    # ── Agentic loop ──────────────────────────────────────────────────────────
    while True:
        response = call_claude(client, messages, system)

        # Print Claude's text output
        for block in response.content:
            if block.type == "text" and block.text.strip():
                print(f"\nClaude:\n{block.text}")

        # Persist the assistant turn
        messages.append({
            "role": "assistant",
            "content": _serialize_content(response.content),
        })
        save_state(state_path, messages)

        # ── Natural end ───────────────────────────────────────────────────────
        if response.stop_reason == "end_turn":
            print("\n[Executor] Done — all tasks completed.")
            state_path.unlink(missing_ok=True)
            break

        # ── Tool calls ────────────────────────────────────────────────────────
        if response.stop_reason == "tool_use":
            tool_results = []

            for block in response.content:
                if block.type != "tool_use":
                    continue

                name = block.name
                inp  = block.input
                preview = ", ".join(
                    f"{k}={repr(v)[:80]}" for k, v in inp.items() if k != "content"
                )
                print(f"\n  → {name}({preview})")

                result = dispatch_tool(repo_root, name, inp)

                # Show a short preview of the result (not for write_file content)
                if name not in ("write_file",) and result:
                    preview_lines = result.split("\n")[:5]
                    truncated = "\n    ".join(preview_lines)
                    if len(result.split("\n")) > 5:
                        truncated += "\n    …"
                    print(f"    {truncated}")

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result,
                })

            messages.append({"role": "user", "content": tool_results})
            save_state(state_path, messages)
            # Loop continues → next call_claude

        else:
            # Unexpected stop reason (pause_turn, etc.) — nudge Claude to continue
            messages.append({
                "role": "user",
                "content": f"Continue. (stop_reason: {response.stop_reason})",
            })
            save_state(state_path, messages)


# ─── Entry Point ─────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Drive Claude Sonnet 4.6 to implement planned code changes.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--review",  required=True, help="Path to the Code Review document")
    parser.add_argument("--scope",   required=True, help="Path to the Scope of Work document")
    parser.add_argument("--plan",    required=True, help="Path to the Execution Plan document")
    parser.add_argument(
        "--repo",
        default=str(Path(__file__).parent),
        help="Repository root (default: directory containing this script)",
    )
    parser.add_argument(
        "--state",
        default=DEFAULT_STATE_FILE,
        help=f"State file for resume support (default: {DEFAULT_STATE_FILE})",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Resume from a previous run using the state file",
    )
    args = parser.parse_args()

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("[ERROR] ANTHROPIC_API_KEY is not set.")
        sys.exit(1)

    repo_root  = Path(args.repo).resolve()
    state_path = Path(args.state)

    def load_doc(label: str, path: str) -> str:
        p = Path(path)
        if not p.exists():
            print(f"[ERROR] {label} not found: {path}")
            sys.exit(1)
        text = p.read_text(encoding="utf-8")
        print(f"[Executor] {label:<12}: {path}  ({len(text)} chars)")
        return text

    code_review = load_doc("Code Review", args.review)
    scope       = load_doc("Scope",       args.scope)
    plan        = load_doc("Plan",        args.plan)

    import os as _os  # already imported above, just satisfying the linter
    run(repo_root, code_review, scope, plan, state_path, args.resume)


if __name__ == "__main__":
    main()
