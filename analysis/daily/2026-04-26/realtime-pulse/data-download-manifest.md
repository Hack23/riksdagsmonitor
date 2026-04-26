# Data Download Manifest — Realtime Pulse 2026-04-26

## Provenance

- **Workflow**: news-realtime-monitor (realtime-pulse)
- **Run ID**: 24966030408
- **UTC Timestamp**: 2026-04-26T20:18:00Z
- **Requested date**: 2026-04-26
- **Effective date**: 2026-04-26 (no lookback required)
- **Window used**: 30-day lookback across sibling type folders

## MCP Server Availability

| Server | Status | Notes |
|--------|--------|-------|
| riksdag-regering | ✅ Live | `get_sync_status` confirmed at 20:17:29 UTC |
| scb | Available | Container; not invoked for this pulse |
| world-bank | Available | Container; governance residue only |

## Sibling Analysis Sources Ingested

| Folder | Date | Key dok_ids | Status |
|--------|------|-------------|--------|
| `analysis/daily/2026-04-26/propositions` | 2026-04-26 | HD03253, HD03252, HD03256, HD03104 | ✅ Ingested |
| `analysis/daily/2026-04-26/committeeReports` | 2026-04-26 | HD01FiU48, HD01JuU10, HD01CU25, HD01FiU23, HD01JuU31, HD01SoU25 | ✅ Ingested |
| `analysis/daily/2026-04-26/motions` | 2026-04-26 | HC023448, HC023447, HC023446 (framework motions) | ✅ Ingested |
| `analysis/daily/2026-04-26/interpellations` | 2026-04-26 | HD10448, HD10444, HD10447, HD10439, HD10443 | ✅ Ingested |
| `analysis/daily/2026-04-26/weekly-review` | 2026-04-26 | HC03205, HC03206, HC03203, HC03208 | ✅ Ingested |
| `analysis/daily/2026-04-26/monthly-review` | 2026-04-26 | Multi-type 30-day synthesis | ✅ Ingested |

## Per-Document Reference Table

| dok_id | Title | Type | Retrieval | Full-text |
|--------|-------|------|-----------|-----------|
| HD03253 | EU Bankpaket (CRD6/CRR3) | Prop | 2026-04-26T20:18Z | sibling-ref |
| HD03252 | Socialförsäkringsförmåner — detainee restriction | Prop | 2026-04-26T20:18Z | sibling-ref |
| HD03256 | Färdskrivare manipulation criminalisation | Prop | 2026-04-26T20:18Z | sibling-ref |
| HD03104 | Statens upplåning 2021–2025 | Skr | 2026-04-26T20:18Z | sibling-ref |
| HD01FiU48 | Extra ändringsbudget — fuel tax & energy support | Bet | 2026-04-26T20:18Z | sibling-ref |
| HD01JuU10 | En ny vapenlag | Bet | 2026-04-26T20:18Z | sibling-ref |
| HD01CU25 | Fast-track prison expansion | Bet | 2026-04-26T20:18Z | sibling-ref |
| HD01FiU23 | Riksbankens verksamhet 2025 | Bet | 2026-04-26T20:18Z | sibling-ref |
| HD01JuU31 | Police reform assessment | Bet | 2026-04-26T20:18Z | sibling-ref |
| HD01SoU25 | Elder care strengthened | Bet | 2026-04-26T20:18Z | sibling-ref |
| HD10448 | SD interpellation: energy disinformation | IP | 2026-04-26T20:18Z | metadata-only |
| HD10444 | S interpellation: employer contributions | IP | 2026-04-26T20:18Z | metadata-only |
| HD10447 | S interpellation: sick-pay reform reversal | IP | 2026-04-26T20:18Z | metadata-only |
| HC03205 | MSB→MfcF rename | Prop | 2026-04-26T20:18Z | sibling-ref |
| HC03206 | Riksrevisionen civil defence governance audit | Skr | 2026-04-26T20:18Z | sibling-ref |

## Cross-Source Enrichment

- **IMF**: WEO Apr-2026 baseline used for Swedish macro context (NGDP_RPCH, GGXWDG_NGDP). Data from `analysis/data/imf/` cache.
- **Statskontoret**: No directly relevant source found specific to realtime-pulse event set; agency-capacity evidence drawn from weekly-review sibling analysis.
- **Riksdagen API**: `get_propositioner`, `get_motioner`, `search_voteringar` called via riksdag-regering MCP.

## MCP Notes

- `get_sync_status` confirmed server live. No retries required. Pre-warm completed in under 2 minutes.
