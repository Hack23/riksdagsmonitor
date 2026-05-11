# Methodology Reflection — Year-Ahead 2026-05-11

## What I did

1. **Data acquisition**: Used `download-parliamentary-data.ts --auto-full-text-top-n 5` which retrieved 180 raw documents and 15 date-matched documents, plus full text for the top-5 by significance.
2. **Significance scoring**: Applied 6-dimension scoring (Constitutional, Fiscal, Security, Civil-rights, Coalition, Long-term) on 0–1 scale; weighted-mean aggregation.
3. **Pass 1 generation**: Created all 23 mandatory artifacts plus the 3 year-ahead-blocking supplementaries (PESTLE, wildcards-blackswans, quantitative-swot).
4. **Pass 2 sharpening**: Reviewed all artifacts; sharpened evidence claims, recalibrated probabilities, added Pass-2 deltas.
5. **Cross-horizon citations**: Cited 3 quarter-ahead + 5 monthly-review documents in cross-reference-map.md (exceeds the ≥ 2 + ≥ 4 minima).
6. **Long-horizon scenarios**: Generated 4 base scenarios + 12 coalition-formation branches; 5 wildcards in supplementary.

## What I assumed

- **Polling baseline**: Used April 2026 aggregate; uncertainty ± 3 pp.
- **IMF WEO**: Treated baseline as central; tails real but not central case.
- **Coalition probabilities**: Conditional on no major scandal in 30-d pre-election window.
- **Election date**: 2026-09-13 anchored from electoral calendar (Sunday in week 37); not formally confirmed by Valmyndigheten (anchor in `analysis/article-types.json`).

## What is missing or limited

- **No primary interviews**: All sources are open data + published analyses.
- **Polling source**: Aggregated; original cross-tabs not consulted.
- **Document depth**: 5/15 docs received full-text; remaining 10 from manifest summaries only.
- **Statskontoret 2026 forthcoming reviews**: Cited as expected; not yet published.
- **EU-level dynamics**: Treated as context, not deeply analysed.
- **Black-swan completeness**: 5 wildcards identified; many possible additional ones not included.

## Confidence calibration

| Claim type | Confidence band |
|------------|-----------------|
| Today's documents (15 docs) — content claims | HIGH (direct text evidence) |
| Constitutional analysis (KU34) | HIGH-MEDIUM (lawyer-level assessment from text + procedural knowledge) |
| Migration-enforcement implications | MEDIUM-HIGH |
| Election scenario probabilities | MEDIUM (polling + historical patterns) |
| Macro forecast (IMF WEO) | HIGH for baseline; MEDIUM for tails |
| Geopolitical wildcards | MEDIUM (intelligence assessments) |
| Long-horizon (T+365 d) policy outcomes | MEDIUM |

## Pass 1 → Pass 2 deltas (representative)

- KU34 significance score: 0.72 → 0.80 (under-counted bundling architecture)
- Tidö renewal probability: 0.50 → 0.45 (better-calibrated to recent polling drift)
- R2 ECtHR risk: 9 inherent → 12 inherent (Lagrådet criticism documented in unusual depth in HD024149)
- Cross-horizon citation set: expanded from 1 quarter-ahead + 2 monthly-review (Pass 1) to 3 + 5 (Pass 2)

## Limitations to acknowledge

- 365-day forecasts have high uncertainty for individual outcomes; the ensemble matters.
- Pre-election polling has standard ±3 pp error; coalition mathematics scenarios are conditional on no major perturbations.
- Geopolitical wildcards (Russia, China, US-EU) interact with Swedish dynamics in non-linear ways.

## Reproducibility

- Documents: `analysis/daily/2026-05-11/documents/` (15 JSON) + `full-text/` (5 MD)
- IMF context: `data/imf-context.json` (vintage WEO Apr-2026)
- Templates: `analysis/templates/`
- Methodology: `analysis/methodologies/ai-driven-analysis-guide.md`
- Reproducibility command: `npx tsx scripts/download-parliamentary-data.ts --date 2026-05-11 --limit 30 --auto-full-text-top-n 5`


---

## Pass-2 Recalibration (2026-05-11T15:23:28Z)

Pass-2 reflection: ACH matrix re-run confirmed H2 (entrenchment-of-rights) survives all 15 evidence items; H4 (constitutional opportunism) eliminated.

_Pass-2 critical re-read complete; deltas integrated above._
