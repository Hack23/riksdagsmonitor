<!-- SPDX-FileCopyrightText: 2024-2026 Hack23 AB -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# 📏 Reference Analysis Quality Template — Benchmark Self-Score

> **📌 Template Instructions** — Copy to `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/reference-analysis-quality.md`. Self-score the current run against the reference benchmark (see `referenceBenchmark` in [`reference-quality-thresholds.json`](../methodologies/reference-quality-thresholds.json)). See [`per-artifact-methodologies.md §reference-analysis-quality`](../methodologies/per-artifact-methodologies.md#reference-analysis-quality).

> **🎯 Purpose** — Mandatory quality audit (for `comprehensive` / Tier-C runs; recommended otherwise). Compares current run to the gold-standard reference and emits a concrete Pass-2 action list. This is the single artifact that operationalises the AI-FIRST principle.

## 🔄 Tradecraft Context

- **Workflow stage** — Complete after Pass 1 artifact production and before final article drafting or Pass 2 sign-off.
- **Primary use** — Measure the current run against the repository reference benchmark and identify concrete improvement work required to meet AI-FIRST quality expectations.
- **Analyst task** — Use evidence from the current run only; compare depth, completeness, specificity, cross-referencing, and actionability against the benchmark defined in [`reference-quality-thresholds.json`](../methodologies/reference-quality-thresholds.json).
- **Output requirement** — Record clear benchmark gaps, explain why they matter, and produce a prioritised Pass-2 remediation list that can be executed immediately.
- **Quality rule** — Do not mark the run as benchmark-met unless the artifact set demonstrates comparable analytical depth and operational usefulness to the reference run.

---

<!-- TEMPLATE_CONTRACT_V1 -->
> **📐 Template Contract** — every fill of this template MUST satisfy this row.
>
> | Slot | Value |
> |------|-------|
> | **Owning methodology** | [`per-artifact-methodologies.md`](../methodologies/per-artifact-methodologies.md#reference-analysis-quality) |
> | **Owning gate check** | Supplementary (Tier-C mandatory) + thresholds.json — see [`05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md) |
> | **Required inputs** | every artifact in the run; `reference-quality-thresholds.json` |
> | **Horizon band** | per-run (per [`scripts/horizon-context.ts`](../../scripts/horizon-context.ts)) |
> | **Output family** | Operational Supplementary |
> | **Aggregation order** | appended (alphabetical, after canonical block) (see [`scripts/render-lib/aggregator/order.ts`](../../scripts/render-lib/aggregator/order.ts)) |
> | **Reader Intelligence Guide** | row generated from `reference-analysis-quality.md` (see [`scripts/render-lib/aggregator/reader-guide.ts`](../../scripts/render-lib/aggregator/reader-guide.ts)) |
> | **Canonical evidence anchor** | `\| claim \| evidence (dok_id / vote / MP) \| retrieved_at \| confidence \|` — every analytical claim row uses this schema. |
>
> Cross-reference: [`README.md §Template ↔ Methodology ↔ Gate-Check Matrix`](README.md#-template--methodology--gate-check-matrix).

<!--
AI-FIRST Pass-1 / Pass-2 self-check (HTML comment — invisible in rendered articles; not stripped by aggregator unless under a "## Pass 2 …" heading).

PASS 1 (creation, minimal viable artifact):
  • Fill every REQUIRED slot above; cite ≥ 1 dok_id / vote / MP / primary-source URL per major claim.
  • Use the canonical evidence anchor schema for every analytical claim row.
  • Mermaid blocks use the cyberpunk %%{init: theme/themeVariables}%% prologue and at least one `style …` or `classDef …` directive (Check 5 of 05-analysis-gate.md).

PASS 2 (read-back & improve — AI-FIRST mandatory, ≥ 180 s after Pass 1):
  • Re-read the file end-to-end; for each section verify (a) ≥ 1 evidence anchor row, (b) WEP language tightened (no "may/might/could" hedges), (c) named actors with intressent_id where applicable, (d) Mermaid colour theming present.
  • Banned-phrase scan: "intelligence theatre", "sources say", "reportedly", "it is widely believed", "experts agree", "AI_MUST_REPLACE".
  • Citation density target: ≥ 1 evidence anchor row per 100 words of analytical prose.
  • Neutrality arithmetic: equal analytical depth across the 8 Riksdag parties (S, M, SD, V, MP, C, L, KD); flag and correct any bias in the Pass-2 Self-Audit section.

ANTI-TEMPLATE — DO NOT:
  • Ship plain prose without evidence anchor tables.
  • Leave AI_MUST_REPLACE / [REQUIRED: …] placeholders in the rendered output.
  • Cite a non-primary URL when a `dok_id` or vote record is available.
  • Treat co-occurrence of keywords as coordination; uni-directional chains as bi-directional.
  • Use a Mermaid block without colour theming (Check 5 will block aggregation).
  • Skip the Pass-2 read-back (Check 6 verifies mtime ≥ birth + 180 s OR a differing pass1/ snapshot).
-->

## 📋 Document Metadata

| Field | Value |
|-------|-------|
| **Report ID** | `[REQUIRED: RAQ-YYYY-MM-DD-runNN]` |
| **Current Run** | `[REQUIRED: {type}-run{N}, YYYY-MM-DD]` |
| **Reference Benchmark** | `[REQUIRED: e.g. breaking-runXXX, YYYY-MM-DD — from thresholds JSON]` |
| **Pass Number** | `[REQUIRED: Pass 1 / Pass 2]` |
| **Overall Benchmark Met** | `[REQUIRED: ✅ Yes / ⚠️ Partial / ❌ No]` |
| **Confidence** | `[REQUIRED: 🟢 / 🟡 / 🔴]` |

---

## 1️⃣ Per-Artifact Line Count vs. Depth Floor

| Artifact (run-relative) | Floor | Actual | Δ | Status |
|-------------------------|:-----:|:------:|:-:|:------:|
| `README.md` | `[#]` | `[#]` | `[±#]` | `[✅/⚠️/❌]` |
| `executive-brief.md` | `[#]` | `[#]` | `[±#]` | `[…]` |
| `synthesis-summary.md` | `[#]` | `[#]` | `[±#]` | `[…]` |
| `significance-scoring.md` | `[#]` | `[#]` | `[±#]` | `[…]` |
| `classification-results.md` | `[#]` | `[#]` | `[±#]` | `[…]` |
| `swot-analysis.md` | `[#]` | `[#]` | `[±#]` | `[…]` |
| `risk-assessment.md` | `[#]` | `[#]` | `[±#]` | `[…]` |
| `threat-analysis.md` | `[#]` | `[#]` | `[±#]` | `[…]` |
| `stakeholder-perspectives.md` | `[#]` | `[#]` | `[±#]` | `[…]` |
| `cross-reference-map.md` | `[#]` | `[#]` | `[±#]` | `[…]` |
| `data-download-manifest.md` | `[#]` | `[#]` | `[±#]` | `[…]` |
| `scenario-analysis.md` | `[#]` | `[#]` | `[±#]` | `[…]` |
| `comparative-international.md` | `[#]` | `[#]` | `[±#]` | `[…]` |
| `devils-advocate.md` | `[#]` | `[#]` | `[±#]` | `[…]` |
| `intelligence-assessment.md` | `[#]` | `[#]` | `[±#]` | `[…]` |
| `methodology-reflection.md` ⭐ | `[#]` | `[#]` | `[±#]` | `[…]` |
| `election-2026-analysis.md` | `[#]` | `[#]` | `[±#]` | `[…]` |
| `voter-segmentation.md` | `[#]` | `[#]` | `[±#]` | `[…]` |
| `coalition-mathematics.md` | `[#]` | `[#]` | `[±#]` | `[…]` |
| `historical-parallels.md` | `[#]` | `[#]` | `[±#]` | `[…]` |
| `media-framing-analysis.md` | `[#]` | `[#]` | `[±#]` | `[…]` |
| `implementation-feasibility.md` | `[#]` | `[#]` | `[±#]` | `[…]` |
| `forward-indicators.md` | `[#]` | `[#]` | `[±#]` | `[…]` |

**Core coverage** — `[#]` / 23 at or above floor (target: 23/23). Authoritative contract: [`artifact-catalog.md`](../methodologies/artifact-catalog.md) + [`.github/prompts/04-analysis-pipeline.md`](../../.github/prompts/04-analysis-pipeline.md) (Family A/B/C/D = 9+2+5+7 = 23). Floors from [`reference-quality-thresholds.json`](../methodologies/reference-quality-thresholds.json).

### Supplementary (if present)

| Artifact | Floor | Actual | Status |
|----------|:-----:|:------:|:------:|
| `analysis-index.md` | 120 | `[#]` | `[…]` |
| `mcp-reliability-audit.md` | 150 | `[#]` | `[…]` |
| `workflow-audit.md` | 120 | `[#]` | `[…]` |
| `cross-run-diff.md` | 130 | `[#]` | `[…]` |
| `cross-session-intelligence.md` | 140 | `[#]` | `[…]` |
| `session-baseline.md` | 140 | `[#]` | `[…]` |

---

## 2️⃣ Tradecraft Signal Audit (from `tradecraftQualitySignals`)

| Signal | Applies to | Observed | Gap |
|--------|-----------|:--------:|-----|
| WEP band + horizon on headline judgements | `synthesis-summary`, `scenario-analysis`, `threat-analysis`, `risk-assessment`, `intelligence-assessment`, `forward-indicators`, `cross-run-diff`, `cross-session-intelligence` | `[✅/⚠️/❌]` | `[list artifacts missing WEP]` |
| Admiralty grade on external sources | `synthesis-summary`, `scenario-analysis`, `threat-analysis`, `risk-assessment`, `intelligence-assessment`, `devils-advocate`, `comparative-international`, `cross-run-diff` | `[…]` | `[…]` |
| ICD 203 BLUF + confidence labels | `synthesis-summary`, `intelligence-assessment`, `methodology-reflection` | `[…]` | `[…]` |
| ≥ 10 SATs documented | `methodology-reflection`, `devils-advocate` | `[…]` | `[…]` |
| DIW scores present | `significance-scoring`, Family-E files | `[…]` | `[…]` |
| Party-neutrality arithmetic | `synthesis-summary`, `swot`, `risk`, `stakeholder-perspectives`, `media-framing`, `voter-segmentation`, `coalition-mathematics` | `[…]` | `[…]` |

---

## 3️⃣ Evidence Quality Distribution

| Admiralty grade | Count | % of sources |
|-----------------|:-----:|:------------:|
| A-1 / A-2 | `[#]` | `[%]` |
| B-1 / B-2 | `[#]` | `[%]` |
| C / D | `[#]` | `[%]` |
| E / F | `[#]` | `[%]` |

**Source Diversity Rule** — `[REQUIRED: % of P0/P1 claims backed by ≥ 3 independent sources]` (target: 100%).  
**`[unconfirmed]` flags** — `[#]` (acceptable if ≤ 10% of total claims).

---

## 4️⃣ Party-Neutrality Arithmetic

| Party | Expected share (seats) | Observed share (word count) | Δ | Status |
|-------|:---------------------:|:---------------------------:|:-:|:------:|
| S | `[%]` | `[%]` | `[±%]` | `[✅/⚠️/❌]` |
| M | `[%]` | `[%]` | `[±%]` | `[…]` |
| SD | `[%]` | `[%]` | `[±%]` | `[…]` |
| V | `[%]` | `[%]` | `[±%]` | `[…]` |
| MP | `[%]` | `[%]` | `[±%]` | `[…]` |
| C | `[%]` | `[%]` | `[±%]` | `[…]` |
| L | `[%]` | `[%]` | `[±%]` | `[…]` |
| KD | `[%]` | `[%]` | `[±%]` | `[…]` |

Tolerance — ± 15 pp of seat share. Failure → mandatory Pass-2 rewrite of offending artifacts.

---

## 5️⃣ Overall Benchmark Judgement

| Gate | Weight | Score (0–10) | Weighted |
|------|:------:|:------------:|:--------:|
| Coverage (23/23 core) | 0.25 | `[#]` | `[#]` |
| Depth floors met | 0.20 | `[#]` | `[#]` |
| Tradecraft signals | 0.20 | `[#]` | `[#]` |
| Evidence quality | 0.15 | `[#]` | `[#]` |
| Neutrality | 0.10 | `[#]` | `[#]` |
| Supplementary completeness | 0.10 | `[#]` | `[#]` |
| **Total** | 1.00 | | `[#/10]` |

Minimum to pass the quality gate: **7.0/10**. Pass-2 is mandatory until the score is ≥ 7.0.

---

## 6️⃣ Pass-2 Action List

Numbered, concrete, executable. Each action must name the artifact, the gap and the fix.

1. `[REQUIRED]` e.g. "`risk-assessment.md` — line count 140 vs floor 180: expand the Institutional dimension with 3 more rows citing `dok_id` from `data-download-manifest.md §FiU`."
2. `[REQUIRED]`
3. `[REQUIRED]`
4. (add as many as needed)

---

## 7️⃣ Comparison to Reference Run

| Metric | Reference | This run | Delta |
|--------|:---------:|:--------:|:-----:|
| Total artifacts | `[#]` | `[#]` | `[±#]` |
| Total lines | `[#]` | `[#]` | `[±#]` |
| P0/P1 claim count | `[#]` | `[#]` | `[±#]` |
| Admiralty A-rated sources | `[#]` | `[#]` | `[±#]` |
| SAT diversity | `[#]` | `[#]` | `[±#]` |
| Runtime (min) | `[#]` | `[#]` | `[±#]` |

---

## 🔗 Cross-References

- Methodology: [`../methodologies/per-artifact-methodologies.md#reference-analysis-quality`](../methodologies/per-artifact-methodologies.md#reference-analysis-quality)
- Thresholds: [`../methodologies/reference-quality-thresholds.json`](../methodologies/reference-quality-thresholds.json)
- Catalog: [`../methodologies/artifact-catalog.md`](../methodologies/artifact-catalog.md)
- Gate: [`../../.github/prompts/05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md)

---

**Template version:** v1.2 · **Last updated:** 2026-04-25

---

## ✅ Pass-2 Self-Audit Checklist (v4.4 — required)

> **Purpose:** AI-FIRST principle requires a Pass-2 read-back-and-improve. After producing this artifact in Pass 1, re-read it end-to-end and verify each item below. Document any remediation in [`methodology-reflection.md`](methodology-reflection.md) §"Pass-2 audit log". Any unchecked ❌ box at the end of Pass 2 forces a Pass-3 rewrite of the affected section.

- [ ] **Tradecraft anchors honoured** — F3EAD stage matches the artifact's role; PIRs declared in the §Tradecraft Context block are actually addressed in the body; Admiralty grades attached to every external source; WEP band + ODNI confidence on every probabilistic judgement.
- [ ] **Source diversity floor met** — at least the minimum number of independent MCP sources required by the artifact's tradecraft block are cited; single-source claims are explicitly labelled `[SINGLE-SOURCE — corroboration pending]`.
- [ ] **Evidence specificity** — every quantified claim cites a `dok_id` (Riksdag), an SCB / IMF dataflow code, or a named external source with date; no "according to data" / "studies show" hand-waves.
- [ ] **Named-actor discipline** — every political claim names ≥ 1 person (party + role + dated act/quote) or labels the absence (`[diffuse — no named actor]`).
- [ ] **Counter-narrative present** — at least one explicit competing hypothesis, dissent quote, or framed objection appears in the body; "no opposition recorded" is itself a finding to label, not silence.
- [ ] **Election 2026 lens applied** — the §"Election 2026 Implications" subsection (or equivalent) addresses electoral salience, coalition pressure, and forward indicators; not boilerplate.
- [ ] **No illustrative content shipped as fact** — every `[REQUIRED]` placeholder is filled OR removed; every `Example:` block is clearly fenced or removed; no fabricated `dok_id`, vote count, or quote leaks into the final artifact.
- [ ] **Cross-references resolve** — every `[link](file.md)` in this artifact points to a file that exists in the run folder (`analysis/daily/$ARTICLE_DATE/$SUBFOLDER/`) or to a methodology / template under `analysis/`.
- [ ] **Mermaid renders** — every fenced ` ```mermaid ` block parses (no missing class definitions, no orphan nodes, no >40-node graphs that overflow viewport on mobile).
- [ ] **Line-floor check** — artifact length ≥ the per-artifact floor in [`reference-quality-thresholds.json`](../methodologies/reference-quality-thresholds.json); shorter artifacts trigger Pass-2 rewrite, never a `[truncated]` note.

