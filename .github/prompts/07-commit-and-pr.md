# 07 — Commit & Pull Request (exactly one PR per run)

## Core rule

> Every run ends with **exactly one** safe-output call:
> - `safeoutputs___create_pull_request` — when any file on disk was created or modified.
> - `safeoutputs___noop` — only when zero files were produced (e.g. MCP unreachable from the start).
>
> Do not open checkpoint, heartbeat, or keep-alive PRs. Content committed after the first `create_pull_request` call is lost.

Workflows declare `safe-outputs.create-pull-request.max: 1`. Attempting a second call is a workflow error.

## Two-run PR strategy

| Run mode | What to commit | PR title prefix | Labels | After PR |
|----------|---------------|-----------------|--------|----------|
| **Analysis mode** (`SKIP_ANALYSIS=false`) | `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/*.md` + `*.json` (never `pass1/`) | `📊 Analysis — ` | `analysis-only` + article-type | **Stop.** Do NOT generate articles. The next scheduled run will detect the analysis and enter Article mode automatically. |
| **Article mode** (`SKIP_ANALYSIS=true`) | `news/$YYYY/$MM/$DD/$SLUG.{en,sv}.html` + chart JSON | `📰 ` | `agentic-news` + article-type | Dispatch `news-translate` for 12 remaining languages. |

In **Analysis mode**: commit analysis artifacts, create the `analysis-only` PR, then exit. Zero articles are generated in this run. The analysis stays in the `$ANALYSIS_DIR` folder; the next run of this workflow for the same `$ARTICLE_DATE` will find it and proceed directly to articles.

In **Article mode**: generate articles from existing analysis, commit, and create the articles PR.

## Stage → commit → PR

1. **Stage scoped files only.** Never stage the whole repo.

   | Content | Git path to stage |
   |---------|-------------------|
   | Analysis summaries | `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/*.md` |
   | Visualisation data | `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/*.json` |
   | Articles (core languages) | `news/$YYYY/$MM/$DD/$SLUG.{en,sv}.html` |
   | Translations (news-translate only) | `news/$YYYY/$MM/$DD/$SLUG.<lang>.html` |

   Never stage `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/documents/` wholesale — it often contains 100+ files. Stage only `documents/*.md` **if** your `documents/` stays under the safe-outputs 100-file cap; otherwise stage only summary files. Never stage `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/pass1/` — it is a local gate-evidence snapshot (see `04-analysis-pipeline.md`), not a deliverable.

2. **100-file guard.** Before calling safeoutputs, count staged files. If the count > 99, unstage everything under `documents/` except `synthesis-summary.md` and re-check.

3. **Commit** once with a descriptive message, e.g. `news(${article_type}): $ARTICLE_DATE — analysis + articles`.

4. **Call** `safeoutputs___create_pull_request` exactly once:
   - Title: `📰 ${Article Type} — $ARTICLE_DATE` (analysis-only runs use `📊 Analysis Only — ${Article Type} — $ARTICLE_DATE`).
   - Body: use the PR template below.
   - Labels: `agentic-news` + article-type label + `analysis-only` when no articles generated.
   - Branch: handled automatically by safeoutputs (`news/content/$ARTICLE_DATE/$ARTICLE_TYPE`).

5. **Do not** `git push`, `git checkout`, or `git checkout -b` after the call. The safe-outputs runner job publishes the PR; subsequent agent commits are not added.

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

- [x] news/.../$SLUG.en.html
- [x] news/.../$SLUG.sv.html

## Methodology & compliance

- Methodology: `analysis/methodologies/ai-driven-analysis-guide.md`
- Templates: `analysis/templates/`
- Evidence: every claim cites `dok_id`, named actor, vote count, or primary-source URL.
- GDPR / ISMS: public-source data only; neutrality applied; DPIA not required (no new high-risk processing).

## Iteration

