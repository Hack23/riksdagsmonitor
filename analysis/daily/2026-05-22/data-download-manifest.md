# Data Download Manifest — 2026-05-22

**Generated**: 2026-05-22 14:15 UTC
**Data Sources**: get_propositioner, get_motioner, get_betankanden, search_voteringar, search_anforanden, get_fragor, get_interpellationer, get_dokument_innehall
**Documents Downloaded**: 210
**Documents Selected (date-filtered)**: 25
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
| HD024192 | full_text | live | get_dokument_innehall | 1 | full-text/HD024192.md |
| HD024191 | full_text | live | get_dokument_innehall | 1 | full-text/HD024191.md |
| HD01FiU42 | full_text | live | get_dokument_innehall | 1 | full-text/HD01FiU42.md |
| HD01SfU37 | full_text | live | get_dokument_innehall | 1 | full-text/HD01SfU37.md |
| HD01UU12 | full_text | live | get_dokument_innehall | 1 | full-text/HD01UU12.md |
| HD01UU11 | full_text | live | get_dokument_innehall | 1 | full-text/HD01UU11.md |
| HD01UbU27 | full_text | live | get_dokument_innehall | 1 | full-text/HD01UbU27.md |
| HD01UbU22 | full_text | live | get_dokument_innehall | 1 | full-text/HD01UbU22.md |
| HD01UbU19 | full_text | live | get_dokument_innehall | 1 | full-text/HD01UbU19.md |
| HD01CU26 | full_text | live | get_dokument_innehall | 1 | full-text/HD01CU26.md |
| HD11834 | metadata_only | live | get_fragor | 30 | list payload only; get_dokument_innehall not attempted in this run |
| HD11832 | metadata_only | live | get_fragor | 30 | list payload only; get_dokument_innehall not attempted in this run |
| HD11828 | metadata_only | live | get_fragor | 30 | list payload only; get_dokument_innehall not attempted in this run |
| HD11831 | metadata_only | live | get_fragor | 30 | list payload only; get_dokument_innehall not attempted in this run |
| HD11830 | metadata_only | live | get_fragor | 30 | list payload only; get_dokument_innehall not attempted in this run |
| HD11829 | metadata_only | live | get_fragor | 30 | list payload only; get_dokument_innehall not attempted in this run |
| HD11833 | metadata_only | live | get_fragor | 30 | list payload only; get_dokument_innehall not attempted in this run |
| HD11835 | metadata_only | live | get_fragor | 30 | list payload only; get_dokument_innehall not attempted in this run |
| HD10504 | full_text | live | get_dokument_innehall | 1 | summary present |
| HD10505 | full_text | live | get_dokument_innehall | 1 | summary present |
| HD10508 | full_text | live | get_dokument_innehall | 1 | summary present |
| HD10506 | full_text | live | get_dokument_innehall | 1 | summary present |
| HD10503 | full_text | live | get_dokument_innehall | 1 | summary present |
| HD10502 | full_text | live | get_dokument_innehall | 1 | summary present |
| HD10507 | full_text | live | get_dokument_innehall | 1 | summary present |

## Full-Text Fetch Outcomes

| dok_id | coverage_state | full_text_available | chars | retrieval | notes |
|--------|----------------|--------------------:|------:|-----------|-------|
| HD024192 | full_text | true | 34838 | live | persisted: full-text/HD024192.md |
| HD024191 | full_text | true | 29595 | live | persisted: full-text/HD024191.md |
| HD01FiU42 | full_text | true | 85258 | live | persisted: full-text/HD01FiU42.md |
| HD01SfU37 | full_text | true | 928 | live | persisted: full-text/HD01SfU37.md |
| HD01UU12 | full_text | true | 45602 | live | persisted: full-text/HD01UU12.md |
| HD01UU11 | full_text | true | 41499 | live | persisted: full-text/HD01UU11.md |
| HD01UbU27 | full_text | true | 100015 | live | persisted: full-text/HD01UbU27.md |
| HD01UbU22 | full_text | true | 100015 | live | persisted: full-text/HD01UbU22.md |
| HD01UbU19 | full_text | true | 100015 | live | persisted: full-text/HD01UbU19.md |
| HD01CU26 | full_text | true | 100015 | live | persisted: full-text/HD01CU26.md |

**Full-text retrieved**: 10/10 top documents

## Deferred Retrieval Queue

| processed | resolved | retained | expired | enqueued |
|----------:|---------:|---------:|--------:|---------:|
| 0 | 0 | 0 | 0 | 0 |