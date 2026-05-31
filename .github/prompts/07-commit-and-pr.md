# 07 — Commit & Pull Request (exactly one PR per run)

## Core rule

> Every run ends with **exactly one** safe-output call:
> - `safeoutputs___create_pull_request` — the default and overwhelmingly common outcome. Use whenever any file on disk was created or modified, including improvement-mode re-runs that extend prior analysis and re-render `article.md` + HTML.
> - `safeoutputs___noop` — last-resort only. See §No-op policy below.
>
> Prior analysis / rendered HTML for `$ARTICLE_DATE` is the trigger for **improvement-mode** (`03-data-download.md §Pre-flight`), not for noop.
> Issue one PR. Content committed after the first `create_pull_request` call is lost.

Workflows declare `safe-outputs.create-pull-request.max: 1`. A second call is a workflow error.

## Single-run PR strategy

Every run performs analysis **and** article generation end-to-end and produces **one** PR:

| Content | Git path to stage |
|---------|-------------------|
| Analysis summaries | `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/*.md` |
| Visualisation data | `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/*.json` |
| Aggregated article markdown | `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/article.md` |
| Rendered articles (all 14 languages) | `news/$ARTICLE_DATE-$SUBFOLDER-{en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh}.html` |

PR title: `${TYPE_EMOJI} ${Article Type} — $ARTICLE_DATE` where `${TYPE_EMOJI}` is picked from the table below (defaults to `📰` if a new article type is added without updating this list).
PR labels: `agentic-news` + article-type label.

| Article-type slug | Emoji | Rationale |
|-------------------|-------|-----------|
| `propositions` | 📜 | Government bills (scrolls) |
| `motions` | 📝 | Opposition motions (drafts) |
| `committee-reports` | 🏛️ | Standing-committee betänkanden |
| `interpellations` | 🗣️ | Oral debates / interpellation answers |
| `evening-analysis` | 🌙 | End-of-day debrief |
| `week-ahead` / `month-ahead` / `quarter-ahead` / `year-ahead` | 📅 | Forward-looking calendars |
| `election-cycle` | 🗳️ | Multi-year electoral arc |
| `week-in-review` / `monthly-review` | 🔍 | Retrospective audit |
| `realtime-pulse` | 📡 | Live monitoring window |
| `translate` (news-translate only) | 🌐 | Localized executive briefs |
| *(any other / future type)* | 📰 | Default |

The dedicated **`news-translate`** workflow owns markdown translation only: each daily run picks up untranslated `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/executive-brief.md` files and produces `executive-brief_<lang>.md` siblings for the 13 non-English languages. It does not touch `news/*.html`. Per-type workflows produce **all 14 language HTML files** themselves in the same agentic run via the localized executive-brief cascade (see `06-article-generation.md`). Per-type workflows do **not** write `article.<lang>.md` — `scripts/validate-file-ownership.ts` forbids it.

> **Per-type workflows:** keep `executive-brief_<lang>.md` out of every commit. Those files are exclusively owned by `news-translate`. The file-ownership validator rejects `content`-category commits that touch any `executive-brief_<lang>.md` path.

## Stage → commit → PR

1. **Stage scoped files only.** Before staging any `news/*.html`, verify the aggregator + renderer pre-commit checks in `06-article-generation.md` §"What the AI does" pass (executive-brief H1 present, every cited `dok_id` has a `documents/{dok_id}-analysis.md`, rendered HTML exists for every requested language). Abort the commit on any failure.

   | Content | Git path to stage |
   |---------|-------------------|
   | Analysis summaries | `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/*.md` |
   | Visualisation data | `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/*.json` |
   | Aggregated article markdown | `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/article.md` |
   | Rendered articles (all 14 languages) | `news/$ARTICLE_DATE-$SUBFOLDER-{en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh}.html` |
   | News-translate executive-brief translations (only from `news-translate.md`) | `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/executive-brief_<lang>.md` |

   Stage `documents/*.md` selectively — keep the total ≤ 180 files (see step 2). Skip `analysis/daily/**/pass1/` entirely; it is a local gate-evidence snapshot (`04-analysis-pipeline.md`), not a deliverable.

