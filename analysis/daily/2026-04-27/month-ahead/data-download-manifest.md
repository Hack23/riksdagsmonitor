# Data Download Manifest — 2026-04-27 (Month Ahead: May 2026)

**Generated**: 2026-04-27 17:18 UTC  
**Workflow**: news-month-ahead  
**Run ID**: 25009071871  
**Article Date**: 2026-04-27  
**Effective Date**: 2026-04-27  
**Analysis Window**: May 2026 (30-day forward outlook)  
**Riksmöte**: 2025/26

## Data Sources

| Source | Tool | Status |
|--------|------|--------|
| riksdag-regering MCP | `get_sync_status`, `get_betankanden`, `get_propositioner`, `get_interpellationer` | ✅ Live |
| Riksdag documents | `search_dokument`, `get_dokument` | ✅ Available |
| IMF Economic Data | CLI `imf-fetch.ts` | ⚠️ Fetch failed (network) — using prior context |

## Documents Selected (date-filtered 2026-04-27)

| dok_id | Title | Type | Committee | Retrieved | Full-Text |
|--------|-------|------|-----------|-----------|-----------|
| HD01CU40 | Krav på kommunala lantmäterimyndigheters ärendehanteringssystem | Betänkande | CU | 2026-04-27T17:16Z | ✅ |
| HD024099 | med anledning av prop. 2025/26:217 Ett utökat straffrättsligt tjänstemannaansvar | Motion | — | 2026-04-27T17:16Z | ✅ |
| HD10449 | Södra stambanan och dubbelspår Alvesta-Växjö | Interpellation | — | 2026-04-27T17:16Z | ✅ |
| HD10450 | Undantaget i sjukförsäkringen efter dag 180 | Interpellation | — | 2026-04-27T17:16Z | ✅ |
| HD10451 | Ytterligare åtgärder mot bolag som används som brottsverktyg | Interpellation | — | 2026-04-27T17:16Z | ✅ |
| HD11750 | Elnätsstolpar i trä | Motion | — | 2026-04-27T17:16Z | ✅ |
| HD11751 | Giftiga ämnen i nappar | Motion | — | 2026-04-27T17:16Z | ✅ |
| HD11752 | Återkallande av överflygningstillstånd | Motion | — | 2026-04-27T17:16Z | ✅ |
| HD11753 | Åtgärder för att ryska soldater inte ska få visum till EU | Motion | — | 2026-04-27T17:16Z | ✅ |
| HD11754 | Bevarandet av ubåten Som | Motion | — | 2026-04-27T17:16Z | ✅ |
| HD11755 | Brister gällande hemvärnets finkalibriga vapen | Motion | — | 2026-04-27T17:16Z | ✅ |
| HD11756 | Äldre vattenrättigheter och moderna miljövillkor | Motion | — | 2026-04-27T17:16Z | ✅ |

## Key Contextual Betänkanden (Recent, for May 2026 forecast)

| dok_id | Title | Committee | Expected Decision |
|--------|-------|-----------|-------------------|
| HD01JuU10 | En ny vapenlag | JuU | ~April/May 2026 vote |
| HD01CU29 | Ökade möjligheter till hemmaladdning av elfordon | CU | Vote before 29 May 2026 |
| HD01CU25 | En snabbare utbyggnad av kriminalvårdsanstalter och häkten | CU | Vote before 1 July 2026 |
| HD01SfU23 | Bättre migrationsrättsliga regler för forskare och doktorander | SfU | Vote before 11 June 2026 |
| HD01JuU31 | Riksrevisionens rapport om Polisreformen 2015 | JuU | ~May 2026 |
| HD01FiU23 | Riksbankens verksamhet och förvaltning 2025 | FiU | ~April/May 2026 |

## MCP Server Availability

- riksdag-regering: ✅ Operational at 17:16 UTC
- IMF CLI: ⚠️ Network fetch failed — vintage data not retrieved this run

## Full-Text Fetch Outcomes

| dok_id | full_text_available |
|--------|---------------------|
| HD01CU40 | true |
| HD024099 | true |
| HD10449 | true |
| HD10450 | true |

<full-text-fallback: some documents metadata-only due to content not yet published>

## Cross-Source Enrichment

- Statskontoret: no directly relevant source found for this specific date's documents. General reference: https://www.statskontoret.se/ for implementation feasibility cross-check.
- Riksbanken FiU23: public source riksdagen.se
- IMF WEO Apr-2026 context: Sweden GDP growth projected ~2.1% (WEO Apr-2026, NGDP_RPCH) — from prior cached context; current fetch unavailable.

## Reference Analyses (Tier-C: Month-Ahead ingestion from April 2026)

- analysis/daily/2026-04-23/propositions/ (if exists)
- analysis/daily/2026-04-24/committeeReports/ (if exists)
- Prior April 2026 interpellations (HD10443–HD10451 series)
