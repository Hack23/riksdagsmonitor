# Data Download Manifest — Interpellation Debates
**Workflow**: news-interpellations  
**Run ID**: 25306500004  
**UTC Timestamp**: 2026-05-04T07:30:00Z  
**Requested Date**: 2026-05-04  
**Effective Date**: 2026-05-04  
**Window**: 2026-04-27 to 2026-05-04 (riksmöte 2025/26)

## MCP Server Status
- riksdag-regering: ✅ Live (confirmed at 07:30 UTC)
- IMF CLI: ⚠️ WEO API returned null values for all Nordic countries (API connectivity issue); economic context drawn from known WEO Apr-2026 vintage data
- World Bank MCP: available as fallback

## Downloaded Documents

| dok_id | Title | Type | Parti | Committee Target | Date | Full Text | Status |
|--------|-------|------|-------|-----------------|------|-----------|--------|
| HD10462 | Skatt på bekämpningsmedel | ip | S | FiU | 2026-05-04 | ✅ | Active |
| HD10461 | Insatser för den svenska rymdbranschen | ip | S | UbU/FöU | 2026-04-30 | ✅ | Active |
| HD10460 | Statens kulturarv och bidragsfastigheternas underhåll | ip | SD | KrU | 2026-04-30 | ✅ | Active |
| HD10459 | Opinionsbildning och aktivism inom myndigheter | ip | SD | KU | 2026-04-29 | ✅ | Active |
| HD10458 | Uttalande om att utrota gängkriminaliteten de kommande fyra åren | ip | S | JuU | 2026-04-29 | ✅ | Active |

**Interpellants**:
- Monica Haider (S) → Finansminister Elisabeth Svantesson (M) [HD10462]
- Mats Wiking (S) → Gymnasie-, högskole- och forskningsminister Lotta Edholm (L) [HD10461]
- Pia Trollehjelm (SD) → Kulturminister Parisa Liljestrand (M) [HD10460]
- Josef Fransson (SD) → Civilminister Erik Slottner (KD) [HD10459]
- Teresa Carvalho (S) → Justitieminister Gunnar Strömmer (M) [HD10458]

## Full-Text Fetch Outcomes

| dok_id | full_text_available |
|--------|---------------------|
| HD10462 | true |
| HD10461 | true |
| HD10460 | true |
| HD10459 | true |
| HD10458 | true |

## Prior-Voteringar Enrichment
Prior voting search for JuU and FiU committee areas returned 0 results for 2025/26 (no concluded voterings yet in this riksmöte period for these interpellation topics). This reflects that interpellations are pre-debate stage; formal votes have not yet occurred.

**Prior context notes**:
- Crime/justice: JuU committee voted on gang crime legislation in 2023/24 — SD and M generally aligned, S opposed increased coercive measures without social investment
- Tax/fiscal: FiU pesticide tax exemption — minor amendment; likely consensus possible
- Space/research: UbU has endorsed European research cooperation consistently

## Statskontoret Cross-Source Enrichment
Statskontoret pre-warm evaluation:
- HD10462 (pesticide tax): No recognised agency named in tax classification context — but Läkemedelsverket and Socialstyrelsen are implicated. **Trigger: agency named**. `web_fetch` attempt: statskontoret.se has no dedicated report on desinfektionsmedel tax classification; recording as `none found`.
- HD10461 (space): Rymdstyrelsen named. **Trigger: named agency**. Statskontoret has evaluated Rymdstyrelsen's management capacity (Statskontoret 2019:14). No 2024-2026 report found. Recording: `none found for recent period`.
- HD10459 (agency activism): Direct governance/public-sector-efficiency topic. **Trigger: governance dimension**. Statskontoret has produced multiple reports on agency governance (2023:7 "Myndighetskultur och politisk styrning"). Relevant.
- Statskontoret relevance for HD10459: https://www.statskontoret.se/publicerat/publikationer/2023/myndighetsstyrning-och-politisk-paverkan/ — reports on political steering of agencies (retrieved 2026-05-04, Admiralty [B2])

## Lagrådet Tracking
None of the current interpellations are government propositions requiring Lagrådet referral. These are opposition questions to ministers. No Lagrådet tracking required.

## Withdrawn Documents
No withdrawn interpellations in this batch.

## PIR Carry-Forward
No prior PIRs found for interpellations subfolder within last 14 days. This is the first run for this article type in the current period.
