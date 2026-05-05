---
name: "News: Weekly Review"
description: Generates weekly review retrospective articles in core languages (EN, SV). Translations handled by news-translate workflow. Runs Saturdays to review the past week.
strict: false
imports:
  - ../prompts/00-base-contract.md
  - ../prompts/01-bash-and-shell-safety.md
  - ../prompts/02-mcp-access.md
  - ../prompts/03-data-download.md
  - ../prompts/04-analysis-pipeline.md
  - ../prompts/05-analysis-gate.md
  - ../prompts/06-article-generation.md
  - ../prompts/07-commit-and-pr.md
  - ../prompts/ext/tier-c-aggregation.md
on:
  schedule: weekly on saturday around 9:00
  workflow_dispatch:
    inputs:
      article_date:
        description: 'Article date (YYYY-MM-DD) for manual backfills. Defaults to today when omitted or scheduled.'
        required: false
      force_generation:
        description: Force generation even if recent articles exist
        type: boolean
        required: false
        default: false
      languages:
        description: 'Core languages for content generation (en,sv | nordic | eu-core | all). Translations for remaining languages are handled by the dedicated news-translate workflow.'
        required: false
        default: en,sv
      analysis_depth:
        description: 'Analysis depth for AI iterations (standard=1-2 iterations, deep=2-3 iterations, comprehensive=3+ iterations). Controls SWOT complexity, stakeholder count, and dashboard charts.'
        required: false
        default: deep

permissions:
  contents: read
  issues: read
  pull-requests: read
  actions: read
  discussions: read
  security-events: read

timeout-minutes: 60

concurrency:
  group: gh-aw-news-weekly-review-${{ inputs.article_date || 'today' }}
  cancel-in-progress: false

features:
  mcp-gateway: true

runtimes:
  node:
    version: "25"

network:
  allowed:
    - node
    # Minimal Docker Hub hosts for node:25-alpine pulls used by SCB + World Bank MCP servers
    # (replaces the broader `containers` ecosystem identifier to keep least-privilege egress)
    - docker.io
    - registry-1.docker.io
    - auth.docker.io
    - production.cloudflare.docker.com
    - github
    - riksdag-regering-ai.onrender.com
    - api.scb.se
    - api.worldbank.org
    - api.imf.org
    - data.imf.org
    - www.imf.org
    - sdmxcentral.imf.org
    - data.riksdagen.se
    - www.riksdagen.se
    - riksdagen.se
    - www.regeringen.se
    - www.scb.se
    - www.statskontoret.se
    - statskontoret.se
    - www.lagradet.se
    - lagradet.se
    - regeringen.se
    - hack23.com
    - www.hack23.com
    - riksdagsmonitor.com
    - www.riksdagsmonitor.com
    - raw.githubusercontent.com
    - hack23.github.io
    - defaults

mcp-servers:
  riksdag-regering:
    url: https://riksdag-regering-ai.onrender.com/mcp
    allowed: ["*"]
  scb:
    container: "node:25-alpine"
    entrypoint: "npx"
    entrypointArgs: ["-y", "@jarib/pxweb-mcp@2.0.0", "--url", "https://api.scb.se/OV0104/v2beta"]
    allowed: ["*"]
  world-bank:
    container: "node:25-alpine"
    entrypoint: "npx"
    entrypointArgs: ["-y", "worldbank-mcp@1.0.1"]
    allowed: ["*"]

tools:
  startup-timeout: 180
  timeout: 120
  github:
    toolsets:
      - all
  agentic-workflows: true
  bash: true
  edit:
  web-fetch:
  cache-memory:
    key: news-${{ github.workflow }}-${{ inputs.article_date || 'today' }}
    retention-days: 14

safe-outputs:
  threat-detection:
    continue-on-error: true
  allowed-domains:
    - riksdag-regering-ai.onrender.com
    - api.scb.se
    - api.worldbank.org
    - api.imf.org
    - data.imf.org
    - www.imf.org
    - sdmxcentral.imf.org
    - data.riksdagen.se
    - www.riksdagen.se
    - riksdagen.se
    - www.regeringen.se
    - www.scb.se
    - www.statskontoret.se
    - statskontoret.se
    - www.lagradet.se
    - lagradet.se
    - hack23.com
    - www.hack23.com
    - riksdagsmonitor.com
    - www.riksdagsmonitor.com
    - raw.githubusercontent.com
    - hack23.github.io
  max-patch-size: 4096
  create-pull-request:
    labels: [agentic-news, analysis-data]
    draft: false
    expires: 14d
    max: 1
    if-no-changes: warn       # Don't fail when nothing changed (resilience)
    fallback-as-issue: true   # If org disables Actions PR creation, fall back to an issue with branch link
    protected-files:
      policy: allowed
  add-comment: {}
  dispatch-workflow:
    workflows: [news-translate]
    max: 1

