# MCP Reliability Audit — Year Ahead 2026–2027

**Date**: 2026-05-27  
**Run ID**: 26545802195

---

## MCP Server Status

| Server | Status | Latency | Notes |
|--------|:---:|------:|-------|
| riksdag-regering | ✅ LIVE | ~200 ms | All tools functional |
| scb | — | — | Not required for year-ahead scope |
| world-bank | — | — | IMF primary; WB not invoked |
| github | ✅ LIVE | ~150 ms | File system operations |
| imf (via CLI) | ⚠️ DEGRADED | Timeout | WEO Datamapper API unreachable (3/3 attempts failed) — fallback to cache |

---

## Tool Usage Log

| Tool | Calls | Success | Failures | Notes |
|------|:---:|:---:|:---:|-------|
| get_sync_status | 1 | 1 | 0 | Health gate passed |
| get_propositioner | 1 | 1 | 0 | 15 propositions retrieved |
| get_interpellationer | 1 | 1 | 0 | 10 interpellations retrieved |
| download-parliamentary-data script | 1 | 1 | 0 | 150 docs downloaded; 16 date-selected; 10 full texts |
| imf-fetch.ts weo | 1 | 0 | 1 | Datamapper API timeout; fallback to data/imf-context.json |

---

## Cache Fallback Assessment

**IMF cache**: `data/imf-context.json` used. Vintage: WEO-2026-04. Age: 1 month. Within 3-month freshness threshold. **No stale warning required.**

---

## Data Coverage Assessment

| Domain | Coverage | Gap |
|--------|:---:|-----|
| Legislative pipeline | HIGH (16 docs, 10 full texts) | Truncation at 100k chars for large documents |
| Economic context | MODERATE (IMF cache) | Live IMF API unavailable |
| Electoral polling | LOW (structural estimate) | No live polling API integration |
| International comparison | MODERATE (structured knowledge) | No real-time international parliament APIs |

---

## Recommendations for Future Runs

1. Pre-cache IMF WEO/FM data the day before year-ahead runs (API reliability is variable)
2. Integrate a polling aggregator data source (SVT Väljarbarometer, Sentio etc.) for election-year runs
3. SCB monthly labour market API call should be standard for comprehensive-depth runs
4. Consider increasing full-text retrieval limit beyond 10 documents for year-ahead comprehensive runs (15–20 recommended)
