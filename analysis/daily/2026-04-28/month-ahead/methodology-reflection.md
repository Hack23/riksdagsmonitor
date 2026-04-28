# Methodology Reflection — May 2026 Month Ahead

**Author**: James Pether Sörling  
**Date**: 2026-04-28  
**Framework**: ICD 203 Analytic Standards self-audit + ACH process reflection

## ICD 203 Self-Audit

### Standard 1: Objectivity and Intellectual Rigor
**Assessment**: SATISFACTORY  
All Key Judgments in intelligence-assessment.md document both government and opposition cases with equal evidentiary weight. Devil's advocate section explicitly challenges dominant hypotheses with specific probability estimates. No partisan advocacy language used.

**Improvement 1**: Future cycles should add explicit "evidence weighting" column to all KJ tables showing how much weight each dok_id contributes. Currently weighting is narrative rather than quantitative.

### Standard 2: Independence from Political Considerations
**Assessment**: SATISFACTORY  
Analysis follows evidence from riksdagen.se primary sources. Scenario probabilities assigned based on structural factors (coalition arithmetic, committee pipeline), not preferred political outcomes.

**Improvement 2**: Future cycles should document the analyst's baseline priors for coalition stability at cycle start (e.g., "entering this cycle assuming 80% coalition survival rate") to enable calibration against outcomes.

### Standard 3: Timeliness and Completeness
**Assessment**: ADEQUATE with caveats  
Documents from 2026-04-27 (1-day lookback) cover 12 items. Full-text was retrieved for 5 of 13 documents — a 38% full-text rate. This means significant primary source content was assessed from title/committee/subject rather than full text.

**Improvement 3**: Prioritize full-text retrieval for the 8 documents where only metadata was available. HD01CU40, HD024099, HD10449, HD10450, HD10451 — the 5 highest-priority documents — all had full-text retrieved. The remaining 8 lower-priority documents (HD11750-HD11756) have full-text access risk. Future cycles should implement a 75% full-text floor for the top 10 documents by significance score.

### Standard 4: Source Reliability Assessment
**Assessment**: SATISFACTORY  
Admiralty codes applied throughout. Primary sources (riksdagen.se filings) rated [A1] or [B2]. Inferred positions (C party, SD internal) rated [C3] or [C4]. No unverified or anonymous sources used.

### Standard 5: Assumptions Documentation
**Assessment**: SATISFACTORY  
Key assumptions documented in scenario-analysis.md (leading indicators listed per scenario) and devils-advocate.md (inconsistencies listed). Coalition stability assumptions made explicit.

### Standard 6: Uncertainty Expression
**Assessment**: SATISFACTORY  
WEP language used (LIKELY, VERY LIKELY, ALMOST CERTAINLY) with probability bands. Admiralty codes cross-referenced. No false precision (no >95% confidence for contested judgments).

## ACH Process Reflection

The Analysis of Competing Hypotheses was applied in devils-advocate.md to three dominant hypotheses. The matrix approach revealed that the second counter-hypothesis (interpellation zero impact) has a non-trivial 20% probability that the dominant assessment underweights.

**ACH lesson**: The coordinated-filing pattern for interpellations is real and documented, but the translation from interpellation to polling movement is historically variable. The 2022 S campaign failed to produce measurable movement; the 2024 S winter campaign succeeded. Context-dependence suggests the 35% "Defensive Spring" scenario probability should carry ±10% uncertainty bands.

## Data Limitations

| Limitation | Impact | Mitigation Applied |
|------------|--------|-------------------|
| 1-day lookback (Apr 27 documents) | May miss filing activity from Apr 28 | Captured 12 documents; April 28 is a Monday with low new-filing frequency |
| Full-text for only 5/13 documents | Assessment confidence reduced for 8 documents | Top-5 by significance all have full-text |
| No private polling data | S interpellation impact uncertain | Used historical interpellation impact models |
| No IMF economic indicator available | Economic context thin | Annotated; will use SCB macro indicators in next cycle |

## Calibration History (Prior Cycles)

Prior cycle (2026-04-27 month-ahead) made 7 predictions trackable:
- PIR-2 (justice cluster) — ON TRACK
- PIR-3 (Ukraine ratification) — ON TRACK
- PIR-5 (SD energy challenge) — not yet triggered
- PIR-7 (C party signal) — no signal detected; prior prediction maintained

**Calibration note**: No systematic forecast calibration data available for prior-cycle predictions against outcomes within this workflow. Recommend establishing outcome-tracking file at analysis/calibration/month-ahead-outcomes.json in a future iteration.
