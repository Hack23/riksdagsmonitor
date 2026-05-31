# 01 — Bash & Shell Safety

## Bash tool call format

Every `bash` call provides both `command` and `description` as named fields.

```
bash({
  command: "date -u '+%Y-%m-%dT%H:%M:%SZ'",
  description: "Get current UTC timestamp"
})
```

| Rule | Detail |
|------|--------|
| `command` | Single string. Chain dependent steps with `&&`. |
| `description` | Short non-empty sentence. |
| Mode | `sync` by default; raise `initial_wait` (≥ 120 s) for builds, MCP warm-ups, analysis pipelines. |
| Sessions | Pass the same `shellId` to share state between calls. |

## Shell hygiene

| Do | Avoid |
|----|-------|
| Quote every expansion: `"$VAR"`, `"${ARR[@]}"` | Bare `$VAR` adjacent to other text |
| Use `${VAR:-default}` for defaults | `if [ -z "$VAR" ]; then VAR=…` for a simple fallback |
| `set -Eeuo pipefail` at the top of any multi-step inline script | Ignoring non-zero exits |
| `LC_ALL=C.UTF-8 LANG=C.UTF-8` when writing Swedish text | Leaving the default locale — corrupts `ö ä å` |
| `$(cmd)` for command substitution | Backticks `` `cmd` `` |
| Explicit redirection (`> /tmp/out 2> /tmp/err`) | Leaving stderr on the runner log |

Parameter expansion (`${VAR}`, `${VAR:-x}`, `${VAR##*/}`) and `$(cmd)` are safe under the AWF firewall — the firewall inspects egress, not shell syntax. Avoid process substitution `<(…)` (some runners disable `/dev/fd`).

## Banned expansion patterns (sandbox blocklist)

The AWF sandbox rejects any command containing these patterns. Rewrite using the safe equivalent on the first retry — do not retry the exact pattern (each retry burns ~30–60 s).

| Banned pattern | Why | Safe equivalent |
|----------------|-----|-----------------|
| `${var@P}` / `${var@Q}` / `${var@E}` / `${var@A}` / `${var@a}` | Produces shell-reparsable fragments — prompt-injection vector. | `printf '%s' "$var"`, or plain `"$var"`. |
| `${!var}` | Indirect expansion — attacker-controlled string picks which variable is read. | Associative array: `declare -A MAP; MAP[foo]=bar; echo "${MAP[$key]}"`. |
| Nested `$(…$(…)…)` | Staged command injection. | Two lines: `inner=$(cmd2); outer=$(cmd1 "$inner")`. |
| Chained builder assignments (`a=foo; b="$a"bar; c=$($b)`) | Staged injection spread across statements. | Arrays invoked via `"${cmd[@]}"`; never re-parse a string as a command. |
| `eval` on variable contents, `bash -c "$var"`, `source /dev/stdin <<<"$var"` | Direct arbitrary-code execution from data. Never required. | Refuse and rewrite using arrays, `case`, explicit branches. |
| `echo "…text $(cmd) more text…"` with another `$(…)` elsewhere in the same `command` string | AWF flags this as "nested command substitution" (false positive but still blocks). | Two lines: `RESULT=$(cmd); echo "…text $RESULT more text…"`. Prefer `printf '%s\n' "$RESULT"` if the value may contain backslashes. |
| Inline-built arrays expanded with `"${arr[@]}"` in the same `command` string | AWF flags `(…)` + `[@]` as "dangerous expansion". | Write the list to a temp file and loop: `printf '%s\n' README.md foo.md > /tmp/req-$$ && while IFS= read -r f; do …; done < /tmp/req-$$`. Or unroll: `for f in README.md foo.md; do …; done`. |

These rules apply to inline bash in prompts and to bash the agent composes at runtime.

## File creation & overwrite strategy

**Use the `edit` tool.** `cat <<'QUOTED_EOF'` heredoc is the only fallback. No interpreter writes files.

### Tier 1 — `edit` tool (default)

`edit` is enabled on every workflow (`tools: { edit: }`) and runs inside the AWF sandbox. Every file create or overwrite goes through `edit`, one call per file.