- Pass 1 analysis: ✅
- Pass 2 improvement: ✅
- Article Pass 2: ✅
```

## No-op policy

Call `safeoutputs___noop({"message": "<reason>"})` **only** if:

- MCP unreachable from start **and** no files were created, or
- Hard input error (e.g. invalid `article_date`) **and** no files were created.

In every other case, commit whatever exists and call `create_pull_request` once.

## Deadline enforcement

Two independent timers can kill a run silently. Plan for the **shorter** of the two.

> **Timer A — Copilot API session (~60 min)**: The Copilot API session is bound to the `github.token` baked in at step start. That token expires at approximately **60 minutes** and is never refreshed mid-run (gh-aw issue #24920). Every tool call and inference request fails silently after that point — the agent appears to run but makes no progress and the PR is never created. Setup steps consume ~5 minutes, so the agent has at most **~55 minutes** of usable session time.
>
> **Timer B — Safe Outputs MCP idle session (~25–30 min, observed)**: The local Safe Outputs HTTP MCP tracks a per-agent Streamable HTTP session. If the agent goes **idle toward safeoutputs** for 25+ minutes (e.g. a long Pass 1 that only uses `edit` + `bash`), the session is dropped and every subsequent `safeoutputs___*` call returns `Error POSTing to endpoint: session not found` — including the final `create_pull_request`, `noop`, and `report_incomplete`. The `sandbox.mcp.keepalive-interval: 300` setting does **not** prevent this; that knob keeps the `mcp-gateway` upstream MCPs alive, not the safeoutputs HTTP server. Observed failure: run [`24821837975`](https://github.com/Hack23/riksdagsmonitor/actions/runs/24821837975) — 23 artifacts committed at ~33 min, all three safe-output calls rejected.

### Keeping the Safe Outputs MCP session warm

Do **not** use safe outputs as a keepalive strategy. In this workflow, `safeoutputs___create_pull_request` is limited to a single successful end-of-run call, and `safeoutputs___noop` is likewise reserved for the final "no files produced" outcome, so neither can be safely spent to keep the Safe Outputs MCP session alive. Some other `safeoutputs___*` tools (e.g. `report_incomplete`, `missing_tool`, `missing_data`) may allow more than one call in compiled workflows, but they are not a documented or reliable heartbeat path for this prompt. **The only reliable mitigation is to reach `safeoutputs___create_pull_request` before Timer B fires.** Plan Pass 1 + gate + commit to finish well inside the 30-minute hard deadline below. If a future gh-aw release publishes a safe touch path for the local safeoutputs HTTP server (for example, an explicitly supported status or `tools/list` endpoint with verified keepalive behaviour), update this section with the concrete command and its observed effect.

### PR-creation windows

> **Authoritative override:** For PR timing and hard deadlines, this section supersedes any older guidance imported from `.github/prompts/00-base-contract.md` that suggests creating the PR at around **45 minutes**. The operative deadline for both runs is **30 minutes**, with Run 1 targeting **22–27 minutes** and Run 2 targeting **20–25 minutes**.

| Mode | Target PR window | Hard deadline | Floor for Pass 2 |
|------|------------------|---------------|------------------|
| Run 1 — Analysis | **22–27 min** after agent start | **30 min** | 5 min, skip beyond 25 min |
| Run 2 — Articles | 20–25 min after agent start | **30 min** | 5 min, skip beyond 25 min |

These windows are tighter than the historical 48-min figure because Timer B fires first on the 23-artifact pipeline. The 30-min hard deadline leaves ~5 minutes of margin for staging, `git commit`, and the safeoutputs round-trip before Timer B has been observed to fire, and ~25 minutes of margin before Timer A.

### If the run exceeds its hard deadline with no safe-output call yet

1. **Stop** analysis / article work immediately — no more `edit` tool calls, no more Pass 2 improvements.
2. **Stage** whatever exists on disk (analysis artifacts and/or partial articles). Do not stage `pass1/`.
3. **Commit** with message prefixed `[early-pr]` to signal partial content.
4. **Call** `safeoutputs___create_pull_request` once with label `analysis-only` if Pass 2 is incomplete or articles are missing.
5. If `create_pull_request` returns `session not found`, do **not** retry — the MCP session is gone. The work is lost for this run; the commit on disk is not persisted because the safe-outputs runner never saw it. Document the incident in the next run's methodology-reflection.

Do not attempt to "save" work via a second PR — there is no second PR. Creating the PR early is always better than losing all work to a session expiry.

### Emergency deadline order of operations

If you are approaching 25 min with Pass 2 in progress, **stop Pass 2 immediately** and run the following in a single bash session:

```bash
cd "$GITHUB_WORKSPACE"
git add "analysis/daily/$ARTICLE_DATE/$SUBFOLDER/"*.md "analysis/daily/$ARTICLE_DATE/$SUBFOLDER/"*.json 2>/dev/null || true
git reset HEAD "analysis/daily/$ARTICLE_DATE/$SUBFOLDER/pass1/" 2>/dev/null || true
git commit -m "[early-pr] analysis($ARTICLE_TYPE): $ARTICLE_DATE — Pass 1 complete, Pass 2 partial"
```

Then immediately call `safeoutputs___create_pull_request` with label `analysis-only`. A Pass-1-only analysis-only PR is always better than zero output.
