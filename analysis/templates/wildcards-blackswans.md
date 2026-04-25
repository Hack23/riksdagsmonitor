<!-- SPDX-FileCopyrightText: 2024-2026 Hack23 AB -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

# Wildcards & Black-Swan Events — {{ARTICLE_TYPE}} · {{ARTICLE_DATE}}

> **Analytical supplementary (optional).** Captures low-probability / high-impact events that sit **outside** the 3–5 main scenarios in `scenario-analysis.md`. Useful for long-horizon forecasting (`monthly-review`), election-year aggregations, and any topic where cascading consequences are plausible. Pairs with `scenario-analysis.md` (adds tail), `risk-assessment.md` (extends posterior tail), and `forward-indicators.md` (early-warning triggers).
>
> **Methodology** → [`analysis/methodologies/analytical-supplementary-methodology.md § Wildcards & Black-Swans`](../methodologies/analytical-supplementary-methodology.md#wildcards--black-swans).
> **Not counted in the 23 core artifacts.** Non-blocking in `05-analysis-gate.md`.

## 🔄 Tradecraft Context

- **Artifact class** — Analytical supplementary (optional, never blocking)
- **Use when** — Long-horizon forecasting (`monthly-review`), election-year aggregations, or any topic where cascading consequences of tail events are plausible
- **Pairs with** — `scenario-analysis.md` (adds tail beyond 3–5 main scenarios), `risk-assessment.md` (extends posterior tail), `forward-indicators.md` (early-warning triggers)
- **Methodology** — [`analytical-supplementary-methodology.md § Wildcards & Black-Swans`](../methodologies/analytical-supplementary-methodology.md#wildcards--black-swans)
- **Workflow status** — Not counted in the 23 core artifacts; non-blocking in [`05-analysis-gate.md`](../../.github/prompts/05-analysis-gate.md)

## 📋 Scope

- **Horizon** — [3 m / 6 m / 12 m / 24 m / to-2030]
- **Domain filter** — [political / economic / security / social / technological / environmental — all]
- **Source set** — [open-source red-teaming, historical analogues, expert elicitation, scenario-analysis.md anchor]

## 🔑 Definitions (ICD 203-aligned)

- **Wildcard** — plausible low-probability event (WEP `Unlikely` to `Remote`, ≈ 5–37 %, per [`political-style-guide.md`](../methodologies/political-style-guide.md#-words-of-estimative-probability-wep--odni-confidence-overlay)) with material impact on the political system.
- **Black-swan (in Taleb sense)** — an event outside the current model's probability distribution, recognisable only in hindsight. We document **candidate black-swans** — extreme-tail events our current priors would rate `Remote` or lower (typically < 5 %) but where a plausible causal chain exists.

---

## 📅 Wildcard register (≥ 8)

| ID | Event | Domain | Prior WEP | Trigger indicator | Lead time | Impact vector(s) | Counter-measures already in place |
|----|-------|--------|-----------|-------------------|-----------|------------------|-----------------------------------|
| W1 | | Political | Very unlikely (≈ 15 %) | | | coalition / fiscal | |
| W2 | | Economic | | | | | |
| W3 | | Security | | | | | |
| W4 | | Social | | | | | |
| W5 | | Technological | | | | | |
| W6 | | Environmental | | | | | |
| W7 | | Cross-domain | | | | | |
| W8 | | External (geo) | | | | | |

## 🦢 Black-swan candidates (≥ 3)

| ID | Event | Why current models under-weight it | Minimum plausible causal chain (≤ 4 steps) | Early-warning signal | Recovery lead time |
|----|-------|-----------------------------------|--------------------------------------------|---------------------|--------------------|
| BS1 | | | | | |
| BS2 | | | | | |
| BS3 | | | | | |

## ⛓ Cascading consequence trees (pick ≥ 2 from the registers)

```mermaid
%%{init: {'theme':'dark'}}%%
flowchart LR
  E[Wildcard event]:::event
  E --> A1[1st-order]:::first
  A1 --> A2[2nd-order]:::second
  A2 --> A3[3rd-order]:::third
  A3 --> MIT[Mitigation lever]:::mit
  classDef event fill:#ff006e,color:#fff,stroke:#fff
  classDef first fill:#00d9ff,color:#000
  classDef second fill:#ffbe0b,color:#000
  classDef third fill:#8338ec,color:#fff
  classDef mit fill:#06d6a0,color:#000
```

## 🧭 Early-warning indicators (feed `forward-indicators.md`)

| Wildcard ID | Indicator | Data source | Threshold | Lead time | Owner |
|-------------|-----------|-------------|-----------|-----------|-------|
| W1 | | riksdagen.se / regeringen.se / scb.se / IMF / WB / myndighet | | | |

## 🛡 Resilience assessment

| Resilience dimension | Current state (1–5) | Evidence | Gap | Recommendation |
|---------------------|---------------------|----------|-----|----------------|
| Institutional redundancy | | | | |
| Fiscal buffer | | | | IMF GGXWDG_NGDP vintage |
| Coalition flexibility | | | | coalition-mathematics |
| Information-integrity resilience | | | | media-framing + STRIDE |
| External alliance depth | | | | NATO / EU / Nordic |

## 🎯 PIR feedback

| PIR | Addressed by wildcard(s) | Gap | Action |
|-----|--------------------------|-----|--------|
| PIR-1 | | | |

---

## 🔗 Cross-links

- [`scenario-analysis.md`](scenario-analysis.md) — main scenarios; this file extends the long tail
- [`risk-assessment.md`](risk-assessment.md) — tail-risk register rows cite wildcard IDs
- [`forward-indicators.md`](forward-indicators.md) — trigger indicators here populate ≥ 1 horizon section
- [`historical-parallels.md`](historical-parallels.md) — analogue events used as priors
- [`devils-advocate.md`](devils-advocate.md) — hypothesis cluster for "current consensus mis-prices tail"

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

