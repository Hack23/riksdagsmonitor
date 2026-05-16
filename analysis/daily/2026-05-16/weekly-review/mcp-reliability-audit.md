---
artifact: mcp-reliability-audit
analysis_date: "2026-05-16"
subfolder: "weekly-review"
---

# MCP Reliability Audit — Weekly Review 2026-05-16

## MCP Server Status During This Run

| Server | Status | Pre-warm | Documents fetched | Full text | Errors |
|--------|--------|----------|------------------|-----------|--------|
| riksdag-regering | ✅ LIVE | 2026-05-16T09:17:44Z | 4/4 | 4/4 | 0 |
| scb | N/A (not required this run) | — | — | — | — |
| world-bank | N/A (not required this run) | — | — | — | — |
| IMF Datamapper | ⚠️ UNAVAILABLE | status=ok (context) | — | — | Datamapper transport failed |

## riksdag-regering Performance
- **Latency**: Normal (pre-warm timestamp recorded)
- **Document fetch success rate**: 100% (4/4)
- **Full-text fetch success rate**: 100% (4/4)
- **Lookback accuracy**: Correctly returned 2026-05-15 documents when 2026-05-16 had none

## IMF Issue
- **Pre-warm**: Status returned "ok" from imf-context.ts
- **SDMX/Datamapper**: All three transport strategies failed (retry exhausted, fallback failed)
- **Impact**: WEO Apr 2026 context used instead; no Nordic peer comparison data this run
- **Recommendation**: Investigate IMF network egress allowlist; verify `www.imf.org` and `api.imf.org` are reachable from runner

## Recommendations for Next Run
1. Add IMF transport health check to pre-warm step (separate from context status)
2. If IMF fails, log `imf-unavailable.flag` in analysis folder for transparency
3. SCB pre-warm should be added for runs involving Swedish economic statistics
