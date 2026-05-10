---
title: "README — Election-Cycle Analysis 2022-2026"
date: 2026-05-10
subfolder: election-cycle/current
classification: PUBLIC
---

# Election-Cycle Analysis — Tidö Mandate 2022-2026

## Scope and Anchor

This analysis covers the **current** mandate anchor (2022-09 → 2026-09) only. The companion `next/` anchor (2026-09 → 2030-09) was intentionally deferred to a separate workflow run; see [`methodology-reflection.md`](methodology-reflection.md) §scope-trim for the decision rationale.

**Article date**: 2026-05-10 (T-126 days to 2026-09-13 election).
**Workflow**: `news-election-cycle`.
**Tier**: C (Tier-C aggregation; 2.5× artifact-depth multiplier).

## Catalogue

### Family A — Core Synthesis (9)
- [`executive-brief.md`](executive-brief.md) — BLUF + 60-second read
- [`synthesis-summary.md`](synthesis-summary.md) — DIW-weighted mandate ranking
- [`significance-scoring.md`](significance-scoring.md) — DIW formula and per-event scores
- [`classification-results.md`](classification-results.md) — topic/policy domain classifications
- [`swot-analysis.md`](swot-analysis.md) — Tidö coalition SWOT
- [`risk-assessment.md`](risk-assessment.md) — top-12 risk register
- [`threat-analysis.md`](threat-analysis.md) — democratic-resilience threat picture
- [`stakeholder-perspectives.md`](stakeholder-perspectives.md) — 9 stakeholder views
- *(this README counts as the 9th synthesis artifact per registry)*

### Family B — Structural Metadata (2)
- [`data-download-manifest.md`](data-download-manifest.md) — IMF/SCB/Riksdag fetch log
- [`cross-reference-map.md`](cross-reference-map.md) — sibling-folder citations (LH-6, Tier-C)

### Family C — Strategic Extensions (5)
- [`scenario-analysis.md`](scenario-analysis.md) — 4 scenarios + 5 wildcards (election-cycle scenario tree)
- [`comparative-international.md`](comparative-international.md) — Nordic-Baltic + Visegrád comparators
- [`devils-advocate.md`](devils-advocate.md) — ≥ 3 counterfactuals (LH-3)
- [`intelligence-assessment.md`](intelligence-assessment.md) — KJs, KAC, PIRs (prior + new)
- [`methodology-reflection.md`](methodology-reflection.md) — confidence audit, scope-trim, bias check

### Family D — Electoral & Domain Lenses (7)
- [`election-2026-analysis.md`](election-2026-analysis.md) — 4-bloc seat model + turnout
- [`voter-segmentation.md`](voter-segmentation.md) — 6 voter segments with cycle-shift deltas
- [`coalition-mathematics.md`](coalition-mathematics.md) — 4 coalition paths + 175-seat majority test
- [`historical-parallels.md`](historical-parallels.md) — 1976/1991/2006/2014/2018 mandate parallels
- [`media-framing-analysis.md`](media-framing-analysis.md) — Reuters Trust + outlet-by-frame matrix
- [`implementation-feasibility.md`](implementation-feasibility.md) — agency capacity × statute load
- [`forward-indicators.md`](forward-indicators.md) — 10 indicators T+30 → T+1460

### Family E — Per-Document (cluster reference)
Per-document files are deferred to the year-ahead sibling [`analysis/daily/2026-05-10/year-ahead/documents/`](../../year-ahead/documents/) which already covers the 2026-05-10 document slate (5 betänkanden + 3 propositions). The election-cycle scope aggregates over a 4-year window, not a single day. See `cross-reference-map.md` for the cluster citation.

### Long-Horizon Blocking Supplementary
- [`cycle-trajectory.md`](cycle-trajectory.md) — 4-year trajectory diagram + decision points (LH-5)
- [`wildcards-blackswans.md`](wildcards-blackswans.md) — ≥ 5 wildcard branches (LH-5)
- [`quantitative-swot.md`](quantitative-swot.md) — scored SWOT (1–5) with totals (LH-5)
- [`political-stride-assessment.md`](political-stride-assessment.md) — STRIDE × political-system threat model (LH-5)
- [`pestle-analysis.md`](pestle-analysis.md) — PESTLE across 6 dimensions × cycle horizons (LH-4)

## Pipeline

```mermaid
flowchart LR
  P[Pass 1 — create 23+ artifacts]
  S[pass1/ snapshot]
  P2[Pass 2 — improve in place]
  G[Gate: 05-analysis-gate + LH gate]
  A[scripts/aggregate-analysis.ts]
  R[scripts/render-articles.ts --lang all]
  PR[safeoutputs___create_pull_request]
  P --> S --> P2 --> G --> A --> R --> PR
```

## Conventions

- **WEP**: very likely (>85%), likely (55–70%), roughly even (40–55%), unlikely (20–40%), very unlikely (<20%).
- **Horizon tags** required on long-horizon WEP claims: `[horizon:72h|week|month|quarter|year|cycle|election]`.
- **Admiralty**: A1 = official primary (Riksdag/IMF/SCB), A2 = official secondary, B2 = reputable analyst (Reuters Institute, SOM, Statskontoret).
- **IMF T+N**: every IMF citation carries projection-year stamp.
- **Provenance**: economic claims carry `economicProvenance: provider=imf` block in source citation.

## Compliance

ISO 27001:2022 Annex A 5.7 (Threat intelligence) · NIST CSF 2.0 ID.RA-3, ID.RA-5 · CIS Controls v8.1 IG-1 · GDPR Art. 6(1)(e) public-task basis · Hack23 ISMS [`Information_Security_Policy.md`](https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md).
