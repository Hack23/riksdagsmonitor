# Statskontoret Data Dictionary

## Sources

| Source key | Dataset | Cadence | Format | Coverage | Primary use |
|---|---|---:|---|---|---|
| `myndighetsforteckning` | Myndighetsförteckning – öppna data | Annual | Excel | Summary 2025, time series 2007–2025, latest and full authority register | Headcount and authority count by department over time |
| `budget-time-series` | Tidsserier, statens budget m.m. | Annual | Publication / linked tables | Final budget outcomes generally from 1995 | Long-run fiscal context |
| `arsutfall` | Årsutfall för statens budget – öppna data | Annual | Excel, CSV ZIP | Annual revenue/expenditure outturns | Budget execution by appropriation/income title/agency |
| `manadsutfall` | Månadsutfall för statens budget – öppna data | Monthly | Excel, CSV ZIP | Monthly outcomes from January 2006 onward | High-frequency budget execution monitoring |

## Myndighetsförteckning fields

| Field family | Expected labels | Normalisation | Derived use |
|---|---|---|---|
| Year | `År`, `Ar`, `Year` | integer | Time-series key |
| Authority | `Myndighet`, `Myndighetsnamn`, `Namn` | string | Distinct authority count |
| Department | `Departement`, `Departementstillhörighet` | string | Grouping dimension |
| Headcount | `Årsarbetskrafter`, `ÅA` | Swedish decimal comma → number | Sum by year and department |
| Leadership form | `Ledningsform` | string | Governance/administrative context |
| Special organs | `Särskilda organ` | string/boolean-like | Institutional context |

## Årsutfall and Månadsutfall budget-outturn fields

These fields apply to `arsutfall`, `manadsutfall` and `budget-time-series` workbooks parsed via `parseBudgetRows` / `buildBudgetTimeSeries`.

| Field | Expected labels (normalised) | Normalisation | Present in |
|---|---|---|---|
| Year | `År`, `Ar`, `Year`, `Kalenderår`, `Kalenderar` | integer | All three sources |
| Month | `Månad`, `Manad`, `Month`, `Månadsperiod` | integer 1–12 | månadsutfall only |
| Document type | `Dokumenttyp`, `Typ`, `Inkomst_Utgift` | string | All (or inferred from sheet name) |
| Income title name | `Inkomsttitelnamn`, `Inkomsttitelgruppsnamn` | string | Inkomst rows |
| Income title code | `Inkomsttitel`, `Inkomsttitelnummer`, `Inkomsttitelnr` | string | Inkomst rows |
| Appropriation name | `Anslagsnamn`, `Utgiftsomradesnamn`, `Utgiftsomrade` | string | Utgift rows |
| Appropriation number | `Anslagsnr`, `Anslagsnummer`, `Anslagspost`, `Utgiftsomradesnr` | string | Utgift rows |
| Outturn amount | `Utfall`, `Utfall MSEK`, `Utfallbelopp`, `Belopp` | Swedish decimal comma → MSEK | All rows |
| Budget amount | `Budget`, `Budgetvärde`, `Anvisat`, `Ramanslag` | Swedish decimal comma → MSEK | Where available |
| Agency | `Myndighet`, `Myndighetsnamn` | string | Finest granularity; optional |
| Status | `Status`, `Preliminär`, `Utfallsstatus` | string | Optional (preliminary/definitive) |

### Sheet-name to document-type inference

When the workbook contains multiple sheets and no explicit `--doc-type` override is given, `buildBudgetTimeSeries` infers the document type from the sheet name:

| Sheet name contains | Inferred `documentType` |
|---|---|
| `inkomst` | `Inkomst` |
| `utgift` or `anslag` | `Utgift` |
| anything else | no override (field `Typ` etc. from each row used instead) |

## Freshness discipline

- Myndighetsförteckning: annual refresh; re-run discovery when source page `last-modified` changes. The client reads the HTML meta tag `<meta name="last-modified" content="YYYY-MM-DD HH:MM:SS">` (or date-only variants) and copies the value to discovered link provenance.
- Månadsutfall: monthly refresh after Statskontoret publication.
- Årsutfall: refresh on preliminary/definitive release changes.
- Budget time series: annual official-statistics publication.

## Persistence layout

```text
analysis/data/statskontoret/{dataset}/{artifact}.json
analysis/data/statskontoret/{dataset}/{artifact}.meta.json
```

Sidecar metadata contains `fetchedAt`, `mcpTool: statskontoret-ts-client`, `dataset` and `artifact`.

## Key normalisation rules

All column-header matching is case-insensitive and accent-folded (`NFD` normalisation with diacritic removal), so `Årsarbetskrafter`, `arsarbetskrafter` and `ÅRSARBETSKRAFTER` all resolve to the same normalised key `arsarbetskrafter`.  Swedish decimal comma notation (`1.234,5`) is parsed to `1234.5` by `parseStatskontoretSwedishNumber`.

