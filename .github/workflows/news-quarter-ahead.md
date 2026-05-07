---
name: "News: Quarter Ahead"
description: Generates quarter-ahead strategic outlook articles and renders HTML in all 14 supported languages in a single agentic run (EN + SV + 12 translated). Long-horizon-forecast workflow with 90-day window — covers next-quarter parliamentary calendar, committee schedules, government propositions tabling deadlines, Riksbank rate decisions, and SCB quarterly NA release. Tier-C aggregation × 1.7 depth multiplier. Runs 1st and 15th of each month.
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
    - cron: "0 9 1,15 * *"
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
      analysis_depth:
        description: 'Analysis depth for AI iterations (standard=1-2 iterations, deep=2-3 iterations, comprehensive=3+ iterations). Controls SWOT complexity, stakeholder count, scenario tree depth, and dashboard charts.'
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
  group: gh-aw-news-quarter-ahead-${{ inputs.article_date || 'today' }}
  cancel-in-progress: false

features:
  mcp-gateway: true

runtimes:
  node:
    version: "26"

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
    container: "node:26-alpine"
    entrypoint: "npx"
    entrypointArgs: ["-y", "@jarib/pxweb-mcp@2.0.0", "--url", "https://api.scb.se/OV0104/v2beta"]
    allowed: ["*"]
  world-bank:
    container: "node:26-alpine"
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
    labels: [agentic-news, analysis-data, long-horizon, forward-look]
    draft: false
    expires: 14d
    max: 1
    if-no-changes: warn
    fallback-as-issue: true
    protected-files:
      policy: allowed
  add-comment: {}

steps:
  - name: News pre-warm & pre-flight (composite)
    uses: ./.github/actions/news-prewarm
engine:
  id: copilot
  model: claude-sonnet-4.6
---

# 🧭 Quarter Ahead

Generates deep political intelligence analysis **and** renders the HTML article in **all 14 supported languages** for forward-looking quarterly political intelligence (Tier-C aggregation × 1.7 depth multiplier — see `ext/tier-c-aggregation.md` and `ext/long-horizon-forecasting.md`) in one single agentic run. The 90-day window covers the next-quarter parliamentary calendar (committee schedules, chamber votes, government propositions tabling deadlines, Lagrådet referrals, Riksbank rate decisions, SCB quarterly NA release).

The agent translates `article.md` into `article.<lang>.md` for every non-English language before invoking the renderer with `--lang all`. The dedicated `news-translate` workflow only refines / back-fills existing translations on follow-up runs.

## What this workflow does

- **Article type**: `quarter-ahead` (registry id; see `analysis/article-types.json`)
- **Analysis subfolder**: `analysis/daily/$ARTICLE_DATE/quarter-ahead/`
- **Aggregated markdown**: `analysis/daily/$ARTICLE_DATE/quarter-ahead/article.md`
- **Rendered HTML**: `news/$ARTICLE_DATE-quarter-ahead-{en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh}.html` — **always all 14 languages**
- **Horizon**: 90 days; lookback 90 days (sibling per-type folders + most-recent week-ahead + month-ahead).
- **Single-run model**: download → analysis Pass 1 + 2 → gate → aggregate → translate → render (14 languages) → ONE PR.

## Long-horizon mandate (from `ext/long-horizon-forecasting.md`)

- **Scenario count**: ≥ 4 distinct scenarios in `scenario-analysis.md`, probabilities sum to 100 %.
- **Counterfactuals**: ≥ 2 explicit counterfactual paragraphs in `devils-advocate.md`.
- **Cross-horizon citations**: cite the most recent `week-ahead` AND `month-ahead` analyses in `cross-reference-map.md`. Missing citations fail the gate.
- **IMF policy**: pinned WEO + FM vintage at run start; emit `economic-data.json` v2.0 with quarterly trajectory series for SWE + Nordic peers (DNK, NOR, FIN).
- **Forward indicators**: ≥ 12 dated indicators across the bands `week / month / quarter / year / election`.
- **Word floor**: ≥ 2 000 words (versus 1 500 for week-ahead / month-ahead).

## Time budget

> 🟡 **Plan to call `safeoutputs___create_pull_request` by agent minute 42 (hard deadline 45)** to reserve job-level headroom for setup variance and the safe-outputs runner. See `00-base-contract.md §Session timing` and `07-commit-and-pr.md §Deadline enforcement`.

| Minutes | Phase | Module |
|---------|-------|--------|
| 0–3 | MCP pre-warm + pre-flight | 02 / 03 |
| 3–7 | Download data + catalogue + IMF pinned vintage | 03 |
| 7–25 | Analysis Pass 1 (all 23 artifacts at 1.7× depth, scenario tree depth 4, ≥ 12 forward indicators) | 04 + ext/long-horizon-forecasting |
| 25–34 | Analysis Pass 2 (read-back + improvements; ≥ 2 counterfactuals) | 04 |
| 34–36 | Analysis Gate (checks 1–11 + Tier-C additive + long-horizon checks) | 05 |
| 36–38 | Aggregate (`article.md`) | 06 |
| 38–40 | Translate `article.md` → `article.<lang>.md` × 13 (sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh) | 06 |
| 40–42 | Render (`scripts/render-articles.ts --lang all` → all 14 HTML) | 06 |
| 42–43 | Stage + commit + ONE `safeoutputs___create_pull_request` — **HARD DEADLINE agent minute 45** | 07 |

Use the setup-aware agent budget for AI-FIRST iteration; trim scope before quality and open the PR by agent minute 42 (hard 45). Never open a second PR within a run.

## Inputs

- `article_date` — override date (defaults to today)
- `force_generation` — regenerate even if today's content exists
- `analysis_depth` — `standard` | `deep` (default) | `comprehensive`

> **Note**: there is no `languages` input. Every run produces all 14 language HTML files. Translation depth-of-quality scales with the time budget (see the table above).

## Run-mode selection

At the start of every run, the pre-flight check in `03-data-download.md` detects whether `analysis/daily/$ARTICLE_DATE/quarter-ahead/` already contains all 23 required artifacts:

- **No analysis found** → run the full pipeline.
- **Analysis found** → enter improvement-mode (see `04-analysis-pipeline.md §Improvement-mode path`); add fresh evidence on top of the snapshotted baseline.

All other rules live in the imported modules.
