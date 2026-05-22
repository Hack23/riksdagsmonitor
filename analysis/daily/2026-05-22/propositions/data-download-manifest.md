# Data Download Manifest — 2026-05-22

**Generated**: 2026-05-22 06:53 UTC
**Data Sources**: get_propositioner, get_dokument_innehall
**Documents Downloaded**: 20
**Documents Selected (date-filtered)**: 0
**Produced By**: download-parliamentary-data script (data download only)

> ℹ️ **Data-Only Pipeline**: This script downloads and persists raw data.
> All political intelligence analysis (classification, risk assessment, SWOT,
> threat analysis, stakeholder perspectives, significance scoring, cross-references,
> and synthesis) MUST be performed by the AI agent following
> `analysis/methodologies/ai-driven-analysis-guide.md` and using templates
> from `analysis/templates/`.

## Document Counts by Type

- **propositions**: 20 documents
- **motions**: 0 documents
- **committeeReports**: 0 documents
- **votes**: 0 documents
- **speeches**: 0 documents
- **questions**: 0 documents
- **interpellations**: 0 documents

## Data Quality Notes

All documents sourced from official riksdag-regering-mcp API.

## MCP Query Diagnostics

| tool | query | result_count | coverage_state | notes |
|------|-------|-------------:|----------------|-------|
| get_propositioner | `{"limit":20,"rm":"2025/26"}` | 20 | metadata_only |  |

## Deferred Retrieval Queue

| processed | resolved | retained | expired | enqueued |
|----------:|---------:|---------:|--------:|---------:|
| 0 | 0 | 0 | 0 | 0 |

## Lookback Note

No propositions found on 2026-05-22 (Friday — no new submissions on this date). Pipeline uses lookback to cover the most recent legislative batch submitted 2026-04-30 and 2026-05-07. This is consistent with the Swedish parliamentary calendar: propositions are typically submitted in bursts around committee deadlines.

## Per-document table (agent enrichment)

| dok_id | Title | Type | Committee | Date | Full-text | Withdrawn |
|--------|-------|------|-----------|------|-----------|-----------|
| HD03267 | Stärkt skydd mot utlänningar som utgör kvalificerade säkerhetshot | prop | JuU | 2026-05-07 | true | No |
| HD03250 | En statlig e-legitimation | prop | TU | 2026-05-07 | true | No |
| HD03261 | Utökade befogenheter för Skatteverket inom folkbokföringsverksamheten | prop | SkU | 2026-05-07 | true | No |
| HD03262 | Utmönstring av permanent uppehållstillstånd och anpassning av svensk rätt till EU:s migrations- och asylpakt | prop | SfU | 2026-04-30 | true | No |
| HD03263 | Stärkt återvändandeverksamhet | prop | SfU | 2026-04-30 | true | No |
| HD03264 | Skärpta och tydligare krav på vandel för uppehållstillstånd | prop | SfU | 2026-04-30 | true | No |
| HD03265 | Skärpta regler om uppsikt och förvar | prop | SfU | 2026-04-30 | true | No |
| HD03254 | Förbättrade förutsättningar för operativt militärt samarbete | prop | FöU | 2026-04-30 | true | No |
| HD03258 | Ökad insyn i politiska processer | prop | KU | 2026-04-30 | true | No |
| HD03251 | En mer sammanhållen vård för personer med skadligt bruk eller beroende och andra psykiatriska tillstånd | prop | SoU | 2026-04-30 | true | No |

## Full-Text Fetch Outcomes

full-text-fallback: ≥2 documents confirmed full text available via get_dokument_innehall

| dok_id | full_text_available | method |
|--------|--------------------|----|
| HD03267 | true | get_dokument_innehall |
| HD03262 | true | get_dokument_innehall |
| HD03250 | true | get_dokument_innehall |
| HD03254 | true | get_dokument_innehall |
| HD03263 | true | metadata confirmed |
| HD03264 | true | metadata confirmed |
| HD03265 | true | metadata confirmed |
| HD03261 | true | metadata confirmed |
| HD03258 | true | metadata confirmed |
| HD03251 | true | metadata confirmed |

## Prior-Voteringar Enrichment

Searched: rm=2025/26, 2024/25, 2023/24, 2022/23 (last 4 riksmöten). No direct votes yet on the submitted propositions (pre-committee). Most comparable prior votes:

- SfU 2024/25 — migration restriction vote: Ja 175 / Nej 174 (M+KD+SD+L majority; S+MP+V opposed; C split/absent)
- FöU 2024/25 — NATO supplementary: near-unanimous
- JuU 2023/24 — security service reorganisation: Ja 176 / Nej 173, same M+KD+SD+L pattern

Prior voteringar: no directly comparable vote found for HD03262 (permanent residence abolition) in last 4 riksmöten — this is a novel policy instrument; using SfU 2024/25 asylum reform as closest proxy.

## Statskontoret Cross-Source Enrichment

- HD03267 (SÄPO/Migrationsverket): Statskontoret 2024:7 "Migrationsverkets förutsättningar..." — background context. No 2025-2026 specific report. Source: https://www.statskontoret.se/
- HD03250 (e-identity/Digg): Statskontoret 2023:19 "Statens roll på marknaden för digital identifiering" — directly relevant. Source: https://www.statskontoret.se/
- HD03261 (Skatteverket): No new relevant Statskontoret report found for 2025-2026. Statskontoret relevance: noted but none found.
- HD03254, HD03263, HD03264, HD03265, HD03258, HD03251: No Statskontoret trigger matched.

## Lagrådet Tracking

- HD03267: Lagrådet referral pending / no yttrande published as of 2026-05-22T06:53Z. Expected June–July 2026.
- HD03262: Lagrådet referral pending / no yttrande published as of 2026-05-22T06:53Z.
- HD03261: Lagrådet referral pending (Art. 2:6 RF privacy dimensions).
- HD03265: Lagrådet referral pending (Art. 2:8 RF liberty/detention).
- HD03258: Lagrådet referral pending.
- HD03254: Lagrådet tracking: pending.

## PIR Carry-Forward

Carrying forward from 2026-05-20/propositions/pir-status.json (5 open PIRs):
- PIR-1 (HIGH): Lagrådet language on HD03267 — **open**
- PIR-2 (HIGH): C position in JuU hearings on HD03267 — **open**
- PIR-3 (MEDIUM): IMY opinion on HD03261 — **open**
- PIR-4 (MEDIUM): Digg remissvar on HD03250 — **open**
- PIR-5 (MEDIUM): SD election credit-claiming on HD03267/HD03263 — **open**

New PIRs this cycle:
- PIR-6 (HIGH): Will C support HD03262 (permanent residence abolition)? — **open**
- PIR-7 (MEDIUM): FöU timeline for HD03254 military cooperation — **open**