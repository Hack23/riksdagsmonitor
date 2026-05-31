# Methodology Reflection

> **Pass-2 refinement:** Named confirmation toward the "campaign lens" as the dominant analytic risk and identified the counterfactual as its explicit guard — a reflexivity step Pass 1 omitted.

A reflexive audit of how this month-ahead product was built, the standards applied, and where confidence is bounded.

## Standards applied

- **ICD 203 (Analytic Standards):** probabilistic judgments use calibrated WEP terms; confidence levels are stated and justified; sources are characterised; alternative hypotheses are tested in [`devils-advocate.md`](devils-advocate.md).
- **ICD 206 (sourcing):** every analytic claim is traced to a dok_id or primary source (riksdagen.se / regeringen.se) or to a stamped IMF vintage.
- **Tier-C aggregation contract:** recent-daily synthesis ingestion and prior-cycle PIR roll-forward executed per `ext/tier-c-aggregation.md`.
- **Long-horizon forecasting contract:** horizon tags and IMF T+N stamps applied per `ext/long-horizon-forecasting.md`.

## Method

1. Downloaded 25 documents (1-business-day lookback to 2026-05-29), full text for 10.
2. Ingested sibling/predecessor analyses for cross-reference and PIR genealogy.
3. Scored Document Impact Weight (DIW) against decisional + electoral salience.
4. Built four synthesis arcs, three scenarios, and a SWOT/risk/threat triad.
5. Stress-tested judgments via devil's-advocate hypotheses and one counterfactual.

## AI-FIRST iteration

This product was authored in two complete passes. Pass 1 created all artifacts to the gate contract; Pass 2 re-read every artifact, sharpened judgments, tightened evidence linkage, and added analytic depth where Pass 1 was thin.

**Pass-2 status: executed in full.**

### Methodology Improvements (Pass-2)

- **Improvement 1:** Strengthened the legislation-to-votes "translation seam" as the explicit confidence boundary across executive-brief, intelligence-assessment, and devils-advocate, rather than leaving it implicit.
- **Improvement 2:** Made the election-anchor endogeneity of the significance scoring explicit (Counterfactual 1), improving transparency about what drives "salience."
- **Improvement 3:** Tightened economic citations to a single stamped IMF vintage with an explicit cached-fetch caveat, avoiding spurious precision.

## Limitations & bounded confidence

- **Calendar feed outage:** exact votering dates are reconstructed, not pulled live (flagged `[unconfirmed]`); this lowers date-precision but not the substantive arcs.
- **IMF live re-fetch degraded:** economic figures rely on the cached WEO Apr-2026 vintage; values are stable, well-published projections used with hedging.
- **Forecast horizon:** at T+30d, legislative outcomes are HIGH confidence; campaign-translation effects (T+105d) are deliberately held at MEDIUM.

## Reflexivity

The dominant analytic risk is **confirmation toward the "campaign lens" frame**: because the election is so proximate, almost any document can be read as campaign-relevant. The devil's-advocate counterfactual is the explicit guard against over-fitting June legislation to a September story.
