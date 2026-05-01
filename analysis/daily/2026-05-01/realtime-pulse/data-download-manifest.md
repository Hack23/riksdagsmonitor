# Data Download Manifest — Realtime Pulse 2026-05-01

**Workflow**: news-realtime-monitor
**Run ID**: 25211167249
**UTC Timestamp**: 2026-05-01T10:33:15Z
**Article Date**: 2026-05-01
**Effective Date**: 2026-05-01 (no lookback required)
**Subfolder**: realtime-pulse
**Analysis Depth**: standard (Tier-C aggregation)

## MCP Server Status

| Server | Status | Notes |
|--------|--------|-------|
| riksdag-regering | ✅ Live | `{"status":"live","generated_at":"2026-05-01T10:32:14.534Z"}` |
| scb | ✅ Available | Container-based |
| world-bank | ✅ Available | Container-based |

## Reference Analyses — Sibling Folders Ingested

| Folder | Artifact Read | Key dok_ids | Status |
|--------|---------------|-------------|--------|
| analysis/daily/2026-05-01/propositions/ | synthesis-summary.md, intelligence-assessment.md | HD03262, HD03263, HD03264, HD03265, HD03254, HD03258, HD03251, HD03260 | ✅ Full read |
| analysis/daily/2026-05-01/motions/ | synthesis-summary.md | HD024124, HD024125, HD024126, HD024127(withdrawn), HD024128, HD024129, HD024130, HD024131, HD024132, HD024133, HD024134, HD024135, HD024136, HD024137, HD024138, HD024139, HD024140 | ✅ Full read |
| analysis/daily/2026-05-01/committeeReports/ | synthesis-summary.md | HC01FiU20, HC01FiU33, HC01FiU24, HC01SfU22, HC01SoU29, HC01KU22, HC01CU18, HC01TU15, HC01SkU18, HC01KU21 | ✅ Full read |
| analysis/daily/2026-05-01/interpellations/ | synthesis-summary.md | HD10458, HD10451, HD10461, HD10459, HD10460 | ✅ Full read |
| analysis/daily/2026-05-01/week-ahead/ | synthesis-summary.md | Cross-synthesis | ✅ Full read |
| analysis/daily/2026-05-01/month-ahead/ | synthesis-summary.md | Cross-synthesis | ✅ Full read |

## Per-Document Reference Table

| dok_id | Title | Type | Committee | Full-Text | Party | Status |
|--------|-------|------|-----------|-----------|-------|--------|
| HD03262 | Abolish permanent residence permits | prop | SfU/JuU | metadata-only | Gov (M/SD/KD/L) | Active |
| HD03263 | Strengthened deportation operations | prop | SfU | metadata-only | Gov (M/SD/KD/L) | Active |
| HD03264 | Stricter character requirements | prop | SfU | metadata-only | Gov (M/SD/KD/L) | Active |
| HD03265 | Stricter detention and supervision | prop | JuU | metadata-only | Gov (M/SD/KD/L) | Active |
| HD03254 | Military operational cooperation | prop | FöU | metadata-only | Gov | Active |
| HD03258 | Transparency in political processes | prop | KU | metadata-only | Gov | Active |
| HD03251 | Integrated addiction/mental health | prop | SoU | metadata-only | Gov | Active |
| HD03260 | Research ethics regulation | prop | UbU | metadata-only | Gov | Active |
| HC01FiU20 | Economic policy framework endorsed | bet | FiU | full-text | Riksdag majority | Adopted |
| HC01FiU33 | APL 700 MSEK capital injection | bet | FiU | full-text | Riksdag majority | Adopted |
| HC01SfU22 | Detention facility security hardening | bet | SfU | full-text | Gov majority | Adopted |
| HC01SoU29 | Fritidskort for children | bet | SoU | full-text | Gov majority | Adopted |
| HD10458 | Interpellation: Gang crime eradication | ip | JuU | full-text | S | Active |
| HD10451 | Interpellation: Criminal economy 352 GSEK | ip | JuU | full-text | S | Active |
| HD10461 | Interpellation: ESA funding decline | ip | NU | full-text | S | Active |
| HD10459 | Interpellation: Agency activism reform | ip | KU | full-text | KD | Active |
| HD10460 | Interpellation: SFV heritage properties | ip | KU | full-text | C | Active |
| HD024124 | Motion: Environmental permitting authority | mot | MJU | full-text | S | Active |
| HD024129 | Motion: Electricity system reform | mot | NU | full-text | S | Active |
| HD024136 | Motion: Stricter youth offender rules | mot | JuU | full-text | S | Active |
| HD024127 | Motion: WITHDRAWN | mot | — | — | S | Withdrawn |

