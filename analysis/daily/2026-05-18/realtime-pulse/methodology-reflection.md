# Methodology Reflection — Realtime Pulse 18 May 2026

**Author**: James Pether Sörling | **Date**: 2026-05-18 | **Standard**: ICD 203 Analytic Tradecraft

## Pass-2 Status

**Pass-2 status: executed in full**

All 23 required artifacts were reviewed and iteratively improved. The improvement pass addressed: evidence specificity (all dok_ids verified), WEP confidence term consistency (per ICD 203), Mermaid diagram syntax validation, Tier-C cross-reference map sibling citations, election-proximity multiplier consistency (1.5×), Statskontoret trigger evaluation, Lagrådet tracking, PIR carry-forward sections, and Admiralty source codes.

## Structured Analytic Techniques Catalog

| # | SAT | Applied In | Evidence |
|---|-----|------------|---------|
| 1 | Analysis of Competing Hypotheses (ACH) | devils-advocate.md | 3 hypotheses, inconsistency matrix |
| 2 | SWOT analysis | swot-analysis.md | 4 quadrants with primary source citations |
| 3 | Red Team / Devil's Advocate | devils-advocate.md | "Consensus may be wrong" lede |
| 4 | Key Assumptions Check | intelligence-assessment.md | Credibility notes section |
| 5 | DIW Significance Scoring | significance-scoring.md | 9 documents scored with 1.5× multiplier |
| 6 | Scenario Analysis | scenario-analysis.md | 3 primary + 2 wildcard scenarios |
| 7 | Stakeholder Analysis | stakeholder-perspectives.md | All 8 parties + external actors |
| 8 | PESTLE (Political domain) | risk-assessment.md | PESTLE-informed risk register |
| 9 | STRIDE Threat Framework | threat-analysis.md | 4 threat profiles |
| 10 | Admiralty Source Evaluation | All artifacts | [A-F][1-6] codes throughout |
| 11 | PIR Roll-Forward | data-download-manifest.md, intelligence-assessment.md | 3 PIRs tracked |
| 12 | WEP Confidence Language | All KJs | ICD 203 WEP terms + horizon tags |
| 13 | Comparative Analysis | comparative-international.md | 3 country comparators |
| 14 | Historical Parallel Reasoning | historical-parallels.md | 3 case studies |
| 15 | Forward Indicator Tracking | forward-indicators.md | ≥10 dated indicators |

**SAT count: 15** (≥10 required per 04-analysis-pipeline.md)

## ICD 203 Audit

| ICD 203 Standard | Status |
|-----------------|--------|
| All KJs have WEP + confidence % | ✅ (intelligence-assessment.md) |
| Uncertainty acknowledged | ✅ (intelligence gaps section) |
| Source identification | ✅ (Admiralty codes [A-F][1-6] throughout) |
| Assumptions stated | ✅ (devils-advocate.md ACH section) |
| Alternative hypotheses considered | ✅ (devils-advocate.md 3 hypotheses) |
| Evidence distinguished from inference | ✅ (executive-brief.md BLUF vs KJ section) |
| Pass-2 iteration | ✅ (this file confirms) |

## Analytical Limitations

1. **IMF live fetch failed**: GDP growth and fiscal figures use WEO Apr-2026 prewarm (1 month old) — acceptable vintage but note prewarm dependency.
2. **No same-day vote records**: AU10 (March 2026) was last available voterings; today's chamber proceedings not yet concluded in public record.
3. **Classified Aurora 26 findings**: Drone doctrine gap (HD11812) analysed only from open-source question framing; military AAR classified.
4. **Single-day snapshot**: Realtime pulse is inherently ephemeral — significance scores should be re-assessed at weekly review.

## Data Quality Assessment

| Source | Quality | Notes |
|--------|---------|-------|
| Riksdag MCP | HIGH | Live data; Admiralty A |
| IMF WEO (prewarm) | HIGH | 1-month vintage; within acceptable range |
| HD11814 full text | HIGH | Retrieved via riksdag-regering MCP get_dokument_innehall |
| Interpellation debate speeches | HIGH | Retrieved via search_anforanden |
| Coalition poll estimates | MEDIUM | Estimated from last known poll pattern; not live |

## Election-Proximity Multiplier Documentation

**Multiplier period**: 2026-03-13 to 2026-09-13 (6-month pre-election window)  
**Applied**: All DIW scores in significance-scoring.md × 1.5  
**Authority**: `04-analysis-pipeline.md §Election-proximity significance multiplier`  
**Current proximity**: 117 days (18 May 2026 to 13 September 2026 general election)
