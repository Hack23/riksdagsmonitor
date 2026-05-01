# Data Download Manifest — 2026-05-01

**Generated**: 2026-05-01 06:31 UTC
**Data Sources**: get_propositioner, get_dokument_innehall
**Documents Downloaded**: 50
**Documents Selected (date-filtered)**: 8
**Produced By**: download-parliamentary-data script (data download only)

> ℹ️ **Data-Only Pipeline**: This script downloads and persists raw data.
> All political intelligence analysis (classification, risk assessment, SWOT,
> threat analysis, stakeholder perspectives, significance scoring, cross-references,
> and synthesis) MUST be performed by the AI agent following
> `analysis/methodologies/ai-driven-analysis-guide.md` and using templates
> from `analysis/templates/`.

## Document Counts by Type

- **propositions**: 50 documents
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

| dok_id | Method | Status | Content size |
|--------|--------|--------|-------------|
| HD03262 | `riksdag-regering-get_dokument_innehall` | **SUCCESS** | ~45KB HTML fullContent |
| HD03263 | `riksdag-regering-get_dokument_innehall` | **SUCCESS** | ~38KB HTML fullContent |
| HD03264 | `riksdag-regering-get_dokument_innehall` | PARTIAL (summary only) | ~8KB summary |
| HD03265 | `riksdag-regering-get_dokument_innehall` | PARTIAL (summary only) | ~7KB summary |
| HD03254 | `riksdag-regering-get_dokument_innehall` | PARTIAL (summary only) | ~6KB summary |
| HD03258 | `riksdag-regering-get_dokument_innehall` | PARTIAL (summary only) | ~5KB summary |
| HD03251 | `riksdag-regering-get_dokument_innehall` | PARTIAL (summary only) | ~7KB summary |
| HD03260 | `riksdag-regering-get_dokument_innehall` | PARTIAL (summary only) | ~4KB summary |

**Full-text successes**: 2 (HD03262, HD03263) — meets gate requirement ≥2 successes

## Prior-Voteringar Enrichment

`search_voteringar` called for SfU 2024/25, FöU 2024/25, JuU 2024/25, and keyword "uppehållstillstånd":
- SfU 2024/25: 0 directly comparable results
- FöU 2024/25: 0 directly comparable results
- keyword "uppehållstillstånd" AU10 2026-03-04: unrelated single result

**Conclusion**: No directly comparable prior vote found. Coalition mathematics based on party position statements and 2022 mandate composition.

## Statskontoret Cross-Source Enrichment

| Agency | Statskontoret reference | Relevance |
|--------|------------------------|-----------|
| Migrationsverket | statskontoret.se/publikationer/2022/migrationsverkets-handlaggning/ | Backlog and capacity audit — directly relevant to HD03263 implementation feasibility |
| Polismyndigheten | statskontoret.se publication on Polismyndigheten operational capacity | Returns operations (HD03263) |
| Förvarstjänst | statskontoret.se/publikationer/2023/forvarsverksamheten/ | Detention (förvar) capacity — directly relevant to HD03265 |

## Lagrådet Tracking

| dok_id | Lagrådet remiss sent | Yttrande published | Status |
|--------|---------------------|-------------------|--------|
| HD03265 | Pending (proposition submitted 2026-04-30) | NOT YET | **CRITICAL — FI-2 monitor** |
| HD03262 | Pending | NOT YET | Monitor |
| HD03263 | Pending | NOT YET | Monitor |

## PIR Carry-Forward

PIR-1 (Vårpropositionen agency capacity) carried forward from 2026-04-30 cycle. Status: PARTIALLY ANSWERED. See pir-status.json for full PIR register.