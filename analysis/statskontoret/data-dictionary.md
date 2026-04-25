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

## Freshness discipline

- Myndighetsförteckning: annual refresh; re-run discovery when source page `last-modified` changes.
- Månadsutfall: monthly refresh after Statskontoret publication.
- Årsutfall: refresh on preliminary/definitive release changes.
- Budget time series: annual official-statistics publication.

## Persistence layout

```text
analysis/data/statskontoret/{dataset}/{artifact}.json
analysis/data/statskontoret/{dataset}/{artifact}.meta.json
```

Sidecar metadata contains `fetchedAt`, `mcpTool: statskontoret-ts-client`, `dataset` and `artifact`.
