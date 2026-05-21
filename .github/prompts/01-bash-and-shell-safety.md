# 01 — Bash & Shell Safety

## Bash tool call format

Every `bash` tool call **must** provide both `command` and `description` as named fields.

```
bash({
  command: "date -u '+%Y-%m-%dT%H:%M:%SZ'",
  description: "Get current UTC timestamp"
})
```

| # | Rule |
|---|------|
| 1 | `command` is a single string (never an array of tokens). |
| 2 | `description` is a short non-empty sentence. |
| 3 | Missing either field → tool-call validation error → fix and retry. |
| 4 | Use `mode: "sync"` by default; raise `initial_wait` (e.g. 120 s) for builds, MCP warm-ups, and analysis pipelines. |
| 5 | Chain dependent commands with `&&` inside one `command` string; separate sessions do not share state unless you pass the same `shellId`. |

## Shell hygiene

| Do | Avoid |
|----|-------|
| Quote every expansion: `"$VAR"`, `"${ARR[@]}"` | Bare `$VAR` adjacent to other text — splitting / glob surprises |
| Use `${VAR:-default}` for defaults | Multi-line `if [ -z "$VAR" ]; then VAR=…; fi` for a simple fallback |
| `set -Eeuo pipefail` at the top of any multi-step inline script | Ignoring non-zero exits |
| `LC_ALL=C.UTF-8 LANG=C.UTF-8` when the step writes Swedish text | Leaving the default C locale, which may corrupt `ö`, `ä`, `å` |
| `$(cmd)` for command substitution | Deprecated backticks `` `cmd` `` |
| Explicit redirection (`> /tmp/out 2> /tmp/err`) | Leaving stderr on the runner log unintentionally |

Parameter expansion (`${VAR}`, `${VAR:-x}`, `${VAR##*/}`, …) and command substitution (`$(cmd)`) are **safe** under the agentic-workflow firewall — the firewall inspects outbound network egress, not shell syntax. Process substitution `<(…)` is best avoided because some runners disable `/dev/fd`.

## Banned expansion patterns (sandbox blocklist)

The execution sandbox **rejects** commands containing any of the following patterns before they run. Rewrite using the safe equivalent instead of trying to work around the block.

| Banned pattern | Why it's blocked | Safe equivalent |
|----------------|------------------|-----------------|
| `${var@P}` / `${var@Q}` / `${var@E}` / `${var@A}` / `${var@a}` | These parameter transformations can produce shell-reparsable fragments or syntax-bearing representations, which can smuggle attacker-controlled content into later parsing steps — a known prompt-injection vector. | Expand the target explicitly: `printf '%s' "$var"`, or a plain `"$var"` substitution. |
| `${!var}` | Indirect expansion uses `$var`'s *value* as another variable name — lets an attacker-controlled string pick which variable is read. | Use an associative array: `declare -A MAP; MAP[foo]=bar; echo "${MAP[$key]}"`. |
| Nested `$(…$(…)…)` | Builds a command string dynamically from inner results — the classic staged injection shape. | Split into two lines with a temporary variable: `inner=$(cmd2); outer=$(cmd1 "$inner")`. |
| Chained builder assignments that progressively construct a command substitution (`a=foo; b="$a"bar; c=$($b)`) | Same staged-injection shape, just spread across multiple statements. | Construct commands as arrays, invoke via `"${cmd[@]}"`; never re-parse a string as a command. |
| `eval` on variable contents (or eval-like constructs such as `bash -c "$var"`, `source /dev/stdin <<<"$var"`) | Direct arbitrary-code execution from data. | Never required for our workflows — refuse and rewrite using arrays, `case`, or explicit branches. |
| `echo "…text $(cmd) more text…"` with other `$(…)` elsewhere in the same `command` string | The gh-aw AWF sandbox (observed across v0.69.3 – v0.74.3) flags any `$(…)` that lives inside a double-quoted echo/printf string alongside a second unrelated `$(…)` as "nested command substitution" even when the two are not nested. This is a false positive but the block still fires. | Split into two lines: `RESULT=$(cmd); echo "…text $RESULT more text…"`. Prefer `printf '%s\n' "$RESULT"` over echo when the value may contain backslashes. |
| Bash arrays built inline and later expanded with `"${arr[@]}"` in the same `command` string, e.g. `REQ=(README.md foo.md); for f in "${REQ[@]}"; do …; done` | The gh-aw AWF sandbox (observed across v0.69.3 – v0.74.3) has flagged the `(…)` + `[@]` combination as a "dangerous expansion" even though the array only contains literal filenames. Treat it as blocked and rewrite. | Write the file list to a temp file and loop over that: `printf '%s\n' README.md foo.md > /tmp/req-$$ && while IFS= read -r f; do …; done < /tmp/req-$$`. For small fixed lists, unroll the loop: `for f in README.md foo.md; do …; done`. |

