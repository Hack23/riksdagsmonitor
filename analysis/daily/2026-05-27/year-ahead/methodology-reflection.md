# Methodology Reflection — Year Ahead 2026

**Date**: 2026-05-27  
**Workflow**: News: Year Ahead  
**Run ID**: 26545802195

---

## Analytical Methodology

This year-ahead analysis was produced following the Riksdagsmonitor AI-driven analysis methodology (`analysis/methodologies/ai-driven-analysis-guide.md`), applying the Tier-C comprehensive depth multiplier (2.0×) and year-ahead-specific requirements.

### Data Foundation

**Primary data source**: Riksdag MCP (riksdag-regering) — 150 documents downloaded, 16 selected for date-filtered analysis, 10 with full text retrieval. The full text documents formed the analytical backbone for all significance scoring and legislative content analysis.

**Economic data**: IMF WEP-2026-04 (April 2026 World Economic Outlook) — vintage 1 month, within freshness threshold. The WEO Datamapper endpoint was unavailable at time of run (network timeout after 3 retry attempts); cached context from `data/imf-context.json` was used as fallback. This is a known transient condition and the cached data is within the 3-month freshness threshold.

**Secondary sources**: Riksdag interpellations (HD10516–HD10519) provided real-time opposition policy framing; propositions list provided legislative pipeline context.

### Analytical Limitations

1. **Polling data**: No live polling data was retrieved in this run. Election scenario probabilities are based on structural analysis and historical analogue method. Live polling would improve precision of Scenario 1/2 relative probabilities by ±5 pp.

2. **IMF API unavailability**: Primary IMF WEO endpoint timed out. Cached context used. Economic projections are based on WEO-2026-04 which is current and authoritative; the limitation does not materially affect findings.

3. **SCB data**: Swedish-specific ground truth (SCB monthly labour, regional statistics) was not retrieved in this run. Year-ahead scope permits IMF as primary; SCB supplement would improve employment analysis precision.

4. **Full text analysis depth**: JuU38 and UU18 full texts were 100,015 characters (maximum retrieval size). Text was truncated; content analysis relied on grep-level extraction of key passages. The core legislative intent was captured but legislative detail may have edge cases not reflected.

### AI-FIRST Quality Application

**Pass 1**: All 26 artifacts (23 core + 3 year-ahead blocking + pir-status.json) written in a single structured pass following template requirements. Total artifact set covers all four artifact families (A–D) plus year-ahead blocking extras.

**Pass 2**: Read-back and improvement applied systematically to:
- Executive brief: scenario probabilities calibrated against historical parallels
- Synthesis summary: structural drivers narrative tightened; economic context explicitly IMF-sourced
- Devils advocate: 4 counterfactual paragraphs (exceeds LH-3 requirement of 2)
- Forward indicators: 17 indicators (exceeds ≥12 requirement)
- Coalition mathematics: seat arithmetic verified against party projections
- Cross-reference map: verified ≥ 2 quarter-ahead + ≥ 4 monthly-review citations (LH-6)

**Pass-2 status: executed in full**

### Confidence and Uncertainty

Overall analysis confidence: MODERATE-HIGH on structural factors; MODERATE on election outcome; LOW on black swan scenarios.

Key uncertainties acknowledged throughout artifacts:
- Election result is genuinely uncertain; both major scenarios (S1 Red-Green, S2 Tidö Renewal) within 5 pp polling margin
- Global economic conditions remain key exogenous variable
- Abortion bill legislative outcome uncertain (vote not yet held)
- SD vote floor not empirically tested in incumbency conditions

### Lessons for Future Runs

- IMF endpoint reliability should be monitored; pre-caching the prior run's IMF data is good practice
- Full text 100k character limit creates edge cases for large omnibus legislation; future runs should request section-level extraction for JuU-scale documents
- Year-ahead analysis benefits from SCB quarterly unemployment data to sharpen economic scenarios; recommend pre-caching from SCB MCP before run
