# Year Ahead — 2026-05-31 — Analysis Product

Tier-C long-horizon (2.0× depth) political-intelligence product for the Swedish Riksdag/Regering, anchored on the 2026-09-13 general election (≤6 months → 1.5× significance multiplier applied).

## What this folder contains

A complete deep-analysis package preceding the published article, covering 10 selected parliamentary documents (committee reports/decisions dated 2026-05-29, rm 2025/26) and the year-ahead strategic environment.

## Artifact map

| Family | Artifacts |
|--------|-----------|
| A — Core synthesis | `README.md`, `executive-brief.md`, `synthesis-summary.md`, `significance-scoring.md`, `classification-results.md`, `swot-analysis.md`, `risk-assessment.md`, `threat-analysis.md`, `stakeholder-perspectives.md` |
| B — Structural metadata | `data-download-manifest.md`, `cross-reference-map.md` |
| C — Strategic extensions | `scenario-analysis.md`, `comparative-international.md`, `devils-advocate.md`, `intelligence-assessment.md`, `methodology-reflection.md` |
| D — Electoral & domain lenses | `election-2026-analysis.md`, `voter-segmentation.md`, `coalition-mathematics.md`, `historical-parallels.md`, `media-framing-analysis.md`, `implementation-feasibility.md`, `forward-indicators.md` |
| Long-horizon extras | `pestle-analysis.md`, `wildcards-blackswans.md`, `quantitative-swot.md` |
| Supplementary (Tier-C) | `analysis-index.md`, `reference-analysis-quality.md`, `mcp-reliability-audit.md`, `workflow-audit.md` |
| E — Per-document | `documents/{dok_id}-analysis.md` ×10 |
| Sidecar | `pir-status.json` |

## Selected documents

HD03130 (AP-fonder), HD10526 (utjämningssystem), HD10524 (a-kassa), HD01SfU35 (mottagandelag), HD01JuU37 (unga lagöverträdare), HD01JuU33 (e-bevis EU), HD01UU10 (EU 2025), HD01SoU32 (kommunal vård), HD01UbU25 (undervisningstid), HD024194 (medborgarskap).

## Headline judgement

The government bloc enters the campaign year with strong fiscal footing (IMF WEO Apr-2026: growth ~2.1% `T+1`, debt ~34% GDP) but a cohesion-constrained ~176-seat margin. Modal outcome is **S1 continuity** [horizon:election]; the live break is **S3 fracture** on values files. See `executive-brief.md`.

## Provenance

IMF live fetch degraded at runtime → figures pinned to WEO-2026-04 vintage (see `mcp-reliability-audit.md`). Calendar API degraded → forward dates statutory-anchored. Parliamentary data: live `riksdag-regering` MCP (`get_sync_status: live`).

## Pass-2 refinement

Pass-2 review confirmed the artifact map is internally consistent: every Family D lens resolves back to the four PIRs, and the modal **S1 continuity** [horizon:election] judgement is load-bearing across `executive-brief.md`, `scenario-analysis.md` and `quantitative-swot.md` (assets 10.95 > threats 4.75). The single most decision-relevant uncertainty remains bloc cohesion on `HD01SfU35`/`HD024194` — tracked as PIR-COHESION-2026 and indicator cluster I1–I4 (June 2026).
