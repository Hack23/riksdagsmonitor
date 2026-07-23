---
name: "News: Quarter Ahead"
description: Generates quarter-ahead strategic outlook articles and renders HTML in all 14 supported languages in a single agentic run via executive-brief cascade. Long-horizon-forecast workflow with 90-day window — covers next-quarter parliamentary calendar, committee schedules, government propositions tabling deadlines, Riksbank rate decisions, and SCB quarterly NA release. Tier-C aggregation × 1.7 depth multiplier. Runs 1st and 15th of each month.
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
  group: gh-aw-news-quarter-ahead-${{ inputs.article_date || 'today' }}
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
    key: news-quarter-ahead-${{ inputs.article_date || 'today' }}
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
    with:
      imf-sdmx-subscription-key: ${{ secrets.IMF_SDMX_SUBSCRIPTION_KEY }}
  - name: Resolve workflow inputs
    uses: ./.github/actions/news-resolve-inputs
    with:
      subfolder: quarter-ahead
      article-date: ${{ inputs.article_date }}
      force-generation: ${{ inputs.force_generation }}
      analysis-depth: ${{ inputs.analysis_depth }}
      default-analysis-depth: deep
model: claude-opus-4.8
engine:
  id: copilot
---

# 🧭 Quarter Ahead

Generates deep political intelligence analysis **and** renders the HTML article in **all 14 supported languages** for forward-looking quarterly political intelligence (Tier-C aggregation × 1.7 depth multiplier — see `ext/tier-c-aggregation.md` and `ext/long-horizon-forecasting.md`) in one single agentic run. The 90-day window covers the next-quarter parliamentary calendar (committee schedules, chamber votes, government propositions tabling deadlines, Lagrådet referrals, Riksbank rate decisions, SCB quarterly NA release).

The dedicated `news-translate` workflow runs on a separate track and translates `executive-brief.md` markdown into 13 language siblings (`executive-brief_<lang>.md`) 

## What this workflow does

- **Article type**: `quarter-ahead` (registry id; see `analysis/article-types.json`)
- **Analysis subfolder**: `analysis/daily/$ARTICLE_DATE/quarter-ahead/`
- **Aggregated markdown**: `analysis/daily/$ARTICLE_DATE/quarter-ahead/article.md`
- **Rendered HTML**: `news/$ARTICLE_DATE-quarter-ahead-{en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh}.html` — **always all 14 languages**
- **Horizon**: 90 days; lookback 90 days (sibling per-type folders + most-recent week-ahead + month-ahead).
- **Single-run model**: download → analysis Pass 1 + 2 → gate → aggregate → render (14 languages) → ONE PR.

## Long-horizon mandate (from `ext/long-horizon-forecasting.md`)

- **Scenario count**: ≥ 4 distinct scenarios in `scenario-analysis.md`, probabilities sum to 100 %.
- **Counterfactuals**: ≥ 2 explicit counterfactual paragraphs in `devils-advocate.md`.
- **Cross-horizon citations**: cite the most recent `week-ahead` AND `month-ahead` analyses in `cross-reference-map.md`. Missing citations fail the gate.
- **IMF policy**: pinned WEO + FM vintage at run start; emit `economic-data.json` v2.0 with quarterly trajectory series for SWE + Nordic peers (DNK, NOR, FIN).
- **Forward indicators**: ≥ 12 dated indicators across the bands `week / month / quarter / year / election`.
- **Word floor**: ≥ 2 000 words (versus 1 500 for week-ahead / month-ahead).

## Time budget

> 🟡 **Plan to call `safeoutputs___create_pull_request` by agent minute 42 (hard deadline 45)** to reserve job-level headroom for setup variance and the safe-outputs runner. See `00-base-contract.md §Session timing` and `07-commit-and-pr.md §Deadline enforcement`.
>
> 🔴 **Token budget awareness**: This workflow uses `claude-opus-4.8` which consumes tokens rapidly on complex analysis. The 25M token budget can be exhausted in ~20 minutes of intensive MCP querying + large file writes. **Check `agent_minute` before EVERY phase transition. If agent_minute ≥ 20 and zero analysis artifacts exist on disk, immediately compress scope to a minimal viable set and target PR by minute 35.**

| Minutes | Phase | Module |
|---------|-------|--------|
| 0–3 | MCP pre-warm + pre-flight | 02 / 03 |
| 3–7 | Download data + catalogue + IMF pinned vintage | 03 |
| 7–25 | Analysis Pass 1 (all 23 artifacts at 1.7× depth, scenario tree depth 4, ≥ 12 forward indicators) | 04 + ext/long-horizon-forecasting |
| 25–36 | Analysis Pass 2 (read-back + improvements; ≥ 2 counterfactuals; **extended slot reclaims the time freed by removing per-language Markdown translation** — see `TRANSLATION_GUIDE.md §News articles are translated out-of-band`) | 04 |
| 36–37 | Analysis Gate (checks 1–11 + Tier-C additive + long-horizon checks) | 05 |
| 37–39 | Aggregate (`article.md`) + post-aggregate `validate-article.ts` (Check 12) | 06 |
| 39–42 | Render (`scripts/render-articles.ts --lang all` → all 14 HTML) | 06 |
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

## File-write contract

> 🛠 **Write every analysis artifact (`analysis/daily/$DATE/$SUB/*.md`, `documents/*.md`, JSON sidecars, `methodology-reflection.md` re-run deltas) with the `edit` tool.** `cat <<'QUOTED_EOF' > file` is a Tier-2 fallback only — ASCII-only, no code fences / Mermaid / `$` / backticks / `EOF` markers, < 200 lines, and only after `edit` has failed for a non-content reason. Banned for `analysis/daily/**` writes: `python3`, `node -e`, `sed -i`, `echo … > file`, `tee file`, unquoted heredocs (`<<EOF`) — sole exception: the pre-flight scaffold in [`03-data-download.md`](../prompts/03-data-download.md) (env-var refs and short literals only, no agent-generated content). The aggregator (`scripts/aggregate-analysis.ts`) and renderer (`scripts/render-articles.ts`) are the only writers for `article.md` and `news/*.html`. See [`01-bash-and-shell-safety.md` §File creation & overwrite strategy](../prompts/01-bash-and-shell-safety.md).

All other rules live in the imported modules.