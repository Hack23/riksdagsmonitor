# 02 — MCP Access

Authoritative per-workflow surface: the `mcp-servers:` + `tools:` blocks in that workflow's frontmatter. `.github/copilot-mcp.json` is the **local Copilot** surface (`assign_copilot_to_issue` / agent files in `.github/agents/`) and is **not** available to news workflow runs.

## Servers & tool naming

News workflows declare three data MCP servers + the built-in `github` toolset (`tools.github.toolsets: [all]`) + `bash` + `edit` + `web-fetch` (frontmatter key; agent calls `web_fetch`) + `agentic-workflows` + `cache-memory`.

gh-aw frontmatter keys use **kebab-case** (`tools.web-fetch:`, `tools.cache-memory:`, `safe-outputs.create-pull-request:`). Runtime tool names use **snake_case** (`web_fetch`, `cache_memory`, `safeoutputs___create_pull_request`).

| Server / tool | Transport | Declared in | Tool-name style | Example tools |
|---------------|-----------|-------------|-----------------|---------------|
| `riksdag-regering` | HTTP (Render) | `mcp-servers:` | `snake_case` | `get_sync_status`, `search_dokument`, `get_voteringar`, `get_dokument_innehall` |
| `scb` | container (`@jarib/pxweb-mcp`, `node:26-alpine`) | `mcp-servers:` | `snake_case` | `search_tables`, `get_table_info`, `query_table` |
| `world-bank` | container (`worldbank-mcp`, `node:26-alpine`) | `mcp-servers:` | `kebab-case` | `get-economic-data` (route economic context through `scripts/imf-fetch.ts`; this method serves only the non-economic indicators in `analysis/worldbank/indicators-inventory.json` — governance WGI, environment, social/education residue, defence historicals, crime/justice), `get-country-info`, `search-indicators` |
| `github` | HTTP (Copilot MCP) | `tools.github.toolsets: [all]` | standard | issues, PRs, repos, code-search, actions, releases, discussions |
| `bash` | local helper | `tools.bash: true` | standard | shell execution. Hosts the IMF CLI (see § IMF CLI). |
| `edit` | local helper | `tools.edit:` | standard | **Primary file create / overwrite mechanism.** All `.md` / `.json` / `.html` writes (analyses, briefs, sidecars, translations). Tier hierarchy → [`01-bash-and-shell-safety.md` §File creation & overwrite strategy](01-bash-and-shell-safety.md). |
| `web-fetch` | local helper | `tools.web-fetch:` | standard | HTTP fetch for non-MCP public sources (`www.statskontoret.se`, `riksdagsmonitor.com`, …) — domain-filtered through AWF firewall. Agent invokes as `web_fetch`. |
| `cache-memory` | GitHub Actions cache | `tools.cache-memory:` | filesystem | `/tmp/gh-aw/cache-memory/` keyed by `news-${workflow}-${article_date}` (14-day retention). Resilience for failed-PR retries → [`07-commit-and-pr.md §Cache-memory recovery`](07-commit-and-pr.md). |
| `safeoutputs` | runner (Streamable HTTP) | always available | `snake_case` | `safeoutputs___create_pull_request`, `safeoutputs___noop`, `safeoutputs___dispatch_workflow`, `safeoutputs___add_comment`, `safeoutputs___missing_data`, `safeoutputs___missing_tool`, `safeoutputs___report_incomplete` |

`filesystem`, `memory`, and `sequential-thinking` are declared in `.github/copilot-mcp.json` for the local Copilot channel — not available to news workflows unless the workflow declares them under `mcp-servers:`.

`playwright` is a built-in workflow tool (`tools.playwright`), not an MCP server. When `tools.playwright` appears in a workflow frontmatter (`news-evening-analysis`, `news-realtime-monitor`), run the Playwright/browser validation steps.

## IMF CLI (primary for all economic data — not an MCP server)

IMF is **the primary source** for all macro / fiscal / monetary / external-sector / trade / COFOG / commodity / exchange-rate context. Access via the TypeScript CLI through `bash`:

```bash
npx tsx scripts/imf-fetch.ts <command> [flags]
```

