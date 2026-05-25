# Data Download Manifest — 2026-05-25

**Generated**: 2026-05-25 08:06 UTC
**Data Sources**: get_interpellationer, get_dokument_innehall
**Documents Downloaded**: 20
**Documents Selected (date-filtered)**: 4
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
- **committeeReports**: 0 documents
- **votes**: 0 documents
- **speeches**: 0 documents
- **questions**: 0 documents
- **interpellations**: 20 documents

## Data Quality Notes

All documents sourced from official riksdag-regering-mcp API.

## MCP Query Diagnostics

| tool | query | result_count | coverage_state | notes |
|------|-------|-------------:|----------------|-------|
| get_interpellationer | `{"limit":20,"rm":"2025/26"}` | 20 | metadata_only |  |

## MCP Coverage State

| dok_id | coverage_state | retrieval | tool | result_count | notes |
|--------|----------------|-----------|------|-------------:|-------|
| HD10510 | full_text | live | get_dokument_innehall | 1 | summary present |
| HD10509 | full_text | live | get_dokument_innehall | 1 | summary present |
| HD10511 | full_text | live | get_dokument_innehall | 1 | summary present |
| HD10512 | full_text | live | get_dokument_innehall | 1 | summary present |

## Deferred Retrieval Queue

| processed | resolved | retained | expired | enqueued |
|----------:|---------:|---------:|--------:|---------:|
| 0 | 0 | 0 | 0 | 0 |