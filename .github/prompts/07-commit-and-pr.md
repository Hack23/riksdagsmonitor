# 07 — Commit & Pull Request (exactly one PR per run)

## Core rule

> Every run ends with **exactly one** safe-output call:
> - `safeoutputs___create_pull_request` — the **default and overwhelmingly common** outcome. Always used when any file on disk was created **or** modified, including improvement-mode re-runs that extend prior analysis and re-render `article.md` + HTML.
> - `safeoutputs___noop` — **last-resort only**. See §No-op policy below for the narrow conditions. **Never** call noop because prior analysis or rendered HTML already exists for this date — that is the trigger for improvement-mode (see `03-data-download.md §Pre-flight`), not for exit.
>
> Do not open checkpoint, heartbeat, or keep-alive PRs. Content committed after the first `create_pull_request` call is lost.

Workflows declare `safe-outputs.create-pull-request.max: 1`. Attempting a second call is a workflow error.

## Single-run PR strategy

Every run performs analysis **and** article generation end-to-end and produces **one** PR:

| Content | Git path to stage |
|---------|-------------------|
| Analysis summaries | `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/*.md` |
| Visualisation data | `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/*.json` |
| Aggregated article markdown | `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/article.md` |
| Rendered articles (core languages) | `news/$ARTICLE_DATE-$SUBFOLDER-{en,sv}.html` |

PR title: `📰 ${Article Type} — $ARTICLE_DATE`.
PR labels: `agentic-news` + article-type label.

Translations for the remaining twelve languages are produced by the dedicated **`news-translate`** workflow, which runs on a separate schedule and creates its own PR. Per-type workflows must **not** attempt to translate or dispatch translation themselves.

## Stage → commit → PR

1. **Stage scoped files only.** Never stage the whole repo. Before staging any `news/*.html`, verify the aggregator + renderer pre-commit checks in `06-article-generation.md` §"What the AI still MUST do" pass (executive-brief H1 present, every cited `dok_id` has a `documents/{dok_id}-analysis.md`, rendered HTML files exist for every requested language). Abort the commit on any failure.

   | Content | Git path to stage |
   |---------|-------------------|
   | Analysis summaries | `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/*.md` |
   | Visualisation data | `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/*.json` |
   | Aggregated article markdown | `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/article.md` |
   | Rendered articles (core languages) | `news/$ARTICLE_DATE-$SUBFOLDER-{en,sv}.html` |
   | Translations (news-translate only) | `news/$ARTICLE_DATE-$SUBFOLDER-<lang>.html` |

   Never stage `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/documents/` wholesale — it often contains 100+ files. Stage only `documents/*.md` **if** your `documents/` stays under the safe-outputs 100-file cap; otherwise stage only summary files. Never stage `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/pass1/` — it is a local gate-evidence snapshot (see `04-analysis-pipeline.md`), not a deliverable.

2. **100-file guard.** Before calling safeoutputs, count staged files. If the count > 99, unstage everything under `documents/` except `synthesis-summary.md` and re-check.

3. **Commit** once with a descriptive message, e.g. `news(${article_type}): $ARTICLE_DATE — analysis + article`.

