# Methodology Reflection — Week of 19–23 May 2026

**Analysis date**: 2026-05-15
**Classification**: 🟢 PUBLIC

## Analytical Approach

### Data Sources Used
- **Riksdag MCP (riksdag-regering)**: Primary source for document retrieval, interpellations, propositions, betänkanden, motions, voteringar. Status: LIVE at time of analysis.
- **IMF WEO-2026-04**: Economic context (GDP growth, unemployment, CPI, debt). Vintage: April 2026, 1 month old, not stale.
- **MCP full-text**: HD03267, HD01KU34, HD10492, HD10493 full texts retrieved.
- **No SCB data queried**: No Swedish-specific statistical context required for this primarily legislative week.
- **No World Bank data queried**: No governance/environment residue triggers this cycle.

### Structured Analytic Techniques Applied
- **Significance scoring**: Explicit 0–10 matrix across all documents (significance-scoring.md)
- **ACH-lite (Analysis of Competing Hypotheses)**: Scenario analysis with explicit probability assignments (scenario-analysis.md)
- **SWOT**: Standard political SWOT framework applied to coalition government position (swot-analysis.md)
- **Devil's Advocate**: Four distinct counterfactuals challenging dominant narrative (devils-advocate.md)
- **Red Team**: Implicitly applied in devils-advocate and threat-analysis
- **STRIDE-adapted threat categorisation**: Applied to political/institutional threats (threat-analysis.md)

### WEP Language Calibration
WEP probability terms used with horizon tags as required by prompt contract:
- [horizon:week]: *likely* = 60–70%, *probable* = 55–70%
- [horizon:month]: *probable* = 55–65%
- [horizon:quarter]: *roughly even* = 45–55%
- [horizon:election]: *likely* = 60%+

### Tier-C Week-Ahead Multiplier Applied
This analysis applies the 1.2× depth multiplier for Tier-C week-ahead workflows:
- All scenario branches include month/quarter/election horizon extensions
- PIR register started fresh (no sibling prior week-ahead found)
- Cross-reference map explicitly documents sibling folder search result (none found)
- Forward-indicators cover 5 horizon bands (as required)

## Limitations and Caveats

### L1 — No Actual Vote Counts Available
The analysis predicts legislative outcomes based on seat counts and coalition dynamics. Actual vote totals are not yet available (vote has not occurred). Predictions may be wrong if coalition dynamics change between 15 and 23 May.

### L2 — Full Text Not Retrieved for All Documents
HD03262, HD03263, HD03264, HD03265 full texts were not individually retrieved (volume constraint; summaries used). This may affect precision of legal analysis. The legal risk assessment (ECHR, EU) is based on document titles, summaries, and established context — not line-by-line textual analysis.

### L3 — No Polling Data as of Analysis Date
No fresh polling (Demoskop, Novus, IPSOS) available from the week of 2026-05-15. Electoral scenario probabilities are based on structural analysis and historical patterns rather than current polling.

### L4 — Tier-C Cross-References: No Prior Sibling Data
The cross-reference map and intelligence-assessment PIR cycle are fresh starts because no prior week-ahead analysis was found. This reduces the depth of longitudinal trend analysis that Tier-C workflows ideally provide.

### L5 — IMF Vintage
Economic context is from WEO April 2026 (1 month old). Any Swedish-specific developments since April (e.g., Riksbank rate changes, new SCB employment data) may not be fully reflected.

## Quality Assurance

- **Pass 1 → Pass 2 iteration**: ✅ Both passes completed; significant depth added in pass 2 especially on legal analysis (EU directive tensions), scenario tree (election scenarios E1/E2/E3), and devil's advocate counterfactuals
- **WEP terms verified**: All probability claims include [horizon:...] tags
- **IMF provenance block**: Present in executive-brief.md and cross-reference-map.md
- **PIR status JSON**: Created in intelligence-assessment.md
- **Family A (9)**: Complete
- **Family B (2)**: Complete
- **Family C (5)**: Complete
- **Family D (7)**: Complete
- **Family E (2 docs)**: Complete
- **Total artifacts**: 23 + 2 per-document = 25 files created
