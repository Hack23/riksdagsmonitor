# 04 — Analysis Pipeline

Analysis is the **primary product**. Articles are derived from analysis. Never write an article before analysis is complete.

Authoritative methodology & templates:

- Methodology → [`analysis/methodologies/ai-driven-analysis-guide.md`](../../analysis/methodologies/ai-driven-analysis-guide.md) (DIW weighting, tier depths, Pass 1/Pass 2 rules)
- Supporting frameworks → [`political-classification-guide.md`](../../analysis/methodologies/political-classification-guide.md), [`political-swot-framework.md`](../../analysis/methodologies/political-swot-framework.md), [`political-risk-methodology.md`](../../analysis/methodologies/political-risk-methodology.md), [`political-threat-framework.md`](../../analysis/methodologies/political-threat-framework.md), [`political-style-guide.md`](../../analysis/methodologies/political-style-guide.md)
- Templates → [`analysis/templates/*.md`](../../analysis/templates/) (one file per artifact)

## Role boundary

| Scripts do | AI does |
|------------|---------|
| Download data, catalogue documents, create file scaffolds | Every analytical judgement: SWOT, risks, threats, stakeholder mapping, significance weighting, classification, cross-references |

Scripts never generate analysis prose. Any `AI_MUST_REPLACE` marker left in a committed file fails the gate.

## 9 required core artifacts

Produced in `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/`:

| File | Source template | Minimum body |
|------|-----------------|--------------|
| `synthesis-summary.md` | `synthesis-summary.md` | Lead story decision, DIW-weighted ranking, ≥ 1 Mermaid diagram |
| `swot-analysis.md` | `swot-analysis.md` | S/W/O/T quadrants with evidence tables citing `dok_id` + TOWS matrix |
| `risk-assessment.md` | `risk-assessment.md` | Top 5 risks, likelihood × impact, posterior probabilities |
| `threat-analysis.md` | `threat-analysis.md` | Attack tree, kill chain, MITRE-style TTP mapping |
| `stakeholder-perspectives.md` | `stakeholder-impact.md` | Named actors, influence network, briefing cards per stakeholder |
| `significance-scoring.md` | `significance-scoring.md` | DIW scores per document, sensitivity analysis |
| `classification-results.md` | `political-classification.md` | Priority tiers, retention, access |
| `cross-reference-map.md` | (link to prior-run forward chain) | Continuity contracts with prior analyses |
| `data-download-manifest.md` | produced in step 03 | Already exists from data-download step |

Plus `documents/` subfolder with **one `.md` per `dok_id`** using [`per-file-political-intelligence.md`](../../analysis/templates/per-file-political-intelligence.md).

## Execution order

1. **Read all 6 methodologies first** (one tool call per file, do not skip).
2. **Read all 8 templates first.**
3. **Pass 1 — Create** all 9 artifacts + every per-document file. Minimum 15 minutes of real work.
4. **Pass 2 — Improve**: read every Pass-1 file back in full and strengthen evidence, diagrams, cross-references, stakeholder coverage, uncertainty disclosure. Minimum 7 minutes.

Pass 2 is mandatory. Completing earlier is a quality failure.

## Depth calibration

| `analysis_depth` input | Pass 1 floor | Pass 2 floor | Use |
|-----------------------|--------------|--------------|-----|
| `standard` | 10 min | 5 min | Light day, single-type workflow |
| `deep` (default) | 15 min | 7 min | Standard news day |
| `comprehensive` | 20 min | 10 min | Tier-C aggregation, deep-inspection |

## Evidence standard

Every analytical claim must cite at least one of: a real `dok_id` (e.g. `H901FiU1`) resolvable via `get_dokument`; a named MP / minister / party with role; vote counts from `get_voteringar`; or a primary-source URL (riksdagen.se, regeringen.se, scb.se, worldbank.org, data.imf.org). Generic phrasing without evidence is a Pass-2 improvement target. Gate enforcement lives in `05-analysis-gate.md` check 4.

## Economic context

When the article type touches fiscal / macro / labour topics, enrich analysis with committee-mapped indicators from [`analysis/worldbank/indicators-inventory.json`](../../analysis/worldbank/indicators-inventory.json). Chart.js specs live in the [Economic Data Contract](../aw/ECONOMIC_DATA_CONTRACT.md) — follow it exactly. Produce at least one economic chart data file (`economic-data.json`) per article that has an economic-context section.

## Visualisation data

For each article with charts, produce accompanying JSON under `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/` (e.g. `vote-distribution.json`, `swot-summary.json`, `risk-heatmap.json`) using the shapes defined in the templates. Scripts render the HTML containers; the AI writes the commentary paragraph adjoining each chart.

## Next step

On completion, proceed to `05-analysis-gate.md`. Do not start article generation until the gate passes.
