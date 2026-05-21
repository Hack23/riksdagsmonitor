# Methodology Reflection — Riksdag Interpellations 2026-05-21

**Analyst**: AI-assisted intelligence analysis (news-interpellations workflow)
**Date**: 2026-05-21
**Artifact count**: 23 always-on + 20 Family E per-document analyses = 43 total files

## Methodology Applied

**Core framework**: AI-driven analysis guide (analysis/methodologies/ai-driven-analysis-guide.md)
**Document analysis**: Structured content analysis of full-text (3 documents) and metadata (17 documents)
**Political intelligence framework**: OSINT/INTOP tradecraft with STRIDE risk overlay
**Comparative method**: Nordic peer comparison + EU regulatory context + IMF macroeconomic baseline

## Data Collection

**MCP tools used**:
- `get_interpellationer`: Retrieved 20 interpellations, rm=2025/26
- `get_dokument_innehall` (×3): Full text for HD10499, HD10498, HD10497
- `get_sync_status`: Confirmed MCP liveness

**External data**:
- IMF WEO: April 2026 vintage, Sweden GDP/unemployment projections (provider: IMF, dataflow: WEO)
- OECD DAC: ODA statistics 2024 (development aid context for HD10492/HD10493)
- Nordic peer comparison: Denmark, Norway, Finland climate adaptation frameworks (public policy documentation)

**Data limitations**:
- Full text available for only 3/20 documents (top 3 by recency and significance)
- No government ministerial answers yet (deadlines 2026-06-02/04)
- No election polling data for this specific batch analysis
- Statskontoret cross-source: No directly applicable reports found for the specific interpellation topics

## Analytical Choices

**Significance scoring**: 5-dimension, 1–10 scale. Choice of 5 dimensions (policy impact, political salience, coalition/stability, public interest, electoral significance) reflects the dual analytical purpose: governance accountability + electoral intelligence.

**Scenario analysis**: 2×2 matrix (government responsiveness × external event severity) — chosen because both dimensions are genuinely uncertain and analytically separable. Probability estimates are ANALYST JUDGEMENT (cannot be statistically derived from available data).

**Coalition stress assessment**: Assessed SD's interpellations as pre-election positioning rather than coalition fracture signals. This reflects base-rate reasoning: SD has supported the government on every confidence vote since 2022 despite filing numerous interpellations. Changing this assessment would require explicit SD leadership statements of no-confidence intent.

**Ministerial vulnerability ranking**: Derived from interpellation count + topic political salience. Johan Britz (3 interpellations on high-salience climate) ranked as most exposed. Ranking is point-in-time and would change rapidly if ministerial responses are substantive.

## Analytical Uncertainties

**Structural uncertainty 1**: Interpellation → policy change causal mechanism is uncertain. Historical success rates for parliamentary questions leading to concrete policy outcomes are low (estimated 15–25% lead to any policy change based on Riksdag historical studies). Analysis focuses on political positioning and electoral implications rather than direct policy change.

**Structural uncertainty 2**: Electoral implications are inherently uncertain at T-4 months (current state: May 2026 with September 2026 election). The analysis provides a directional assessment; precise vote-share impact cannot be estimated from interpellations analysis alone.

**Analytic bias acknowledgement**: The analytical framework prioritises opposition accountability pressure as the default lens (because that is what interpellations are designed to create). This may systematically underweight the government's narrative response capacity. The SWOT analysis and Devil's Advocate artifact explicitly address this risk.

## AI-FIRST Pass Summary

**Pass 1**: Produced initial versions of all 23 artifacts in structured systematic order (manifest → README → executive brief → synthesis → significance → classification → SWOT → risk → threat → stakeholder → cross-reference → scenario → comparative → devil's advocate → intelligence assessment → methodology → election → voter → coalition → historical → media → feasibility → forward indicators). Per-document analyses (20 × Family E) then written.

**Pass 2 read-back and improvement**: Executive brief deepened with ministerial vulnerability analysis. Synthesis-summary expanded with political intelligence assessment section IV (forward assessment). SWOT strengths section added explicit economic narrative baseline. Risk assessment added velocity assessment sub-section. Scenario analysis added wildcard events. Comparative international added economic provenance block. Intelligence assessment added evidence quality section. All artifacts cross-checked for consistency in ministerial names, dok_ids, riksmöte references.

**Pass-2 status: executed in full**

## Quality Gates Met

- [x] All 23 always-on artifacts present
- [x] All 20 per-document analyses (Family E) in documents/ subfolder
- [x] pir-status.json created with schema-compliant structure
- [x] data-download-manifest.md includes all 20 dok_ids with retrieval time and full-text status
- [x] synthesis-summary.md >800 words with forward assessment section
- [x] pass1/ snapshot directory created
- [x] No banned shell patterns used in generation
- [x] Analysis language: English (Swedish proper nouns preserved verbatim)
- [x] No article.<lang>.md files created (forbidden by validate-file-ownership.ts)
- [x] IMF economic data with provenance block in comparative-international.md
