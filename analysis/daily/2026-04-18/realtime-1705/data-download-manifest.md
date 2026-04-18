# Data Download Manifest — Realtime Monitor 2026-04-18T17:05
**Analysis run:** realtime-1705 | **MCP Status:** LIVE | **Generated:** 2026-04-18T17:10Z

## Data Sources Used

### riksdag-regering-mcp
- `get_sync_status()` → LIVE (generated_at: 2026-04-18T17:05:22Z)
- `get_propositioner(rm: "2025/26", limit: 20)` → 272 propositions total, 20 fetched
- `get_betankanden(rm: "2025/26", limit: 20)` → 20 fetched
- `search_dokument(from_date: 2026-04-17, to_date: 2026-04-18, limit: 30)` → 2729 total
- `search_regering(dateFrom: 2026-04-17, dateTo: 2026-04-18, limit: 15)` → 16 items
- `get_dokument_innehall(HD03246)` → snippet only (fulltext_available: true)
- `get_dokument_innehall(HD03236)` → snippet only (fulltext_available: true)
- `get_dokument_innehall(HD03100)` → snippet only (fulltext_available: true)

### World Bank API
- `get-economic-data(SE, GDP_GROWTH, 10)` → 2016-2024 data fetched ✅
- `get-economic-data(SE, INFLATION, 5)` → 2021-2024 data fetched ✅
- `get-economic-data(SE, UNEMPLOYMENT, 5)` → 2021-2025 data fetched ✅
- `get-economic-data(SE, GDP_PER_CAPITA, 5)` → 2021-2024 data fetched ✅

## Key Statistics Captured
| Indicator | Latest Value | Year | Source |
|-----------|-------------|------|--------|
| GDP Growth | 0.82% | 2024 | World Bank |
| Inflation (CPI) | 2.84% | 2024 | World Bank |
| Unemployment | 8.7% | 2025 | World Bank |
| GDP per capita | $57,117 | 2024 | World Bank |
| Riksdag documents (2025/26) | 272 propositions | 2026 | riksdag-regering |

## Documents Analyzed
4 primary documents: HD03100, HD03236, HD03246, HD01SfU22
Additional context: HD0399, HD03240, HD03239, HD03242, HD03241, HD03101, HD03220

## Data Quality Assessment
- **Freshness**: Live data as of 2026-04-18T17:05Z — NO STALENESS WARNING
- **Completeness**: Full metadata + summaries available for all primary documents
- **Fulltext availability**: Available but not fetched (very large documents) — summaries used
