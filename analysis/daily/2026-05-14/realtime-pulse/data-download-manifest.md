# Data Download Manifest — Realtime Pulse, 2026-05-14

**Workflow**: news-realtime-monitor  
**Run ID**: 25856001333  
**Generated**: 2026-05-14T10:56:00Z  
**Requested date**: 2026-05-14  
**Effective date**: 2026-05-14  
**Window used**: 7-day lookback (primary match on 2026-05-14 / 2026-05-13)

## Sibling Folder Cross-Reference (Tier-C Ingestion)

This realtime-pulse analysis ingests today's complete per-type analysis folders as primary intelligence inputs:

| Sibling folder | Files ingested | Key documents |
|----------------|----------------|---------------|
| analysis/daily/2026-05-14/propositions/ | synthesis-summary.md, intelligence-assessment.md, forward-indicators.md, coalition-mathematics.md | HD03250, HD03261, HD03267 |
| analysis/daily/2026-05-14/motions/ | synthesis-summary.md, intelligence-assessment.md, forward-indicators.md | HD024153, HD024160, HD024162, HD024167/168/169 |
| analysis/daily/2026-05-14/committeeReports/ | synthesis-summary.md, intelligence-assessment.md, forward-indicators.md | HD01KU34, HD01KU35 |
| analysis/daily/2026-05-14/interpellations/ | synthesis-summary.md, intelligence-assessment.md, forward-indicators.md | HD10492, HD10489, HD10490, HD10491 |

## Primary Document Inventory (Riksdag MCP)

| dok_id | Title | Type | Date | Committee | Full-text | Parti | Tier |
|--------|-------|------|------|-----------|-----------|-------|------|
| HD03267 | Stärkt skydd mot utlänningar som utgör kvalificerade säkerhetshot | prop | 2026-05-07 | JuU | ✅ | Justitiedep (M) | L3 |
| HD03250 | En statlig e-legitimation | prop | 2026-05-07 | TU | ✅ | Finansdep (KD) | L2+ |
| HD03261 | Utökade befogenheter för Skatteverket inom folkbokföringsverksamheten | prop | 2026-05-07 | SkU | ✅ | Finansdep (KD) | L2 |
| HD01KU34 | Grundlagsskyddad aborträtt + medborgarskap + föreningsfrihet (vilande) | bet | 2026-05-13 | KU | ✅ | KU (broad) | L3 |
| HD01KU35 | Digitala kommunala sammanträden + privata utförare | bet | 2026-05-13 | KU | ✅ | KU (unanimous) | L2 |
| HD024153 | Motion: Avskaffa förslaget att ta bort permanenta uppehållstillstånd | mot | 2026-05-13 | SfU | ✅ | S | L2+ |
| HD024160 | Motion: Barn i förvar — barnrättssäkra anläggningar | mot | 2026-05-13 | SfU | ✅ | C | L2+ |
| HD024168 | Motion: Avslå vandel-krav (Prop 264) | mot | 2026-05-13 | SfU | ✅ | V | L2 |
| HD024162 | Motion: Klimatmål i transportinfrastrukturen | mot | 2026-05-13 | TU | ✅ | S | L2 |
| HD10492 | Interpellation: Konsekvenser för barn av biståndsomläggningen | ip | 2026-05-13 | UD | ✅ | V (Lotta Johnsson Fornarve) | L2 |
| HD10489 | Interpellation: Al-Nakba och palestinier | ip | 2026-05-13 | UD | metadata-only | V | L1 |
| HD10490 | Interpellation: Mänskliga rättigheter på Kuba | ip | 2026-05-13 | UD | metadata-only | SD (M Wiechel) | L1 |
| HD10491 | Interpellation: Fordonsemissioner Stockholm | ip | 2026-05-13 | UD | metadata-only | L | L1 |

## ## Full-Text Fetch Outcomes

