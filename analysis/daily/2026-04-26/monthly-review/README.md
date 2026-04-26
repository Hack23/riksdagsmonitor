# Monthly Review Analysis — 2026-04-26

**Type**: Tier-C Monthly Aggregation  
**Period**: 2026-03-27 → 2026-04-26 (30-day window)  
**Author**: James Pether Sörling  
**Date**: 2026-04-26  
**Election countdown**: 140 days (2026-09-13)

## Overview

This directory contains the full 23-artifact analytical portfolio for the monthly-review Riksdagsmonitor intelligence report. It aggregates legislative, political-intelligence, and electoral analysis for the April 2026 parliamentary session closing window.

## Core Documents

| File | Purpose | Gate requirement |
|------|---------|-----------------|
| executive-brief.md | BLUF, 3 decisions, Mermaid | Yes — first section |
| synthesis-summary.md | DIW ranking, 5 themes, PIR-A–E | Yes |
| intelligence-assessment.md | KJ-1–4, ICD 203 audit, prior PIRs | Yes — Tier-C prior-cycle cite |
| significance-scoring.md | 16-item DIW table, sensitivity | Yes |
| swot-analysis.md | S/W/O/T matrix, TOWS, Mermaid | Yes |
| risk-assessment.md | 6-risk register, cascades | Yes |
| threat-analysis.md | Threat taxonomy, MITRE | Yes |
| stakeholder-perspectives.md | 6-lens matrix, influence network | Yes |
| classification-results.md | 7-dimension classification per doc | Yes |
| cross-reference-map.md | Legislative chains, sibling folders | Yes — Tier-C sibling cite |
| scenario-analysis.md | 3 scenarios, probabilities = 100% | Yes |
| comparative-international.md | Germany, Netherlands, Estonia | Yes (≥2 comparators) |
| devils-advocate.md | H-1/H-2/H-3, ACH matrix | Yes |
| methodology-reflection.md | ICD 203 audit, IMF outage note | Yes |
| election-2026-analysis.md | Seat projections, 140-day timeline | Yes |
| voter-segmentation.md | 6 segments, legislation links | Yes |
| coalition-mathematics.md | Seat table, vote records | Yes |
| historical-parallels.md | 3 precedents ≤40 years | Yes (named precedents) |
| media-framing-analysis.md | 5 frames, ecosystem map | Yes |
| implementation-feasibility.md | 4 docs feasibility scored | Yes |
| forward-indicators.md | 14 indicators, 4 horizons | Yes (≥10 required) |
| data-download-manifest.md | Provenance manifest | Yes |

## Per-Document Files

All per-document analysis is in `documents/`:

| File | dok_id | Type |
|------|--------|------|
| documents/HD01JuU10-analysis.md | HD01JuU10 | Committee report (vapenlag) |
| documents/HD01JuU31-analysis.md | HD01JuU31 | Committee report (polisreform) |
| documents/HD01SoU25-analysis.md | HD01SoU25 | Committee report (äldrevård) |
| documents/HD01CU24-analysis.md | HD01CU24 | Committee report (civilrätt) |
| documents/HD10448-analysis.md | HD10448 | Interpellation (energy) |
| documents/HD11747-analysis.md | HD11747 | Interpellation (labour) |
| documents/HD11748-analysis.md | HD11748 | Interpellation (consular) |
| documents/HD11749-analysis.md | HD11749 | Interpellation (prison schooling) |

## Analysis Pipeline

This directory feeds:
1. `scripts/aggregate-analysis.ts --date 2026-04-26 --subfolder monthly-review` → `analysis/daily/2026-04-26/monthly-review/article.md`
2. `scripts/render-articles.ts --date 2026-04-26 --subfolder monthly-review --lang en,sv` → `news/2026-04-26-monthly-review-en.html`, `news/2026-04-26-monthly-review-sv.html`

## Pass 1 / Pass 2 Snapshots

`pass1/` directory contains Pass-1 snapshots of all artifacts for gate verification.
