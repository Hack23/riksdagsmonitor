# Methodology Reflection — Month Ahead 2026-04-23

**Author**: James Pether Sörling | **Generated**: 2026-04-23

---

## ICD 203 Audit

ICD 203 establishes 9 analytic standards. Below is the audit for this analysis:

| Standard | Requirement | Self-Assessment | Evidence |
|----------|-------------|-----------------|---------|
| S-1 Objectivity | Sources treated impartially; analyst bias minimised | PASS | All parties treated in stakeholder matrix; coalition and opposition positions documented equally |
| S-2 Independence | Analysis not shaped by desired outcome | PASS | Devils-advocate confirms S-1 against 3 hypotheses; alternate scenarios assigned explicit probabilities |
| S-3 Timeliness | Analysis delivered in time to inform decisions | PASS | Delivered 2026-04-23 — covers 38-day window through session end |
| S-4 Based on all available information | All open-source data considered | PARTIAL — Calendar API returned HTML; committee hearing dates not confirmed. Gap documented in intelligence-assessment.md |
| S-5 Properly distinguished from advocacy | Analysis separated from policy preference | PASS | Neutral framing; opposition and government positions reported equally |
| S-6 Communicates uncertainty | WEP + Admiralty codes on all key judgments | PASS — All 5 KJs have explicit WEP + Admiralty + Kent % |
| S-7 Employs alternative analysis | ≥3 ACH hypotheses; scenario alternatives | PASS — 3 devils-advocate hypotheses; 3 scenarios |
| S-8 Tradecraft transparency | Methodology documented | PASS — This document |
| S-9 Self-critique | Limitations acknowledged | PASS — See §Limitations below |

**Overall rating**: 8/9 — S-4 partial due to calendar API failure.

---

## SAT Techniques Applied (≥10 Required)

| # | Technique | Applied In | Notes |
|---|-----------|------------|-------|
| 1 | Key Assumptions Check | intelligence-assessment.md | Explicit assumption: SD support stable |
| 2 | Analysis of Competing Hypotheses (ACH) | devils-advocate.md | 3 hypotheses with consistency matrix |
| 3 | SWOT Analysis | swot-analysis.md | 5S+4W+4O+4T with TOWS matrix |
| 4 | Red Team Analysis | devils-advocate.md H-1 (SD withdrawal test) | Stress-tests dominant view |
| 5 | Scenario Analysis | scenario-analysis.md | 3 scenarios, probabilities sum to 100% |
| 6 | Influence diagrams / network mapping | stakeholder-perspectives.md | Mermaid influence graph |
| 7 | Risk Matrix | risk-assessment.md | 10-item 5×5 heat map |
| 8 | Attack Tree | threat-analysis.md | ET-01 interpellation campaign tree |
| 9 | Kill Chain | threat-analysis.md | LT-01 budget defeat chain |
| 10 | Historical Analogy | comparative-international.md | Norway strømstøtte; German Ampel coalition |
| 11 | DIW Weighting | significance-scoring.md | 15 documents ranked 1.0–8.6 |
| 12 | Admiralty Coding | All artifact headers | [A-F][1-6] on every evidence item |
| 13 | WEP / Kent Scale | intelligence-assessment.md | 7-band WEP on all KJs |

---

## Methodology Improvements Identified

### Improvement 1: Real-time committee schedule integration
**Problem**: The analysis cannot identify precise chamber vote dates because the Riksdag calendar API returned HTML rather than JSON. This creates a timing gap — we know bills are in committee but not when they come to a floor vote.  
**Recommendation**: Implement a retry/fallback parser for the calendar endpoint that handles HTML responses; or periodically scrape the public calendar page for key bills.  
**Impact**: Would improve TIMELINESS (S-3) and enable forward indicators with precise dates.

### Improvement 2: Swedish opinion poll data integration
**Problem**: The election-2026-analysis.md and voter-segmentation.md artifacts rely on document-derived inferences for voter sentiment, not actual polling data. No Swedish polling MCP tool is currently available.  
**Recommendation**: Integrate a public polls aggregator (e.g., Wikipedia Swedish polls page or Statistikon.se) into the download pipeline.  
**Impact**: Would improve KEY JUDGMENTS confidence by grounding KJ-1 and KJ-2 in real voter sentiment data.

### Improvement 3: Riksdag vote record cross-reference
**Problem**: The coaliti on-mathematics.md seat table uses approximate figures (M≈69, S≈105, SD≈73) rather than verified current Riksdag membership. Vacancies, absences, or changes since election could affect pivotal vote counts.  
**Recommendation**: Call `get_ledamot` API for all 349 current seats and compute exact party tallies; cross-reference with known departures/appointments.  
**Impact**: Would improve PRECISION of coalition mathematics and avoid reporting approximation as fact.

---

## Limitations

1. **Calendar API failure**: Committee hearing dates and floor vote dates are approximate/inferred. See G-1 in intelligence-assessment.md.
2. **No polling data**: Public opinion analysis uses structural/legislative inference, not survey data.
3. **Session-end timing**: Run produced at ~01:00 UTC 2026-04-23; rapidly evolving political environment may shift within hours.
4. **Tier-C aggregation**: This is the first run on this date. No prior-cycle sibling analysis folders existed at run time. Cross-reference-map.md documents this limitation.

---

## Tradecraft Context

This analysis applies OSINT methodology per ICD 203, using:
- **Source authority**: Riksdag API (primary), World Bank data, published motions/interpellations
- **Legal basis**: GDPR Art. 9(2)(e) publicly made data; Art. 9(2)(g) public interest; Offentlighetsprincipen (Swedish FOI)
- **Data minimisation**: Named actors cited only where they hold public office and their actions relate to official duties
- **No private personal data** used at any point

---

## Pass 2 Iteration Log

**Pass 1 complete**: All 23 required artifacts written (2026-04-23).  
**Pass 2 improvements applied**:
- Strengthened Admiralty coding consistency across all family C/D files
- Added explicit WEP percentages to KJ table in intelligence-assessment.md
- Added PIR handoff section to intelligence-assessment.md (Tier-C requirement)
- Verified cross-reference-map.md documents "no sibling folders" state correctly
- Added improvement items to this methodology-reflection.md
