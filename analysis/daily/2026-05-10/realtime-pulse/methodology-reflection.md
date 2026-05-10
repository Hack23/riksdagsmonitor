# Methodology Reflection — Realtime Pulse 2026-05-10

## Data Pipeline Assessment

### Sources Used

| Source | Tool | Status | Data Quality |
|---|---|---|---|
| Riksdag MCP (riksdag-regering) | get_propositioner, get_motioner, get_interpellationer, search_anforanden, search_voteringar, get_dokument_innehall | LIVE | HIGH — official parliamentary data |
| IMF WEO Apr-2026 | imf-fetch.ts weo | DEGRADED | MEDIUM — Datamapper accessible, SDMX 404 |
| IMF IFS (monthly) | imf-fetch.ts sdmx | FAILED | N/A |
| SCB | Not queried | N/A | N/A |
| World Bank | Not queried | N/A | N/A |
| Statskontoret | Not accessible | Trigger fired, domain not reachable | N/A |
| Lagrådet | Not accessible | Domain not in firewall allow-list for this run | N/A |

### Data Limitations

**Full-text unavailability**: The riksdag-regering MCP returned metadata-only for all propositions (fulltext_available=true but text=null). This prevents precise quoting from HD03267, HD03261, and HD03250. All analysis is based on title, committee routing, department attribution, and contextual understanding of Swedish legislative processes. This is a significant limitation for the lead story (HD03267).

**Mitigation**: Relied on established knowledge of the legislative domain (SÄPO classification, utlänningslagen, ECHR framework) and comparative analysis (Denmark/Germany/UK models) to provide substantive analysis despite missing full text.

**IMF data degradation**: IFS/SDMX endpoint returning 404 prevents precise monthly macro data. Used WEO Apr-2026 approximations for Swedish GDP growth (~2.1%) and fiscal headroom estimates. All economic claims are marked as IMF-sourced with vintage Apr-2026 and degraded-status annotation.

### Analytical Methodology

**STRIDE threat analysis**: Applied to key political actors and their likely responses to HD03267 and prop 2025/26:246.

**SWOT framework**: Applied to the Tidö coalition's pre-election legislative sprint as a whole — capturing both vulnerabilities and opportunities in the batch of legislation.

**Scenario analysis**: Four primary scenarios modeled with probability assessments, using WEP (Words of Estimative Probability) language calibrated to the National Intelligence Council standards (LIKELY ≈ 55–70%, AS LIKELY AS NOT ≈ 45–55%, etc.).

**Devil's Advocate**: Applied to four conventional claims to test analytical robustness. Key finding: criminal-age opposition coalition should be assessed as more fragile than initial read.

**Election-Proximity Multiplier**: Applied 1.5× DIW multiplier to all contested legislation given <6 months to SE-2026 election (cutoff 2026-03-13, current date 2026-05-10, 126 days to election).

### Improvement from Pass 1 to Pass 2

**Pass 2 improvements applied**:
1. Strengthened ECHR procedural-safeguard analysis in comparative-international.md (added closed-hearing/special-advocate mechanisms)
2. Added fragility caveat to criminal-age opposition coalition in intelligence-assessment.md (P~45% for sustained majority, down from 55%)
3. Reduced KD/SD energy tension risk from MEDIUM to LOW-MEDIUM based on Devil's Advocate analysis
4. Strengthened economic context in cross-reference-map.md with explicit IMF provenance block
5. Enhanced threat velocity matrix with specific monitoring cadences
6. Added BankID split-banking challenge to devil's advocate
7. Upgraded WEP language precision across scenario-analysis.md

### Confidence Assessment

| Artifact | Analytical Confidence |
|---|---|
| Executive brief | MEDIUM-HIGH |
| Synthesis summary | MEDIUM-HIGH |
| Significance scoring | HIGH (methodology-based) |
| Risk assessment | MEDIUM (limited full-text) |
| Threat analysis | MEDIUM-HIGH |
| Scenario analysis | MEDIUM |
| Comparative international | HIGH |
| Devil's advocate | HIGH |
| Intelligence assessment | MEDIUM-HIGH |
| Election-2026 analysis | HIGH |
| Stakeholder perspectives | HIGH |

**Overall pipeline confidence**: MEDIUM-HIGH — the absence of full-text for the three leading propositions is the primary limitation. The analysis compensates with deep contextual and comparative knowledge, but quantitative claims (cost estimates, specific legal clause analysis) carry LOW confidence.
