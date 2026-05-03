<!-- SPDX-FileCopyrightText: 2024-2026 Hack23 AB -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# 📑 Analysis Index Template — Run Artifact Navigator

> **📌 Template Instructions** — Copy to `analysis/daily/$ARTICLE_DATE/$SUBFOLDER/analysis-index.md`. Produced at the end of Pass 2 (after every other artifact is finalised) as the read-me-first index of the run. See [`per-artifact-methodologies.md §analysis-index`](../methodologies/per-artifact-methodologies.md#analysis-index).

> **🎯 Purpose** — Comprehensive directory of every artifact in this run with recommended reading order for the article generator, downstream reviewers and the next same-type run. Answers: *"what exists in this run and what should I read first?"*

## 🔄 Tradecraft Context

- **Workflow role** — Final navigation layer for the run; produced at the end of Pass 2 after all required artifacts are complete, reviewed and internally consistent.
- **Primary users** — Article generator, human reviewers, later same-type runs, and audit/compliance readers needing a single entry point into the full analysis set.
- **Why it matters** — Reduces retrieval errors, makes reading order explicit, surfaces degraded or missing artifacts, and provides the canonical map of what evidence existed before any article text was written.
- **Tradecraft rule** — Do not introduce new claims here. Summarise and link the run's completed artifacts; point readers to the authoritative source artifact for each major finding.
- **AI-FIRST requirement** — Complete only after both passes finish: Pass 1 creates the artifact set; Pass 2 re-reads, improves, validates consistency, then assembles this index as the read-me-first navigator.

---

<!-- TEMPLATE_CONTRACT_V1 -->
> **📐 Template Contract** — every fill of this template MUST satisfy this row.
>
> | Slot | Value |
> |------|-------|
> | **Owning methodology** | [`per-artifact-methodologies.md`](../methodologies/per-artifact-methodologies.md#analysis-index) |
> | **Owning gate check** | Check 1 (presence) + supplementary — see [`05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md) |
> | **Required inputs** | all peers in the run folder |
> | **Horizon band** | per-run (per [`scripts/horizon-context.ts`](../../scripts/horizon-context.ts)) |
> | **Output family** | Operational Supplementary |
> | **Aggregation order** | appended (alphabetical, after canonical block) (see [`scripts/render-lib/aggregator/order.ts`](../../scripts/render-lib/aggregator/order.ts)) |
> | **Reader Intelligence Guide** | row generated from `analysis-index.md` (see [`scripts/render-lib/aggregator/reader-guide.ts`](../../scripts/render-lib/aggregator/reader-guide.ts)) |
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
| **Report ID** | `[REQUIRED: AI-YYYY-MM-DD-runNN]` |
| **Run Date** | `[REQUIRED: YYYY-MM-DD]` |
| **Article Type** | `[REQUIRED: breaking / evening / weekly / monthly / motions / propositions / committee-reports / interpellations / week-ahead / month-ahead / realtime-monitor]` |
| **Run Number** | `[REQUIRED: runNN]` |
| **Run Directory** | `[REQUIRED: analysis/daily/YYYY-MM-DD/{type}-runNN/]` |
| **Runtime Duration** | `[REQUIRED: HH:MM:SS]` |
| **Pass 1 Completed** | `[REQUIRED: ✅ / ❌]` |
| **Pass 2 Completed** | `[REQUIRED: ✅ / ❌]` |
| **Data Sources Attempted** | `[REQUIRED: count of MCP tool invocations]` |
| **Data Sources Succeeded** | `[REQUIRED: count]` |
| **Confidence** | `[REQUIRED: HIGH 🟢 / MEDIUM 🟡 / LOW 🔴]` |

---

## 1️⃣ Run Summary

**Article type** — `[REQUIRED]`  
**Run ID** — `[REQUIRED: {type}-run{N}]`  
**Date** — `[REQUIRED: YYYY-MM-DD]`  
**Wall-clock runtime** — `[REQUIRED]`  
**Completion status** — `[REQUIRED: ✅ Complete / ⚠️ Degraded / ❌ Incomplete]`  
**Gate status** — `[REQUIRED: ✅ PASSED / ❌ FAILED — reasons listed below]`  

> One-paragraph (3–5 sentences) narrative summary of what this run produced, the dominant finding, and any degradation notes. Cite the single most-important artifact.

---

## 2️⃣ Production Stage Diagram

```mermaid
%%{init: {"theme":"dark","themeVariables":{"primaryColor":"#1565C0","primaryTextColor":"#ffffff","lineColor":"#90CAF9","secondaryColor":"#2E7D32","tertiaryColor":"#FF9800","fontFamily":"Inter, Helvetica, Arial, sans-serif"}}}%%
flowchart LR
    P03["03 — data download"] --> P04P1["04 — Pass 1 create"]
    P04P1 --> P04P2["04 — Pass 2 improve"]
    P04P2 --> P05["05 — gate"]
    P05 --> P06["06 — article"]
    P06 --> P07["07 — commit & PR"]

    classDef ok fill:#2E7D32,color:#ffffff
    classDef warn fill:#FF9800,color:#000000
    classDef fail fill:#D32F2F,color:#ffffff
    class P03,P04P1,P04P2,P05,P06,P07 ok
```

Annotate each node ✅ / ⚠️ / ❌ based on actual execution.

---

## 3️⃣ Artifact Inventory — Core Always-On (23)

| # | Family | Canonical filename | On-disk path | Lines | Floor | Status |
|:-:|:------:|--------------------|--------------|:-----:|:-----:|:------:|
| 1 | A | `README.md` | `README.md` | `[#]` | `[floor]` | `[✅/⚠️/❌]` |
| 2 | A | `executive-brief.md` | `executive-brief.md` | `[#]` | `[floor]` | `[…]` |
| 3 | A | `synthesis-summary.md` | `synthesis-summary.md` | `[#]` | `[floor]` | `[…]` |
| 4 | A | `significance-scoring.md` | `significance-scoring.md` | `[#]` | `[floor]` | `[…]` |
| 5 | A | `classification-results.md` | `classification-results.md` | `[#]` | `[floor]` | `[…]` |
| 6 | A | `swot-analysis.md` | `swot-analysis.md` | `[#]` | `[floor]` | `[…]` |
| 7 | A | `risk-assessment.md` | `risk-assessment.md` | `[#]` | `[floor]` | `[…]` |
| 8 | A | `threat-analysis.md` | `threat-analysis.md` | `[#]` | `[floor]` | `[…]` |
| 9 | A | `stakeholder-perspectives.md` | `stakeholder-perspectives.md` | `[#]` | `[floor]` | `[…]` |
| 10 | B | `data-download-manifest.md` | `data-download-manifest.md` | `[#]` | `[floor]` | `[…]` |
| 11 | B | `cross-reference-map.md` | `cross-reference-map.md` | `[#]` | `[floor]` | `[…]` |
| 12 | C | `scenario-analysis.md` | `scenario-analysis.md` | `[#]` | `[floor]` | `[…]` |
| 13 | C | `comparative-international.md` | `comparative-international.md` | `[#]` | `[floor]` | `[…]` |
| 14 | C | `devils-advocate.md` | `devils-advocate.md` | `[#]` | `[floor]` | `[…]` |
| 15 | C | `intelligence-assessment.md` | `intelligence-assessment.md` | `[#]` | `[floor]` | `[…]` |
| 16 ⭐ | C | `methodology-reflection.md` | `methodology-reflection.md` | `[#]` | `[floor]` | `[…]` |
| 17 | D | `election-2026-analysis.md` | `election-2026-analysis.md` | `[#]` | `[floor]` | `[…]` |
| 18 | D | `voter-segmentation.md` | `voter-segmentation.md` | `[#]` | `[floor]` | `[…]` |
| 19 | D | `coalition-mathematics.md` | `coalition-mathematics.md` | `[#]` | `[floor]` | `[…]` |
| 20 | D | `historical-parallels.md` | `historical-parallels.md` | `[#]` | `[floor]` | `[…]` |
| 21 | D | `media-framing-analysis.md` | `media-framing-analysis.md` | `[#]` | `[floor]` | `[…]` |
| 22 | D | `implementation-feasibility.md` | `implementation-feasibility.md` | `[#]` | `[floor]` | `[…]` |
| 23 | D | `forward-indicators.md` | `forward-indicators.md` | `[#]` | `[floor]` | `[…]` |

Floors from [`reference-quality-thresholds.json`](../methodologies/reference-quality-thresholds.json).

> **Notes on the 23-artifact core** — `cross-reference-map.md` is a single artifact; Tier-C adds sibling-folder citations *inside* the same file (do **not** create a second file). Per-document analyses live under `documents/{dok_id}-analysis.md` (Family E template, validated by gate Check 2) and are **not** counted in this 23-row core inventory.

---

## 4️⃣ Artifact Inventory — Operational Supplementary (present in this run)

| # | Filename | Produced? | Lines | Floor | Notes |
|:-:|----------|:---------:|:-----:|:-----:|-------|
| S1 | `analysis-index.md` (this file) | ✅ | `[#]` | 120 | — |
| S2 | `reference-analysis-quality.md` | `[✅/❌]` | `[#]` | 120 | Mandatory for `comprehensive` |
| S3 | `mcp-reliability-audit.md` | `[✅/❌]` | `[#]` | 150 | Mandatory for `comprehensive` |
| S4 | `workflow-audit.md` | `[✅/❌]` | `[#]` | 120 | Mandatory for `comprehensive` |
| S5 | `cross-run-diff.md` | `[✅/N/A]` | `[#]` | 130 | N/A if first run |
| S6 | `cross-session-intelligence.md` | `[✅/N/A]` | `[#]` | 140 | N/A unless aggregation workflow |
| S7 | `session-baseline.md` | `[✅/N/A]` | `[#]` | 140 | N/A unless aggregation workflow |

---

## 5️⃣ Family-E Per-Document Files

| `dok_id` | Path | DIW tier | Lines | Floor | Cluster? |
|----------|------|:--------:|:-----:|:-----:|:--------:|
| `[REQUIRED]` | `documents/[dok_id]-analysis.md` | `[L1/L2/L2+/L3]` | `[#]` | `[floor]` | `[y/n]` |

Total Family-E files: `[#]`. Clusters: `[#]`.

---

## 6️⃣ Recommended Reading Order

For the **article generator** (module 06):

1. `synthesis-summary.md` — BLUF and Key Judgments.
2. `significance-scoring.md` — tier-sorted headline items.
3. `stakeholder-perspectives.md` — quote sources.
4. `risk-assessment.md` + `threat-analysis.md` — for risk/conflict framing.
5. `forward-indicators.md` — closing "what to watch" section.
6. `methodology-reflection.md` — confidence + caveats for byline.

For a **downstream reviewer** (humans + next-run agent):

1. This index.
2. `methodology-reflection.md` + `reference-analysis-quality.md` (if present).
3. `cross-run-diff.md` (if present) — what changed since last run.
4. `synthesis-summary.md`.
5. Any artifact flagged ⚠️ in §3 or §4.

---

## 7️⃣ MCP & Data Source Summary

| Server / tool | Calls | Succeeded | Failed | Mean latency | Notes |
|---------------|:-----:|:---------:|:------:|:------------:|-------|
| `riksdag-regering` | `[#]` | `[#]` | `[#]` | `[ms]` | — |
| `scb` | `[#]` | `[#]` | `[#]` | `[ms]` | — |
| `world-bank` | `[#]` | `[#]` | `[#]` | `[ms]` | — |
| IMF (`tsx scripts/imf-fetch.ts`) | `[#]` | `[#]` | `[#]` | `[ms]` | — |
| `github` | `[#]` | `[#]` | `[#]` | `[ms]` | module 07 only |

Full detail — see [`mcp-reliability-audit.md`](mcp-reliability-audit.md) when present.

---

## 8️⃣ Gate Outcome

**Gate result** — `[REQUIRED: ✅ PASSED / ❌ FAILED]`  
**Failing checks** — `[REQUIRED: list or "none"]`  
**Waivers applied** — `[REQUIRED: list or "none"]`

If `❌ FAILED`, the article MUST NOT be published. See [`05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md) outcome rules.

---

## 9️⃣ Changelog for This Run

- `[REQUIRED]` 1-line summary of what improved vs Pass 1 (link to `cross-run-diff.md` for run-over-run delta).
- `[REQUIRED]` Any MCP degradations and their mitigations.
- `[REQUIRED]` Any methodology deviations (e.g. waiver approved) and the human approver.

---

## 🔗 Cross-References

- Methodology: [`../methodologies/per-artifact-methodologies.md#analysis-index`](../methodologies/per-artifact-methodologies.md#analysis-index)
- Catalog: [`../methodologies/artifact-catalog.md`](../methodologies/artifact-catalog.md)
- Thresholds: [`../methodologies/reference-quality-thresholds.json`](../methodologies/reference-quality-thresholds.json)
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

