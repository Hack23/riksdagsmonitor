# 04 — Analysis Pipeline

Analysis is the **primary product**. Articles are derived from analysis. Never write an article before analysis is complete.

Authoritative methodology & templates:

- Methodology → [`analysis/methodologies/ai-driven-analysis-guide.md`](../../analysis/methodologies/ai-driven-analysis-guide.md) (DIW weighting, tier depths, Pass 1/Pass 2 rules, F3EAD mapping)
- Supporting frameworks → [`political-classification-guide.md`](../../analysis/methodologies/political-classification-guide.md), [`political-swot-framework.md`](../../analysis/methodologies/political-swot-framework.md), [`political-risk-methodology.md`](../../analysis/methodologies/political-risk-methodology.md), [`political-threat-framework.md`](../../analysis/methodologies/political-threat-framework.md), [`synthesis-methodology.md`](../../analysis/methodologies/synthesis-methodology.md), [`strategic-extensions-methodology.md`](../../analysis/methodologies/strategic-extensions-methodology.md), [`electoral-domain-methodology.md`](../../analysis/methodologies/electoral-domain-methodology.md), [`structural-metadata-methodology.md`](../../analysis/methodologies/structural-metadata-methodology.md), [`per-document-methodology.md`](../../analysis/methodologies/per-document-methodology.md), [`political-style-guide.md`](../../analysis/methodologies/political-style-guide.md)
- Templates → [`analysis/templates/*.md`](../../analysis/templates/) (one file per artifact — 23 always-on + per-document)

## Role boundary

| Scripts do | AI does |
|------------|---------|
| Download data, catalogue documents, create file scaffolds | Every analytical judgement: SWOT, risks, threats, stakeholder mapping, significance weighting, classification, cross-references, scenarios, coalition math, historical parallels, media framing, forward indicators, methodology reflection |

Scripts never generate analysis prose. Any `AI_MUST_REPLACE` marker left in a committed file fails the gate.

## 23 required artifacts (every workflow, every run)

