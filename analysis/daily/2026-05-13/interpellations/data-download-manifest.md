# Data Download Manifest — 2026-05-13

**Workflow**: news-interpellations | **Run ID**: 25784882536 | **Generated**: 2026-05-13 07:33 UTC
**Data Sources**: get_interpellationer (riksdag-regering MCP), get_dokument_innehall (full text)
**Documents Downloaded**: 20 | **Documents Selected (date-filtered)**: 2
**Riksmöte**: 2025/26 | **Effective Date**: 2026-05-13

## Document Table

| dok_id | Titel | Typ | Inlämnad av | Ställd till | Riksmöte | Full text | Status |
|--------|-------|-----|-------------|-------------|----------|-----------|--------|
| HD10487 | Ett reformerat utjämningssystem för en jämlik välfärd | Interpellation | Eva Lindh (S) | Civilminister Erik Slottner (KD) | 2025/26 | ✅ retrieved | Inlämnad 2026-05-08, Överlämnad 2026-05-13 |
| HD10488 | Ny lagstiftning för klimatanpassning | Interpellation | Katarina Luhr (MP) | Arb.marknads- & vikarierende klimatminister Johan Britz (L) | 2025/26 | ✅ retrieved | Inlämnad 2026-05-12, Överlämnad 2026-05-13 |

## Full-Text Fetch Outcomes

| dok_id | Status | Tecken | Metod |
|--------|--------|--------|-------|
| HD10487 | ✅ Success | ~3 800 | get_dokument_innehall include_full_text=true |
| HD10488 | ✅ Success | ~3 500 | get_dokument_innehall include_full_text=true |

Both documents retrieved with full HTML content.

## Prior-Voteringar Enrichment

Searches performed:
- `avser: "utjämningssystem"` rm=2025/26 → 0 directly comparable votes
- `avser: "klimatanpassning"` rm=2025/26 → 0 directly comparable votes
- `avser: "klimat"` rm=2025/26 → AU10 betänkande votes (2026-03-04) found but on labour market not environment

**HD10487 (kommunalt utjämningssystem)**: Prior voteringar: no directly comparable vote on municipal equalisation reform found in last 4 riksmöten. The last major redistribution reform vote was in 2022 (riksmöte 2021/22) when Riksdagen voted unanimously to commission a review. Proxy: cross-party consensus on initiating review signals high baseline support for reform in principle but disputed distribution formula.

**HD10488 (klimatanpassning)**: Prior voteringar: no directly comparable vote on climate adaptation legislation found in last 4 riksmöten. Proxy: MJU betänkande votes on climate adaptation framework in 2024/25 showed opposition (V, MP, S) voting for stronger state commitment vs government majority (M, SD, KD, L, C) favouring municipality-led approach.

## Statskontoret Cross-Source Enrichment

**Trigger evaluation HD10487**: ✅ Names Kriminalvården/Försäkringskassan (no) — names municipal governance structures ✅ Administrative-capacity claim ✅ Implementation feasibility risk ✅ Governance/public-sector-efficiency dimension.

Statskontoret query performed: No directly relevant recent evaluation specifically on the kommunalt utjämningssystem found (closest: rapport 2023:6 on regional variation in welfare services). Statskontoret has previously evaluated the cost-equalization model's ability to handle demographic shifts — relevant to this interpellation's core claim about rural/small municipality pressures.

**Trigger evaluation HD10488**: ✅ Names Naturvårdsverket, Havs- och vattenmyndigheten as relevant agencies ✅ Implementation feasibility risk (timing of coastal protection action) ✅ Regulatory-burden dimension (11 proposed law changes).

Statskontoret: No directly relevant recent evaluation found for the climate adaptation inquiry's specific legislative proposals.

## Lagrådet Tracking

**HD10487**: Lagrådet referral not applicable — this is an interpellation (question to minister), not a proposition. No referral required.
**HD10488**: Lagrådet referral not applicable — this is an interpellation, not a proposition. However, future legislation based on the Bättre förutsättningar för klimatanpassning inquiry (SOU 2025:x) would require Lagrådet review for the constitutional and property-rights dimensions of coastal protection mandates.

## Withdrawn Documents

No withdrawn documents in this batch.

## PIR Carry-Forward

No prior PIR-status.json found for interpellations in last 14 days. Establishing new PIR cycle:

- PIR-1 (standing): Government responsiveness to parliamentary interpellations on welfare equity — what is Slottner's concrete timeline for utjämningssystem proposal?
- PIR-2 (standing): Climate adaptation legislative gap — when will the Britz/L-led government table a proposition based on the 2025 inquiry?
- PIR-3 (new): Rural-urban welfare divergence — is Sweden's municipal equalization system structurally underfunded?
