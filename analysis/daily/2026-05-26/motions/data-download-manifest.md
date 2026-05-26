# Data Download Manifest — 2026-05-26 (Motions / Opposition Motions)

**Generated**: 2026-05-26 08:06 UTC
**Data Sources**: get_motioner, get_dokument_innehall
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

- **propositions**: 0 documents
- **motions**: 20 documents
- **committeeReports**: 0 documents
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
| get_motioner | `{"limit":20,"rm":"2025/26"}` | 20 | metadata_only |  |

## MCP Coverage State

| dok_id | coverage_state | retrieval | tool | result_count | notes |
|--------|----------------|-----------|------|-------------:|-------|
| HD024192 | full_text | live | get_dokument_innehall | 1 | summary present |
| HD024191 | full_text | live | get_dokument_innehall | 1 | summary present |

## Deferred Retrieval Queue

| processed | resolved | retained | expired | enqueued |
|----------:|---------:|---------:|--------:|---------:|
| 0 | 0 | 0 | 0 | 0 |

## Documents for AI Analysis

| dok_id | title | organ | date | full-text | parti | withdrawal |
|--------|-------|-------|------|-----------|-------|------------|
| HD024192 | med anledning av prop. 2025/26:267 Stärkt skydd mot utlänningar som utgör kvalificerade säkerhetshot | JuU | 2026-05-22 | ✅ full_text (34,838 chars) | MP (Ulrika Westerlund m.fl.) | No |
| HD024191 | med anledning av prop. 2025/26:261 Utökade befogenheter för Skatteverket inom folkbokföringsverksamheten | SkU | 2026-05-22 | ✅ full_text (29,595 chars) | MP (Annika Hirvonen m.fl.) | No |

**GDPR**: Political opinion data, Art. 9(2)(e) public + Art. 9(2)(g) substantial public interest. Data minimisation applied.

## Full-Text Fetch Outcomes

| dok_id | method | status | chars |
|--------|--------|--------|-------|
| HD024192 | get_dokument_innehall | ✅ success | 34,838 |
| HD024191 | get_dokument_innehall | ✅ success | 29,595 |

Both documents retrieved with full text. Top-N floor (all ≤3) met.

## Prior-Voteringar Enrichment

Searched `search_voteringar` for JuU and SkU in 2025/26 and 2024/25:

| committee | rm | result |
|-----------|-----|--------|
| JuU | 2025/26 | count=0 (no votes indexed) |
| JuU | 2024/25 | count=0 (no votes indexed via this query) |
| SkU | 2025/26 | count=0 (no votes indexed) |
| SkU | 2024/25 | count=0 (no votes indexed via this query) |

**Prior voteringar: API returned count=0 for both committees — likely API indexing lag or query format issue. These motions were filed 2026-05-22 and have not yet been scheduled for vote.** Tagging as methodology limitation: 🟡 partial.

## Statskontoret Cross-Source Enrichment

| trigger | document | result |
|---------|----------|--------|
| Named agency (Skatteverket) | HD024191 | TRIGGER FIRED — `Statskontoret: no directly relevant report found for Skatteverket folkbokföring expansion as of 2026-05-26` |
| Administrative capacity | HD024191 | See above |
| Fundamental rights / courts | HD024192 | No Statskontoret trigger (scope is Migrationsverket/courts) |

## Lagrådet Tracking

| proposition | document | status |
|-------------|----------|--------|
| prop. 2025/26:267 (security threats) | HD024192 | Lagrådet: referral pending verification as of 2026-05-26T08:07Z — ECHR Art. 5 (liberty) and child-rights obligations implicate mandatory referral |
| prop. 2025/26:261 (Skatteverket) | HD024191 | Lagrådet: referral pending verification as of 2026-05-26T08:07Z — data-protection / privacy dimension |

## Withdrawn Documents

No withdrawn documents.

## PIR Carry-Forward

No prior PIRs found for motions subfolder (first run). PIRs established this cycle:
- PIR-MOT-001: Will the JuU majority approve prop. 2025/26:267 over MP/V/C opposition?
- PIR-MOT-002: Will MP's folkbokföring motion gain support in SkU or be voted down?
- PIR-MOT-003: Does the security-threat proposition comply with ECHR/child-rights obligations?

## Economic Context (IMF)

IMF context: status=ok, vintage=WEO Apr-2026 (age 1 month). WEO:NGDP_RPCH and WEO:GGXWDG_NGDP fetched and persisted for SWE. Relevant for HD024191 (Skatteverket expansion has budget/staffing implications in fiscal context).
