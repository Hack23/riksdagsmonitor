# Methodology Reflection — Year Ahead — 2026-05-31

**Standard**: ICD 203 / ICD 206 analytic tradecraft self-audit. This file documents method, sourcing, limitations, and the AI-FIRST two-pass discipline.

## Method

Tier-C long-horizon (2.0× depth) pipeline: corpus download → curation (10 dok_ids) → classification → significance scoring (with 1.5× pre-election multiplier) → SWOT/risk/threat → scenario tree (4 base + 5 wildcards) → ICD-203 key judgments → contrarian review → synthesis. Templates from `analysis/templates/` informed every artifact's structure.

## Pre-election multiplier audit

Election anchor 2026-09-13 is ≤6 months out → a **1.5× significance multiplier** was applied to contested opposition motions and contested propositions (`HD01SfU35`, `HD024194`, `HD01JuU37`, `HD10526`, `HD10524`) in `significance-scoring.md`. Consensual files (`HD01JuU33`, `HD01UU10`) received 1.0×. This is recorded here per the long-horizon contract.

## Sourcing & provenance

- **Primary**: riksdagen.se parliamentary records (all 10 dok_ids verified).
- **Economic**: IMF WEO Apr-2026 **pinned vintage** — live Datamapper/SDMX fetch **degraded** in-agent (transient fetch failures across `weo`/`compare`); analysis used the pre-warm vintage pin with explicit `T+N` stamps. No World Bank substitution for GDP/debt/inflation. Recorded in `mcp-reliability-audit.md` and `data-download-manifest.md`.
- **Swedish ground truth**: SCB for labour/municipal finance.

## Limitations (ICD 203 audit)

1. **Live IMF degradation** — macro figures are pinned-vintage, not live; directional only.
2. **Calendar API error** — forward indicators anchored on statutory dates, not live calendar events; flagged ``.
3. **Missing quarter-ahead predecessor** — the cross-horizon chain has a 90-day gap; the quarter-ahead bridge is cited by expected path with a DATA-GAP annotation (`cross-reference-map.md`, LH-6) and flagged as forward action D5. This *reduces* depth confidence on the 90–365-day transition band.
4. **Party-field gaps** — several motions lack party attribution; party-specific claims tagged `[unconfirmed]`.
5. **Single-day corpus** — evidence dated 2026-05-29; mitigated by the standing-pipeline nature of a 365-day forecast.

## Improvements (Pass-2)

Pass 2 read back every artifact and: tightened WEP+horizon tagging across synthesis files; added `T+N` stamps to all IMF citations; strengthened counterfactual specificity in `devils-advocate.md`; reconciled scenario probabilities to ~1.0; verified every SWOT/significance item carries a dok_id or primary-source URL; confirmed prior-cycle PIR roll-forward in `intelligence-assessment.md` and `pir-status.json`.

## Predecessor manifest

Ingested predecessors: `analysis/daily/2026-05-27/year-ahead/`, `analysis/daily/2026-05-28/monthly-review/`, `analysis/daily/2026-05-10/monthly-review/`, `analysis/daily/2026-05-09/monthly-review/`, `analysis/daily/2026-05-07/monthly-review/`. Quarter-ahead predecessor: NOT FOUND (gap recorded).

## AI-FIRST attestation

Two complete passes executed: Pass 1 created all artifacts; Pass 2 critically re-read and improved every section. No single-pass shortcuts.

## Pass-2 execution record

Pass-2 read back all 30 core artifacts against the pass1/ snapshot and made substantive analytic additions to each (not cosmetic edits): sharpened decision-relevance hooks, added competing-hypothesis probes, weighted indicators by discriminating power, and made the IMF-vintage dependency of KJ-3 explicit. The most material Pass-2 change was elevating the *delivery-capacity* axis (PIR-DELIVERY-2026) from an implicit risk to a first-class collection requirement, and reframing post-election governability as **roughly even** [horizon:cycle] rather than implicitly S1-dominant. No artifact was left identical to its Pass-1 draft.

**Pass-2 status: executed in full**