4. **🛟 Sandbox commit handoff (mandatory)** — *immediately after `git commit` and **before** any `safeoutputs___*` call*, write a portable bundle + manifest so the host-side PAT PR fallback can recover the commit if `safeoutputs___create_pull_request` later fails (e.g. `session not found` after Timer C fires). The bundle goes to `/tmp/gh-aw/aw-fallback.bundle` (matched by the gh-aw artifact upload glob `/tmp/gh-aw/aw-*.bundle`); the JSON manifest goes to `/tmp/gh-aw/agent/aw-fallback.json` because the upload glob does **not** match `aw-*.json` — but it does upload the entire `/tmp/gh-aw/agent/` directory, so writing inside it guarantees the manifest reaches the host job. Run this in the same bash session as the commit:

   ```bash
   set -euo pipefail
   mkdir -p /tmp/gh-aw /tmp/gh-aw/agent
   export BRANCH HEAD_SHA PARENT_SHA ARTICLE_MD TITLE GATE
   BRANCH=$(git rev-parse --abbrev-ref HEAD)
   HEAD_SHA=$(git rev-parse HEAD)
   PARENT_SHA=$(git rev-parse "HEAD^" 2>/dev/null || git rev-parse HEAD)
   # Bundle: include everything reachable from $BRANCH but not from main, with
   # the proper refs/heads/$BRANCH ref name (not bare HEAD). This is what the
   # host-side `git fetch <bundle> '+refs/heads/*:refs/aw-fallback/*'` expects.
   git bundle create /tmp/gh-aw/aw-fallback.bundle "$BRANCH" --not main 2>/dev/null \
     || git bundle create /tmp/gh-aw/aw-fallback.bundle "$BRANCH"
   ARTICLE_MD="analysis/daily/$ARTICLE_DATE/$SUBFOLDER/article.md"
   TITLE=""
   [ -f "$ARTICLE_MD" ] && TITLE=$(awk '/^# / { sub(/^# /, ""); print; exit }' "$ARTICLE_MD")
   GATE="UNKNOWN"
   MANIFEST_FILE="analysis/daily/$ARTICLE_DATE/$SUBFOLDER/manifest.json"
   [ -f "$MANIFEST_FILE" ] && GATE=$(node -e 'const m=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const h=Array.isArray(m.history)?m.history:[];const last=h.length?h[h.length-1]:{};process.stdout.write(last.gateResult||m.gateResult||"UNKNOWN")' "$MANIFEST_FILE" 2>/dev/null || echo UNKNOWN)
   # SUBFOLDER and ARTICLE_DATE are exported by the workflow; BRANCH/HEAD_SHA/PARENT_SHA/ARTICLE_MD/TITLE/GATE
   # are exported above so node -e can read them via process.env.
   SUBFOLDER="$SUBFOLDER" ARTICLE_DATE="$ARTICLE_DATE" node -e '
     const fs = require("fs");
     const out = {
       branch: process.env.BRANCH,
       head_sha: process.env.HEAD_SHA,
       parent_sha: process.env.PARENT_SHA,
       slug: process.env.SUBFOLDER,
       today: process.env.ARTICLE_DATE,
       analysis_dir: `analysis/daily/${process.env.ARTICLE_DATE}/${process.env.SUBFOLDER}`,
       article_md_path: process.env.ARTICLE_MD,
       title: process.env.TITLE || `news: ${process.env.SUBFOLDER} — ${process.env.ARTICLE_DATE}`,
       body_summary: `Sandbox commit ${process.env.HEAD_SHA} produced for ${process.env.SUBFOLDER} on ${process.env.ARTICLE_DATE}.`,
       gate_result: process.env.GATE,
       protected_paths: [".github/", ".agents/", "package.json", "package-lock.json", "node_modules/"],
       generated_at: new Date().toISOString()
     };
     fs.writeFileSync("/tmp/gh-aw/agent/aw-fallback.json", JSON.stringify(out, null, 2));
   '
   echo "✅ Sandbox commit handoff written: /tmp/gh-aw/aw-fallback.bundle + /tmp/gh-aw/agent/aw-fallback.json"
   ```

   This step is non-negotiable. Skipping it leaves the run with **no recovery path** if Timer C fires before `safeoutputs___create_pull_request` returns. See `.github/aw/SANDBOX_COMMIT_HANDOFF.md` for the full contract and `.github/workflows/news-pat-pr-fallback.yml` for the host-side recovery job.

5. **Call** `safeoutputs___create_pull_request` exactly once:
   - Title: `📰 ${Article Type} — $ARTICLE_DATE`.
   - Body: use the PR template below.
   - Labels: `agentic-news` + article-type label.
   - Branch: handled automatically by safeoutputs (`news/content/$ARTICLE_DATE/$ARTICLE_TYPE`).

6. **Do not** `git push`, `git checkout`, or `git checkout -b` after the call. The safe-outputs runner job publishes the PR; subsequent agent commits are not added.

## Cache-memory recovery (resilience for failed PRs)

Every news workflow declares `tools.cache-memory:` keyed by `news-${{ github.workflow }}-${{ inputs.article_date || 'today' }}` with a configured 14-day **target** window (see `02-mcp-access.md` §Servers & tool naming). Treat 14 days as an *intended recovery horizon*, **not** as a strict guarantee that cache-memory will remain available for 14 days: actual availability depends on GitHub Actions cache persistence and eviction policy (best-effort, repo-policy driven), and the 14-day setting primarily affects retained artifacts/related workflow data rather than guaranteeing cache retention. gh-aw automatically attempts to restore cache-memory from the **last successfully persisted run** on each invocation. Analysis artifacts under `/tmp/gh-aw/cache-memory/` can therefore often be reused on the next attempt when a previous run reached the cache-update stage, but newly generated cache-memory content from an agent job that **fails or times out** is **not** guaranteed to persist for the next retry.

**On every run, immediately after MCP pre-warm:**

