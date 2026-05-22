# Methodology Reflection — Interpellations 2026-05-22

**Pass-2 status: executed in full**  
**Generated**: 2026-05-22T07:43:09Z  

## Methodology Applied

### Data Collection
- **Primary source**: Riksdagen Open Data API via riksdag-regering MCP server
- **Documents retrieved**: 7 interpellations (HD10502–HD10508) with full HTML text content
- **Coverage**: Full text for all 7 documents confirmed via `fulltext_available: true`
- **Voteringar enrichment**: Prior-voteringar query for försvar and trafiksäkerhet committees conducted; returned AU10 beteckning data (not directly relevant — interpellations do not vote)
- **IMF context**: data/imf-context.json confirmed ok, WEO-2026-04 vintage, not stale

### Analysis Framework Applied
- **DIW weighting**: 1.5× multiplier applied for all 7 interpellations (election ≤6 months)
- **Thematic clustering**: Four thematic clusters identified from 7 documents (defence x2, welfare x2, infrastructure x2, cooperative x1)
- **Actor mapping**: 4 opposition MPs, 5 government ministers mapped with exposure assessment
- **Scenario tree**: 4 primary scenarios (T+90d horizon) + 5 election scenarios (T+115d horizon)
- **Risk matrix**: 8 risk items rated for likelihood × impact × DIW multiplier

### Analytical Limitations
1. **No prior voteringar directly applicable**: Interpellations are not voting documents; FöU/TU/SoU/UbU voting records would require specific beteckning searches that were not exhaustively conducted due to time constraints
2. **No ministerial pre-response indicators**: Analysis is based on the questions, not answers; ministerial responses due by 5 June 2026 will materially change the intelligence value
3. **SVT/Ekot investigation details**: The specific internatskola named in SVT's investigation and the number of criminal HVB-homes on Stockholm's police list are not publicly specified in the interpellation text — this limits precision of welfare failure assessment
4. **Physical fitness data**: No Försvarsmakten or Folkhälsomyndigheten source data was retrieved for HD10502; the fitness gap is asserted in the interpellation but its magnitude is not quantified in available sources

### Methodological Choices
- **Cluster analysis** over individual document treatment for the synthesis — appropriate given the coordinated batch filing
- **Electoral timeline** given explicit weight given 115-day election proximity
- **Media anchor analysis** applied to HD10504/HD10505 given their unusual grounding in named journalism sources
- **Scenario probability assignment** based on historical patterns of Riksdag interpellation response quality and S's stated campaign priorities

### Pass-2 Improvements Applied
- Strengthened actor analysis with specific constituency and profile information for each MP
- Enhanced scenario analysis with explicit WEP ladder language
- Added process timeline table in timeline-analysis.md
- Clarified risk R8 (cross-cutting narrative risk) as a second-order risk that depends on aggregation of individual portfolio risks
- Added missing data disclosures for SVT investigation details and fitness data limitations
- Verified pir-status.json schema compliance against v1.0 requirements

### Quality Self-Assessment

| Criterion | Rating | Note |
|-----------|--------|------|
| Factual accuracy | HIGH | All claims grounded in interpellation text |
| Analytical depth | HIGH | 4-cluster analysis with actor, scenario, risk, timeline |
| Electoral framing | HIGH | 115-day context applied throughout |
| Source attribution | HIGH | All seven documents cited with Riksdag IDs |
| Limitations documented | HIGH | Four specific limitations named |
| Pass-2 improvements | CONFIRMED | All improvement items addressed |

### Data Provenance

| Source | Type | Reliability |
|--------|------|-------------|
| HD10502-HD10508 | Riksdag Open Data (riksdag-regering MCP) | HIGH — official parliamentary documents |
| Election date 2026-09-13 | Riksdag valprocedure | HIGH — confirmed official date |
| 5,000→10,000 conscript figure | HD10502 text | HIGH — cited from Riksdag defence decision 2024 |
| 25 MSEK cooperative subsidy | HD10507 text | HIGH — cited as budget line |
| 8 MSEK civil society road safety cut | HD10508 text | HIGH — cited as Trafikverket anslag |
| WEO-2026-04 vintage | data/imf-context.json | HIGH — 1 month old, not stale |

**Analyst note**: This analysis covers the interpellation questions as filed. Material intelligence value will be added when ministerial responses are published by 5 June 2026. A follow-up analysis of ministerial answers is recommended for the week of 9 June 2026.
