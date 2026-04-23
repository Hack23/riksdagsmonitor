<!-- SPDX-FileCopyrightText: 2024-2026 Hack23 AB -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# 🔄 Cross-Run Diff Template — Bayesian Delta Analysis

> **📌 Template Instructions** — Copy to `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/cross-run-diff.md`. Bayesian delta vs. the previous run of the **same article type**: what changed in data and assessment. See [`per-artifact-methodologies.md §cross-run-diff`](../methodologies/per-artifact-methodologies.md#cross-run-diff). N/A when this is the first ever run of its type.

> **🎯 Purpose** — Track evolution of political assessment across runs. For each prior-run finding, apply Bayesian update based on new evidence to produce a posterior assessment with an explicit WEP band shift.

## 🔄 Tradecraft Context

- **Artifact role** — Compares the current run against the immediately previous run of the **same article type** to identify material changes in evidence, assessment, and confidence.
- **When to use** — Required for every non-initial run. If this is the first ever run for the article type, mark this artifact `N/A` and state that no prior baseline exists.
- **Primary inputs** — Current-run core artifacts, prior-run core artifacts, prior `synthesis-summary.md`, prior `reference-analysis-quality.md`, and any newly surfaced source evidence that materially changes the posterior judgement.
- **Analytical standard** — Use explicit Bayesian-style updating: identify what changed, explain whether each change strengthens, weakens, or leaves unchanged the prior assessment, and record any resulting WEP band movement with concise justification.
- **Output requirement** — Focus only on deltas that matter for editorial judgement, risk framing, or confidence. Do not restate unchanged background unless needed to explain a shift.

---

## 📋 Document Metadata

| Field | Value |
|-------|-------|
| **Report ID** | `[REQUIRED: XRD-YYYY-MM-DD-runNN]` |
| **Current Run** | `[REQUIRED: {type}-run{N}, YYYY-MM-DD]` |
| **Prior Run** | `[REQUIRED: {type}-run{N-1}, YYYY-MM-DD]` |
| **Days Between Runs** | `[REQUIRED: #]` |
| **Confidence in Delta** | `[REQUIRED: 🟢 / 🟡 / 🔴]` |

---

## 1️⃣ Prior-Run Header

**Prior run directory** — `[REQUIRED: analysis/daily/YYYY-MM-DD/{type}-run{N-1}/]`  
**Prior run date** — `[REQUIRED]`  
**Prior run gate status** — `[REQUIRED: ✅ PASSED / ❌ FAILED]`  

**Key findings from prior `synthesis-summary.md`**:

1. `[REQUIRED: 1-line prior finding + its WEP band]`
2. `[REQUIRED]`
3. `[REQUIRED]`
4. `[REQUIRED]`
5. `[REQUIRED]`

**Prior scores** (carry forward from prior `reference-analysis-quality.md §Overall judgement`):

| Metric | Prior value |
|--------|:-----------:|
| Weighted quality score | `[#/10]` |
| Reliability score (MCP) | `[#]` |
| Coverage (core artifacts) | `[#]/23` |
| P0 claims | `[#]` |
| Admiralty A-rated sources | `[#]` |

---

## 2️⃣ New Evidence Since Prior Run

| Evidence ID | Source | Date | Artifact affected | Admiralty |
|-------------|--------|:----:|-------------------|:---------:|
| `[dok_id / vote ID / URL]` | `[riksdag-regering / scb / IMF / press]` | `[YYYY-MM-DD]` | `[current run artifact]` | `[A1/…]` |

Minimum — ≥ 3 new evidence rows when days-between ≥ 3; ≥ 1 otherwise. Zero new evidence on a multi-day gap → flag prior run's stability claim.

---

## 3️⃣ Bayesian Update — Key Judgments

For each prior KJ, apply `posterior ∝ prior × likelihood(new evidence | KJ)` and state the new WEP band.

### KJ 1 — `[REQUIRED: prior KJ headline]`

- **Prior WEP** — `[e.g. Likely (55-70%), 6-month horizon]`
- **New evidence** — `[list evidence IDs from §2 that bear on this KJ]`
- **Likelihood assessment** — `[does new evidence confirm / disconfirm / condition?]`
- **Posterior WEP** — `[e.g. Very Likely (70-85%), 6-month horizon]`
- **Shift rationale** — `[2-3 sentences naming the evidence and its Admiralty]`

(Repeat for each prior KJ.)

---

## 4️⃣ Scenario Probability Shifts

| Scenario (from prior `scenario-analysis.md`) | Prior P | Posterior P | Δ | Trigger evidence |
|----------------------------------------------|:-------:|:-----------:|:-:|------------------|
| `[REQUIRED]` | `[%]` | `[%]` | `[±%]` | `[evidence ID]` |
| `[REQUIRED]` | `[%]` | `[%]` | `[±%]` | `[evidence ID]` |
| `[REQUIRED]` | `[%]` | `[%]` | `[±%]` | `[evidence ID]` |

Sum of posteriors must equal 100%.

---

## 5️⃣ Risk & Threat Register Deltas

| Prior row | Prior L×I | Posterior L×I | Δ | New row? |
|-----------|:---------:|:-------------:|:-:|:--------:|
| `[REQUIRED]` | `[score]` | `[score]` | `[±]` | `[n]` |

Rows added this run: `[#]`. Rows retired: `[#]` (with justification).

---

## 6️⃣ Stakeholder Position Changes

| Actor | Prior position | Posterior position | Evidence |
|-------|----------------|--------------------|----------|
| `[REQUIRED: MP + intressent_id / party / myndighet]` | `[support/oppose/ambiguous]` | `[…]` | `[speech ID / vote ID]` |

---

## 7️⃣ Framing Evolution

Cross-reference the longitudinal frame record in `media-framing-analysis.md`:

- **Prior dominant frame** — `[REQUIRED]`
- **Current dominant frame** — `[REQUIRED]`
- **Shift driver** — `[data / political / external event]`
- **Counter-frame status** — `[emerging / stable / absorbed]`

---

## 8️⃣ Methodology Drift Check

Any methodology or template version changes between the two runs? List them and their impact on comparability:

| Change | Prior version | Current version | Comparability impact |
|--------|:-------------:|:---------------:|----------------------|
| `[REQUIRED]` | `[vX.Y]` | `[vX.Y]` | `[none / rescored / incomparable]` |

If comparability is `incomparable`, downgrade overall diff confidence to 🔴 and flag in `methodology-reflection.md`.

---

## 9️⃣ Summary Table

| Dimension | Prior | Current | Δ | Direction |
|-----------|:-----:|:-------:|:-:|:---------:|
| Quality score | `[#/10]` | `[#/10]` | `[±]` | `[↑/↓/=]` |
| KJ count | `[#]` | `[#]` | `[±]` | `[…]` |
| P0 claims | `[#]` | `[#]` | `[±]` | `[…]` |
| Admiralty A-rated | `[#]` | `[#]` | `[±]` | `[…]` |
| Scenario entropy | `[#]` | `[#]` | `[±]` | `[…]` |
| Top risk L×I | `[#]` | `[#]` | `[±]` | `[…]` |

---

## 🔟 Headline Posterior BLUF

One paragraph (3–5 sentences) summarising the single largest shift in assessment, with WEP band + horizon + Admiralty of the triggering evidence. This paragraph feeds directly into the next `synthesis-summary.md` BLUF.

---

## 🔗 Cross-References

- Methodology: [`../methodologies/per-artifact-methodologies.md#cross-run-diff`](../methodologies/per-artifact-methodologies.md#cross-run-diff)
- Prior synthesis: `[REQUIRED: link to prior run's synthesis-summary.md]`
- Current synthesis: [`synthesis-summary.md`](synthesis-summary.md)
- SAT canon: [`../methodologies/osint-tradecraft-standards.md`](../methodologies/osint-tradecraft-standards.md)
