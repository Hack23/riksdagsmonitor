# 📥 Data Download Manifest — Opposition Motions · 2026-05-20

**Cycle:** motions | **Date:** 2026-05-20 | **Run ID:** 26149312557

## MCP Health Check

| Server | Status | Latency | Time |
|--------|--------|---------|------|
| riksdag-regering | ✅ live | <500ms | 2026-05-20 |
| IMF pre-warm | ✅ ok | WEO-2026-04 vintage | 2026-05-20 |

## Download Summary

| Metric | Value |
|--------|-------|
| Target date | 2026-05-20 |
| Lookback activated | Yes (no motions on 2026-05-20) |
| Lookback date | 2026-05-15 |
| Total documents fetched | 20 |
| Documents matching date filter | 1 |
| Documents selected | 1 |

## Documents

| dok_id | Title | Party | Committee | Date | Status |
|--------|-------|-------|-----------|------|--------|
| HD024184 | med anledning av prop. 2025/26:258 Ökad insyn i politiska processer | C (Centerpartiet) | KU | 2026-05-15 | ✅ Full text retrieved |

## Enrichment

### Lagrådet
- **Trigger:** KU constitutional law domain + Prop. 2025/26:258 touches fundamental rights
- **Finding:** Lagrådet issued opinion 2026-03-24 on the labor organizations contributions section, characterizing the evidential basis as "bräckligt" (fragile)
- **Status:** ✅ Referenced in HD024184 full text — cited as authoritative by C

### SOU 2025:52
- **Background:** Parliamentary committee appointed June 2023 to review party finance and lobbying regulation
- **Finding:** Committee did NOT recommend enacting a law on labor organizations' contributions to parties
- **Status:** ✅ Referenced in HD024184

### Prior KU voteringar
- **Search:** riksdag-regering search_voteringar for KU, rm 2025/26 and 2024/25
- **Result:** No matching votes returned via API
- **Assessment:** No prior KU votes on directly comparable transparency legislation identified in this cycle

### IMF economic context
- **Vintage:** WEO-2026-04 (1 month old, not stale)
- **Relevance:** Low for this constitutional/transparency motion — no direct fiscal implications
- **Status:** IMF pre-warm confirmed

## File inventory

| File | Size | Status |
|------|------|--------|
| documents/hd024184.json | ~70KB | ✅ |

