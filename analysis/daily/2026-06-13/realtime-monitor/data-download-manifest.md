# Data Download Manifest — 2026-06-13

**Generated**: 2026-06-13 11:41 UTC  
**Workflow**: News Realtime Monitor  
**Run ID**: 27465598870 attempt 1  
**Requested date**: 2026-06-13  
**Effective date**: 2026-06-13  
**Window used**: live same-day pulse  
**Produced by**: manual live-source synthesis

## Data Sources

- riksdag-regering MCP: live
- regeringen.se / g0v.se: live
- IMF WEO pre-warm: attempted, degraded

## Document Counts by Type

- **bet**: 3
- **interpellation**: 3
- **government doc**: 0
- **lookback copies**: 0

## MCP Coverage State

| dok_id | title | coverage_state | retrieval | source | notes |
|---|---|---|---|---|---|
| HD01JuU44 | En betald polisutbildning | full_text | 2026-06-13 11:39 UTC | get_dokument / search_dokument_fulltext | committee report; lead instrument |
| HD01SkU30 | Utökade befogenheter för Skatteverket inom folkbokföringsverksamheten | metadata_only | 2026-06-13 11:39 UTC | get_dokument / search_dokument | summary used |
| HD01SfU32 | Stärkt återvändandeverksamhet | metadata_only | 2026-06-13 11:39 UTC | get_dokument / search_dokument | summary used |
| HD10558 | Nedskärningar i välfärden | metadata_only | 2026-06-13 11:39 UTC | get_dokument / get_interpellationer | summary used |
| HD10557 | Sexuella övergrepp i kriminalvården | metadata_only | 2026-06-13 11:39 UTC | get_dokument / get_interpellationer | summary used |
| HD10555 | Försvarets klimatanpassning och förmåga att möta en bred hotbild | metadata_only | 2026-06-13 11:39 UTC | get_dokument / get_interpellationer | summary used |

## Full-Text Fetch Outcomes

| dok_id | full_text_available | notes |
|---|---|---|
| HD01JuU44 | true | proposition 2025/26:237, paid police training, tax-free loan write-off |
| HD01SkU30 | false | summary sufficient for framing |
| HD01SfU32 | false | summary sufficient for framing |
| HD10558 | false | summary sufficient for framing |
| HD10557 | false | summary sufficient for framing |
| HD10555 | false | summary sufficient for framing |

## Prior-Voteringar Enrichment

- No direct vote matched the current committee report in the live search window.
- `search_voteringar` with `bet=2025/26:JuU44` returned zero rows.
- Fallback topic search was unnecessary because the report is not yet on the floor.

## Statskontoret Cross-Source Enrichment

- HD01JuU44: none found
- HD01SkU30: none found
- HD01SfU32: none found
- HD10558: none found
- HD10557: none found
- HD10555: none found

## Lagrådet Tracking

- No proposition required Lagrådet enrichment in this run.

## Withdrawn Documents

_None._

## PIR Carry-Forward

_None._

## Reference Analyses

- `analysis/daily/2026-05-29/propositions/synthesis-summary.md`
- `analysis/daily/2026-05-31/week-ahead/synthesis-summary.md`

