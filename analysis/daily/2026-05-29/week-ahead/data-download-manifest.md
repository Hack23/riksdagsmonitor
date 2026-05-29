# Data Download Manifest — Week Ahead 2026-05-29

**Workflow**: News: Week Ahead
**Run**: 26627762076 attempt 1
**Started (UTC)**: 2026-05-29T08:57:08Z
**Requested date**: 2026-05-29
**Subfolder**: week-ahead
**Improvement mode**: false
**Generation**: first-generation (no prior week-ahead folder for 2026-05-29)
**Status**: complete.

## MCP Health Gate

- `riksdag-regering-get_sync_status` → `{"status":"live"}` — MCP reachable at agent start.
- `get_calendar_events` (2026-05-29 → 2026-06-12) → **DEGRADED**: API returned an HTML error page. Chamber-event dates inferred from the standard riksmöte pre-recess calendar; flagged in forward-indicators.md (#2) and methodology-reflection.md.
- IMF pre-warm (`data/imf-context.json`) → **OK**, vintage WEO-2026-04. Live IMF fetch (`imf-fetch.ts weo SWE`) → **DEGRADED** (transient egress); pre-warm vintage used with T+N stamps (see economic-data.json).

## Download Summary

- Source script: `scripts/download-parliamentary-data.ts --date 2026-05-29 --limit 30`
- Documents downloaded: **18** → `analysis/daily/2026-05-29/documents/*.json`
- Full text fetched (top batch): **10** → `analysis/daily/2026-05-29/full-text/*.md`
- Cataloged: `scripts/catalog-downloaded-data.ts --pending-only`

## Per-Document Coverage

| dok_id | Type | Committee | Title (abbrev) | Full text |
|--------|------|-----------|----------------|-----------|
| HD01SfU35 | bet | SfU | En ny mottagandelag | yes |
| HD01JuU33 | bet | JuU | Gränsöverskridande e-bevis | yes |
| HD01UU10 | bet | UU | Verksamheten i EU 2025 | yes |
| HD01SoU32 | bet | SoU | Medicinsk kompetens kommunal vård | yes |
| HD01SoU28 | bet | SoU | Riksrevisionen om IVO | yes |
| HD01UbU24 | bet | UbU | Förbättrat stöd i skolan | yes |
| HD01UbU25 | bet | UbU | Tid för undervisningsuppdraget | yes |
| HD03130 | bet | FiU | AP-fondernas verksamhet 2025 | yes |
| HD10522 | ip | — | Styrningen av Vattenfall | partial |
| HD10523 | ip | — | Varsel inom pappersindustrin | partial |
| HD10524 | ip | — | Förändrad a-kassa | yes |
| HD10525 | ip | — | Regeringens arbete i ILO | no |
| HD10526 | ip | — | Reformerat utjämningssystem | yes |
| HD10527 | ip | — | Småföretagares skydd bankbedrägeri | no |
| HD10528 | ip | — | Transparens bankbedrägerier | no |
| HD11858 | mot | — | Förbud mot pälsdjursfarmning | no |
| HD11859 | mot | — | Fastighetsägares trygghetsansvar | no |
| HD11860 | mot | — | Apoteksmarknaden | no |

## Reference Analyses (Tier-C Recent-Daily Synthesis Ingestion)

Sibling analyses across the 7-day lookback window (2026-05-22 → 2026-05-28) ingested for cross-type continuity and PIR roll-forward (full citations in cross-reference-map.md):

- `analysis/daily/2026-05-28/evening-analysis/synthesis-summary.md` + `intelligence-assessment.md` — most recent daily; cross-horizon anchor; PIR source.
- `analysis/daily/2026-05-28/monthly-review/synthesis-summary.md` — May macro-trend context.
- `analysis/daily/2026-05-27/year-ahead/scenario-analysis.md` + `analysis/daily/2026-05-27/election-cycle/synthesis-summary.md` — long-horizon baselines.
- `analysis/daily/2026-05-23/weekly-review/synthesis-summary.md` — prior weekly retrospective.
- `analysis/daily/2026-05-22/week-ahead/intelligence-assessment.md` — immediately prior week-ahead; PIR-WA-03/04/05 roll-forward source.
- `analysis/daily/2026-05-25/propositions/synthesis-summary.md` + `analysis/daily/2026-05-26/committee-reports/synthesis-summary.md` — spring migration-bill cluster and committee pipeline.

**Carried-forward PIRs**: PIR-WA-03 (Lagrådet → HD01SfU35), PIR-WA-04 (L/C reservation → HD01JuU33), PIR-WA-05 (Migrationsverket capacity). See pir-status.json.

## Data Quality Statement

Primary committee-report coverage is strong (8/8 betänkanden with full text). Interpellation/motion full text is partial. Calendar and live-IMF degradation are documented and mitigated by inference and pre-warm vintage. Overall data sufficiency for a MEDIUM–HIGH confidence week-ahead analysis: **adequate**.