steps:
  - name: News pre-warm & pre-flight (composite)
    uses: ./.github/actions/news-prewarm
engine:
  id: copilot
  model: claude-sonnet-4.6
---

# 📊 Weekly Review

Generates deep political intelligence analysis **and** the rendered HTML article for weekly political intelligence review (Tier-C aggregation — reads sibling analyses across the reporting window and applies period multipliers from `ext/tier-c-aggregation.md`) in one single agentic run. Core languages are `en` + `sv`; translations to the remaining twelve languages are produced by the separate `news-translate` workflow.

## What this workflow does

- **Article type**: `weekly-review`
- **Analysis subfolder**: `analysis/daily/$ARTICLE_DATE/weekly-review/`
- **Aggregated markdown**: `analysis/daily/$ARTICLE_DATE/weekly-review/article.md` (produced by `scripts/aggregate-analysis.ts`)
- **Rendered HTML**: `news/$ARTICLE_DATE-weekly-review-{en,sv}.html` (produced by `scripts/render-articles.ts`)
- **Single-run model**: one run does download → analysis Pass 1 + 2 → gate → aggregate → render → ONE PR. There is no separate "article run". Translations are handled exclusively by `news-translate`.

## Time budget

> 🟡 **Plan to call `safeoutputs___create_pull_request` by agent minute 42 (hard deadline 45)** to reserve job-level headroom for setup variance and the safe-outputs runner. See `00-base-contract.md §Session timing` and `07-commit-and-pr.md §Deadline enforcement`.
>
> **AI-FIRST within the 60-minute budget**: Pass 2 is still mandatory. Scheduled runs should honor the configured `analysis_depth=deep` default instead of pre-emptively downgrading scope. Prefer **scope compression over iteration skipping** only if runtime risk emerges — reduce the download/manifest scope if needed, but maintain 1:1 per-document coverage and always perform a full read-back-and-improve Pass 2 on whatever artifacts exist. Reserve `comprehensive` for manual `workflow_dispatch` backfills.

**Single run** (produces all 23 analysis artifacts + aggregated `article.md` + EN/SV HTML, target ~40 agent minutes in a 60-min job):

| Minutes | Phase | Module |
|---------|-------|--------|
| 0–3 | MCP pre-warm + pre-flight check | 02 / 03 |
| 3–7 | Download data + catalogue | 03 |
| 7–22 | Analysis Pass 1 (methodology read + per-doc analyses + **all 23 artifacts**: Family A 9 + B 2 + C 5 + D 7) | 04 |
| 22–34 | Analysis Pass 2 (read-back + improvements on all 22 text files) | 04 |
| 34–36 | Analysis Gate (checks 1–8) | 05 |
| 36–39 | `scripts/aggregate-analysis.ts` (concat → `article.md`) + `scripts/render-articles.ts --lang en,sv` (render HTML) | 06 |
| 39–42 | Stage analysis + `article.md` + `news/*.html`, commit, **ONE** `safeoutputs___create_pull_request` — **HARD DEADLINE agent minute 45** | 07 |

Use the full budget for AI-FIRST iteration; do **not** finish early with shallow output (see `.github/copilot-instructions.md §AI FIRST Quality Principle`). Never open a second PR within a run — there is no second PR. **If you reach agent minute 42 without staging, stop all remaining analysis work, run the aggregator + renderer on whatever artifacts exist, commit, and call `safeoutputs___create_pull_request` immediately** — a partial-but-delivered PR is infinitely better than losing the run to Timer A.

## Inputs

- `article_date` — override date (defaults to today)
- `force_generation` — regenerate even if today's content exists; also forces analysis re-run
- `languages` — core content languages (default `en,sv`)
- `analysis_depth` — `standard` | `deep` (default) | `comprehensive`

## Run-mode selection

At the start of every run, the pre-flight check in `03-data-download.md` detects whether `analysis/daily/$ARTICLE_DATE/weekly-review/` already contains all **23 required artifacts**:

- **No analysis found** → run the full pipeline (download → Pass 1 → Pass 2 → gate → aggregate → render → PR).
- **Analysis found** → skip download / Pass 1 / Pass 2 / gate, re-load the analysis into context, run aggregate + render, and open the PR.

Repeated runs for the same `$ARTICLE_DATE` always use the same analysis folder when `force_generation=false`.

All other rules (bash format, AWF shell safety, MCP access, download pipeline, analysis methodology & gate, aggregate + render, commit & PR policy) live in the imported modules.
