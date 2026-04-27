# Data Download Manifest — Monthly Review 2026-04-27

**Workflow**: news-monthly-review | **Run ID**: 25006920446 | **UTC**: 2026-04-27T16:30:00Z
**Requested date**: 2026-04-27 | **Effective date**: 2026-04-27 | **Window**: 2026-03-28 → 2026-04-27 (30 days)
**Riksmöte**: 2025/26 | **Analysis depth**: deep | **Type**: Tier-C aggregation

## Document Counts by Type

- **propositions**: 4 (HD03252, HD03253, HD03104, HD03256)
- **committee reports (betänkanden)**: 6 (HD01FiU48, HD01JuU10, HD01SoU25, HD01CU24, HD01FiU23, HD01JuU31)
- **interpellations**: 4 (HD10447, HD10448, HD10449, HD10450)
- **motions**: 29 (opposition spring motions, April 2026)
- **sibling analyses ingested**: committeeReports, propositions, motions, interpellations (2026-04-27)

## Per-Document Table

| dok_id | Title | Type | Committee | Retrieved | Full-Text |
|--------|-------|------|-----------|-----------|-----------|
| HD03253 | EU:s bankpaket (CRR3/CRD6) | prop | FiU | 2026-04-27 | full |
| HD03252 | Social insurance for detained persons | prop | SfU | 2026-04-27 | full |
| HD03104 | Statens upplåning 2021–2025 | skr | FiU | 2026-04-27 | full |
| HD03256 | Tachograph manipulation penalties | prop | TU | 2026-04-27 | full |
| HD01FiU48 | Extra ändringsbudget — bränsle/energi | bet | FiU | 2026-04-27 | full |
| HD01JuU10 | New Weapons Law (vapenlag) | bet | JuU | 2026-04-27 | full |
| HD01SoU25 | Stärkta insatser för äldre | bet | SoU | 2026-04-27 | full |
| HD01CU24 | Effektiv och säker byggprocess | bet | CU | 2026-04-27 | full |
| HD01FiU23 | Riksbankens verksamhet 2025 | bet | FiU | 2026-04-27 | full |
| HD01JuU31 | Riksrevisionens rapport om Polisreformen | bet | JuU | 2026-04-27 | full |
| HD10447 | SME sick-pay burden / business competitiveness | ip | AU/NU | 2026-04-27 | full |
| HD10448 | Wind energy disinformation (SD-KD fault line) | ip | NU | 2026-04-27 | full |
| HD10449 | Södra stambanan removal (Trafikverket plan) | ip | TU | 2026-04-27 | full |
| HD10450 | Sjukförsäkring dag-180 exception | ip | SfU | 2026-04-27 | full |

## ## Full-Text Fetch Outcomes

| dok_id | full_text_available |
|--------|---------------------|
| HD03253 | true |
| HD03252 | true |
| HD01FiU48 | true |
| HD01JuU10 | true |

## MCP Server Availability

- **riksdag-regering**: LIVE (status confirmed 2026-04-27T16:28:43Z)
- **scb**: Not queried this run (population statistics from sibling analysis cache)
- **world-bank**: Not queried this run (WGI governance from prior cache)
- **IMF CLI**: Pre-warm successful; economic data from 2026-04-27 propositions analysis (NGDP_RPCH, GGXWDG_NGDP, BCA_NGDPD)

## Reference Analyses (Ingested)

| Folder | Synthesis ingested | Intelligence-assessment ingested |
|--------|-------------------|----------------------------------|
| analysis/daily/2026-04-27/propositions | ✅ | ✅ |
| analysis/daily/2026-04-27/committeeReports | ✅ | ✅ |
| analysis/daily/2026-04-27/motions | ✅ | ✅ |
| analysis/daily/2026-04-27/interpellations | ✅ | ✅ |
| analysis/daily/2026-04-26/monthly-review | ✅ | ✅ |
| analysis/daily/2026-04-25/monthly-review | ✅ (continuity) | — |

## Cross-Source Enrichment

- **Statskontoret**: no directly relevant source found for specific documents this window; Statskontoret 2026 report on police implementation referenced via prior sibling analysis (HD01JuU31 context)
- **IMF WEO Apr-2026**: NGDP_RPCH (+2.1%), GGXWDG_NGDP (~31% GDP), BCA_NGDPD (+5.5% GDP) — from propositions sibling analysis, vintage April 2026
- **SCB population**: Sweden 65+ at 20.9% — from committee reports sibling analysis

## Data Quality Notes

All documents sourced from official riksdag-regering API (riksdagen.se). This Tier-C aggregation synthesizes 30-day window via sibling analysis ingestion. Lookback not required — rich April 2026 data available.