| Why | Detail |
|-----|--------|
| No shell quoting hazards | Content is JSON-encoded — backticks, `$`, `\`, `EOF`, RTL marks, CJK, code fences, Mermaid all pass through. |
| Atomic | Partial writes never leave half-baked files in the worktree. |
| Token-efficient | Structured tool calls are summarized in transcripts (not re-echoed). |
| Auditable | PR diff reads as "create file X", not bash that *produced* X. |

Use `edit` for: every `analysis/daily/**/*.md`, every `executive-brief*.md`, JSON sidecars (`pir-status.json`, …), methodology-reflection notes, anything ≥ 200 bytes, anything with non-ASCII, code fences, or Mermaid blocks.

### Tier 2 — `cat <<'QUOTED_EOF' > file` (fallback only)

Acceptable **only** when all four hold:

1. `edit` was retried once and returned a hard error unrelated to content shape, AND
2. Content is ASCII-only (no `ö ä å`, no RTL, no CJK, no emoji), AND
3. Content contains no triple-backtick code fence, no Mermaid block, no literal `EOF` marker, no `$`, no `\`, no backticks, AND
4. File is < 200 lines.

```bash
LC_ALL=C.UTF-8 LANG=C.UTF-8 cat > "$TARGET" <<'EOF_RAW'
…ASCII content here…
EOF_RAW
```

| Rule | Detail |
|------|--------|
| Quote the delimiter | `<<'EOF_RAW'` (single-quoted). Unquoted heredocs expand `$VAR` / `$(…)` in the body and corrupt URLs, dok-ids, anything with `$`. |
| Pick a delimiter not in the content | If the body might contain `EOF`, use `END_BRIEF_2026_05_21`. |
| One file per heredoc | Each retry re-emits the whole batch — keep them split. |
| UTF-8 locale | `LC_ALL=C.UTF-8 LANG=C.UTF-8` on every step writing markdown / HTML. |

For short ASCII writes (< 200 bytes, no special chars) targeting `/tmp/` only, `printf '%s\n' "$CONTENT" > "$TARGET"` is acceptable. `echo "$CONTENT" > file` is not — `echo` mangles backslashes and lines starting with `-`. For any target under the repo working tree, use `edit` regardless of size.

### Banned for file writes

| Banned pattern | Why |
|----------------|-----|
| `python3` / `node -e` / `perl -e` / `ruby -e` writing repository files | Obscures intent, doubles transcript token cost vs. `edit`, triggered the 10.4 M-token cancellation (run [#26248543749](https://github.com/Hack23/riksdagsmonitor/actions/runs/26248543749)). **Sole exception**: the read-only JSON validator at [`05-analysis-gate.md:339`](05-analysis-gate.md) parses a file and exits — it never writes. |
| `sed -i` on Markdown | Byte-oriented and locale-sensitive; corrupts `ö ä å`, RTL marks, CJK. Use `edit` str-replace. |
| `echo "$LONG_CONTENT" > file` | `echo` interprets backslashes and `-` flags. Use `printf '%s\n'` for short ASCII or `edit` for everything else. |
| Unquoted heredoc `<<EOF` for content writes | Expands `$VAR` / `$(…)` in the body. Sole allowed unquoted heredoc: the env-var-only pre-flight scaffold in [`03-data-download.md`](03-data-download.md) (≤ 20 lines, env-var references and short literals only — no agent-generated content). |
| Multiple file writes inside one Python/Node `-e` invocation | Whole tool-call message (with every file body inline) replays each turn → O(n²) token blowup. |
| `tee "$FILE"` for content writes | Same hazards as `cat >` plus stdout duplication. `tee` is fine for log capture (`… 2>&1 | tee /tmp/pipeline.log`). |

Self-check before any file-write `bash` call: if the command contains `>`, `>>`, `<<`, `<<<`, `tee`, `python3`, `sed -i`, or `dd`, and the target is under the repo working tree (anything other than `/tmp/`), switch to `edit`. **Sole exception**: the env-var-only pre-flight scaffold heredoc in [`03-data-download.md`](03-data-download.md) (creates the initial `data-download-manifest.md` marker when missing) — this uses an unquoted heredoc with only env-var references and short literals, never agent-generated content.

## Secret safety

- Expose secrets through the step's `env:` block; the runner masks values in output.
- This prompt is loaded via `runtime-import` and the gh-aw validator rejects any GitHub Actions template expression (the double-curly-brace syntax for `secrets` / `env` / `inputs`) not on the safe allow-list. Keep secret references in workflow YAML, never in prompt modules.
- Do not pass secrets through `$(…)` into a log-visible command (`curl -H "Authorization: $(…)"` leaks on debug rerun).

## Temporary files

- Use `/tmp/<descriptive-name>-$$` (PID suffix).
- Delete before run ends, or rely on the runner wipe.
- Never write temp files under the repo working tree — `git add` would pick them up.

## UTF-8

- Native UTF-8 throughout (`ö`, `ä`, `å`). No HTML entities (`&ouml;`).
- `LC_ALL=C.UTF-8 LANG=C.UTF-8` on any bash step editing markdown or HTML.

## Time-budget self-monitoring

The agent has no built-in clock. Anchor a start timestamp on first contact, then consult it before every phase transition.

### Anchor (run once, in the **first** `bash` call of the run)

```bash
mkdir -p /tmp/gh-aw
# Idempotent: keep prior anchor if a previous call already wrote one.
[ -s /tmp/gh-aw/agent-start.epoch ] || date -u +%s > /tmp/gh-aw/agent-start.epoch
AGENT_START_EPOCH="$(cat /tmp/gh-aw/agent-start.epoch)"
echo "AGENT_START_EPOCH=$AGENT_START_EPOCH ($(date -u -d "@$AGENT_START_EPOCH" '+%Y-%m-%dT%H:%M:%SZ'))"
```

### Check elapsed minutes (before each phase + before the PR call)

```bash
AGENT_START_EPOCH="$(cat /tmp/gh-aw/agent-start.epoch 2>/dev/null || date -u +%s)"
NOW_EPOCH="$(date -u +%s)"
ELAPSED_MIN=$(( (NOW_EPOCH - AGENT_START_EPOCH) / 60 ))
REMAINING_MIN=$(( 45 - ELAPSED_MIN ))   # 45 = hard PR deadline; 60 = job kill
echo "⏱  agent_minute=$ELAPSED_MIN  remaining_to_pr_deadline=$REMAINING_MIN min"
```

`agent_minute` is the operational clock used across the prompt modules. Print this telemetry before each phase transition in `04-analysis-pipeline.md` and immediately before the PR call.

### Adaptive thresholds (scale scope, never skip work)

| `agent_minute` | Action |
|---:|---|
| **0–25** | Full Pass 1: every artifact at the depth floor in `reference-quality-thresholds.json`. |
| **26–35** | Full Pass 2 read-back + improvements on every artifact. |
| **36–40** | Aggregate + render. Trim Pass 2 polish (not Pass 2 coverage) if needed. |
| **41–42** | Stop iterating. Commit + PR now. |
| **≥ 43** | Emergency deadline (see [`07-commit-and-pr.md §Emergency deadline order of operations`](07-commit-and-pr.md)) — stage what exists, commit `[early-pr]`, PR immediately. |

Call `safeoutputs___create_pull_request` before `agent_minute = 45`. Timer A and Timer B both fire at ~60 min from job start; the safe-outputs runner job needs the remaining slack.

### Mandatory mid-run checkpoint

> 🔴 **At agent_minute 20, run this checkpoint unconditionally.** This prevents the catastrophic failure mode where the agent consumes its entire token budget on data gathering and analysis without ever reaching the PR stage.

```bash
AGENT_START_EPOCH="$(cat /tmp/gh-aw/agent-start.epoch 2>/dev/null || date -u +%s)"
NOW_EPOCH="$(date -u +%s)"
ELAPSED_MIN=$(( (NOW_EPOCH - AGENT_START_EPOCH) / 60 ))
echo "🔴 MID-RUN CHECKPOINT at agent_minute=$ELAPSED_MIN"
if [ "$ELAPSED_MIN" -ge 20 ]; then
  ANALYSIS_DIR="analysis/daily/$ARTICLE_DATE/$SUBFOLDER"
  ARTIFACT_COUNT=$(find "$ANALYSIS_DIR" -name '*.md' 2>/dev/null | wc -l)
  echo "📊 Artifacts on disk: $ARTIFACT_COUNT"
  if [ "$ARTIFACT_COUNT" -eq 0 ]; then
    echo "⚠️ WARNING: 20+ minutes elapsed with ZERO artifacts. COMPRESS SCOPE NOW."
    echo "   → Skip remaining data downloads"
    echo "   → Write minimal analysis artifacts immediately"
    echo "   → Target PR by agent_minute 35"
  fi
fi
```

**If agent_minute ≥ 35 and no files exist under `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/`:** STOP all work. Write a minimal `data-download-manifest.md` documenting what was attempted, commit it, and call `safeoutputs___create_pull_request` with label `partial`. Do not attempt further analysis. A one-file PR documenting the failure is infinitely better than zero output.

## Self-check (before issuing a `bash` call)

1. `command` and `description` both present and non-empty.
2. Every expansion that might contain whitespace or `*` is double-quoted.
3. No backticks, no `<(…)` process substitution.
4. File paths are absolute or rooted at `$GITHUB_WORKSPACE`.
5. Output redirection (`>`, `| tee`) writes to `/tmp/`, not the repo root.
6. If the call writes or overwrites a file under the repo working tree, switch to `edit` (see `## File creation & overwrite strategy`). **Sole exception**: the env-var-only pre-flight scaffold heredoc in [`03-data-download.md`](03-data-download.md) — it creates the initial `data-download-manifest.md` marker (≤ 20 lines, env-var references and short literals only, never agent-generated content).
