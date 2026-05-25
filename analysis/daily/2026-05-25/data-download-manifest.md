# Data Download Manifest — 2026-05-25

**Generated**: 2026-05-25 18:39 UTC
**Data Sources**: get_propositioner, get_motioner, get_betankanden, search_voteringar, search_anforanden, get_fragor, get_dokument_innehall
**Documents Downloaded**: 180
**Documents Selected (date-filtered)**: 6
**Produced By**: download-parliamentary-data script (data download only)

> ℹ️ **Data-Only Pipeline**: This script downloads and persists raw data.
> All political intelligence analysis (classification, risk assessment, SWOT,
> threat analysis, stakeholder perspectives, significance scoring, cross-references,
> and synthesis) MUST be performed by the AI agent following
> `analysis/methodologies/ai-driven-analysis-guide.md` and using templates
> from `analysis/templates/`.

## Document Counts by Type

- **propositions**: 30 documents
- **motions**: 30 documents
- **committeeReports**: 30 documents
- **votes**: 30 documents
- **speeches**: 30 documents
- **questions**: 30 documents
- **interpellations**: 0 documents

## Data Quality Notes

All documents sourced from official riksdag-regering-mcp API.

## MCP Query Diagnostics

| tool | query | result_count | coverage_state | notes |
|------|-------|-------------:|----------------|-------|
| get_propositioner | `{"limit":30,"rm":"2025/26"}` | 30 | metadata_only |  |
| get_motioner | `{"limit":30,"rm":"2025/26"}` | 30 | metadata_only |  |
| get_betankanden | `{"limit":30,"rm":"2025/26"}` | 30 | metadata_only |  |
| search_voteringar | `{"limit":30,"rm":"2025/26"}` | 30 | metadata_only |  |
| search_anforanden | `{"limit":30,"rm":"2025/26"}` | 30 | metadata_only |  |
| get_fragor | `{"limit":30,"rm":"2025/26"}` | 30 | metadata_only |  |
| get_interpellationer | `{"limit":30,"rm":"2025/26"}` | 0 | fetch_error | MCP request failed: MCP tool error: calling "tools/call": Internal error |

## MCP Coverage State

| dok_id | coverage_state | retrieval | tool | result_count | notes |
|--------|----------------|-----------|------|-------------:|-------|
| HD01UU24 | full_text | live | get_dokument_innehall | 1 | full-text/HD01UU24.md |
| HD01JuU47 | full_text | live | get_dokument_innehall | 1 | full-text/HD01JuU47.md |
| HD01JuU48 | full_text | live | get_dokument_innehall | 1 | full-text/HD01JuU48.md |
| HD01UU19 | full_text | live | get_dokument_innehall | 1 | full-text/HD01UU19.md |
| HD11836 | full_text | live | get_dokument_innehall | 1 | full-text/HD11836.md |
| HD11837 | full_text | live | get_dokument_innehall | 1 | full-text/HD11837.md |

## Full-Text Fetch Outcomes

| dok_id | coverage_state | full_text_available | chars | retrieval | notes |
|--------|----------------|--------------------:|------:|-----------|-------|
| HD01UU24 | full_text | true | 952 | live | persisted: full-text/HD01UU24.md |
| HD01JuU47 | full_text | true | 944 | live | persisted: full-text/HD01JuU47.md |
| HD01JuU48 | full_text | true | 932 | live | persisted: full-text/HD01JuU48.md |
| HD01UU19 | full_text | true | 78578 | live | persisted: full-text/HD01UU19.md |
| HD11836 | full_text | true | 4175 | live | persisted: full-text/HD11836.md |
| HD11837 | full_text | true | 3086 | live | persisted: full-text/HD11837.md |

**Full-text retrieved**: 6/6 top documents

## Deferred Retrieval Queue

| processed | resolved | retained | expired | enqueued |
|----------:|---------:|---------:|--------:|---------:|
| 0 | 0 | 0 | 0 | 0 |