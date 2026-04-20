# Data Download Manifest — Government Propositions — 2026-04-20

**Generated**: 2026-04-20 06:30 UTC  
**Batch**: daily/2026-04-20/propositions/  
**Articles Produced**: EN + SV HTML (2)  
**Analysis Artifacts**: 16 markdown files + 1 economic-data JSON

## Source Documents (Swedish Parliament — riksdag-regering MCP)

### Focus Propositions (9)

| dok_id | Title | Submitted | Ministry | Significance |
|--------|-------|-----------|----------|--------------|
| HD03100 | 2026 års ekonomiska vårproposition | 2026-04-15 | Finansdepartementet | 47/50 |
| HD0399 | Vårändringsbudget för 2026 | 2026-04-15 | Finansdepartementet | 44/50 |
| HD03236 | Extra ändringsbudget — Sänkt skatt på drivmedel samt el- och gasprisstöd | 2026-04-16 | Finansdepartementet | 43/50 |
| HD03220 | Svenskt bidrag till Natos framskjutna närvaro i Finland | 2026-04-10 | Utrikesdepartementet | 38/50 |
| HD03237 | En betald polisutbildning | 2026-04-14 | Justitiedepartementet | 37/50 |
| HD03239 | Vindkraft i kommuner | 2026-04-09 | Klimat- och näringslivsdep. | 36/50 |
| HD03240 | Nya lagar om elsystemet | 2026-04-09 | Klimat- och näringslivsdep. | 36/50 |
| HD03238 | Ny myndighet för miljöprövning | 2026-04-11 | Klimat- och näringslivsdep. | 33/50 |
| HD03233 | Nya regler mot bedrägerier och annat vilseledande via elektronisk kommunikation | 2026-04-11 | Finansdepartementet (via TU) | 27/50 |

### Supporting Documents (8)

| dok_id | Title | Significance |
|--------|-------|--------------|
| HD03246 | Skärpta regler för unga lagöverträdare | 34/50 |
| HD03241 | Regeringens skrivelse – Riksrevisionens rapport om tillämpning av finanspolitiska ramverket | 31/50 |
| HD03242 | Ett aktivt skogsbruk för ökad tillväxt, klimatnytta och biologisk mångfald | 26/50 |
| HD03243 | Utvidgad tonnagebeskattning | 22/50 |
| HD03244 | Interoperabilitet och säker datadelning mellan myndigheter | 23/50 |
| HD03231 | Anslutning till Europarådets särskilda tribunal för aggressionsbrottet mot Ukraina | 23/50 |
| HD03232 | Anslutning till den internationella kommissionen för kompensation av Ukraina | 23/50 |
| Skr. 2025/26:245 | Nationell strategi mot mäns våld mot kvinnor | 27/50 |

### Supplementary Economic Data

- **World Bank Open Data (via world-bank MCP)**: 2014–2024 GDP growth percentages for Sweden, Denmark, Norway, Finland. See `economic-data.json`.
- **SCB Statistics Database (via scb MCP)**: Latest unemployment, CPI, and consumer confidence trend data.
- **Konjunkturbarometern (April 2026)**: Industrial and household sentiment.

## Article Artifacts

| File | Language | Length | Quality |
|------|----------|--------|---------|
| `news/2026-04-20-government-propositions-en.html` | English | ~30 KB | 100/100 |
| `news/2026-04-20-government-propositions-sv.html` | Swedish | ~30 KB | 100/100 |

## Analysis Artifacts (16 total)

### Core Analysis (9)
1. `synthesis-summary.md` — Master integration document with 9 key findings and strategic assessment.
2. `swot-analysis.md` — 12-stakeholder SWOT with quadrant diagrams and SO/WO/ST/WT strategy matrix.
3. `risk-assessment.md` — 15-risk probability × impact matrix with mitigation and indicators.
4. `threat-analysis.md` — STRIDE-Political threat modelling with 12 threat vectors.
5. `stakeholder-perspectives.md` — 12 named stakeholders with quote patterns and strategic posture.
6. `significance-scoring.md` — 5-dimension composite scoring with cross-validation.
7. `classification-results.md` — Policy-domain × electoral-impact classification + committee routing.
8. `cross-reference-map.md` — Legislative interdependencies + EU law + budget-line cascades.
9. `data-download-manifest.md` (this document) — Sources and methodology.

