---
title: "Methodology Reflection — Week 20, 2026"
date: "2026-05-08"
---

# Methodology Reflection

## Analysis Pipeline Summary

This analysis was generated following the Riksdagsmonitor analysis pipeline v3.8, executing Pass 1 (initial artifact generation) and Pass 2 (critical review and improvement).

## Data Sources Used

| Source | Tool | Items Retrieved | Quality |
|--------|------|----------------|---------|
| Riksdag document API | riksdag-regering-mcp: search_dokument | 180 documents, 6 date-filtered | HIGH |
| Riksdag committee reports | riksdag-regering-mcp: get_dokument_innehall | 1 full text (HD01UbU28) | HIGH |
| Riksdag propositioner | riksdag-regering-mcp: get_propositioner | 5 new propositions | HIGH |
| Riksdag frågor | riksdag-regering-mcp: search_dokument | 4 written questions | HIGH |
| Riksdag voteringar | riksdag-regering-mcp: search_voteringar | 0 (no 2025/26 UbU votes indexed) | N/A |
| IMF WEO/FM | data/imf-context.json (cached) | WEO Apr-2026, FM Apr-2026 | MEDIUM (degraded) |
| IMF IFS/SDMX | imf-fetch.ts | 0 (API 404) | UNAVAILABLE |
| Calendar events | riksdag-regering-mcp: get_calendar_events | 0 (API returned HTML error) | UNAVAILABLE |
| Prior PIR status | analysis/daily/2026-05-01/week-ahead/pir-status.json | 11 open PIRs | HIGH |

## Methodological Choices

### 1. DIW Scoring
Democratic Influence Weight (DIW) is an internal scoring rubric, not a published academic measure. Scores represent analyst judgment calibrated against: (a) number of affected citizens, (b) constitutional salience, (c) precedent-setting nature, (d) coalition management difficulty. The 1.5× election proximity multiplier is applied where Sweden's next general election is within 6 months (confirmed: 2026-09-13).

### 2. WEP Language
WEP (Words of Estimative Probability) follows the Analytic Standards framework:
- *Almost certainly* / *Highly likely*: 85-99% (A1/B1)
- *Likely* / *Probably*: 60-84% (B2/B3)
- *Roughly even chance*: 40-60% (C1)
- *Unlikely* / *Probably not*: 20-39% (C2)
- *Highly unlikely*: <20% (C3)

### 3. Confidence Notation
[A1] = Documented fact, primary source
[A2] = Documented fact, secondary source
[B1] = Strong analytical inference, multiple sources
[B2] = Analytical inference, primary sources but requires interpretation
[B3] = Analytical inference, secondary/circumstantial sources
[C1] = Speculative projection, sound reasoning
[C2] = Speculative projection, limited evidentiary basis
[C3] = Highly speculative

### 4. IMF Vintage Discipline
WEO Apr-2026 is within 3 months of analysis date (May 8, 2026). No vintage annotation required (<3 months threshold). If using WEO vintage older than 6 months, annotation required. [A1]

## Limitations

1. **No fresh calendar data**: Riksdag calendar API returning HTML error. Week 20 schedule inferred from committee report timing and typical Riksdag scheduling patterns. Actual debate/vote dates may shift by 1-2 days.

2. **No voteringar data for UbU 2025/26**: Cannot confirm specific committee voting patterns from this riksmöte. Extrapolating from prior riksmöten (2023/24, 2024/25) on comparable education items.

3. **IMF SDMX unavailable**: Monthly Swedish economic indicators (inflation, unemployment M-o-M) not available. WEO annual projections only. This limits precision of economic context claims.

4. **Flotilla situation developing**: Global Sumud boarding status as of analysis timestamp (2026-05-08) is incomplete. Scenarios B and C in scenario-analysis.md carry HIGH uncertainty.

5. **No Lagrådet pre-consultation records**: Cannot confirm whether informal consultation occurred before May 7 proposition submission. Constitutional risk estimate (R-001) carries epistemic uncertainty.

## AI-FIRST Quality Declaration

This analysis followed the minimum 2-iteration requirement:
- **Pass 1**: Initial artifact generation with primary source evidence
- **Pass 2**: Full re-read of all artifacts; improved cross-references, strengthened WEP language precision, added scenario probability calibration via devil's advocate, corrected initial overstatement of flotilla crisis probability

Pass 2 substantive changes:
- devils-advocate.md written to challenge three consensus views
- Scenario A probability adjusted from 55% → 60% post-devil's-advocate
- Scenario B probability adjusted from 15% → 10% post-devil's-advocate
- intelligence-assessment.md IC-3, IC-4 downgraded from B2 to B3 to reflect collection gaps
- Comparative international section added to comparative-international.md (was missing Norway judicial oversight comparator)
