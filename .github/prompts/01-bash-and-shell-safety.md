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

## Secret safety

- Never pass secrets through `$(…)` into a log-visible command — echoing `curl -H "Authorization: $(…)"` will leak if the step is rerun in debug.
- Expose secrets through the step's `env:` block (for example `env: { FOO: <GitHub-Actions secrets expression for FOO> }`) rather than inlining a raw secrets expression inside the prompt; the runner masks secret values in output.
- Note: this prompt file is loaded via `runtime-import`, and the gh-aw validator rejects any literal GitHub Actions expression (the `dollar-brace-brace … brace-brace` syntax) that is not on the safe allow-list — so never embed a raw secrets-expression token in prompt modules, even inside code spans. Keep secret references in the workflow YAML only.

## Temporary files

- Use `/tmp/<descriptive-name>-$$` (PID suffix) for per-step temp files.
- Delete them before the run ends (or rely on the runner wipe).
- Never write temp files under the repo working tree — they will be picked up by `git add` and leak into the PR.

## UTF-8

- All committed files must be native UTF-8 (`ö`, `ä`, `å`). Never substitute HTML entities (`&ouml;`) for Swedish characters.
- Set `LC_ALL=C.UTF-8 LANG=C.UTF-8` on any bash step that edits markdown or HTML.

## Self-check (before issuing a `bash` call)

1. Both `command` and `description` are present and non-empty.
2. Every variable expansion that might contain whitespace or `*` is double-quoted.
3. No backticks, no `<(…)` process substitution.
4. Any file path is absolute or clearly rooted at `$GITHUB_WORKSPACE`.
5. Output redirection (`>`, `| tee`) writes to `/tmp/`, not the repo root.