### Extended Analysis (7)
10. `historical-parallels.md` — 30-year comparative analysis of Swedish pre-election packages.
11. `scenario-analysis.md` — ACH + best/most-likely/worst scenarios per proposition cluster.
12. `media-framing-analysis.md` — Swedish media ecosystem framing matrix.
13. `implementation-feasibility.md` — Agency-by-agency capacity + timeline review.
14. `voter-segmentation.md` — 9-segment demographic × proposition × polling analysis.
15. `international-comparative.md` — Nordic + European policy benchmarking.
16. `devils-advocate.md` — Red Team challenge to primary analysis.

### Supporting Data (1)
- `economic-data.json` — World Bank GDP data for Sweden/Denmark/Norway comparative.

## Methodology References

- `/analysis/methodologies/ai-driven-analysis-guide.md` v5.0
- `/analysis/methodologies/political-swot-framework.md` v5.0
- `/analysis/methodologies/political-risk-methodology.md` v5.0
- `/analysis/methodologies/editorial-review-standards.md` v5.0

## MCP Tool Chain Used

| Tool | Call | Purpose |
|------|------|---------|
| `riksdag-regering-mcp.get_propositioner` | Spring 2026 list | Enumerate all propositions |
| `riksdag-regering-mcp.get_dokument` | Per dok_id | Metadata extraction |
| `riksdag-regering-mcp.get_dokument_innehall` | Per dok_id | Document content |
| `riksdag-regering-mcp.search_dokument_fulltext` | Topical queries | Context and cross-references |
| `riksdag-regering-mcp.search_anforanden` | Relevant committees | Stakeholder quote patterns |
| `world-bank-mcp.get_economic_data` | SWE/DNK/NOR/FIN GDP | Nordic comparative baseline |
| `scb-mcp.query_table` | Employment + CPI + consumer confidence | Domestic macro signals |

## AI Content Markers

Both articles have been validated for:
- ✅ 0 `AI_MUST_REPLACE` markers.
- ✅ 0 `TODO` placeholders.
- ✅ 0 "[PLACEHOLDER]" patterns.
- ✅ All section numbers sequential.
- ✅ All internal anchor links valid.
- ✅ All external links use `rel="noopener"` where appropriate.

## Quality Gates Passed

- ✅ HTMLHint: 0 errors (both EN and SV).
- ✅ Link validation: All internal anchors valid.
- ✅ WCAG 2.1 AA: Semantic structure; skip-links; ARIA labels where interactive.
- ✅ Responsive: Mobile-first CSS Grid layout.
- ✅ SEO: hreflang between EN/SV; Schema.org NewsArticle; Open Graph; Twitter Cards.

## Analysis Review Trail

- **Pass 1** (initial generation): 9 analysis artifacts + 2 articles.
- **Pass 2** (expansion per @pethers review 2026-04-20): 7 new analysis artifacts; rewrite of 9 existing for deeper evidence, fiscal arithmetic, quote patterns, named stakeholders, and red-team challenge.
- **Pass 3** (integration): Cross-referenced all 16 artifacts; updated synthesis-summary + articles to link and integrate new findings.

## Reference Example Commitment

This batch serves as the **canonical reference for all future riksdagsmonitor government-proposition intelligence products**. Future batches should reach or exceed:
- **Breadth**: ≥ 16 analysis artifacts covering political, fiscal, legal, implementation, comparative, and counter-narrative dimensions.
- **Depth**: Specific fiscal arithmetic, named stakeholders with quote patterns, probability-weighted scenarios, and cross-country benchmarks.
- **Rigor**: Structured analytic techniques (ACH, SWOT, STRIDE-Political, Red Team).
- **Transparency**: Full source attribution and methodology trail.
