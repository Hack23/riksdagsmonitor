# Data Download Manifest — 2026-05-20

**Generated**: 2026-05-20 05:00 UTC
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
Data sourced from 2026-05-19 via lookback fallback — check freshness indicators.

## MCP Query Diagnostics

| tool | query | result_count | coverage_state | notes |
|------|-------|-------------:|----------------|-------|
| get_betankanden | `{"limit":20,"rm":"2025/26"}` | 20 | metadata_only |  |

## MCP Coverage State

| dok_id | coverage_state | retrieval | tool | result_count | notes |
|--------|----------------|-----------|------|-------------:|-------|
| HD01SkU28 | full_text | live | get_dokument_innehall | 1 | summary present |
| HD01SfU26 | full_text | live | get_dokument_innehall | 1 | summary present |
| HD01JuU36 | full_text | live | get_dokument_innehall | 1 | summary present |
| HD01CU39 | full_text | live | get_dokument_innehall | 1 | summary present |
| HD01CU33 | full_text | live | get_dokument_innehall | 1 | summary present |
| HD01CU32 | metadata_only | live | get_betankanden | 20 | list payload only; get_dokument_innehall not attempted in this run |
| HD01MJU26 | metadata_only | live | get_betankanden | 20 | list payload only; get_dokument_innehall not attempted in this run |
| HD01MJU25 | metadata_only | live | get_betankanden | 20 | list payload only; get_dokument_innehall not attempted in this run |
| HD01UbU29 | metadata_only | live | get_betankanden | 20 | list payload only; get_dokument_innehall not attempted in this run |

## Deferred Retrieval Queue

| processed | resolved | retained | expired | enqueued |
|----------:|---------:|---------:|--------:|---------:|
| 0 | 0 | 0 | 0 | 0 |