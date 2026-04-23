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

- **Wildcard** — plausible low-probability event (WEP `unlikely` to `very unlikely`, ≈ 5–20 %) with material impact on the political system.
- **Black-swan (in Taleb sense)** — an event outside the current model's probability distribution, recognisable only in hindsight. We document **candidate black-swans** — events our current priors would rate "almost impossible" (< 5 %) but where a plausible causal chain exists.

---

## 📅 Wildcard register (≥ 8)

| ID | Event | Domain | Prior WEP | Trigger indicator | Lead time | Impact vector(s) | Counter-measures already in place |
|----|-------|--------|-----------|-------------------|-----------|------------------|-----------------------------------|
| W1 | | Political | unlikely (≈ 15 %) | | | coalition / fiscal | |
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

**Template version:** v1.0 · **Last updated:** 2026-04-23
