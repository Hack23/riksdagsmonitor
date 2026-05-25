# Data Download Manifest — 2026-05-25

**Generated**: 2026-05-25 05:14 UTC
**Data Sources**: get_betankanden, get_dokument_innehall
**Documents Downloaded**: 20
**Documents Selected (date-filtered)**: 9
**Produced By**: download-parliamentary-data script (data download only)

> ℹ️ **Data-Only Pipeline**: This script downloads and persists raw data.
> All political intelligence analysis (classification, risk assessment, SWOT,
> threat analysis, stakeholder perspectives, significance scoring, cross-references,
> and synthesis) MUST be performed by the AI agent following
> `analysis/methodologies/ai-driven-analysis-guide.md` and using templates
> from `analysis/templates/`.

## Document Counts by Type

- **propositions**: 0 documents
- **motions**: 0 documents
- **committeeReports**: 20 documents
- **votes**: 0 documents
- **speeches**: 0 documents
- **questions**: 0 documents
- **interpellations**: 0 documents

## Data Quality Notes

All documents sourced from official riksdag-regering-mcp API.
Data sourced from 2026-05-22 via lookback fallback — check freshness indicators.

## MCP Query Diagnostics

| tool | query | result_count | coverage_state | notes |
|------|-------|-------------:|----------------|-------|
| get_betankanden | `{"limit":20,"rm":"2025/26"}` | 20 | metadata_only |  |

## MCP Coverage State

| dok_id | coverage_state | retrieval | tool | result_count | notes |
|--------|----------------|-----------|------|-------------:|-------|
| HD01FiU42 | full_text | live | get_dokument_innehall | 1 | summary present |
| HD01SfU37 | full_text | live | get_dokument_innehall | 1 | summary present |
| HD01UU12 | full_text | live | get_dokument_innehall | 1 | summary present |
| HD01UU11 | full_text | live | get_dokument_innehall | 1 | summary present |
| HD01UbU27 | full_text | live | get_dokument_innehall | 1 | summary present |
| HD01UbU22 | metadata_only | live | get_betankanden | 20 | list payload only; get_dokument_innehall not attempted in this run |
| HD01UbU19 | metadata_only | live | get_betankanden | 20 | list payload only; get_dokument_innehall not attempted in this run |
| HD01CU26 | metadata_only | live | get_betankanden | 20 | list payload only; get_dokument_innehall not attempted in this run |
| HD01FiU47 | metadata_only | live | get_betankanden | 20 | list payload only; get_dokument_innehall not attempted in this run |

## Deferred Retrieval Queue

| processed | resolved | retained | expired | enqueued |
|----------:|---------:|---------:|--------:|---------:|
| 0 | 0 | 0 | 0 | 0 |