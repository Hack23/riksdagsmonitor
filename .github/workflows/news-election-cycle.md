---
name: "News: Election Cycle"
description: Generates election-cycle deep intelligence articles in core languages (EN, SV). The longest forward-look horizon — covers the full 4-year mandate (current Tidö 2022-09-11 → 2026-09-13 and next 2026-09-13 → 2030-09-08). Tier-C aggregation × 2.5 depth multiplier. Mandates wildcards-blackswans + quantitative-swot + political-stride-assessment + cycle-trajectory (24th artifact) blocking. Initially workflow_dispatch only until runtime is measured over 4-6 manual runs; cron `0 9 13 3,9 *` is declared but commented out below.
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
  - ../prompts/ext/cycle-rollover.md
on:
  # Cron declared but disabled until runtime is validated. Operator
  # un-comments after the 4th successful manual `workflow_dispatch` run.
  # schedule:
  #   - cron: "0 9 13 3,9 *"
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
      cycle_anchor:
        description: 'Which cycle to analyse (current=Tidö 2022-26 mandate scorecard; next=post-2026 coalition forecast; both=both — produces TWO sub-subfolders under election-cycle/).'
        required: false
        default: both
      analysis_depth:
        description: 'Analysis depth — election-cycle defaults to comprehensive given the 2.5× multiplier and 24th artifact requirement.'
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
  group: gh-aw-news-election-cycle-${{ inputs.article_date || 'today' }}-${{ inputs.cycle_anchor || 'both' }}
  cancel-in-progress: false

features:
  mcp-gateway: true

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
    key: news-${{ github.workflow }}-${{ inputs.article_date || 'today' }}-${{ inputs.cycle_anchor || 'both' }}
    retention-days: 30

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
  max-patch-size: 8192
  create-pull-request:
    labels: [agentic-news, analysis-data, long-horizon, forward-look, election-cycle]
    draft: false
    expires: 30d
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
---

# 🗳️ Election Cycle

Generates the **deepest** Riksdagsmonitor intelligence product — a full 4-year-mandate political assessment covering the **current** Tidö cycle (2022-09-11 → 2026-09-13) and/or the **next** cycle (2026-09-13 → 2030-09-08). Tier-C aggregation × **2.5 depth multiplier**.

## What this workflow does

- **Article type**: `election-cycle` (registry id; see `analysis/article-types.json`)
- **Analysis subfolder**: `analysis/daily/$ARTICLE_DATE/election-cycle/{current,next}/` — one sub-subfolder per cycle anchor when `cycle_anchor=both`.
- **Aggregated markdown**: one per anchor (`article.md` lives in each sub-subfolder).
- **Rendered HTML**: `news/$ARTICLE_DATE-election-cycle-{current,next}-{en,sv}.html`.
- **Horizon**: 1 460 days (4 years); lookback 365 days.
- **Single-run model**: same as week/month/quarter/year-ahead; one PR with all rendered HTML for both anchors when `cycle_anchor=both`.

### Cycle anchor semantics

- `current` (Tidö Mandate, 2022-09-11 → 2026-09-13)
  - Mandate-fulfilment scorecard (every Tidö-agreement bullet point: implemented / partial / abandoned)
  - KU reprimands ledger (every KU-anmälan against the government during the mandate)
  - Coalition cohesion trajectory (rolling 12-month vote-discipline metric per party)
- `next` (Post-2026 Mandate, 2026-09-13 → 2030-09-08)
  - Coalition-formation forecast (Sainte-Laguë on latest seat projections × all viable coalitions)
  - Post-election scenario tree (4 base × 3 governing-coalition branches = 12 leaves)
  - Opposition trajectory (which parties become government / opposition under each leaf)

### Cycle rollover

`ext/cycle-rollover.md` activates **only** within ± 30 days of a Swedish election anchor (currently 2026-09-13). It encodes the file-rename + content-carry-forward + PIR archival procedure to convert in-flight cycle-current artifacts into cycle-next baselines. Outside the ± 30-day window the module is a no-op.

## Long-horizon mandate (from `ext/long-horizon-forecasting.md`)

- **Scenario count**: 4 base × 3 governing-coalition branches = **12 leaves** in `scenario-analysis.md`. Probabilities at every level sum to 100 %.
- **Wildcards**: ≥ 5 wildcards + ≥ 3 black-swan tails in `wildcards-blackswans.md` (blocking).
- **Counterfactuals**: ≥ 3 explicit counterfactual paragraphs in `devils-advocate.md`.
- **PESTLE mandatory**: blocking (`pestle-analysis.md`).
- **Quantitative-SWOT mandatory**: blocking (`quantitative-swot.md`).
- **STRIDE assessment mandatory**: blocking (`political-stride-assessment.md`) — every TTP carries an actor + dimension + risk score.
- **Cycle trajectory** (24th artifact, this type only): `cycle-trajectory.md` — multi-year SCB + IMF + Riksdag throughput trend; ICD 203 BLUF + WEP per year; explicit horizon bands T+1y / T+2y / T+5y.
- **Cross-horizon citations**: cite ≥ 2 most recent `year-ahead` analyses + ≥ 12 most recent `monthly-review` analyses in `cross-reference-map.md`.
- **IMF policy**: full `imf-fetch.ts compare` across Nordic peers + multi-vintage trajectory (compare WEO Apr vs Oct vintages). Each citation includes projection-year stamp.
- **Forward indicators**: ≥ 15 dated indicators across `quarter / year / cycle / election` bands.
- **Article floor**: ≥ 3 500 words; ≥ 10 distinct `dok_id` references; ≥ 5 charts (election forecast, coalition matrix, mandate scorecard, fiscal trajectory, KU reprimand ledger).

## Time budget

> 🟡 **Plan to call `safeoutputs___create_pull_request` by agent minute 42 (hard deadline 45)** to reserve job-level headroom for setup variance and the safe-outputs runner. See `00-base-contract.md §Session timing` and `07-commit-and-pr.md §Deadline enforcement`.

This workflow runs at the **upper limit** of the 60-minute job envelope. Initially gated `workflow_dispatch`-only until runtime is measured over 4–6 manual runs.

| Minutes | Phase |
|---------|-------|
| 0–3 | MCP pre-warm + IMF multi-vintage pin |
| 3–7 | Download data (Riksdag full-mandate corpus, SCB multi-year, IMF Nordic compare + multi-vintage) |
| 7–29 | Analysis Pass 1 (24 artifacts at 2.5× depth, 12-leaf scenario tree, full mandate scorecard or coalition forecast) |
| 29–37 | Analysis Pass 2 (read-back; counterfactuals × 3; horizon-band stratification across all five bands) |
| 37–39 | Analysis Gate (long-horizon checks + 24th-artifact check + cycle-rollover check if within ± 30 days) |
| 39–41 | Aggregate + render (per-anchor sub-subfolders) |
| 41–43 | Stage + commit + ONE `safeoutputs___create_pull_request` — **HARD DEADLINE agent minute 45** |

> 🟡 **Scope-compression rule**: depth multiplier 2.5× is aspirational — under the 60-min envelope, prefer reducing per-document Family-E coverage (drop dok_ids ranked < 6 in significance-scoring) rather than skipping any of the 24 artifacts. The 24-artifact contract is hard.

## Inputs

- `article_date` — override date (defaults to today)
- `force_generation` — regenerate even if recent cycle analysis exists
- `cycle_anchor` — `current` | `next` | `both` (default `both`)
- `languages` — core content languages (default `en,sv`)
- `analysis_depth` — defaults to `comprehensive`

All other rules live in the imported modules.
