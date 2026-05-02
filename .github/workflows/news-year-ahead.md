---
name: "News: Year Ahead"
description: Generates year-ahead annual political-economic outlook articles in core languages (EN, SV). Long-horizon-forecast workflow with 365-day window — anchored in IMF WEO Apr/Oct vintages, covers the Swedish budget rhythm (BP autumn + VP spring), Riksmöte calendar, EU presidency rotations, and full Nordic-peer comparison. Tier-C aggregation × 2.0 depth multiplier. PESTLE + wildcards-blackswans + quantitative-swot mandatory. Translations handled by news-translate workflow. Runs 5th of January and 5th of July to track WEO vintage rotation.
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
  - ../prompts/ext/long-horizon-forecasting.md
on:
  schedule:
    - cron: "0 9 5 1,7 *"
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
        description: 'Analysis depth for AI iterations (standard=1-2 iterations, deep=2-3 iterations, comprehensive=3+ iterations). Year-ahead defaults to comprehensive due to depth multiplier 2.0×.'
        required: false
        default: comprehensive

permissions:
  contents: read
  issues: read
  pull-requests: read
  actions: read
  discussions: read
  security-events: read

timeout-minutes: 60

concurrency:
  group: gh-aw-news-year-ahead-${{ inputs.article_date || 'today' }}
  cancel-in-progress: false

features:
  mcp-gateway: true

sandbox:
  mcp:
    keepalive-interval: 300 # 5-min HTTP MCP ping; pairs with `engine.mcp.session-timeout: 1h` (gh-aw v0.71.3) for the full 60-min job. PR deadline ~agent minute 42 (hard 45).

runtimes:
  node:
    version: "25"

network:
  allowed:
    - node
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
    labels: [agentic-news, analysis-data, long-horizon, forward-look, year-ahead]
    draft: false
    expires: 14d
    max: 1
    if-no-changes: warn
    fallback-as-issue: true
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

# 🛰️ Year Ahead

Generates the deepest scheduled forward-look at Swedish politics — a 365-day annual outlook anchored in the freshest IMF WEO vintage available at run time (April or October), tracking the Swedish budget rhythm (BP autumn + VP spring), the Riksmöte calendar, and EU presidency rotations affecting Swedish politics. Tier-C aggregation × **2.0 depth multiplier**.

## What this workflow does

- **Article type**: `year-ahead` (registry id; see `analysis/article-types.json`)
- **Analysis subfolder**: `analysis/daily/$ARTICLE_DATE/year-ahead/`
- **Aggregated markdown**: `analysis/daily/$ARTICLE_DATE/year-ahead/article.md`
- **Rendered HTML**: `news/$ARTICLE_DATE-year-ahead-{en,sv}.html`
- **Horizon**: 365 days; lookback 180 days.
- **Single-run model**: download → analysis Pass 1 + 2 → gate → aggregate → render → ONE PR.

## Long-horizon mandate (from `ext/long-horizon-forecasting.md`)

- **Scenario count**: ≥ 4 base scenarios + 5 wildcards in `scenario-analysis.md` + `wildcards-blackswans.md` (the supplementary wildcards-blackswans template is **blocking** for this article type).
- **Counterfactuals**: ≥ 2 explicit counterfactual paragraphs in `devils-advocate.md`.
- **Cross-horizon citations**: cite ≥ 2 most recent `quarter-ahead` analyses + ≥ 4 most recent `monthly-review` analyses in `cross-reference-map.md`. Missing citations fail the gate.
- **PESTLE mandatory**: `pestle-analysis.md` (otherwise supplementary) is **blocking** — outside-in environmental scan across all six dimensions.
- **Quantitative-SWOT mandatory**: `quantitative-swot.md` is **blocking** — every SWOT row carries a numeric weighting and impact estimate.
- **IMF policy**: full `imf-fetch.ts compare` across Nordic peers (SWE, DNK, NOR, FIN) for WEO macro + FM fiscal + DOTS bilateral trade. Each WEO/FM citation must include the projection-year stamp (T+1, T+2, T+5).
- **Forward indicators**: ≥ 12 dated indicators across `month / quarter / year / cycle / election` bands.
- **Word floor**: ≥ 2 500 words.
- **Election cycle anchor**: `current` (until 2026-09-13); flips to `next` after the election (registry-driven).

## Time budget

> 🟢 **MCP gateway session timeout — gh-aw v0.71.3**: `engine.mcp.session-timeout: 1h` keeps MCP sessions alive for the full 60-min job. Because the 60-min job clock includes host-side setup before Copilot starts, plan to call `safeoutputs___create_pull_request` by agent minute 42 (hard 45).

| Minutes | Phase |
|---------|-------|
| 0–3 | MCP pre-warm + IMF vintage pin |
| 3–7 | Download data (Riksdag + SCB + IMF Nordic-peer compare) |
| 7–27 | Analysis Pass 1 (all 23 artifacts + PESTLE + wildcards + quantitative-SWOT at 2.0× depth) |
| 27–35 | Analysis Pass 2 (read-back; counterfactuals; horizon-band stratification) |
| 35–37 | Analysis Gate (long-horizon checks) |
| 37–40 | Aggregate + render |
| 40–42 | Stage + commit + ONE `safeoutputs___create_pull_request` — **HARD DEADLINE agent minute 45** |

> 🟡 **Scope-compression rule**: if you reach agent minute 35 without Pass 2 complete, halt Pass 2 deepening and run the gate against whatever you have — `if-no-changes: warn` will not silently fail the run, but a missing PR will. Always trim depth before iterating.

## Inputs

- `article_date` — override date (defaults to today)
- `force_generation` — regenerate even if recent year-ahead exists (within 60 days)
- `languages` — core content languages (default `en,sv`)
- `analysis_depth` — defaults to `comprehensive`

All other rules live in the imported modules.
