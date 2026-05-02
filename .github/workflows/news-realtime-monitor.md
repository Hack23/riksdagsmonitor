---
name: News Realtime Monitor
description: Monitors Riksdag and Government for real-time updates and generates breaking news articles in core languages (EN, SV) with Playwright validation. Translations handled by news-translate workflow. Runs twice daily on weekdays, once on weekends.
strict: false  # Allow custom network domain riksdag-regering-ai.onrender.com (trusted MCP server)
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
  schedule:
    # Run twice during Swedish parliamentary working hours (CET/CEST)
    # 10:00 UTC (11:00 CET) - Mid-morning check
    - cron: '0 10 * * 1-5'
    # 14:00 UTC (15:00 CET) - Afternoon check
    - cron: '0 14 * * 1-5'
    # Weekend: single midday check for government press releases, crisis, urgent documents
    - cron: '0 12 * * 0,6'
  workflow_dispatch:
    inputs:
      article_date:
        description: 'Article date (YYYY-MM-DD) for manual backfills. Defaults to today when omitted or scheduled.'
        required: false
      article_types:
        description: 'Comma-separated article types to generate (breaking,committee-reports,propositions,motions,interpellations,week-ahead,month-ahead,weekly-review,monthly-review,deep-inspection). Default: breaking'
        required: false
        default: breaking
      focus:
        description: 'Focus area: votes, debates, questions, all'
        required: false
        default: all
      languages:
        description: 'Core content languages (en,sv | nordic | eu-core | all). Translations handled by news-translate workflow.'
        required: false
        default: en,sv
      analysis_depth:
        description: 'Analysis depth for AI iterations (standard=1-2 iterations, deep=2-3 iterations, comprehensive=3+ iterations). Controls SWOT complexity, stakeholder count, and dashboard charts. Default: deep (minimum 15 min analysis, Mermaid diagrams required).'
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
  group: gh-aw-news-realtime-monitor-${{ inputs.article_date || 'today' }}
  cancel-in-progress: false

features:
  mcp-gateway: true

sandbox:
  mcp:
    keepalive-interval: 300 # gh-aw mcp-gateway `keepaliveInterval` — 5-min HTTP MCP ping (overrides upstream default `1500s`) to keep `riksdag-regering` (HTTP) and other HTTP-backed MCPs warm for the full 60-min job. Pairs with `engine.mcp.session-timeout: 1h` below, which now governs MCP gateway session lifetime (gh-aw v0.71.3, default 6h). The PR deadline is now ~minute 50 (hard 55) — see prompts/07-commit-and-pr.md §Deadline enforcement.

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
  playwright:
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
  mcp:
    session-timeout: 1h # gh-aw v0.71.3 — keeps MCP gateway sessions alive for the full 60-min job (default would be 6h; we cap at 1h to free gateway resources sooner). See https://github.com/github/gh-aw/issues/29353.
---

# 🚨 Realtime Monitor

Generates deep political intelligence analysis **and** the rendered HTML article for realtime political event pulse (Tier-C aggregation — reads sibling analyses across the reporting window and applies period multipliers from `ext/tier-c-aggregation.md`) in one single agentic run. Core languages are `en` + `sv`; translations to the remaining twelve languages are produced by the separate `news-translate` workflow.

## What this workflow does

- **Article type**: `realtime-pulse`
- **Analysis subfolder**: `analysis/daily/$ARTICLE_DATE/realtime-pulse/`
- **Aggregated markdown**: `analysis/daily/$ARTICLE_DATE/realtime-pulse/article.md` (produced by `scripts/aggregate-analysis.ts`)
- **Rendered HTML**: `news/$ARTICLE_DATE-realtime-pulse-{en,sv}.html` (produced by `scripts/render-articles.ts`)
- **Single-run model**: one run does download → analysis Pass 1 + 2 → gate → aggregate → render → ONE PR. There is no separate "article run". Translations are handled exclusively by `news-translate`.

## Time budget

> 🟢 **MCP gateway session timeout — gh-aw v0.71.3**: The workflow declares `engine.mcp.session-timeout: 1h`, which keeps MCP gateway sessions (including `safeoutputs`) alive for the full 60-min job. The PR deadline is now governed by the Copilot API session (~60 min, Timer B) and the job `timeout-minutes: 60` (Timer A). **Plan to call `safeoutputs___create_pull_request` by minute 50 (hard deadline 55)** to leave 5 min of margin for the safe-outputs runner to publish the PR. See `00-base-contract.md §Session keepalive requirement` and `07-commit-and-pr.md §Deadline enforcement`.
>
> **AI-FIRST within the 60-minute budget**: Pass 2 is still mandatory. With `engine.mcp.session-timeout: 1h` aligned to the job budget, scheduled runs should honor the configured `analysis_depth=deep` default instead of pre-emptively downgrading scope. Prefer **scope compression over iteration skipping** only if runtime risk emerges — reduce the download/manifest scope if needed, but maintain 1:1 per-document coverage and always perform a full read-back-and-improve Pass 2 on whatever artifacts exist. Reserve `comprehensive` for manual `workflow_dispatch` backfills.

**Single run** (produces all 23 analysis artifacts + aggregated `article.md` + EN/SV HTML, target ~45 min in a 60-min job):

| Minutes | Phase | Module |
|---------|-------|--------|
| 0–3 | MCP pre-warm + pre-flight check | 02 / 03 |
| 3–8 | Download data + catalogue | 03 |
| 8–25 | Analysis Pass 1 (methodology read + per-doc analyses + **all 23 artifacts**: Family A 9 + B 2 + C 5 + D 7) | 04 |
| 25–38 | Analysis Pass 2 (read-back + improvements on all 22 text files) | 04 |
| 38–40 | Analysis Gate (checks 1–8) | 05 |
| 40–43 | `scripts/aggregate-analysis.ts` (concat → `article.md`) + `scripts/render-articles.ts --lang en,sv` (render HTML) | 06 |
| 43–50 | Stage analysis + `article.md` + `news/*.html`, commit, **ONE** `safeoutputs___create_pull_request` — **HARD DEADLINE minute 55** | 07 |

Use the full budget for AI-FIRST iteration; do **not** finish early with shallow output (see `.github/copilot-instructions.md §AI FIRST Quality Principle`). Never open a second PR within a run — there is no second PR. **If you reach minute 50 without staging, stop all remaining analysis work, run the aggregator + renderer on whatever artifacts exist, commit, and call `safeoutputs___create_pull_request` immediately** — a partial-but-delivered PR is infinitely better than losing the run to Timer A.

## Inputs

- `article_date` — override date (defaults to today)
- `force_generation` — regenerate even if today's content exists; also forces analysis re-run
- `languages` — core content languages (default `en,sv`)
- `analysis_depth` — `standard` | `deep` (default) | `comprehensive`

## Run-mode selection

At the start of every run, the pre-flight check in `03-data-download.md` detects whether `analysis/daily/$ARTICLE_DATE/realtime-pulse/` already contains all **23 required artifacts**:

- **No analysis found** → run the full pipeline (download → Pass 1 → Pass 2 → gate → aggregate → render → PR).
- **Analysis found** → skip download / Pass 1 / Pass 2 / gate, re-load the analysis into context, run aggregate + render, and open the PR.

Repeated runs for the same `$ARTICLE_DATE` always use the same analysis folder when `force_generation=false`.

All other rules (bash format, AWF shell safety, MCP access, download pipeline, analysis methodology & gate, aggregate + render, commit & PR policy) live in the imported modules.
