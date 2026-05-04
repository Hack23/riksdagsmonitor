---
title: "Data Download Manifest — Committee Reports 2026-05-04"
date: "2026-05-04"
workflow: "news-committee-reports"
run_id: "25301623697"
generated_at: "2026-05-04T04:53:00Z"
---

# Data Download Manifest — Committee Reports 2026-05-04

**Workflow**: news-committee-reports  
**Run ID**: 25301623697  
**Generated**: 2026-05-04T04:55:00Z  
**Requested date**: 2026-05-04  
**Effective date**: 2026-04-29 (latest published committee reports in riksmöte 2025/26)  
**Window**: 2026-04-24 to 2026-04-29 (last 7 days)  
**MCP Server**: riksdag-regering (live, status confirmed)

## Downloaded Documents

| dok_id | Title | Type | Organ | Date | Full Text | Withdrawn |
|--------|-------|------|-------|------|-----------|-----------|
| HD01NU19 | En mer ändamålsenlig prövning av kärntekniska anläggningar | bet | NU | 2026-04-29 | ✅ full | — |
| HD01SfU28 | Skärpta krav för svenskt medborgarskap | bet | SfU | 2026-04-28 | ✅ full | — |
| HD01JuU9 | En mer rättssäker och effektiv domstolsprocess | bet | JuU | 2026-04-29 | ✅ full | — |
| HD01KU36 | Integritet och ny teknik 2020–2024 | bet | KU | 2026-04-29 | metadata | — |
| HD01FöU14 | Förbättrade förutsättningar för operativt militärt samarbete | bet | FöU | 2026-04-28 | metadata | — |
| HD01FöU20 | En ny lag för ökad motståndskraft hos kritiska verksamhetsutövare | bet | FöU | 2026-04-28 | metadata | planerat |
| HD01NU22 | Nya verktyg för stärkt konkurrens i privat och offentlig verksamhet | bet | NU | 2026-04-29 | metadata | — |
| HD01SkU22 | Åtgärder mot mervärdesskattebedrägerier | bet | SkU | 2026-04-28 | metadata | — |
| HD01CU37 | Kommunala hyresgarantier för en socialt hållbar bostadsförsörjning | bet | CU | 2026-04-29 | metadata | — |

**Source**: data.riksdagen.se — riksdag-regering MCP server  
**Retrieval timestamp**: 2026-05-04T04:55:00Z

## Full-Text Fetch Outcomes

| dok_id | full_text_available |
|--------|---------------------|
| HD01NU19 | true |
| HD01SfU28 | true |
| HD01JuU9 | true |
| HD01KU36 | false (metadata-only, HTML not yet fully published) |
| HD01FöU14 | false (planerat — not yet published) |

## Prior-Voteringar Enrichment

**SfU28 voting (2026-04-29, sakfrågan punkt 1)**:
- Observed individual votes: S (Kenneth G Forslund — Ja), SD (Julia Kronlid — Ja), C (Kerstin Lundgren — Ja), S (Anders Ygeman — Ja), M (Margareta Cederfelt — Ja)
- Cross-party support confirmed: S, SD, M, C voted Ja (citizenship tightening passed)
- Opposition reservations: V (10 yrkanden), MP (4 yrkanden), some S and C concerns on details

**NU19 voting (NU committee)**:
- Committee approved proposition 2025/26:171 (M, SD, KD, L, one L member)
- Two reservations: (S, V, C, MP) — opposed to government proposal
- Motion by S (Fredrik Olovsson) for rejection: 2025/26:3972 yrkande 1

**Prior comparable votings (last 4 riksmöten)**:
- SfU (2023/24): Tidö Coalition pushed through tightened migration requirements — consistent pattern
- NU (2024/25): Nuclear policy propositions supported by M+SD+KD+L bloc
- No directly comparable SfU citizenship vote in last 4 riksmöten predating this

## Statskontoret Cross-Source Enrichment

**Trigger evaluation**: HD01SfU28 names Migrationsverket (citizenship adjudications), HD01NU19 names Strålsäkerhetsmyndigheten and Riksgälden (nuclear oversight and financing), HD01JuU9 names Domstolsverket.

- **Statskontoret**: pre-warm evaluated; no specific 2026 report found for nuclear permitting process administrative efficiency; no specific SfU28 implementation report; the agency-capacity dimension for Migrationsverket is documented in prior Statskontoret evaluations of integration policy capacity. Recorded as: `Statskontoret: no directly relevant 2026 report found for SfU28/NU19/JuU9 at time of retrieval; prior capacity evaluations exist for Migrationsverket integration processing.`

## Lagrådet Tracking

- **HD01NU19**: Lagrådet advisory opinion obtained (yttrande) — government requested Lagrådet review in February 2026 (proposition bilaga 9). Government followed Lagrådet's proposals and views. Referral: confirmed completed.
- **HD01SfU28**: Lagrådet status: not explicitly noted in betänkandet text retrieved; referral status: `Lagrådet referral pending / not confirmed as of 2026-05-04T04:55:00Z`
- **HD01JuU9**: Standard court procedure reform; Lagrådet review likely completed but not confirmed from available text.

## PIR Carry-Forward

No prior PIR files found in `/analysis/daily/` for `committee-reports` subfolder. First cycle run — PIRs established fresh.

Priority Intelligence Requirements for this cycle:
- **PIR-1**: Will the nuclear licensing law face constitutional challenge or early implementation problems?
- **PIR-2**: How will Migrationsverket implement the citizenship requirement changes by June 6, 2026?
- **PIR-3**: What is the opposition's strategy for the September 2026 election on nuclear/energy policy?
- **PIR-4**: Will the court process reforms reduce witness intimidation in gang-crime prosecutions?
- **PIR-5**: How will the citizenship test be designed and when will it be operational?

## MCP Server Notes

- riksdag-regering: live at retrieval time (2026-05-04T04:53:17Z)
- Full votings data for SfU28 punkt 1 available; NU19 grouped voting not yet available (sync lag)
- HD01FöU20 and HD01FöU14: planned betänkanden, not yet published; metadata only
