# 04 — Analysis Pipeline

Analysis is the **primary product**. Articles are derived from analysis. Never write an article before analysis is complete.

Authoritative methodology & templates:

- **Read-me-first** → [`analysis/methodologies/artifact-catalog.md`](../../analysis/methodologies/artifact-catalog.md) (single source of truth for every artifact — family, template, depth floor, Mermaid type, MCP data source, gate check) and [`analysis/methodologies/per-artifact-methodologies.md`](../../analysis/methodologies/per-artifact-methodologies.md) (Inputs / Analytic-moves / Evidence-rules / Anti-patterns per artifact). Open these before any framework-specific methodology.
- Methodology → [`analysis/methodologies/ai-driven-analysis-guide.md`](../../analysis/methodologies/ai-driven-analysis-guide.md) (DIW weighting, tier depths, Pass 1/Pass 2 rules, F3EAD mapping)
- Indicator maps → [`imf-indicator-mapping.md`](../../analysis/methodologies/imf-indicator-mapping.md) (**PRIMARY — authoritative for all economic / fiscal / monetary / external-sector / trade context with vintage-tagged WEO+FM projections**) + [`worldbank-indicator-mapping.md`](../../analysis/methodologies/worldbank-indicator-mapping.md) (non-economic residue only: governance WGI, environment, social / education participation, defence historicals, crime / justice). WB economic codes are **deprecated** — see the scope notice in `worldbank-indicator-mapping.md` and `analysis/imf/indicators-inventory.json → deprecationPolicy`.
- Depth floors → [`reference-quality-thresholds.json`](../../analysis/methodologies/reference-quality-thresholds.json) (per-article-type × per-artifact line floors + tradecraft signals consumed by Pass-2 self-audit)
- Supporting frameworks → [`political-classification-guide.md`](../../analysis/methodologies/political-classification-guide.md), [`political-swot-framework.md`](../../analysis/methodologies/political-swot-framework.md), [`political-risk-methodology.md`](../../analysis/methodologies/political-risk-methodology.md), [`political-threat-framework.md`](../../analysis/methodologies/political-threat-framework.md), [`synthesis-methodology.md`](../../analysis/methodologies/synthesis-methodology.md), [`strategic-extensions-methodology.md`](../../analysis/methodologies/strategic-extensions-methodology.md), [`electoral-domain-methodology.md`](../../analysis/methodologies/electoral-domain-methodology.md), [`structural-metadata-methodology.md`](../../analysis/methodologies/structural-metadata-methodology.md), [`per-document-methodology.md`](../../analysis/methodologies/per-document-methodology.md), [`political-style-guide.md`](../../analysis/methodologies/political-style-guide.md), [`osint-tradecraft-standards.md`](../../analysis/methodologies/osint-tradecraft-standards.md) — **tradecraft canon: ICD 203 + Admiralty + WEP + SAT catalog + OSINT ethics + DIW alignment + PIR handoff**
- Templates → [`analysis/templates/*.md`](../../analysis/templates/) (one file per artifact — 23 always-on + per-document + 7 operational supplementary)

**Operational supplementary artifacts** — 7 enrichment templates that strengthen the AI-FIRST quality loop, cross-run memory, and MCP health auditability. **Recommended** for every `deep` run; **mandatory** for every `comprehensive` / Tier-C aggregation run; enforced by [`05-analysis-gate.md §Supplementary checks`](05-analysis-gate.md):

| Template | When to produce | Feeds |
|----------|-----------------|-------|
| [`analysis-index.md`](../../analysis/templates/analysis-index.md) | always for `deep`/`comprehensive` | downstream reviewers |
| [`reference-analysis-quality.md`](../../analysis/templates/reference-analysis-quality.md) | `comprehensive`; operationalises AI-FIRST | Pass-2 self-audit |
| [`mcp-reliability-audit.md`](../../analysis/templates/mcp-reliability-audit.md) | `comprehensive` or any MCP degradation | incident follow-up |
| [`workflow-audit.md`](../../analysis/templates/workflow-audit.md) | `comprehensive` | 11-principle compliance |
| [`cross-run-diff.md`](../../analysis/templates/cross-run-diff.md) | any article type with ≥ 2 runs | Bayesian update |
| [`cross-session-intelligence.md`](../../analysis/templates/cross-session-intelligence.md) | `weekly-review`, `monthly-review`, quarterly | session narrative |
| [`session-baseline.md`](../../analysis/templates/session-baseline.md) | any aggregation workflow | calendar + roster fact layer |

These are **not counted in the 23 mandatory artifacts** — the 23-artifact contract is unchanged.

**Analytical supplementary artifacts** — 4 optional deep-dive templates mapped to frameworks explicitly listed in the intelligence-operative agent's "Core Expertise" that previously had no template. **Never blocking** in `05-analysis-gate.md` and **never replace** a core artifact. Produce when the trigger condition applies; otherwise skip. See [`analytical-supplementary-methodology.md`](../../analysis/methodologies/analytical-supplementary-methodology.md) for composition rules and per-template analytic moves.

