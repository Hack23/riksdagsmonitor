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

IMF is **not** an MCP server. Fetch IMF data via the TypeScript client: `npx tsx scripts/imf-fetch.ts …` (see [Economic Data Contract](../aw/ECONOMIC_DATA_CONTRACT.md)).

## Health gate (in-prompt)

Run once at workflow start, then proceed — do not loop forever.

1. Call `get_sync_status({})`. Retry up to **3 times**, 20 s apart. Server is pre-warmed by the CI `steps:` block.
2. If the third attempt fails, apply the MCP-unreachable no-op policy from `07-commit-and-pr.md` and exit.
3. Once `get_sync_status` succeeds, proceed. Do not spend more than **2 minutes** on warm-up.

## Data sourcing rules

| Rule |
|------|
| Riksdag tool arguments are documented under [`.github/skills/riksdag-regering-mcp/`](../skills/riksdag-regering-mcp/). |
| Treat MCP failure mid-run as partial data: continue with what you have, document gaps in `data-download-manifest.md`, never silently drop documents. |
| Source authority and no-fabrication rule: see `00-base-contract.md` rules 1 + 3. |

## Pre-warm step (CI job, not prompt)

Every news workflow declares a **single** `curl`-based pre-warm step with ≤ 6 retries, ≤ 20 s apart. With `curl --max-time 30`, the worst-case runtime can exceed 4 minutes, so this is a best-effort pre-warm rather than a hard ≤ 2 minute guarantee. If a strict 2 minute cap is required, the workflow's `curl` timeout and/or retry policy must be reduced accordingly. No background pingers. MCP session longevity is maintained via `sandbox.mcp.keepalive-interval: 300`.
