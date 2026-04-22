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

> **Root cause**: The Copilot API session is bound to the `github.token` baked in at step start. That token expires at approximately **60 minutes** and is never refreshed mid-run (gh-aw issue #24920). Every tool call and inference request fails silently after that point — the agent appears to run but makes no progress and the PR is never created. Setup steps consume ~5 minutes, so the agent has at most **~55 minutes** of usable session time, and safe-outputs publishing needs several minutes on top.

**If the run exceeds 25 minutes with no safe-output call yet:**

1. Stop analysis / article work immediately.
2. Stage whatever exists on disk (analysis artifacts and/or partial articles).
3. Commit with message including `[early-pr]` to signal partial content.
4. Call `safeoutputs___create_pull_request` with label `analysis-only` if articles are incomplete.

Do not attempt to "save" work via a second PR — there is no second PR. Creating the PR early is always better than losing all work to a token expiry.
