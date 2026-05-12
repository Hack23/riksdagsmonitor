---
title: "Data Download Manifest — Realtime Pulse 2026-05-12"
date: "2026-05-12"
subfolder: "realtime-pulse"
workflow: "news-realtime-monitor"
run_id: "25724879699"
---

# Data Download Manifest — Realtime Pulse 2026-05-12

**Workflow**: news-realtime-monitor  
**Run ID**: 25724879699  
**UTC Timestamp**: 2026-05-12T09:20:00Z  
**Article Date**: 2026-05-12  
**Effective Date**: 2026-05-12 (no lookback required)  
**Author**: James Pether Sörling  

## MCP Server Status

| Server | Status | Notes |
|--------|--------|-------|
| riksdag-regering | ✅ LIVE | get_sync_status → {status: "live"} |
| IMF Context | ✅ OK | WEO-2026-04, vintageAgeMonths: 1 |
| SCB | Available | Not queried this session |

## Documents Retrieved

| dok_id | Titel | Typ | Organ | Datum | Fulltextsstatus | Parti |
|--------|-------|-----|-------|-------|-----------------|-------|
| HD10484 | Åtgärder mot missförhållanden i vinstdriven äldreomsorg | ip | V | 2026-05-12 | ✅ Full text | V |
| HD10483 | Samtyckeslagens tillämpning och rättsäkerhet | ip | - | 2026-05-12 | ✅ Full text | - (independent) |
| HD10485 | Beskattning av ersättning från prostitution | ip | S | 2026-05-12 | ✅ Full text | S |
| HD10486 | Satsning på jämställda löner inom välfärden | ip | V | 2026-05-12 | ✅ Full text | V |
| HD01CU30 | Nytt mål för effektiv energianvändning + EPBD | bet | CU | 2026-05-12 | Metadata | — |

## Sibling Analyses Cross-Referenced (Tier-C)

| Folder | Key Documents | Status |
|--------|---------------|--------|
| analysis/daily/2026-05-12/propositions/ | HD03267, HD03261, HD03250 | ✅ Read |
| analysis/daily/2026-05-12/motions/ | HD024149, HD024150 | ✅ Read |
| analysis/daily/2026-05-12/committeeReports/ | HD01KU34, HD01FiU37, HD01CU31, HD01JuU39, HD01SoU31 | ✅ Read |
| analysis/daily/2026-05-12/interpellations/ | HD10482, HD10481 | ✅ Read |

## ## Full-Text Fetch Outcomes

| dok_id | Result | Notes |
|--------|--------|-------|
| HD10484 | ✅ SUCCESS | Full text retrieved, 4 ministerial questions |
| HD10483 | ✅ SUCCESS | Full text retrieved, 3 ministerial questions |
| HD10485 | ✅ SUCCESS | Full text retrieved, SOU 2025:119 reference |
| HD10486 | ✅ SUCCESS | Full text retrieved, 30bn SEK policy proposal |
| HD01CU30 | ⚠️ METADATA-ONLY | Text null in API response; content via betänkande metadata |

## ## Prior-Voteringar Enrichment

Prior voteringar context sourced from sibling committee-reports analysis (HD01KU34 etc.). For today's interpellations, no direct vote records exist yet (interpellations at "skickad" stage, not yet debated in chamber). Widened search to last 6 riksmöten for eldercare (HD10484) and gender pay (HD10486) themes — no directly comparable vote found for the specific questions raised.

Prior voteringar: no directly comparable vote found for HD10484 (äldreomsorg interpellation) in last 4 riksmöten; new riksmöte — voteringar for interpellation responses not indexed.

## ## Statskontoret Cross-Source Enrichment

Trigger evaluation:
- **HD10484** (Äldreomsorgen): ✅ TRIGGER FIRED — names Socialstyrelsen and references 50,000 recruitment gap and welfare inspection capacity.
- **HD10486** (Löner välfärden): ✅ TRIGGER FIRED — state wage intervention, kompetensförsörjning in kommunal sektor.
- **HD01CU30** (EPBD): ✅ TRIGGER FIRED — energy agency mandate, regulatory burden.
- **HD10483**, **HD10485**: No trigger (judicial/fiscal, not agency-capacity).

Statskontoret pre-warm: triggers fired for HD10484, HD10486, HD01CU30. No Statskontoret web_fetch performed — direct agency-capacity data available from Socialstyrelsen references in HD10484 text (50,000 recruitment gap explicitly cited). Recording as `Statskontoret: pre-warm evaluated; Socialstyrelsen primary source cited in interpellation text covers agency-capacity dimension for HD10484; no separate Statskontoret report search performed within time budget`.

## ## Lagrådet Tracking

No government propositions in today's direct document set requiring Lagrådet review. Lagrådet context for today's session inherited from sibling propositions analysis (HD03267 referred to Lagrådet; HD03261 constitutional dimension noted). Lagrådet tracking: no new referrals triggered by today's interpellations (interpellations do not require Lagrådet review by statute).

## ## PIR Carry-Forward

Prior PIRs from 2026-05-11 realtime-pulse:

| PIR-ID | Statement | Status |
|--------|-----------|--------|
| PIR-CONST-ABORT | Will Riksdagen pass KU34 first reading before election? SD position? | OPEN — no new SD declaration found 12 May |
| PIR-CLIM-2026 | Climate proposition before summer recess? | OPEN — no new evidence of tabling |
| PIR-MIG-RETURN | Will prop. 2025/26:263 pass without significant amendment? | OPEN |
| PIR-COAL-STAB | Will Tidö coalition maintain majority through September 2026? | OPEN |

New PIRs opened this cycle:
- **PIR-ELDER-2026**: Will the government bring forward äldreomsorgs legislation before the election addressing quality and supervision (HD10484 trigger)?
- **PIR-GENDERPAY-2026**: Will the Tidö coalition respond substantively to the gender pay gap in welfare sector before election (HD10486 trigger)?
