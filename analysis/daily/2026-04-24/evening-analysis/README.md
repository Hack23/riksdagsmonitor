# Evening Analysis — 2026-04-24

**Type**: Tier-C daily aggregation (evening)
**Depth**: deep
**Generated**: 2026-04-24 evening cycle
**Coverage**: Synthesis across propositions, motions, committee reports, and interpellations filed 2026-04-24.

## Core narrative

**Tidö pre-election legacy sprint**: four PM-signed propositions paired with five committee reports establish coalition legacy on coercive-authority + financial institutional + migration bifurcation axes; opposition counter-choreographs via 12 motions (S/V/MP cluster) + 16 interpellations (S-dominated 75%) supplying campaign narrative. SD zero-motions day = coalition discipline intact.

## Artifact index (23 core + README)

### Family A — Collection & classification (5)
1. [`data-download-manifest.md`](data-download-manifest.md) — Input inventory and sibling folder audit
2. [`executive-brief.md`](executive-brief.md) — 6 bottom-line findings (BLUF)
3. [`synthesis-summary.md`](synthesis-summary.md) — Cross-type narrative synthesis
4. [`classification-results.md`](classification-results.md) — 7-dim classification matrix
5. [`significance-scoring.md`](significance-scoring.md) — DIW top-20 + tier assignment

### Family B — Analysis & foresight (11)
6. [`intelligence-assessment.md`](intelligence-assessment.md) — 7 KJs, 7 PIRs, ICD 203 checklist
7. [`stakeholder-perspectives.md`](stakeholder-perspectives.md) — 6-lens analysis + 4 red-team roleplays
8. [`swot-analysis.md`](swot-analysis.md) — SWOT + TOWS matrix
9. [`risk-assessment.md`](risk-assessment.md) — 15-item register, L×I heat map
10. [`threat-analysis.md`](threat-analysis.md) — Taxonomy + HD03252 attack tree
11. [`scenario-analysis.md`](scenario-analysis.md) — 4 scenarios (Σ=1.00) + signposts
12. [`comparative-international.md`](comparative-international.md) — Nordic + EU comparator set
13. [`devils-advocate.md`](devils-advocate.md) — H1/H2/H3 competing hypotheses + ACH
14. [`methodology-reflection.md`](methodology-reflection.md) — ICD 203 audit + 3 improvements
15. [`implementation-feasibility.md`](implementation-feasibility.md) — 4-dim feasibility scoring
16. [`forward-indicators.md`](forward-indicators.md) — 20 dated indicators, 4 horizons

### Family C — Political intelligence (4)
17. [`election-2026-analysis.md`](election-2026-analysis.md) — Coalition scenarios (Σ=1.00)
18. [`voter-segmentation.md`](voter-segmentation.md) — 7-segment matrix
19. [`coalition-mathematics.md`](coalition-mathematics.md) — Vote-count projections per dok_id
20. [`historical-parallels.md`](historical-parallels.md) — 10 Swedish+Nordic+EU analogs

### Family D — Media & framing (1)
21. [`media-framing-analysis.md`](media-framing-analysis.md) — Outlet-by-outlet framing matrix

### Family E — Provenance (2)
22. [`cross-reference-map.md`](cross-reference-map.md) — Traceability web + sibling-folder citations
23. `article.md` (generated) — Aggregated long-form article (EN + SV rendered)

## Key Judgments (from intelligence-assessment.md)

- **KJ1** (HIGH conf) — Sprint thesis holds; coordinated PM-signed legacy push
- **KJ2** (HIGH conf) — CU25 + SfU23 + FiU23 demonstrate committee discipline
- **KJ3** (MEDIUM-HIGH) — SD zero-motions = intra-coalition discipline intact
- **KJ4** (MEDIUM-HIGH) — S-led opposition uses procedural tools (interpellations) > motions
- **KJ5** (HIGH) — HD03252 ECHR risk is dominant latent legal vulnerability
- **KJ6** (MEDIUM) — HD03253 CRR3 transposition on-track with > 85% probability
- **KJ7** (MEDIUM) — L flank is binding political constraint on HD03252 amendment path

## Top-5 dok_ids

| dok_id | Type | Subject | Tier |
|--------|------|---------|------|
| HD03252 | Prop | Detainee benefits | T1 (NATIONAL) |
| HD03253 | Prop | CRR3/CRD6 transposition | T2 (HIGH) |
| HD01CU25 | Bet | Prison capacity | T2 |
| HD10447 | IP | SME sick-pay | T2 |
| HD024082 | Mot | Drivmedel S | T3 |

## Process metadata

- **Pass structure**: Pass 1 (generate) + Pass 2 (self-critique, selective)
- **Tradecraft**: ICD 203 checklist complete; Admiralty confidence codes; Kent Scale; H1/H2/H3 in ACH
- **Sibling citations**: propositions, motions, committeeReports, interpellations under `2026-04-24/`
- **Prior-cycle ingestion**: PIR-set carried from prior day + prior week

## How to regenerate

```bash
# Render article + HTML
npx tsx scripts/aggregate-analysis.ts --date 2026-04-24 --subfolder evening-analysis
npx tsx scripts/render-articles.ts --date 2026-04-24 --subfolder evening-analysis --lang en,sv
```

