# Sandbox commit handoff protocol

> **Why this exists.** gh-aw runs the agent inside an ephemeral sandbox. Any `git commit` the agent makes lives only in that sandbox until `safeoutputs___create_pull_request` ships it to GitHub. When the safeoutputs Streamable-HTTP MCP session expires (Timer C, ~25–30 min idle), the PR call fails with `Error POSTing to endpoint: session not found` and the commit is **lost** — the sandbox is destroyed at job end and the branch never reaches origin.
>
> The Sandbox commit handoff protocol guarantees a recovery path by exporting every sandbox commit as a portable `git bundle` plus a JSON manifest, which the gh-aw `agent` artifact upload step automatically carries to a host-side recovery job. The host job replays the commit to origin under a repo PAT and opens the PR.

## Reference incident

The protocol exists because of [`Hack23/euparliamentmonitor` run 25028873034](https://github.com/Hack23/euparliamentmonitor/actions/runs/25028873034) (2026-04-28, news-weekly-review):

1. Agent completed analysis Pass 1 + Pass 2 inside the sandbox.
2. Agent ran `git checkout -b news/2026-04-28-week-in-review-run-1777339927` and `git commit` (commit `932d79a`, 35 files).
3. Agent called `safeoutputs___create_pull_request` → `session not found`.
4. Agent called `safeoutputs___report_incomplete` → `session not found`.
5. The pre-existing host-side `gh-aw-pat-pr-fallback.sh` ran on a clean checkout of `main`, found no changes, exited 0 — green job, no PR.
6. The sandbox was destroyed; commit `932d79a` is unreachable forever.

The protocol below makes that exact sequence recoverable.

## Contract

### Producer side (agent prompt — `.github/prompts/07-commit-and-pr.md` Stage E step 4)

Immediately **after** `git commit` and **before** any `safeoutputs___*` call, the agent **MUST** write two files inside `/tmp/gh-aw/`:

| Path | Purpose |
|------|---------|
| `/tmp/gh-aw/aw-fallback.bundle` | A `git bundle` containing every commit reachable from the new branch tip and not present on `main`. Produced via `git bundle create /tmp/gh-aw/aw-fallback.bundle "$BRANCH" --not main` (with `git bundle create … "$BRANCH"` as a fallback when the runner can't resolve `main`). The bundle MUST carry the proper `refs/heads/$BRANCH` ref name — bare `HEAD` bundles cannot be fetched into the host with the standard `+refs/heads/*:refs/aw-fallback/*` refspec. |
| `/tmp/gh-aw/agent/aw-fallback.json` | A JSON manifest with the metadata the host-side script needs to act autonomously. The manifest lives **inside `/tmp/gh-aw/agent/`** because the gh-aw artifact upload glob in compiled lock files matches `/tmp/gh-aw/aw-*.bundle` and `/tmp/gh-aw/aw-*.patch` only — it does **not** match `aw-*.json` — but it does upload `/tmp/gh-aw/agent/` recursively. The host-side script falls back to the legacy `/tmp/gh-aw/aw-fallback.json` location for backwards compatibility. |

The exact bash recipe lives in `.github/prompts/07-commit-and-pr.md` step 4 — it is the canonical implementation, and any deviation in a per-workflow `.md` source is a contract violation.

### Manifest schema

```jsonc
{
  "branch":           "news/2026-04-28-week-in-review-run-1777339927",
  "head_sha":         "932d79a…",        // 40-char SHA
  "parent_sha":       "abcdef0…",        // parent on main, used as bundle base
  "slug":             "week-in-review",
  "today":            "2026-04-28",
  "analysis_dir":     "analysis/daily/2026-04-28/week-in-review",
  "article_md_path":  "analysis/daily/2026-04-28/week-in-review/article.md",
  "title":            "EU Parliament Week in Review — 2026-04-28",
  "body_summary":     "Sandbox commit … produced for week-in-review on 2026-04-28.",
  "gate_result":      "GREEN",           // GREEN | YELLOW | RED | UNKNOWN
  "protected_paths":  [".github/", "package.json", "package-lock.json", "node_modules/"],
  "generated_at":     "2026-04-28T01:55:32Z"
}
```

`branch`, `head_sha`, and `parent_sha` are required. All other fields are best-effort — the host script tolerates missing optional fields and falls back to `git bundle list-heads` to derive the branch and to scanning the article markdown headline for the title.

### Transport — gh-aw `agent` artifact

The gh-aw upload step at `…lock.yml` uploads:

```yaml
path: |
  /tmp/gh-aw/aw-*.patch     # legacy patches
  /tmp/gh-aw/aw-*.bundle    # ✅ matches aw-fallback.bundle
  /tmp/gh-aw/agent/         # ✅ uploaded recursively — manifest lives here
  /tmp/gh-aw/sandbox/firewall/logs/
  /tmp/gh-aw/sandbox/firewall/audit/
```

The bundle is matched by `aw-*.bundle`. The manifest is **not** matched by `aw-*.json` (no such glob exists in the upload step) — that is why Stage E writes it to `/tmp/gh-aw/agent/aw-fallback.json` instead, which is uploaded by virtue of the recursive `/tmp/gh-aw/agent/` directory upload.

The host-side script probes `/tmp/gh-aw/agent/aw-fallback.json` first and `/tmp/gh-aw/aw-fallback.json` second (legacy path), so old agent runs that put the manifest at the legacy location still recover.

No per-workflow YAML change is required and `gh aw compile` is unaffected.

### Host-side safety checks (fail-closed before push)

Before the host-side script pushes the recovered branch under the PAT, it enforces two gates that cannot be defeated by a misbehaving agent:

1. **Default-branch refusal.** If the recovered `branch` equals `$DEFAULT_BRANCH` (or any of `main`, `master`, `develop`, `trunk`, `production`, `release`), the script exits non-zero with `refusing to push to protected branch …`. The agent must never have committed to the default branch in the first place; this is the host-side belt-and-braces.
2. **Protected-paths gate.** The script computes `git diff --name-only $base..$recovered_sha` (`$base` = merge-base with the local `main` checkout) and rejects the push if any path matches `^(\.github/|\.agents/|package(-lock)?\.json$|pnpm-lock\.yaml$|yarn\.lock$|Gemfile\.lock$|node_modules/|dist/|build/|cypress\.config\..+|tsconfig.*\.json$|vite\.config\..+|vitest\.config\..+)`. Article workflows must only touch `analysis/daily/**` and `news/**`; anything else is treated as an attempted bypass of the safe-outputs protected-file gate and fails the job loudly.

### Consumer side (host-side workflow — `.github/workflows/news-pat-pr-fallback.yml`)

A standalone `workflow_run`-triggered workflow listens for completion of all 11 news-* workflows. On every triggering run it:

1. **Hardens** the runner with `step-security/harden-runner` (audit egress).
2. **Checks out** `main` with `persist-credentials: false` — no sandbox creds, no working-tree mutation expected.
3. **Downloads** the `agent` artifact from the triggering run.
4. **Runs** `scripts/gh-aw-pat-pr-fallback.sh` with:
   - `GH_AW_PAT_PR_FALLBACK_TOKEN` ← `secrets.COPILOT_MCP_GITHUB_PERSONAL_ACCESS_TOKEN`
   - `GH_AW_PAT_FALLBACK_SLUG` ← derived from triggering workflow name
   - `GH_AW_PAT_FALLBACK_RUN_URL` ← URL of the triggering agent run
   - `GH_AW_PAT_FALLBACK_WORKFLOW_NAME` ← human-readable name
5. **Uploads** `/tmp/gh-aw/fallback-events.jsonl` as the `pat-pr-fallback-audit-*` artifact for forensic replay.

### Recovery paths in `scripts/gh-aw-pat-pr-fallback.sh`

| Path | Trigger | Action |
|------|---------|--------|
| **Primary — bundle handoff** | `aw-fallback.bundle` (and ideally `aw-fallback.json`) present | `git fetch <bundle> '+refs/heads/*:refs/aw-fallback/*'`, then `git push --force-with-lease` to origin under the host PAT, then `gh pr create` (or `gh pr edit` if a PR for the branch already exists). |
| **Secondary — legacy** | No bundle, but `aw-*.patch` artifact and `session not found` in `agent-stdio.log` | Apply the patch to a fresh `main` checkout, stage only `analysis/daily/**` and `news/**`, commit on a synthetic recovery branch, push, open PR. Kept for backwards compatibility with older agent runs that pre-date the bundle protocol. |
| **No-op (skip)** | safeoutputs already produced a `create_pull_request` event in `safeoutputs.jsonl` | Exit 0 with a step-summary note. Never duplicate PRs. |
| **No-op (no handoff)** | No bundle, no patch, no `session not found` marker | Exit 0 with a step-summary note. The agent run was either successful or pre-Stage-E. |

### Failure semantics

The host-side job is **green only when**:

- a PR was successfully created or refreshed, **or**
- there was nothing to recover (safeoutputs already shipped a PR / no handoff produced).

Any other outcome — invalid manifest JSON, bundle has no heads, push rejected, `gh pr create` errored, PAT lacks `contents:write` — exits **non-zero**. The earlier silent-green-exit-on-empty-tree failure mode is eliminated.

### Audit trail

Every fallback execution writes one OTLP-shaped JSON event per line to `/tmp/gh-aw/fallback-events.jsonl`. Events:

- `skip` — safeoutputs already created the PR.
- `noop` — no handoff and no session-not-found marker.
- `primary_start` / `primary_created` / `primary_updated` — primary path execution.
- `secondary_start` / `secondary_created` / `secondary_updated` / `secondary_noop` — secondary path execution.
- `dry_run_success` — test/CI path (set `GH_AW_PAT_FALLBACK_DRY_RUN=1`).
- `warn` / `error` — non-fatal warnings and fatal errors with structured `extra` data.

The audit log is uploaded as a workflow artifact (`pat-pr-fallback-audit-<run_id>`, 14-day retention) for forensic replay.

## Testing

`tests/gh-aw-pat-pr-fallback.test.ts` exercises the script in isolation against:

1. **Primary** — bundle + manifest present → primary path opens PR (asserted in dry-run mode).
2. **Primary, bundle only** — branch derived from `git bundle list-heads`.
3. **Secondary** — `session not found` + dirty workspace + patch artifact → secondary path opens PR.
4. **No-op** — empty `/tmp/gh-aw/` and no stdio markers → exit 0 with no PR.

Run via `npm test -- gh-aw-pat-pr-fallback`.

## Compatibility

This protocol is additive — workflows that do not yet emit a bundle/manifest still benefit from the secondary legacy path (when applicable). New news-* workflows opt in automatically by importing `.github/prompts/07-commit-and-pr.md`, which is what every news-* `.md` source already does.

## See also

- `.github/prompts/07-commit-and-pr.md` — producer-side contract (Stage E step 4).
- `scripts/gh-aw-pat-pr-fallback.sh` — consumer-side implementation.
- `.github/workflows/news-pat-pr-fallback.yml` — host-side workflow (`workflow_run` triggered).
- `tests/gh-aw-pat-pr-fallback.test.ts` — automated regression coverage.
