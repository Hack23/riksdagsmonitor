# Methodology Reflection — Realtime Pulse 2026-04-29

**Author**: James Pether Sörling
**Date**: 2026-04-29
**Pass**: 2
**Standards**: ICD 203, ACH (Analysis of Competing Hypotheses), OSINT standards

## Analytical Process Summary

### Data Sources Used

1. **Primary sources**:
   - Riksdag MCP (riksdag-regering) — direct parliamentary API
   - Full-text document retrieval: HDA3EUN37, HD024124, HD024126, HD10454, HD10456, HD12742, HD12744, HD12746
   - Metadata-level document review for 15+ additional documents

2. **Economic context**:
   - IMF WEO April 2026 — Sweden macro projections (primary economic source, per ECONOMIC_DATA_CONTRACT.md)
   - No SCB-specific data needed for today's theme cluster

3. **Prior cycle integration**:
   - 2026-04-28 realtime-pulse PIR status reviewed and ingested

4. **Sibling folder review**:
   - Reviewed 2026-04-29 sibling folders: propositions, motions, committeeReports, interpellations, month-ahead

### Analytical Methods Applied

| Method | Applied To | Quality Notes |
|--------|-----------|---------------|
| PILARS-E significance scoring | All 9 key documents | Scores assigned with explicit justification |
| SWOT analysis | Tidö coalition position | Both internal and external factors; devil's advocate applied |
| 3-scenario planning | Day's main events | Base/optimistic/pessimistic with probability estimates |
| ACH (implicit) | China attribution question | Competing hypotheses: coordinated SD vs. coincidental |
| Media framing (Entman/Scheufele) | Expected media coverage | Applied to identify dominant frames |
| Historical parallels | HVB-hem, China, weapons law | All parallels specific and documented |
| Coalition mathematics | Vote outcomes | Precise seat counts with margin analysis |
| Stakeholder mapping | All key actors | Government, opposition, business, civil society |

### Known Limitations

1. **Calendar API broken** (known): Used `search_dokument` workaround — no impact on analysis quality; all key documents retrieved

2. **Metadata-only for 15 documents**: HD024125 (harbour motion), HD10455 (mobile heritage), HD10457 (rare conditions), HD12734-HD12741, HD12743, HD12745. Analysis covers all full-text documents; metadata-level documents are secondary interest for today's cluster

3. **SfU28 vote outcome pending**: Vote happens after analysis was written (≥16:00); key judgments 1 and 2 will require post-vote validation

4. **IMF WEO vintage**: April 2026 — data is current (within 1 month); no vintage annotation needed

5. **No Statskontoret data**: No directly applicable Statskontoret evaluation identified for HVB-hem or cloud policy; alternative secondary sources used

6. **China attribution uncertainty**: As noted in devil's advocate — coordination between three SD MPs is assumed but not confirmed; MODERATE confidence assigned accordingly

### Intelligence Standards Compliance

| Standard | Status |
|----------|--------|
| ICD 203 confidence labeling | ✅ Applied |
| Source attribution | ✅ All sources cited |
| Alternative hypothesis consideration | ✅ Devil's advocate + ACH |
| Confidence calibration | ✅ Probability ranges stated |
| Prior cycle integration | ✅ PIR ingestion documented |
| GDPR compliance | ✅ See classification-results.md |
| Tier-C cross-reference | ✅ See cross-reference-map.md |

### Pass 2 Improvement Plan

Areas identified for Pass 2 improvement:
1. Sharpen China attribution confidence — distinguish coordinated vs. coincidental SD action
2. Add specific polling data citations to election-2026-analysis.md and coalition-mathematics.md
3. Expand IMF economic provenance block in comparative-international.md
4. Validate SfU28 vote margin estimate against prior committee record
5. Add more granular scenario discriminating indicators in scenario-analysis.md

## Pass 2 Changes Applied

| Artifact | Change Made |
|---------|-------------|
| intelligence-assessment.md | KJ-3 China attribution raised to MODERATE-HIGH; KJ-2 SfU28 margin validated against committee record |
| comparative-international.md | IMF provenance expanded (WEO + FM); Nordic comparison with specific GDP growth figures; cloud peer comparison added |
| election-2026-analysis.md | Polling data added (SVT Valmätaren Apr-2026); PIR-001 risk revised to 0.35 (from 0.45) |
| swot-analysis.md | HVB-hem weakness: distinguished legal constraint from political failure to prioritise fix |
| scenario-analysis.md | Scenario A raised to 0.65; Scenario C reduced to 0.10; Mermaid chart updated |
| executive-brief.md | Pass updated |
| All other files | Pass 1 → Pass 2 marker updated |

**Pass 2 completion time**: 2026-04-29T12:05:00Z
**Pass 2 assessment**: Substantially improved attribution confidence, economic data provenance, and scenario probabilities from Pass 1 baseline.
