# Data Download Manifest — Month Ahead (2026-05-31)

- **Article date:** 2026-05-31
- **Subfolder:** month-ahead
- **Article type:** month-ahead (Tier-C aggregation · long-horizon additive · period multiplier 1.5×)
- **Riksmöte:** 2025/26
- **Window covered:** 2026-05-31 → 2026-06-30 (30-day forward horizon)
- **Data freshness:** primary documents sourced from 2026-05-29 (1 business-day lookback; chamber tabled the spring batch on this date ahead of the June votes)
- **MCP status:** `get_sync_status` = live at run start; 8 MCP tools queried; 150 unique documents discovered, 25 selected for the horizon.
- **Generated at:** 2026-05-31T13:14Z

## Scope note

This is a forward-looking monthly intelligence product. The 25 source documents are committee reports (betänkanden) and motions tabled on 2026-05-29 that are **scheduled for chamber decision (votering) during the final June sitting weeks before the summer recess**, plus the AP-fund annual accounting. The dominant exogenous driver across the whole horizon is the **2026-09-13 general election** (T+105 days): every legislative outcome in June is read through the lens of pre-recess positioning and campaign signalling.

## Source Documents (25)

| dok_id | Type | Committee | Title (abridged) | DIW tier |
|--------|------|-----------|------------------|----------|
| HD01SfU35 | betänkande | SfU | En ny mottagandelag (asylum reception reform) | L3 Priority |
| HD01JuU37 | betänkande | JuU | Bättre möjligheter att utreda brott av unga lagöverträdare | L3 Priority |
| HD01JuU33 | betänkande | JuU | Effektivare gränsöverskridande inhämtning av elektroniska bevis | L2 Strategic |
| HD01UU10 | betänkande | UU | Verksamheten i Europeiska unionen under 2025 | L2 Strategic |
| HD01SoU32 | betänkande | SoU | Stärkt medicinsk kompetens i kommunal hälso- och sjukvård | L2 Strategic |
| HD01UbU24 | betänkande | UbU | Förbättrat stöd i skolan | L2 Strategic |
| HD01UbU25 | betänkande | UbU | Tid för undervisningsuppdraget | L2 Strategic |
| HD01SoU28 | betänkande | SoU | Riksrevisionens rapport om IVO:s klagomålshantering | L1 Surface |
| HD01UU20 | betänkande | UU | Sveriges tillträde till skadeståndskommissionskonventionen | L1 Surface |
| HD01UU21 | betänkande | UU | Anslutning till tribunalen för aggressionsbrottet mot Ukraina | L2 Strategic |
| HD03130 | redogörelse | Finansdepartementet | Redovisning av AP-fondernas verksamhet t.o.m. 2025 | L2 Strategic |
| HD024193 | motion | — | Motionen utgår (procedural withdrawal) | L1 Surface |
| HD024194 | motion | — | Övergångsregler för medborgarskap — ny omröstning (RO 9:15) | L3 Priority |
| HD10522 | motion | — | Styrningen av Vattenfall | L2 Strategic |
| HD10523 | motion | — | Varsel inom pappersindustrin | L1 Surface |
| HD10524 | motion | — | Förändrad a-kassa | L2 Strategic |
| HD10525 | motion | — | Regeringens arbete i ILO | L1 Surface |
| HD10526 | motion | — | Ett reformerat utjämningssystem för en jämlik välfärd | L3 Priority |
| HD10527 | motion | — | Skydd för småföretagare vid bankbedrägerier | L1 Surface |
| HD10528 | motion | — | Ökad transparens och bankernas ansvar vid bedrägerier | L2 Strategic |
| HD10529 | motion | — | Regeringens åtgärder efter rapportering om aktieaffärer och jäv | L2 Strategic |
| HD10530 | motion | — | Dubbelspår på Ostkustbanan | L1 Surface |
| HD11858 | motion | — | Förbud mot pälsdjursfarmning | L1 Surface |
| HD11859 | motion | — | Fastighetsägares ansvar för säkerhet | L1 Surface |
| HD11860 | motion | — | Apoteksmarknaden | L1 Surface |

Primary-source index: <https://www.riksdagen.se/sv/dokument-och-lagar/> (per-document permalinks recorded in each `documents/{dok_id}-analysis.md`).

## Full-Text Fetch Outcomes

Top documents from the flattened batch had full text auto-fetched (`--auto-full-text-top-n=5`, long-horizon default raised to 10) to sidecar files under `analysis/data/full-text/`.

| dok_id | full_text_available | chars |
|--------|---------------------|-------|
| HD03130 | true | 100015 |
| HD024194 | true | 33342 |
| HD01SoU28 | true | 46320 |
| HD01SoU32 | true | 60162 |
| HD01UU10 | true | 100015 |
| HD01UbU25 | true | 100015 |
| HD01UbU24 | true | 100015 |
| HD01SfU35 | true | 100015 |
| HD01JuU37 | true | 100015 |
| HD024193 | true | 665 |

## Reference Analyses (Tier-C recent-daily synthesis ingestion)

Per `ext/tier-c-aggregation.md §Recent-daily synthesis ingestion`, the following sibling per-type analyses from the last 30 days were read and their `dok_id` references, stakeholder names, and open PIRs carried forward into Pass 1:

- `analysis/daily/2026-05-31/week-ahead/synthesis-summary.md` — immediate 7-day predecessor.
- `analysis/daily/2026-05-29/week-ahead/synthesis-summary.md` — prior week-ahead.
- `analysis/daily/2026-05-11/month-ahead/synthesis-summary.md` — prior month-ahead cycle (PIR roll-forward source).
- `analysis/daily/2026-05-28/monthly-review/synthesis-summary.md` — retrospective audit of the closing month.
- `analysis/daily/2026-05-29/propositions/`, `.../motions/`, `.../committee-reports/`, `.../interpellations/` — same-batch per-type folders.
- `analysis/daily/2026-05-27/year-ahead/` and `.../election-cycle/` — long-horizon context anchors.

## IMF vintage pin (long-horizon §10)

- **vintage:** WEO Apr-2026 (`WEO-2026-04`), age 1 month, not stale.
- **retrieved_at:** 2026-05-31T13:05:41Z (pre-warm probe `data/imf-context.json`).
- **payload checksum:** cached probe ok (WEO + FM datamapper, CPI sdmx); live re-fetch on 2026-05-31T13:13Z returned transient datamapper failures, so economic citations use the cached Apr-2026 vintage with explicit annotation. ``

## Predecessor manifest

Predecessor folders consumed for PIR roll-forward and cross-horizon citation:

- `analysis/daily/2026-05-11/month-ahead/` (most recent same-type predecessor — PIR genealogy source).
- `analysis/daily/2026-05-31/week-ahead/` and `analysis/daily/2026-05-29/week-ahead/` (shorter-horizon anchors).

## Data limitations

- **Calendar feed degraded:** `data/runtime/calendar-status.json` reports 0 events (Riksdag kalender MCP API returned HTML; web fallback HTTP 404). Forward sitting-week dates below are reconstructed from the standard riksdag spring-session schedule and the tabling dates of the source betänkanden, not from a live calendar pull. Flagged `[unconfirmed]` where exact votering dates are inferred.
- **IMF live re-fetch degraded:** see IMF vintage pin above; cached Apr-2026 vintage used.
