---
name: "News: Year Ahead"
description: Generates year-ahead annual political-economic outlook articles and renders HTML in all 14 supported languages in a single agentic run via executive-brief cascade. Long-horizon-forecast workflow with 365-day window — anchored in IMF WEO Apr/Oct vintages, covers the Swedish budget rhythm (BP autumn + VP spring), Riksmöte calendar, EU presidency rotations, and full Nordic-peer comparison. Tier-C aggregation × 2.0 depth multiplier. PESTLE + wildcards-blackswans + quantitative-swot mandatory. Runs 5th of January and 5th of July to track WEO vintage rotation.
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
      analysis_depth:
        description: 'Analysis depth for AI iterations (standard=1-2 iterations, deep=2-3 iterations, comprehensive=3+ iterations). Year-ahead defaults to comprehensive due to depth multiplier 2.0×.'
        required: false
        default: comprehensive

# Shallow checkout (fetch-depth: 1) for fast safe_outputs Checkout. The prerequisite step
# fetches GITHUB_SHA on demand for bundle-apply, making full-history clones unnecessary.
# gh-aw v0.76.0+ honours `checkout.fetch-depth` (see compiler_safe_outputs_steps.go).
checkout:
  fetch-depth: 1

permissions:
  contents: read
  issues: read
  pull-requests: read
  actions: read
  discussions: read
  security-events: read
  copilot-requests: write

timeout-minutes: 60

# Cost-focus guardrails. `max-turns` caps agent tool-calling turns (runaway-loop circuit
# breaker) and is tunable repo-wide via the NEWS_MAX_TURNS variable. `max-ai-credits` is a
# per-run AI Credits ceiling — expressions are unsupported here, so a literal is required.
max-turns: ${{ vars.NEWS_MAX_TURNS || 300 }}
max-ai-credits: 3000

concurrency:
  group: gh-aw-news-year-ahead-${{ inputs.article_date || 'today' }}
  cancel-in-progress: false

features:
  mcp-gateway: true

runtimes:
  node:
    version: "26"

network:
  allowed:
    # ── Ecosystem identifiers (gh-aw built-ins) ──────────────────────────────
    - node
    # Browser downloads for Playwright CLI mode (kept for cross-workflow network parity)
    - playwright
    - github
    - defaults
    # ── Container registries (node:26-alpine pulls for SCB + WB MCP) ─────────
    # `containers` ecosystem covers ghcr.io + *.docker.io + Docker Hub auth/CDN endpoints.
    - containers
    # ── Riksdag / Regering MCP server + Swedish parliament + government ──────
    - riksdag-regering-ai.onrender.com
    - data.riksdagen.se
    - www.riksdagen.se
    - riksdagen.se
    - www.regeringen.se
    - regeringen.se
    - www.government.se
    - g0v.se
    # ── SCB (Statistics Sweden) ──────────────────────────────────────────────
    - api.scb.se
    - www.scb.se
    - scb-mcp.onrender.com
    # ── IMF (canonical economic-data source — see ECONOMIC_DATA_CONTRACT.md) ─
    - api.imf.org
    - data.imf.org
    - www.imf.org
    - dataservices.imf.org
    - datamarketplace.imf.org
    # ── World Bank (governance / environment / social residue) ───────────────
    - api.worldbank.org
    - data.worldbank.org
    - datahelpdesk.worldbank.org
    - governance.worldbank.org
    - www.worldbank.org
    # ── European Parliament + EU institutions ────────────────────────────────
    - www.europarl.europa.eu
    - europarl.europa.eu
    - ec.europa.eu
    - eur-lex.europa.eu
    - data.europa.eu
    - www.consilium.europa.eu
    - digital-strategy.ec.europa.eu
    - economy-finance.ec.europa.eu
    - www.enisa.europa.eu
    # ── Swedish independent agencies, courts, regulators ─────────────────────
    - www.statskontoret.se
    - statskontoret.se
    - www.lagradet.se
    - lagradet.se
    - www.riksbank.se
    - www.riksrevisionen.se
    - www.konj.se
    - www.finanspolitiskaradet.se
    - www.regelradet.se
    - www.esv.se
    - www.ei.se
    - www.energimyndigheten.se
    - www.naturvardsverket.se
    - www.boverket.se
    - www.do.se
    - www.domstol.se
    - www.imy.se
    - www.konkurrensverket.se
    - www.kriminalvarden.se
    - www.migrationsverket.se
    - www.msb.se
    - www.av.se
    - www.svt.se
    - www.val.se
    - bra.se
    # ── Hack23 owned platforms ───────────────────────────────────────────────
    - hack23.com
    - www.hack23.com
    - hack23.github.io
    - riksdagsmonitor.com
    - www.riksdagsmonitor.com
    - riksdagsmonitor.hack23.com
    - riksdagsmonitor.pages.dev
    - euparliamentmonitor.com
    - www.euparliamentmonitor.com
    - ciacompliancemanager.com
    - www.ciacompliancemanager.com
    - blacktrigram.com
    - www.blacktrigram.com
    # ── GitHub raw content is covered by the `github` ecosystem identifier above.
    # Pinned FQDN remains in `safe-outputs.allowed-domains` below (only FQDNs allowed there).

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
    key: news-year-ahead-${{ inputs.article_date || 'today' }}
    retention-days: 14

