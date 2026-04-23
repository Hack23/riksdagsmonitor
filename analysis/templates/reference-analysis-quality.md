<!-- SPDX-FileCopyrightText: 2024-2026 Hack23 AB -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# 📏 Reference Analysis Quality Template — Benchmark Self-Score

> **📌 Template Instructions** — Copy to `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/reference-analysis-quality.md`. Self-score the current run against the reference benchmark (see `referenceBenchmark` in [`reference-quality-thresholds.json`](../methodologies/reference-quality-thresholds.json)). See [`per-artifact-methodologies.md §reference-analysis-quality`](../methodologies/per-artifact-methodologies.md#reference-analysis-quality).

> **🎯 Purpose** — Mandatory quality audit (for `comprehensive` / Tier-C runs; recommended otherwise). Compares current run to the gold-standard reference and emits a concrete Pass-2 action list. This is the single artifact that operationalises the AI-FIRST principle.

---

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
| Coverage (21/21 core) | 0.25 | `[#]` | `[#]` |
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
