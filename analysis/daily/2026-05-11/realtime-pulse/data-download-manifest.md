# Data Download Manifest — 2026-05-11 Realtime Pulse

**Workflow**: news-realtime-monitor | **Run ID**: 25680108517 | **Generated**: 2026-05-11 15:45 UTC
**Article Date**: 2026-05-11 | **Subfolder**: realtime-pulse | **Riksmöte**: 2025/26
**Tier**: C (Aggregation — reads sibling analyses + live downloads)

## MCP Availability
- riksdag-regering: ✅ LIVE (session initialized, 15 documents for date)
- IMF: Pre-warm status OK (WEO-2026-04, age 1 month) | Live fetch degraded (datamapper timeout)
- SCB: Not queried (Swedish-specific ground truth not needed for procedural day)
- World Bank: Not queried
- Statskontoret: No agency-implementation trigger matched in today's documents

## Documents — Live Download (date-filtered: 2026-05-11)

| dok_id | Title | Type | Committee | Full Text | Party | DIW |
|--------|-------|------|-----------|-----------|-------|-----|
| HD01KU34 | En grundlagsskyddad aborträtt samt utökade möjligheter att begränsa föreningsfriheten och rätten till medborgarskap | bet | KU | ✅ Partial | — | L3 |
| HD01KU43 | En ny lag om riksdagens medalj | bet | KU | metadata-only | — | L1 |
| HD01MJU23 | Förenklingar i jaktlagstiftningen | bet | MJU | metadata-only | — | L1 |
| HD01SoU31 | En nationell utredningsfunktion för att förebygga suicid | bet | SoU | ✅ Partial | — | L2 |
| HD024149 | med anledning av prop. 2025/26:264 Skärpta och tydligare krav på vandel för uppehållstillstånd | mot | SfU | ✅ Partial | V | L2+ |
| HD024150 | med anledning av prop. 2025/26:263 Stärkt återvändandeverksamhet | mot | SfU | ✅ Partial | V | L2+ |
| HD10481 | Klimatmålen | ip | — | metadata-only | S | L2 |
| HD10482 | Effektivare kontrollmöjligheter för att förhindra svartarbete | ip | — | metadata-only | S | L1 |
| HD11804 | Skydd för kvinnor som utsätts för våld i hemmet | ip | — | metadata-only | C | L1 |
| HD11805 | Svensk närvaro på EPG-toppmötet i Armenien | ip | — | metadata-only | SD | L1 |
| HD11806 | Europeiskt tekniskt oberoende | ip | — | metadata-only | SD | L1 |
| HD11807 | Nedläggningshotade kvinnojourer i Malmö | ip | — | metadata-only | S | L2 |
| HD11808 | Konkurrenskraftiga förutsättningar för exportindustrin | ip | — | metadata-only | C | L1 |
| HD11809 | Samordning mellan Turkiet och Hamas | ip | — | metadata-only | SD | L2 |
| HD11810 | Svensk livsmedelsproduktion i ett försämrat omvärldsläge | ip | — | metadata-only | S | L1 |

## Full-Text Fetch Outcomes

| dok_id | full_text_available | method |
|--------|--------------------|---------| 
| HD01KU34 | true | get_dokument_innehall |
| HD024149 | true | get_dokument_innehall |
| HD024150 | true | get_dokument_innehall |
| HD01SoU31 | true | get_dokument_innehall |

## Reference Analyses (Sibling Folders — Tier-C ingestion)

| Folder | Synthesis Title | Key Finding |
|--------|----------------|-------------|
| analysis/daily/2026-05-11/propositions | Statlig identitetskontroll: Prop-paket 7 maj 2026 | HD03267 security detention (no time limit); HD03250 state e-legitimation |
| analysis/daily/2026-05-11/motions | Opposition Motions 2026-05-11 | Forestry (prop 242) and criminal responsibility (prop 246) splits |
| analysis/daily/2026-05-11/committeeReports | Committee Reports 2026-05-11 | HD01CU31 housing reform; HD01UbU20 school transparency |
| analysis/daily/2026-05-11/interpellations | Klimatmålen Interpellation HD10481 | Climate targets deadlock — proposition risk before summer recess |

## Prior-Voteringar Enrichment

- KU voteringar (rm 2025/26): No votes indexed yet (new riksmöte, KU34 scheduled for debate — not yet voted)
- SfU voteringar: No directly comparable vote on vandel/återvändande in last 4 riksmöten
- Prior voteringar fallback: AU10 (2024/25, 2025-05-14) — cross-committee proxy only. Not directly comparable.
- Prior voteringar: new riksmöte — no votes indexed yet for KU/SfU in 2025/26 on these specific matters

## Statskontoret Cross-Source Enrichment

Statskontoret pre-warm evaluation:
- HD01KU34 (abortion/association rights): No agency-implementation dimension — constitutional amendment
- HD01SoU31 (suicide prevention): Potential agency trigger — but national investigation function, not agency mandate
- HD024149/HD024150 (migration): Migrationsverket named implicitly
- Trigger assessment: Weak migration/Migrationsverket trigger on HD024149/HD024150
- Result: `Statskontoret: no directly relevant source found for migration vandel/återvändande` (checked statskontoret.se 2026-05-11)

## Lagrådet Tracking

- HD01KU34: Constitutional amendment — Lagrådet review not applicable (constitutional amendments via special procedure)
- HD024149/HD024150: Motions, not propositions — Lagrådet review not applicable
- Prop. 2025/26:263/264 (parent propositions): Lagrådet referral pending — not yet fetched. Tag: `Lagrådet: referral pending as of 2026-05-11`

## PIR Carry-Forward

Prior cycle PIRs (from interpellations/intelligence-assessment.md):
- PIR-CLIM-2026: Climate targets proposition before summer 2026 — OPEN (interpellation HD10481 confirms no proposition yet)
- PIR-MIG-RETURN: Strengthened return activities (prop 263) — CARRIED FORWARD (HD024150 motion filed)
- PIR-CONST-ABORT: Constitutional abortion protection — NOW ACTIVE (HD01KU34 scheduled for debate)
