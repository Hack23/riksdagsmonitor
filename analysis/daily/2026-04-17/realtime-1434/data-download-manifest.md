# Data Download Manifest — Realtime Monitor 1434
**Date**: 2026-04-17 | **Run**: realtime-1434 | **Completed**: 2026-04-17T14:40:00Z

---

## Data Sources

| Source | Tool | Status | Count |
|--------|------|--------|-------|
| Riksdag propositioner (2025/26) | get_propositioner | ✅ Live | 272 total, 6 recent |
| Riksdag betänkanden (2025/26) | get_betankanden | ✅ Live | 20 retrieved |
| Riksdag dokument search | search_dokument (2026-04-16 to 2026-04-17) | ✅ Live | 2818 total |
| Riksdag voteringar (2025/26) | search_voteringar | ✅ Live | 20 retrieved (latest: March 2026) |
| Regering pressmeddelanden | search_regering (2026-04-16 to 2026-04-17) | ✅ Live | 15 found |
| Regering propositioner | search_regering propositioner | ✅ Live | 3 found |
| Document content | get_g0v_document_content | ✅ Live | 1 fetched (Ukraine press release) |
| Document details | get_dokument | ✅ Live | 6 fetched |
| Sync status | get_sync_status | ✅ Live | Status: live |

---

## Key Documents Retrieved

| Dok ID | Type | Date | Selected? |
|--------|------|------|---------|
| HD03231 | Prop | 2026-04-16 | ✅ LEAD |
| HD03232 | Prop | 2026-04-16 | ✅ CO-LEAD |
| HD01KU32 | Bet | 2026-04-17 | ✅ Secondary |
| HD01KU33 | Bet | 2026-04-17 | ✅ Secondary |
| HD01CU28 | Bet | 2026-04-17 | ✅ Supporting |
| HD01CU27 | Bet | 2026-04-17 | ✅ Supporting |
| HD01CU22 | Bet | 2026-04-17 | Context only |
| HD01SfU22 | Bet | 2026-04-14 | Context (prev. covered) |

---

## Excluded Documents (Previously Covered)

| Dok ID | Reason |
|--------|--------|
| HD03246 | Covered in realtime-0029 (today, 00:29 UTC) |
| HD0399 | Published Apr 13 — covered by other workflows |
| HD03100 | Published Apr 13 — spring economic proposition |
| HD03236 | Published Apr 13 — spring extra budget |

---

## Data Freshness

- **Last riksdagen sync**: 2026-04-17T14:34:37Z (live)
- **Data age**: < 1 minute at time of query
- **Status**: FRESH — no staleness disclaimer required
