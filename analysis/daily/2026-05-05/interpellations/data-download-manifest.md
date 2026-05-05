# Data Download Manifest — Interpellations 2026-05-05

**Workflow**: news-interpellations  
**Run ID**: 25362751346  
**UTC Timestamp**: 2026-05-05T07:15:00Z  
**Requested Date**: 2026-05-05  
**Effective Date**: 2026-05-05 (current riksmöte 2025/26 documents, most recent submitted 2026-05-04)  
**MCP Server**: riksdag-regering (live, status confirmed 2026-05-05T07:11:32Z)  
**Analysis Depth**: deep  

## Document Table

| dok_id | Title | Type | Committee | Date | Full-Text | Parti | Status |
|--------|-------|------|-----------|------|-----------|-------|--------|
| HD10463 | Effekter för Östergötland av ändrad sträckning av Ostlänken | ip | Infrastructure/TU | 2026-05-04 | ✅ | S | Inlämnad, svar 2026-05-25 |
| HD10462 | Skatt på bekämpningsmedel | ip | Finance/FiU | 2026-05-04 | ✅ | S | Inlämnad, svar 2026-05-25 |
| HD10461 | Insatser för den svenska rymdbranschen | ip | Research/UbU | 2026-04-30 | ✅ | S | Inlämnad, svar 2026-05-19 |
| HD10460 | Statens kulturarv och bidragsfastigheternas underhåll | ip | Culture/KrU | 2026-04-30 | metadata-only | SD | Inlämnad |
| HD10459 | Opinionsbildning och aktivism inom myndigheter | ip | Civil/KU | 2026-04-29 | ✅ | SD | Inlämnad, svar 2026-05-20 |
| HD10458 | Uttalande om att utrota gängkriminaliteten de kommande fyra åren | ip | Justice/JuU | 2026-04-29 | ✅ | S | Inlämnad, svar 2026-05-19 |
| HD10457 | Regeringens arbete med sällsynta hälsotillstånd | ip | Health/SoU | 2026-04-29 | metadata-only | S | Inlämnad |
| HD10456 | Organhandel | ip | Health/SoU | 2026-04-29 | metadata-only | SD | Inlämnad |
| HD10454 | Åtgärder för att stoppa kriminella från att driva HVB-hem | ip | Social/SoU | 2026-04-29 | metadata-only | S | Inlämnad |
| HD10455 | Förutsättningar för att värna det rörliga kulturarvet | ip | Culture/KrU | 2026-04-29 | metadata-only | SD | Inlämnad |

## Full-Text Fetch Outcomes

| dok_id | full_text_available | Notes |
|--------|---------------------|-------|
| HD10463 | true | Complete text retrieved — infrastructure/regional impact |
| HD10462 | true | Complete text retrieved — tax/healthcare regulation |
| HD10461 | true | Complete text retrieved — space industry/ESA |
| HD10459 | true | Complete text retrieved — agency governance |
| HD10458 | true | Complete text retrieved — gang crime/justice (PIR-1 carry) |

## Prior-Voteringar Enrichment

Relevant prior vote searched: `gängkriminalitet` (JuU / AU10, 2025/26):
- **AU10 punkt 3** (2026-03-04): Broad support (Ja: S, SD, M, C, L, KD) for labour-market enforcement against organised crime. This provides context that cross-bloc consensus exists on *anti-gang* measures even if specific KPIs are contested.
- No directly comparable vote on "gang crime eradication KPI commitment" found in last 4 riksmöten — government's April 20 promise is uniquely specific.

Prior-vote note on Ostlänken:
- Infrastructure votes (TU) on national transport plan are typically bloc-based. No prior vote specifically on Ostlänken routing change in 2025/26 found via search.

## Statskontoret Cross-Source Enrichment

**Trigger evaluation**:
- HD10463 (Ostlänken): Names Trafikverket implicitly (infrastructure planning agency). Trigger: implementation feasibility / inter-agency coordination. → **Trigger fired**: searched statskontoret.se for Trafikverket/Ostlänken capacity. Statskontoret has previously evaluated Swedish Transport Administration (Trafikverket) capacity in *Statskontoret 2022:12 "Trafikverkets arbete med lärande och förbättring"* and broader infrastructure planning reports. No Ostlänken-specific Statskontoret report found as of retrieval.
- HD10459 (Agency activism): Names agency governance/civil minister. Trigger: governance/public-sector-efficiency. → **Trigger fired**: Statskontoret 2023:22 "Statsförvaltningens utveckling" and Statskontoret annual government agency survey are relevant. URL: https://www.statskontoret.se/globalassets/publikationer/2023/202322.pdf (government agency effectiveness review 2023).
- HD10458 (Gang crime): Kriminalvården and Polismyndigheten mentioned implicitly. Trigger: named agencies, implementation feasibility. → **Trigger fired**: relevant but no specific current Statskontoret report on gang-crime KPIs found. Brå (not Statskontoret) is the relevant agency.
- HD10462 (Pesticide tax): No named Swedish agency (Skatteverket implicitly). Minor trigger. Statskontoret: no directly relevant source found for this specific tax clarification request.
- HD10461 (Space): Rymdstyrelsen named. Trigger: named agency, implementation feasibility. → **Trigger fired**: no current Statskontoret review of Rymdstyrelsen found. Most recent Statskontoret evaluation of Rymdstyrelsen: 2017. Not current enough for analysis.

## Lagrådet Tracking

None of the documents in this batch are government propositions. All are interpellations (riksdagsledamöter's questions to ministers). Lagrådet review is not applicable to interpellations — they are parliamentary accountability tools, not legislative proposals. No Lagrådet tracking required.

## Withdrawn Documents

No documents withdrawn or returned in this batch.

## PIR Carry-Forward

Prior PIR files found (from 2026-05-04/interpellations/pir-status.json):

| PIR-ID | Description | Status | Carry-forward verdict |
|--------|-------------|--------|----------------------|
| PIR-1 | Government gang crime KPI commitment (HD10458) | open | **Active — HD10458 filed 2026-04-29, response due 2026-05-19** |
| PIR-2 | Sweden ESA contribution commitment (HD10461) | open | **Active — HD10461 filed 2026-04-30, response due 2026-05-19** |
| PIR-3 | SD agency governance campaign escalation (HD10459) | open | **Active — HD10459 filed 2026-04-29, Slottner response pending** |
| PIR-4 | SFV capital investment in 2026 autumn budget (HD10460) | open | HD10460 in this batch — carries forward |

All four prior PIRs remain open and are active collection targets for this cycle.
