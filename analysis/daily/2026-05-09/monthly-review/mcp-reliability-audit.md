# MCP Reliability Audit — Monthly Review, May 2026

**Date**: 2026-05-09  

---

## MCP Server Status

| Server | Status | Notes |
|--------|--------|-------|
| riksdag-regering | ✅ OPERATIONAL | Data download succeeded; 204 documents fetched |
| imf (CLI) | ❌ DEGRADED | CLI returning "fetch failed"; WEO Apr-2026 context used |
| IMF SDMX IFS | ❌ ERROR | 404 at version path 5.0.0; use version 4.0.0 or WEO/FM only |
| scb | ✅ OPERATIONAL | Available (not called this run) |
| world-bank | ✅ OPERATIONAL | Available (not called this run) |
| github | ✅ OPERATIONAL | Filesystem operations normal |

## IMF Failure Details

```
Error: IMF API error: 404 for https://api.imf.org/external/sdmx/3.0/data/IMF.STA,CPI,5.0.0/M.SE.PCPI_IX?startPeriod=2024-01
Recommended fix: Use version 4.0.0 path or fallback to WEO/FM Datamapper
WEO/FM Datamapper: OK (www.imf.org/external/datamapper)
```

## Data Quality Impact

- Economic indicators: DEGRADED — use WEO Apr-2026 context memory
- CPI/IFS series: UNAVAILABLE this run
- All IMF figures: marked provisional in economic-data.json

## Recommended Remediation

1. Update `scripts/imf-fetch.ts` to probe version path before constructing SDMX URL (try 4.0.0 before 5.0.0)
2. Add WEO/FM fallback when IFS returns 404
3. Pre-compute 10 key Swedish economic series at workflow start (see methodology-reflection.md Improvement 1)
