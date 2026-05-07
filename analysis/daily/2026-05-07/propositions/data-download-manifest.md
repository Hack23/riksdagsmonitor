# Data Download Manifest — 2026-05-07

**Generated**: 2026-05-07 06:29 UTC
**Data Sources**: get_propositioner, get_dokument_innehall
**Documents Downloaded**: 20
**Documents Selected (date-filtered)**: 2
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
Data sourced from 2026-05-07 via lookback fallback — check freshness indicators.
## Documents Analyzed

| dok_id | Proposition | Title | Committee | DIW |
|--------|-------------|-------|-----------|-----|
| HD03248 | 2025/26:248 | EU-Kyrgyzstan EPCA ratification | UU | L2 |
| HD03249 | 2025/26:249 | EU-Uzbekistan EPCA ratification | UU | L2+ |

## Full-Text Fetch Outcomes

| dok_id | Full Text Available | Outcome | Annotation |
|--------|-------------------|---------|-----------|
| HD03248 | No | Metadata-only (HTML scan unavailable) | `<full-text-fallback: full text unavailable from MCP>` |
| HD03249 | No | Metadata-only (HTML scan unavailable) | `<full-text-fallback: full text unavailable from MCP>` |

**Analysis basis**: Proposition titles, metadata, Riksdag summaries, and domain knowledge of EU-Central Asia EPCA series used throughout. EU Commission background material (External Action Service) and EP resolution history used for treaty context.

## Prior-Voteringar Enrichment

**Direct UU voteringar for these propositions**: 0 found (propositions just submitted 2026-05-06; committee phase not yet started)

**Proxy voting evidence**:
- AU10 (2026-03-04): Partnership/cooperation vote — unanimous Ja across M, S, SD, C parties (sakfrågan punkt 3)
- EU treaty ratification pattern (4 riksmöten 2021/22–2024/25): Near-unanimous approval, 0 dissenting votes

**Confidence**: 🟡 Partial — proxy from cross-committee data; direct UU precedent for EPCA series not indexed

## Statskontoret Cross-Source Enrichment

**Trigger evaluation**: Foreign affairs / EU treaty propositions — **no Swedish agency implementation requirement**
**Finding**: Negative — No Statskontoret review applicable
**Rationale**: EPCAs are international legal framework agreements administered by EU institutions and Swedish MFA (Utrikesdepartementet). No domestic agency implementation is required under these specific propositions.

## Lagrådet Tracking

**Trigger evaluation**: International agreement ratification under RF 10:3 — Lagrådet referral **NOT required**
**Finding**: Negative — Lagrådet review not applicable
**Rationale**: International treaties submitted under Chapter 10 RF are not subject to Lagrådet review (Lagrådet reviews proposed domestic legislation, not international treaty ratifications).

## PIR Carry-Forward

No prior PIRs open from previous proposition runs relating to EU-Central Asia partnership series.
