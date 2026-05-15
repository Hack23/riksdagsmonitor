---
title: "Data Download Manifest — Week 21, 2026"
date: "2026-05-15"
article_type: "week-ahead"
subfolder: "week-ahead"
language: "en"
---

# Data Download Manifest — Week 21, 2026

## Provenance Record

**Run ID**: 25908189012  
**Download date**: 2026-05-15  
**Lookback note**: Script used date 2026-05-15; actual documents from 2026-05-13–14 (filing dates of interpellations)  
**Document count**: 2 selected from download

## Documents Selected

| dok_id | title | type | party | author | besvaradav | anmälningsdatum | svarsdatum |
|--------|-------|------|-------|--------|-----------|----------------|-----------|
| HD10492 | Konsekvenserna för barn när biståndet minskar | ip (interpellation) | V | Lotta Johnsson Fornarve (0122987223112) | Benjamin Dousa (0910272619521) | 2026-05-13 | 2026-05-29 |
| HD10493 | Konsekvenserna av nedlagda biståndsstrategier | ip (interpellation) | V | Lotta Johnsson Fornarve (0122987223112) | Benjamin Dousa (0910272619521) | 2026-05-14 | 2026-05-29 |

## Source Paths

- `analysis/daily/2026-05-15/documents/hd10492.json` — Full document JSON
- `analysis/daily/2026-05-15/documents/hd10493.json` — Full document JSON

## Selection Criteria

Documents selected using `scripts/download-parliamentary-data.ts --date 2026-05-15 --limit 20`.  
Both documents selected as directly related thematic cluster (same author, same minister, same policy domain, filed on consecutive days).

## IMF Pre-Warm

- **Status**: ok
- **Vintage**: WEO-2026-04 (April 2026)
- **Age**: 1 month (fresh — within 6-month annotation threshold)
- **Source**: data/imf-context.json
- **Note**: imf-fetch.ts CLI returned fetch error during run; pre-warm data used as sufficient for economic context

## Voteringar Check

- **Search scope**: UU committee, 2025/26 and 2024/25 riksmöten
- **Result**: 0 votes found matching aid policy reform
- **Interpretation**: "Bistånd för en ny era" was implemented as executive action, not as legislation requiring a parliamentary vote
- **Record**: Prior voteringar: no directly comparable vote found in last 4 riksmöten

## Statskontoret Check

- **Pre-warm result**: NOT TRIGGERED
- **Reason**: Interpellations concern Swedish bilateral development aid (Sida/UD international portfolio). No domestic Swedish administrative agency named in an administrative capacity role. Statskontoret focus on domestic administrative efficiency not applicable.

## Lagrådet Check

- **Pre-warm result**: NOT TRIGGERED
- **Reason**: Executive reform agenda, not a government proposition or legislation requiring Lagrådet review. No constitutional law, criminal procedure, court organisation, surveillance, or taxation principles engaged.

## Cross-Reference

- Prior week-ahead: analysis/daily/2026-05-08/week-ahead/ (Week 20 — FöU18 signals intelligence)
- Election proximity: 2026-09-13, 121 days — DIW 1.5× multiplier active
