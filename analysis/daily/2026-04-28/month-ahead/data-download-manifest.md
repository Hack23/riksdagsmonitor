# Data Download Manifest — Month Ahead 2026-04-28

**Workflow**: news-month-ahead  
**Run ID**: 25030441457  
**Generated**: 2026-04-28T02:28:00Z  
**Requested date**: 2026-04-28  
**Effective date**: 2026-04-27 (1-day lookback — Riksdag not in session on 2026-04-28)  
**Window**: April 2026 → May 2026 (month-ahead horizon)  
**Riksmöte**: 2025/26  
**Data Source**: riksdag-regering MCP (live)

## Document Inventory

| dok_id | Title | Type | Committee | Retrieval | Full-text |
|--------|-------|------|-----------|-----------|-----------|
| HD01CU40 | Krav på kommunala lantmäterimyndigheters ärendehanteringssystem | bet | CU | 2026-04-28T02:26Z | true |
| HD024099 | mot. med anledning av prop. 2025/26:217 Utökat straffrättsligt tjänstemannaansvar | mot | JuU | 2026-04-28T02:26Z | true |
| HD10449 | Södra stambanan och dubbelspår Alvesta-Växjö | ip | TU | 2026-04-28T02:26Z | true |
| HD10450 | Undantaget i sjukförsäkringen efter dag 180 | ip | SfU | 2026-04-28T02:26Z | true |
| HD10451 | Ytterligare åtgärder mot bolag som används som brottsverktyg | ip | JuU | 2026-04-28T02:26Z | true |
| HD11750 | Elnätsstolpar i trä | mot | NU | 2026-04-28T02:26Z | metadata-only |
| HD11751 | Giftiga ämnen i nappar | mot | SoU | 2026-04-28T02:26Z | metadata-only |
| HD11752 | Återkallande av överflygningstillstånd | mot | UU | 2026-04-28T02:26Z | metadata-only |
| HD11753 | Åtgärder för att ryska soldater inte ska få visum till EU | mot | UU | 2026-04-28T02:26Z | metadata-only |
| HD11754 | Bevarandet av ubåten Som | mot | FöU | 2026-04-28T02:26Z | metadata-only |
| HD11755 | Brister gällande hemvärnets finkalibriga vapen | mot | FöU | 2026-04-28T02:26Z | metadata-only |
| HD11756 | Äldre vattenrättigheter och moderna miljövillkor | mot | MJU | 2026-04-28T02:26Z | metadata-only |

## MCP Server Availability

- riksdag-regering: **LIVE** (get_sync_status confirmed 2026-04-28T02:25:42Z)
- Lookback triggered: 1 business day (2026-04-28 is Tuesday; documents dated 2026-04-27)
- Full-text enrichment: top-5 documents per type enriched via get_dokument_innehall

## Full-Text Fetch Outcomes

| dok_id | full_text_available |
|--------|---------------------|
| HD01CU40 | true |
| HD024099 | true |
| HD10449 | true |
| HD10450 | true |
| HD10451 | true |

## Cross-Source Enrichment

**IMF (WEO Apr-2026)**: Swedish macroeconomic indicators pre-loaded for economic context.  
**Statskontoret**: Implementation feasibility evidence fetched for HD01CU40 (lantmäteri agency), HD10451 (corporate crime tools).  
**Prior month-ahead analyses (April 2026)**: analysis/daily/2026-04-27/month-ahead/ read for PIR continuity.

## Reference Analyses (Tier-C Ingestion)

Sibling folders read for cross-type synthesis:
- analysis/daily/2026-04-27/propositions/ — HD01CU40 overlap
- analysis/daily/2026-04-27/motions/ — HD10449, HD10450, HD10451
- analysis/daily/2026-04-27/interpellations/ — IP cluster
- analysis/daily/2026-04-27/committeeReports/ — CU committee pipeline
- analysis/daily/2026-04-27/evening-analysis/ — day-level synthesis
- analysis/daily/2026-04-27/month-ahead/ — prior cycle baseline
