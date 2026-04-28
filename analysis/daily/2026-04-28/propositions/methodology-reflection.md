# Methodology Reflection — Propositions 2026-04-28

**Author**: James Pether Sörling  
**Date**: 2026-04-28  
**Classification**: PUBLIC | Confidence: HIGH [B2]  

---

## ICD 203 Analytic Standards Audit

### Standard 1: Proper Sourcing (ICD 203 §3)

✅ **Met**. All Key Judgments cite primary dok_id sources (riksdagen.se). Admiralty codes applied in intelligence-assessment.md. Full-text fetch outcomes documented in data-download-manifest.md. Evidence citations present in SWOT, significance-scoring, and risk-assessment files.

### Standard 2: Uncertainty Communication (ICD 203 §4)

✅ **Partially met**. Confidence labels (HIGH/MEDIUM/LOW) used in Key Judgments. Scenario probabilities sum to 100%. However: some sub-assessments use informal language ("likely", "may") without explicit confidence labels — improvement noted below.

### Standard 3: Alternative Hypotheses (ICD 203 §5)

✅ **Met**. Devils-advocate.md contains 3 explicit competing hypotheses with evidence for/against and probability estimates. Scenario-analysis.md provides 3 scenarios with probabilities.

### Standard 4: Analytic Integrity / Independence (ICD 203 §6)

✅ **Met**. Analysis does not advocate for policy outcomes. Political parties are treated as analytical objects, not normative subjects. Confidence assessments reflect evidence, not prior expectations.

### Standard 5: Analytic Tradecraft (ICD 203 §7)

⚠️ **Partially met**. Time constraint (approximately 45-minute window) limited depth of document full-text analysis for HD03253 (extensive EU regulation reference document). The analysis relies on proposition summary texts for HD03253 rather than full CRR3 impact modelling.

---

## Identified Limitations

### Limitation 1: Time-Constrained Analysis

**Issue**: The 45-minute production window limits iterative sourcing and cross-validation. Full-text analysis of HD03253 (EU Banking Package) would require additional hours to absorb the CRR3/CRD6 technical annexes.

**Impact**: Moderate — KJ-1 (banking package passage) remains HIGH CONFIDENCE because the mandatory transposition logic is clear regardless of technical detail. KJ-2 risk estimates would benefit from closer Lagrådet tripwire analysis.

**Recommendation**: In future cycles, EU transposition propositions should trigger an extended analysis window.

### Limitation 2: No Real-Time Political Intelligence

**Issue**: Internal party positions (especially L threshold conditions for HD03252 support) are not available in the riksdagen.se document corpus. Party group communications, faction meetings, and internal polling are outside collection scope.

**Impact**: Moderate — KJ-2 confidence is constrained to MEDIUM because the key variable (L's threshold) is unobservable through available sources.

**Recommendation**: Track public L party group statements and SVT/DN political correspondents for signals.

### Limitation 3: Economic Context Vintage

**Issue**: IMF WEO data and SCB statistics used for macroeconomic context (housing market, GDP growth) have publication vintages of 3–6 months. Real-time credit market conditions may differ.

**Impact**: Low — macroeconomic framing in scenario C (housing market flashpoint) is directionally valid; specific numbers should be treated as indicative.

**Recommendation**: Refresh with latest Riksbanken Stabilitetsrapport when published (May 2026).

---

## Improvement Actions for Next Cycle

1. **Audit confidence label consistency**: Scan all Family A–D files for informal uncertainty language ("likely", "may", "could") and replace with explicit ICD 203 confidence labels (HIGH/MEDIUM/LOW) with parenthetical probability estimates.

2. **Add per-document economic impact modelling**: For EU transposition propositions with capital impact (HD03253 type), include a quantitative impact table sourced from the proposition's konsekvensanalys section.

3. **Track L/KD threshold conditions proactively**: Create a standing PIR specifically for minority government dependency partner threshold conditions, updated each parliamentary week.

---

## AI-FIRST Pass 2 Self-Assessment

| Criterion | Pass 1 | Pass 2 | Improvement |
|-----------|--------|--------|-------------|
| Specific evidence citations | ✅ Present | ✅ Verified | Consistent across files |
| Alternative hypotheses | ✅ 3 in devil's advocate | ✅ Reviewed | Confidence labels strengthened |
| Scenario probabilities | ✅ Sum to 100% | ✅ Verified | No change needed |
| Mermaid diagrams | ✅ Present | ✅ Verified | Style directives consistent |
| ICD 203 compliance | ⚠️ Partial | ✅ Documented | Audit section added |
| Intelligence gaps documented | ✅ 4 gaps | ✅ Verified | Gap register in intel-assessment |
| Key Judgments with PIR refs | ✅ 3 KJs | ✅ Reviewed | All reference PIR IDs |
