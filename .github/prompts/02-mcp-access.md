# 02 — MCP Access

Authoritative per-workflow surface: the `mcp-servers:` + `tools:` blocks in that workflow's frontmatter. `.github/copilot-mcp.json` is the **local Copilot** surface (used by `assign_copilot_to_issue` / agent files in `.github/agents/`), not by news workflow runs.

## Servers & tool naming

News workflows declare three data MCP servers + the built-in `github` toolset (via `tools.github.toolsets: [all]`) + `bash` + `edit` + `web-fetch` (frontmatter key; agent calls it as `web_fetch`) + `agentic-workflows` + `cache-memory` (resilience).

> **Naming convention reminder**: gh-aw frontmatter keys use **kebab-case** (`tools.web-fetch:`, `tools.cache-memory:`, `tools.agentic-workflows:`); the **runtime tool names** the agent invokes use **snake_case** (`web_fetch`, `cache_memory`, …). The same split applies to safe outputs (`safe-outputs.create-pull-request:` in YAML → `safeoutputs___create_pull_request` at call time).

| Server / tool | Transport | Declared in | Tool-name style | Example tools |
|---------------|-----------|-------------|-----------------|---------------|
| `riksdag-regering` | HTTP (Render) | workflow `mcp-servers:` | `snake_case` | `get_sync_status`, `search_dokument`, `get_voteringar`, `get_dokument_innehall` |
| `scb` | container (`@jarib/pxweb-mcp`, `node:26-alpine`) | workflow `mcp-servers:` | `snake_case` | `search_tables`, `get_table_info`, `query_table` |
| `world-bank` | container (`worldbank-mcp`, `node:26-alpine`) | workflow `mcp-servers:` | `kebab-case` | `get-economic-data` *(despite the legacy name, this method serves the non-economic indicator IDs documented in `analysis/worldbank/indicators-inventory.json`: governance WGI, environment, social/education residue, defence historicals, crime/justice; route economic context through `scripts/imf-fetch.ts`)*, `get-country-info`, `search-indicators` |
| `github` | HTTP (Copilot MCP) | workflow `tools.github` (`toolsets: [all]`) | standard | full GitHub MCP toolset (issues, PRs, repos, code-search, actions, releases, discussions, …) |
| `bash` | local helper | workflow `tools.bash: true` | standard | shell execution (**also hosts the IMF CLI — see § IMF CLI below**) |
| `edit` | local helper | workflow `tools.edit:` | standard | filesystem edits inside `$GITHUB_WORKSPACE` |
| `web-fetch` | local helper | workflow `tools.web-fetch:` | standard | HTTP fetch for non-MCP public sources (e.g. `www.statskontoret.se`, `riksdagsmonitor.com`) — domain-filtered through the AWF firewall. **Agent calls this as `web_fetch`** (snake_case runtime name) |
| `cache-memory` | GitHub Actions cache | workflow `tools.cache-memory:` | (filesystem) | persistent file storage at `/tmp/gh-aw/cache-memory/` keyed by `news-${workflow}-${article_date}` (14-day retention). Survives across runs and can restore the most recent prior cache via `restore-keys` when the exact key is not found → **resilience for failed-PR retries**. See [`07-commit-and-pr.md` §Cache-memory recovery](07-commit-and-pr.md). |
| `safeoutputs` | runner (Streamable HTTP) | always available | `snake_case` | `safeoutputs___create_pull_request`, `safeoutputs___noop`, `safeoutputs___dispatch_workflow`, `safeoutputs___add_comment`, `safeoutputs___missing_data`, `safeoutputs___missing_tool`, `safeoutputs___report_incomplete` |

`filesystem`, `memory`, and `sequential-thinking` are declared in [`.github/copilot-mcp.json`](../copilot-mcp.json) for the **local Copilot / `assign_copilot_to_issue`** channel and are **not** available to news workflows unless the workflow itself declares them under `mcp-servers:`.

`playwright` must be treated separately: in news workflows it is available as the built-in workflow tool `tools.playwright` when that workflow declares it under `tools:` (e.g. `news-evening-analysis`, `news-realtime-monitor`). In that case it is **not** an MCP server, so do **not** infer its availability from `mcp-servers:` alone and do **not** skip Playwright/browser validation steps when `tools.playwright` is present in workflow frontmatter.

Authoritative inventory: [`.github/copilot-mcp.json`](../copilot-mcp.json) for the local Copilot MCP surface, and each workflow's `mcp-servers:` plus `tools:` frontmatter for the actual per-run surface.

## IMF CLI (primary for all economic data — NOT an MCP server)

IMF data is **the primary source** for all macro / fiscal / monetary / external-sector / trade / COFOG / commodity / exchange-rate context. IMF is **not** an MCP server — access is via the TypeScript CLI invoked through the `bash` tool:

