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

<!-- TEMPLATE_CONTRACT_V1 -->
> **📐 Template Contract** — every fill of this template MUST satisfy this row.
>
> | Slot | Value |
> |------|-------|
> | **Owning methodology** | [`per-artifact-methodologies.md`](../methodologies/per-artifact-methodologies.md#cross-run-diff) |
> | **Owning gate check** | Supplementary Check 11 (gate-required when ANALYSIS_RUN_COUNT ≥ 2) — see [`05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md) |
> | **Required inputs** | previous run folder of same article type |
> | **Horizon band** | per-run (per [`scripts/horizon-context.ts`](../../scripts/horizon-context.ts)) |
> | **Output family** | Operational Supplementary |
> | **Aggregation order** | appended (alphabetical, after canonical block) (see [`scripts/render-lib/aggregator/order.ts`](../../scripts/render-lib/aggregator/order.ts)) |
> | **Reader Intelligence Guide** | row generated from `cross-run-diff.md` (see [`scripts/render-lib/aggregator/reader-guide.ts`](../../scripts/render-lib/aggregator/reader-guide.ts)) |
> | **Canonical evidence anchor** | `\| claim \| evidence (dok_id / vote / MP intressent_id / primary-source URL) \| retrieved_at \| confidence \|` — every analytical claim row uses this schema. |
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

### 2.1 IMF Vintage Delta

| Indicator | Prior vintage | Current vintage | Prior value (year) | Current value (year) | Δ (pp) | Action |
|-----------|---------------|-----------------|-------------------|---------------------|:------:|--------|
| `WEO:NGDP_RPCH` | `WEO-2025-10` | `WEO-2026-04` | `[e.g. 1.8 % (2026)]` | `[e.g. 2.1 % (2026)]` | `+0.3` | `[update / no-op]` |
| `WEO:GGXWDG_NGDP` | `WEO-2025-10` | `WEO-2026-04` | `[e.g. 32.1 % (2027)]` | `[e.g. 32.4 % (2027)]` | `+0.3` | `[update]` |
| `WEO:PCPIPCH` | `WEO-2025-10` | `WEO-2026-04` | — | — | — | — |

> **Rule**: any headline indicator whose projection shifted by **> 0.5 pp** across vintages gets a `[VINTAGE-DELTA]` annotation in the article commentary, and prior-run citations are rewritten to the current vintage. Add a sentence in §3 Bayesian Update explaining the methodology shift. Stale-vintage citations (> 6 months old per [`.github/aw/ECONOMIC_DATA_CONTRACT.md`](../../.github/aw/ECONOMIC_DATA_CONTRACT.md) § Vintage staleness rule) MUST be refreshed before publish.

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

