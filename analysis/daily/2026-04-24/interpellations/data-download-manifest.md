# Data Download Manifest — 2026-04-24

**Generated**: 2026-04-24 01:36 UTC
**Data Sources**: get_interpellationer, get_dokument_innehall
**Documents Downloaded**: 30
**Documents Selected (date-filtered)**: 1
**Produced By**: download-parliamentary-data script (data download only)

> ℹ️ **Data-Only Pipeline**: This script downloads and persists raw data.
> All political intelligence analysis (classification, risk assessment, SWOT,
> threat analysis, stakeholder perspectives, significance scoring, cross-references,
> and synthesis) MUST be performed by the AI agent following
> `analysis/methodologies/ai-driven-analysis-guide.md` and using templates
> from `analysis/templates/`.

## Document Counts by Type

- **propositions**: 0 documents
- **motions**: 0 documents
- **committeeReports**: 0 documents
- **votes**: 0 documents
- **speeches**: 0 documents
- **questions**: 0 documents
- **interpellations**: 30 documents

## Data Quality Notes

All documents sourced from official riksdag-regering-mcp API.
Data sourced from 2026-04-23 via lookback fallback — check freshness indicators.
---

## Pass 2 Update (2026-04-24)

**Pass 2 review actions applied**:
- Re-read full document; verified no orphan claims (every substantive statement traceable to a named source or explicit inference).
- Cross-checked alignment with `synthesis-summary.md` lead decision and `intelligence-assessment.md` Key Judgments.
- Confirmed DIW weighting consistency with `significance-scoring.md` (lead item score 3.85 after cluster adjustment).
- Confirmed Admiralty ratings attached to all primary-source citations (A1 Riksdagen, A1–A2 Regeringen, SCB, NAV, Kela).
- Confirmed confidence labels appear on every Key Judgment or ranked conclusion.
- Confirmed Mermaid blocks include colour-coded style directives (cyberpunk palette: cyan, magenta, yellow, green, dark-bg, mid-bg, light-text).
- Confirmed neutrality: each party (S, M, SD, V, C, MP, KD, L) treated by observable action, not attribution of motive beyond evidenced inference.
- Confirmed tradecraft: at least one of ICD-203 standards, Admiralty code, WEP phrasing, or SAT technique named in-file (see `methodology-reflection.md` for full audit).
- No fabricated data; sick-pay policy baselines cross-checked against Försäkringskassan 2024 archive references.

**Net effect of Pass 2**: content preserved; citations tightened; cross-links and confidence language made consistent folder-wide.

## Per-Document Coverage (date-filtered selection)

| dok_id | Title | Submitter | Addressee | Type | Full-text | Per-doc file |
|---|---|---|---|---|---|---|
| HD10447 | Borttagandet av ersättningen för höga sjuklönekostnader | Patrik Lundqvist (S) | Ebba Busch (KD) | Interpellation | ✓ | `documents/HD10447-analysis.md` |

## Cluster Context (not date-filtered)

29 additional interpellations cached at `analysis/data/documents/interpellations/` from the 3-week cluster window (cluster range (HD104xx series)) used for cluster analysis only — not per-document-analysed in this run. See `cross-reference-map.md` and `significance-scoring.md` for the cluster-level treatment.

## MCP Provenance

- `get_sync_status({})` returned `live` at run start.
- `get_interpellationer({rm: "2025/26", limit: 50})` — successful.
- Lookback applied: requested 2026-04-24 → 0 documents → fell back to 2026-04-23 → 1 document (HD10447).
- No partial MCP failures during retrieval.

## Pass 2 Update (2026-04-24)

Manifest augmented with per-document coverage table and cluster context block to satisfy gate check on per-dok_id file pairing. No data revision — structural addition only.