```bash
npx tsx scripts/imf-fetch.ts <command> [flags]
```

| Command | Purpose | Example |
|---------|---------|---------|
| `weo` | Single-country WEO time series (annual, incl. T+5 projections) | `tsx scripts/imf-fetch.ts weo --country SWE --indicator NGDP_RPCH --years 15 --persist` |
| `compare` | Batched WEO compare across the Nordic peer set (1 call, N countries) | `tsx scripts/imf-fetch.ts compare --indicator GGXWDG_NGDP --countries SWE,DNK,NOR,FIN,DEU --persist` |
| `sdmx` | SDMX 3.0 passthrough (CPI / FM / BOP / GFS_COFOG / MFS_IR / IMTS / PCPS / ER — IFS dissolved into CPI/MFS_IR/ER, DOTS renamed to IMTS, PCPS moved to IMF.RES in the 2026-05 refactor) | `tsx scripts/imf-fetch.ts sdmx --path "/data/IMF.STA,CPI,5.0.0/SWE.CPI._T.IX.M?startPeriod=2024-01" --indicator _T.IX --country SWE --persist` |
| `list-indicators` | Discovery — list built-in indicator codes | `tsx scripts/imf-fetch.ts list-indicators` |

Rules:
- **Rate-limit discipline**: IMF advertises ~10 req / 5 s. Prefer `compare` over parallel `weo`. `sleep 1` between invocations. Target ≤ 10 IMF calls per article.
- **Caching**: always pass `--persist` — writes to `analysis/data/imf/{indicator}/{country}.json`. Re-use across article types in the same daily run.
- **Vintage discipline**: every projection quote MUST include the vintage tag — `(WEO Apr-2026, GGXWDG_NGDP)`.
- **Provider decision**: macro / fiscal / monetary / external → IMF; governance (WGI) / environment / social residue → World Bank; Swedish-specific ground truth → SCB.
- **Authoritative inventory**: [`analysis/imf/indicators-inventory.json`](../../analysis/imf/indicators-inventory.json) (machine-readable) · [`analysis/imf/data-dictionary.md`](../../analysis/imf/data-dictionary.md) (dataflow reference) · [`analysis/imf/agentic-integration.md`](../../analysis/imf/agentic-integration.md) (7-step playbook) · [`analysis/imf/indicator-policy-mapping.md`](../../analysis/imf/indicator-policy-mapping.md) (committee matrix).
- **Contract**: [`.github/aw/ECONOMIC_DATA_CONTRACT.md`](../aw/ECONOMIC_DATA_CONTRACT.md) v3.2+.
- **Firewall egress**: `www.imf.org`, `api.imf.org`, `data.imf.org`, `dataservices.imf.org` (already in every workflow's `network.allowed` and `safe-outputs.allowed-domains`). The TypeScript IMF client sends an explicit Riksdagsmonitor `User-Agent`; do not replace it with raw `node` / undici fetch calls because IMF Datamapper can reject those with HTTP 403. Every SDMX request to `api.imf.org/external/sdmx/3.0` requires the `IMF_SDMX_SUBSCRIPTION_KEY` (Azure APIM `Ocp-Apim-Subscription-Key` header) — already exported to the agent shell by `news-prewarm`.
- **Statskontoret egress**: `www.statskontoret.se` / `statskontoret.se` are public non-MCP web sources used for agency capacity, state-governance evaluations, implementation feasibility, administrative burden and public-sector efficiency evidence.
- **Lagrådet egress**: `www.lagradet.se` / `lagradet.se` are public non-MCP web sources for Council on Legislation referrals and yttranden on government propositions touching constitutional law, fundamental rights, criminal procedure, court organisation, surveillance, and taxation principles. Allow-listed in every news workflow's `network.allowed`. Required input for major-bill `risk-assessment.md`, `threat-analysis.md` and `forward-indicators.md` per `03-data-download.md §Lagrådet enrichment`.

## Health gate (in-prompt)

> ⏱  **Time-budget anchor.** This is typically the **first** agent bash call of the run, so it is also where the time-budget anchor in `01-bash-and-shell-safety.md §Time-budget self-monitoring` is established. Always emit the `agent_minute=N  remaining_to_pr_deadline=M` line at the **end** of the health gate so subsequent phases (download, Pass 1, gate, render) can compare against the phase budget in `00-base-contract.md §Session timing → Phase budget`. Target `agent_minute ≤ 5` at end-of-health-gate.

Run once at workflow start, then proceed — do not loop forever.

1. Call `get_sync_status({})`. Retry up to **3 times**, 20 s apart. Server is pre-warmed by the CI `steps:` block.
2. If the third attempt fails, set `ANALYSIS_DIR=analysis/daily/$ARTICLE_DATE/$SUBFOLDER` and branch on whether prior analysis exists, using a single concrete on-disk test:
   - **Prior analysis on disk** (`[ -s "$ANALYSIS_DIR/synthesis-summary.md" ]` returns true): do **not** exit. Route to improvement-mode in `04-analysis-pipeline.md` and continue without live MCP — extend artifacts using on-disk evidence, refresh `article.md` + rendered HTML, and commit one PR.
   - **No prior analysis on disk** (`[ ! -s "$ANALYSIS_DIR/synthesis-summary.md" ]`): apply the MCP-unreachable no-op policy from `07-commit-and-pr.md §No-op policy` and exit.
3. Once `get_sync_status` succeeds, proceed. Do not spend more than **2 minutes** on warm-up.
4. Read `data/imf-context.json` from the pre-warm action before making economic claims:
   - `status: ok` / `stale-vintage` / `degraded`: continue IMF-first. For `degraded`, use WEO/FM Datamapper evidence and avoid SDMX-only claims unless cached data exists.
   - `status: unavailable` or `data/imf-unavailable.flag` present: inject the standard warning block and use cached IMF / SCB fallback only; never substitute World Bank for macroeconomic claims.
5. Pre-warm IMF with one throwaway `weo` call through the CLI (not raw `fetch`): `npx tsx scripts/imf-fetch.ts weo --country SWE --indicator NGDP_RPCH --years 1 >/dev/null 2>&1 || true ; sleep 1`.

## Data sourcing rules

| Rule |
|------|
| Riksdag tool arguments are documented under [`.github/skills/riksdag-regering-mcp/`](../skills/riksdag-regering-mcp/). |
| **Economic data is IMF-first**. Only use `get-economic-data` (world-bank MCP) for articles written pre-2026-04-20 or as an explicit legacy fallback — **never** as a primary source in new articles. |
| **Statskontoret is a public non-MCP source** for Swedish agency governance, administrative capacity, implementation feasibility and public-sector efficiency. Use `web_fetch` / primary URLs where available, cite report title + URL, and record retrieval in `data-download-manifest.md`. |
| **Lagrådet is a public non-MCP source** for Council on Legislation referrals and yttranden. Required for major-bill propositions per `03-data-download.md §Lagrådet enrichment`. Cite referral URL + yttrande publication date; tag `referral pending` when no yttrande yet exists. |
| **Prior-voteringar enrichment** is a standard call: `search_voteringar` (riksdag-regering MCP) keyed by committee `bet` prefix and the last 4 `rm` (riksmöten) for every committee-report, motion, or interpellation cycle. Feeds `historical-parallels.md`, `coalition-mathematics.md`, and `swot-analysis.md` evidence rows (see `03-data-download.md §Prior-voteringar enrichment`). |
| Treat MCP failure mid-run as partial data: continue with what you have, document gaps in `data-download-manifest.md`, never silently drop documents. |
| Source authority and no-fabrication rule: see `00-base-contract.md` rules 1 + 3. |

## Pre-warm step (CI job, not prompt)

Every news workflow declares a **single** `curl`-based pre-warm step with ≤ 6 retries, ≤ 20 s apart. With `curl --max-time 30`, the worst-case runtime can exceed 4 minutes, so this is a best-effort pre-warm rather than a hard ≤ 2 minute guarantee. If a strict 2 minute cap is required, the workflow's `curl` timeout and/or retry policy must be reduced accordingly. No background pingers.

## MCP gateway session timeout (`engine.mcp.session-timeout`) — **DO NOT SET** without re-testing on v0.3.9

> 🚫 **Currently removed from every workflow.** MCP Gateway v0.3.1 (`ghcr.io/github/gh-aw-mcpg:v0.3.1`) rejected the gh-aw v0.71.3 compiled `sessionTimeout` field as `additionalProperties 'sessionTimeout' not allowed` ([gh-aw #29353](https://github.com/github/gh-aw/issues/29353)). The gh-aw v0.74.3 lock files now ship MCP Gateway **v0.3.9** — the field's acceptance has not yet been re-validated on this repo. **Do not re-add `engine.mcp.session-timeout` without first running one news workflow end-to-end against v0.3.9 to confirm the gateway accepts it.**

The `sandbox.mcp.keepalive-interval` setting also remains **removed** — the MCP gateway default keepalive (now on v0.3.9) is sufficient for the 60-min job window. The PR deadline is governed by Timer A (job `timeout-minutes: 60`, measured from job start) and Timer B (Copilot API session ~60 min). Call the PR safe-output by agent minute 42.
