---
title: "Methodology Reflection — Post-2026 Forecast"
date: 2026-05-18
subfolder: election-cycle/next
horizon: cycle
---

# Methodology Reflection — Post-2026 Cycle Forecast

## Analytical Standards Applied

- **ICD 203** [A1–C3 sourcing]; **ICD 206** for analytical caveats.
- **Structured Analytic Techniques**: Devil's Advocacy (`devils-advocate.md`), ACH, Key-Assumption Check (`intelligence-assessment.md §Key Assumptions Check`), Scenario Trees (`scenario-analysis.md` 12 leaves).
- **Estimative Language**: WEP probability ladder (*very unlikely* 1–10% → *almost certain* 90–99%) with `[horizon:cycle/election]` tagging.

## Polling Triangulation

Sifo / Novus / Demoskop 2026-04 + 2026-05 waves; aggregate via inverse-variance weighted mean. Methodology consistent since 2022. Aggregate variance < 1.5 pp at 95% CI.

## Tree-Construction Rules

- **4 base × 3 coalition branches = 12 leaves**.
- **Mutually exclusive at leaf level**; probabilities sum to 100% at each node.
- **Wildcards = independent overlays** (additive, not redistributive at leaf level).

## Confidence Calibration

We apply Tetlock-style calibration: forecast probabilities are intended to be **frequency-grade**, not subjective certainty. Post-event re-anchoring per `pir-status.json` updates.

## Sources of Forecast Uncertainty

1. **Polling vintage volatility** (Sifo / Novus / Demoskop wave-to-wave) — ±1.5 pp.
2. **Late-cycle event volatility** (KU disposition, SD signals) — discrete 3–5 pp impacts.
3. **Coalition signalling latency** — public-position-disclosure timing not predictable.
4. **External shocks** (W1–W5 wildcards) — independent tail-events.

## What Would Change Forecast Materially

- L-threshold survival probability moving outside [40, 70] pp range.
- SD polling moving outside [17, 22] pp range.
- C public coalition-preference declaration.
- Major external shock (Russia / fiscal / scandal) within 30 days.

## Reproducibility

All forecast probabilities are derived from:
- Sainte-Laguë math on aggregate poll midpoints + 4%-threshold sensitivity.
- Coalition-formation precedent from `comparative-international.md` + `historical-parallels.md`.
- Tail-risk overlay per `wildcards-blackswans.md`.

Re-running this analysis with updated polling vintage will shift leaf probabilities within ±5 pp at the leaf level (±2 pp at cluster level) over a 30-day forward window.

## AI-FIRST Iteration Log

- **Pass 1 (created)**: scenario tree, 12 leaves, wildcards W1–W5, 3 counterfactuals, integrated synthesis-summary.
- **Pass 2 (re-read + improved)**: tightened probability bands per ICD-203 grading, added cross-references between leaves and wildcards (W4 conditioning A2), expanded comparative parallels (DE 2017, NL 2021, BE 2010, SE 2018, FI 2023), enriched historical parallels with cross-cycle lessons, calibrated forward indicators to 15 dated events.
- **Improvement-mode**: confidence bands re-anchored to Tetlock-style frequency-grade; estimative language standardised.



## Re-run log

- **Re-run**: 2026-05-18T10:00:16Z · workflow=News: Election Cycle · run_id=25853704629 · attempt=1
  - anchor: next
  - new dok_ids: none (improvement-mode bootstrap from 2026-05-18 baseline)
  - artifacts extended: synthesis-summary, executive-brief, article.md re-aggregated for 2026-05-18 horizon (T+1y=2027-05, T+5y=2031-05)
  - flags closed: 0
  - vintage refresh: IMF WEO Apr-2026 still current (no new vintage available)