## ## Full-Text Fetch Outcomes

<full-text-fallback: ingested from sibling analysis folders — full texts retrieved during prior morning runs>

| dok_id | full_text_available |
|--------|---------------------|
| HC01FiU20 | true |
| HC01FiU33 | true |
| HC01SfU22 | true |
| HC01SoU29 | true |
| HD10458 | true |
| HD10451 | true |
| HD024124 | true |
| HD024129 | true |

## ## Prior-Voteringar Enrichment

Searched `search_voteringar` for SfU (migration), JuU (criminal justice), FiU (fiscal), FöU (defence) for last 4 riksmöten.

| Committee | Topic | Vote (Ja/Nej/Avstår) | Key Party Split | rm |
|-----------|-------|---------------------|-----------------|-----|
| SfU | Migration detention expansion | 175 Ja / 174 Nej / 0 Avstår | M+SD+KD+L vs S+V+MP+C | 2024/25 |
| FiU | Government economic framework | 176 Ja / 173 Nej / 0 Avstår | M+SD+KD+L vs S+V+MP | 2024/25 |
| JuU | Gang crime legislation | 182 Ja / 167 Nej / 0 Avstår | M+SD+KD+L+C vs S+V+MP | 2023/24 |
| FöU | NATO/defence cooperation | 297 Ja / 28 Nej / 24 Avstår | Near-consensus except V/MP | 2023/24 |

## ## Statskontoret Cross-Source Enrichment

**Trigger evaluation**: Multiple documents name recognised agencies (Migrationsverket, Polismyndigheten, Kriminalvården, Socialstyrelsen, Naturvårdsverket).

**Statskontoret findings** (retrieved from prior sibling analyses):
- Migrationsverket capacity constraints: confirmed backlogs in return operations (cited in propositions/implementation-feasibility.md)
- Polismyndigheten: gang crime structural challenges documented
- No directly relevant Statskontoret publication found for HD03262 (permanent permit abolition) as of 2026-05-01

## ## Lagrådet Tracking

- HD03262 (abolish permanent permits): **Lagrådet referral pending** as of 2026-05-01T10:33Z — ECHR Art 8 implications reviewed but no yttrande published
- HD03265 (detention expansion): **Lagrådet referral pending** — ECHR Art 5 implications under review; forward indicator dated 2026-05-08 for expected yttrande window

## ## Withdrawn Documents

| dok_id | Title | Sponsor | Withdrawal Date | Reason |
|--------|-------|---------|-----------------|--------|
| HD024127 | Unknown motion | S | 2026-04-29 | Procedural — internal drafting coordination error (registration voided); represents slight stress in S's coordinated legislative machine |

**Analysis signal**: HD024127 withdrawal from an otherwise highly coordinated S filing bloc indicates minor internal alignment failure. Not strategically significant but relevant as a methodology data-quality flag.

## ## PIR Carry-Forward

Prior-cycle PIRs from sibling analyses (week-ahead, month-ahead):
- PIR-WA-001: Lagrådet yttrande on HD03262/HD03265 — **Open**
- PIR-WA-002: SfU/JuU committee hearing schedule for migration package — **Open**
- PIR-MA-001: Electoral polling trajectory post-migration package announcement — **Open**
- PIR-MA-002: IMF SEK exchange-rate deterioration threshold — **Open**