2. **200-file guard (non-negotiable).** Run this snippet before calling safeoutputs. The safe-outputs handler hard-rejects PRs with > 200 files (E003); the guard uses a 180-file threshold to leave headroom for metadata the handler may add.

   ```bash
   set -euo pipefail
   STAGED_COUNT=$(git diff --cached --name-only | wc -l | tr -d '[:space:]')
   echo "📊 Staged file count: $STAGED_COUNT (limit: 180)"
   if [ "$STAGED_COUNT" -gt 180 ]; then
     echo "⚠️ OVER FILE BUDGET ($STAGED_COUNT > 180). Unstaging documents/ ..."
     git reset HEAD -- "analysis/daily/$ARTICLE_DATE/$SUBFOLDER/documents/" 2>/dev/null || true
     STAGED_COUNT=$(git diff --cached --name-only | wc -l | tr -d '[:space:]')
     echo "📊 After unstaging documents/: $STAGED_COUNT files"
     if [ "$STAGED_COUNT" -gt 180 ]; then
       echo "❌ STILL OVER BUDGET ($STAGED_COUNT > 180). Unstaging all JSON files..."
       git diff --cached --name-only | grep '\.json$' | xargs -r git reset HEAD -- || true
       STAGED_COUNT=$(git diff --cached --name-only | wc -l | tr -d '[:space:]')
       echo "📊 After unstaging JSON: $STAGED_COUNT files"
     fi
     if [ "$STAGED_COUNT" -gt 180 ]; then
       echo "❌ FATAL: Cannot reduce staged files below 180 (currently $STAGED_COUNT). Aborting."
       exit 1
     fi
   fi
   echo "✅ File budget OK: $STAGED_COUNT ≤ 180"
   ```

   Skipping this step makes `create_pull_request` fail with E003 and wastes the run.

3. **Commit** once with a descriptive message, e.g. `news(${article_type}): $ARTICLE_DATE — analysis + article`.

4. **🛟 Sandbox commit handoff (mandatory)** — *immediately after `git commit` and **before** any `safeoutputs___*` call*, write a portable bundle + manifest so the host-side PAT PR fallback can recover the commit if `safeoutputs___create_pull_request` later fails (transient MCP/network failure or Timer A/B firing). The bundle goes to `/tmp/gh-aw/aw-fallback.bundle` (matched by the gh-aw artifact upload glob `/tmp/gh-aw/aw-*.bundle`); the JSON manifest goes to `/tmp/gh-aw/agent/aw-fallback.json` because the upload glob does not match `aw-*.json` directly but uploads the entire `/tmp/gh-aw/agent/` directory. Run this in the same bash session as the commit:

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

   Skipping this step leaves the run with **no recovery path** if `safeoutputs___create_pull_request` fails to publish. See `.github/aw/SANDBOX_COMMIT_HANDOFF.md` for the full contract and `.github/workflows/news-pat-pr-fallback.yml` for the host-side recovery job.

5. **Call** `safeoutputs___create_pull_request` exactly once:
   - Title: `${TYPE_EMOJI} ${Article Type} — $ARTICLE_DATE` (see emoji table above).
   - Body: use the PR template below.
   - Labels: `agentic-news` + article-type label.
   - Branch: handled automatically by safeoutputs (`news/content/$ARTICLE_DATE/$ARTICLE_TYPE`).

6. Exit cleanly. The safe-outputs runner job publishes the PR; subsequent agent commits are not added.

## Cache-memory recovery (resilience for failed PRs)

