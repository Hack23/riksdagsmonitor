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

## Re-run 2026-05-14 14:19 UTC

**Triggered by**: news-realtime-monitor run_id=25864884905 (improvement mode — all 23 artifacts present)

### Discovery Results
- New dok_ids found: **0**
- Discovery method: `search_dokument(from_date=2026-05-14, rm=2025/26)` — returned calendar entries only (EU-nämnden meetings, Riksdag demokratiutställning, other institutional events)
- Conclusion: Substantive parliamentary documents for 2026-05-14 are unchanged from prior run inventory of 13 documents

### Re-run Actions
1. Verified riksdag-regering MCP status: live (search_voteringar call returned valid results)
2. IMF CLI re-attempt: degraded (fetch failed again; pre-warm cached context still current at WEO Apr-2026)
3. No new voteringar since prior run (most recent: AU10 pt3, 2026-03-04)
4. Artifacts extended: methodology-reflection.md (re-run log + ICD 203 audit + methodology improvements)
5. All 23 artifacts validated against gate requirements — gate ready

### Data Freshness Assessment (Re-run)
- Parliamentary data: CURRENT (live MCP, same 13 documents as initial run)
- Sibling analysis ingestion: UNCHANGED (4 sibling folders as indexed in initial run)
- IMF economic context: CURRENT (WEO Apr-2026 cached, same vintage as initial run)
- pir-status.json: VALID (schema_version=1.0, 3 open PIRs)

## Re-run 2026-05-14 15:02 UTC

**Re-run trigger**: Improvement-mode re-run to extend analysis with afternoon chamber activity
**New dok_ids identified**: HD10453, HD10440 (interpellation debates answered in chamber today)

### New interpellation debate activity (afternoon, 2026-05-14)

Three interpellations were answered in chamber debate this afternoon, not captured in the original run:

| dok_id | Number | Title | Interpellant | Minister | Speeches |
|--------|--------|-------|-------------|---------|----------|
| HD10453 | 2025/26:453 | Investeringar i elnät | Josef Fransson (SD) | Ebba Busch / Energiminister (KD) | 7 speeches |
| HD10448 | 2025/26:448 | Desinformation om vindkraft | Josef Fransson (SD) | Ebba Busch / Energiminister (KD) | 7 speeches |
| HD10440 | 2025/26:440 | Utbildningen för företagsläkare | Johanna Haraldsson (S) | Johan Britz / Arbetsmarknadsminister (L) | 6 speeches |

**Retrieval timestamp**: 2026-05-14T15:02:00Z
**MCP source**: search_anforanden (live), search_dokument (confirmed)
**Full-text status**: HD10453 metadata — full-text available on request; HD10440 metadata — full-text available on request

### Significance assessment for new debates

**HD10453/HD10448 (Energy — Busch/Fransson)**: SD-KD interpellation pair on electricity grid investment and wind-power disinformation narrative is analytically significant pre-election. SD is using interpellations to (a) establish an energy-cost accountability chain against the government, and (b) test whether KD's support for wind power diverges from SD's energy-nationalism narrative. The dual interpellation filing against the same minister on the same day signals coordinated parliamentary pressure.

**HD10440 (Labour/Health — Britz/Haraldsson)**: S's persistent pressure on occupational physician training reflects welfare-state credential building. Third similar S interpellation this riksmöte on the same topic (cross-ref HD10354 Feb 2026, HD10282 Jan 2026). Pattern indicates S is building a documented record of government inaction for election use.

**PIR impact**: HD10453/10448 are new PIRs (energy sector), not linked to the primary PIRs in today's analysis. HD10440 enriches the pattern of S opposition strategy documented in intelligence-assessment.md.
