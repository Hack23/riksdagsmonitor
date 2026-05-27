# Methodology Reflection — Committee Reports 2026-05-27

**Framework:** Analytical transparency and methodological self-assessment  
**Analysis Date:** 2026-05-27  

---

## ANALYTICAL APPROACH

This analysis followed the Riksdagsmonitor AI-FIRST pipeline:

1. **Data acquisition:** MCP calls to riksdag-regering to retrieve betänkanden for the current riksmöte (2025/26), with full-text extraction for the three most recently published documents (HD01FöU17, HD01UFöU3, HD01CU38).

2. **Source selection:** Documents were selected based on recency (published 2026-05-22 to 2026-05-26) and analytical significance (PESTLE scoring applied in significance-scoring.md). Pre-publication documents (6 of 14 retrieved) were noted but not analysed for content.

3. **Analysis framework:** PESTLE, SWOT, risk register, stakeholder mapping, scenario trees, devil's advocate, and comparative international analysis were applied in sequence.

4. **Pass 1 → Pass 2:** All artifacts were produced in a single analysis session with iterative review. The pass 2 read-back improved specificity (added actual vote counts, MP names, proposition numbers) and removed generic language.

---

## DATA QUALITY ASSESSMENT

### Strengths
- Full text extracted from the three most significant documents (FöU17, UFöU3, CU38)
- Actual MP names, reservation numbers, and vote compositions documented from primary sources
- Proposition numbers verified (2025/26:220, 2025/26:222, 2025/26:162)
- Effective dates confirmed from the documents themselves

### Limitations

1. **Pre-publication documents:** Six of 14 betänkanden in the 2025/26 riksmöte batch are not yet publicly available (planerat status). These include potentially significant documents:
   - HD01JuU48 (new sentencing system — scheduled 2026-08-13)
   - HD01UU24 (civil intelligence service — scheduled 2026-08-13)
   - HD01SfU37 (stricter family reunification — scheduled 2026-08-13)
   - HD01FiU47 (supplementary budget — scheduled 2026-06-17)
   
   These could collectively shift the thematic balance of the analysis when published.

2. **Voting records partial:** Committee-level voting compositions are in the documents. Full chamber (plenary) voting data was not retrieved for all documents. The voteringar search for "militärt stöd Ukraina" returned unrelated results (AU10 — arbeitsmarkt).

3. **Economic context not pre-warmed:** IMF economic context (inflation, GDP growth, fiscal position) was not retrieved in this run due to IMF SDMX subscription key not being available to the analysis pipeline. Economic analysis in comparative-international.md uses publicly known approximate figures.

4. **Statskontoret and government agencies:** No cross-check against Statskontoret evaluations of relevant policy areas (crime victim compensation, vocational training).

---

## ASSUMPTIONS

1. That the "published" documents retrieved via riksdag-regering MCP are the authentic, unedited versions of the betänkanden as adopted by the relevant committees.

2. That the reservation compositions reported in the document texts (specific MP names and party affiliations) accurately represent how members voted, not just who was present.

3. That the 103 BSEK Ukraine support figure is cumulative through the skrivelse cut-off date (likely early 2026) and may not include packages authorised or announced after that date.

4. That the December 2026 mandate expiry for UFöU3 was intentionally chosen (not an error) but represents a potential institutional design gap.

---

## ANALYTICAL BIASES TO NOTE

1. **Recency bias:** Documents from 2026-05-26 receive more attention than structurally similar documents from 2026-05-22. The UbU reports from 22 May may be underweighted in the executive brief.

2. **Salience of defence theme:** The defence/NATO cluster naturally dominates in a tranche with two significant defence decisions. Education and justice reforms may be underweighted relative to their long-term social impact.

3. **Opposition framing symmetry:** The analysis attempts to give equal weight to majority and minority positions. However, with V isolated on defence and the broader opposition only partially united on justice, the minority positions may have been described more briefly than warranted.

---

## IMPROVEMENT RECOMMENDATIONS FOR FUTURE ITERATIONS

1. Pre-warm IMF economic context before starting analysis (run `tsx scripts/imf-fetch.ts weo --country SWE --indicator NGDP_RPCH --years 1`).
2. Retrieve full chamber voting data for all significant betänkanden using search_voteringar with specific beteckning codes (e.g., FöU17, UFöU3).
3. Expand voteringar search to include 2025/26 riksmöte (not just 2024/25) when the current session votes are registered.
4. Add a monitoring flag for the six pre-publication documents to trigger a re-analysis when they become publicly available (estimated June–August 2026).
