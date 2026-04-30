# 02 — MCP Access

Authoritative per-workflow surface: the `mcp-servers:` + `tools:` blocks in that workflow's frontmatter. `.github/copilot-mcp.json` is the **local Copilot** surface (used by `assign_copilot_to_issue` / agent files in `.github/agents/`), not by news workflow runs.

## Servers & tool naming

News workflows declare three data MCP servers + the built-in `github` toolset (via `tools.github.toolsets: [all]`) + `bash` + `edit` + `web-fetch` (frontmatter key; agent calls it as `web_fetch`) + `agentic-workflows` + `cache-memory` (resilience).

> **Naming convention reminder**: gh-aw frontmatter keys use **kebab-case** (`tools.web-fetch:`, `tools.cache-memory:`, `tools.agentic-workflows:`); the **runtime tool names** the agent invokes use **snake_case** (`web_fetch`, `cache_memory`, …). The same split applies to safe outputs (`safe-outputs.create-pull-request:` in YAML → `safeoutputs___create_pull_request` at call time).

| Server / tool | Transport | Declared in | Tool-name style | Example tools |
|---------------|-----------|-------------|-----------------|---------------|
| `riksdag-regering` | HTTP (Render) | workflow `mcp-servers:` | `snake_case` | `get_sync_status`, `search_dokument`, `get_voteringar`, `get_dokument_innehall` |
| `scb` | container (`@jarib/pxweb-mcp`, `node:25-alpine`) | workflow `mcp-servers:` | `snake_case` | `search_tables`, `get_table_info`, `query_table` |
| `world-bank` | container (`worldbank-mcp`, `node:25-alpine`) | workflow `mcp-servers:` | `kebab-case` | `get-economic-data` *(despite the legacy name, this method serves the non-economic indicator IDs documented in `analysis/worldbank/indicators-inventory.json`: governance WGI, environment, social/education residue, defence historicals, crime/justice; route economic context through `scripts/imf-fetch.ts`)*, `get-country-info`, `search-indicators` |
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
| `sdmx` | SDMX 3.0 passthrough (IFS / FM / BOP / GFS_COFOG / MFS_IR / DOTS / PCPS / ER) | `tsx scripts/imf-fetch.ts sdmx --path "/data/IMF.STA,CPI,4.0.0/M.SE.PCPI_IX?startPeriod=2024-01" --indicator PCPI_IX --country SWE --persist` |
| `list-indicators` | Discovery — list built-in indicator codes | `tsx scripts/imf-fetch.ts list-indicators` |

Rules:
- **Rate-limit discipline**: IMF advertises ~10 req / 5 s. Prefer `compare` over parallel `weo`. `sleep 1` between invocations. Target ≤ 10 IMF calls per article.
- **Caching**: always pass `--persist` — writes to `analysis/data/imf/{indicator}/{country}.json`. Re-use across article types in the same daily run.
- **Vintage discipline**: every projection quote MUST include the vintage tag — `(WEO Apr-2026, GGXWDG_NGDP)`.
- **Provider decision**: macro / fiscal / monetary / external → IMF; governance (WGI) / environment / social residue → World Bank; Swedish-specific ground truth → SCB.
- **Authoritative inventory**: [`analysis/imf/indicators-inventory.json`](../../analysis/imf/indicators-inventory.json) (machine-readable) · [`analysis/imf/data-dictionary.md`](../../analysis/imf/data-dictionary.md) (dataflow reference) · [`analysis/imf/agentic-integration.md`](../../analysis/imf/agentic-integration.md) (7-step playbook) · [`analysis/imf/indicator-policy-mapping.md`](../../analysis/imf/indicator-policy-mapping.md) (committee matrix).
- **Contract**: [`.github/aw/ECONOMIC_DATA_CONTRACT.md`](../aw/ECONOMIC_DATA_CONTRACT.md) v3.0+.
- **Firewall egress**: `data.imf.org`, `api.imf.org`, `www.imf.org` (already in every workflow's `network.allowed`).
- **Statskontoret egress**: `www.statskontoret.se` / `statskontoret.se` are public non-MCP web sources used for agency capacity, state-governance evaluations, implementation feasibility, administrative burden and public-sector efficiency evidence.
- **Lagrådet egress**: `www.lagradet.se` / `lagradet.se` are public non-MCP web sources for Council on Legislation referrals and yttranden on government propositions touching constitutional law, fundamental rights, criminal procedure, court organisation, surveillance, and taxation principles. Allow-listed in every news workflow's `network.allowed`. Required input for major-bill `risk-assessment.md`, `threat-analysis.md` and `forward-indicators.md` per `03-data-download.md §Lagrådet enrichment`.

## Health gate (in-prompt)

Run once at workflow start, then proceed — do not loop forever.

1. Call `get_sync_status({})`. Retry up to **3 times**, 20 s apart. Server is pre-warmed by the CI `steps:` block.
2. If the third attempt fails, set `ANALYSIS_DIR=analysis/daily/$ARTICLE_DATE/$SUBFOLDER` and branch on whether prior analysis exists, using a single concrete on-disk test:
   - **Prior analysis on disk** (`[ -s "$ANALYSIS_DIR/synthesis-summary.md" ]` returns true): do **not** exit. Route to improvement-mode in `04-analysis-pipeline.md` and continue without live MCP — extend artifacts using on-disk evidence, refresh `article.md` + rendered HTML, and commit one PR.
   - **No prior analysis on disk** (`[ ! -s "$ANALYSIS_DIR/synthesis-summary.md" ]`): apply the MCP-unreachable no-op policy from `07-commit-and-pr.md §No-op policy` and exit.
3. Once `get_sync_status` succeeds, proceed. Do not spend more than **2 minutes** on warm-up.
4. Pre-warm IMF with one throwaway `weo` call: `tsx scripts/imf-fetch.ts weo --country SWE --indicator NGDP_RPCH --years 1 >/dev/null 2>&1 || true ; sleep 1`.

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

## MCP gateway keepalive (`sandbox.mcp.keepalive-interval`)

Every news workflow sets `sandbox.mcp.keepalive-interval: 300`, which compiles to the gh-aw mcp-gateway's `keepaliveInterval` field. Semantics ([upstream spec](https://github.com/github/gh-aw/blob/main/docs/src/content/docs/reference/mcp-gateway.md)):

| Value | Meaning |
|-------|---------|
| `0` or unset | Gateway default = **1500 s (25 min)** — too slow for 45-min news jobs; the `riksdag-regering` HTTP MCP would idle out before Pass 2 finishes |
| `-1` | Disable keepalive entirely (do not use) |
| **`300`** *(our setting)* | Ping every 5 minutes — keeps `riksdag-regering` (HTTP) and any other HTTP-backed MCPs warm for the full 45-minute job budget. **This is the resilience knob that lets us run the full 45-minute sessions reliably.** |

The keepalive pings the **upstream HTTP MCPs through the gateway**. It does **not** keep the local `safeoutputs` Streamable-HTTP idle session alive — that session has its own ~25–30 min idle timeout (Timer C in `00-base-contract.md` and `07-commit-and-pr.md`). Reach `safeoutputs___create_pull_request` by minute 28 (hard 30) regardless of keepalive.
