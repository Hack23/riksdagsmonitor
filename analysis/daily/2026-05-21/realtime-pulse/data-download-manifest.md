# Data Download Manifest — 2026-05-21 (realtime-pulse)

**Workflow**: news-realtime-monitor
**Run**: 26221971601 attempt 1
**Started (UTC)**: 2026-05-21T11:06:31Z
**Requested date**: 2026-05-21
**Effective date**: 2026-05-21
**Subfolder**: realtime-pulse
**Improvement mode**: false
**Analysis depth**: deep
**Riksmöte**: 2025/26

> MCP status: live (riksdag-regering confirmed at 11:06 UTC)
> IMF status: ok, WEO Apr-2026 vintage (1 month old, current)

## MCP attempts

| Attempt | Server | Tool | Status | Timestamp |
|---------|--------|------|--------|-----------|
| 1 | riksdag-regering | get_sync_status | ✅ live | 2026-05-21T11:06:56Z |
| 1 | riksdag-regering | download-parliamentary-data.ts | ✅ 14 documents | 2026-05-21T11:07:58Z |

## Per-document table

| dok_id | Title | Type | Committee | Retrieval | Full-text | Parti | Withdrawal |
|--------|-------|------|-----------|-----------|-----------|-------|------------|
| HD01JuU28 | Polisens användning av AI för ansiktsigenkänning i realtid | bet | JuU | live | ✅ full_text (100015 chars) | N/A (committee) | No |
| HD01CU36 | Lag om avgift för områdessamverkan | bet | CU | live | ✅ full_text (81454 chars) | N/A (committee) | No |
| HD01FiU40 | En starkare fondmarknad | bet | FiU | live | ✅ full_text (80468 chars) | N/A (committee) | No |
| HD01CU41 | Undantag från krav enligt art- och habitatdirektivet vid vattenkraftens omprövning | bet | CU | live | ✅ full_text (100015 chars) | N/A (committee) | No |
| HD10499 | Vattenbrist och klimatanpassning i södra Sverige | ip | N/A | live | ✅ full_text | S | No |
| HD10500 | Framtiden för Köpings sjukhus och andra utpekade nedläggningshotade sjukhus | ip | N/A | live | ✅ full_text | S | No |
| HD10501 | Ändringar i grundlagen | ip | N/A | live | ✅ full_text | N/A | No |
| HD11821 | Dialog mellan Tibet och Kina | fr | N/A | live | ✅ full_text | SD | No |
| HD11822 | Försäljning av krigsmateriel till Taiwan | fr | N/A | live | ✅ full_text | SD | No |
| HD11823 | Tryggheten på rastplatser för yrkesförare | fr | N/A | live | ✅ full_text | S | No |
| HD11824 | Kötider för tillstånd att flyga drönare | fr | N/A | live | ✅ full_text | C | No |
| HD11825 | Förtroendet för den allmänna pensionen | fr | N/A | live | ✅ full_text | S | No |
| HD11826 | Tredjelandsmedborgares möjlighet att arbeta i Danmark | fr | N/A | live | metadata_only | S | No |
| HD11827 | De inre gränskontrollerna mot Danmark | fr | N/A | live | ✅ full_text | S | No |

## Full-Text Fetch Outcomes

| dok_id | full_text_available | chars | method |
|--------|---------------------|-------|--------|
| HD01JuU28 | true | 100015 | get_dokument_innehall |
| HD01CU36 | true | 81454 | get_dokument_innehall |
| HD01FiU40 | true | 80468 | get_dokument_innehall |
| HD01CU41 | true | 100015 | get_dokument_innehall |
| HD10499 | true | ~3000 | get_dokument_innehall |
| HD10500 | true | ~3000 | get_dokument_innehall |
| HD10501 | true | ~3000 | get_dokument_innehall |
| HD11821 | true | 3065 | get_dokument_innehall |
| HD11822 | true | 4556 | get_dokument_innehall |
| HD11823 | true | 3102 | get_dokument_innehall |
| HD11824 | true | 3170 | get_dokument_innehall |
| HD11825 | true | 3083 | get_dokument_innehall |
| HD11826 | false | N/A | metadata_only |
| HD11827 | true | 2379 | get_dokument_innehall |

## Prior-Voteringar Enrichment

Search for prior votes: `search_voteringar` returned AU10 (2026-03-04) as most recent indexed vote (bet=AU10, all parties voted Ja on point 3). Specific CU/JuU/FiU votes for today's betänkanden are not yet indexed — these are fresh betänkanden scheduled for debate 2026-05-21 (votes likely 21 May or later).

Prior voteringar: No directly comparable vote found in last 4 riksmöten for HD01JuU28 (AI facial recognition is a new legislative area). For reference, AU10 (2026-03-04) showed broad cross-party consensus on labour-market matters.

## Statskontoret Cross-Source Enrichment

Trigger evaluation:
- HD01JuU28 (AI facial recognition): Names Polismyndigheten — TRIGGER. Statskontoret relevance: implementation capacity for new AI police surveillance unit. URL: `https://www.statskontoret.se/` (no directly relevant report found for real-time AI facial recognition implementation; this is a novel legislative area)
- HD01FiU40 (fund market): Names Finansinspektionen — TRIGGER. Statskontoret relevance: regulatory capacity for enhanced fund supervision. `none found`
- HD01CU36 (areas cooperation): No recognised agency named — no trigger matched.
- HD01CU41 (hydropower): Names Länsstyrelserna — TRIGGER. Statskontoret relevance: regional authority administrative capacity for hydropower review exceptions. `none found`

## Lagrådet Tracking

- HD01JuU28 (Police AI): Lagrådet review status: referral pending — betänkande published 2026-05-21; no Lagrådet yttrande yet found at lagradet.se as of 11:30 UTC.
- HD01FiU40 (Fund market): Lagrådet review: not expected (regulatory clarification, not fundamental rights).
- HD01CU36 (Area fee): Lagrådet: not typically required for fee legislation.

## PIR Carry-Forward

Open PIRs from 2026-05-20 carried forward into this cycle:
- PIR-RT-1: KU34 second reading YES commitment — open
- PIR-RT-2: S campaign positioning on SoU30 — open
- PIR-RT-3: SD internal reaction to abortion constitutional support — open
- PIR-RT-4: Municipal SoU30 implementation readiness — open
- PIR-RT-5: Legal challenges to SoU30 welfare restriction — open
- PIR-PROP-1: Lagrådet language on HD03267 — open
- PIR-PROP-3: IMY opinion on HD03261 — open
- PIR-INTERP-RUSSIA: Russia/Ichkeria security nexus — open

New PIR candidates identified today:
- PIR-JUU28-AI: Will Riksdag adopt JuU28 (AI facial recognition) with sunset clause intact?
- PIR-JUU28-REVIEW: Post-adoption review mechanism — will Säkerhetspolis/IMY provide binding annual oversight?

## Reference Analyses (Tier-C ingestion)

Sibling analyses ingested for cross-type synthesis:
- `analysis/daily/2026-05-21/committee-reports/` — 12 betänkanden including SoU38/39 child protection, JuU43 honour violence, SoU29/30 welfare activation
- `analysis/daily/2026-05-21/propositions/` — 10 propositions including migration-security architecture (HD03267, HD03262) and digital governance (HD03250, HD03261)
- `analysis/daily/2026-05-20/realtime-pulse/` — prior cycle reference; synthesis-summary.md ingested
