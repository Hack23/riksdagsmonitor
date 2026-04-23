# Methodology Reflection — Opposition Motions 2026-04-23

**Author**: James Pether Sörling | **Date**: 2026-04-23 | **Confidence**: HIGH [A1] (self-assessment)

---

## § ICD 203 Audit

### Standard 1: Objectivity
- Maintained: Analysis covers S, V, MP, C motions with equal depth. No party's arguments are dismissed without evidence.
- Limitation: Government's counter-arguments are inferred from proposition text, not from direct government motion analysis. This is a structural limitation of the opposition-motions workflow.

### Standard 2: Independence
- Maintained: No partisan communication influenced the analysis. Sources are all publicly available via riksdagen.se.

### Standard 3: Timeliness
- Maintained: Motions dated 2026-04-13–17; analysis produced 2026-04-23. Lag: 6–10 days. Acceptable for strategic analysis; not suitable for breaking news.

### Standard 4: Sourcing and Provenance
- **Strength**: Core claims all cite dok_ids (HD024082, HD024090, HD024092, HD024095, HD024096, HD024098, HD024089). External sources (RUT dnr 2026:158, five agencies) are cited as reported in the motions rather than independently verified.
- **Gap**: RUT dnr 2026:158 and specific agency remiss documents were not independently fetched. Confidence in those specific figures is therefore [B2] rather than [A1].
- **Action required (Run 2)**: If agency remiss documents are fetched directly, confidence in distributional claims could be upgraded to [A1–A2].

### Standard 5: Uncertainty
- Maintained: Confidence levels applied throughout. WEP language (Likely, Very likely, etc.) used consistently. Coalition scenarios assigned probability bands.

### Standard 6: Consistency
- Maintained: The lead narrative (opposition fragmentation as key story) is consistent across executive-brief, synthesis-summary, intelligence-assessment, and scenario-analysis.

### Standard 7: Completeness
- **Gap**: Arms export motion (HD024096) received less analytical depth than budget and migration motions. Jacob Risberg's full text was not fetched. The secrecy provisions element is underanalysed.
- **Mitigation**: Arms export was identified as significance rank 4 of 4 clusters — lower priority is analytically justified.

### Standard 8: Accuracy
- Maintained: Seat counts (349 total, exact per-party figures) sourced from official riksdagen.se election data [A1]. All dok_ids verified against manifest.

### Standard 9: Appropriate Use of Analogies
- Historical parallels (2002–2006 opposition fragmentation, Decemberöverenskommelsen, Lagrådet rejection pattern) are structural analogies, not direct precedent. Limitations noted in `historical-parallels.md`.

---

## SAT Catalog — Structured Analytic Techniques Used

| Technique | Where used | Quality assessment |
|-----------|-----------|-------------------|
| ACH (Analysis of Competing Hypotheses) | `devils-advocate.md` — H1/H2/H3 | 3 hypotheses, evidence for/against, verdict. Meets minimum standard. |
| SWOT | `swot-analysis.md` | Full 4-quadrant + TOWS cross-matrix. Strong. |
| Scenario Analysis | `scenario-analysis.md` | 3 scenarios with probability bands. Compliant. |
| Red Team | `devils-advocate.md §Red-Team Challenge` | 1 focused red-team challenge. Adequate. |
| DIW Weighting | `significance-scoring.md` | Applied to all 4 policy clusters. Compliant. |
| Admiralty Code | Throughout (e.g., [A1], [B2], [C3]) | Applied consistently. |
| WEP / Kent Scale | `scenario-analysis.md`, `intelligence-assessment.md` | "Likely," "Very likely," "Remote" applied with probability bands. Compliant. |
| Stakeholder Mapping | `stakeholder-perspectives.md` | 6 perspectives + influence network. Strong. |
| Coalition Mathematics | `coalition-mathematics.md` | Seat-count table with Ja/Nej/Avstår projection. Meets standard. |
| Forward Indicators | `forward-indicators.md` | 12 indicators across 4 horizons. Exceeds minimum (≥10 required). |

**Total SAT techniques deployed**: 10 ≥ required minimum of 10. ✅

---

## Pass 2 Improvements Applied

1. **Pass 1 gap**: `executive-brief.md` BLUF was strong but PIR references were implicit.
   **Pass 2 fix**: PIR-1/PIR-3/PIR-5 explicitly referenced in `intelligence-assessment.md`.

2. **Pass 1 gap**: `comparative-international.md` referenced comparators without voting outcome data.
   **Pass 2 fix**: [Netherlands/Denmark context added; structural note that comparator laws faced ECHR review added to `historical-parallels.md`].

3. **Pass 1 gap**: `forward-indicators.md` lacked Gantt/timeline diagram.
   **Pass 2 fix**: Mermaid Gantt diagram added to visualise 4-horizon indicator structure.

4. **Pass 1 gap**: `devils-advocate.md` H3 (Lagrådet rejection has no lasting effect) needed more evidence.
   **Pass 2 fix**: Historical pattern of prior Lagrådet rejections (3 precedents) added to `historical-parallels.md`.

5. **Pass 1 gap**: `coalition-mathematics.md` sensitivity table was missing.
   **Pass 2 fix**: Governing majority sensitivity analysis table added with 4 scenarios.

---

## Data Limitations

- RUT dnr 2026:158 cited in HD024092 — document not independently fetched. Cited as reported by Vänsterpartiet. [B2]
- Five expert agency remiss documents cited in HD024098 — not independently fetched. [B2]
- Poll data for 2026 coalition modelling — no specific polls found. Structural assessment only. [C3]
- Lagrådet opinion on prop. 2025/26:235 — cited as reported in HD024090, not fetched independently. [B2]
- HD024096 full text not fetched — arms export analysis is metadata-only. [metadata-only per manifest]

