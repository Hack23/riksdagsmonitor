# Methodology Reflection

**Date**: 2026-04-27  
**Author**: James Pether Sörling  
**Standard**: ICD 203 — Analytic Standards and Tradecraft

---

## ICD 203 Audit

This analysis was conducted under the analytic standards equivalent to those described in Intelligence Community Directive 203 (Analytic Standards). Each standard is assessed below.

| ICD 203 Standard | Assessment | Notes |
|---|---|---|
| 1. Objectivity | **MET** | Analysis includes devil's advocate positions that challenge main assessments |
| 2. Independent of policy | **MET** | No policy advocacy; findings presented as intelligence, not recommendations |
| 3. Timeliness | **MET** | Analysis completed within workflow window; data current to 2026-04-27 |
| 4. Based on all available sources | **PARTIAL** — see Gap 1 | MCP data covers Riksdag; no independent polling data for voter response included |
| 5. Logical argumentation | **MET** | ACH matrix, scenario probabilities, Admiralty codes for source evaluation |
| 6. Proper sourcing | **MET** | All claims cite [A1]-[B2] source codes or explicit document IDs |
| 7. Distinguishing judgments from facts | **MET** | Key Judgments clearly marked with confidence labels; facts cited separately |
| 8. Uncertainty acknowledgment | **MET** | Scenarios include explicit probability ranges; MEDIUM/LOW confidence areas noted |

**ICD 203 audit result**: 7/8 standards fully met, 1 partially met (source breadth).

---

## Methodology Improvements for Future Iterations

### Improvement 1 — Polling Data Integration

**Issue**: The current analysis lacks contemporaneous polling data to calibrate electoral impact assessments. The significance scores for HD10449 (railway) and HD10450 (sick insurance) are based on structural analysis rather than observed voter response.

**Recommendation**: Integrate SCB labor market survey data and available public polling (Novus, Sifo) when assessing electoral significance scores. Cross-validate with polling trends in affected constituencies (Kronoberg, Skåne).

**Impact on this analysis**: The "HIGH CONFIDENCE" rating for KJ-3 (railway electoral liability) would benefit from polling corroboration; as is, it relies on structural inference.

---

### Improvement 2 — Interpellation Response Tracking

**Issue**: This analysis examines interpellations as filed but cannot yet assess government responses (which are due 2026-05-07 to 2026-05-18). The most politically important moment is the *response*, not the filing.

**Recommendation**: A follow-up analysis on 2026-05-10 (after HD10447/HD10448 response deadlines) should systematically compare interpellation claims with government responses and assess whether the response closed or amplified the vulnerability.

**Impact on this analysis**: The scenario probabilities (35%/45%/20%) should be treated as pre-response estimates subject to revision.

---

### Improvement 3 — Coordinated Filing Detection

**Issue**: The analysis identified a cluster of social insurance interpellations (HD10450 + HD10447 both from S) but relied on thematic similarity rather than systematic coordination detection. The structural metadata methodology should be applied more rigorously.

**Recommendation**: Apply the canonical cross-reference edge labels (amends/continues/rebuts/coordinated-filing/bundle/thematic/committee-routed) systematically across all interpellations in each analysis, not just when coordination is visually obvious.

**Impact on this analysis**: The HD10450/HD10447 coordinated filing conclusion is correct but the methodology for reaching it was ad hoc rather than systematic.

---

### Improvement 4 — Intra-Coalition Interpellation Baseline

**Issue**: The assessment that HD10448 (SD→KD) is "unusual" lacks a baseline count of intra-coalition interpellations in prior Riksmöten (2022/23, 2023/24).

**Recommendation**: Build and maintain a cross-Riksmöte database of intra-coalition interpellations to establish frequency baselines. This would quantify the significance of the SD→KD filing.

---

## Tradecraft Context

### Analytic Line of Effort

This analysis is part of the Riksdagsmonitor continuous monitoring mission: tracking Swedish parliamentary activity for political intelligence purposes. The interpellation analysis product is a Tier-B single-type analysis.

### Source Reliability Matrix

| Source | Admiralty Code | Notes |
|---|---|---|
| Riksdag interpellation text (HD10448-HD10450) | A1 (Completely reliable, Confirmed) | Official parliamentary document |
| Riksrevisionen evaluation (cited in HD10450) | A2 (Completely reliable, Confirmed) | Independent oversight body |
| Trafikverket NTP revision (cited in HD10449) | A2 (Completely reliable, Confirmed) | Government agency document |
| Windeurope report (cited in HD10448) | B2 (Usually reliable, Probably true) | Industry association, potential advocacy bias |
| Sveriges Radio coverage (referenced in HD10448) | B2 (Usually reliable, Probably true) | Public broadcaster, editorial judgment applied |
| Employer organization criticism (inferred from HD10447) | C3 (Fairly reliable, Possibly true) | Not directly cited in interpellation text |

### Tradecraft Limitations

1. **No HUMINT**: All analysis is based on open-source parliamentary data. No insider perspectives on coalition dynamics.
2. **Temporal lag**: Interpellations are filed; responses are future. Assessment is pre-response.
3. **Analyst bias check**: Interpellations from S and SD have been treated with equal analytical rigor despite different political orientations.
