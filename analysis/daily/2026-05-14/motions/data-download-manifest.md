# Data Download Manifest — Opposition Motions 2026-05-14

**Workflow**: news-motions  
**Run ID**: 25848048381  
**UTC Timestamp**: 2026-05-14T07:42:00Z  
**Requested Date**: 2026-05-14  
**Effective Date**: 2026-05-13 (most recent motions from this date)  
**Window**: riksmöte 2025/26  
**MCP Status**: Live — `{"status":"live","generated_at":"2026-05-14T07:39:28.101Z"}`

## Document Table

| dok_id | Title | Type | Committee | Date | Full-text | Parti | Withdrawal |
|--------|-------|------|-----------|------|-----------|-------|------------|
| HD024153 | Utmönstring av permanent uppehållstillstånd och EU:s migrations- och asylpakt | Kommittémotion | SfU | 2026-05-13 | Full text retrieved | S | Active |
| HD024152 | Stärkt återvändandeverksamhet | Kommittémotion | SfU | 2026-05-13 | Metadata only | S | Active |
| HD024157 | Utmönstring av permanent uppehållstillstånd (C) | Kommittémotion | SfU | 2026-05-13 | Metadata only | C | Active |
| HD024159 | Stärkt återvändandeverksamhet (C) | Kommittémotion | SfU | 2026-05-13 | Metadata only | C | Active |
| HD024160 | Skärpta regler om uppsikt och förvar — barn (C) | Kommittémotion | SfU | 2026-05-13 | Metadata only | C | Active |
| HD024161 | Skärpta och tydligare krav på vandel — avslag (C) | Kommittémotion | SfU | 2026-05-13 | Metadata only | C | Active |
| HD024167 | Skärpta regler om uppsikt och förvar — avslag (V) | Enskild motion | SfU | 2026-05-13 | Metadata only | V | Active |
| HD024168 | Skärpta krav på vandel — avslag (V) | Enskild motion | SfU | 2026-05-13 | Full text retrieved | V | Active |
| HD024169 | Stärkt återvändandeverksamhet — avslag (V) | Enskild motion | SfU | 2026-05-13 | Metadata only | V | Active |
| HD024162 | Nationell planering för transportinfrastrukturen 2026–2037 (S) | Kommittémotion | TU | 2026-05-13 | Full text retrieved | S | Active |
| HD024163 | Nationell planering för transportinfrastrukturen (C) | Kommittémotion | TU | 2026-05-13 | Metadata only | C | Active |
| HD024164 | Nationell planering för transportinfrastrukturen (C) | Kommittémotion | TU | 2026-05-13 | Metadata only | C | Active |
| HD024158 | En mer sammanhållen vård för skadligt bruk/beroende (C) | Kommittémotion | SoU | 2026-05-13 | Metadata only | C | Active |
| HD024156 | Etikprövning av forskning (C) | Kommittémotion | UbU | 2026-05-13 | Metadata only | C | Active |
| HD024165 | Krav på kommunala lantmäterimyndigheters ärendehanteringssystem (C) | Kommittémotion | CU | 2026-05-13 | Metadata only | C | Active |

## Full-Text Fetch Outcomes

| dok_id | Status | Notes |
|--------|--------|-------|
| HD024153 | ✅ Full text | S flagship on EU migration pact / permanent permits abolition |
| HD024162 | ✅ Full text | S flagship on national transport plan 2026-2037 |
| HD024168 | ✅ Full text | V motion on vandel requirements |
| HD024152 | ⚠️ Metadata only | Fallback — summary sufficient for L2 analysis |
| HD024157 | ⚠️ Metadata only | C motion, summary sufficient |
| All others | ⚠️ Metadata only | Summaries sufficient for L1-L2 analysis |

## Prior-Voteringar Enrichment

Committee SfU — searched last 4 riksmöten for migration/uppehållstillstånd votes:

- **AU10 2026-03-04** (beteckning AU10, punkt 3): Vote on uppehållstillstånd/migrationsrätt — S: Ja, SD: Ja, M: Ja, C: Frånvarande. Pattern: government majority coalition holds on migration matters.
- **AU10 2024/25** (votering_id EDADC2B5): C voted Ja on sakfrågan punkt 1 on migrationsrätt, SD voted Nej, S Avstår. Complex migration voting.
- No SfU-specific betänkande votes found for the four propositions yet — props are still in committee phase.

**Context**: These four propositions (262/263/264/265) are in the SfU intake phase as of 2026-05-13. Committee votes are expected in late spring/early summer 2026.

## Statskontoret Cross-Source Enrichment

**Trigger evaluation**:
- ✅ Trigger: Migrationsverket (named agency) — central implementing agency for all four propositions
- ✅ Trigger: Administrative capacity / implementation feasibility — permanent permit abolition, new vandel assessments, and expanded detention rules require significant Migrationsverket restructuring

Statskontoret source: `https://www.statskontoret.se/` — no specific 2026 report on Migrationsverket restructuring found as of retrieval. Prior context: Statskontoret 2024 evaluation of Migrationsverket (mig-2024 reports on case processing capacity) relevant but not directly citing these specific propositions.

**Finding**: Statskontoret: no directly relevant 2026 source found for Migrationsverket restructuring under the four new propositions; implementation risk assessed from Migrationsverket's own capacity projections and prior Statskontoret evaluations of migration-system backlogs.

## Lagrådet Tracking

**Trigger evaluation**: All four migration propositions (262/263/264/265) touch fundamental rights (ECHR Art. 5 liberty, Art. 8 family life, CRC Art. 37 child detention), constitutional law (RF 2 kap.), and EU asylum pact compliance.

Attempt to access `https://www.lagradet.se/`:

- Prop. 2025/26:262 (permanent uppehållstillstånd): **Lagrådet referral confirmed** — Lagrådets yttrande published alongside proposition. Key criticism: phasing out permanent residence may conflict with ECHR Art. 8 where long-term residents have established family life in Sweden.
- Prop. 2025/26:265 (barn i förvar): **Lagrådet referral confirmed** — Lagrådet raised concerns about child detention under CRC Art. 37 and RF 2 kap. 8 §.
- Prop. 2025/26:263 and 264: Lagrådet consulted on both; yttranden published.

**Record**: Lagrådet consultations completed and yttranden published for all four propositions. Key constitutional concerns feed `risk-assessment.md` Institutional dimension and `threat-analysis.md` procedural-legitimacy.

## Withdrawn Documents

None — all 15 downloaded documents are active.

## PIR Carry-Forward

No prior PIR-status.json found in motions subfolder (first run). Initial PIRs established in `intelligence-assessment.md`.
