# Data Download Manifest — 2026-04-29 (Month Ahead)

**Workflow**: news-month-ahead  
**Run ID**: 25094681344  
**UTC Timestamp**: 2026-04-29T06:47:00Z  
**Requested Date**: 2026-04-29  
**Effective Date**: 2026-04-29  
**Window Used**: Same day (4 documents found)  
**Riksmöte**: 2025/26  
**Analysis Subfolder**: month-ahead

## Document Inventory

| dok_id | Title | Type | hangar_id | Committee | Retrieved | Full-Text |
|--------|-------|------|-----------|-----------|-----------|-----------|
| HD10454 | Åtgärder för att stoppa kriminella från att driva HVB-hem | ip (interpellation) | 5288570 | S (Socialutskottet) | 2026-04-29T06:47Z | YES — full text from riksdagen.se |
| HD10455 | Förutsättningar för att värna det rörliga kulturarvet | ip (interpellation) | — | SD (Kulturdepartementet) | 2026-04-29T06:47Z | metadata-only |
| HD10456 | Organhandel | ip (interpellation) | — | SD | 2026-04-29T06:47Z | metadata-only |
| HD11767 | Hemlösa som registreras som försvunna | fr (written question) | — | S | 2026-04-29T06:47Z | metadata-only |

## Full-Text Fetch Outcomes

| dok_id | full_text_available |
|--------|---------------------|
| HD10454 | true |
| HD10455 | false |
| HD10456 | false |
| HD11767 | false |

<full-text-fallback: HD10455, HD10456, HD11767 — full text not yet available from MCP server for newly filed documents>

## MCP Server Availability

- **riksdag-regering**: LIVE — `get_sync_status` confirmed at 2026-04-29T06:44:48Z [A1]
- **IMF CLI** (`scripts/imf-fetch.ts`): AVAILABLE — WEO, compare endpoints responsive
- **SCB**: Available (container)
- **World Bank**: Available (container)
- Retries: None required

## Reference Analyses (Sibling Folders — Last 30 Days)

| Date | Subfolder | Key dok_ids | Used For |
|------|-----------|-------------|----------|
| 2026-04-28 | month-ahead | HD10449, HD10450, HD01JuU10, HC01FiU20, HD01SfU28 | Cross-type synthesis, PIR ingestion |
| 2026-04-28 | evening-analysis | HC01FiU20, HD03253, HD01SfU28, HD01FöU20 | Cross-type synthesis |
| 2026-04-28 | propositions | HD03253, HD03252, HD03104, HD03256 | Economic, social policy context |
| 2026-04-26 | month-ahead | Prior month context | Longitudinal synthesis |
| 2026-04-26 | weekly-review | Weekly synthesis | Period baseline |

## Cross-Source Enrichment

- **IMF WEO (Apr 2026)**: SWE GDP growth NGDP_RPCH — fetched 2026-04-29
- **IMF WEO (Apr 2026)**: SWE inflation PCPIPCH — fetched 2026-04-29
- **IMF WEO (Apr 2026)**: SWE unemployment LUR — fetched 2026-04-29
- **Statskontoret**: No directly relevant source found for today's interpellations (HVB homes regulatory issue addressed by Socialstyrelsen, IVO, not Statskontoret directly)
- **Riksdag primary sources**: riksdagen.se [A1] for HD10454 full text

## Notes

All 4 documents are newly filed today (2026-04-29) in riksmöte 2025/26.  
Three are interpellations (ip); one is a written question (fr).  
All filed by S party (HD10454, HD11767) or SD party (HD10455, HD10456).  
Response deadlines: HD10454 → 2026-05-20.
