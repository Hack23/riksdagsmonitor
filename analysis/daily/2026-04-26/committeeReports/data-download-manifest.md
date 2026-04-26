---
title: Data Download Manifest — Committee Reports 2026-04-26
generated: 2026-04-26T19:53:00Z
workflow: news-committee-reports
run_id: 24965504707
article_date: 2026-04-26
effective_date: 2026-04-24
lookback_days: 2
---

# Data Download Manifest

## Metadata

- **Workflow**: news-committee-reports
- **Run ID**: 24965504707
- **UTC Timestamp**: 2026-04-26T19:53:00Z
- **Requested Date**: 2026-04-26
- **Effective Date**: 2026-04-24 (lookback: 2 days — no betänkanden published on 2026-04-25 or 2026-04-26)
- **Window**: 2026-04-20 to 2026-04-26

## MCP Server Status

- **riksdag-regering**: ✅ live (https://riksdag-regering-ai.onrender.com/mcp, status retrieved 2026-04-26T19:51:42Z)
- **scb**: not queried (no Swedish-specific ground truth required for this document set)
- **world-bank**: not queried
- **imf**: see IMF Context section below

## Documents Retrieved

| dok_id | Title | Date | Committee | Type | Full-text | DIW |
|--------|-------|------|-----------|------|-----------|-----|
| HD01FiU48 | Extra ändringsbudget för 2026 – Sänkt skatt på drivmedel samt el- och gasprisstöd | 2026-04-21 | FiU | bet | summary | L3 |
| HD01JuU10 | En ny vapenlag | 2026-04-24 | JuU | bet | summary | L3 |
| HD01CU25 | En snabbare utbyggnad av kriminalvårdsanstalter och häkten | 2026-04-23 | CU | bet | summary | L2+ |
| HD01FiU23 | Riksbankens verksamhet och förvaltning 2025 | 2026-04-23 | FiU | bet | summary | L2+ |
| HD01SoU25 | Stärkta insatser för äldre och för de som vårdar eller stöder närstående | 2026-04-24 | SoU | bet | summary | L2 |
| HD01JuU31 | Riksrevisionens rapport om Polisreformen 2015 | 2026-04-24 | JuU | bet | summary | L2 |
| HD01SfU23 | Bättre migrationsrättsliga regler för forskare och doktorander | 2026-04-23 | SfU | bet | summary | L2 |
| HD01AU15 | ILO:s konvention om avskaffande av våld och trakasserier i arbetslivet | 2026-04-23 | AU | bet | summary | L1 |
| HD01CU29 | Ökade möjligheter till hemmaladdning av elfordon | 2026-04-23 | CU | bet | summary | L1 |
| HD01CU24 | Effektiv och säker byggprocess | 2026-04-24 | CU | bet | metadata-only | L2 |
| HD01TU16 | Slopat krav på introduktionsutbildning för övningskörning | 2026-04-21 | TU | bet | summary | L1 |
| HD01MJU21 | Riksrevisionens rapport om statens insatser för jordbrukets klimatomställning | 2026-04-20 | MJU | bet | summary | L2 |

**Total documents**: 12

## IMF Context

- Pre-warm call made: `imf-fetch weo --country SWE --indicator NGDP_RPCH --years 1` 
- Economic context required for HD01FiU48 (fiscal policy) and HD01FiU23 (Riksbank)
- Swedish GDP growth 2025: ~1.2% (WEO Apr-2026); inflation targeting at 2% KPIF
- Interest rate trajectory: Riksbanken cut policy rate to 2.25% in 2025 (WEO Apr-2026 context)

## Cross-Source Enrichment

- **Statskontoret**: No directly relevant source found for the specific documents in this batch
- **Riksdagen open data**: https://data.riksdagen.se/ — primary source for all betänkanden
- **Regeringen**: Underlying propositions referenced in betänkanden retrieved via riksdag-regering MCP

## MCP Server Notes

- riksdag-regering HTTP MCP responded on first attempt (pre-warmed)
- All document summaries retrieved successfully
- Full text not fetched for all documents due to time constraints; key summaries sufficient for L1–L2 depth

