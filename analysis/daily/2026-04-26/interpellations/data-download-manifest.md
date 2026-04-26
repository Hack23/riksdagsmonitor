# Data Download Manifest — Riksdag Interpellations, 2026-04-26

**Author**: James Pether Sörling  
**Classification**: PUBLIC  
**Generated**: 2026-04-26T19:31:00Z

---

## MCP Sources Used

| Source | Tool | Parameters | Status | Records |
|--------|------|------------|--------|---------|
| riksdag-regering | get_interpellationer | rm=2025/26, limit=20 | ✅ Success | 20 docs (of 448) |
| riksdag-regering | get_interpellationer | rm=2024/25, limit=30 | ✅ Success | 30 docs (of 752) |
| riksdag-regering | get_sync_status | — | ✅ Live | Server healthy |
| riksdag-regering | get_dokument_innehall | dok_id=HD10448 | ✅ Success | Metadata |
| riksdag-regering | get_dokument_innehall | dok_id=HD10444 | ✅ Success | Metadata |

## Documents Analysed

| dok_id | Title | Party | Minister | Date |
|--------|-------|-------|----------|------|
| HD10448 | Desinformation om vindkraft | SD | Busch (KD) | 2026-04-24 |
| HD10447 | Borttagandet av ersättning för höga sjuklönekostnader | S | Busch (KD) | 2026-04-23 |
| HD10446 | Felaktiga dödförklaringar | S | Svantesson (M) | 2026-04-22 |
| HD10445 | Kommunal förköpsrätt av nyckelfastigheter | S | Carlson (KD) | 2026-04-22 |
| HD10444 | Företag som utnyttjar sänkningen av arbetsgivaravgifter | S | Svantesson (M) | 2026-04-22 |
| HD10443 | Social dumpning mellan kommuner | S | Slottner (KD) | 2026-04-22 |
| HD10442 | Uttalanden om ätstörningsvården i Region Stockholm | S | Svantesson (M) | 2026-04-21 |
| HD10441 | Rättssäkerheten inom rättsväsendet | - | Strömmer (M) | 2026-04-21 |
| HD10440 | Utbildningen för företagsläkare | S | Britz (L) | 2026-04-21 |
| HD10439 | Brist på poliser i Stockholm | S | Strömmer (M) | 2026-04-20 |
| HD10438 | Nedläggning av kvinnojourer | S | Larsson (L) | 2026-04-17 |
| HD10437 | Lönetransparensdirektivet | S | Larsson (L) | 2026-04-17 |
| HD10436 | Åtgärder för att stärka den svenska rymdbranschen | S | Edholm (L) | 2026-04-16 |
| HD10435 | Mordet på den svenske diplomaten Folke Bernadotte | - | Stenergard (M) | 2026-04-16 |
| HD10434 | Bostadsbyggandet i Stockholmsregionen | S | Carlson (KD) | 2026-04-15 |
| HD10433 | En bred skatteöversyn | S | Svantesson (M) | 2026-04-15 |
| HD10432 | Statligt säkerställande av investeringar i vårdbyggnader | S | Lann (KD) | 2026-04-15 |
| HD10431 | Internationellt arbete för hbtqi-personers mänskliga rättigheter | C | Dousa (M) | 2026-04-14 |
| HD10430 | Moskéer som sprider hat och hot | SD | Forssmed (KD) | 2026-04-07 |
| HD10429 | Skyddet för yttrandefriheten | SD | Strömmer (M) | 2026-04-07 |

## Data Quality Notes

- Ministerial responses not yet published for documents filed 20–24 April 2026 (5 documents)
- Full-text content available for all documents but not fetched to avoid rate limits; analysis based on summaries and titles
- Total interpellations in 2025/26 session: 448 (as of API response)
- MCP health: Server live (status: live, generated_at: 2026-04-26T19:30:53Z)

## External Sources Referenced

| Source | URL | Used For | Retrieved |
|--------|-----|----------|-----------|
| BRÅ March 2026 police evaluation | https://bra.se | Police headcount assessment (HD10439) | Via interpellation summary |
| WindEurope report 21 Apr 2026 | https://windeurope.org | Wind disinformation analysis (HD10448) | Via interpellation summary |
| Stockholms läns kommunprognos 2026 | Internal municipal data | Housing starts (HD10434) | Via interpellation summary |

## Gaps and Limitations

1. Ministerial responses unavailable for 5 most recent interpellations — confidence scores reduced accordingly
2. Full-text analysis limited to selected high-significance documents (HD10444, HD10448)
3. IMF economic data not fetched for this run — labour market and fiscal claims rely on interpellation-cited figures; recommend IMF WEO cross-validation for production
4. SCB data not independently verified — housing start figures taken from S interpellation citation of municipal forecast
