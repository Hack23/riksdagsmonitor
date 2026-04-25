# Analytical Supplementary Methodology

**Version:** v2.0 · **Effective date:** 2026-04-25 · **Owner:** Intelligence Operative role · **Review cycle:** Quarterly

> **Scope.** Governs the **Analytical Supplementary** family of optional deep-dive templates that can be produced alongside the 23 mandatory artifacts. These templates are **never** required by [`05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md) and **never** replace a core artifact — they **augment** the core set with specialised analytic lenses when a run's scope warrants it.
>
> Sister documents:
> - [`ai-driven-analysis-guide.md`](ai-driven-analysis-guide.md) — master methodology with DIW weighting, F3EAD, Pass 1/2 rules
> - [`artifact-catalog.md`](artifact-catalog.md) — the row-per-artifact single source of truth (adds Analytical Supplementary section)
> - [`per-artifact-methodologies.md`](per-artifact-methodologies.md) — per-artifact Inputs / Analytic-moves / Evidence-rules / Anti-patterns
> - [`reference-quality-thresholds.json`](reference-quality-thresholds.json) — depth floors (defaults apply to Analytical Supplementary)

---

## 🎯 Purpose

Provide Riksdagsmonitor analysts with rigorously defined optional deep-dive templates that map 1-to-1 to analytical frameworks explicitly listed in the intelligence-operative agent's "Core Expertise" and "Analytical Frameworks" sections but that were not previously templated:

- **PESTLE** — macro-environment scan (political, economic, social, technological, legal, environmental)
- **STRIDE-political** — adapted STRIDE threat model for political/electoral/institutional surfaces
- **Wildcards & Black-Swans** — low-probability / high-impact tail complementing `scenario-analysis.md`
- **Quantitative SWOT** — numerical DIW × confidence × leverage scoring on top of narrative SWOT

---

## 📦 Outputs (4 templates)

| ID | Template | Pairs with | Triggered when |
|----|----------|-----------|----------------|
| AS-1 | [`pestle-analysis.md`](../templates/pestle-analysis.md) | `swot-analysis.md`, `risk-assessment.md`, `scenario-analysis.md` | event crosses ≥ 2 PESTLE dimensions |
| AS-2 | [`political-stride-assessment.md`](../templates/political-stride-assessment.md) | `threat-analysis.md`, `risk-assessment.md` (Institutional/Corruption) | election-adjacent, integrity incident, disinfo spike, critical-infra vote |
| AS-3 | [`wildcards-blackswans.md`](../templates/wildcards-blackswans.md) | `scenario-analysis.md`, `forward-indicators.md` | long-horizon forecasting (`monthly-review`, election-year aggregation) |
| AS-4 | [`quantitative-swot.md`](../templates/quantitative-swot.md) | `swot-analysis.md`, `significance-scoring.md`, `executive-brief.md` | decision memo requiring scored ranking |

---

## 🗂️ Decision tree — when to produce each template

> Use this decision tree at the start of every run to determine which (if any) Analytical Supplementary templates to produce. Producing templates unnecessarily bloats runs and dilutes signal.

```
1. Is this a standard daily run with ≤ 3 documents and no election-adjacent or cross-domain flag?
   YES → skip all AS templates; the 23 core artifacts are sufficient
   NO  → continue to step 2

2. Does the trigger event affect ≥ 2 PESTLE dimensions (P/E/S/T/L/Env)?
   YES → produce PESTLE (AS-1)
   NO  → skip AS-1

3. Is the trigger election-adjacent (within 180 days of val-dag), OR does it involve an
   integrity incident / disinformation spike / critical-infra vote?
   YES → produce STRIDE-political (AS-2)
   NO  → skip AS-2

4. Is the assessment horizon ≥ 6 months AND does the topic involve cascading risk or
   structural uncertainty beyond the 3–5 main scenarios?
   YES → produce Wildcards & Black-Swans (AS-3)
   NO  → skip AS-3

5. Does the consumer of this run need a numerically ranked recommendation
   (coalition negotiation, budget allocation, party strategy, election forecast)?
   YES → produce Quantitative SWOT (AS-4); ALWAYS produce swot-analysis.md first
   NO  → skip AS-4

Priority rule: if all four apply (rare), prioritise:
  - Security/integrity topics → AS-2 + AS-3
  - Policy analysis topics   → AS-1 + AS-4
```

---

## 🧭 When NOT to produce

- Do **not** use an Analytical Supplementary template as a substitute for a missing core artifact. The gate will still fail.
- Do **not** proliferate templates for a "standard" daily morning run with ≤ 3 documents — the core 23 are enough.
- Do **not** produce AS-4 (Quantitative SWOT) without first completing `swot-analysis.md` — the QSWOT scores are meaningless without the narrative backbone.
- Do **not** produce AS-3 (Wildcards) for a single-document interpellations run — the tail analysis requires a minimum evidence base of ≥ 5 primary sources.
- Do **not** produce AS-2 (STRIDE-political) for purely economic topics where institutional integrity is not at stake.

---

## 🪢 Composition rules

### Rule 1 — Single DIW weight vector

`quantitative-swot.md` **MUST** use the same weight vector as `significance-scoring.md`:

```
w_D = 0.35  (Decision relevance)
w_I = 0.25  (Information novelty)
w_W = 0.20  (Wave / momentum)
w_S = 0.20  (Stakeholder reach)
```

Any deviation from these weights requires updating both files simultaneously and noting the justification in `methodology-reflection.md`. The gate check does not yet auto-enforce this, but reviewers must flag mismatches during Pass-2 audit.

### Rule 2 — Every cell cites primary evidence

PESTLE / STRIDE / Wildcard / QSWOT cells that carry an assertion **MUST** cite a `dok_id`, primary URL host (`riksdagen.se`, `regeringen.se`, `scb.se`, `data.imf.org`, `worldbank.org`, `eur-lex.europa.eu`, known myndighets domain), or named source with date. The same rule applies as in `swot-analysis.md` (gate check 4). Assertions without evidence citations are classified as `[UNSUPPORTED]` and must be remediated in Pass-2 or removed.

### Rule 3 — PESTLE / Wildcards feed Forward-Indicators

Every PESTLE indicator row or Wildcard trigger indicator **MUST** surface in at least one horizon section of [`forward-indicators.md`](../templates/forward-indicators.md) with a dated trigger (contributes to check 8 floor of ≥ 10 dated indicators). Analyst must explicitly copy the indicator row and link it.

### Rule 4 — STRIDE-political maps to `threat-analysis.md` TTPs

Every STRIDE row with `Likelihood × Impact ≥ 12` **MUST** appear in the canonical MITRE-style TTP mapping of [`threat-analysis.md`](../templates/threat-analysis.md). STRIDE adds adversary-model structure; `threat-analysis.md` remains the canonical kill-chain file. Rows below the 12-threshold are optional cross-references.

### Rule 5 — Quantitative SWOT never replaces narrative SWOT

`swot-analysis.md` remains the Pass-2-enforced narrative artifact. `quantitative-swot.md` is read-alongside. Top-3 scored items (highest Strength, highest Opportunity, most-negative Threat) MUST surface in `executive-brief.md § 3 Decisions` with item ID citation.

### Rule 6 — Wildcards cite historical analogues

Every wildcard (W1–Wn) must cite at least one historical analogue (Swedish or comparable democracy) in the `wildcards-blackswans.md §Historical analogues` table. Black-swan candidates (BS1–BSn) must cite a "why under-weighted" cognitive/structural bias explanation — pure rarity is not sufficient justification.

### Rule 7 — IMF-first for all economic evidence

All economic data in any AS template (PESTLE E dimension, QSWOT S/W/O/T economic items, Wildcard W2/W8 fiscal triggers, STRIDE D fiscal impact) **MUST** use IMF as primary source. World Bank economic codes are deprecated per [`imf-indicator-mapping.md §4`](imf-indicator-mapping.md#4-deprecated-world-bank-economic-codes-and-their-imf-replacements). This rule applies in AS templates with no exceptions.

---

## 🔬 Per-template analytic moves

### PESTLE

**Inputs required before starting:**
- `session-baseline.md` for current legislative calendar
- `swot-analysis.md §External` for the external environment baseline
- IMF WEO vintage within 6 months of article date
- SCB table codes identified for Social / Environmental dimensions
- ≥ 1 named myndighet report per relevant dimension

**Analytic moves (in order):**
1. Declare scope (trigger event, horizon, unit of analysis, source set) — failure to scope produces unfocused output
2. Fill 6 dimension tables: P → E → S → T → L → E_env; minimum 5 rows per dimension for Comprehensive tier
3. For each Economic row, cite IMF WEO indicator and vintage in format `WEO:INDICATOR_CODE (WEO-YYYY-MM)`
4. For each Social/Environmental row, cite SCB table code or World Bank retained indicator
5. Write 1–3 sentence key judgement per dimension with WEP tag — do NOT copy row content verbatim
6. Write dissent note per dimension naming a competing interpretation
7. Populate cross-dimension interactions table (≥ 3; ≥ 5 for Comprehensive); rank by magnitude
8. Produce PESTLE heatmap mermaid chart with numeric risk levels
9. Complete Election 2026 PESTLE lens if within 180 days of val-dag OR if article type is `election-2026-analysis`
10. Populate PIR feedback

**Anti-patterns (cause Pass-2 failure):**
- ❌ Citing "general context" or "well-known background" without a specific source
- ❌ Using World Bank GDP/unemployment/inflation codes instead of IMF equivalents
- ❌ Key judgement that merely restates row content without synthesis
- ❌ Missing WEP tag on any probabilistic claim
- ❌ Cross-dimension interactions using vague "affects" language — must specify mechanism, direction, and magnitude
- ❌ Producing PESTLE for a single-dimension issue (use `risk-assessment.md §External` instead)
- ❌ Electoral lens omitted when article is within 180 days of val-dag

---

### STRIDE-political

**Inputs required before starting:**
- `threat-analysis.md` (to align MITRE TTP labelling)
- `risk-assessment.md §Institutional` (to avoid duplicating content; STRIDE should add adversary-model depth, not copy rows)
- Named adversary model with at least: motivation, capability level 1–5, known or assessed technique
- Scoped entity and trust boundary clearly defined

**Analytic moves (in order):**
1. Declare scope: entity, trust boundary, time horizon, adversary model — specific; not generic
2. Fill 6 STRIDE tables (S/T/R/I/D/E); minimum 4 rows per dimension; score L (1–5) × I (1–5) for every row
3. Flag all rows with `L × I ≥ 12` as mandatory cross-references to `threat-analysis.md`
4. Produce ≥ 2 Mermaid attack trees, each with ≥ 3 node levels (Goal → tactic → technique → consequence); colour-code per standard
5. Produce MITRE ATT&CK–style TTP table; mark 🚨 (mandatory cross-ref) or ⚠️ (advisory) for each row
6. Produce recommended controls table mapped to ISO 27001:2022 + NIST CSF 2.0 + CIS Controls v8.1
7. Produce Election 2026 STRIDE lens if within 180 days of val-dag
8. Complete PIR feedback

**Scoring rubric (L × I priority matrix):**

| L\I | 1 (negligible) | 2 (minor) | 3 (moderate) | 4 (significant) | 5 (severe) |
|-----|----------------|-----------|--------------|----------------|------------|
| 5 (likely+) | 5 | 10 | 15 🚨 | 20 🚨 | 25 🚨 |
| 4 (about even) | 4 | 8 | 12 ⚠️ | 16 🚨 | 20 🚨 |
| 3 (unlikely) | 3 | 6 | 9 | 12 ⚠️ | 15 🚨 |
| 2 (very unlikely) | 2 | 4 | 6 | 8 | 10 |
| 1 (remote) | 1 | 2 | 3 | 4 | 5 |

**Anti-patterns (cause Pass-2 failure):**
- ❌ Generic STRIDE table rows without named vectors and specific targets
- ❌ Attack tree with fewer than 3 node levels or missing colour definitions
- ❌ MITRE TTP table without priority classification (🚨 / ⚠️ / optional)
- ❌ Controls table missing ISO 27001 + NIST CSF columns
- ❌ Adversary model stated as "hostile actor" without capability / motivation specification
- ❌ L×I ≥ 12 rows not cross-referenced to `threat-analysis.md`
- ❌ Producing STRIDE for a purely fiscal topic where no institutional integrity dimension exists

---

### Wildcards & Black-Swans

**Inputs required before starting:**
- `scenario-analysis.md` (to confirm which scenarios are already covered in the nominal distribution)
- `forward-indicators.md` (to check which early-warning indicators are already tracked)
- `risk-assessment.md §External` (to avoid duplicating high-impact/high-probability rows; wildcards live in the tail)
- `historical-parallels.md` (to source analogues)
- Reference class estimate: what base-rate applies to "political wildcard" in a stable Nordic democracy?

**Analytic moves (in order):**
1. Declare scope: horizon, domain filter, source set, reference class baseline, trigger
2. Define ICD-203 terms (wildcard / black-swan / cascade / resilience) in file header
3. Populate wildcard register (≥ 8 events): assign WEP, trigger indicator, monitoring source, lead time, impact vectors, counter-measures, Admiralty grade
4. Populate black-swan candidates (≥ 3): explain "why under-weighted" (cognitive/structural bias), provide ≤ 4-step causal chain, name early-warning signal, estimate recovery lead time
5. Produce ≥ 2 Mermaid cascading consequence trees (≥ 3 consequence layers each, colour-coded)
6. Populate historical analogues table (≥ 1 per major wildcard)
7. Populate early-warning indicators table; link each to `forward-indicators.md` horizon section
8. Produce resilience assessment (5 dimensions): rate 1–5, cite evidence, identify gap, recommend improvement, assign priority
9. Complete Election 2026 implications table if within 180 days of val-dag OR if `monthly-review`
10. Complete PIR feedback

**Anti-patterns (cause Pass-2 failure):**
- ❌ Wildcard events that are actually high-probability (> 45 %); those belong in `scenario-analysis.md`
- ❌ Black-swan candidates without a "why under-weighted" cognitive/structural bias explanation
- ❌ Causal chains with > 4 steps (becomes speculative; truncate or split into two candidates)
- ❌ Cascade trees with fewer than 3 levels or no mitigation lever node
- ❌ Wildcard trigger indicators not appearing in `forward-indicators.md` — Rule 3 violation
- ❌ Resilience dimension scored without evidence citation (a score of "3" needs a named source)
- ❌ Historical analogues absent from the template (prevents grounding of prior estimates)
- ❌ All wildcards in the same domain (Political only); domain diversity rule ≥ 5 different domains required

---

### Quantitative SWOT

**Inputs required before starting:**
- `swot-analysis.md` fully completed (narrative backbone; QSWOT scores are undefined without it)
- `significance-scoring.md` weight vector confirmed (`w_D=0.35, w_I=0.25, w_W=0.20, w_S=0.20`)
- IMF WEO vintage for any economic item; SCB table codes for social/demographic items
- Consumer of the analysis identified: coalition negotiators, party strategists, press office, external?

**Analytic moves (in order):**
1. Declare scope, entity, perspective, assessment horizon, anchor date
2. Document weight vector and confirm match with `significance-scoring.md`
3. Document scoring rubric with WEP ↔ C mapping table
4. Provide worked example (compute one S item end-to-end to validate formula)
5. Score ≥ 3 Strengths; compute total; identify top item
6. Score ≥ 3 Weaknesses; compute total; identify top item
7. Score ≥ 3 Opportunities; compute total; identify top item
8. Score ≥ 3 Threats; compute total; identify top item
9. Compute composite SWOT position metrics (net position, SW balance, OT balance, high-confidence share)
10. Write overall position narrative (2–3 sentences; cite specific scores; do NOT use vague "mixed picture" language)
11. Populate TOWS 2×2 with ≥ 1 specific action per quadrant, each citing item IDs
12. Run sensitivity analysis: 3–5 parameter flips; flag "fragile consensus" if net-position sign reverses
13. Produce mermaid xychart-beta with actual computed scores (not sample values)
14. Complete Election 2026 implications table if within 180 days of val-dag
15. Complete PIR feedback; surface top-3 items to `executive-brief.md`

**Formula validation checklist:**
```
For every item row, verify:
  □ I ∈ [-5.0, +5.0]
  □ C ∈ [0.20, 0.95]
  □ L ∈ [0.10, 1.00]
  □ T ∈ [0.30, 1.00]
  □ dRel + iNov + wMom + sReach ≠ 1.0 (these are per-dimension sub-scores, not a probability sum)
  □ w_D·dRel + w_I·iNov + w_W·wMom + w_S·sReach ≤ 1.0
  □ Score sign matches item class (positive for S/O; negative for W/T)
```

**Anti-patterns (cause Pass-2 failure):**
- ❌ Producing QSWOT without a completed `swot-analysis.md` companion
- ❌ Using different weight vector from `significance-scoring.md`
- ❌ Scores populated with sample values from the template instead of actual computed values
- ❌ All items clustered in a narrow score range (2.0–2.5) — indicates parameter anchoring; vary parameters
- ❌ TOWS cell containing generic text ("leverage strengths") without citing specific item IDs
- ❌ Sensitivity analysis using only 1 parameter flip — minimum is 3
- ❌ Net-position narrative that uses "mixed" or "nuanced" without specifying which specific items drive the sign
- ❌ Mermaid chart showing sample bar values instead of the actual computed scores

---

## 📏 Depth floors (line counts)

| Template | Standard | Deep | Comprehensive / Tier-C |
|----------|----------|------|------------------------|
| `pestle-analysis.md` | 100 | 150 | 220 |
| `political-stride-assessment.md` | 110 | 160 | 240 |
| `wildcards-blackswans.md` | 110 | 160 | 240 |
| `quantitative-swot.md` | 110 | 160 | 240 |

Floors apply **only** when the template is produced. Not producing them is never a failure.

**What "floor" means:** the minimum number of content-bearing lines (excluding blank lines and the Pass-2 checklist). A file at exactly the floor has used the minimum scaffolding; Comprehensive runs are expected to exceed the floor by 30–50 %.

---

## 🛡 Tradecraft compliance

All four templates inherit [`osint-tradecraft-standards.md`](osint-tradecraft-standards.md):

- **Admiralty A–F × 1–6** source-reliability grading in evidence columns (e.g. A1 = completely reliable / confirmed; B2 = usually reliable / probably true; C3 = fairly reliable / possibly true; D4 = not usually reliable / doubtful; E5 = unreliable / improbable; F6 = cannot be judged / truth cannot be judged)
- **WEP** bands for every estimative claim — Remote / Very unlikely / Unlikely / About even / Likely / Very likely / Almost certain — per [`political-style-guide.md §WEP`](political-style-guide.md#-words-of-estimative-probability-wep--odni-confidence-overlay)
- **ICD 203** standards of analytic tradecraft:
  1. Objectivity — present all relevant information regardless of its policy implications
  2. Independence — distinguish analytic judgements from policy preferences
  3. Timeliness — deliver analysis while it can still inform decisions
  4. Sources cited — attribute all information to primary sources
  5. Uncertainties conveyed — label gaps, assumptions, and alternative interpretations
  6. Distinguish underlying vs. analytic — separate observed facts from analytical inferences
  7. Relevance — relate every claim to the PIRs or key questions
  8. Logical argumentation — claims must follow from evidence with traceable reasoning
  9. Consistency — do not contradict other artifacts in the same run without explanation
  10. Accurate judgements of change — label when the assessment changes from prior runs
- **SAT catalog** linkage — PESTLE is a SAT itself; STRIDE-political draws on Red-Team and Threat-Trees; Wildcards uses Foresight + Alternative-Futures; QSWOT uses Weighted-Ranking + Sensitivity Analysis

---

## 🔗 Cross-links

- [`artifact-catalog.md § Analytical Supplementary`](artifact-catalog.md#-analytical-supplementary-artifacts-4) — single-source-of-truth row per template
- [`per-artifact-methodologies.md § Analytical Supplementary`](per-artifact-methodologies.md#analytical-supplementary) — per-artifact how-to
- [`reference-quality-thresholds.json`](reference-quality-thresholds.json) — `thresholds.analyticalSupplementary.*`
- [`.github/prompts/04-analysis-pipeline.md §Analytical Supplementary`](../../.github/prompts/04-analysis-pipeline.md) — optional deep-dive pointer
- [`imf-indicator-mapping.md`](imf-indicator-mapping.md) — Rule 7 economic data canon (IMF-first)
- [`worldbank-indicator-mapping.md`](worldbank-indicator-mapping.md) — retained non-economic WB indicators for Social / Environmental / Defence / Education rows in PESTLE
- [`osint-tradecraft-standards.md`](osint-tradecraft-standards.md) — Admiralty + WEP grading standards
