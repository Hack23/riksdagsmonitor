# Data Download Manifest — 2026-05-31 — Year Ahead (365-day outlook)

**Generated**: 2026-05-31 13:42 UTC
**Workflow**: news-year-ahead (Tier-C aggregation, comprehensive, 2.0× depth multiplier)
**Article type**: `year-ahead` · **Subfolder**: `year-ahead` · **Horizon**: 365 days · **Lookback**: 180 days
**Data Sources**: get_propositioner, get_motioner, get_betankanden, search_voteringar, search_anforanden, get_fragor, get_interpellationer, get_dokument_innehall · IMF WEO/FM (Datamapper) · SCB · World Bank (governance residue)
**Riksmöte**: 2025/26
**Produced By**: download-parliamentary-data pipeline + AI agent curation (this manifest is the analysis-scope anchor)

> Data-only provenance: the download script persists raw MCP JSON; all classification, scoring, SWOT,
> risk, threat, scenario and synthesis work is performed by the AI agent per
> `analysis/methodologies/ai-driven-analysis-guide.md` using `analysis/templates/`.

## Freshness & coverage

- Live `get_sync_status` at 13:39 UTC returned `status: live` (riksdagen.se + g0v.se healthy).
- No documents dated 2026-05-31; lookback fallback active → primary corpus dated **2026-05-29** (1 business day back). Acceptable for a 365-day forward-look whose evidence base is the standing legislative pipeline, not single-day flow.
- Calendar API degraded at run time (`data/runtime/calendar-status.json status: error`; kalender-API returned HTML, web fallback 404). Forward-calendar anchoring therefore relies on the statutory Riksmöte rhythm (BP autumn / VP spring) and published election date, not live calendar events.  

## Selected documents (analysis scope — Family E coverage)

Ten documents anchor the annual outlook across the contested policy axes (migration, criminal justice, EU/foreign, welfare delivery, education, fiscal equalisation, pensions, labour, citizenship). Each has a `documents/{dok_id}-analysis.md`.

| dok_id | type | organ | date | title (sv) | thematic axis |
|--------|------|-------|------|------------|---------------|
| HD03130 | skrivelse | Finansdepartementet | 2026-05-29 | Redovisning av AP-fondernas verksamhet t.o.m. 2025 | Pensions / fiscal |
| HD10526 | motion | — | 2026-05-29 | Ett reformerat utjämningssystem för en jämlik välfärd | Fiscal equalisation |
| HD10524 | motion | — | 2026-05-29 | Förändrad a-kassa | Labour / social insurance |
| HD01SfU35 | betänkande | SfU | 2026-05-29 | En ny mottagandelag | Migration (contested) |
| HD01JuU37 | betänkande | JuU | 2026-05-29 | Bättre möjligheter att utreda brott av unga lagöverträdare | Criminal justice (contested) |
| HD01JuU33 | betänkande | JuU | 2026-05-29 | Effektivare gränsöverskridande inhämtning av elektroniska bevis | Justice / EU |
| HD01UU10 | betänkande | UU | 2026-05-29 | Verksamheten i Europeiska unionen under 2025 | EU / foreign policy |
| HD01SoU32 | betänkande | SoU | 2026-05-29 | Stärkt medicinsk kompetens i kommunal hälso- och sjukvård | Health / welfare |
| HD01UbU25 | betänkande | UbU | 2026-05-29 | Tid för undervisningsuppdraget | Education |
| HD024194 | motion | — | 2026-05-29 | Övergångsregler för medborgarskap — en ny omröstning | Citizenship (contested) |

Full raw corpus: 84 documents persisted to `analysis/data/`; 25 date-selected; the 10 above are the curated analysis spine for the year-ahead lens. The remaining 15 selected documents are background context (apoteksmarknad, Vattenfall-styrning, Ostkustbanan, pälsdjursfarmning, bankbedrägerier, ILO, EU-skadestånd) and are cited where relevant without dedicated Family E files.

## MCP query diagnostics

| tool | query | result_count | coverage_state |
|------|-------|-------------:|----------------|
| get_propositioner | `{"limit":12,"rm":"2025/26"}` | 12 | metadata_only |
| get_motioner | `{"limit":12,"rm":"2025/26"}` | 12 | metadata_only |
| get_betankanden | `{"limit":12,"rm":"2025/26"}` | 12 | metadata_only |
| search_voteringar | `{"limit":12,"rm":"2025/26"}` | 12 | metadata_only |
| get_fragor | `{"limit":12,"rm":"2025/26"}` | 12 | metadata_only |
| get_interpellationer | `{"limit":12,"rm":"2025/26"}` | 12 | metadata_only |
| get_dokument_innehall | per-dok | 8 | full_text (HD03130, HD024194, HD01SoU32, HD01UU10) |

## IMF vintage pin

| field | value |
|-------|-------|
| vintage | **WEO-2026-04** (April 2026) |
| vintageAgeMonths | 1 (fresh; not stale) |
| retrieved_at | 2026-05-31T13:36:33Z (news-prewarm probe) |
| payload_sha-256 | pinned via `data/imf-context.json` (probes WEO/FM/CPI all ok at pre-warm) |
| in-agent live status | **degraded** — Datamapper REST returned transient fetch failures inside the agent sandbox at 13:42 UTC across `weo`/`compare`; analysis uses the **pinned WEO-2026-04 vintage** with explicit `T+N` projection stamps. Recorded in `mcp-reliability-audit.md`. |

All IMF macro/fiscal figures in this analysis carry the `WEO Apr-2026` vintage stamp and a `T+N` projection-year stamp. World Bank is used only for governance (WGI) residue; SCB for Swedish ground truth.

## Reference analyses ingested (cross-horizon)

| predecessor | path | role |
|-------------|------|------|
| Year-ahead (most recent) | `analysis/daily/2026-05-27/year-ahead/synthesis-summary.md` | same-type trend baseline |
| Monthly review | `analysis/daily/2026-05-28/monthly-review/` | 30-day longitudinal lens |
| Monthly review | `analysis/daily/2026-05-10/monthly-review/` | prior-month lens |
| Quarter-ahead | `analysis/daily/2026-05-31/quarter-ahead/` | **NOT FOUND** — no quarter-ahead run exists in the 90-day window; gap recorded, depth note in `methodology-reflection.md` |

## Data quality notes

- Party field empty on several motions (HD10524/HD10526/HD024194 list payloads) — party-specific claims tagged `[unconfirmed]` per party-attribution discipline unless verified via `get_ledamot`.
- Calendar degraded → forward indicators anchored on statutory dates, flagged ``.
- IMF live degraded → pinned vintage, flagged ``.

## Pass-2 refinement

Pass-2 re-validated selection balance: the 10-document set spans five policy domains (fiscal/pensions, labour/welfare, migration/citizenship, justice, EU/foreign) with no single-domain dominance, satisfying the breadth requirement for a year-ahead product. The contested/consensual ratio (6 contested : 4 consensual) is deliberate — contested files drive the campaign battlespace while consensual files (EU annual, e-evidence) anchor the institutional-continuity baseline used in scenario S1.
