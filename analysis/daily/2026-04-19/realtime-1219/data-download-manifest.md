# Data Download Manifest — Realtime Monitor 2026-04-19 (1219)

**Run ID**: realtime-1219  
**Date**: 2026-04-19  
**Generated**: 2026-04-19T12:19:48Z  
**Analyst**: James Pether Sörling / Riksdagsmonitor  
**Source**: riksdag-regering-mcp (live data.riksdagen.se + g0v.se)

## Documents Analyzed

**Total**: 5 primary documents + 3 supporting government sources

| dok_id | Type | Committee | Title | Date | Priority |
|--------|------|-----------|-------|------|----------|
| HD01KU33 | betänkande | KU | Insyn i handlingar från beslag och kopiering vid husrannsakan | 2026-04-17 | P0 (Constitutional) |
| HD01KU32 | betänkande | KU | Tillgänglighetskrav för vissa medier | 2026-04-17 | P1 (Constitutional) |
| HD03231 | proposition | UD | Sveriges anslutning till tribunalen för aggressionsbrottet mot Ukraina | 2026-04-16 | P1 (Critical) |
| HD03232 | proposition | UD | Sveriges tillträde till konventionen om internationell skadeståndskommission för Ukraina | 2026-04-16 | P1 (Critical) |
| HD01CU28 | betänkande | CU | Ett register för alla bostadsrätter | 2026-04-17 | P2 (Sector) |

## Supporting Sources

| Source | Type | Relevance |
|--------|------|-----------|
| Regeringen press release 2026-04-17 | Pressmeddelande | H.M. Konungen + FM Malmer Stenergard besöker Ukraina |
| Regeringen press release 2026-04-18 | Pressmeddelande | Stöd till kulturarvsbevarande i Ukraina |
| World Bank SWE GDP Growth 2024 | Economic data | GDP growth 0.82% (2024), down from 5.2% in 2021 |
| World Bank SWE Inflation 2024 | Economic data | Inflation 2.836% (2024), down from 8.5% in 2023 |

## Data Freshness

- **Riksdag data**: Live as of 2026-04-19T12:19:53Z (status: "live")
- **Government data**: g0v.se last synced within 24h
- **World Bank**: Most recent available (2024 values)

## Previous Run Coverage

The previous realtime run (2026-04-18 1705) covered: HD03100, HD03236, HD03246, HD01SfU22, HD0399. All 5 documents in this run are NEW (not previously covered).

## Methodology

AI-driven analysis following `analysis/methodologies/ai-driven-analysis-guide.md` v5.1.
Per-document depth tiers: KU33 (L3), KU32 (L2+), HD03231+HD03232 (L2+), CU28 (L2).

## Chain-of-Custody Manifest

| # | Source | URL / Reference | Accessed | Fetched via | Caching | Integrity |
|:-:|--------|-----------------|----------|-------------|---------|-----------|
| 1 | Riksdagen.se — HD01KU33 | https://data.riksdagen.se/dokument/HD01KU33 | 2026-04-19T12:19Z | riksdag-regering-mcp | Session cache (run-scoped) | HTTP 200 |
| 2 | Riksdagen.se — HD01KU32 | https://data.riksdagen.se/dokument/HD01KU32 | 2026-04-19T12:19Z | riksdag-regering-mcp | Session cache | HTTP 200 |
| 3 | Riksdagen.se — HD03231 | https://data.riksdagen.se/dokument/HD03231 | 2026-04-19T12:19Z | riksdag-regering-mcp | Session cache | HTTP 200 |
| 4 | Riksdagen.se — HD03232 | https://data.riksdagen.se/dokument/HD03232 | 2026-04-19T12:19Z | riksdag-regering-mcp | Session cache | HTTP 200 |
| 5 | Riksdagen.se — HD01CU28 | https://data.riksdagen.se/dokument/HD01CU28 | 2026-04-19T12:19Z | riksdag-regering-mcp | Session cache | HTTP 200 |
| 6 | Regeringen.se — 2026-04-17 presser | https://www.regeringen.se/pressmeddelanden/ | 2026-04-19T12:20Z | riksdag-regering-mcp | Session cache | HTTP 200 |
| 7 | World Bank — Sweden GDP growth 2024 | https://api.worldbank.org/v2/country/SWE/indicator/NY.GDP.MKTP.KD.ZG | 2026-04-19T12:21Z | world-bank-mcp | Session cache | JSON valid |
| 8 | World Bank — Sweden CPI 2024 | https://api.worldbank.org/v2/country/SWE/indicator/FP.CPI.TOTL.ZG | 2026-04-19T12:21Z | world-bank-mcp | Session cache | JSON valid |

## Provenance Integrity Rules

- All riksdag-regering-mcp calls use HTTPS transport to https://riksdag-regering-ai.onrender.com/mcp with proxy allowlist enforcement.
- World Bank data retrieved via worldbank-mcp (container `node:25-alpine` per `.github/workflows/news-realtime-monitor.lock.yml` mcp-servers block).
- No personal data (PII) is cached; all fetched content is official public record.
- Cache retention: session-scoped only (per agent run); no persistent storage of external data in the repository.

## Document-Quality Rating

| Document | Quality rating | Completeness | Primary-source confidence |
|----------|:-------------:|:------------:|:-------------------------:|
| HD01KU33 betänkande | Official | Full text available | HIGH |
| HD01KU32 betänkande | Official | Full text available | HIGH |
| HD03231 proposition | Official | Full text available | HIGH |
| HD03232 proposition | Official | Full text available | HIGH |
| HD01CU28 betänkande | Official | Full text available | HIGH |
| Regeringen.se presser (King Kyiv) | Government press release | Full | HIGH |
| World Bank GDP / CPI | Public API | Full | HIGH |

## Coverage-Completeness Attestation

All 4 documents with weighted DIW ≥ 5.0 appear in the published article with dedicated H2/H3 sections:

- ✅ HD01KU33 (8.48) — H2 lead-story section
- ✅ HD03231 + HD03232 (8.33) — H2 co-lead section (single package)
- ✅ HD01KU32 (7.98) — H2 secondary section
- ✅ HD01CU28 (5.93) — H3 under "Sector updates"

All per-document files exist at the declared depth tier. See `methodology-reflection.md` §Pass-1 → Pass-2 improvement evidence for the reference-grade-extension audit.