1. Check whether `/tmp/gh-aw/cache-memory/$ARTICLE_DATE/$SUBFOLDER/` exists with prior analysis artifacts (Family A/B/C/D `.md` files). If so, treat this as a **retry with recoverable prior work**. Copy them into `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/` *before* re-running the analysis pipeline so Pass 2 builds on Pass 1 work that a previous successful agent run already produced.
2. After a successful Pass 1 (or after the analysis gate passes), copy the produced `.md` artifacts back to `/tmp/gh-aw/cache-memory/$ARTICLE_DATE/$SUBFOLDER/` so they are available for persistence if the workflow later fails during PR publication or another post-agent stage.
3. The agent does **not** call any safe-output tool to persist cache-memory; it only writes to `/tmp/gh-aw/cache-memory/`. In compiled workflows, the updated cache is saved for the next run by a separate cache-update step/job that runs **only after a successful agent job** (`needs.agent.result == 'success'`), so recovery is reliable for **post-agent failures** (e.g. PR-publication problems) but **not** for agent-job failures or timeouts.

Cache-memory is **not** a substitute for committing real files on disk under `analysis/daily/`. It is a recovery mechanism for the next run, not a deliverable.

## PR creation resilience (`fallback-as-issue`, `if-no-changes`, host-side PAT fallback)

Every news workflow's `safe-outputs.create-pull-request:` block sets two explicit resilience flags:

| Flag | Value | Effect |
|------|-------|--------|
| `fallback-as-issue` | `true` *(explicit, also the gh-aw default)* | If org settings disable "Allow GitHub Actions to create and approve pull requests", the safe-outputs runner falls back to creating an **issue with branch link** instead of failing. The agent's commit is still pushed; only the PR-creation step degrades. |
| `if-no-changes` | `warn` | If the agent commits but the patch is empty (e.g. all artifacts already exist for this date with `force_generation=false`), the runner emits a warning instead of failing the workflow. Combined with the run-mode selection in `03-data-download.md`, this prevents spurious red runs on duplicate-date dispatches. |

Neither flag changes the agent's behaviour — both are runner-side resilience knobs. The agent still calls `safeoutputs___create_pull_request` exactly once. See [upstream `create-pull-request` reference](https://github.com/github/gh-aw/blob/main/docs/src/content/docs/reference/safe-outputs-pull-requests.md) for the full schema.

In addition, the **Sandbox commit handoff** in step 4 above is the *third* (and most important) resilience layer: when `safeoutputs___create_pull_request` itself fails — e.g. `Error POSTing to endpoint: session not found` after Timer C fires, or any transient MCP outage — the standalone host-side workflow `.github/workflows/news-pat-pr-fallback.yml` is triggered by `workflow_run` on completion of every news-* workflow. It downloads the agent artifact, fetches the bundle into the host checkout, force-with-leases the recovered branch to origin under the repo PAT, and opens (or refreshes) the PR. The job is **green only when the PR is actually created** — silent green-exits are eliminated.

## Canonical PR body template

```markdown
## Summary

- **Article type**: $ARTICLE_TYPE
- **Article date**: $ARTICLE_DATE
- **Languages**: $CORE_LANGUAGES
- **Analysis depth**: $ANALYSIS_DEPTH
- **Scope**: <2–3 sentence human-readable scope>

## Analysis artifacts

- [x] synthesis-summary.md
- [x] swot-analysis.md
- [x] risk-assessment.md
- [x] threat-analysis.md
- [x] stakeholder-perspectives.md
- [x] significance-scoring.md
- [x] classification-results.md
- [x] cross-reference-map.md
- [x] data-download-manifest.md
- [x] documents/ (N files)

## Articles

- [x] news/$ARTICLE_DATE-$SUBFOLDER-en.html
- [x] news/$ARTICLE_DATE-$SUBFOLDER-sv.html
- [x] analysis/daily/$ARTICLE_DATE/$SUBFOLDER/article.md (aggregated)

## Methodology & compliance

- Methodology: `analysis/methodologies/ai-driven-analysis-guide.md`
- Templates: `analysis/templates/`
- Evidence: every claim cites `dok_id`, named actor, vote count, or primary-source URL.
- GDPR / ISMS: public-source data only; neutrality applied; DPIA not required (no new high-risk processing).

## Iteration

- Pass 1 analysis: ✅
- Pass 2 improvement: ✅
- Aggregate + render: ✅
```

## No-op policy

> 🔴 **No-op is forbidden as a "nothing to do" exit.** Detecting prior analysis, prior `article.md`, or prior rendered HTML for `$ARTICLE_DATE` + `$SUBFOLDER` is **never** grounds for noop — it is the trigger for **improvement-mode** in `03-data-download.md §Pre-flight` and `04-analysis-pipeline.md §Execution order`. The agent must always extend prior artifacts, regenerate `article.md`, regenerate `news/*.html`, and end the run with `safeoutputs___create_pull_request`.

