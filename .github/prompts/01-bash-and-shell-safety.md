# 01 — Bash & Shell Safety

## Bash tool call format

Every `bash` tool call **must** provide both `command` and `description` as named fields.

```
bash({
  command: "date -u '+%Y-%m-%dT%H:%M:%SZ'",
  description: "Get current UTC timestamp"
})
```

Rules:

| # | Rule |
|---|------|
| 1 | `command` is a single string (never an array of tokens). |
| 2 | `description` is a short non-empty sentence. |
| 3 | Missing either field → tool-call validation error → fix and retry. |
| 4 | Use `mode: "sync"` by default; increase `initial_wait` (e.g. 120 s) for builds, MCP warm-ups, and analysis pipelines. |
| 5 | Chain dependent commands with `&&` inside one `command` string to avoid lost context. |

## AWF shell safety

The agentic workflow firewall rewrites commands. Write commands that do not depend on command substitution, brace expansion, or process substitution.

| Use | Instead of |
|-----|------------|
| `$VAR` | `${VAR}` |
| `find DIR -name '*.md' -exec cat {} +` | `for f in "$DIR"/*.md; do cat "$f"; done` with `$(...)` |
| Write intermediate result to a temp file, then `read VAR < /tmp/file` | `VAR=$(command)` |
| `if [ -z "$VAR" ]; then VAR=default; fi` | `${VAR:-default}` |
| `printf '%s\n' "$VAR"` | `echo "$VAR"` when the value may contain `-e`, `-n`, backslashes |

## Temporary files

- Use `/tmp/<descriptive-name>-$$` (PID suffix) for per-step temp files.
- Delete them before the run ends.
- Never write temp files under the repo path — they will be staged by `git add`.

## UTF-8

- All created files must be native UTF-8; never substitute HTML entities for Swedish characters.
- Set `LC_ALL=C.UTF-8 LANG=C.UTF-8` at the top of any bash step that manipulates text files.

## Self-check

Before issuing a `bash` call, verify:

1. Both `command` and `description` fields are present and non-empty.
2. No `$(...)`, `${VAR}`, or `<(...)` tokens in the command string.
3. Any file path is absolute or clearly rooted at `$GITHUB_WORKSPACE` / the current working directory.
4. Output redirection (`>`, `| tee`) writes to `/tmp/`, not the repo root.