Every news workflow declares `tools.cache-memory:` keyed by `news-${{ github.workflow }}-${{ inputs.article_date || 'today' }}` with a 14-day **target** window (see `02-mcp-access.md` §Servers & tool naming). Treat 14 days as an intended recovery horizon, **not** as a guarantee — actual availability depends on GitHub Actions cache persistence and eviction policy. gh-aw automatically attempts to restore cache-memory from the **last successfully persisted run** on each invocation. Analysis artifacts under `/tmp/gh-aw/cache-memory/` can therefore often be reused on the next attempt when a previous run reached the cache-update stage; newly generated cache-memory content from an agent job that **fails or times out** is not guaranteed to persist for the next retry.

**On every run, immediately after MCP pre-warm:**

1. Check whether `/tmp/gh-aw/cache-memory/$ARTICLE_DATE/$SUBFOLDER/` exists with prior analysis artifacts (Family A/B/C/D `.md` files). If so, treat this as a **retry with recoverable prior work**. Copy them into `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/` *before* re-running the analysis pipeline so Pass 2 builds on the cached Pass 1.
2. After a successful Pass 1 (or after the analysis gate passes), copy the produced `.md` artifacts back to `/tmp/gh-aw/cache-memory/$ARTICLE_DATE/$SUBFOLDER/` so they are available for persistence if the workflow later fails during PR publication or another post-agent stage.
3. The agent only writes to `/tmp/gh-aw/cache-memory/`; no safe-output call persists cache-memory. The compiled workflow's cache-update step runs only after a successful agent job (`needs.agent.result == 'success'`), so recovery is reliable for **post-agent failures** (PR-publication problems) but **not** for agent-job failures or timeouts.

**Checkout settings:** `fetch-depth: 1` is sufficient for `cache-memory`. gh-aw manages a self-contained git repo inside `/tmp/gh-aw/cache-memory/` independently of the main workspace. No special `checkout.fetch:` or `fetch-depth: 0` setting is required. Git user identity is configured by the dedicated "Configure Git credentials" step in compiled workflows, not by `actions/checkout`.

**Resilience:** The compiled `Commit cache-memory changes` and `Check cache-memory git integrity` steps run with `if: always()`. If a corrupted or missing `.git` directory from a restored cache causes a transient failure, the subsequent integrity-check step detects and reseeds the git repo so the artifact upload can still succeed. Cache-memory failures should not block article generation — the primary output is always committed to `analysis/daily/`.

Cache-memory is a recovery mechanism for the next run, not a substitute for committing real files on disk under `analysis/daily/`.

## PR creation resilience (`fallback-as-issue`, `if-no-changes`, host-side PAT fallback)

Every news workflow's `safe-outputs.create-pull-request:` block sets two resilience flags:

| Flag | Value | Effect |
|------|-------|--------|
| `fallback-as-issue` | `true` *(explicit, also the gh-aw default)* | If org settings disable "Allow GitHub Actions to create and approve pull requests", the safe-outputs runner falls back to creating an **issue with branch link** instead of failing. The agent's commit is still pushed; only the PR-creation step degrades. |
| `if-no-changes` | `warn` | If the agent commits but the patch is empty (e.g. all artifacts already exist for this date with `force_generation=false`), the runner emits a warning instead of failing the workflow. Prevents spurious red runs on duplicate-date dispatches. |