| Command | Purpose | Example |
|---------|---------|---------|
| `weo` | Single-country WEO time series (annual, incl. T+5 projections) | `tsx scripts/imf-fetch.ts weo --country SWE --indicator NGDP_RPCH --years 15 --persist` |
| `compare` | Batched WEO across the Nordic peer set (1 call, N countries) | `tsx scripts/imf-fetch.ts compare --indicator GGXWDG_NGDP --countries SWE,DNK,NOR,FIN,DEU --persist` |
| `sdmx` | SDMX 3.0 passthrough (CPI / FM / BOP / GFS_COFOG / MFS_IR / IMTS / PCPS / ER — IFS dissolved into CPI/MFS_IR/ER, DOTS renamed to IMTS, PCPS moved to IMF.RES in the 2026-05 refactor) | `tsx scripts/imf-fetch.ts sdmx --path "/data/IMF.STA,CPI,5.0.0/SWE.CPI._T.IX.M?startPeriod=2024-01" --indicator _T.IX --country SWE --persist` |
| `list-indicators` | Discovery — list built-in indicator codes | `tsx scripts/imf-fetch.ts list-indicators` |

Rules:

- **Rate-limit discipline**: IMF advertises ~10 req / 5 s. Prefer `compare` over parallel `weo`. `sleep 1` between invocations. Target ≤ 10 IMF calls per article.
- **Caching**: always pass `--persist` → writes `analysis/data/imf/{indicator}/{country}.json`. Re-use across article types in the same daily run.
- **Vintage discipline**: every projection quote carries the vintage tag — `(WEO Apr-2026, GGXWDG_NGDP)`.
- **Provider decision**: macro / fiscal / monetary / external → IMF; governance (WGI) / environment / social residue → World Bank; Swedish-specific ground truth → SCB.
- **Authoritative inventory**: [`analysis/imf/indicators-inventory.json`](../../analysis/imf/indicators-inventory.json) · [`analysis/imf/data-dictionary.md`](../../analysis/imf/data-dictionary.md) · [`analysis/imf/agentic-integration.md`](../../analysis/imf/agentic-integration.md) (7-step playbook) · [`analysis/imf/indicator-policy-mapping.md`](../../analysis/imf/indicator-policy-mapping.md) (committee matrix).
- **Contract**: [`.github/aw/ECONOMIC_DATA_CONTRACT.md`](../aw/ECONOMIC_DATA_CONTRACT.md) v3.2+.
- **Firewall egress**: `www.imf.org`, `api.imf.org`, `data.imf.org`, `dataservices.imf.org` (in every workflow's `network.allowed` + `safe-outputs.allowed-domains`). The TypeScript IMF client sends an explicit Riksdagsmonitor `User-Agent`; raw `node` / `undici` fetch calls can be rejected with HTTP 403. SDMX requests to `api.imf.org/external/sdmx/3.0` require `IMF_SDMX_SUBSCRIPTION_KEY` (Azure APIM `Ocp-Apim-Subscription-Key` header) — exported to the agent shell by `news-prewarm`.
- **Statskontoret egress**: `www.statskontoret.se` / `statskontoret.se` — public non-MCP sources for agency capacity, state-governance evaluations, implementation feasibility, administrative burden, public-sector efficiency.
- **Lagrådet egress**: `www.lagradet.se` / `lagradet.se` — public non-MCP sources for Council on Legislation referrals and yttranden on government propositions touching constitutional law, fundamental rights, criminal procedure, court organisation, surveillance, taxation. Required input for major-bill `risk-assessment.md`, `threat-analysis.md`, `forward-indicators.md` per [`03-data-download.md §Lagrådet enrichment`](03-data-download.md).

## Health gate (in-prompt)

This is typically the **first** agent bash call of the run and is where the time-budget anchor from [`01-bash-and-shell-safety.md §Time-budget self-monitoring`](01-bash-and-shell-safety.md) is established. Print `agent_minute=N  remaining_to_pr_deadline=M` at the **end** of the gate. Target `agent_minute ≤ 5` at end-of-health-gate.

Run once at workflow start, then proceed:

1. Call `get_sync_status({})`. Retry up to **3 times**, 20 s apart (server is pre-warmed by the CI `steps:` block).
2. On third-attempt failure: first run the [`03-data-download.md §Pre-flight: existing analysis check`](03-data-download.md) block so `IMPROVEMENT_MODE` is set (the early-scaffold heredoc expands `$IMPROVEMENT_MODE` under `set -euo pipefail` and will otherwise abort with "unbound variable" — if you cannot run the full pre-flight here, at minimum prepend `IMPROVEMENT_MODE=false` before the scaffold snippet). Then write the early-scaffold marker per [`03-data-download.md §Early-scaffold marker`](03-data-download.md) (guarantees a non-empty diff even when MCP is totally unreachable). Set `ANALYSIS_DIR=analysis/daily/$ARTICLE_DATE/$SUBFOLDER` and branch on `[ -s "$ANALYSIS_DIR/synthesis-summary.md" ]`:
   - **Prior analysis exists** → route to improvement-mode in [`04-analysis-pipeline.md`](04-analysis-pipeline.md). Extend using on-disk evidence, refresh `article.md` + HTML, PR once.
   - **No prior analysis** → if the scaffold write succeeded, issue a partial PR documenting the MCP failure (not a noop). Only if the scaffold write also failed, apply the MCP-unreachable no-op rule in [`07-commit-and-pr.md §No-op policy`](07-commit-and-pr.md) condition #1 and exit.
3. Spend ≤ **2 minutes** on warm-up once `get_sync_status` succeeds.
4. Read `data/imf-context.json` (written by `news-prewarm`) before any economic claim:
   - `status: ok` / `stale-vintage` / `degraded` → continue IMF-first. For `degraded`, use WEO/FM Datamapper evidence; avoid SDMX-only claims unless cached.
   - `status: unavailable` or `data/imf-unavailable.flag` present → inject the standard warning block, use cached IMF / SCB fallback only. World Bank is not a substitute for macroeconomic claims.
5. Pre-warm IMF with one throwaway `weo` call through the CLI: `npx tsx scripts/imf-fetch.ts weo --country SWE --indicator NGDP_RPCH --years 1 >/dev/null 2>&1 || true ; sleep 1`.

## Data sourcing rules

| Rule |
|------|
| Riksdag tool arguments are documented under [`.github/skills/riksdag-regering-mcp/`](../skills/riksdag-regering-mcp/). |
| **Economic data is IMF-first.** `get-economic-data` (world-bank MCP) is a legacy fallback for pre-2026-04-20 articles only — not a primary source for new articles. |
| **Statskontoret is a public non-MCP source.** Use `web_fetch` / primary URLs, cite report title + URL, record retrieval in `data-download-manifest.md`. |
| **Lagrådet is a public non-MCP source.** Required for major-bill propositions per [`03-data-download.md §Lagrådet enrichment`](03-data-download.md). Cite referral URL + yttrande publication date; tag `referral pending` when no yttrande yet exists. |
| **Prior-voteringar enrichment** is standard: `search_voteringar` keyed by **topic keyword** (`avser`) or **full proposition beteckning** (e.g. `bet: "2024/25:JuU17"`, never a bare committee prefix like `JuU`) over the last 4 `rm` (riksmöten), for every committee-report, motion, interpellation cycle. Feeds `historical-parallels.md`, `coalition-mathematics.md`, `swot-analysis.md` evidence rows. See [`03-data-download.md §Prior-voteringar enrichment`](03-data-download.md) for the full query-shape contract and fallback hierarchy. |
| Treat mid-run MCP failure as partial data: continue with what you have, document gaps in `data-download-manifest.md`, never silently drop documents. |
| Source authority and no-fabrication rule: see [`00-base-contract.md`](00-base-contract.md) rules 1 + 3. |

## Pre-warm step (CI job, not prompt)

Every news workflow declares a single `curl`-based pre-warm step (≤ 6 retries, ≤ 20 s apart). With `curl --max-time 30`, worst-case runtime can exceed 4 minutes — treat as best-effort, not a hard ≤ 2 min guarantee. For a strict cap, reduce the workflow's `curl` timeout or retry policy.

## MCP gateway session timeout — **DO NOT SET** without re-testing on v0.3.9

`engine.mcp.session-timeout` and `sandbox.mcp.keepalive-interval` are currently removed from every workflow. MCP Gateway v0.3.1 rejected the gh-aw v0.71.3 compiled `sessionTimeout` field ([gh-aw #29353](https://github.com/github/gh-aw/issues/29353)). The gh-aw v0.74.3 lock files now ship MCP Gateway **v0.3.9** — acceptance has not yet been re-validated on this repo. Do not re-add either field without first running one news workflow end-to-end against v0.3.9. The MCP gateway default keepalive (v0.3.9) is sufficient for the 60-min job window. PR deadline is governed by Timer A (job `timeout-minutes: 60`) and Timer B (Copilot API session ~60 min) — call `safeoutputs___create_pull_request` by agent minute 42.
