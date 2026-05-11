# Data Download Manifest — Opposition Motions — 2026-05-11

**Workflow**: news-motions | **ARTICLE_DATE**: 2026-05-11 | **SUBFOLDER**: motions  
**Data Span**: 2026-05-04 (lookback 5 business days from 2026-05-11)  
**Lookback reason**: No documents found for 2026-05-11; nearest prior date with motions was 2026-05-04

## Document Inventory

| Dok-ID | Title | Party | Author | Proposition | Committee | Published |
|--------|-------|-------|--------|-------------|-----------|-----------|
| HD024141 | Motion om skogsbruk | V | Kajsa Fredholm | 2025/26:242 | MJU | 2026-05-04 |
| HD024142 | Motion om unga lagöverträdare | V | Gudrun Nordborg | 2025/26:246 | JuU | 2026-05-04 |
| HD024143 | Motion om skogsbruk | SD | Martin Kinnunen | 2025/26:242 | MJU | 2026-05-04 |
| HD024144 | Motion om skogsbruk | S | Åsa Westlund | 2025/26:242 | MJU | 2026-05-04 |
| HD024145 | Motion om skogsbruk | C | Helena Lindahl | 2025/26:242 | MJU | 2026-05-04 |
| HD024146 | Motion om unga lagöverträdare | C | Ulrika Liljeberg | 2025/26:246 | JuU | 2026-05-04 |
| HD024147 | Motion om skogsbruk | MP | Rebecka Le Moine | 2025/26:242 | MJU | 2026-05-04 |
| HD024148 | Motion om unga lagöverträdare | MP | Ulrika Westerlund | 2025/26:246 | JuU | 2026-05-04 |

## Full-Text Fetch Outcomes

| Dok-ID | fulltext_available | Text field | Key proposals extracted |
|--------|-------------------|------------|------------------------|
| HD024141 | true | text (HTML+XML) | Reject prop except appeals provision; EU Habitats compliance |
| HD024142 | true | text (HTML+XML) | Partial: accept supervision tightening, reject age-13 |
| HD024143 | true | text (HTML+XML) | Support prop; add land-exemption clause |
| HD024144 | true | text (HTML+XML) | Demand comprehensive consequence analysis before adoption |
| HD024145 | true | text (HTML+XML) | Demand production-boosting package from government |
| HD024146 | true | text (HTML+XML) | Reject age-13 provision and Art.29 changes; UNCRC |
| HD024147 | true | text (HTML+XML) | Reject entire proposition; EU Nature Restoration Law |
| HD024148 | true | text (HTML+XML) | Reject age-13 + Art.29; return for research-based alternatives |

*Note: `parti` field was empty in all JSON responses. Party attribution confirmed via full-text ("Motion 2025/26:NNNN av [Author] ([Party])") with dual-signal verification.*

## Prior-Voteringar Enrichment

**Search scope**: riksdag-regering-mcp voteringar for MJU and JuU committees, riksmöten 2022/23–2024/25  
**Result**: No voteringar found for 2025/26 riksmöte on either proposition

**Gap classification**: New riksmöte gap — current riksmöte (2025/26) data not yet in open data export pipeline  
**Proxy used**: 2022/23 MJU voting patterns on comparable forestry propositions (party positions consistent with current motions)  
**Impact**: Cannot compute quantitative voting discipline baseline for current term; qualitative analysis only

## Statskontoret Cross-Source Enrichment

**Agencies identified in motions**: Skogsstyrelsen (forestry enforcement), Kriminalvården (youth criminal justice), Socialtjänst (youth services)  
**Statskontoret evaluation search**: No current Statskontoret evaluation of Skogsstyrelsen or Kriminalvården found in this run  
**Impact**: Cannot cross-reference agency performance metrics  
**Action**: Monitor statskontoret.se for evaluations published in 2025-2026 period

## IMF Economic Context

| Indicator | Sweden | Source | Vintage | Retrieved |
|-----------|--------|--------|---------|-----------|
| GDP growth (NGDP_RPCH) | 1.8% (2026f) | IMF WEO | WEO-2026-04 | 2026-05-11 |
| Public debt/GDP | 38.4% | IMF WEO | WEO-2026-04 | 2026-05-11 |
| Unemployment | 8.1% (2026f) | IMF WEO | WEO-2026-04 | 2026-05-11 |
| Forestry GDP share | ~1.0% | SCB Skogsdata 2024 | 2024 | 2026-05-11 |

*IMF WEO live fetch returned "fetch failed" in this run; vintage data from prewarm context (status=ok, vintage=WEO-2026-04). Vintage age: 1 month (no annotation required).*

## PIR Carry-Forward

| PIR | Question | Source | Priority |
|-----|---------|--------|---------|
| PIR-01 | SD concession on forestry | MJU committee + SD press | CRITICAL |
| PIR-02 | JuU age-13 expert hearing | JuU committee agenda | HIGH |
| PIR-03 | EU Commission forestry response | Commission DG Environment | HIGH |
| PIR-04 | C coalition signal post-election | Party statements | CRITICAL |
| PIR-05 | New voteringar for MJU/JuU | riksdag open data | HIGH |
