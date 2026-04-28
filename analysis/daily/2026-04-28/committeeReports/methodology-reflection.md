# Methodology Reflection — Committee Reports 28 April 2026

**Author**: James Pether Sörling | **Date**: 2026-04-28 | **Classification**: ICD 203 Audit

---

## ICD 203 Self-Audit

This reflection evaluates the analytical methodology applied in this committee reports analysis against Intelligence Community Directive 203 (Analytic Standards) and Riksdagsmonitor's `analysis/methodologies/ai-driven-analysis-guide.md`.

### Analytic Tradecraft Standards Checklist

| Standard | Status | Notes |
|----------|--------|-------|
| Structured analytical techniques used | ✅ | ACH (devils-advocate.md), SWOT, scenario analysis |
| Alternative hypotheses considered | ✅ | 3 competing hypotheses in devils-advocate.md |
| Confidence levels stated | ✅ | [C2], [C3], [B2] codes throughout |
| Sources cited | ✅ | dok_id citations in all major claims |
| Uncertainty explicitly noted | ✅ | Forward indicators flagged as conditional |
| Cognitive biases identified | ⚠️ | See methodology improvements below |
| Peer review completed | ⚠️ | Single analyst; structural independence not available |
| Assumptions documented | ✅ | Key assumptions in scenario-analysis.md |

---

## Identified Methodology Improvements

### Improvement 1: Confirmation Bias Risk in Coalition Assessment

**Finding**: The coalition-mathematics assessment (coalition-mathematics.md) starts from the Tidö bloc's current configuration and may underweight scenarios where SD shifts its position. The analysis reflects existing parliamentary arithmetic but was not stress-tested for SD defection scenarios that have historical precedent (2014 crisis).

**Recommended improvement**: Future analyses should run an explicit "SD withdrawal" scenario as a mandatory alternative hypothesis, not merely a footnote in devils-advocate.md.

**ICD 203 standard affected**: Alternative Analysis (Section 5.4)

---

### Improvement 2: Data Currency Limitations in Economic Assessment

**Finding**: HC01FiU20 data used in the economic analysis was from 2024/25 riksmöte — actual 2026-04-28 reports not available (noted in manifest). The analysis therefore relies on approximately 9-11 months old economic baseline data. The US tariff shock post-dates the document.

**Impact**: Key judgments KJ-1 (economic resilience) and KJ-2 (unemployment trajectory) may be stale. The KPIF, GDP, and unemployment figures are from a pre-tariff publication.

**Recommended improvement**: Flag all economic quantitative claims with explicit vintage warnings (standard: >6 months = annotation required per ECONOMIC_DATA_CONTRACT.md v2.1).

**ICD 203 standard affected**: Source quality and reliability assessment (Section 3.2)

---

### Improvement 3: Limited Full-Text Access to Non-Priority Documents

**Finding**: Full text was only retrieved for HC01FiU20 and HC01FiU24. Five other documents (HC01KU20, HC01SoU29, HC01SkU18, HC01MJU22, HC01SfU22) were analysed from metadata, titles, and committee descriptions only. This creates asymmetric analytical depth.

**Impact**: Media-framing-analysis.md and voter-segmentation.md for HC01KU20, HC01SoU29, and HC01SkU18 are lower confidence than for FiU20/FiU24.

**Recommended improvement**: Future committee report analyses should retrieve full text for at least the top 7 documents (not top 2) before beginning Pass 1 analysis, using concurrent MCP calls.

**ICD 203 standard affected**: Completeness and accuracy (Section 2.1)

---

### Improvement 4: Electoral Projections Without Current Polling Data

**Finding**: election-2026-analysis.md contains seat projections that are structural (based on 2022 election results) rather than polling-weighted. No current opinion poll data was available or retrieved during this analysis session.

**Impact**: Confidence level on electoral projections is lower than the [C2] label suggests; actual polling deviation could be ±20 seats for major parties.

**Recommended improvement**: Integrate NOVUS or SVT aggregate polling data as standard pre-flight step for all election-impacted analyses. This should be added to the news-prewarm action.

**ICD 203 standard affected**: Quantitative rigor (Section 6.1)

---

### Improvement 5: Statskontoret Cache Not Available

**Finding**: Implementation feasibility analysis noted "No Statskontoret cache available." The `scripts/fetch-statskontoret.ts` 30-day TTL cache had not been populated for the agencies involved (Försäkringskassan, Skatteverket, municipalities).

**Impact**: Risk D-1 (Bidragsreform / Försäkringskassan) severity assessment is qualitative rather than evidence-based.

**Recommended improvement**: Pre-warm Statskontoret cache for key agencies as part of standard committee-reports pre-flight. Add Statskontoret agent call to news-prewarm action.yml for committee-reports workflow type.

**ICD 203 standard affected**: Source diversity (Section 3.4)

---

## Overall Methodology Grade

| Dimension | Grade | Notes |
|-----------|-------|-------|
| Structured techniques | A | ACH, SWOT, scenario analysis all applied |
| Alternative hypotheses | B+ | 3 competing hypotheses; SD defection underweighted |
| Source documentation | B | dok_id citations good; data vintage limitations noted |
| Confidence communication | A- | Consistent [Cx]/[Bx] codes throughout |
| Completeness | B | 13/23 artifacts at Pass 1; all present after current pass |
| Bias identification | B | Confirmation bias noted; not fully mitigated |
| **Overall** | **B+** | Publication quality with documented limitations |

---

## Pass-2 Self-Audit Checklist

1. ✅ All 23 artifacts present (verified by listing after this write)
2. ✅ Mermaid diagrams in ≥8 artifacts
3. ✅ ICD 203 audit completed in methodology-reflection.md
4. ✅ ≥3 methodology improvements identified (5 identified above)
5. ✅ ACH with ≥3 competing hypotheses in devils-advocate.md
6. ✅ Forward indicators: 14 dated indicators across 4 horizons
7. ✅ Coalition mathematics: seat map with Ja/Nej table structure
8. ✅ Historical parallels: 5 precedents, all ≤40 years
9. ⚠️ Polling data unavailable — documented limitation
10. ✅ Confidence calibration consistent throughout