Neither flag changes agent behaviour. The agent still calls `safeoutputs___create_pull_request` exactly once. See [upstream `create-pull-request` reference](https://github.com/github/gh-aw/blob/main/docs/src/content/docs/reference/safe-outputs-pull-requests.md) for the full schema.

The **Sandbox commit handoff** in step 4 above is the third (and most important) resilience layer: when `safeoutputs___create_pull_request` itself fails (transient MCP outage, network blip, or Timer A/B firing before the PR is materialised), the standalone host-side workflow `.github/workflows/news-pat-pr-fallback.yml` is triggered by `workflow_run` on completion of every news-* workflow. It downloads the agent artifact, fetches the bundle into the host checkout, force-with-leases the recovered branch to origin under the repo PAT, and opens (or refreshes) the PR. The job is **green only when the PR is actually created** — silent green-exits are eliminated.

## Canonical PR body template

Use the template below verbatim, replacing `$…` placeholders with run-observable values from the manifest, gate output, and on-disk artifacts. Keep every section heading and its icon — reviewers navigate by them. Sections that genuinely don't apply (e.g. no caveats) must still render the heading with a single `_None._` line so the structure stays stable across runs.

```markdown
| Field | Value |
|-------|-------|
| Workflow | `$WORKFLOW_NAME` |
| Article type | `$ARTICLE_TYPE` |
| Article date | `$ARTICLE_DATE` |
| Languages | $LANG_COUNT / 14 (en, sv, da, no, fi, de, fr, es, nl, ar, he, ja, ko, zh) |
| Analysis depth | `$ANALYSIS_DEPTH` |
| Iteration mode | `$ITERATION_MODE` (initial / improvement) |
| Gate verdict | $GATE_VERDICT |
| Agent run | [#$GITHUB_RUN_ID]($RUN_URL) |
| Branch | `$BRANCH` |
| Head SHA | `$HEAD_SHA` |

## 📋 Summary

<2–3 sentence human-readable scope summary — the BLUF for the article.>

### 📊 Stats

| Metric | Value |
|--------|-------|
| Documents analyzed | $DOC_COUNT |
| Unique `dok_id` citations | $CITATION_COUNT |
| Longest evidence chain | $LONGEST_CHAIN_LEN hops |
| Executive-brief languages produced | $BRIEF_LANG_COUNT / 14 |
| Dashboard charts rendered | $CHART_COUNT |
| Files staged | $STAGED_FILE_COUNT / 180 |

## 🧠 Analysis artifacts

- [x] `synthesis-summary.md`
- [x] `swot-analysis.md`
- [x] `risk-assessment.md`
- [x] `threat-analysis.md`
- [x] `stakeholder-perspectives.md`
- [x] `significance-scoring.md`
- [x] `classification-results.md`
- [x] `cross-reference-map.md`
- [x] `data-download-manifest.md`
- [x] `documents/` ($DOCUMENTS_COUNT files)

## 🌐 Localized articles

- [x] `news/$ARTICLE_DATE-$SUBFOLDER-en.html`
- [x] `news/$ARTICLE_DATE-$SUBFOLDER-sv.html`
- [x] `news/$ARTICLE_DATE-$SUBFOLDER-{da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh}.html`
- [x] `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/article.md` (aggregated source-of-truth)

## 🔗 Top source citations

Top 3–5 primary `dok_id` / URL citations driving the article's headline claims (one line of context each):

1. `$DOK_ID_1` — $ONE_LINE_CONTEXT
2. `$DOK_ID_2` — $ONE_LINE_CONTEXT
3. `$DOK_ID_3` — $ONE_LINE_CONTEXT
<!-- Add up to 5 entries; remove unused list items. -->

## 🔍 Methodology & compliance

- **Methodology**: `analysis/methodologies/ai-driven-analysis-guide.md`
- **Templates**: `analysis/templates/`
- **Evidence rule**: every claim cites a `dok_id`, named actor, vote count, or primary-source URL.
- **GDPR / ISMS**: public-source data only; neutrality applied; DPIA not required (no new high-risk processing).

## 🔁 Iteration

- Pass 1 analysis: $PASS1_STATUS
- Pass 2 improvement: $PASS2_STATUS
- Aggregate + render: $RENDER_STATUS

## ⚠️ Caveats & limits

List every deviation from the methodology a reviewer would otherwise have to dig through the analysis files to discover. Examples: skipped sub-agents, capped downloads, missing languages, pre-publication committee docs, PDF-only propositions. If genuinely none apply:

_None._

## ▶️ Re-run

```bash
gh aw run $WORKFLOW_FILE --ref main \
  -F article_date=$ARTICLE_DATE \
  -F analysis_depth=$ANALYSIS_DEPTH
```
```

## No-op policy

> 🔴 **Noop is forbidden as a "nothing to do" exit.** Detecting prior analysis, prior `article.md`, or prior rendered HTML for `$ARTICLE_DATE` + `$SUBFOLDER` triggers **improvement-mode** (`03-data-download.md §Pre-flight`, `04-analysis-pipeline.md §Execution order`). The agent extends prior artifacts, regenerates `article.md`, regenerates `news/*.html`, and ends the run with `safeoutputs___create_pull_request`.

Reserve `safeoutputs___noop({"message": "<reason>"})` for **catastrophic input failures** where no useful work is possible **and** zero files were produced. Allowed conditions:

1. **Scaffold-write failed AND MCP unreachable from start** — the early-scaffold marker write in `03-data-download.md §Early-scaffold marker` failed (filesystem error, sandbox restriction), all three MCP attempts in `02-mcp-access.md §Three-attempt connect protocol` failed, no document data was downloaded, and `IMPROVEMENT_MODE=false` from `03-data-download.md §Pre-flight`. Under normal conditions the scaffold write succeeds even when MCP is unreachable — that produces a partial PR documenting the MCP failure, not a noop. When `IMPROVEMENT_MODE=true`, route to improvement-mode and continue without MCP.
2. **Hard input error** — invalid `article_date` (unparseable, future-dated beyond +30 days, or pre-2014), invalid `$SUBFOLDER`, or other structural input failure that prevents any analysis from running, and zero files were produced.
3. **Empty data window with no fallback content** — every lookback day in `03-data-download.md §Lookback fallback` (`DAYS_BACK = 1..7`) returned zero documents and there is no prior analysis on disk for `$ARTICLE_DATE` + `$SUBFOLDER` to improve. Zero-document weekend or holiday days when prior analysis exists run improvement-mode instead.
4. **Improvement-mode rerun-marker write produced no tracked diff** — `IMPROVEMENT_MODE=true`, every required step ran to completion, the mandatory rerun marker below was attempted, but `git status --porcelain` still reports zero tracked-file changes (marker write failed, `methodology-reflection.md` outside tracked/staged scope, or repository-state failure). The noop message must explicitly cite "improvement-mode rerun marker produced no tracked diff".

### Mandatory rerun marker (improvement-mode only)

Every improvement-mode run **must** append a single dated entry to `$ANALYSIS_DIR/methodology-reflection.md` under a `## Re-run log` heading, regardless of whether substantive content changed. **Ordering:** in improvement-mode, write this marker **only after** the Pass-1 / step-4 baseline snapshot is captured (see `04-analysis-pipeline.md §Execution order` — writes in improvement-mode are forbidden until after that snapshot) and **before** running the gate, so the pre-improvement `pass1/` baseline remains uncontaminated.

This schema is canonical for all 14 `news-*.md` workflows and is enforced by `05-analysis-gate.md` in improvement-mode:

```markdown
## Re-run log

- **Re-run**: $RUN_TIMESTAMP_UTC · workflow=$GITHUB_WORKFLOW · run_id=$GITHUB_RUN_ID · attempt=$GITHUB_RUN_ATTEMPT
  - new dok_ids: <count or "none">
  - artifacts extended: <comma-separated list or "none — content stable">
  - flags closed: <count>
  - vintage refresh: <"yes" or "no, IMF WEO Apr-2026 still current">
```

This guarantees a deterministic, content-bearing diff on every improvement-mode re-run. If — after writing this marker, regenerating `article.md`, and re-rendering `news/*.html` — `git status --porcelain` is still empty, treat that as an abnormal edge case: the rerun marker did not persist as a tracked diff, `methodology-reflection.md` is outside the tracked/staged scope, or another repository-state failure prevented the required write from appearing. Only then does noop condition #4 apply.

In every other case — including "today's HTML already exists", "all 23 artifacts already exist", "no new dok_ids since last run", or "prior run was the same day" — commit whatever was extended, re-rendered, or marker-logged and call `create_pull_request` once. There is always something to extend on a re-run: newer voting outcomes, fresher economic vintage, sharpened uncertainty disclosure, closed `[unconfirmed]` flags, new media frames, or a freshly-rendered HTML that picks up template/chrome improvements. The aggregator + renderer always run on improvement-mode re-runs and the rerun-log marker is always appended, so the PR diff is never empty under normal conditions.

The noop message **must** include which condition above applies and why improvement-mode was not viable — e.g. `"MCP unreachable from start; no prior analysis on disk for 2026-04-30/propositions"`.

## Deadline enforcement

> 🔴 **THE SINGLE MOST CRITICAL SECTION IN THIS DOCUMENT.** Failing to produce a safe output wastes the entire run (all tokens, all compute, all analysis). Three timers can kill the session:

Three independent timers can kill a run silently (gh-aw v0.74.3). Plan for the **shortest** of the three.

> **Timer A — Job `timeout-minutes` (60 min)**: every news workflow declares `timeout-minutes: 60`. The clock starts at job start (before Copilot begins) and includes host-side setup/sandbox/MCP initialization. After 60 minutes GitHub Actions kills the runner unconditionally — no retry, no save, no PR.
>
> **Timer B — Copilot API session (~60 min)**: the Copilot API session is bound to the `github.token` baked in at step start. That token expires at approximately **60 minutes** and is never refreshed mid-run (gh-aw issue #24920). After that point every tool call fails silently — the agent appears to run but makes no progress and the PR is never created.
>
> **Timer C — Token budget (~25M tokens)**: the agent session has a finite token budget. Complex analysis with many MCP calls, large file reads, and extensive tool outputs can exhaust this budget in 20–30 minutes. When tokens are exhausted, the session terminates immediately with NO opportunity for cleanup — the PR is never created. **This is the most common cause of "agent succeeded but no safe outputs" failures.**

Timers A, B, and C are independent. The token budget (Timer C) often fires first on complex analysis runs. Issue the PR before ANY timer fires.

### PR-creation windows

| Phase | Target PR window | Hard deadline | Floor for Pass 2 |
|-------|------------------|---------------|------------------|
| Analysis + aggregate + render | **35–42 min** after agent start | **45 min** | 7 min, skip beyond 42 min |

The agent-minute-45 hard deadline reserves job-level headroom for host-side setup variance plus staging, `git commit`, and the safeoutputs round-trip before Timer A and Timer B fire. Schedule no analysis or article work after the PR call — the agent's remaining job is to exit cleanly while the safe-outputs runner publishes the PR. Equally, finish with iterated AI-FIRST output: minimum 2 complete passes is mandatory (see `.github/copilot-instructions.md §AI FIRST Quality Principle`).

### Token-budget awareness

The token budget is the most unpredictable timer. To avoid exhaustion before PR creation:

1. **Minimize unnecessary output**: avoid printing large file contents to stdout when not needed for analysis.
2. **Batch MCP calls**: combine related queries rather than making many small calls.
3. **Limit file read size**: use targeted reads (specific sections) instead of reading entire large files.
4. **Check time frequently**: run the `agent_minute` check at EVERY phase boundary — if you're past minute 20 with no artifacts, you're likely consuming tokens faster than expected.
5. **Err on the side of early PR**: when in doubt about remaining budget, commit and PR immediately. A partial PR can always be improved by a re-run.

### If the run exceeds its hard deadline with no safe-output call yet

1. **Stop** analysis / article work immediately — no more `edit` tool calls, no more Pass 2 improvements.
2. **Stage** whatever exists on disk (analysis artifacts and any rendered `news/*.html`). Leave `pass1/` unstaged.
3. **Commit** with message prefixed `[early-pr]` to signal partial content.
4. **Call** `safeoutputs___create_pull_request` once with label `partial`. A partial analysis is always better than zero output.
5. If `safeoutputs___create_pull_request` returns an error, call `safeoutputs___noop` with a message explaining the timeout. NEVER exit without at least attempting one safe-output call.

A single PR is the only PR. Creating it early always beats losing all work to a timer expiry.

### Emergency deadline order of operations

If you are approaching agent minute 42 with Pass 2 or later work still in progress, **stop analysis/article work immediately** and run the following in a single bash session:

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
