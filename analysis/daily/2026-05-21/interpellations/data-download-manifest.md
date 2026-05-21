# Data Download Manifest

**Workflow**: news-interpellations
**Run**: 26212496647 attempt 1
**Started (UTC)**: 2026-05-21T07:44:28Z
**Requested date**: 2026-05-21
**Effective date**: 2026-05-21
**Window**: 2025/26 riksmöte, latest 20 interpellations
**Subfolder**: interpellations
**Improvement mode**: false
**Status**: complete

## MCP Attempts

- Attempt 1: riksdag-regering `get_sync_status` → `{"status":"live"}` ✅
- IMF pre-warm: `weo --country SWE --indicator NGDP_RPCH --years 1` executed
- Full-text fetched for top 3: HD10499, HD10498, HD10497 ✅

## Per-Document Table

| dok_id | Title | Type | Committee | Date | Full-text | Party | Status |
|--------|-------|------|-----------|------|-----------|-------|--------|
| HD10499 | Vattenbrist och klimatanpassning i södra Sverige | ip | (Miljö/klimat) | 2026-05-21 | ✅ full | S | Inlämnad |
| HD10498 | Finska språkets framtid på Umeå universitet | ip | (Utbildning) | 2026-05-20 | ✅ full | S | Inlämnad |
| HD10497 | Långa betaltider och svenska företags konkurrenskraft | ip | (Näringsliv) | 2026-05-19 | ✅ full | SD | Inlämnad |
| HD10496 | Rätten att välja kön på personal | ip | (Sjukvård) | 2026-05-19 | metadata-only | S | Inlämnad |
| HD10495 | Regler för ideellt arbete på landsbygden | ip | (Landsbygd) | 2026-05-19 | metadata-only | S | Inlämnad |
| HD10494 | Erkännande av tjetjenska republiken Itjkerien som ockuperad stat | ip | (Utrikes) | 2026-05-15 | metadata-only | SD | Inlämnad |
| HD10493 | Konsekvenserna av nedlagda biståndsstrategier | ip | (Bistånd) | 2026-05-14 | metadata-only | V | Inlämnad |
| HD10492 | Konsekvenserna för barn när biståndet minskar | ip | (Bistånd) | 2026-05-14 | metadata-only | V | Inlämnad |
| HD10491 | Ökade utsläpp från bilar inom Stockholms stad | ip | (Klimat) | 2026-05-13 | metadata-only | MP | Inlämnad |
| HD10490 | Förhållandena i Kuba | ip | (Utrikes) | 2026-05-13 | metadata-only | SD | Inlämnad |
| HD10489 | Al-Nakba | ip | (Utrikes) | 2026-05-13 | metadata-only | [-] | Inlämnad |
| HD10488 | Ny lagstiftning för klimatanpassning | ip | (Klimat) | 2026-05-13 | metadata-only | MP | Inlämnad |
| HD10487 | Ett reformerat utjämningssystem för en jämlik välfärd | ip | (Finans/Kommuner) | 2026-05-13 | metadata-only | S | Inlämnad |
| HD10486 | Satsning på jämställda löner inom välfärden | ip | (Arbetsmarknad) | 2026-05-12 | metadata-only | V | Inlämnad |
| HD10485 | Beskattning av ersättning från prostitution | ip | (Finans) | 2026-05-12 | metadata-only | S | Inlämnad |
| HD10484 | Åtgärder mot missförhållanden i vinstdriven äldreomsorg | ip | (Socialtjänst) | 2026-05-12 | metadata-only | V | Inlämnad |
| HD10483 | Samtyckeslagens tillämpning och rättssäkerhet | ip | (Justitie) | 2026-05-12 | metadata-only | [-] | Inlämnad |
| HD10482 | Effektivare kontrollmöjligheter för att förhindra svartarbete | ip | (Finans) | 2026-05-11 | metadata-only | S | Inlämnad |
| HD10481 | Klimatmålen | ip | (Klimat) | 2026-05-11 | metadata-only | S | Inlämnad |
| HD10480 | Stadigvarande vistelse | ip | (Finans/Skatt) | 2026-05-08 | metadata-only | S | Inlämnad |

Total: 20 interpellations. Full-text available for top 3 (HD10499, HD10498, HD10497).

## Full-Text Fetch Outcomes

| dok_id | full_text_available | Notes |
|--------|---------------------|-------|
| HD10499 | true | Complete interpellation text retrieved |
| HD10498 | true | Complete interpellation text retrieved |
| HD10497 | true | Complete interpellation text retrieved |

## Prior-Voteringar Enrichment

Prior-voteringar searched for interpellation-related topics (last 4 riksmöten):
- Climate/environmental: `search_voteringar` with MJU/KU cross-over topics — no directly comparable recent vote found on vattenbrist specifically
- SME payment terms: Riksdagen tillkännagivande 2013 on SME payment terms (noted in HD10497 text); no recent vote in last 4 rm
- Finnish minority language education: No recent direct vote; framework under Language Act (2009:600)
- Prior voteringar: no directly comparable vote found in last 4 riksmöten for the specific topics in these interpellations

## Statskontoret Cross-Source Enrichment

Trigger evaluation for all 20 documents:
- HD10499 (water scarcity): Triggers — implementation feasibility for climate adaptation agencies (SGU groundwater monitoring, Livsmedelsverket, MSB). Statskontoret pre-warm: Statskontoret does not have a current directly-cited evaluation on water supply coordination as of retrieval; `none found` for specific 2025-26 Statskontoret report on vattenbrist.
- HD10497 (payment terms): No specific agency named — trigger not met. Statskontoret pre-warm: no trigger matched.
- HD10498 (Finnish language): No agency with Statskontoret scope. Statskontoret pre-warm: no trigger matched.

## Lagrådet Tracking

No interpellations in this batch are government propositions requiring Lagrådet review. Interpellations are parliamentary questions to ministers, not legislative proposals. Lagrådet tracking: not applicable for this article type.

## Withdrawn Documents

No withdrawn documents in this batch.

## PIR Carry-Forward

Prior PIR files searched: `find analysis/daily -maxdepth 4 -name pir-status.json -path "*/interpellations/*"` — no prior pir-status.json files found. This is a fresh cycle for 2026-05-21/interpellations. Standing PIRs applicable:
- PIR-1: Will the Tidö government maintain parliamentary majority through the 2025/26 riksmöte?
- PIR-2: How are SD's policy demands reshaping Tidö-bloc governance in the final stretch before 2026 elections?
- PIR-3: What climate policy gaps remain unaddressed before Sweden's 2030 targets?
- PIR-4: How is the government managing the tension between fiscal consolidation and welfare service delivery?
