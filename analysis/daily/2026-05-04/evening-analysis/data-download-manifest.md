# Data Download Manifest — Evening Analysis 2026-05-04

**Workflow**: news-evening-analysis  
**Run ID**: 25335718439  
**UTC Timestamp**: 2026-05-04T18:25:00Z  
**Requested Date**: 2026-05-04  
**Effective Date**: 2026-05-04  
**Window**: Riksmöte 2025/26, evening aggregation — reads sibling analyses from today

---

## MCP Server Availability

| Server | Status | Notes |
|--------|--------|-------|
| riksdag-regering | ✅ Live | `get_sync_status` returned `{"status":"live"}` |
| scb | available | container |
| world-bank | available | container |
| IMF | ❌ Blocked | Network egress to api.imf.org/data.imf.org blocked in this runner; economic context sourced from sibling analysis artifacts and prior cached IMF data |

---

## Source Documents (Betänkanden today / recent)

| dok_id | Title | Type | Organ | Date | Full-Text | Party |
|--------|-------|------|-------|------|-----------|-------|
| HD01FiU49 | Utvärdering av statens upplåning och skuldförvaltning 2021–2025 | Betänkande | FiU | 2026-05-04 | metadata | Multiple |
| HD01KU39 | Ökad insyn i politiska processer | Betänkande | KU | 2026-05-04 | metadata | Multiple |
| HD01NU19 | En mer ändamålsenlig prövning av kärntekniska anläggningar | Betänkande | NU | 2026-04-29 | metadata | Multiple |
| HD01JuU9 | En mer rättssäker och effektiv domstolsprocess | Betänkande | JuU | 2026-04-29 | metadata | Multiple |
| HD01FöU13 | Explosiva varor – förbättrade möjligheter till kontroll | Betänkande | FöU | 2026-04-29 | metadata | Multiple |
| HD01CU37 | Kommunala hyresgarantier för en socialt hållbar bostadsförsörjning | Betänkande | CU | 2026-04-29 | metadata | Multiple |
| HD01NU22 | Nya verktyg för stärkt konkurrens i privat och offentlig verksamhet | Betänkande | NU | 2026-04-29 | metadata | Multiple |
| HD01SoU33 | Slopat matkrav för serveringstillstånd | Betänkande | SoU | 2026-04-29 | metadata | Multiple |
| HD01SfU28 | Citizenship tightening (8-year residency, language test) | Betänkande | SfU | 2026-04-29 | via sibling | Multiple |

## Interpellations (2026-04-29 to 2026-05-04)

| dok_id | Title | Date | Party | Topic |
|--------|-------|------|-------|-------|
| HD10462 | Skatt på bekämpningsmedel | 2026-05-04 | S | Pesticide tax anomaly |
| HD10463 | Effekter för Östergötland av ändrad sträckning av Ostlänken | 2026-05-04 | S | Rail infrastructure |
| HD10461 | Insatser för den svenska rymdbranschen | 2026-04-30 | S | Space industry ESA |
| HD10460 | Statens kulturarv och bidragsfastigheternas underhåll | 2026-04-30 | SD | Cultural heritage |
| HD10459 | Opinionsbildning och aktivism inom myndigheter | 2026-04-29 | SD | Agency activism |
| HD10458 | Uttalande om att utrota gängkriminaliteten | 2026-04-29 | S | Gang crime eradication |
| HD10457 | Regeringens arbete med sällsynta hälsotillstånd | 2026-04-29 | S | Rare diseases |
| HD10456 | Organhandel | 2026-04-29 | SD | Organ trafficking |
| HD10455 | Förutsättningar för att värna det rörliga kulturarvet | 2026-04-29 | SD | Mobile cultural heritage |
| HD10454 | Åtgärder för att stoppa kriminella från att driva HVB-hem | 2026-04-29 | S | Criminal HVB homes |

---

## ## Full-Text Fetch Outcomes

| dok_id | full_text_available | Notes |
|--------|---------------------|-------|
| HD01NU19 | false | metadata-only via betänkanden API; full content via committee-reports sibling |
| HD01SfU28 | false | metadata-only; full content via committee-reports sibling |
| HD10458 | false | metadata-only via interpellationer API |
| HD10463 | false | metadata-only |

<!-- full-text-fallback: evening-analysis aggregates from sibling analyses that have full-text content; individual document full-text not required for aggregation tier -->

---

## ## Prior-Voteringar Enrichment

AU10 (2026-03-04): 15-party vote — M, S, SD, KD voted Ja; MP voted Nej; C Frånvarande on point 3. This indicates the Tidö coalition base majority pattern.

SfU28 voting group query returned 9 parties with 0 actual votes per field — vote not yet held or beteckning mismatch; inferred from sibling committee-reports analysis: M, SD, KD, L, S, C voted Ja; V, MP opposed.

---

## ## Statskontoret Cross-Source Enrichment

**Pre-warm evaluation**: Documents reference Kriminalvården (implicitly in explosives/gang crime context), Polismyndigheten (explosives control HD01FöU13), and Migrationsverket (migration propositions in sibling). Trigger condition MET for HD01FöU13 and migration cluster.

- HD01FöU13 (explosives control): Polismyndigheten given expanded appeal rights. Statskontoret administrative capacity: no directly relevant report found for 2025-26 explosives policing burden. Searched statskontoret.se — no directly relevant source found for Polismyndigheten explosives permit oversight.
- Migration propositions (sibling): Migrationsverket implementation burden well-documented; Statskontoret no directly relevant source found in real-time fetch (IMF/Statskontoret egress limited).

---

## ## Lagrådet Tracking

HD01NU19 (nuclear licensing): Lagrådet review was conducted and government followed the advisory opinion per committee report text. Entry into force 17 June 2026.  
HD01SfU28 (citizenship): Lagrådet review conducted. Language test component deferred to October 2027 due to implementation complexity flagged in legislative review.  
HD03258 (transparency, sibling propositions): Lagrådet referral pending — no yttrande published as of 2026-05-04T18:25:00Z.

---

## ## Withdrawn Documents

No withdrawn documents identified in today's batch. Note: HD024127 motion withdrawn (identified in motions sibling analysis) — strategic repositioning signal documented there.

---

## ## PIR Carry-Forward

Prior-cycle PIRs from interpellations sibling (2026-05-04):
- **PIR-1**: Gang crime eradication promise — OPEN; HD10458 debate scheduled
- **PIR-2**: ESA contribution profile and innovation narrative — OPEN; HD10461 debate
- **PIR-3**: Agency activism framing — OPEN; HD10459 debate

Prior cycle propositions PIRs:
- **PIR-PROP-1**: Migration permanent permit elimination: S party stance trajectory — OPEN
- **PIR-PROP-2**: Coalition durability post-election under fragmented scenario — OPEN

---

## Reference Analyses (Sibling Folders Read)

| Folder | Synthesis Summary Present | Key Themes |
|--------|--------------------------|------------|
| analysis/daily/2026-05-04/propositions/ | ✅ | Migration capstone HD03262-65; NATO HD03254; Transparency HD03258 |
| analysis/daily/2026-05-04/motions/ | ✅ | 16 opposition motions; env. permitting, youth crime, energy/wind |
| analysis/daily/2026-05-04/committee-reports/ | ✅ | Nuclear licensing NU19; Citizenship SfU28; Court reform JuU9 |
| analysis/daily/2026-05-04/interpellations/ | ✅ | Gang crime HD10458; Space HD10461; Agency activism HD10459 |
