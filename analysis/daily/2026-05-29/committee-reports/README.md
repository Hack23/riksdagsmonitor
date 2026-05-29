# Committee Reports Analysis — 2026-05-29

This folder contains the deep political-intelligence analysis for **seven Swedish parliamentary committee reports (betänkanden)** reported on 2026-05-28 and entering the chamber decision pipeline. All artifacts are AI-generated for Riksdagsmonitor (Hack23 AB) under the AI-FIRST two-pass methodology.

## Scope

| dok_id | Committee | Subject | Reservations | Controversy |
|--------|-----------|---------|--------------|-------------|
| HD01NU20 | Näringsutskottet | Wind-power revenue-sharing | 10 (S,C,V,MP) | HIGH |
| HD01UbU23 | Utbildningsutskottet | New school curricula | 11 (S,V,C,MP) | HIGH |
| HD01JuU35 | Justitieutskottet | Sentences served abroad (qualified majority) | 3 (V,MP) | MEDIUM/constitutional |
| HD01MJU27 | Miljö- och jordbruksutskottet | Food-chain fraud control | 0 | LOW |
| HD01TU17 | Trafikutskottet | Anti-fraud telecom rules | 0 | LOW |
| HD01TU18 | Trafikutskottet | Public-sector data interoperability | 0 | LOW |
| HD01CU44 | Civilutskottet | EU "EU Inc." subsidiarity review | 0 | LOW |

Source: https://data.riksdagen.se (Riksdag open data).

## Key cross-cutting finding

The batch splits cleanly into a **two-item high-controversy cluster** (energy HD01NU20, education HD01UbU23 — 21 reservations combined, full opposition bloc) and a **four-item consensus cluster** (HD01MJU27, HD01TU17, HD01TU18, HD01CU44), with HD01JuU35 a **constitutional outlier** requiring a qualified majority.

## ⚠️ Primary caveat

All seven reports were **debated 2026-05-28 but not yet voted**; chamber `voteringar` records are PENDING. Party-level vote shares are therefore projected from reservation alignment, not observed. HD01CU44 additionally has minimal full text (~1.5 KB) — flagged LOWER confidence.

## Artifact families

- **Family A — Core synthesis (9):** README, executive-brief, synthesis-summary, significance-scoring, classification-results, swot-analysis, risk-assessment, threat-analysis, stakeholder-perspectives.
- **Family B — Structural metadata (2):** data-download-manifest, cross-reference-map.
- **Family C — Strategic extensions (5):** scenario-analysis, comparative-international, devils-advocate, intelligence-assessment, methodology-reflection.
- **Family D — Electoral & domain lenses (7):** election-2026-analysis, voter-segmentation, coalition-mathematics, historical-parallels, media-framing-analysis, implementation-feasibility, forward-indicators.
- **Family E — Per-document:** `documents/{dok_id}-analysis.md` × 7.
- **Sidecar:** `pir-status.json` (PIR roll-forward, schema v1.0).

## Methodology

Authored per `analysis/methodologies/ai-driven-analysis-guide.md` with two complete passes (Pass 1 create → snapshot `pass1/` → Pass 2 read-back improvement). Economic context sourced IMF-first (cached WEO-2026-04). Author byline: James Pether Sörling.

## Pass-2 cross-artifact reconciliation

The second pass reconciled a tension between two valid lenses: **reservation-weighted significance** (which ranks HD01TU18 low) and **structural reach** (which ranks it high). The resolution — applied consistently across `significance-scoring.md`, `synthesis-summary.md` and `devils-advocate.md` — is to keep HD01TU18's low *political* salience while flagging it as the batch's **most underrated report** on institutional grounds (HD01TU18). Readers comparing those artifacts will now find a single coherent position rather than three independent scores.
