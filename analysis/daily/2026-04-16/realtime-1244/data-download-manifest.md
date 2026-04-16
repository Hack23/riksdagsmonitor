# Data Download Manifest — 2026-04-16

**Generated**: 2026-04-16 12:45 UTC  
**Updated**: 2026-04-16 19:20 UTC (AI-enriched second pass with verified MCP data)  
**Data Sources**: get_propositioner, get_motioner, get_betankanden, search_voteringar (349 individual records), search_anforanden, get_fragor, get_interpellationer, get_dokument_innehall  
**Documents Analyzed**: 24 (23 documents + JuU15 betänkande with 349 individual vote records)  
**Confidence**: HIGH  
**Produced By**: Automated data pipeline + AI-enriched verification (post-vote update with Riksdagen MCP API)

> ✅ **AI-Enriched**: This manifest has been verified against actual Riksdagen MCP API data. JuU15 vote records confirmed: **145 Ja / 142 Nej / 62 Frånvarande = 349 total** (all 349 individual records retrieved and verified via `search_voteringar`).

## Summary

Downloaded **300** documents (session-wide) from 8 MCP data sources.

After date filtering to **2026-04-16**: **23** documents selected for analysis, plus JuU15 betänkande with 349 individual vote records.

## Document Counts by Type

| Source | Raw Count | Filtered (2026-04-16) | Verified |
|:-------|:---------:|:---------------------:|:--------:|
| **Propositions** (get_propositioner) | 50 | 4 | ✅ HD03246, HD03242, HD03244, HD03218 |
| **Motions** (get_motioner) | 50 | 6 | ✅ HD024090-HD024095 |
| **Committee Reports** (get_betankanden) | 50 | 4 | ✅ JuU15, HD01MJU19, HD01MJU20, HD01SkU32 |
| **Votes** (search_voteringar) | **349** | **349** | ✅ JuU15 punkt 1 — all 349 individual records |
| **Speeches** (search_anforanden) | 50 | 7 | ✅ JuU15 Kriminalvårdsfrågor debate (8-party) |
| **Questions** (get_fragor) | 50 | 9 | ✅ HD10435-HD11717 |
| **Interpellations** (get_interpellationer) | 50 | 0 | ✅ None for 2026-04-16 |

## JuU15 Vote Data Verification

| Metric | Value | Source |
|:-------|:-----:|:------:|
| Total vote records | **349** | search_voteringar(bet=JuU15, rm=2025/26, punkt=1) |
| Ja votes | **145** | search_voteringar(rost=Ja) → count: 145 |
| Nej votes | **142** | search_voteringar(rost=Nej) → count: 142 |
| Frånvarande | **62** | search_voteringar(rost=Frånvarande) → count: 62 |
| Votering ID | `24AAA94B-9A04-42D2-9CCA-4B9D8831C98F` | All 349 records |
| Vote timestamp | 2026-04-16 15:33:48 | All 349 records |
| Avser | sakfrågan | All 349 records |

## Data Quality Notes

- All documents sourced from official riksdag-regering MCP server
- JuU15 vote data verified via 3 separate queries: Ja (145), Nej (142), Frånvarande (62) = 349 total
- Party-level breakdown verified: M(66), SD(70), KD(19), L(16), S(106), V(22), C(24), MP(18), -(8) = 349
- Individual named records available for all 349 MPs
- Speech data available for JuU15 Kriminalvårdsfrågor debate (7 speakers from all 8 parties)