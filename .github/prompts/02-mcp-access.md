# 02 — MCP Access

Authoritative per-workflow surface: the `mcp-servers:` + `tools:` blocks in that workflow's frontmatter. `.github/copilot-mcp.json` is the **local Copilot** surface (used by `assign_copilot_to_issue` / agent files in `.github/agents/`), not by news workflow runs.

## Servers & tool naming

News workflows declare three data MCP servers + the built-in `github` toolset (via `tools.github.toolsets: [all]`) + `bash` + `agentic-workflows` + `repo-memory`.

| Server | Transport | Declared in | Tool-name style | Example tools |
|--------|-----------|-------------|-----------------|---------------|
| `riksdag-regering` | HTTP (Render) | workflow `mcp-servers:` | `snake_case` | `get_sync_status`, `search_dokument`, `get_voteringar`, `get_dokument_innehall` |
| `scb` | container (`@jarib/pxweb-mcp`) | workflow `mcp-servers:` | `snake_case` | `search_tables`, `get_table_info`, `query_table` |
| `world-bank` | container (`worldbank-mcp`) | workflow `mcp-servers:` | `kebab-case` | `get-economic-data`, `get-country-info`, `search-indicators` |
| `github` | HTTP (Copilot MCP) | workflow `tools.github` | standard | full GitHub MCP toolset |
| `repo-memory` | local helper | workflow `tools.repo-memory` | standard | persistent cross-run memory on `memory/news-generation` |
| `bash` | local helper | workflow `tools.bash` | standard | shell execution |
| `safeoutputs` | runner | always available | `snake_case` | `safeoutputs___create_pull_request`, `safeoutputs___noop`, `safeoutputs___dispatch_workflow` |

`filesystem`, `memory`, `sequential-thinking`, `playwright` are declared in `.github/copilot-mcp.json` for the **local Copilot / `assign_copilot_to_issue`** channel. They are **not** available to news workflows unless the workflow itself declares them under `mcp-servers:`. Authoritative server inventory: [`.github/copilot-mcp.json`](../copilot-mcp.json) for local; the workflow frontmatter for the actual per-run surface.

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

Every news workflow declares a **single** `curl`-based pre-warm step with ≤ 6 retries, ≤ 20 s apart, total ≤ 2 minutes. No background pingers. The `safeoutputs` session is kept alive by completing work inside its ~30-minute idle window, not by opening interim PRs.
