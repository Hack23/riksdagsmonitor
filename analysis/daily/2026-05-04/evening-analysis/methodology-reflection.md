# Methodology Reflection — Evening Analysis, 4 May 2026

**Author**: James Pether Sörling | **Date**: 2026-05-04  
**Standard**: ICD 203 analytic tradecraft audit

---

## 1. Data Collection Quality Audit

### Sources Used

| Source | Quality | Completeness | Limitations |
|--------|---------|-------------|------------|
| riksdag-regering MCP (14 documents) | HIGH | Full metadata; 2 documents (HD01KU39, HD01FiU49) not yet published as full text | Publication timing gap for same-day documents |
| IMF WEO Apr-2026 (NGDP_RPCH, GGXWDG_NGDP) | HIGH (vintage: 3 weeks) | Direct API rate-limited; used cached data from sibling analyses | Rate limiting may have introduced 2–4 day staleness in some indicators |
| 6 sibling analysis folders | HIGH | All 6 folders have synthesis-summaries; election-cycle and year-ahead have full artifact sets | Sibling analyses produced by same methodology — correlated error risk |
| Lagrådet tracking | MEDIUM | No yttrande published; absence of evidence is not evidence of absence | Manual check performed; automated monitoring not available |
| Regional polling data (Östergötland) | MEDIUM-LOW | Derived from aggregate polling + 2022 seat distribution; no post-2025 constituency-level poll | Seat-level projections carry ±1 seat uncertainty |

### IMF Vintage Assessment

IMF WEO Apr-2026 data is 3 weeks old (published 2026-04-14). Under the 6-month vintage rule, no annotation is required. The data remains current for election-analysis purposes.

---

## 2. Analytic Method Audit

### Methods Applied

| Method | Artifact | ICD 203 Compliance |
|--------|---------|-------------------|
| DIW significance scoring | significance-scoring.md | ✅ Explicit weighting; election multiplier documented |
| SWOT / TOWS | swot-analysis.md | ✅ Evidence-cited rows; dok_ids linked |
| 5-dimension risk register (L×I) | risk-assessment.md | ✅ Numerical scores; posterior probability update |
| Political Threat Taxonomy + Attack Tree | threat-analysis.md | ✅ PTT categories; Mermaid attack tree |
| 6-lens stakeholder matrix | stakeholder-perspectives.md | ✅ Named actors; power/interest axes |
| ACH with 3 hypotheses | devils-advocate.md | ✅ Supporting and counter-evidence for each |
| Scenario analysis (≥3, sum 100%) | scenario-analysis.md | ✅ 4 scenarios with explicit probabilities |
| Comparator jurisdictions (≥2) | comparative-international.md | ✅ Norway, Denmark, Finland |
| Key Judgments (ICD 203 format) | intelligence-assessment.md | ✅ Confidence labels; evidence basis |

---

## 3. Confidence and Uncertainty Calibration

**Overconfidence test**: The evening analysis uses five confidence bands: VERY HIGH (>90%), HIGH (75–90%), MODERATE-HIGH (60–75%), MODERATE (50–60%), LOW (30–50%). No KJ claims VERY HIGH confidence on electoral outcomes — appropriate given 132-day horizon.

**Probability distribution check**: Scenario probabilities sum to 100% (45+25+20+10). No scenario below 5% threshold was included as a standalone scenario — small-probability scenarios aggregated into scenario 4.

**Cognitive bias checklist**:
- ✅ Confirmation bias: Devil's advocate (DA-3) specifically challenges the dominant "government under pressure" narrative
- ✅ Anchoring: Sibling analysis probabilities were not mechanically copied; posterior update performed on R1 (criminal age, raised from 0.25→0.35)
- ⚠️ Groupthink risk: All sibling analyses use same methodology — structural correlated-error risk; acknowledged in source quality table
- ✅ Availability heuristic: Ostlänken is vivid/recent; deliberately calibrated against base rate of regional stories affecting national results (DA-2)

---

## 4. Identified Improvements for Future Cycles

**Improvement 1: Automated Lagrådet monitoring**  
Current method: manual search via riksdag-regering MCP. Recommended: Add a daily automated check for new yttranden on tracked dok_ids. This would resolve PIR-RT-001 faster and reduce analyst time.

**Improvement 2: Constituency-level polling integration**  
Current method: national polls + 2022 seat distribution. Recommended: Integrate Demoskop/SIFO constituency-level data when available (typically quarterly) to improve seat projection precision. The current ±1 seat uncertainty in Östergötland analysis is acceptable but could be tightened.

**Improvement 3: SD intra-coalition signaling taxonomy**  
Current method: free-text analysis of SD interpellations and motions. Recommended: Develop a structured SD signaling taxonomy (escalation levels 1–4: parliamentary question → interpellation → motion → formal dissent) to distinguish electoral identity signaling from genuine coalition threats.

**Improvement 4: L party confidence index**  
Current method: ad hoc tracking of L polling and Pehrson statements. Recommended: Develop a composite L confidence index combining: (a) L polling vs. 4% threshold, (b) L votes aligned with coalition, (c) L statements diverging from coalition line. This would provide a standardized measure of coalition stability.

---

## 5. Time Budget Assessment

- Data collection: 25 min
- Pass 1 artifact creation (23 artifacts): ~90 min
- Pass 2 review and improvement: 20 min
- Aggregation + rendering: ~15 min
- Total estimated: 150 min / target ≤ 150 min (within budget)

**Note**: Tight budget. The primary trade-off is depth of per-document analysis files (documents/ folder). The four highest-priority documents (HD10463, HD01KU39, HD01FiU49, HD024142) have been selected for per-doc analysis; lower-priority documents receive summary coverage in classification-results.md.
