# Methodology Reflection — Motions, 2026-04-29

**Author**: James Pether Sörling | **Date**: 2026-05-04

## What Worked Well

1. **riksdag-regering MCP**: Live and responsive. All 17 motions retrieved successfully via `download-parliamentary-data.ts --doc-type motions --date 2026-04-29`. The API returned structured JSON with title, organ, parti, status, and text fields.

2. **Lookback logic**: The download script's automatic 3-business-day lookback correctly identified 2026-04-29 as the effective date when 2026-05-04 returned 0 documents.

3. **Full-text retrieval**: `get_dokument_innehall` returned full text for HD024124, HD024126, HD024136 — the three highest-significance motions. The text fields are HTML-formatted but parseable.

4. **Document clustering**: Identifying six thematic clusters early enabled efficient cross-reference mapping and reduced redundant analysis.

## Data Gaps and Limitations

### IMF API (CRITICAL GAP)
Both `www.imf.org` and `sdmxcentral.imf.org` were unreachable in this workflow run due to network egress restrictions. Specifically:
- `tsx scripts/imf-fetch.ts weo --country SWE --indicator NGDP_RPCH --years 5` → fetch failed
- `tsx scripts/imf-fetch.ts compare --indicator GGXWDG_NGDP --countries SWE,DNK,NOR,FIN,DEU` → all null

**Impact**: Economic context for energy investment (SEK estimates), GDP growth backdrop, and fiscal balance comparisons were estimated from prior cached data. All such estimates are marked [est.] in analysis.

**Mitigation**: The primary analytical value of this article is political, not macroeconomic. The IMF gap reduces quantitative precision but does not undermine the political intelligence assessment.

### Statskontoret (Domain Unreachable)
- Government efficiency/impact analysis cross-checks not available
- Affected: HD024124 (new permitting authority capacity), HD024136 (Kriminalvården expansion)

### Lagrådet (Domain Unreachable)
- Lagrådet opinions on prop. 238 (constitutional issues) and prop. 246 (criminal age — ECHR) not available
- These would have added authoritative legal context to the S and V motions

### Prior Voteringar (No Results for Specific Committees)
- MJU, JuU, NU, TU, SkU, AU committee votes for propositions 238/239/240/234/246/243 returned 0 results
- Reason: These are fresh propositions from late April 2026; committee votes have not yet occurred
- General search found AU10 (2026-03-04) as most recent available — tangential relevance

### V Party Attribution (Unconfirmed)
- HD024133, HD024134, HD024135: sponsor listed as "Malcolm Momodou Jallow m.fl." without explicit (V) tag in API response
- Malcolm Momodou Jallow is a known V Riksdag member; attribution is highly likely but technically unconfirmed in the API data

## Methodological Choices

### Criminal Age Comparison
International comparison table drawn from publicly available Council of Europe (2023) and national justice ministry reports. Not IMF-sourced — this is criminal justice comparative data.

### Election Proximity Multiplier
Applied ×1.5 EP multiplier consistently to all DIW scores. Sweden's election is 2026-09-14 = 132 days from 2026-05-04. This is within the ≤180-day threshold. The multiplier is calibrated to reflect that committee motions filed this close to an election carry heightened electoral accountability weight.

### HD024127 Withdrawal Signal
Treated as an analytic signal despite missing sponsor information. Withdrawal close to filing suggests revision rather than abandonment — a pattern consistent with motions that are superseded by amended government text.

## Confidence Calibration

All confidence levels use the WEP (Words of Estimative Probability) ladder:
- HIGH [B2]: Based on live MCP data + full-text documents
- MEDIUM [C2]: Based on partial text + contextual inference
- LOW [D2]: Based on metadata only + historical pattern matching
- ESTIMATED [est.]: Based on prior cached data; IMF API unavailable
