---
name: "News: Election Cycle"
description: Generates election-cycle deep intelligence articles and renders HTML in all 14 supported languages in a single agentic run via executive-brief cascade. The longest forward-look horizon — covers the full 4-year mandate (current Tidö 2022-09-11 → 2026-09-13 and next 2026-09-13 → 2030-09-08). Tier-C aggregation × 2.5 depth multiplier. Mandates wildcards-blackswans + quantitative-swot + political-stride-assessment + cycle-trajectory (24th artifact) blocking. Initially workflow_dispatch only until runtime is measured over 4-6 manual runs; cron `0 9 13 3,9 *` is declared but commented out below.
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
      cycle_anchor:
        description: 'Which cycle to analyse (current=Tidö 2022-26 mandate scorecard; next=post-2026 coalition forecast; both=both — produces TWO sub-subfolders under election-cycle/).'
        required: false
        default: both
      analysis_depth:
        description: 'Analysis depth — election-cycle defaults to comprehensive given the 2.5× multiplier and 24th artifact requirement.'
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

timeout-minutes: 60

concurrency:
  group: gh-aw-news-election-cycle-${{ inputs.article_date || 'today' }}-${{ inputs.cycle_anchor || 'both' }}
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
    key: news-election-cycle-${{ inputs.article_date || 'today' }}-${{ inputs.cycle_anchor || 'both' }}
    retention-days: 30

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
  max-patch-files: 200
  create-pull-request:
    labels: [agentic-news, analysis-data, long-horizon, forward-look, election-cycle]
    draft: false
    expires: 30d
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
      subfolder: election-cycle
      article-date: ${{ inputs.article_date }}
      force-generation: ${{ inputs.force_generation }}
      analysis-depth: ${{ inputs.analysis_depth }}
      default-analysis-depth: comprehensive
      cycle-anchor: ${{ inputs.cycle_anchor }}
engine:
  id: copilot
  model: claude-opus-4.8
---

# 🗳️ Election Cycle

Generates the **deepest** Riksdagsmonitor intelligence product — a full 4-year-mandate political assessment covering the **current** Tidö cycle (2022-09-11 → 2026-09-13) and/or the **next** cycle (2026-09-13 → 2030-09-08). Tier-C aggregation × **2.5 depth multiplier**.

Non-English HTML pages are produced via the **localized executive-brief cascade** — the renderer composes the English `article.md` body with `executive-brief_<lang>.md` (when present) into each target language. The dedicated `news-translate` workflow runs on a separate track and translates `executive-brief.md` markdown into 13 language siblings (`executive-brief_<lang>.md`). Per-type workflows do **not** write `article.<lang>.md`.

## What this workflow does

- **Article type**: `election-cycle` (registry id; see `analysis/article-types.json`)
- **Analysis subfolder**: `analysis/daily/$ARTICLE_DATE/election-cycle/{current,next}/` — one sub-subfolder per cycle anchor when `cycle_anchor=both`.
- **Aggregated markdown**: one per anchor (`article.md` lives in each sub-subfolder).
- **Rendered HTML**: `news/$ARTICLE_DATE-election-cycle-{current,next}-{en,sv,da,no,fi,de,fr,es,nl,ar,he,ja,ko,zh}.html` — **always all 14 languages**.
- **Horizon**: 1 460 days (4 years); lookback 365 days.
- **Single-run model**: same as week/month/quarter/year-ahead; one PR with all rendered HTML for both anchors when `cycle_anchor=both`. The renderer uses the localized executive-brief cascade (`mergeLocalizedWithEnglish`) to produce non-English HTML.

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
>
> 🔴 **Token budget awareness**: This workflow uses `claude-opus-4.8` which consumes tokens rapidly on complex analysis. The 25M token budget can be exhausted in ~20 minutes of intensive MCP querying + large file writes. **Check `agent_minute` before EVERY phase transition. If agent_minute ≥ 20 and zero analysis artifacts exist on disk, immediately compress scope to a minimal viable set and target PR by minute 35.**

This workflow runs at the **upper limit** of the 60-minute job envelope. Initially gated `workflow_dispatch`-only until runtime is measured over 4–6 manual runs.

| Minutes | Phase |
|---------|-------|
| 0–3 | MCP pre-warm + IMF multi-vintage pin |
| 3–7 | Download data (Riksdag full-mandate corpus, SCB multi-year, IMF Nordic compare + multi-vintage) |
| 7–29 | Analysis Pass 1 (24 artifacts at 2.5× depth, 12-leaf scenario tree, full mandate scorecard or coalition forecast) |
| 29–38 | Analysis Pass 2 (read-back; counterfactuals × 3; horizon-band stratification across all five bands; **extended Pass-2 slot reclaims the time freed by removing per-language Markdown translation** — see `TRANSLATION_GUIDE.md §News articles are translated out-of-band`) |
| 38–39 | Analysis Gate (long-horizon checks + 24th-artifact check + cycle-rollover check if within ± 30 days) |
| 39–40 | Aggregate (per-anchor `article.md`) + post-aggregate `validate-article.ts` (Check 12) |
| 40–42 | Render (`scripts/render-articles.ts --lang all` → all 14 HTML per anchor) |
| 42–43 | Stage + commit + ONE `safeoutputs___create_pull_request` — **HARD DEADLINE agent minute 45** |

> 🟡 **Scope-compression rule**: depth multiplier 2.5× is aspirational — under the 60-min envelope, prefer reducing per-document Family-E coverage (drop dok_ids ranked < 6 in significance-scoring) rather than skipping any of the 24 artifacts. The 24-artifact contract is hard. When `cycle_anchor=both`, anchor coverage is also hard unless `ext/cycle-rollover.md` declares a formal rollover-window exception; time budget is never a valid reason to silently skip `next/`.

## Inputs

- `article_date` — override date (defaults to today)
- `force_generation` — regenerate even if recent cycle analysis exists
- `cycle_anchor` — `current` | `next` | `both` (default `both`)
- `analysis_depth` — defaults to `comprehensive`

> **Note**: there is no `languages` input. Every run produces all 14 language HTML files. Translation depth-of-quality scales with the time budget (see the table above).

## File-write contract

> 🛠 **Write every analysis artifact (`analysis/daily/$DATE/$SUB/*.md`, `documents/*.md`, JSON sidecars, `methodology-reflection.md` re-run deltas) with the `edit` tool.** `cat <<'QUOTED_EOF' > file` is a Tier-2 fallback only — ASCII-only, no code fences / Mermaid / `$` / backticks / `EOF` markers, < 200 lines, and only after `edit` has failed for a non-content reason. Banned for `analysis/daily/**` writes: `python3`, `node -e`, `sed -i`, `echo … > file`, `tee file`, unquoted heredocs (`<<EOF`) — sole exception: the pre-flight scaffold in [`03-data-download.md`](../prompts/03-data-download.md) (env-var refs and short literals only, no agent-generated content). The aggregator (`scripts/aggregate-analysis.ts`) and renderer (`scripts/render-articles.ts`) are the only writers for `article.md` and `news/*.html`. See [`01-bash-and-shell-safety.md` §File creation & overwrite strategy](../prompts/01-bash-and-shell-safety.md).

All other rules live in the imported modules.
