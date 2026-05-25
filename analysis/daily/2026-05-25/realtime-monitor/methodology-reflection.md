# Methodology Reflection — 2026-05-25

**Purpose**: Document analytical choices, data quality assessments, and methodological limitations

---

## Data Collection Methodology

### Source
All documents sourced from riksdagen.se via the Riksdag-Regering MCP server (HTTP, live API). This is the authoritative primary source for Swedish parliamentary documents.

### Download Scope
- **Date**: 2026-05-25
- **Documents retrieved**: 10 (all with full text)
- **Document types**: 4 betänkanden (committee reports) + 6 interpellationer (interpellations)
- **Full-text retrieval**: 100% (all 10 documents had full text available)
- **Largest document**: HD01UU19 (78,578 characters) — NATO report provides exceptional analytical depth
- **Completeness**: The 10-document set represents a typical day's output; not all parliamentary activity may be captured (e.g., committee meetings, private member motions filed same day)

### Limitations of Sample
- **Interpellation timing**: Interpellations are filed at various points; the 6 interpellations in this set may not all have been filed specifically on 2026-05-25. Some may have been filed earlier and appear in the same-day query.
- **Missing documents**: Any betänkanden published outside the standard search window (e.g., late-day publications) would be missed.
- **Ministerial responses**: Not yet available for any of the interpellations.

---

## Analytical Methodology

### Significance Scoring
Multi-factor scoring matrix (Strategic Impact × Democratic Accountability × Citizen Relevance × Timeliness) calibrated against historical baseline for 2025/26 session documents. The L3/L2/L1 grading reflects the upper tail of the significance distribution, not absolute thresholds.

**Calibration note**: HD01UU19 scoring 17/18 is exceptional; the typical high-significance document (L2) scores 12-15. The NATO first-year review is intrinsically unusual.

### Scenario Tree
Probability weights are analytical estimates, not derived from quantitative modelling. They represent the analyst's prior belief distribution conditional on available evidence. They should be treated as rough Bayesian priors, not actuarial probabilities.

### Comparative Analysis
International comparisons (Finland, Denmark, Netherlands) are based on open-source research and knowledge of comparable policy trajectories. They are analogical, not predictive. Specific data points (Finnish Eduskunta vote counts, Danish prosecution rates) would require verification against primary national sources.

### Economic Context
IMF WEO-2026-04 vintage (1 month old) is used for macroeconomic context. Swedish-specific distributional data would ideally draw on SCB's most recent income and Gini coefficient publications (next release: June 2026). The Gini trend described in this analysis (0.24 → 0.27 since 2014) is sourced from OECD StatLink and should be verified against SCB primary data before citation in published articles.

---

## Confidence Calibration

| Claim Type | Confidence | Source Quality |
|---|---|---|
| Document content description | VERY HIGH | Direct primary source |
| Parliamentary vote/motion outcomes | HIGH | Primary source |
| Ministerial responses (future) | LOW-MEDIUM | Inference from precedent |
| Polling/electoral projections | LOW-MEDIUM | No current polls accessed |
| IMF macroeconomic data | HIGH | IMF WEO (fresh vintage) |
| Gini coefficient trend | MEDIUM | OECD, pending SCB confirmation |
| International comparisons | MEDIUM | Open-source analogical |

---

## AI-FIRST Quality Commitment

This analysis has been produced in two passes per the AI-FIRST principle:
- **Pass 1**: Initial analysis of all 10 documents, creation of all 23 artifacts
- **Pass 2**: Critical re-reading of all artifacts; strengthening of evidence linkages; removal of generic language; addition of specific data points from primary sources

Remaining improvement opportunity: A third-party human review would benefit particularly the scenario probability weights and the international comparisons, which draw on general knowledge rather than same-day primary source retrieval.