| dok_id | full_text_available | method |
|--------|-------------------|--------|
| HD03267 | true | get_dokument_innehall |
| HD03250 | true | get_dokument_innehall |
| HD03261 | true | get_dokument_innehall |
| HD01KU34 | true | get_dokument_innehall via sibling analysis |
| HD024153 | true | get_dokument_innehall via sibling analysis |
| HD024160 | true | get_dokument_innehall via sibling analysis |
| HD10492 | true | get_dokument_innehall via sibling analysis |

## Prior-Voteringar Enrichment

From sibling analyses (propositions/motions) — latest voteringar 2025/26:

| Beteckning | Date | Subject | Ja | Nej | Frånv | M | SD | KD | L | C | S | V | MP |
|------------|------|---------|----|----|-------|---|----|----|---|---|---|---|-----|
| AU10 pt3 | 2026-03-04 | Labour market (sakfrågan) | Broad yes | — | 1 | Yes | Yes | — | — | Absent | Yes | — | — |

Prior SfU voteringar on migration: most recent comparable vote was SfU betänkande on returnverksamhet (2024/25); M+SD+KD majority sustained; S+C reservation. Source: riksdag-regering MCP search_voteringar.

## Statskontoret Cross-Source Enrichment

Triggers evaluated for today's documents:
- **HD03261** (Skatteverket expansion): trigger fired — names Skatteverket + new cross-register mandate
- **HD03267** (security deportation): trigger evaluated — no direct agency capacity dimension (Migrationsverket operational impact is implementation, not Statskontoret governance domain)
- **HD01KU34**: trigger evaluated — no agency named; constitutional amendment domain

Statskontoret search conducted on 2026-05-14 at 10:57 UTC via web_fetch: `www.statskontoret.se` queried for Skatteverket register authority. Most relevant: *Statskontoret (2023): "Folkbokföringens kvalitet och Skatteverkets befogenheter"* — prior evaluation noting limited cross-register authority. URL: https://www.statskontoret.se/publicerat/rapporter-och-remissvar/2023/folkbokforingens-kvalitet/

For HD03267 (Migrationsverket/SÄPO operational): `Statskontoret: no directly relevant source found for SÄPO security-assessment capacity`.

## Lagrådet Tracking

- **HD03267**: Lagrådet referral sent; no yttrande published as of 2026-05-14T10:57Z. Tagged: `referral pending — expected by 2026-06-10`. Critical watch: ECHR Art. 3/8 compatibility risk. Forward indicator: FI-LAG-01.
- **HD01KU34 (KU34 vilande)**: Lagrådet review completed for constitutional amendment text; no pending referral.
- **HD03250, HD03261**: Standard Lagrådet review completed; no outstanding opinions.

## PIR Carry-Forward

Open PIRs from propositions/motions/committeeReports/interpellations cycles:

| PIR | Source cycle | Status |
|-----|--------------|--------|
| PIR-1 (Lagrådet yttrande HD03267) | propositions 2026-05-07 | OPEN — expected 2026-06-10 |
| PIR-2 (S position HD03267) | propositions 2026-05-07 | OPEN |
| PIR-3 (SfU scheduling props 262-265) | motions 2026-05-14 | OPEN — 2026-05-20 |
| PIR-4 (C child-detention concession) | motions 2026-05-14 | OPEN |
| PIR-5 (KU34 second passage — post-election) | committeeReports 2026-05-14 | OPEN — 2026-09-13 |
| PIR-6 (HD10492 Dousa answer) | interpellations 2026-05-14 | OPEN — 2026-05-29 |

## Reference Analyses Ingested (§Reference Analyses)

7-day lookback for realtime-pulse continuity chain:
- analysis/daily/2026-05-04/realtime-pulse/synthesis-summary.md (last available realtime-pulse)
- analysis/daily/2026-05-04/propositions/synthesis-summary.md
- analysis/daily/2026-05-04/motions/synthesis-summary.md

## MCP Server Availability

- riksdag-regering: ✅ Live (get_sync_status confirmed 2026-05-14T10:53Z)
- IMF WEO/FM: ✅ status:ok via data/imf-context.json (vintage: WEO Apr-2026)
- IMF SDMX: ✅ confirmed in imf-context.json probes
- World Bank: Available (used for governance/social context only)
- SCB: Available
