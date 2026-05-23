# Methodology Reflection — Weekly Review, Week of 23 May 2026

**Date**: 2026-05-23 | **Depth**: deep

## SAT Catalog Attestation (≥ 10 techniques required)

| # | Technique | Where Applied |
|---|-----------|---------------|
| 1 | Analysis of Competing Hypotheses (ACH) | synthesis-summary.md — PIJ 1–4 confidence assessment |
| 2 | Devil's Advocacy | devils-advocate.md — 4 structured challenges to dominant narrative |
| 3 | Indicators and Warnings | intelligence-assessment.md — PIR register |
| 4 | Key Assumptions Check | devils-advocate.md §DA-1 |
| 5 | High Impact/Low Probability | scenario-analysis.md §Scenario D |
| 6 | What If? Analysis | scenario-analysis.md §Scenarios B, C |
| 7 | Team A/Team B | stakeholder-perspectives.md — coalition vs. opposition positioning |
| 8 | Outside-In (environmental scan) | comparative-international.md — Nordic/EU comparison |
| 9 | Red Team | threat-analysis.md §T3 — opposition coordination assessment |
| 10 | Chronological Reconstruction | README.md weekly timeline; data-download-manifest.md |
| 11 | Admiralty Code | intelligence-assessment.md — source reliability table |
| 12 | WEP Language Calibration | All PIJ statements use calibrated probability language per ICD 203 |

✅ 12/10 SAT techniques attested — meets deep-tier requirement.

## Source Quality Assessment

### Primary Sources Used
- **Riksdagen API** (riksdag-regering MCP): A1 — completely reliable, confirmed
  - dok_ids: HD024192, HD024191, HD01FiU42, HD01SfU37, HD01UbU19/22/27, HD01UU11/12, HD01CU26, HD10502–10508, HD11828–11835
  - Full-text retrieved: 10/10 top documents (all L1-Critical and L2-Priority with full text)
- **IMF WEO Apr-2026** (vintage WEO-2026-04): A1 — used for Sweden GDP growth, fiscal context
- **Lagrådet** (web_fetch): Not retrieved — lagradet.se check pending (not yet needed as prop. 2025/26:267 yttrande not yet published as of 2026-05-23)
- **Statskontoret**: Pre-warm trigger evaluation completed — trigger fired for Skatteverket/Skolverket mandates but no specific recent report retrieved; noted in risk-assessment.md

### Source Gaps
- Statskontoret: No specific 2025/26 report on Skatteverket population-register mandate found. Noted as limitation.
- Lagrådet yttrande on prop. 2025/26:267: Not yet published. PIR-1 open.
- SCB ground truth: Labour market data not separately retrieved this run; IMF WEO used as proxy for Sweden macro.

## Content Metrics

| Artifact | Lines (est.) | Full-text basis | Admiralty rating |
|---------|-------------|-----------------|-----------------|
| synthesis-summary.md | ~80 | Full-text for all L1 | B2 |
| executive-brief.md | ~120 | Full-text for all L1 | B2 |
| risk-assessment.md | ~100 | Full-text + committee composition | B2 |
| threat-analysis.md | ~110 | Full-text + ECHR precedent | B2 |
| scenario-analysis.md | ~95 | Committee composition + history | C2 |
| stakeholder-perspectives.md | ~110 | Full-text + party platforms | B2 |
| intelligence-assessment.md | ~100 | Full-text + primary sources | B2 |
| Prior-voteringar enrichment | AU10 (2026-03-04) | Voteringar API | B2 (direct records) |

**Prior-voteringar status**: search_voteringar returned AU10 2026-03-04 (unanimous on labour procedural matter). No FiU/UbU/JuU specific votes indexed yet for 2025/26 in the API results — consistent with new riksmöte pattern. Voteringar enrichment tagged as partial (🟡) per the fallback hierarchy. The most recent indexed vote (AU10, 2026-03-04) is cited in the manifest.

## AI FIRST Quality Assessment

**Pass 1**: All 23 artifacts created with substantive content grounded in:
- Full-text documents (HD024192, HD024191, HD01FiU42, HD01UbU19/22/27, HD01UU11/12)
- Named actors and specific dok_ids on every claim
- Calibrated WEP language throughout
- Mermaid diagrams in SWOT, stakeholder, cross-reference
- Admiralty ratings on all intelligence judgments

**Pass 2 priorities** (self-identified for improvement):
1. Deepen HD01SfU37 analysis — only metadata available; need more specifics on attachment conditions
2. Strengthen IMF economic evidence linkage in UbU27 analysis
3. Expand comparative-international.md with OECD education data
4. Add more specific Statskontoret reference on agency capacity

## Re-Run Delta (Pass 2 — Improvement Run, 2026-05-23 09:22Z)

**Run**: 26329074071 attempt 1 | **Mode**: IMPROVEMENT_MODE=true (all 23 artifacts present)

| Artifact | Change | Rationale |
|---------|--------|-----------|
| `forward-indicators.md` | Added F-9 (S/opposition coordination on security) and F-10 (Skolinspektionen UbU22 monitoring); PIR status table updated | ≥ 10 indicators required; gaps F-9 and F-10 identified in Pass 1 self-audit |
| `comparative-international.md` | Expanded VET/vocational section with OECD Education at a Glance 2024 data, per-country apprenticeship share table, EU VET Recommendation 2020/C 417/01 citation | Specific OECD data required vs. generic references; provenance added |
| `media-framing-analysis.md` | Added Outlet Bias Audit table (SVT, SvD, DN, Aftonbladet, Expressen, SR/Ekot) with ownership/funding/trust/PO-PON data; DISARM TTP assessment; RRPA impact table; renamed Frame 3 and Frame 4 per v2.1 no-neutral-media doctrine | v2.1 compliance requirements: Outlet Bias Audit, DISARM TTP map, RRPA block |

**New dok_ids discovered**: None (rerun confirmed same 26 documents as Pass 1).
**Flags closed**: Forward-indicators gap (< 10 indicators → closed to 10); media-framing v2.1 compliance gap.
**Vintage refresh**: IMF WEO Apr-2026 (vintage WEO-2026-04) — live IMF fetch failed (network); WEO context from `data/imf-context.json` (status: ok, vintageAgeMonths: 1) confirms non-stale.

## GDPR Art. 9 Compliance

- All named individuals cited in public parliamentary capacity only
- No private data points used
- Lawful bases applied: Art. 9(2)(e) — manifestly made public; Art. 9(2)(g) — substantial public interest
- Data minimisation: Party positions cited at group level; individual MPs named only where they are the bill's author/spokesperson in a public document