safe-outputs:
  threat-detection:
    continue-on-error: true
  allowed-domains:
    # Riksdag / Regering MCP server + Swedish parliament + government
    - riksdag-regering-ai.onrender.com
    - data.riksdagen.se
    - www.riksdagen.se
    - riksdagen.se
    - www.regeringen.se
    - regeringen.se
    - www.government.se
    - g0v.se
    # SCB (Statistics Sweden)
    - api.scb.se
    - www.scb.se
    - scb-mcp.onrender.com
    # IMF (canonical economic-data source)
    - api.imf.org
    - data.imf.org
    - www.imf.org
    - dataservices.imf.org
    - datamarketplace.imf.org
    # World Bank
    - api.worldbank.org
    - data.worldbank.org
    - datahelpdesk.worldbank.org
    - governance.worldbank.org
    - www.worldbank.org
    # European Parliament + EU institutions
    - www.europarl.europa.eu
    - europarl.europa.eu
    - ec.europa.eu
    - eur-lex.europa.eu
    - data.europa.eu
    - www.consilium.europa.eu
    - digital-strategy.ec.europa.eu
    - economy-finance.ec.europa.eu
    - www.enisa.europa.eu
    # Swedish independent agencies, courts, regulators
    - www.statskontoret.se
    - statskontoret.se
    - www.lagradet.se
    - lagradet.se
    - www.riksbank.se
    - www.riksrevisionen.se
    - www.konj.se
    - www.finanspolitiskaradet.se
    - www.regelradet.se
    - www.esv.se
    - www.ei.se
    - www.energimyndigheten.se
    - www.naturvardsverket.se
    - www.boverket.se
    - www.do.se
    - www.domstol.se
    - www.imy.se
    - www.konkurrensverket.se
    - www.kriminalvarden.se
    - www.migrationsverket.se
    - www.msb.se
    - www.av.se
    - www.svt.se
    - www.val.se
    - bra.se
    # Hack23 owned platforms
    - hack23.com
    - www.hack23.com
    - hack23.github.io
    - riksdagsmonitor.com
    - www.riksdagsmonitor.com
    - riksdagsmonitor.hack23.com
    - riksdagsmonitor.pages.dev
    - euparliamentmonitor.com
    - www.euparliamentmonitor.com
    - ciacompliancemanager.com
    - www.ciacompliancemanager.com
    - blacktrigram.com
    - www.blacktrigram.com
    # GitHub raw content
    - raw.githubusercontent.com
  max-patch-size: 10240
  max-patch-files: 100
  create-pull-request:
    labels: [agentic-news, analysis-data, long-horizon, forward-look, year-ahead]
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
    with:
      imf-sdmx-subscription-key: ${{ secrets.IMF_SDMX_SUBSCRIPTION_KEY }}
  - name: Resolve workflow inputs
    uses: ./.github/actions/news-resolve-inputs
    with:
      subfolder: year-ahead
      article-date: ${{ inputs.article_date }}
      force-generation: ${{ inputs.force_generation }}
      analysis-depth: ${{ inputs.analysis_depth }}
      default-analysis-depth: comprehensive
model: claude-opus-4.8
engine:
  id: copilot
---

# 🛰️ Year Ahead

Generates the deepest scheduled forward-look at Swedish politics — a 365-day annual outlook anchored in the freshest IMF WEO vintage available at run time (April or October), tracking the Swedish budget rhythm (BP autumn + VP spring), the Riksmöte calendar, and EU presidency rotations affecting Swedish politics. Tier-C aggregation × **2.0 depth multiplier**.

