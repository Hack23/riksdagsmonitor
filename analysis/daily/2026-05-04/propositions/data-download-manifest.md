# Data Download Manifest — 2026-05-04

**Generated**: 2026-05-04 08:25 UTC
**Data Sources**: get_propositioner, get_dokument_innehall
**Documents Downloaded**: 20
**Documents Selected (date-filtered)**: 8
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
Data sourced from 2026-04-30 via lookback fallback — check freshness indicators.
## Full-Text Fetch Outcomes

| Document | Status | Notes |
|---------|--------|-------|
| HD03251 | SUMMARY_ONLY | `text` field is HTML with embedded CSS; `full_text` field empty. Used `notis/summary` field (~500 chars) |
| HD03254 | SUMMARY_ONLY | Same issue — HTML text field. Summary sufficient for policy analysis |
| HD03258 | SUMMARY_ONLY | Same — summary used |
| HD03260 | SUMMARY_ONLY | Same — summary used |
| HD03262 | SUMMARY_ONLY | Most significant proposition — summary plus official title/dept metadata used; full HTML not extracted |
| HD03263 | SUMMARY_ONLY | Summary used |
| HD03264 | SUMMARY_ONLY | Summary used |
| HD03265 | SUMMARY_ONLY | Summary used |

**Technical note**: riksdagen.se API returns proposition content as inline HTML with `<style>` blocks in the `text` field. The `full_text` field returns null. Python-based HTML stripping was insufficient. Analysis relies on official summaries plus structural knowledge of policy area. Confidence impact: MEDIUM (summary-level, not full-text analysis).

## Prior-Voteringar Enrichment

| Committee | Search Result | Notes |
|-----------|--------------|-------|
| SfU (2025/26) | No results for beteckning=SfU | Propositions in current batch are at committee stage — not voted |
| FöU (2025/26) | No results for beteckning=FöU | Same |
| KU (2025/26) | No results for beteckning=KU | Same |
| AU10 (2025/26) | 20 results from 2026-03-04 | This is only voting record available for 2025/26 rm via search |

**Assessment**: Prior committee voting records for 2025/26 propositions in this batch not available — all propositions are pre-vote stage. AU10 (Arbetsmarknadsutskottet) voting data retrieved as the only available 2025/26 rm data, providing general voting alignment context.

## Statskontoret Cross-Source Enrichment

No direct Statskontoret publications identified for the specific propositions in this batch. Statskontoret evaluations would be relevant for HD03251 (care integration) and HD03263 (return operations effectiveness) but are not yet available for 2025/26 propositions.

## Lagrådet Tracking

| Proposition | Lagrådet Status | Notes |
|------------|----------------|-------|
| HD03262 | EXPECTED — opinion not yet published | Permanent permit elimination + EU pact = constitutional dimensions |
| HD03265 | EXPECTED — opinion not yet published | Detention expansion = ECHR Art. 5 risk |
| HD03264 | POSSIBLY — gang membership provision | Without criminal conviction provision is legally novel |
| HD03254 | LIKELY — war powers delegation | Constitutional dimension |
| Others | Standard review | No specific concerns anticipated |

**Action required**: Monitor Lagrådet website for opinions — expected within 4-6 weeks of proposition submission.

## PIR Carry-Forward

See `pir-status.json` for full PIR status.

**Active PIR items from previous cycle**:
- PIR-MIG-01: Migration trajectory → **ANSWERED** by HD03262-HD03265
- PIR-DEF-01: NATO integration → **PARTIALLY ANSWERED** by HD03254
- PIR-ELEC-01: Pre-election legislative completion → **ANSWERED**
- PIR-ECON-01: Fiscal context → **PARTIALLY ANSWERED** (IMF WEO April 2026 data used)

**New PIR items raised**:
- PIR-LAGR-01: Lagrådet opinions (expected 2026-05-25)
- PIR-COAL-01: C party coalition preference (watch July-August 2026)
- PIR-MP-01: MP threshold risk (ongoing monitoring)
