---
name: "News: Opposition Motions"
description: Generates opposition motions analysis articles and renders HTML in all 14 supported languages in a single agentic run via executive-brief cascade. Single article type per run; news-translate runs on a separate track to translate executive-brief.md into 13 languages.
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
on:
  schedule: daily around 6:00 on weekdays
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
        description: 'Analysis depth for AI iterations (standard=1-2 iterations, deep=2-3 iterations, comprehensive=3+ iterations). Controls SWOT complexity, stakeholder count, and dashboard charts.'
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
  group: gh-aw-news-motions-${{ inputs.article_date || 'today' }}
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
    key: news-motions-${{ inputs.article_date || 'today' }}
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
    with:
      imf-sdmx-subscription-key: ${{ secrets.IMF_SDMX_SUBSCRIPTION_KEY }}
  - name: Resolve workflow inputs
    uses: ./.github/actions/news-resolve-inputs
    with:
      subfolder: motions
      article-date: ${{ inputs.article_date }}
      force-generation: ${{ inputs.force_generation }}
      analysis-depth: ${{ inputs.analysis_depth }}
      default-analysis-depth: deep
model: claude-opus-4.8
engine:
  id: copilot
---

# 📝 Opposition Motions

Generates deep political intelligence analysis **and** renders the HTML article in **all 14 supported languages** for opposition motions in one single agentic run. The dedicated `news-translate` workflow runs on a separate track and translates `executive-brief.md` markdown into 13 language siblings (`executive-brief_<lang>.md`) 

## What this workflow does

- **Article type**: `motions`
- **Analysis subfolder**: `analysis/daily/$ARTICLE_DATE/motions/`
- **Aggregated markdown**: `analysis/daily/$ARTICLE_DATE/motions/article.md` (produced by `scripts/aggregate-analysis.ts`)
- **Rendered HTML**: `news/$ARTICLE_DATE-motions-{en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh}.html` — **always all 14 languages** (produced by `scripts/render-articles.ts`)
- **Single-run model**: one run does download → analysis Pass 1 + 2 → gate → aggregate → render (14 languages) → ONE PR. There is no separate "article run" and no inter-workflow dispatch. The `news-translate` workflow runs on a separate track and handles only executive-brief markdown translations (`executive-brief_<lang>.md`); it does not back-fill `article.<lang>.md`.

## Time budget

> 🟡 **Plan to call `safeoutputs___create_pull_request` by agent minute 42 (hard deadline 45)** to reserve job-level headroom for setup variance and the safe-outputs runner. See `00-base-contract.md §Session timing` and `07-commit-and-pr.md §Deadline enforcement`.
>
> **AI-FIRST within the 60-minute budget**: Pass 2 is still mandatory. Scheduled runs should honor the configured `analysis_depth=deep` default instead of pre-emptively downgrading scope. Prefer **scope compression over iteration skipping** only if runtime risk emerges — reduce the download/manifest scope if needed, but maintain 1:1 per-document coverage and always perform a full read-back-and-improve Pass 2 on whatever artifacts exist. Reserve `comprehensive` for manual `workflow_dispatch` backfills.

**Single run** (produces all 23 analysis artifacts + aggregated article.md + 14 HTML files, target ~42 agent minutes in a 60-min job):

| Minutes | Phase | Module |
|---------|-------|--------|
| 0–3 | MCP pre-warm + pre-flight check | 02 / 03 |
| 3–6 | Download data + catalogue | 03 |
| 6–18 | Analysis Pass 1 (methodology read + per-doc analyses + **all 23 artifacts**: Family A 9 + B 2 + C 5 + D 7) | 04 |
| 18–36 | Analysis Pass 2 (read-back + improvements on all 22 text files; **extended slot reclaims the 8 min freed by removing per-language Markdown translation** — see `TRANSLATION_GUIDE.md §News articles are translated out-of-band`) | 04 |
| 36–38 | Analysis Gate (checks 1–11 + post-aggregate Check 12 below) | 05 |
| 38–40 | `scripts/aggregate-analysis.ts` → `article.md`, then `scripts/validate-article.ts` (post-aggregate Check 12: banned phrases, citation density, `economicProvenance` ≤ 6 mo) | 06 |
| 40–42 | `scripts/render-articles.ts --lang all` → **all 14** HTML files | 06 |
| 42–43 | Stage analysis + `article.md` + `news/*.html`, commit, **ONE** `safeoutputs___create_pull_request` — **HARD DEADLINE agent minute 45** | 07 |

Use the full budget for AI-FIRST iteration (see `.github/copilot-instructions.md §AI FIRST Quality Principle`). One PR per run. If agent minute 42 arrives without staging, stop remaining work, run the aggregator + renderer on whatever artifacts exist, commit, and call `safeoutputs___create_pull_request` — a partial PR beats losing the run to Timer A. Translation under-coverage is acceptable: the renderer composes English article.md body with the localized executive-brief overlay.

## Inputs

- `article_date` — override date (defaults to today)
- `force_generation` — regenerate even if today's content exists; also forces analysis re-run
- `analysis_depth` — `standard` | `deep` (default) | `comprehensive`

> **Note**: there is no `languages` input. Every run produces all 14 language HTML files. Translation depth-of-quality scales with the time budget (see the table above).

## Run-mode selection

At the start of every run, the pre-flight check in `03-data-download.md` detects whether `analysis/daily/$ARTICLE_DATE/motions/` already contains all **23 required artifacts**:

- **No analysis found** → run the full pipeline (download → Pass 1 → Pass 2 → gate → aggregate → render → PR).
- **Analysis found** → enter improvement-mode (see `04-analysis-pipeline.md §Improvement-mode path`); extend existing artifacts, run Pass 2 + gate, then aggregate + render + PR.

Repeated runs for the same `$ARTICLE_DATE` always use the same analysis folder when `force_generation=false`.

## File-write contract

> 🛠 **Write every analysis artifact (`analysis/daily/$DATE/$SUB/*.md`, `documents/*.md`, JSON sidecars, `methodology-reflection.md` re-run deltas) with the `edit` tool.** `cat <<'QUOTED_EOF' > file` is a Tier-2 fallback only — ASCII-only, no code fences / Mermaid / `$` / backticks / `EOF` markers, < 200 lines, and only after `edit` has failed for a non-content reason. Banned for `analysis/daily/**` writes: `python3`, `node -e`, `sed -i`, `echo … > file`, `tee file`, unquoted heredocs (`<<EOF`) — sole exception: the pre-flight scaffold in [`03-data-download.md`](../prompts/03-data-download.md) (env-var refs and short literals only, no agent-generated content). The aggregator (`scripts/aggregate-analysis.ts`) and renderer (`scripts/render-articles.ts`) are the only writers for `article.md` and `news/*.html`. See [`01-bash-and-shell-safety.md` §File creation & overwrite strategy](../prompts/01-bash-and-shell-safety.md).

All other rules (bash format, AWF shell safety, MCP access, download pipeline, analysis methodology & gate, aggregate + render, commit & PR policy) live in the imported modules.