# Data Download Manifest — 2026-05-29

**Generated**: 2026-05-29 06:18 UTC
**Data Sources**: get_betankanden, get_dokument_innehall
**Documents Downloaded**: 20
**Documents Selected (date-filtered)**: 7
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
Data sourced from 2026-05-28 via lookback fallback — check freshness indicators.

## MCP Query Diagnostics

| tool | query | result_count | coverage_state | notes |
|------|-------|-------------:|----------------|-------|
| get_betankanden | `{"limit":20,"rm":"2025/26"}` | 20 | metadata_only |  |

## MCP Coverage State

| dok_id | coverage_state | retrieval | tool | result_count | notes |
|--------|----------------|-----------|------|-------------:|-------|
| HD01TU18 | full_text | live | get_dokument_innehall | 1 | full-text/HD01TU18.md |
| HD01JuU35 | full_text | live | get_dokument_innehall | 1 | full-text/HD01JuU35.md |
| HD01MJU27 | full_text | live | get_dokument_innehall | 1 | full-text/HD01MJU27.md |
| HD01TU17 | full_text | live | get_dokument_innehall | 1 | full-text/HD01TU17.md |
| HD01NU20 | full_text | live | get_dokument_innehall | 1 | full-text/HD01NU20.md |
| HD01UbU23 | full_text | live | get_dokument_innehall | 1 | full-text/HD01UbU23.md |
| HD01CU44 | full_text | live | get_dokument_innehall | 1 | full-text/HD01CU44.md |

## Full-Text Fetch Outcomes

| dok_id | coverage_state | full_text_available | chars | retrieval | notes |
|--------|----------------|--------------------:|------:|-----------|-------|
| HD01TU18 | full_text | true | 41984 | live | persisted: full-text/HD01TU18.md |
| HD01JuU35 | full_text | true | 100015 | live | persisted: full-text/HD01JuU35.md |
| HD01MJU27 | full_text | true | 87293 | live | persisted: full-text/HD01MJU27.md |
| HD01TU17 | full_text | true | 41706 | live | persisted: full-text/HD01TU17.md |
| HD01NU20 | full_text | true | 100015 | live | persisted: full-text/HD01NU20.md |
| HD01UbU23 | full_text | true | 100015 | live | persisted: full-text/HD01UbU23.md |
| HD01CU44 | full_text | true | 998 | live | persisted: full-text/HD01CU44.md |

**Full-text retrieved**: 7/7 selected documents

## Deferred Retrieval Queue

| processed | resolved | retained | expired | enqueued |
|----------:|---------:|---------:|--------:|---------:|
| 0 | 0 | 0 | 0 | 0 |