These rules apply equally to inline bash in prompts AND to bash commands the agent composes at runtime. The sandbox rejects matching commands before they run. **If a command is blocked, do not retry the exact pattern — rewrite using the safe equivalent on the first retry.** Observed cost: each retry burns ~30–60 s of agent wall time, which can push the run past the safeoutputs MCP idle-session window (`07-commit-and-pr.md §Deadline enforcement`).

## File creation & overwrite strategy

When the agent needs to write or replace a repository file (any artifact under `analysis/**`, `news/**`, `executive-brief*.md`, JSON sidecars, etc.), follow this strict hierarchy. **Do not skip tiers.**

### Tier 1 — `edit` tool (default, always-acceptable)

The `edit` tool is enabled on every agentic workflow in this repo (`tools: { edit: }`) and runs inside the AWF sandbox. **Prefer it for every file create or overwrite.** Use one `edit` call per file.

| Why | Detail |
|-----|--------|
| No shell quoting hazards | Content is JSON-encoded in the tool call — backticks, `$`, `\`, `EOF`, RTL marks, CJK, code fences, Mermaid blocks all pass through unchanged. |
| Atomic | Partial writes don't leave half-baked files in the worktree. |
| Token-efficient | Structured tool calls are summarized in transcripts, not re-echoed verbatim like bash heredoc bodies — keeps you under the Copilot per-session token budget. |
| Auditable | The PR-side diff reads as a single intent ("create file X"), not as bash that *produced* file X. |

Use `edit` for **all** of these (non-exhaustive): translated `executive-brief_<lang>.md` files, every `analysis/daily/**/*.md` artifact, `pir-status.json` and other JSON sidecars, methodology-reflection notes, anything ≥ 200 bytes, anything containing any non-ASCII byte or any of `` ` $ \ ' " EOF ``, anything with a code fence or Mermaid block.

### Tier 2 — `cat <<'QUOTED_EOF' > file` (fallback, when `edit` is unavailable)

