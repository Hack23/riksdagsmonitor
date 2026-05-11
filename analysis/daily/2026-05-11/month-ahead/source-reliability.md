# Source Reliability Assessment — Month Ahead: June–July 2026

**Date**: 2026-05-11 | **Subfolder**: month-ahead

## Admiralty Source Reliability Matrix

| Source | Reliability | Credibility | Assessment |
|--------|-------------|-------------|------------|
| Riksdagen API (data.riksdagen.se) | A (Completely reliable) | 1 (Confirmed) | Official government legislative texts |
| IMF WEO-2026-04 | A | 1 | Published vintage April 2026, 1 month old |
| Riksdag Betänkanden (2024/25) | A | 1 | Official committee reports, published |
| Calendar API | D (reliability unknown) | — | API returned HTML — data unavailable |
| Synthesised statements | B (Usually reliable) | 3 (Possibly true) | Derived from document preambles, not direct quotes |

## Data Quality Gaps

1. **Calendar API failure**: riksdagen.se calendar returned HTML instead of JSON — known API issue. Forward calendar estimated from legislative norms only.
2. **Voteringar API**: 2025/26 voting data empty (data lag, votes not yet recorded for current session). Analysis relies on 2024/25 precedents.
3. **IMF SDMX endpoint**: IMF context file shows all probes ok; direct SDMX CLI call failed in this environment, but WEO-2026-04 vintage data exists from pre-warm.

## Source Verification

All dok_id references in this analysis are verified against the Riksdag API responses received 2026-05-11. No secondary/media sources used as primary evidence — all claims traced to official documents.
