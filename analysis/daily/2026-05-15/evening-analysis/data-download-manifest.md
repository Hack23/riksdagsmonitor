# Data Download Manifest — Evening Analysis 2026-05-15

**Generated**: 2026-05-15 17:35 UTC
**Analysis tier**: Tier-C (evening aggregation — reads all sibling per-type folders)
**Subfolder**: evening-analysis
**Data Sources**: riksdag-regering MCP (propositioner, motioner, betänkanden, interpellationer, frågor, voteringar, anföranden), IMF WEO Apr-2026 (pre-warmed), sibling daily analyses

## Sibling Folders Ingested (Tier-C cross-type synthesis)

| Folder | Path | Status | Key Artifacts |
|--------|------|--------|---------------|
| propositions | analysis/daily/2026-05-15/propositions/ | ✅ read | synthesis-summary.md, intelligence-assessment.md |
| motions | analysis/daily/2026-05-15/motions/ | ✅ read | synthesis-summary.md |
| committeeReports | analysis/daily/2026-05-15/committeeReports/ | ✅ read | synthesis-summary.md, intelligence-assessment.md |
| interpellations | analysis/daily/2026-05-15/interpellations/ | ✅ read | synthesis-summary.md |

## Documents for 2026-05-15 (date-filtered, live MCP)

| dok_id | Titel | Typ | Organ | Parti | Full text | Retrieval |
|--------|-------|-----|-------|-------|-----------|-----------|
| HD024184 | med anledning av prop. 2025/26:258 Ökad insyn i politiska processer | mot (Kommittémotion) | KU | C (Malin Björk m.fl.) | ✅ 30 569 chars | live |
| HD10494 | Erkännande av tjetjenska republiken Itjkerien som ockuperad stat | ip | — | SD (Markus Wiechel) | ✅ 5 201 chars | live |
| HD11812 | Drönarkrig | fr | — | SD (Markus Wiechel) | ✅ 5 182 chars | live |
| HD11813 | Ny rysk lag om angrepp på andra länder | fr | — | SD (Markus Wiechel) | ✅ 5 168 chars | live |

## Reference Analyses (from sibling folders)

**propositions/** — Proposition package (HD03250, HD03261, HD03262, HD03264, HD03267): migration restriction, e-legitimation, Skatteverket powers, security threat expulsion. Lead: PUT-avskaffande (DIW L2+).

**motions/** — 20 opposition motions, 13 on migration package. Unprecedented C+S+V+MP coordination in rejection. Lead: S (HD024151 KU) + C (HD024184 KU) on political transparency prop.

**committeeReports/** — KU34 (constitutional: abortion rights + association freedom + citizenship), CU31 (rental deregulation), JuU39 (psychological violence crime), NU21 (rural policy), CU30 (EPBD buildings). Lead: KU34 constitutional reform (DIW 8.75).

**interpellations/** — HD10492 + HD10493: V interpellations on aid cuts (Dousa). Lead: humanitarian accountability for biståndshalvering.

## Prior-Voteringar Enrichment

KU committee: search_voteringar by bet=KU, last 4 riksmöten → 0 results (no recent KU votes indexed yet for 2025/26; new riksmöte context). AU10 vote 2026-03-04 retrieved as proxy (multi-party Ja).

## Full-Text Fetch Outcomes

| dok_id | full_text_available | chars | retrieval |
|--------|--------------------:|------:|-----------|
| HD024184 | true | 30 569 | live |
| HD10494 | true | 5 201 | live |
| HD11812 | true | 5 182 | live |
| HD11813 | true | 5 168 | live |

**Full-text retrieved**: 4/4 documents

## IMF Economic Context

- **Status**: ok (WEO Apr-2026, vintageAgeMonths=1)
- **Pre-warm**: executed at job start
- **Sweden key indicators** (WEO Apr-2026):
  - GDP growth 2026f: ~2.3% NGDP_RPCH
  - Inflation 2025: ~1.8% (down from 10.9% peak 2022)
  - Gross debt/GDP: ~34.5% GGXWDG_NGDP
  - Unemployment: ~8.4% LUR
  - Riksbank rate: 2.25% (MFS_IR:FPOLM_PA)

## Statskontoret Relevance

- Implementation feasibility references: Migrationsverket (HD03262 backlog), DIGG (e-legitimation), rural municipalities (NU21)
- Statskontoret has documented DIGG capacity limitations; Migrationsverket processing backlogs

## Lagrådet Tracking

- HD03262 (PUT-avskaffande): Lagrådet review pending — yttrande expected June 2026
- HD03267 (säkerhetshot): Lagrådet review pending
- HD024184/KU: Motion opposes prop. 2025/26:258 — Lagrådet yttrande on prop. not yet public

