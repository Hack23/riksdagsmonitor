# Data Download Manifest — Month-Ahead 2026-04-26

**Workflow**: news-month-ahead  
**Run ID**: 24956034744  
**Generated**: 2026-04-26T12:01:00Z  
**Article Date**: 2026-04-26  
**Effective Date**: 2026-04-24 (lookback: 2 days)  
**ARTICLE_TYPE**: month-ahead  
**Subfolder**: month-ahead  

## MCP Server Status

- **riksdag-regering**: ✅ Live (2026-04-26T12:00:13Z) — sources: riksdagen + g0v.se
- **scb**: ✅ Available
- **world-bank**: ✅ Available
- **IMF CLI**: Available via bash (tsx scripts/imf-fetch.ts)

## Documents Downloaded

| dok_id | Title | Type | Committee | Date | Full-text |
|--------|-------|------|-----------|------|-----------|
| HD01CU24 | Effektiv och säker byggprocess | betänkande | CU | 2026-04-24 | Yes |
| HD01JuU10 | En ny vapenlag | betänkande | JuU | 2026-04-24 | Yes |
| HD01JuU31 | Riksrevisionens rapport om Polisreformen 2015 | betänkande | JuU | 2026-04-24 | Yes |
| HD01SoU25 | Stärkta insatser för äldre och närstående | betänkande | SoU | 2026-04-24 | Yes |
| HD10448 | Desinformation om vindkraft | interpellation | — | 2026-04-24 | Yes |
| HD11747 | Riksdagsdebatt anförande | anförande | — | 2026-04-24 | Yes |
| HD11748 | Riksdagsdebatt anförande | anförande | — | 2026-04-24 | Yes |
| HD11749 | Riksdagsdebatt anförande | anförande | — | 2026-04-24 | Yes |

## Additional Context (API enrichment, not in downloaded set)

| dok_id | Title | Type | Date |
|--------|-------|------|------|
| HD03256 | Kraftfullare åtgärder mot manipulation av färdskrivare | proposition | 2026-04-23 |
| HD03252 | Begränsning socialförsäkringsförmåner fängelsestraff | proposition | 2026-04-23 |
| HD03253 | EU:s bankpaket | proposition | 2026-04-23 |
| HD03104 | Utvärdering statens upplåning och skuldförvaltning 2021–2025 | skrivelse | 2026-04-23 |
| HD03246 | Skärpta regler för unga lagöverträdare | proposition | 2026-04-16 |
| HD03237 | En betald polisutbildning | proposition | 2026-04-14 |
| HD03240 | Nya lagar om elsystemet | proposition | 2026-04-14 |
| HD024098 | motion: Extra ändringsbudget – Sänkt skatt på drivmedel (MP) | motion | 2026-04-17 |
| HD024096 | motion: Modernt regelverk krigsmateriel (MP) | motion | 2026-04-16 |
| HD024091 | motion: Modernt regelverk krigsmateriel (V) | motion | 2026-04-16 |
| HD01SfU23 | Bättre migrationsregler för forskare/doktorander | betänkande | 2026-04-23 |
| HD01FiU23 | Riksbankens verksamhet och förvaltning 2025 | betänkande | 2026-04-23 |
| HD10447 | Interpellation: Borttagandet sjuklönekostnadsersättning (S) | interpellation | 2026-04-23 |
| HD10446 | Interpellation: Felaktiga dödförklaringar (S) | interpellation | 2026-04-22 |
| HD10444 | Interpellation: Sänkning arbetsgivaravgifter (S) | interpellation | 2026-04-22 |

## Lookback Fallback Note

Zero documents matched 2026-04-26 exactly (Sunday/non-sitting day). Applied 2-day lookback to 2026-04-24. Documents from late April 2026 (April 14–24) used as primary dataset. Riksdag in session 2025/26 with 276 propositions filed this riksmöte.

## Cross-Source Enrichment

- **Statskontoret**: Relevant to HD01JuU31 (Polisreformen evaluation) — www.statskontoret.se has published reports on police reform implementation. No directly matching Statskontoret report fetched in this run.
- **IMF economic context**: Swedish macro indicators from WEO/IFS not fetched in this run (standard depth); World Bank governance indicators available via MCP.

## Reference Analyses (Tier-C Ingestion)

Sibling folders checked:
- analysis/daily/2026-04-26/propositions/ — not present
- analysis/daily/2026-04-26/motions/ — not present
- analysis/daily/2026-04-26/committeeReports/ — not present
- analysis/daily/2026-04-26/monthly-review/ — present (checked for PIR continuity)
