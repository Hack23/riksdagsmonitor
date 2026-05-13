---
title: "MCP Reliability Audit — Post-2026 Forecast Run"
date: 2026-05-13
subfolder: election-cycle/next
---

# MCP Reliability Audit

## MCP Servers Available

- **riksdag-regering** (HTTP @ riksdag-regering-ai.onrender.com/mcp)
- **scb** (containerised pxweb-mcp)
- **world-bank** (containerised worldbank-mcp)

## Data Sources Used

This forecast operates against a corpus already downloaded for `../current/` synthesis. No additional MCP-server data fetched for this incremental forward-cycle build. Existing corpus is sufficient for forecast construction (forecast is based on coalition arithmetic + historical patterns + wildcards, not new dok_ids).

## IMF Integration

IMF anchoring via WEO Apr-2026 baseline [horizon:cycle]; no new SDMX queries required for forecast construction. Existing corpus provides macro context.

## Reliability Notes

- No MCP timeouts or errors during forecast generation (no live MCP calls in this build).
- Data freshness: existing 2026-05-13 corpus.
- Provenance: `economicProvenance` blocks emitted where IMF anchoring used.

