# 02 — MCP Access

Authoritative server list: [`.github/copilot-mcp.json`](../copilot-mcp.json). Do not duplicate config here.

## Servers & tool naming

| Server | Transport | Tool names use |
|--------|-----------|----------------|
| `riksdag-regering` | HTTP (Render.com) | snake_case (`get_sync_status`, `search_dokument`, `get_voteringar`) |
| `scb` | container | snake_case (`search_tables`, `get_table_info`, `query_table`) |
| `world-bank` | container | kebab-case (`get-economic-data`, `get-country-info`, `search-indicators`) |
| `github` | HTTP | standard GitHub MCP toolset |
| `filesystem` / `memory` / `sequential-thinking` / `playwright` | local | standard helpers |

IMF is **not** an MCP server. Fetch IMF data via the TypeScript client: `npx tsx scripts/imf-fetch.ts …` (see [Economic Data Contract](../aw/ECONOMIC_DATA_CONTRACT.md)).

## Health gate (in-prompt)

Run once at workflow start, then proceed — do not loop forever.

1. Call `get_sync_status({})`. Retry up to **3 times**, 20 s apart. Server is pre-warmed by the CI `steps:` block.
2. If the third attempt fails, call `safeoutputs___noop({"message": "MCP unavailable after pre-warm + 3 retries"})` and exit.
3. Once `get_sync_status` succeeds, proceed. Do not spend more than **2 minutes** on warm-up.

## Data sourcing rules

| Rule |
|------|
| All political content comes from live MCP data. Never fabricate, never reuse cached articles as source material. |
| Riksdag tool arguments are documented under [`.github/skills/riksdag-regering-mcp/`](../skills/riksdag-regering-mcp/). |
| Treat MCP failure mid-run as partial data: continue with what you have, document gaps in the analysis manifest, never silently drop documents. |

## Pre-warm step (CI job, not prompt)

Every news workflow declares a **single** `curl`-based pre-warm step with ≤ 6 retries, ≤ 20 s apart, total ≤ 2 minutes. No background pingers. The `safeoutputs` session is kept alive by completing work inside its ~30-minute idle window, not by opening interim PRs.
