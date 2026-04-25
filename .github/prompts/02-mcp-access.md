# 02 — MCP Access

Authoritative per-workflow surface: the `mcp-servers:` + `tools:` blocks in that workflow's frontmatter. `.github/copilot-mcp.json` is the **local Copilot** surface (used by `assign_copilot_to_issue` / agent files in `.github/agents/`), not by news workflow runs.

## Servers & tool naming

News workflows declare three data MCP servers + the built-in `github` toolset (via `tools.github.toolsets: [all]`) + `bash` + `agentic-workflows`.

| Server | Transport | Declared in | Tool-name style | Example tools |
|--------|-----------|-------------|-----------------|---------------|
| `riksdag-regering` | HTTP (Render) | workflow `mcp-servers:` | `snake_case` | `get_sync_status`, `search_dokument`, `get_voteringar`, `get_dokument_innehall` |
| `scb` | container (`@jarib/pxweb-mcp`) | workflow `mcp-servers:` | `snake_case` | `search_tables`, `get_table_info`, `query_table` |
| `world-bank` | container (`worldbank-mcp`) | workflow `mcp-servers:` | `kebab-case` | `get-economic-data`, `get-country-info`, `search-indicators` |
| `github` | HTTP (Copilot MCP) | workflow `tools.github` | standard | full GitHub MCP toolset |
| `bash` | local helper | workflow `tools.bash` | standard | shell execution |
| `safeoutputs` | runner | always available | `snake_case` | `safeoutputs___create_pull_request`, `safeoutputs___noop`, `safeoutputs___dispatch_workflow` |

`filesystem`, `memory`, and `sequential-thinking` are declared in [`.github/copilot-mcp.json`](../copilot-mcp.json) for the **local Copilot / `assign_copilot_to_issue`** channel and are **not** available to news workflows unless the workflow itself declares them under `mcp-servers:`.

`playwright` must be treated separately: in news workflows it is available as the built-in workflow tool `tools.playwright` when that workflow declares it under `tools:` (e.g. `news-evening-analysis`, `news-realtime-monitor`). In that case it is **not** an MCP server, so do **not** infer its availability from `mcp-servers:` alone and do **not** skip Playwright/browser validation steps when `tools.playwright` is present in workflow frontmatter.

Authoritative inventory: [`.github/copilot-mcp.json`](../copilot-mcp.json) for the local Copilot MCP surface, and each workflow's `mcp-servers:` plus `tools:` frontmatter for the actual per-run surface.

# 02 — MCP Access

Authoritative per-workflow surface: the `mcp-servers:` + `tools:` blocks in that workflow's frontmatter. `.github/copilot-mcp.json` is the **local Copilot** surface (used by `assign_copilot_to_issue` / agent files in `.github/agents/`), not by news workflow runs.

## Servers & tool naming

News workflows declare three data MCP servers + the built-in `github` toolset (via `tools.github.toolsets: [all]`) + `bash` + `agentic-workflows`.

| Server | Transport | Declared in | Tool-name style | Example tools |
|--------|-----------|-------------|-----------------|---------------|
| `riksdag-regering` | HTTP (Render) | workflow `mcp-servers:` | `snake_case` | `get_sync_status`, `search_dokument`, `get_voteringar`, `get_dokument_innehall` |
| `scb` | container (`@jarib/pxweb-mcp`) | workflow `mcp-servers:` | `snake_case` | `search_tables`, `get_table_info`, `query_table` |
| `world-bank` | container (`worldbank-mcp`) | workflow `mcp-servers:` | `kebab-case` | `get-economic-data` *(legacy — economic context has migrated to IMF CLI; keep for WGI governance / environment / social residue only)*, `get-country-info`, `search-indicators` |
| `github` | HTTP (Copilot MCP) | workflow `tools.github` | standard | full GitHub MCP toolset |
| `bash` | local helper | workflow `tools.bash` | standard | shell execution (**also hosts the IMF CLI — see § IMF CLI below**) |
| `safeoutputs` | runner | always available | `snake_case` | `safeoutputs___create_pull_request`, `safeoutputs___noop`, `safeoutputs___dispatch_workflow` |

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
- **Contract**: [`.github/aw/ECONOMIC_DATA_CONTRACT.md`](../aw/ECONOMIC_DATA_CONTRACT.md) v2.1+.
- **Firewall egress**: `data.imf.org`, `api.imf.org`, `www.imf.org` (already in every workflow's `network.allowed`).
- **Statskontoret egress**: `www.statskontoret.se` / `statskontoret.se` are public non-MCP web sources used for agency capacity, state-governance evaluations, implementation feasibility, administrative burden and public-sector efficiency evidence.

## Health gate (in-prompt)

Run once at workflow start, then proceed — do not loop forever.

1. Call `get_sync_status({})`. Retry up to **3 times**, 20 s apart. Server is pre-warmed by the CI `steps:` block.
2. If the third attempt fails, apply the MCP-unreachable no-op policy from `07-commit-and-pr.md` and exit.
3. Once `get_sync_status` succeeds, proceed. Do not spend more than **2 minutes** on warm-up.
4. Pre-warm IMF with one throwaway `weo` call: `tsx scripts/imf-fetch.ts weo --country SWE --indicator NGDP_RPCH --years 1 >/dev/null 2>&1 || true ; sleep 1`.

## Data sourcing rules

| Rule |
|------|
| Riksdag tool arguments are documented under [`.github/skills/riksdag-regering-mcp/`](../skills/riksdag-regering-mcp/). |
| **Economic data is IMF-first**. Only use `get-economic-data` (world-bank MCP) for articles written pre-2026-04-20 or as an explicit legacy fallback — **never** as a primary source in new articles. |
| **Statskontoret is a public non-MCP source** for Swedish agency governance, administrative capacity, implementation feasibility and public-sector efficiency. Use `web_fetch` / primary URLs where available, cite report title + URL, and record retrieval in `data-download-manifest.md`. |
| Treat MCP failure mid-run as partial data: continue with what you have, document gaps in `data-download-manifest.md`, never silently drop documents. |
| Source authority and no-fabrication rule: see `00-base-contract.md` rules 1 + 3. |

## Pre-warm step (CI job, not prompt)

Every news workflow declares a **single** `curl`-based pre-warm step with ≤ 6 retries, ≤ 20 s apart. With `curl --max-time 30`, the worst-case runtime can exceed 4 minutes, so this is a best-effort pre-warm rather than a hard ≤ 2 minute guarantee. If a strict 2 minute cap is required, the workflow's `curl` timeout and/or retry policy must be reduced accordingly. No background pingers. MCP session longevity is maintained via `sandbox.mcp.keepalive-interval: 300`.