Produced in `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/`. The output set is **stable** — morning, evening, realtime, weekly, monthly and aggregation workflows all produce the same 23 files; only per-item **depth** adapts (see §Depth calibration). This matches [`ai-driven-analysis-guide.md` §Step 4 / §Step 5 / §Output Matrix](../../analysis/methodologies/ai-driven-analysis-guide.md#step-4--core-synthesis-f3ead-exploit--analyze).

### Family A — Core Synthesis (9 files · F3EAD: EXPLOIT → ANALYZE)

| # | File | Source template | Minimum body |
|:-:|------|-----------------|--------------|
| 1 | `README.md` | [`templates/README.md`](../../analysis/templates/README.md) § Folder README | Per-folder index linking every other file, generation date, run mode |
| 2 | `executive-brief.md` | [`executive-brief.md`](../../analysis/templates/executive-brief.md) | BLUF (2–4 sentences), ≥ 3 decisions supported, 60-second read bullets, top forward trigger, confidence label, ≥ 1 Mermaid |
| 3 | `synthesis-summary.md` | [`synthesis-summary.md`](../../analysis/templates/synthesis-summary.md) | Lead-story decision, DIW-weighted ranking, integrated intelligence picture, ≥ 1 Mermaid |
| 4 | `significance-scoring.md` | [`significance-scoring.md`](../../analysis/templates/significance-scoring.md) | DIW scores per document, sensitivity analysis, Mermaid rank diagram |
| 5 | `classification-results.md` | [`political-classification.md`](../../analysis/templates/political-classification.md) | 7-dimension classification per document, priority tiers, retention, access |
| 6 | `swot-analysis.md` | [`swot-analysis.md`](../../analysis/templates/swot-analysis.md) | S/W/O/T with evidence rows citing `dok_id` + TOWS matrix + cross-SWOT |
| 7 | `risk-assessment.md` | [`risk-assessment.md`](../../analysis/templates/risk-assessment.md) | 5-dimension register, L × I scores, cascading chains, posterior probabilities |
| 8 | `threat-analysis.md` | [`threat-analysis.md`](../../analysis/templates/threat-analysis.md) | Political Threat Taxonomy, attack tree, kill chain, MITRE-style TTP mapping |
| 9 | `stakeholder-perspectives.md` | [`stakeholder-impact.md`](../../analysis/templates/stakeholder-impact.md) | 6-lens stakeholder matrix, named actors, influence network |

### Family B — Structural Metadata (2 files)

| # | File | Source template | Minimum body |
|:-:|------|-----------------|--------------|
| 10 | `data-download-manifest.md` | [`data-download-manifest.md`](../../analysis/templates/data-download-manifest.md) | Every `dok_id` with source URL, retrieval time, data-depth tag (produced in module 03) |
| 11 | `cross-reference-map.md` | [`cross-reference-map.md`](../../analysis/templates/cross-reference-map.md) | Policy clusters, legislative chains, coordinated-activity patterns, sibling-folder citations (Tier-C) |

### Family C — Strategic Extensions (5 files · F3EAD: ANALYZE continued)

| # | File | Source template | Minimum body |
|:-:|------|-----------------|--------------|
| 12 | `scenario-analysis.md` | [`scenario-analysis.md`](../../analysis/templates/scenario-analysis.md) | ≥ 3 distinct scenarios + probabilities summing 100%, leading indicator per scenario |
| 13 | `comparative-international.md` | [`comparative-international.md`](../../analysis/templates/comparative-international.md) | ≥ 2 comparator jurisdictions (Nordic + EU minimum) with Outside-In analysis |
| 14 | `devils-advocate.md` | [`devils-advocate.md`](../../analysis/templates/devils-advocate.md) | ≥ 3 competing hypotheses via ACH matrix, Red-Team challenge, rejected alternatives logged |
| 15 | `intelligence-assessment.md` | [`intelligence-assessment.md`](../../analysis/templates/intelligence-assessment.md) | 3–7 Key Judgments with confidence labels, PIRs for next cycle, Key Assumptions Check |
| 16 ⭐ | `methodology-reflection.md` | [`methodology-reflection.md`](../../analysis/templates/methodology-reflection.md) | **VITAL run-audit gate.** Evidence sufficiency, confidence distribution, source diversity, party-neutrality arithmetic, **ICD 203 compliance audit**, ≥ 3 concrete methodology improvements for next cycle |

### Family D — Electoral & Domain Lenses (7 files)

| # | File | Source template | Minimum body |
|:-:|------|-----------------|--------------|
| 17 | `election-2026-analysis.md` | [`election-2026-analysis.md`](../../analysis/templates/election-2026-analysis.md) | Seat-projection deltas, coalition viability (converts to post-2026 context file after the election) |
| 18 | `voter-segmentation.md` | [`voter-segmentation.md`](../../analysis/templates/voter-segmentation.md) | Demographic / regional / ideological segment impact, baseline positions on procedural days |
| 19 | `coalition-mathematics.md` | [`coalition-mathematics.md`](../../analysis/templates/coalition-mathematics.md) | Current seat map, pivotal-vote table, Sainte-Laguë scenarios |
| 20 | `historical-parallels.md` | [`historical-parallels.md`](../../analysis/templates/historical-parallels.md) | Named precedent(s) ≤ 40 years with similarity score (or "no-precedent" finding with reasoning) |
| 21 | `media-framing-analysis.md` | [`media-framing-analysis.md`](../../analysis/templates/media-framing-analysis.md) | Per-party + press-quadrant + platform framing; longitudinal frame record entry |
| 22 | `implementation-feasibility.md` | [`implementation-feasibility.md`](../../analysis/templates/implementation-feasibility.md) | Delivery-risk view (budget / IT / regulatory / workforce); backlog audit on no-bill days |
| 23 | `forward-indicators.md` | [`forward-indicators.md`](../../analysis/templates/forward-indicators.md) | ≥ 10 dated indicators across 4 horizons (72 h / week / month / election) |

### Family E — Per-document files (N files)

`documents/{dok_id}-analysis.md` — one per `dok_id` in `data-download-manifest.md`, using [`per-file-political-intelligence.md`](../../analysis/templates/per-file-political-intelligence.md) at the depth tier matching the document's DIW (L1 Surface / L2 Strategic / L2+ Priority / L3 Intelligence-grade). Cluster files (`{cluster}-cluster-analysis.md`) collapse related low-weight items.

> **Filename variants** — canonical `stakeholder-perspectives.md` ← template `stakeholder-impact.md`; canonical `classification-results.md` ← template `political-classification.md`; `comparative-international.md` ↔ `international-comparative.md`; `historical-parallels.md` ↔ `historical-baseline.md`; `election-2026-analysis.md` ↔ `election-2026-implications.md`. See [`ai-driven-analysis-guide.md` §Filename variants](../../analysis/methodologies/ai-driven-analysis-guide.md#-filename-variants-all-map-to-one-template--one-methodology-section).

## Execution order

> **Fast-path**: If `SKIP_ANALYSIS=true` (set by `03-data-download.md §Pre-flight`), skip all steps 1–5 below and proceed directly to `06-article-generation.md`. The full analysis already exists on disk from a prior run — do not re-run downloads, Pass 1, Pass 2, or the gate.

1. **Read all 10 methodologies first** (one tool call per file; skipping fails the gate via `methodology-reflection.md §evidence` audit).
2. **Read all 23 templates first** — at minimum open each Family A/B/C/D template before writing its artifact.
3. **Pass 1 — Create** all 23 always-on artifacts + every per-document file. Minimum 20 minutes of real work.
4. **Snapshot Pass-1** — copy every Pass-1 file into `$ANALYSIS_DIR/pass1/` before starting Pass 2: `mkdir -p "$ANALYSIS_DIR/pass1" && cp "$ANALYSIS_DIR"/*.md "$ANALYSIS_DIR/pass1/"`. The `pass1/` directory is the fallback evidence the gate uses when mtime windows are too tight. Do **not** stage `pass1/` in the PR (see `07-commit-and-pr.md`).
5. **Pass 2 — Improve**: read every Pass-1 file back in full and strengthen evidence, diagrams, cross-references, stakeholder coverage, uncertainty disclosure, Admiralty annotations, WEP language, PIR/EEI tags. Minimum 10 minutes.

Pass 2 is mandatory. Completing earlier is a quality failure. `methodology-reflection.md` is the self-audit of Pass 2 — skipping it breaks the self-correction loop.

## Depth calibration

Depth adapts per item by DIW tier (L1 Surface / L2 Strategic / L2+ Priority / L3 Intelligence-grade per [§Output Matrix](../../analysis/methodologies/ai-driven-analysis-guide.md#-output-matrix--every-file-every-family)) — **all 23 files are produced regardless**. What changes is word-count and framework richness per item.

| `analysis_depth` input | Pass 1 floor | Pass 2 floor | Use |
|-----------------------|--------------|--------------|-----|
| `standard` | 15 min | 7 min | Light day, single-type workflow, most items at L1–L2 |
| `deep` (default) | 20 min | 10 min | Standard news day, L2–L2+ items present |
| `comprehensive` | 25 min | 12 min | Tier-C aggregation, deep-inspection, L3 items likely |

Aggregation (Tier-C) workflows apply the period-scope multiplier from `ext/tier-c-aggregation.md` **on top of** these floors.

## Evidence standard

Every analytical claim must cite at least one of: a real `dok_id` (e.g. `H901FiU1`) resolvable via `get_dokument`; a named MP / minister / party with role; vote counts from `get_voteringar`; or a primary-source URL (riksdagen.se, regeringen.se, scb.se, worldbank.org, data.imf.org). Annotate each evidence row with an **Admiralty Code** `[A–F][1–6]`. Apply the **Source Diversity Rule** — P0/P1 claims require ≥ 3 independent sources; single-source claims must be flagged `[unconfirmed]` (Pass-2 improvement target). Generic phrasing without evidence is rejected at the gate (`05-analysis-gate.md` check 4 and its Family-C/D extensions).

## Economic context

When the article type touches fiscal / macro / labour topics, enrich analysis with committee-mapped indicators from [`analysis/worldbank/indicators-inventory.json`](../../analysis/worldbank/indicators-inventory.json) and IMF WEO projections via `scripts/imf-fetch.ts`. Chart.js specs live in the [Economic Data Contract](../aw/ECONOMIC_DATA_CONTRACT.md) — follow it exactly. Produce at least one economic chart data file (`economic-data.json`) per article that has an economic-context section.

## Visualisation data

For each article with charts, produce accompanying JSON under `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/` (e.g. `vote-distribution.json`, `swot-summary.json`, `risk-heatmap.json`, `coalition-math.json`, `forward-indicators.json`) using the shapes defined in the templates. Scripts render the HTML containers; the AI writes the commentary paragraph adjoining each chart.

## Next step

Proceed to `05-analysis-gate.md`. Do not start article generation until the gate passes against all 23 artifacts.

After completing Pass 1 (before Pass 2), run the **phase checkpoint** from `00-base-contract.md` with label `phase-04-pass1`. After completing Pass 2 (before the gate), run it again with label `phase-04-pass2`. This guarantees both iterations survive even if the gate, article, or commit phase later fails.

## External references

- gh-aw runtime (v0.69.3): [abridged](https://github.github.com/gh-aw/llms-small.txt) · [complete](https://github.github.com/gh-aw/llms-full.txt) · [agentic-workflows blog](https://github.github.com/gh-aw/_llms-txt/agentic-workflows.txt) · [source](https://github.com/github/gh-aw)
- Methodology entry point: [`analysis/methodologies/ai-driven-analysis-guide.md`](../../analysis/methodologies/ai-driven-analysis-guide.md)
- Artifact ↔ gate-check mapping: [`analysis/templates/README.md`](../../analysis/templates/README.md) §"Artifact → workflow → gate check mapping"
