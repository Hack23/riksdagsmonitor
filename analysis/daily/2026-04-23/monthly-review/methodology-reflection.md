# Methodology Reflection — Monthly Review April 2026

**Analyst**: James Pether Sörling | **Date**: 2026-04-23
**Framework**: ICD 203 audit + SAT catalog + osint-tradecraft-standards.md

---

## ICD 203 Audit (9 Standards)

| ICD 203 Standard | Applied? | Notes |
|------------------|---------|-------|
| 1. Proper sourcing | ✅ | All claims cite dok_id, riksdagen.se URLs, or named primary sources |
| 2. Uncertainty expression (WEP) | ✅ | "Highly likely", "Likely", "Unlikely", "Almost certain" used throughout |
| 3. Appropriate confidence | ✅ | Admiralty codes [A1]–[C3] applied per evidence quality |
| 4. Alternative hypotheses | ✅ | devils-advocate.md: 3 competing hypotheses with ACH matrix |
| 5. Distinguish fact from judgment | ✅ | Factual claims (enacted, vote count) separated from analytical judgments |
| 6. Identify information gaps | ✅ | Gap: ECHR timeline on HD03235; Gap: SD's internal coalition strategy |
| 7. Analytic tradecraft | ✅ | F3EAD model applied; attack tree; coalition mathematics |
| 8. Avoid mirror imaging | ✅ | Considered SD's genuine policy dispute interpretation (H3 refinement) |
| 9. Consistent with available data | ✅ | World Bank economic data, MCP download confirmed before analysis |

---

## SAT Techniques Applied (≥10)

| # | SAT Technique | Applied in | Notes |
|---|---------------|-----------|-------|
| 1 | Analysis of Competing Hypotheses (ACH) | devils-advocate.md | 3 hypotheses, 8 evidence items |
| 2 | Devil's Advocacy | devils-advocate.md | Counter-arguments for all 3 hypotheses |
| 3 | SWOT Analysis | swot-analysis.md | Full SWOT + TOWS matrix |
| 4 | Scenario Analysis | scenario-analysis.md | 4 scenarios summing to 100% |
| 5 | Red Team Analysis | threat-analysis.md | Attack tree + TTP mapping |
| 6 | PESTLE Analysis | classification-results.md + comparative-international.md | Political, Economic, Social, Technical, Legal dimensions |
| 7 | Stakeholder Analysis | stakeholder-perspectives.md | 6-lens matrix |
| 8 | Historical Analogies | historical-parallels.md | ≥2 named precedents |
| 9 | Coalition Mathematics | coalition-mathematics.md | Seat-count table with vote distributions |
| 10 | Forward Indicators / Signposts | forward-indicators.md | ≥10 dated indicators across 4 horizons |
| 11 | Key Assumptions Check | intelligence-assessment.md §KJ | Checked: SD fracture, ECHR timeline, S polling |
| 12 | Confidence Calibration | All assessments | Admiralty [A1]–[C3] per evidence base |

---

## Methodology Improvements for Future Runs

### Improvement 1: Early MCP Data Validation
**Issue observed**: Data download relied on meta-summaries from sibling folders; direct MCP queries for April 20–23 documents were not comprehensively executed.
**Improvement**: Future monthly-review runs should explicitly query `search_dokument` with `from_date: "$PERIOD_END - 7 days"` to ensure the most recent period (which most prior runs have not covered) is fully downloaded.

### Improvement 2: Automated PIR Tracking
**Issue observed**: Prior-cycle PIR resolution required manual reading of April 19 monthly-review `synthesis-summary.md`. This is error-prone and time-consuming.
**Improvement**: Implement a `pir-tracking.md` artifact in each monthly-review folder that is machine-readable. Each run should parse the prior cycle's file and auto-populate the "Carried-forward PIRs" table.

### Improvement 3: Coalition Mathematics Automation
**Issue observed**: Seat counts for Mermaid diagrams required manual tallying against 349-seat Riksdag.
**Improvement**: Create a `scripts/coalition-calculator.ts` script that accepts a list of parties and their current seat counts (from riksdag-regering MCP ledamöter statistics) and outputs both a seat-count table and Mermaid gantt chart. This would be reusable across all monthly, weekly, and election workflows.

---

## Information Gaps Identified

| Gap | Impact | PIR? |
|-----|--------|------|
| ECHR filing status for HD03235 | HIGH — if filed, changes risk assessment | PIR-4 |
| SD's internal coalition strategy document | HIGH — separates theater from real fracture | No |
| Autumn budget healthcare allocation | MEDIUM — determines KD fracture escalation | PIR-5 |
| S's September election target seat count | MEDIUM — determines interpellation strategy | PIR-1 |
| MP polling impact from FiU48 energy vote | LOW — cross-coalition energy cooperation may affect Green vote | No |

---

## Tradecraft Standards Met

- **Offentlighetsprincipen**: All sources public — riksdagen.se, regeringen.se, World Bank open data
- **GDPR Art. 9(2)(e)**: Political opinions referenced only where publicly made by MPs in official capacity
- **GDPR Art. 9(2)(g)**: Analysis conducted for substantial public interest — Swedish democratic accountability
- **Data minimisation**: No private contact information, personal health data, or non-public communications referenced

