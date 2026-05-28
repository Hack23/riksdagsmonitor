---
artifact_family: D
artifact_type: methodology-reflection
article_date: 2026-05-28
subfolder: election-cycle/current
classification: PUBLIC
workflow: news-election-cycle
---

# Methodology Reflection — Election Cycle Analysis 2026-05-28

**Pass-2 status: executed in full**

## Data Sources and Quality

### Primary data (A1 — Riksdag MCP)
All parliamentary documents fetched via `riksdag-regering` MCP server in live mode:
- Propositions: 10 most recent (get_propositioner)
- Committee reports: 10 most recent (get_betankanden)
- Opposition motions: targeted search (get_motioner, search_dokument)
- Committee report HD01CU44 (May 28, today — verified fresh)

MCP reliability during this run: **HIGH** — no timeouts, consistent JSON responses. Session used `search_anforanden`, `get_betankanden`, `get_propositioner` and `get_motioner` tools.

### Secondary data (B2 — IMF WEO April 2026)
Economic indicators (NGDP_RPCH, GGXWDG_NGDP, LUR, PCPIPCH) from IMF WEO April 2026. Vintage: April 2026. Next vintage: October 2026. **No data older than 6 months** — within vintage discipline threshold. All economic claims carry `economicProvenance` block.

### Tertiary data (C3 — polling, press statements)
Poll averages from Sifo/Novus/Ipsos April–May 2026 (three-poll rolling average). These are secondary sources that have not been independently verified this run. Seat projection model uses poll point estimates without threshold-correction.

## Analytical Limitations

1. **Missing: Almedalen positioning data** — July 2026 party positioning not yet available (future event)
2. **Missing: June SVT debate post-poll** — first post-debate measurement not yet available
3. **Missing: C-party congress resolution** — formal coalition preference declaration pending
4. **Uncertainty: SD under-measurement** — polling history suggests SD may over-perform by 1–2pp; modelled in devils-advocate but not in base scenario
5. **IMF limitations**: WEO April 2026 is the authoritative vintage but doesn't capture Q2 2026 outturn (available July). Use with caution for near-term GDP projections.

## Admiralty Scale Reference

| Code | Source quality | Information quality |
|---|---|---|
| A | Completely reliable | 1 — Confirmed by other sources |
| B | Usually reliable | 2 — Probably true |
| C | Fairly reliable | 3 — Possibly true |
| D | Not usually reliable | 4 — Doubtful |
| E | Unreliable | 5 — Improbable |
| F | Cannot be judged | 6 — Cannot be judged |

Primary parliamentary facts: **A1** | IMF economic indicators: **B2** | Polling: **B3** | Party positioning press statements: **C3**

## Improvement Log (Pass 2)

### Changes Made in Pass 2
1. **executive-brief.md**: Added T-107 quantification; enhanced H1 specificity; added Mermaid quadrant chart
2. **synthesis-summary.md**: Added IMF economic table with Nordic comparison; enhanced coalition cohesion matrix
3. **swot-analysis.md**: Added specific data points (57% women oppose HD03271; 8.4% unemployment quantification); Mermaid chart added
4. **devils-advocate.md**: Three full counterfactual paragraphs verified; strengthened with historical evidence in each
5. **scenario-analysis.md**: Added mermaid graph; enhanced WEP ranges; added S2-B2 detailed branch
6. **election-2026-analysis.md**: Added Gantt chart; enhanced seat sensitivity analysis; marginal district table
7. **coalition-mathematics.md**: Added governing programme comparison table
8. **risk-assessment.md**: Quantified R01 electoral impact model (−5 seats for M on abortion)
9. **intelligence-assessment.md**: Structured as proper KJ format with confidence ratings and gap analysis
10. All cross-references verified: ≥14 dok IDs cited, IMF provenance blocks on all economic claims

### Pass 2 Evidence Density Check
- **Specific statistics cited**: >25 (WEP ranges, seat projections, poll percentages, economic indicators, bill provisions)
- **Dok ID citations**: 14 unique IDs across artifacts
- **Mermaid charts**: 5 (executive-brief, swot-analysis, scenario-analysis, election-2026-analysis, forward-indicators)
- **IMF provenance blocks**: present in all artifacts with economic claims

## Known Data Gaps for Next Run

1. June 3–7 Sifo poll (PIR-1) — will shift L/MP threshold assessments
2. Riksbank June 19 decision — economic sentiment impact
3. GDP Q2 flash (July) — lagged economic validation
4. Almedalen statements — formation preference signals
