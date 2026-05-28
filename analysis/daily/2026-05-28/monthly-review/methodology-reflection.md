# Methodology Reflection — Monthly Review 2026-05-28

**Author**: James Pether Sörling | **Date**: 2026-05-28 | **Family**: C

---

## Data Source Assessment

| Source | Quality | Limitation | Mitigation |
|--------|---------|-----------|------------|
| Riksdag API (riksdag-regering MCP) | HIGH | PDF-HTML wrapper affects proposition text quality | Summary fields + metadata used as primary |
| IMF WEO Apr-2026 (cached) | HIGH | 1-month vintage; live fetch blocked (firewall) | Explicit annotation with vintage date and age |
| Sibling analysis folders | HIGH | Prior cycle from 2026-05-10 (18 days ago) | Explicitly flagged as prior-cycle PIR sources |
| Full-text document extraction | MEDIUM | PDF→HTML conversion for HD03275/276/277 | Summary field cross-validation |

---

## Analytical Choices

### DIW Scoring
- Tier-C election proximity multiplier (1.12×) applied to all scores given T+108d
- **Decision**: Applied across all documents to reflect heightened electoral stakes
- **Risk**: May inflate scores for operationally minor documents

### Scenario Probability Estimates
- WEP (Worded Estimate of Probability) language mapped to numerical ranges per band guidance
- **Decision**: Used numerical ranges (35-45%) rather than pure WEP words to improve precision
- **Limitation**: Based on OSINT intelligence, not quantitative modelling

### PIR Status Updates
- Prior cycle PIRs from `analysis/daily/2026-05-10/monthly-review/` ingested
- **Decision**: Updated each PIR based on documentary evidence from 2026-05-28 batch
- **Gap**: No polling data available to confirm PIR-A (L threshold) status

---

## Analytical Confidence Statement

This analysis is based on:
- 21 parliamentary documents from 2026-05-28 (Riksdag API)
- 10 full-text documents
- 30-day sibling folder cross-reference
- Cached IMF WEO Apr-2026 data (1 month vintage, status: ok)
- Prior cycle intelligence from 2026-05-10/monthly-review/

**Overall confidence**: MEDIUM-HIGH (A2). Key uncertainty: L threshold status (PIR-A) cannot be assessed without current polling data. SD escalation rate assessment is directional but not quantified.

---

## Improvement Pass Notes (Pass 2)

- [x] All 23 artifacts present
- [x] PIR ingestion section present in intelligence-assessment.md
- [x] Sibling folder citation in cross-reference-map.md (≥1)
- [x] IMF data annotated with vintage date and age throughout
- [x] DIW scores with methodology explanation
- [x] Scenario tree with WEP language
- [x] Devil's advocate challenges reviewed
- [x] Warning intelligence block in intelligence-assessment.md
