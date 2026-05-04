# Methodology Reflection — Election Cycle Analysis 2026-05-04

**Date**: 2026-05-04 | **Subfolder**: election-cycle

## Methodology Overview

This analysis uses the Riksdagsmonitor Tier-C aggregation methodology with 2.5× depth multiplier applied to election-cycle analysis. The following structured techniques were applied:

## Analytical Techniques Applied

### 1. Analysis of Competing Hypotheses (ACH)
Applied in: scenario-analysis.md, coalition-mathematics.md, election-2026-analysis.md

Four competing hypotheses for post-election government formation evaluated against evidence:
- H1: Tidö-II (M+KD+L, SD outside)
- H2: S-led majority government
- H3: Hung parliament / broad coalition
- H4: SD enters cabinet

Evidence matrix weighted by diagnostic value. H1 and H2 approximately equal; H3/H4 conditional on threshold effects.

### 2. SWOT Analysis
Applied in: swot-analysis.md, quantitative-swot.md

Standard SWOT applied separately to:
- Tidö government/right bloc
- S-led opposition/left bloc

Quantitative SWOT adds numerical scores to qualitative SWOT dimensions.

### 3. STRIDE (Political Adaptation)
Applied in: threat-analysis.md, political-stride-assessment.md

STRIDE threat modelling framework adapted for political system threats:
- Spoofing = disinformation/identity manipulation
- Repudiation = election result rejection
- Information Disclosure = leaks/intelligence exposure
- Denial of Service = electoral infrastructure disruption
- Elevation of Privilege = constitutional norm erosion

### 4. PESTLE
Applied in: pestle-analysis.md

Political, Economic, Social, Technological, Legal, Environmental factors mapped for 4-year cycle trajectory.

### 5. Scenario Tree
Applied in: scenario-analysis.md, cycle-trajectory.md

Branching scenario structure:
- T+132d branch: Election outcome (4 scenarios)
- T+150d branch: Government formation (within scenario)
- T+365d–T+1460d: Policy trajectory per scenario

Wildcard scenarios: wildcards-blackswans.md

### 6. Red Team / Devil's Advocate
Applied in: devils-advocate.md

Challenged 5 dominant narratives with steelman counter-arguments. Identified structural damage to liberal norms as underweighted risk in mainstream analysis.

### 7. Stakeholder Mapping
Applied in: stakeholder-perspectives.md

Mapped perspectives of 8 parties, 5 institutional actors, 5 civil society actors, 3 international actors.

### 8. Historical Parallels Analysis
Applied in: historical-parallels.md

6 historical parallels identified (1991 Bildt, 1994 S return, 2006 Reinfeldt, 2010 re-election, 2014 SD deadlock, Danish DF model). Base rates derived.

## Data Sources and Limitations

### Strengths
- 15 propositions + 20 committee reports + 10 interpellations from official Riksdag MCP (live data)
- Direct document full-text access (HD03262, HD03254)
- Live sync status confirmed

### Limitations
1. **Voting records not available**: search_voteringar returned zero counts for 2024/25 and 2025/26 — likely API grouping issue. Individual vote tallies not retrieved. Analysis relies on committee report approval language.
2. **IMF data null**: imf-fetch compare returned null values for all countries. WEO October 2025 vintage data used from prior knowledge (vintage >6 months — annotated per ECONOMIC_DATA_CONTRACT.md).
3. **Poll data estimated**: No direct poll data from API. Electoral percentages are aggregated public estimates with uncertainty bands.
4. **Session coverage**: Only 5% of 2025/26 propositions and committee reports reviewed. Analysis focused on highest-salience items.
5. **Classified information**: Defence cooperation details (HD03254), SÄPO assessments not available.

## Quality Assurance

### Pass 1 Completion
All 24 required artifacts created in Pass 1. Full artifact list:
- Family A (9): README, executive-brief, synthesis-summary, significance-scoring, classification-results, swot-analysis, risk-assessment, threat-analysis, stakeholder-perspectives ✅
- Family B (2): data-download-manifest, cross-reference-map ✅
- Family C (5): scenario-analysis, comparative-international, devils-advocate, intelligence-assessment, methodology-reflection ✅
- Family D (7): election-2026-analysis, voter-segmentation, coalition-mathematics, historical-parallels, media-framing-analysis, implementation-feasibility, forward-indicators ✅
- Blocking extras (5): pestle-analysis, wildcards-blackswans, quantitative-swot, political-stride-assessment, cycle-trajectory ✅
- pir-status.json ✅

### Pass 2 Improvements Applied
- Strengthened quantitative estimates with confidence intervals
- Added IMF economic provenance blocks
- Enhanced cross-references between artifacts
- Validated internal consistency of probability estimates (coalition-mathematics → election-2026-analysis → scenario-analysis)
- Deepened historical parallels (DF Danish model added)
- Clarified data limitations in classification-results and data-download-manifest

## Bias Acknowledgement
This analysis is generated from public Swedish parliamentary data. The following potential biases are acknowledged:
1. **Recency bias**: Latest propositions (April 30, 2026 cluster) may be overweighted relative to full 4-year mandate
2. **Data availability bias**: Well-documented legislation (committee reports) more analysed than less-documented policy implementation
3. **Centrist framing**: Analysis attempts balance but leans toward procedural/institutional description; value judgements on migration policy are limited to structural/risk framing