`safeoutputs___noop({"message": "<reason>"})` is reserved for **catastrophic input failures** where no useful work is possible **and** zero files were produced. Allowed conditions (and only these):

1. **MCP unreachable from start** — all three MCP attempts in `02-mcp-access.md §Three-attempt connect protocol` failed, no document data was downloaded, **and** `IMPROVEMENT_MODE=false` from `03-data-download.md §Pre-flight` (which already returns `true` when either all 23 required artifacts are present **or** `$ANALYSIS_DIR/synthesis-summary.md` exists as a usable improvement baseline from a partial prior run). When `IMPROVEMENT_MODE=true`, route to improvement-mode and continue without MCP instead of calling noop.
2. **Hard input error** — invalid `article_date` (e.g. unparseable, future-dated beyond +30 days, or pre-2014), invalid `$SUBFOLDER`, or other structural input failure that prevents any analysis from running, **and** zero files were produced.
3. **Empty data window with no fallback content** — every lookback day in `03-data-download.md §Lookback fallback` (`DAYS_BACK = 1..7`) returned zero documents **and** there is no prior analysis on disk for `$ARTICLE_DATE` + `$SUBFOLDER` to improve. Zero-document weekend or holiday days when prior analysis exists must run improvement-mode instead.
4. **Improvement-mode rerun-marker write produced no tracked diff** — `IMPROVEMENT_MODE=true`, every required step (read-back, re-download, extension plan, baseline snapshot, extensions, Pass 2, gate, aggregate, render) ran to completion, the mandatory rerun marker below was attempted, but `git status --porcelain` still reports zero tracked-file changes (e.g. the marker write failed, `methodology-reflection.md` is outside the tracked/staged scope, or another repository-state failure prevented the required write from appearing as a tracked diff). Under normal conditions appending the marker always produces a non-empty diff, so this condition is an abnormal edge case only; the noop message must explicitly cite "improvement-mode rerun marker produced no tracked diff".

### Mandatory rerun marker (improvement-mode only)

To eliminate the gap between "noop forbidden" and "no changes to PR" on deterministic re-runs, every improvement-mode run **must** append a single dated entry to `$ANALYSIS_DIR/methodology-reflection.md` under a `## Re-run log` heading **before** the gate, regardless of whether substantive content changed. The entry includes:

```markdown
## Re-run log

- **Re-run**: $RUN_TIMESTAMP_UTC · workflow=$GITHUB_WORKFLOW · run_id=$GITHUB_RUN_ID · attempt=$GITHUB_RUN_ATTEMPT
  - new dok_ids: <count or "none">
  - artifacts extended: <comma-separated list or "none — content stable">
  - flags closed: <count>
  - vintage refresh: <"yes" or "no, IMF WEO Apr-2026 still current">
```

This guarantees a deterministic, content-bearing diff on every improvement-mode re-run. If — after attempting to write this marker, regenerating `article.md`, and re-rendering `news/*.html` — `git status --porcelain` is still empty, treat that as an abnormal edge case only: the rerun marker did not persist as a tracked diff, `methodology-reflection.md` is outside the tracked/staged scope, or another repository-state failure prevented the required write from appearing. Only then does noop condition #4 apply.

In **every other case** — including "today's HTML already exists", "all 23 artifacts already exist", "no new dok_ids since last run", or "prior run was the same day" — commit whatever was extended, re-rendered, or marker-logged and call `create_pull_request` once. There is **always** something to extend on a re-run: newer voting outcomes, fresher economic vintage, sharpened uncertainty disclosure, closed `[unconfirmed]` flags, new media frames, or a freshly-rendered HTML that picks up template/chrome improvements. The aggregator + renderer always run on improvement-mode re-runs and the rerun-log marker is always appended, so the PR diff is never empty under normal conditions; condition #4 above only fires when that mandatory marker flow fails to produce any tracked change.

The noop message **must** include which condition above applies and why improvement-mode was not viable — e.g. `"MCP unreachable from start; no prior analysis on disk for 2026-04-30/propositions"` or `"Improvement-mode rerun marker write produced no tracked diff; repository state prevented a safe PR for 2026-04-30/propositions"`.

## Deadline enforcement

Three independent timers can kill a run silently. Plan for the **shortest** of the three.

