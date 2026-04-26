# Data Download Manifest — Weekly Review 2026-04-26

## Workflow Metadata

- **Workflow**: news-weekly-review
- **Run ID**: 24961123457
- **UTC Timestamp**: 2026-04-26T16:15:00Z
- **Article Date (requested)**: 2026-04-26
- **Article Date (effective)**: 2025-09-08 (lookback applied — see note below)
- **Lookback Note**: No documents were found in the Riksdag API for the week 2026-04-19 to 2026-04-26 (API returns zero results for dates after 2025-09-08 in riksmöte 2024/25). Lookback of approximately 231 days was applied; analysis uses the most recent available documents from riksmöte 2024/25 (through September 2025). This is a structural API limitation — riksmöte 2025/26 data is not yet indexed. Weekly review covers the final substantive legislative period of riksmöte 2024/25.
- **MCP Server**: riksdag-regering at riksdag-regering-ai.onrender.com — **LIVE** (3-attempt pre-warm: success on attempt 1)
- **IMF CLI**: Pre-warmed (SWE NGDP_RPCH), status: available

## Document Inventory

| dok_id | Title | Type | Committee | Datum | Full Text | Status |
|--------|-------|------|-----------|-------|-----------|--------|
| HC03208 | Ett mer heltäckande straffansvar vid angrepp på företagshemligheter | prop | Justitiedepartementet | 2025-09-08 | summary | retrieved |
| HC03206 | Riksrevisionens rapport om den statliga styrningen av det civila försvarets uppbyggnad | skrivelse | Försvarsdepartementet | 2025-09-08 | summary | retrieved |
| HC03205 | Myndigheten för civilt försvar – ett nytt namn för MSB | prop | Försvarsdepartementet | 2025-09-08 | summary | retrieved |
| HC03204 | Regler om avstängning av statligt anställda | prop | Finansdepartementet | 2025-09-08 | summary | retrieved |
| HC03203 | Förbudet mot utvinning av uran tas bort | prop | Klimat- och näringslivsdepartementet | 2025-09-02 | summary | retrieved |
| HC03202 | Utökade möjligheter att verkställa fängelsestraff med elektronisk övervakning | prop | Justitiedepartementet | 2025-08-26 | summary | retrieved |
| HC03201 | Utvidgade möjligheter att meddela näringsförbud på grund av brott | prop | Klimat- och näringslivsdepartementet | 2025-08-26 | summary | retrieved |
| HC01FiU33 | Extra ändringsbudget för 2025 – Kapitaltillskott till APL | bet | FiU | 2025-06-12 | summary | retrieved |
| HC01FiU24 | Uppföljning och utvärdering av Riksbankens penningpolitik 2024 | bet | FiU | 2025-06-12 | summary | retrieved |
| HC01FiU20 | Riktlinjer för den ekonomiska politiken och budgetpolitiken | bet | FiU | 2025-06-12 | summary | retrieved |
| HC01SoU29 | Ett fritidskort för barn och unga | bet | SoU | 2025-06-11 | summary | retrieved |
| HC01CU18 | Ett nytt konkursförfarande | bet | CU | 2025-06-11 | summary | retrieved |
| HC01TU15 | Sjöfartsfrågor (Riksrevisionens rapport) | bet | TU | 2025-06-11 | summary | retrieved |
| HC10752 | Interpellation: Kommuners civilt försvar och beredskap | ip | Statsrådet Bohlin (M) | 2025-09-05 | summary | retrieved |
| HC10746 | Interpellation: En halv miljon arbetslösa | ip | Arbetsmarknadsminister Britz (L) | 2025-08-25 | summary | retrieved |
| HC10744 | Interpellation: Ungdomsarbetslösheten | ip | Arbetsmarknadsminister Britz (L) | 2025-08-25 | summary | retrieved |
| HC10745 | Interpellation: Arbetslösheten bland funktionsnedsatta | ip | Arbetsmarknadsminister Britz (L) | 2025-08-25 | summary | retrieved |
| HC10743 | Interpellation: Momsbedrägerier | ip | Finansminister Svantesson (M) | 2025-08-25 | summary | retrieved |

## Document Depth Tags

- HC03205, HC03206: **L3 Intelligence-grade** (civil defence national security)
- HC03203 (uranium): **L2+ Priority** (energy policy, political divisiveness)
- HC01FiU20, HC01FiU24: **L2+ Priority** (economic policy framework)
- HC01FiU33: **L2 Strategic** (healthcare supply chain)
- HC03208, HC03202, HC03201: **L2 Strategic** (criminal justice)
- HC10744–HC10746: **L2 Strategic** (labour market)
- HC01SoU29, HC01CU18, HC01TU15, HC10743: **L1 Surface**

## MCP Server Availability Notes

- riksdag-regering: LIVE — no retries needed
- IMF CLI: available, pre-warmed
- Riksdag API gap: post-September 2025 documents unavailable; lookback applied

## Cross-Source Enrichment

- **Statskontoret**: Relevant for civil defence agency capacity (HC03205, HC03206). No dedicated Statskontoret report on MSB → MfcF transition found at www.statskontoret.se at retrieval time. Statskontoret's published evaluation of civil-protection governance (2022:4 "Tillit och kontroll") provides historical baseline.
- **SCB labour statistics**: Unemployment rate Q1/Q2 2025 ~8.5% (SCB AKU baseline); interpellations HC10744–HC10746 reference these SCB figures directly.
- **IMF WEO**: SWE GDP growth 2025 projection ~1.2% (WEO Apr-2025/Oct-2025 vintage); Swedish fiscal space remains adequate per FM dataset.

## Reference Analyses (Tier-C Sibling Ingestion)

No prior sibling analyses exist in `analysis/daily/` for the lookback window (first run). PIR carry-forward from system baseline applied (see intelligence-assessment.md §Prior-cycle PIRs).