| Template | Produce when | Pairs with |
|----------|--------------|-----------|
| [`pestle-analysis.md`](../../analysis/templates/pestle-analysis.md) | event crosses ≥ 2 PESTLE dimensions | `swot-analysis.md`, `risk-assessment.md`, `scenario-analysis.md` |
| [`political-stride-assessment.md`](../../analysis/templates/political-stride-assessment.md) | election-adjacent / integrity incident / disinfo / critical-infra vote | `threat-analysis.md`, `risk-assessment.md` Institutional/Corruption |
| [`wildcards-blackswans.md`](../../analysis/templates/wildcards-blackswans.md) | long-horizon forecasting (`monthly-review`, election year) | `scenario-analysis.md`, `forward-indicators.md` |
| [`quantitative-swot.md`](../../analysis/templates/quantitative-swot.md) | decision memo needing scored ranking | `swot-analysis.md`, `significance-scoring.md`, `executive-brief.md` |

These are **not counted in the 23 mandatory artifacts** and **not counted in the 7 operational supplementary** — the contract is unchanged. Agents ignoring them still produce valid output.

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

1. **Read all relevant methodologies first** (the primary methodology guide plus every supporting framework listed above, including `osint-tradecraft-standards.md`; one tool call per file; skipping fails the gate via `methodology-reflection.md §evidence` audit).
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

All economic / fiscal / monetary / external-sector / trade / COFOG / commodity / exchange-rate context is **IMF-first**. When the article type touches these topics:

1. **Discover** — look up the committee's required IMF indicators in [`analysis/imf/indicators-inventory.json → committeeMatrix`](../../analysis/imf/indicators-inventory.json) or call `findImfIndicatorsForCommittee(code)` from [`scripts/imf-context.ts`](../../scripts/imf-context.ts).
2. **Pre-warm** — one throwaway IMF call at workflow start.
3. **Fetch** — prefer `compare` (batched, 1 call per indicator across Nordic peers) over parallel `weo`. Always pass `--persist`. `sleep 1` between invocations. Target ≤ 10 IMF calls per article.
4. **Vintage-stamp every projection** — `(WEO Apr-2026, GGXWDG_NGDP)` is mandatory; un-stamped projection quotes fail the audit.
5. **Write** `economic-data.json` v2.0 per the [Economic Data Contract](../aw/ECONOMIC_DATA_CONTRACT.md) v2.1+. `source.imf[]` MUST be non-empty; `source.worldBank[]` holds **only** non-economic codes (WGI, environment, defence historicals, education participation).
6. **Reference** WB only for the residue — WGI governance (`source=75`), environment (`EN.*`, `EG.*`, `AG.LND.FRST.ZS`), education participation (`SE.PRM.ENRR`), defence historicals (`MS.MIL.XPND.GD.ZS`), crime (`VC.IHR.PSRC.P5`). Use [`analysis/worldbank/indicators-inventory.json`](../../analysis/worldbank/indicators-inventory.json) for the non-economic catalogue.

**Never** cite `worldbank:NY.GDP.MKTP.KD.ZG`, `worldbank:FP.CPI.TOTL.ZG`, `worldbank:SL.UEM.TOTL.ZS`, `worldbank:GC.DOD.TOTL.GD.ZS`, `worldbank:GC.XPN.TOTL.GD.ZS`, `worldbank:GC.REV.XGRT.GD.ZS`, `worldbank:BN.CAB.XOKA.GD.ZS`, `worldbank:NE.EXP.GNFS.ZS`, `worldbank:NY.GDP.MKTP.CD`, `worldbank:NY.GDP.PCAP.CD` as primary evidence in new articles — use their IMF replacement listed in `analysis/imf/indicators-inventory.json → deprecationPolicy`.

Chart.js specs live in the [Economic Data Contract](../aw/ECONOMIC_DATA_CONTRACT.md) — follow it exactly. Produce at least one economic chart data file (`economic-data.json`) per article that has an economic-context section.

Full IMF integration reference: [`analysis/imf/README.md`](../../analysis/imf/README.md) · [`analysis/imf/agentic-integration.md`](../../analysis/imf/agentic-integration.md) (7-step playbook) · [`analysis/imf/data-dictionary.md`](../../analysis/imf/data-dictionary.md).

## Visualisation data

For each article with charts, produce accompanying JSON under `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/` (e.g. `vote-distribution.json`, `swot-summary.json`, `risk-heatmap.json`, `coalition-math.json`, `forward-indicators.json`) using the shapes defined in the templates. Scripts render the HTML containers; the AI writes the commentary paragraph adjoining each chart.

## Next step

Proceed to `05-analysis-gate.md`. Do not start article generation until the gate passes against all 23 artifacts.

After completing Pass 1 (before Pass 2), run the **phase checkpoint** from `00-base-contract.md` with label `phase-04-pass1`. After completing Pass 2 (before the gate), run it again with label `phase-04-pass2`. This guarantees both iterations survive even if the gate, article, or commit phase later fails.

## External references

- gh-aw runtime (v0.69.3): [abridged](https://github.github.com/gh-aw/llms-small.txt) · [complete](https://github.github.com/gh-aw/llms-full.txt) · [agentic-workflows blog](https://github.github.com/gh-aw/_llms-txt/agentic-workflows.txt) · [source](https://github.com/github/gh-aw)
- Methodology entry point: [`analysis/methodologies/ai-driven-analysis-guide.md`](../../analysis/methodologies/ai-driven-analysis-guide.md)
- Artifact ↔ gate-check mapping: [`analysis/templates/README.md`](../../analysis/templates/README.md) §"Artifact → workflow → gate check mapping"
