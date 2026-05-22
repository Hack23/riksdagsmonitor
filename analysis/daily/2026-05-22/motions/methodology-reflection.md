# Methodology Reflection — Opposition Motions, 2026-05-22

**Date**: 2026-05-22 | **Riksmöte**: 2025/26

---

## Structured Analytic Techniques (SATs) Employed

This analysis employed the following SATs from the tradecraft catalog:

| # | Technique | Applied in |
|---|-----------|-----------|
| 1 | **Analysis of Competing Hypotheses (ACH)** | scenario-analysis.md (4 scenarios with probability distributions) |
| 2 | **Devil's Advocate** | devils-advocate.md (5 challenges to consensus judgments) |
| 3 | **Key Assumptions Check** | synthesis-summary.md (baseline assumptions listed) |
| 4 | **Red Team Analysis** | threat-analysis.md (government's procedural legitimacy attack surface) |
| 5 | **SWOT Analysis** | swot-analysis.md (opposition's S/W/O/T with evidence) |
| 6 | **Signposts and Indicators** | forward-indicators.md (PIR closure triggers, anomaly detection) |
| 7 | **Probability Estimation** | scenario-analysis.md, intelligence-assessment.md (WEP language throughout) |
| 8 | **Admiralty Source Rating** | data-download-manifest.md, intelligence-assessment.md (A1–B2 ratings) |
| 9 | **Stakeholder Mapping** | stakeholder-perspectives.md (power map, interest/influence matrix) |
| 10 | **Comparative Analysis** | comparative-international.md (UK, Germany, Denmark, Norway, Netherlands, Estonia) |
| 11 | **Historical Analogy** | historical-parallels.md (FRA 2008, 2001 detention precedent, etc.) |
| 12 | **Coalition Mathematics** | coalition-mathematics.md (seat arithmetic for all contested bills) |
| 13 | **Frame Analysis** | media-framing-analysis.md (party narrative framing strategies) |
| 14 | **Voter Segmentation** | voter-segmentation.md (5 voter segments × electoral destination) |
| 15 | **Feasibility Assessment** | implementation-feasibility.md (technical/legal/political feasibility for each alternative) |
| 16 | **Cross-Reference Mapping** | cross-reference-map.md (proposition-motion-committee linkages) |
| 17 | **PIR Formulation and Tracking** | significance-scoring.md, intelligence-assessment.md, forward-indicators.md |
| 18 | **Risk Assessment** | risk-assessment.md (6 risks, heat map, institutional dimension) |
| 19 | **Threat Modeling** | threat-analysis.md (5 threat vectors, attack surface) |
| 20 | **Significance Scoring** | significance-scoring.md (DIW scoring across 20 documents) |
| 21 | **Timeline Analysis** | cross-reference-map.md (Gantt chart of legislative timeline) |

**SAT count**: 21 techniques (requirement: ≥10 ✅)

---

## Data Quality Assessment

### Tier 1: Primary Sources (MCP data)
- **riksdag-regering MCP**: LIVE, 2026-05-22T07:59:24Z
- **Document corpus**: 4,190 documents in 2025/26 riksmöte; top 20 analysed
- **Full text**: 3 documents retrieved (HD024188, HD024187, HD024185)
- **Voteringar**: No 2025/26 votes indexed (new riksmöte — documented, expected)
- **Source rating**: A1–A2 (primary riksdag database, first-hand)

### Tier 2: Derived/Inferred
- Historical parallels: Based on public knowledge of FRA law, CJEU data retention decisions
- Coalition arithmetic: Based on reported seat counts; ±2 seats due to potential by-election/sick leave
- Electoral polls: Based on reported public polling (7–9% for V, etc.) — approximate
- **Source rating**: B2–C2 (usually reliable; some knowledge based on public record)

### Tier 3: Not Available in This Run
- Lagrådet yttrande: Not fetched (web access not available)
- Committee hearing transcripts: MCP does not expose these in real time
- Government press releases from 2026-05-22: Not fetched
- IMF/OECD data on Swedish household debt: Not fetched in this run
- **Rating**: Data gap; documented in PIRs for follow-up

---

## Self-Audit: AI FIRST Compliance

### Pass 1 Coverage (23 artifacts)
- ✅ All 23 artifacts created
- synthesis-summary.md: 5 findings, adequately evidenced
- executive-brief.md: Decision-maker focused, watch list included
- significance-scoring.md: DIW scoring for all 20 documents
- intelligence-assessment.md: 5 KIJs with WEP language, PIR table
- scenario-analysis.md: 4 scenarios with probability ranges
- All Family C (electoral), Family D domain lens files: completed
- data-download-manifest.md: Full provenance, fallback documentation

### Pass 2 Improvements Made
- synthesis-summary.md: Added FRA 2008 parallel; strengthened KIJ on C dilemma
- coalition-mathematics.md: Added critical finding (single-seat majority; C cannot block alone)
- media-framing-analysis.md: Added child detention "Alan Kurdi effect" risk
- historical-parallels.md: FRA 2008 parallel deepened with brand-damage mechanism
- voter-segmentation.md: Migration Moderate segment identified as decisive swing segment
- forward-indicators.md: Anomaly detection list added

### Self-Assessed Quality
- **Depth**: GOOD — 23 files with specific evidence from primary motion texts
- **Evidence**: MEDIUM-GOOD — full text retrieved for top 3 documents; remaining 17 documents based on titles/summaries
- **Tradecraft**: GOOD — 21 SATs employed; WEP language consistent throughout
- **Key gap**: Full text not retrieved for SfU migration cluster (HD024160/157/153/170) — analysis extrapolated from motion titles and committee IDs; would benefit from full-text retrieval
- **Voteringar gap**: No committee votes available for 2025/26 — expected; documented

---

## Known Limitations and Caveats

1. **Coalition arithmetic**: Based on approximate seat counts. Exact 2025/26 composition requires verification against latest Riksdag member list
2. **Full text gap for SfU motions**: Migration policy analysis is based on motion summaries, not full-text retrieval; WEP confidence adjusted downward for SfU-specific claims
3. **Historical parallels**: Based on public knowledge; specific document IDs for 2001, 2007/08 riksmöten not verified via MCP in this run
4. **Polling data**: Referenced as approximate public record; actual poll numbers require verification
5. **Forward indicators**: PIR closure estimates are approximate; committee schedules not available via MCP
6. **IMF/economic data**: Not fetched in this run; Swedish housing debt concern supported by public IMF/Riksbanken references but not quantified with specific data

---

## Recommendations for Next Cycle

1. Retrieve full text for all 20 top documents (not just top 3)
2. Fetch voteringar for 2024/25 SfU and JuU as historical baseline once indexed
3. Fetch IMF WEO Sweden indicators to quantify household debt concern
4. Check Lagrådet website for prop. 267 yttrande
5. Monitor C vote record in SfU committee as PIR-M001 closure indicator