The dedicated `news-translate` workflow runs on a separate track and translates `executive-brief.md` markdown into 13 language siblings (`executive-brief_<lang>.md`) 

## What this workflow does

- **Article type**: `year-ahead` (registry id; see `analysis/article-types.json`)
- **Analysis subfolder**: `analysis/daily/$ARTICLE_DATE/year-ahead/`
- **Aggregated markdown**: `analysis/daily/$ARTICLE_DATE/year-ahead/article.md`
- **Rendered HTML**: `news/$ARTICLE_DATE-year-ahead-{en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh}.html` — **always all 14 languages**
- **Horizon**: 365 days; lookback 180 days.
- **Single-run model**: download → analysis Pass 1 + 2 → gate → aggregate → render (14 languages) → ONE PR.

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

> 🟡 **Plan to call `safeoutputs___create_pull_request` by agent minute 42 (hard deadline 45)** to reserve job-level headroom for setup variance and the safe-outputs runner. See `00-base-contract.md §Session timing` and `07-commit-and-pr.md §Deadline enforcement`.
>
> 🔴 **Token budget awareness**: This workflow uses `claude-opus-4.8` which consumes tokens rapidly on complex analysis. The 25M token budget can be exhausted in ~20 minutes of intensive MCP querying + large file writes. **Check `agent_minute` before EVERY phase transition. If agent_minute ≥ 20 and zero analysis artifacts exist on disk, immediately compress scope to a minimal viable set and target PR by minute 35.**

| Minutes | Phase |
|---------|-------|
| 0–3 | MCP pre-warm + IMF vintage pin |
| 3–7 | Download data (Riksdag + SCB + IMF Nordic-peer compare) |
| 7–27 | Analysis Pass 1 (all 23 artifacts + PESTLE + wildcards + quantitative-SWOT at 2.0× depth) |
| 27–35 | Analysis Pass 2 (read-back; counterfactuals; horizon-band stratification) |
| 35–37 | Analysis Gate (long-horizon checks) |
| 37–38 | Aggregate (`article.md`) |
| 38–40 | Render (`scripts/render-articles.ts --lang all` → all 14 HTML) |
| 40–42 | Stage + commit + ONE `safeoutputs___create_pull_request` — **HARD DEADLINE agent minute 45** |

> 🟡 **Scope-compression rule**: if you reach agent minute 35 without Pass 2 complete, halt Pass 2 deepening and run the gate against whatever you have — `if-no-changes: warn` will not silently fail the run, but a missing PR will. Always trim depth before iterating.

> ⚠️ **HARD FILE LIMIT (200 files)**: The safe-outputs handler hard-rejects PRs with > 200 files (E003). You **MUST** run the 200-file guard from `07-commit-and-pr.md` before calling `safeoutputs___create_pull_request`. Budget: 23 core artifacts + README (1) + article.md (1) + 14 HTML + pir-status.json (1) ≈ 40 files. **Never stage `documents/` or `pass1/` directories.** If staged count exceeds 180, unstage `documents/` then JSON files until under budget. This is non-negotiable — the previous run failed with 269 files.

## Inputs

- `article_date` — override date (defaults to today)
- `force_generation` — regenerate even if recent year-ahead exists (within 60 days)
- `analysis_depth` — defaults to `comprehensive`

> **Note**: there is no `languages` input. Every run produces all 14 language HTML files. Translation depth-of-quality scales with the time budget (see the table above).

## File-write contract

> 🛠 **Write every analysis artifact (`analysis/daily/$DATE/$SUB/*.md`, `documents/*.md`, JSON sidecars, `methodology-reflection.md` re-run deltas) with the `edit` tool.** `cat <<'QUOTED_EOF' > file` is a Tier-2 fallback only — ASCII-only, no code fences / Mermaid / `$` / backticks / `EOF` markers, < 200 lines, and only after `edit` has failed for a non-content reason. Banned for `analysis/daily/**` writes: `python3`, `node -e`, `sed -i`, `echo … > file`, `tee file`, unquoted heredocs (`<<EOF`) — sole exception: the pre-flight scaffold in [`03-data-download.md`](../prompts/03-data-download.md) (env-var refs and short literals only, no agent-generated content). The aggregator (`scripts/aggregate-analysis.ts`) and renderer (`scripts/render-articles.ts`) are the only writers for `article.md` and `news/*.html`. See [`01-bash-and-shell-safety.md` §File creation & overwrite strategy](../prompts/01-bash-and-shell-safety.md).

All other rules live in the imported modules.