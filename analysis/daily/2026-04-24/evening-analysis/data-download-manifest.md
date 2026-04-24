# Data Download Manifest — Evening Analysis 2026-04-24

**Workflow**: `news-evening-analysis` · **Run ID**: 24906725202 · **UTC**: 2026-04-24T19:00:52Z
**Requested date**: 2026-04-24 · **Effective date**: 2026-04-24 · **Window**: today + 7-day lookback for sibling integration

**Author**: James Pether Sörling · **Classification**: OPEN · Public sources only (GDPR Art. 9(2)(e,g))
**Confidence**: HIGH (A1) — primary Riksdag open-data via MCP `get_sync_status` returned `status: live` at 19:00:52Z

## MCP health at start

| Server | Status | Latency | Notes |
|--------|--------|---------|-------|
| riksdag-regering | live | < 1s | `get_sync_status` returned `{status:"live"}` |
| scb | available | — | Not queried today (Tier-C ingests sibling economic context) |
| world-bank | available | — | Non-economic residue only (WGI), not required today |
| github | available | — | Used for artifact staging |

## Primary data sources (Tier-C ingestion model)

This is a **Tier-C aggregation workflow** — the primary data inputs are the four sibling per-type analyses already produced for 2026-04-24. Per `ext/tier-c-aggregation.md §Cross-type synthesis`, the evening-analysis reads sibling folders and cites them. No fresh per-`dok_id` downloads are required at this stage; all `dok_id` provenance is already resolved in the sibling manifests.

### Sibling folders read (today)

| Sibling folder | Path | Lead documents ingested |
|----------------|------|--------------------------|
| propositions | `analysis/daily/2026-04-24/propositions/` | HD03252, HD03253, HD03256, HD03104 (4 government bills) |
| motions | `analysis/daily/2026-04-24/motions/` | 20 opposition motions filed 2026-04-15 → 2026-04-17 against 9 props |
| committeeReports | `analysis/daily/2026-04-24/committeeReports/` | HD01CU25, HD01SfU23, HD01FiU23, HD01AU15, HD01CU29 |
| interpellations | `analysis/daily/2026-04-24/interpellations/` | HD10447 (lead) + HD10428–HD10446 (15 additional) |

### Reference Analyses (sibling synthesis ingestion per ext/tier-c-aggregation.md)

Every sibling `synthesis-summary.md`, `intelligence-assessment.md`, and `executive-brief.md` was read and incorporated into this evening-analysis. Unique `dok_id` references extracted: **44** (4 propositions + 20 motions + 5 committee reports + 16 interpellations − overlap). Open PIRs carried forward: see `intelligence-assessment.md §Prior-cycle PIR ingestion`.

### Per-document table (consolidated across siblings)

| dok_id | Title | Type | Committee | Party/Actor | Admiralty | Full-text status |
|--------|-------|------|-----------|-------------|-----------|------------------|
| HD03252 | Restricted detainee benefits (säkerhetsförvaring) | Proposition | JuU | Reg. (Kristersson/Strömmer M) | A1 | Full text |
| HD03253 | EU Banking Package (CRR3/CRD6) | Proposition | FiU | Reg. (Kristersson/Wykman M) | A1 | Full text |
| HD03256 | Tachograph enforcement | Proposition | TU | Reg. (Kristersson/Carlson KD) | A1 | Full text |
| HD03104 | 5-year debt-management evaluation | Skrivelse | FiU | Reg. (Kristersson/Wykman M) | A1 | Full text |
| HD024082 | S drivmedel counter-motion (prop 236) | Motion | FiU | S (Andersson M.) | A1 | Full text |
| HD024091 | V krigsmateriel amendments | Motion | UU | V | A1 | Full text |
| HD024092 | V drivmedel counter-motion | Motion | FiU | V | A1 | Full text |
| HD024096 | MP export ban krigsmateriel | Motion | UU | MP | A1 | Full text |
| HD024098 | MP drivmedel counter-motion | Motion | FiU | MP | A1 | Full text |
| HD024090 | C utvisning systematik-krav | Motion | SfU | C | A1 | Full text |
| HD024095 | V utvisning full avslag | Motion | SfU | V | A1 | Full text |
| HD024097 | MP utvisning motion | Motion | SfU | MP | A1 | Full text |
| HD01CU25 | Prison capacity expansion | Bet | CU | Reg. (Kriminalvården) | A1 | Full text |
| HD01SfU23 | Migration bifurcation (study/research) | Bet | SfU | Reg. (Forssmed KD) | A1 | Full text |
| HD01FiU23 | Riksbank annual review | Bet | FiU | Riksbanken | A1 | Full text |
| HD01AU15 | ILO ratification | Bet | AU | Reg. (Forssell M) | A1 | Full text |
| HD01CU29 | EV charging infrastructure | Bet | CU | Reg. (Carlson KD) | A1 | Full text |
| HD10447 | S sick-pay reimbursement (SME) | Ip | NU | S (Lundqvist P.) | A2 | Full text |
| HD10428–HD10446 | Interpellation batch (S × 12, SD × 2, C × 1, Indep × 1) | Ip | Various | Opposition | A2 | Metadata + full text |

Full per-document detail lives in each sibling folder's `documents/` subdirectory. This evening-analysis references but does **not duplicate** those files (see `cross-reference-map.md §Sibling folders`).

## MCP server availability notes

- `riksdag-regering`: healthy throughout the run. No retries required.
- `scb`: not queried (economic context carried forward from sibling analyses and IMF cache).
- `world-bank`: not queried (non-economic residue not required for today's themes).

## Retrieval timestamps

All sibling folders last written 2026-04-24 between 06:00Z (propositions) and 18:30Z (interpellations) per `git log` on each folder. This evening-analysis folder created 2026-04-24T19:01Z.

## Provenance hash

- **Primary**: Swedish Riksdag open data (data.riksdagen.se) — A1
- **Secondary**: Regeringen pressroom / regeringen.se — A1–A2
- **Tertiary**: SCB labour and fiscal series (via sibling analyses) — A2
- **Tradecraft**: ICD 203, Admiralty 6×6, SATs (ACH, Red Team, Key Assumptions Check) applied per `analysis/methodologies/osint-tradecraft-standards.md`

— End of manifest —