Acceptable as a fallback **only** when:
1. The `edit` tool returns a hard error (not a content-shape error — retry the `edit` call first), **and**
2. The content is ASCII-only, **and**
3. The content contains no triple-backtick code fence, no Mermaid block, no literal `EOF` marker, no `$`, no `\`, no backticks.

```bash
LC_ALL=C.UTF-8 LANG=C.UTF-8 cat > "$TARGET" <<'EOF_RAW'
…ASCII content here…
EOF_RAW
```

| Rule | Detail |
|------|--------|
| Quote the delimiter | Always `<<'EOF_RAW'` (single-quoted) — unquoted heredocs expand `$VAR` and `$(…)` inside the body, which corrupts URLs, dok-ids, and any text containing `$`. |
| Pick a delimiter that is **not** in the content | If the body might contain the token `EOF`, use a more specific delimiter like `END_BRIEF_2026_05_21`. |
| One file per heredoc | Do not chain multiple heredocs in one `bash` call — each retry then re-emits the whole batch. |
| UTF-8 locale required | Set `LC_ALL=C.UTF-8 LANG=C.UTF-8` so multi-byte characters survive (per the UTF-8 section). |

For short ASCII writes (< 200 bytes, no special characters): `printf '%s\n' "$CONTENT" > "$TARGET"` is also acceptable. `echo "$CONTENT" > file` is **not** — `echo` mangles backslashes and lines starting with `-`.

### Banned for file writes

| Pattern | Why banned |
|---------|------------|
| `python3 -c "open('file','w').write(...)"` / `python3 - <<'PY' … PY` writing repository content | This is a TypeScript project. Python in the file-write critical path obscures intent, doubles transcript token cost vs. `edit`, and is the failure mode that triggered the run-#26248543749 token-budget cancellation (10.4 M effective tokens in 13 min). `python3` is allowed **only** for read-only JSON validation in `05-analysis-gate.md`. |
| `sed -i 's/…/…/' file` on Markdown | Byte-oriented and locale-sensitive — corrupts `ö ä å`, RTL marks, and CJK characters. Use `edit` with str-replace. |
| `echo "$LONG_CONTENT" > file` | `echo` interprets backslashes and `-` flags, silently mangles content. Use `printf '%s\n'` or `edit`. |
| Unquoted heredoc `<<EOF` (no quotes around delimiter) | Performs `$VAR` and `$(…)` expansion in the body — corrupts any text containing `$`. |
| Stacking multiple file writes inside one Python or Node `-e` invocation | Even if individual writes work, the whole tool-call message (with every file body inline) gets replayed on the next transcript turn — O(n²) token blowup. One `edit` call per file is cheaper. |

### Self-check before any file-write `bash` call

If your `bash` command contains any of `>`, `>>`, `<<`, `<<<`, `tee`, `python3`, `sed -i`, or `dd`, **stop and ask**:

1. Am I writing to a path under the repo working tree (anything other than `/tmp/…`)?
2. Could this be expressed as a single `edit` tool call instead?

If both are "yes", switch to `edit`. The Tier-2 heredoc fallback is for the rare case when an `edit` call has demonstrably failed for reasons unrelated to content shape.

## Secret safety

- Never pass secrets through `$(…)` into a log-visible command — echoing `curl -H "Authorization: $(…)"` will leak if the step is rerun in debug.
- Expose secrets through the step's `env:` block (for example `env: { FOO: <GitHub-Actions secrets expression for FOO> }`) rather than inlining a raw secrets expression inside the prompt; the runner masks secret values in output.
- Note: this prompt file is loaded via `runtime-import`, and the gh-aw validator rejects any GitHub Actions template expression (the double-curly-brace syntax used for `secrets`, `env`, `inputs`, etc. in workflow YAML) that is not on the safe allow-list — so never embed such an expression in prompt modules, even inside code spans. Keep secret references in the workflow YAML only.

## Temporary files

- Use `/tmp/<descriptive-name>-$$` (PID suffix) for per-step temp files.
- Delete them before the run ends (or rely on the runner wipe).
- Never write temp files under the repo working tree — they will be picked up by `git add` and leak into the PR.

## UTF-8

- All committed files must be native UTF-8 (`ö`, `ä`, `å`). Never substitute HTML entities (`&ouml;`) for Swedish characters.
- Set `LC_ALL=C.UTF-8 LANG=C.UTF-8` on any bash step that edits markdown or HTML.

## Time-budget self-monitoring (mandatory)

The agent has **no built-in clock**. To be adaptive about the two ~60 min timers
(see `00-base-contract.md §Session timing`) you **must** anchor a start
timestamp on first contact with the runner and consult it before each major
phase transition.

### Anchor (run **once**, in the **very first** `bash` call of the run)

```bash
mkdir -p /tmp/gh-aw
# Idempotent: if a prior call already anchored a start time, keep it.
[ -s /tmp/gh-aw/agent-start.epoch ] || date -u +%s > /tmp/gh-aw/agent-start.epoch
AGENT_START_EPOCH="$(cat /tmp/gh-aw/agent-start.epoch)"
echo "AGENT_START_EPOCH=$AGENT_START_EPOCH ($(date -u -d "@$AGENT_START_EPOCH" '+%Y-%m-%dT%H:%M:%SZ'))"
```

### Check elapsed minutes (run before each phase + before the PR call)

```bash
AGENT_START_EPOCH="$(cat /tmp/gh-aw/agent-start.epoch 2>/dev/null || date -u +%s)"
NOW_EPOCH="$(date -u +%s)"
ELAPSED_MIN=$(( (NOW_EPOCH - AGENT_START_EPOCH) / 60 ))
REMAINING_MIN=$(( 45 - ELAPSED_MIN ))   # 45 = hard PR deadline; 60 = job kill
echo "⏱  agent_minute=$ELAPSED_MIN  remaining_to_pr_deadline=$REMAINING_MIN min"
```

`agent_minute` is the operational clock used throughout the prompt modules
("by agent minute 40", "hard deadline agent minute 45"). The agent **must**
print this telemetry before each phase transition in `04-analysis-pipeline.md`
and immediately before the `safeoutputs___create_pull_request` call.

### Adaptive thresholds (use to scale scope, not skip work)

| `agent_minute` | Adaptive action |
|---:|---|
| **0–25** | Full Pass 1: every artifact at the depth floor in `reference-quality-thresholds.json`. |
| **26–35** | Full Pass 2 read-back + improvements on every artifact. |
| **36–40** | Aggregate + render. Trim Pass 2 polish (not Pass 2 coverage) if needed. |
| **41–42** | **Stop iterating.** Commit + create PR now. |
| **≥ 43** | Emergency deadline (see `07-commit-and-pr.md §Emergency deadline order of operations`) — stage what exists, commit `[early-pr]`, PR immediately. |

Never let `agent_minute ≥ 45` arrive without `safeoutputs___create_pull_request`
having been called — Timer A and Timer B both fire at ~60 min from job start,
which leaves no slack for the safe-outputs runner job.

## Self-check (before issuing a `bash` call)

1. Both `command` and `description` are present and non-empty.
2. Every variable expansion that might contain whitespace or `*` is double-quoted.
3. No backticks, no `<(…)` process substitution.
4. Any file path is absolute or clearly rooted at `$GITHUB_WORKSPACE`.
5. Output redirection (`>`, `| tee`) writes to `/tmp/`, not the repo root.
6. **If this call writes or overwrites a file under the repo working tree, did I reach for the `edit` tool first?** (See `## File creation & overwrite strategy` — Tier-1 `edit`, Tier-2 quoted heredoc, no `python3` for file writes.)
