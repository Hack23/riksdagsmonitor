---
name: News Realtime Monitor
description: Monitors Riksdag and Government for real-time updates and generates breaking news articles, rendering HTML in all 14 supported languages in a single agentic run (EN + SV + 12 translated) with Playwright validation. Runs twice daily on weekdays, once on weekends.
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

runtimes:
  node:
    version: "26"

network:
  allowed:
    - node
    # Minimal Docker Hub hosts for node:26-alpine pulls used by SCB + World Bank MCP servers
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
  max-patch-size: 10240
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

steps:
  - name: News pre-warm & pre-flight (composite)
    uses: ./.github/actions/news-prewarm
engine:
  id: copilot
  model: claude-sonnet-4.6
---

# 🚨 Realtime Monitor

Generates deep political intelligence analysis **and** renders the HTML article in **all 14 supported languages** for realtime political event pulse (Tier-C aggregation — reads sibling analyses across the reporting window and applies period multipliers from `ext/tier-c-aggregation.md`) in one single agentic run. The agent translates `article.md` into `article.<lang>.md` for every non-English language before invoking the renderer with `--lang all`. The dedicated `news-translate` workflow only refines / back-fills existing translations on follow-up runs.

## What this workflow does

- **Article type**: `realtime-pulse`
- **Analysis subfolder**: `analysis/daily/$ARTICLE_DATE/realtime-pulse/`
- **Aggregated markdown**: `analysis/daily/$ARTICLE_DATE/realtime-pulse/article.md` (produced by `scripts/aggregate-analysis.ts`)
- **Rendered HTML**: `news/$ARTICLE_DATE-realtime-pulse-{en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh}.html` — **always all 14 languages** (produced by `scripts/render-articles.ts`)
- **Single-run model**: one run does download → analysis Pass 1 + 2 → gate → aggregate → translate → render (14 languages) → ONE PR. There is no separate "article run" and no inter-workflow dispatch. The `news-translate` workflow is a quality-improvement-only backstop.

## Time budget

> 🟡 **Plan to call `safeoutputs___create_pull_request` by agent minute 42 (hard deadline 45)** to reserve job-level headroom for setup variance and the safe-outputs runner. See `00-base-contract.md §Session timing` and `07-commit-and-pr.md §Deadline enforcement`.
>
> **AI-FIRST within the 60-minute budget**: Pass 2 is still mandatory. Scheduled runs should honor the configured `analysis_depth=deep` default instead of pre-emptively downgrading scope. Prefer **scope compression over iteration skipping** only if runtime risk emerges — reduce the download/manifest scope if needed, but maintain 1:1 per-document coverage and always perform a full read-back-and-improve Pass 2 on whatever artifacts exist. Reserve `comprehensive` for manual `workflow_dispatch` backfills.

**Single run** (produces all 23 analysis artifacts + aggregated `article.md` + per-language `article.<lang>.md` × 13 + 14 HTML files, target ~42 agent minutes in a 60-min job):

| Minutes | Phase | Module |
|---------|-------|--------|
| 0–3 | MCP pre-warm + pre-flight check | 02 / 03 |
| 3–6 | Download data + catalogue | 03 |
| 6–18 | Analysis Pass 1 (methodology read + per-doc analyses + **all 23 artifacts**: Family A 9 + B 2 + C 5 + D 7) | 04 |
| 18–28 | Analysis Pass 2 (read-back + improvements on all 22 text files) | 04 |
| 28–30 | Analysis Gate (checks 1–8) | 05 |
| 30–32 | `scripts/aggregate-analysis.ts` → `article.md` | 06 |
| 32–40 | Translate `article.md` → `article.<lang>.md` for all 13 non-English languages (sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh) | 06 |
| 40–42 | `scripts/render-articles.ts --lang all` → **all 14** HTML files | 06 |
| 42–43 | Stage analysis + `article*.md` + `news/*.html`, commit, **ONE** `safeoutputs___create_pull_request` — **HARD DEADLINE agent minute 45** | 07 |

Use the full budget for AI-FIRST iteration; do **not** finish early with shallow output (see `.github/copilot-instructions.md §AI FIRST Quality Principle`). Never open a second PR within a run — there is no second PR. **If you reach agent minute 42 without staging, stop all remaining work, run the aggregator + translator + renderer on whatever artifacts exist, commit, and call `safeoutputs___create_pull_request` immediately** — a partial-but-delivered PR is infinitely better than losing the run to Timer A. Translation under-coverage is acceptable as a partial state: the renderer falls back to English for any missing `article.<lang>.md`, and the `news-translate` workflow back-fills it on the next scheduled pass.

## Inputs

- `article_date` — override date (defaults to today)
- `force_generation` — regenerate even if today's content exists; also forces analysis re-run
- `analysis_depth` — `standard` | `deep` (default) | `comprehensive`

> **Note**: there is no `languages` input. Every run produces all 14 language HTML files. Translation depth-of-quality scales with the time budget (see the table above).

## Run-mode selection

At the start of every run, the pre-flight check in `03-data-download.md` detects whether `analysis/daily/$ARTICLE_DATE/realtime-pulse/` already contains all **23 required artifacts**:

- **No analysis found** → run the full pipeline (download → Pass 1 → Pass 2 → gate → aggregate → render → PR).
- **Analysis found** → skip download / Pass 1 / Pass 2 / gate, re-load the analysis into context, run aggregate + render, and open the PR.

Repeated runs for the same `$ARTICLE_DATE` always use the same analysis folder when `force_generation=false`.

All other rules (bash format, AWF shell safety, MCP access, download pipeline, analysis methodology & gate, aggregate + render, commit & PR policy) live in the imported modules.
