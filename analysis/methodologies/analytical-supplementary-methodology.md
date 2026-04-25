# Analytical Supplementary Methodology

**Version:** v1.2 · **Effective date:** 2026-04-23 · **Owner:** Intelligence Operative role · **Review cycle:** Quarterly

> **Scope.** Governs the **Analytical Supplementary** family of optional deep-dive templates that can be produced alongside the 23 mandatory artifacts. These templates are **never** required by [`05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md) and **never** replace a core artifact — they **augment** the core set with specialised analytic lenses when a run's scope warrants it.
>
> Sister documents:
> - [`ai-driven-analysis-guide.md`](ai-driven-analysis-guide.md) — master methodology with DIW weighting, F3EAD, Pass 1/2 rules
> - [`artifact-catalog.md`](artifact-catalog.md) — the row-per-artifact single source of truth (adds Analytical Supplementary section)
> - [`per-artifact-methodologies.md`](per-artifact-methodologies.md) — per-artifact Inputs / Analytic-moves / Evidence-rules / Anti-patterns
> - [`reference-quality-thresholds.json`](reference-quality-thresholds.json) — depth floors (defaults apply to Analytical Supplementary)

## 🎯 Purpose

Provide Riksdagsmonitor analysts with rigorously defined optional deep-dive templates that map 1-to-1 to analytical frameworks explicitly listed in the intelligence-operative agent's "Core Expertise" and "Analytical Frameworks" sections but that were not previously templated:

- **PESTLE** — macro-environment scan (political, economic, social, technological, legal, environmental)
- **STRIDE-political** — adapted STRIDE threat model for political/electoral/institutional surfaces
- **Wildcards & Black-Swans** — low-probability / high-impact tail complementing `scenario-analysis.md`
- **Quantitative SWOT** — numerical DIW × confidence × leverage scoring on top of narrative SWOT

## 📦 Outputs (4 templates)

| ID | Template | Pairs with | Triggered when |
|----|----------|-----------|----------------|
| AS-1 | [`pestle-analysis.md`](../templates/pestle-analysis.md) | `swot-analysis.md`, `risk-assessment.md`, `scenario-analysis.md` | event crosses ≥ 2 PESTLE dimensions |
| AS-2 | [`political-stride-assessment.md`](../templates/political-stride-assessment.md) | `threat-analysis.md`, `risk-assessment.md` (Institutional/Corruption) | election-adjacent, integrity incident, disinfo spike, critical-infra vote |
| AS-3 | [`wildcards-blackswans.md`](../templates/wildcards-blackswans.md) | `scenario-analysis.md`, `forward-indicators.md` | long-horizon forecasting (`monthly-review`, election-year aggregation) |
| AS-4 | [`quantitative-swot.md`](../templates/quantitative-swot.md) | `swot-analysis.md`, `significance-scoring.md`, `executive-brief.md` | decision memo requiring scored ranking |

## 🧭 When NOT to produce

- Do **not** use an Analytical Supplementary template as a substitute for a missing core artifact. The gate will still fail.
- Do **not** proliferate templates for a "standard" daily morning run with ≤ 3 documents — the core 23 are enough.
- If **all four** apply, prioritise **PESTLE + Quantitative SWOT** for policy analysis; **STRIDE-political + Wildcards** for security/integrity analysis.

## 🪢 Composition rules

### Rule 1 — Single DIW weight vector

`quantitative-swot.md` **MUST** use the same weight vector as `significance-scoring.md`:

```
w_D = 0.35  (Decision relevance)
w_I = 0.25  (Information novelty)
w_W = 0.20  (Wave / momentum)
w_S = 0.20  (Stakeholder reach)
```

### Rule 2 — Every cell cites primary evidence

PESTLE / STRIDE / Wildcard / QSWOT cells that carry an assertion **MUST** cite a `dok_id`, primary URL host (`riksdagen.se`, `regeringen.se`, `scb.se`, `data.imf.org`, `worldbank.org`, `eur-lex.europa.eu`, known myndighets domain), or named source. Same rule as `swot-analysis.md` (gate check 4 when embedded in that file).

### Rule 3 — PESTLE / Wildcards feed Forward-Indicators

Every PESTLE indicator row or Wildcard trigger indicator **MUST** surface in at least one horizon section of [`forward-indicators.md`](../templates/forward-indicators.md) with a dated trigger (contributes to check 8 floor of ≥ 10 dated indicators).

### Rule 4 — STRIDE-political maps to `threat-analysis.md` TTPs

Every STRIDE row with likelihood × impact ≥ 12 **MUST** appear in the canonical MITRE-style TTP mapping of [`threat-analysis.md`](../templates/threat-analysis.md). STRIDE adds adversary-model structure; `threat-analysis.md` remains the canonical kill-chain file.

### Rule 5 — Quantitative SWOT never replaces narrative SWOT

`swot-analysis.md` remains the Pass-2-enforced narrative artifact. `quantitative-swot.md` is read-alongside. Top-3 scored items surface in `executive-brief.md § 3 Decisions`.

## 🔬 Per-template analytic moves

### PESTLE

- Scope declaration (trigger event, horizon, unit of analysis, primary sources).
- 6 dimension tables (P/E/S/T/L/Env) with ≥ 4 rows each; factor, current state, direction, evidence, impact, WEP.
- Economic rows **MUST** use IMF WEO vintages per [`imf-indicator-mapping.md`](imf-indicator-mapping.md).
- Social/environmental rows use SCB / World Bank per [`worldbank-indicator-mapping.md`](worldbank-indicator-mapping.md).
- Cross-dimension interactions (≥ 3) with direction + magnitude + magnitude rationale.
- PIR feedback row per active PIR.
- Key judgement per dimension (1–3 sentences, WEP-tagged).

### STRIDE-political

- Scope declaration (entity, trust boundary, time horizon, adversary model).
- 6 dimension tables (S/T/R/I/D/E) with ≥ 3 rows each; vector, target, L (1–5), I (1–5), existing mitigation, residual risk, evidence.
- ≥ 2 Mermaid attack trees (goal → vectors → sub-vectors, colour-coded).
- MITRE-style TTP mapping table with tactic, political-adaptation technique, cross-link to `threat-analysis.md`.
- Recommended controls mapped to **ISO 27001:2022** + **NIST CSF 2.0** + **CIS Controls v8.1**.
- PIR feedback row per active PIR.

### Wildcards & Black-Swans

- Horizon + domain filter declaration.
- ICD-203-aligned definitions (wildcard = low-probability / high-impact event in the WEP `Unlikely` to `Remote` range, ≈ 5–37 % per [`political-style-guide.md`](political-style-guide.md#-words-of-estimative-probability-wep--odni-confidence-overlay); black-swan = extreme-tail event outside current priors, typically < 5 %, with a plausible causal chain once surfaced).
- Wildcard register ≥ 8 events across domains (political / economic / security / social / technological / environmental / cross / external).
- Black-swan candidates ≥ 3 with "why under-weighted" + ≤ 4-step plausible causal chain.
- ≥ 2 Mermaid cascading consequence trees (event → 1st → 2nd → 3rd-order → mitigation lever, colour-coded).
- Early-warning indicator table feeding `forward-indicators.md`.
- Resilience assessment across 5 dimensions (institutional, fiscal, coalition, information-integrity, alliance) with gap + recommendation.

### Quantitative SWOT

- Scope + perspective declaration.
- Scoring rubric: `I ∈ [-5, +5]`, `C ∈ [0.2, 0.95]` (WEP-mapped), `L ∈ [0.1, 1.0]`, `T ∈ [0.3, 1.0]`; weights `w_D/w_I/w_W/w_S` matching significance-scoring.
- 4 scored tables (S / W / O / T) with ≥ 3 items each, each row citing evidence.
- Composite metrics: net position, SW-balance, OT-balance, high-confidence share.
- TOWS 2 × 2 with ≥ 1 action per quadrant, each citing item IDs.
- Sensitivity analysis with ≥ 3 parameter flips.
- Mermaid `xychart-beta` composite score bar diagram.

## 📏 Depth floors (line counts)

| Template | Standard | Deep | Comprehensive / Tier-C |
|----------|----------|------|------------------------|
| `pestle-analysis.md` | 100 | 150 | 220 |
| `political-stride-assessment.md` | 110 | 160 | 240 |
| `wildcards-blackswans.md` | 110 | 160 | 240 |
| `quantitative-swot.md` | 110 | 160 | 240 |

Floors apply **only** when the template is produced. Not producing them is never a failure.

## 🛡 Tradecraft compliance

All four templates inherit [`osint-tradecraft-standards.md`](osint-tradecraft-standards.md):

- **Admiralty A–F × 1–6** source-reliability grading in evidence columns
- **WEP** bands for every estimative claim
- **ICD 203** standards of analytic tradecraft (objectivity, independence, timeliness, sources cited, uncertainties conveyed, distinguish underlying vs. analytic, relevance, logical argumentation, consistency, accurate judgements of change)
- **SAT catalog** linkage — PESTLE is SAT itself; STRIDE-political draws on Red-Team and Threat-Trees; Wildcards uses Foresight + Alternative-Futures; QSWOT uses Weighted-Ranking + Sensitivity

## 🔗 Cross-links

- [`artifact-catalog.md § Analytical Supplementary`](artifact-catalog.md#-analytical-supplementary-artifacts-4) — single-source-of-truth row per template
- [`per-artifact-methodologies.md § Analytical Supplementary`](per-artifact-methodologies.md#analytical-supplementary) — per-artifact how-to
- [`reference-quality-thresholds.json`](reference-quality-thresholds.json) — `thresholds.analyticalSupplementary.*`
- [`.github/prompts/04-analysis-pipeline.md §Analytical Supplementary`](../../.github/prompts/04-analysis-pipeline.md) — optional deep-dive pointer
