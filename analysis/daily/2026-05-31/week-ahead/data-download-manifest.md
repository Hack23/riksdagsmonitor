# Data Download Manifest — 2026-05-31 / week-ahead

- Workflow: News: Week Ahead
- Article date: 2026-05-31
- Subfolder: week-ahead
- Analysis depth: deep (Tier-C aggregation, multiplier 1.2)
- Run id: 26705323600
- Improvement mode: false (first-generation)
- Lookback window: 7 days
- Source query date: 2026-05-31 (0 docs) → lookback fallback to 2026-05-29 (25 docs)
- Riksmöte: 2025/26
- Days to election (2026-09-13): 105
- Session phase: spring (pre-recess final voting week)

## MCP health

- `riksdag-regering-get_sync_status` → status `live`, generated_at 2026-05-31T06:34:43Z. PASS.

## IMF economic-context vintage pin

- Live IMF WEO pre-warm FAILED (egress/transient; 3 retries + direct fallback exhausted).
- Cached `data/imf-context.json` used: vintage **WEO-2026-04** (Apr-2026), status ok,
  vintageAgeMonths 1 (not stale). Economic citations use Apr-2026 vintage with T+N stamps.
- retrieved_at (cache): 2026-04 vintage; live-fetch-failed-using-cached noted in synthesis-summary.md.

## Reference analyses (recent-daily synthesis ingestion)

- Lookback window scanned for prior `synthesis-summary.md` / `intelligence-assessment.md`
  in `analysis/daily/2026-05-24..2026-05-31/*/`: **none found on disk** (no prior cycles
  persisted in window). Prior-cycle PIR set therefore empty → carried-forward PIR list seeded fresh.
- Cross-horizon sibling target per crossHorizonCitations: `evening-analysis` (see cross-reference-map.md).

## Documents downloaded (25)

| dok_id | Type | Title (SV) |
|--------|------|------------|
| `HD01SfU35` | bet | En ny mottagandelag |
| `HD01UbU24` | bet | Förbättrat stöd i skolan |
| `HD01UbU25` | bet | Tid för undervisningsuppdraget |
| `HD01SoU32` | bet | Stärkt medicinsk kompetens i kommunal hälso- och sjukvård |
| `HD01SoU28` | bet | IVO:s klagomålshantering (Riksrevisionen) |
| `HD01JuU33` | bet | Gränsöverskridande e-bevis |
| `HD01JuU37` | bet | Utredning av brott av unga lagöverträdare |
| `HD01UU10` | bet | Verksamheten i EU 2025 |
| `HD01UU20` | bet | Konvention om internationell skadeståndskommission |
| `HD01UU21` | bet | En särskild tribunal |
| `HD024194` | kammare | Övergångsregler för medborgarskap — ny omröstning (RO 9:15) |
| `HD024193` | kammare | Motion som utgår |
| `HD03130` | skr | Redovisning av AP-fondernas verksamhet t.o.m. 2025 |
| `HD10522` | ip | Styrningen av Vattenfall |
| `HD10523` | ip | Varsel inom pappersindustrin |
| `HD10524` | ip | Förändrad a-kassa |
| `HD10525` | ip | ILO |
| `HD10526` | ip | Utjämningssystemet och välfärden |
| `HD10527` | ip | Småföretagare och bankbedrägerier |
| `HD10528` | ip | Bankernas ansvar vid bedrägerier |
| `HD10529` | ip | Aktieaffärer och jäv |
| `HD10530` | ip | Dubbelspår på Ostkustbanan |
| `HD11858` | ip | Förbud mot pälsdjursfarmning |
| `HD11859` | ip | Fastighetsägares säkerhetsansvar |
| `HD11860` | ip | Apoteksmarknaden |

Each dok_id above has a per-document analysis at `documents/{dok_id}-analysis.md`.

## Full-Text Fetch Outcomes

| dok_id | fetched | note |
|--------|---------|------|
| HD03130 | true | full text persisted |
| HD024193 | true | full text persisted |
| HD024194 | true | full text persisted |
| HD01SoU28 | true | full text persisted |
| HD01SoU32 | true | full text persisted |
| HD01UU10 | true | full text persisted |
| HD01UbU25 | true | full text persisted |
| HD01UbU24 | true | full text persisted |
| HD01SfU35 | true | full text persisted |
| HD01JuU37 | true | full text persisted |

## Pass-2 refinement

Re-verified the full-text fetch table (10 `true` rows) against the persisted
files in `analysis/daily/2026-05-31/full-text/`, pinned the IMF WEO Apr-2026
cached vintage, and confirmed all 25 `dok_id` records map to a per-document
analysis under `documents/`.
