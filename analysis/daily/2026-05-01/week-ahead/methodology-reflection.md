# Methodology Reflection — Week Ahead 4–10 May 2026

**Author**: James Pether Sörling  
**Date**: 2026-05-01  
**Framework**: ICD 203 Standards Audit + SAT Catalog  

## ICD 203 Compliance Audit

| Standard | Requirement | Compliance | Evidence |
|---------|-------------|-----------|---------|
| Standard 1 | Proper format and sourcing | ✓ COMPLIANT | All documents cite riksdagen.se dok_ids |
| Standard 2 | Analytic tradecraft quality | ✓ COMPLIANT | SAT techniques applied (see catalog below) |
| Standard 3 | Proper use of uncertainty | ✓ COMPLIANT | All KJs have confidence labels and source ratings |
| Standard 4 | Distinguish intelligence from policy advocacy | ✓ COMPLIANT | Analysis does not recommend policy; describes political dynamics |
| Standard 5 | Employ sound analytic tradecraft | ✓ COMPLIANT | Multiple competing hypotheses examined |
| Standard 6 | Use authoritative sources | ✓ COMPLIANT | riksdagen.se, lagradet.se, riksbanken.se, statskontoret.se, ESO |
| Standard 7 | Acknowledge and explain uncertainty | ✓ COMPLIANT | confidence labels B2/B3/A2/C4 throughout |
| Standard 8 | Make analytical reasoning transparent | ✓ COMPLIANT | Evidence tables, probability rationale explicit |
| Standard 9 | Use Alternatives (ACH) | ✓ COMPLIANT | devils-advocate.md with 3 competing hypotheses |
| Standard 10 | Self-critique analytic assumptions | ✓ COMPLIANT | Assumptions table in intelligence-assessment.md |

## SAT Technique Catalog (≥10 techniques applied)

| Technique | Applied In | Purpose |
|-----------|-----------|---------|
| Key Assumptions Check | intelligence-assessment.md | Validate foundational assumptions against evidence |
| Analysis of Competing Hypotheses (ACH) | devils-advocate.md | Systematic evaluation of 3 counter-hypotheses |
| SWOT Analysis | swot-analysis.md | Strengths/Weaknesses/Opportunities/Threats political mapping |
| TOWS Matrix | swot-analysis.md | Strategic options from SWOT intersections |
| Red Team Analysis | devils-advocate.md (H1-H3) | Challenge dominant narrative from adversary's perspective |
| Structured Scenarios | scenario-analysis.md | Three bounded scenarios with explicit probabilities |
| Devil's Advocacy | devils-advocate.md | Explicit structured challenge to dominant assessments |
| Risk Register | risk-assessment.md | Systematic 5×5 likelihood × impact scoring |
| Attack Tree Analysis | threat-analysis.md | Decompose Lagrådet risk pathway systematically |
| Signaling Indicators | scenario-analysis.md (leading indicators) | Observable signals that distinguish scenarios |
| Historical Analogies | comparative-international.md | Map Denmark/Germany/Finland precedents |
| Cross-Reference Mapping | cross-reference-map.md | Sibling analysis synthesis (Tier-C) |
| Stakeholder Analysis | stakeholder-perspectives.md | 6-lens multi-actor perspectives |
| DIW Scoring | significance-scoring.md | Quantified document significance |
| Coalition Mathematics | coalition-mathematics.md | Seat distribution + majority calculation |

## Quality Assessment and Weaknesses

### Data Gaps Acknowledged

1. **Lagrådet referral status**: As of 2026-05-01, Lagrådet referral for HD03262/HD03265 not yet confirmed at lagradet.se. This is the single highest-consequence gap in the analysis. All Lagrådet-dependent assessments (KJ-2, threat T-1, scenario B, risk R-01) carry C-level uncertainty until PIR-WA-02 is resolved.

2. **Riksdag calendar API broken**: The calendar endpoint returned HTML rather than JSON at the time of data collection. No structured calendar for week of 4–10 May available. Committee hearing schedules inferred from committee assignment patterns — not confirmed from primary source.

3. **IMF WEO data unavailable**: `tsx scripts/imf-fetch.ts weo` command returned null results during pre-warm. Economic parameters (GDP 1.2%, unemployment 8.9%) sourced from HC01FiU20 (riksdagen.se) — which is a ratified Riksdag document and therefore authoritative for legislative purposes, but less granular than IMF WEO quarterly projections.

4. **Polling data vintage**: Most recent Swedish polling data available during analysis is from March-April 2026 (Novus/IPSOS). No post-announcement polling available for migration package. Voter reaction to HD03262-65 announcement is unknown.

### Bias Acknowledgment

**Bias 1 — Availability heuristic**: Migration package (HD03262-65) was the most recent and voluminous data source. Risk of over-indexing migration vs defence, economy, crime. Mitigation: explicit DIW scoring applied to force relative prioritization.

**Bias 2 — Coherence bias**: The "Lagrådet ECHR risk" narrative fits too neatly into a compelling story arc. Risk of inflating the 15–25% Lagrådet blocking probability by pattern-matching to a narrative. Mitigation: Danish precedent (B-status passed without blocking opinion) used as base rate anchor.

**Bias 3 — Recency bias**: 2026-04-30 evening-analysis sibling strongly emphasized migration as dominant theme. Risk of over-inheriting that framing. Mitigation: scenario-analysis.md requires HC01FiU20 economic scenario to be explicitly examined as potentially dominant.

## Recommended Improvements for Next Pass

1. **Obtain Lagrådet referral status**: Query lagradet.se directly to confirm whether HD03262 and HD03265 have been formally referred. This resolves PIR-WA-02 and dramatically reduces uncertainty on the highest-risk scenario path.

2. **S counter-motion monitoring**: If S files motions before Friday 8 May, update scenario probabilities: A drops from 55% to 45%, B rises from 30% to 40%.

3. **SCB economic indicator advance estimate**: Check scb.se for Q1 2026 GDP preliminary data. If released this week, update risk R-02 likelihood.

4. **Implementation plan from Migrationsverket**: Directly query migrationsverket.se press releases for any 2026-05-01 implementation planning documents.

5. **Add Danish ECtHR case status to comparative-international.md**: Quantify Danish B-status ECtHR case outcome as of 2026 to strengthen the probability anchor for KJ-2.