> **Timer A — Job `timeout-minutes` (45 min)**: every news workflow declares `timeout-minutes: 45`. After 45 minutes GitHub Actions kills the runner unconditionally — no retry, no save, no PR.
>
> **Timer B — Copilot API session (~60 min)**: The Copilot API session is bound to the `github.token` baked in at step start. That token expires at approximately **60 minutes** and is never refreshed mid-run (gh-aw issue #24920). Every tool call and inference request fails silently after that point — the agent appears to run but makes no progress and the PR is never created.
>
> **Timer C — Safe Outputs MCP idle session (~25–30 min, observed)**: The local Safe Outputs HTTP MCP tracks a per-agent Streamable HTTP session. If the agent goes **idle toward safeoutputs** for 25+ minutes (e.g. a long Pass 1 that only uses `edit` + `bash`), the session is dropped and every subsequent `safeoutputs___*` call returns `Error POSTing to endpoint: session not found` — including the final `safeoutputs___create_pull_request`, `safeoutputs___noop`, and `safeoutputs___report_incomplete`. The `sandbox.mcp.keepalive-interval: 300` setting does **not** prevent this; that knob keeps the `mcp-gateway` upstream MCPs alive, not the safeoutputs HTTP server.

Timer C fires first and is therefore the operative deadline. The 45-min job budget (Timer A) leaves ~15 minutes of safety margin after the PR call for the safe-outputs runner to publish the PR.

### Keeping the Safe Outputs MCP session warm

Do **not** use safe outputs as a keepalive strategy. In this workflow, `safeoutputs___create_pull_request` is limited to a single successful end-of-run call, and `safeoutputs___noop` is likewise reserved for the final "no files produced" outcome, so neither can be safely spent to keep the Safe Outputs MCP session alive. Some other `safeoutputs___*` tools (e.g. `report_incomplete`, `missing_tool`, `missing_data`) may allow more than one call in compiled workflows, but they are not a documented or reliable heartbeat path for this prompt. **The only reliable mitigation is to reach `safeoutputs___create_pull_request` before Timer C fires.** Plan Pass 1 + gate + commit to finish well inside the 30-minute hard deadline below. If a future gh-aw release publishes a safe touch path for the local safeoutputs HTTP server (for example, an explicitly supported status or `tools/list` endpoint with verified keepalive behaviour), update this section with the concrete command and its observed effect.

### PR-creation windows

| Phase | Target PR window | Hard deadline | Floor for Pass 2 |
|-------|------------------|---------------|------------------|
| Analysis + aggregate + render | **22–27 min** after agent start | **30 min** | 5 min, skip beyond 25 min |

The 30-min hard deadline leaves ~5 minutes of margin for staging, `git commit`, and the safeoutputs round-trip before Timer C fires; ~30 minutes of margin before Timer B; and ~15 minutes of margin before Timer A. Do **not** schedule any analysis or article work after the PR call — the agent's only remaining job is to exit cleanly while the safe-outputs runner publishes the PR.

### If the run exceeds its hard deadline with no safe-output call yet

1. **Stop** analysis / article work immediately — no more `edit` tool calls, no more Pass 2 improvements.
2. **Stage** whatever exists on disk (analysis artifacts and any rendered `news/*.html`). Do not stage `pass1/`.
3. **Commit** with message prefixed `[early-pr]` to signal partial content.
4. **Call** `safeoutputs___create_pull_request` once with label `partial`. A partial analysis is always better than zero output.
5. If `safeoutputs___create_pull_request` returns `session not found`, do **not** retry — the MCP session is gone. The work is lost for this run; the commit on disk is not persisted because the safe-outputs runner never saw it. Document the incident in the next run's methodology-reflection.

Do not attempt to "save" work via a second PR — there is no second PR. Creating the PR early is always better than losing all work to a session expiry.

### Emergency deadline order of operations

If you are approaching 25 min with Pass 2 in progress, **stop Pass 2 immediately** and run the following in a single bash session:

```bash
cd "$GITHUB_WORKSPACE"
git add "analysis/daily/$ARTICLE_DATE/$SUBFOLDER/"*.md "analysis/daily/$ARTICLE_DATE/$SUBFOLDER/"*.json 2>/dev/null || true
git reset HEAD "analysis/daily/$ARTICLE_DATE/$SUBFOLDER/pass1/" 2>/dev/null || true
# If aggregator + renderer already ran, stage the aggregated article markdown and the HTML too.
git add "analysis/daily/$ARTICLE_DATE/$SUBFOLDER/article.md" 2>/dev/null || true
git add "news/${ARTICLE_DATE}-${SUBFOLDER}-"*.html 2>/dev/null || true
git commit -m "[early-pr] news($ARTICLE_TYPE): $ARTICLE_DATE — Pass 1 complete, Pass 2 partial"
```

Then immediately call `safeoutputs___create_pull_request` with label `partial`. A Pass-1-only partial PR is always better than zero output.
