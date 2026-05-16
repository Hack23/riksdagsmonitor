# Data Download Manifest — 2026-05-16

**Generated**: 2026-05-16 12:32 UTC
**Data Sources**: get_propositioner, get_motioner, get_betankanden, search_voteringar, search_anforanden, get_fragor, get_interpellationer, get_dokument_innehall
**Documents Downloaded**: 210
**Documents Selected (date-filtered)**: 4
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
- **interpellations**: 30 documents

## Data Quality Notes

All documents sourced from official riksdag-regering-mcp API.
Data sourced from 2026-05-15 via lookback fallback — check freshness indicators.

## MCP Query Diagnostics

| tool | query | result_count | coverage_state | notes |
|------|-------|-------------:|----------------|-------|
| get_propositioner | `{"limit":30,"rm":"2025/26"}` | 30 | metadata_only |  |
| get_motioner | `{"limit":30,"rm":"2025/26"}` | 30 | metadata_only |  |
| get_betankanden | `{"limit":30,"rm":"2025/26"}` | 30 | metadata_only |  |
| search_voteringar | `{"limit":30,"rm":"2025/26"}` | 30 | metadata_only |  |
| search_anforanden | `{"limit":30,"rm":"2025/26"}` | 30 | metadata_only |  |
| get_fragor | `{"limit":30,"rm":"2025/26"}` | 30 | metadata_only |  |
| get_interpellationer | `{"limit":30,"rm":"2025/26"}` | 30 | metadata_only |  |

## MCP Coverage State

| dok_id | coverage_state | retrieval | tool | result_count | notes |
|--------|----------------|-----------|------|-------------:|-------|
| HD024184 | full_text | live | get_dokument_innehall | 1 | full-text/HD024184.md |
| HD11813 | full_text | live | get_dokument_innehall | 1 | full-text/HD11813.md |
| HD11812 | full_text | live | get_dokument_innehall | 1 | full-text/HD11812.md |
| HD10494 | full_text | live | get_dokument_innehall | 1 | full-text/HD10494.md |

## Full-Text Fetch Outcomes

| dok_id | coverage_state | full_text_available | chars | retrieval | notes |
|--------|----------------|--------------------:|------:|-----------|-------|
| HD024184 | full_text | true | 30569 | live | persisted: full-text/HD024184.md |
| HD11813 | full_text | true | 5169 | live | persisted: full-text/HD11813.md |
| HD11812 | full_text | true | 5183 | live | persisted: full-text/HD11812.md |
| HD10494 | full_text | true | 5202 | live | persisted: full-text/HD10494.md |

**Full-text retrieved**: 4/4 top documents

## Deferred Retrieval Queue

| processed | resolved | retained | expired | enqueued |
|----------:|---------:|---------:|--------:|---------:|
| 0 | 0 | 0 | 0 | 0 |