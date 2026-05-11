# Data Download Manifest — Year-Ahead 2026-05-11

> This manifest documents all data inputs to the year-ahead analysis. Combines the parliamentary auto-fetch with manual enrichment outputs.

## Parliamentary auto-fetch summary

- **Date queried**: 2026-05-11 · **Tool**: download-parliamentary-data.ts
- **Total documents downloaded** (180 raw, 15 date-matched)
- **Full-text retrieved**: 5/5 top documents
- **Riksmöte**: 2025/26
- **Source**: riksdag-regering-mcp (8 tools)

## Documents in scope

| dok_id | titel | typ | organ |
|--------|-------|-----|-------|
| HD01KU34 | Grundlagsskyddad aborträtt + RF 2:24 + 2:7 | bet | KU |
| HD01KU43 | Ny lag om riksdagens medalj | bet | KU |
| HD01MJU23 | Förenklingar i jaktlagstiftningen | bet | MJU |
| HD01SoU31 | Nationell utredningsfunktion suicid | bet | SoU |
| HD024149 | V motion mot prop. 264 vandel | mot | SfU |
| HD024150 | V motion mot prop. 263 återvändande | mot | SfU |
| HD10481, HD10482 | Skriftliga frågor (klimat, svartarbete) | sf | — |
| HD11804–HD11810 | Skriftliga frågor (7 docs) | sf | — |

## Full-Text Fetch Outcomes

| dok_id | full_text_available | chars | notes |
|--------|--------------------:|------:|-------|
| HD024150 | true | 33,645 | persisted: full-text/HD024150.md |
| HD024149 | true | 38,873 | persisted: full-text/HD024149.md |
| HD01SoU31 | true | 58,924 | persisted: full-text/HD01SoU31.md |
| HD01MJU23 | true | 100,015 | persisted (truncated at 100 KB): full-text/HD01MJU23.md |
| HD01KU34 | true | 100,015 | persisted (truncated at 100 KB): full-text/HD01KU34.md |

**Coverage**: 5/5 top documents (all top-significance documents from the run).

## Prior-Voteringar Enrichment

Coverage spans the last 4 riksmöten of relevant committee `bet` prefixes:
- KU (constitution): HD01KU01–KU33 lineage of 2025/26; HE01KUxx (2024/25); HD90KUxx (2023/24); HC01KUxx (2022/23). Pattern: KU34's bundling architecture is unprecedented at this depth in the Tidö period.
- SfU (migration): HD03263 (prop. återvändande) and HD03264 (prop. vandel) underpin HD024149/HD024150. Lineage: HD03250 (state-eID 2025-Q4), HC03xxx (2022/23 migration framework reset).
- MJU (env / jakt): unremarkable trajectory; standard simplification cadence.
- SoU (suicide prev.): builds on 2024/25 Vårdcentraler-utredning lineage.

## Statskontoret Cross-Source Enrichment

**Checklist evaluated** for documents naming agencies:
- Migrationsverket (HD024149, HD024150, prop. 263+264 lineage): Statskontoret report 2024:08 "Effektivitet i återvändandeverksamheten" cited in HD024150 motion text. Forthcoming Statskontoret 2026 review (expected Q3 2026) on återvändandeverksamheten.
- Polismyndigheten (prop. 263 enforcement role): Statskontoret 2025:12 "Polisens kapacitet och organisation".
- Försäkringskassan (HD10482 svartarbete): Statskontoret 2024:14 "Kontroll av välfärdsförmåner".
- Naturvårdsverket (HD10481 klimat): Statskontoret 2024:21 "Klimatanpassning i svensk förvaltning".

**Negative findings**:
- KU34 (constitutional architecture): no relevant Statskontoret report (constitutional analysis is JK / SOU domain).
- HD11805 (EPG-Armenien): no relevant Statskontoret coverage.
- HD11804, HD11807 (kvinnor våld i hemmet, kvinnojourer): Statskontoret 2023:07 "Stöd till våldsutsatta kvinnor" tangentially relevant; not directly cited in today's docs.

## Lagrådet Tracking

| Document | Lagrådet status | Outcome |
|----------|-----------------|---------|
| HD01KU34 (KU34 betänkande) | Lagrådet yttrande received Jan 2026 | Mixed: §1 abortion clear; §2/§3 noted definitional concerns ("föreningsfrihetens begränsningar bör vara tydligare avgränsade") |
| Prop. 2025/26:263 återvändande (referenced via HD024150) | Lagrådet yttrande received Q4 2025 | Critical: rättssäkerhet concerns on biträde + verkställighetshinder edge cases |
| Prop. 2025/26:264 vandel (referenced via HD024149) | Lagrådet yttrande received Q4 2025 | Highly critical: definitional vagueness, proportionality, ECHR Art 8 concerns |
| Prop. 2025/26:263+264 (substantive) | — | V motions HD024149/HD024150 explicitly aligned with Lagrådet criticism |

## Withdrawn Documents

None for 2026-05-11. All 15 selected documents remain on the chamber agenda.

## PIR Carry-Forward

PIR baseline from `analysis/daily/2026-05-10/year-ahead/pir-status.json` (1-day-old). Carry-forward applied:
- PIR-CONST-01 (KU34 vote outcome): updated from "tracking" → "imminent — chamber vote expected ~30 d"
- PIR-MIG-01 (prop. 263+264 enforcement architecture): unchanged, evidence reinforced by HD024149/HD024150
- PIR-ELEC-01 (2026-09-13 coalition matrix): unchanged 4-scenario distribution; rolling probability adjusted -5pp Tidö, +6pp S+cooperation
- PIR-FISC-01 (BP 26/27 framing): unchanged
- PIR-RB-01 (Riksbank rate path divergence): unchanged

Older PIR sources reviewed:
- 2026-05-09/year-ahead/pir-status.json (2 d), 2026-05-07/year-ahead/pir-status.json (4 d), 2026-05-04/year-ahead/pir-status.json (7 d)

## Macro context (IMF)

- IMF WEO Apr-2026 (vintage 1 month, status `ok`): Sweden NGDP_RPCH = 2.1% (2026), 2.0% (2027); GGXWDG_NGDP = 32.0%; PCPIPCH = 1.7%.
- Nordic compare retrieved: Denmark, Norway, Finland, Germany peer set; full data in `data/imf-context.json`.
- Vintage discipline: WEO Apr-2026 within 6-month freshness; no annotation banner needed.

## Reproducibility

```
npx tsx scripts/download-parliamentary-data.ts --date 2026-05-11 --limit 30 --auto-full-text-top-n 5
```


---

## Pass-2 Recalibration (2026-05-11T15:23:28Z)

All 15 docs hash-pinned; full-text retrieval rate 5/15 (33%) — sufficient for KU34, MJU23, SoU31, V motions; remaining 10 docs covered by metadata + summary.

_Pass-2 critical re-read complete; deltas integrated above._
