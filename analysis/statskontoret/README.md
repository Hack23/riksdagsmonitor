# Statskontoret Data Integration

> **Purpose**: Statskontoret open data as the authoritative Swedish public-administration and central-government budget-execution context layer for Riksdagsmonitor.
>
> **Effective**: 2026-04-25 · **Classification**: Public

Authoritative files in this folder:

- [`indicators-inventory.json`](indicators-inventory.json) — machine-readable dataset catalogue and provider decision matrix.
- [`data-dictionary.md`](data-dictionary.md) — field, cadence, freshness and derived-artifact reference.
- [`use-cases.md`](use-cases.md) — canonical article and dashboard use cases.

---

## 1 · Why Statskontoret

Statskontoret fills a gap that IMF, SCB and World Bank do not cover in the same operational form: current and historical structure of Sweden's central-government agencies and budget execution in the state's own reporting structure.

| Need | Provider | Rationale |
|---|---|---|
| Government-body headcount and authority count by department | **Statskontoret Myndighetsförteckning** | Includes årsarbetskrafter, ledningsform, särskilda organ and department grouping. |
| Annual central-government budget outturn | **Statskontoret Årsutfall** | Hermes/Riksdag/government budget execution records. |
| Monthly central-government budget outturn | **Statskontoret Månadsutfall** | Lowest-level monthly revenue/expenditure data by agency. |
| Long-run central-government fiscal time series (from 1995) | **Statskontoret Tidsserier** | Final outcomes for revenue, expenditure and balance since 1995. |
| Macro/fiscal projections | **IMF WEO/FM** | T+5 projection and cross-country methodology. |
| Swedish regional/monthly official statistics | **SCB** | PxWeb official-statistics ground truth. |

---

## 2 · Code surface

| File | Purpose |
|---|---|
| [`scripts/statskontoret-client.ts`](../../scripts/statskontoret-client.ts) | Public unauthenticated client for Statskontoret pages, Excel workbooks, CSV ZIP archives, headcount aggregation and budget-outturn parsing. |
| [`scripts/statskontoret-fetch.ts`](../../scripts/statskontoret-fetch.ts) | CLI wrapper for agentic workflows (`list-sources`, `discover`, `headcount`, `budget-outturn`). |
| [`analysis/statskontoret/indicators-inventory.json`](indicators-inventory.json) | Dataset inventory and provider decision matrix. |
| [`analysis/data/statskontoret/`](../data/statskontoret/) | Optional persisted raw/derived data written by `--persist`. |

No MCP server is required. Workflows invoke the TypeScript CLI via the `bash` tool and need egress to `www.statskontoret.se`.

---

## 3 · CLI quick reference

```bash
# List available Statskontoret sources
tsx scripts/statskontoret-fetch.ts list-sources

# Discover downloadable Excel / CSV ZIP links on a source page
tsx scripts/statskontoret-fetch.ts discover --source arsutfall --persist

# Build department headcount time series from the authority-register workbook
tsx scripts/statskontoret-fetch.ts headcount --url "https://www.statskontoret.se/...xlsx" --persist

# Parse budget-outturn rows from årsutfall / månadsutfall / budget-time-series
tsx scripts/statskontoret-fetch.ts budget-outturn \
  --source arsutfall \
  --url "https://www.statskontoret.se/...xlsx" \
  --doc-type Inkomst \
  --persist

# Omit --doc-type to let the parser infer from sheet names
tsx scripts/statskontoret-fetch.ts budget-outturn \
  --source budget-time-series \
  --url "https://www.statskontoret.se/...xlsx" \
  --persist
```

---

## 4 · Derived headcount artifact

The client converts the workbook sheet matching `förteckning` / `forteckning` into records and aggregates:

```json
{
  "year": 2025,
  "department": "Finansdepartementet",
  "headcount": 1234.5,
  "authorityCount": 12
}
```

Aggregation rules:

1. Locate header fields equivalent to `År`, `Departement`, `Myndighet` and `Årsarbetskrafter`.
2. Parse Swedish decimal comma values as numbers.
3. Sum årsarbetskrafter by `(year, department)`.
4. Count distinct authority names in the same group.
5. Persist raw/derived payloads with `.meta.json` provenance sidecars.

---

## 5 · Derived budget-outturn artifact

The `budget-outturn` command parses årsutfall, månadsutfall and budget-time-series workbooks into typed `StatskontoretBudgetRow` objects (amounts in MSEK):

```json
{
  "year": 2024,
  "documentType": "Inkomst",
  "title": "Skatt på inkomst",
  "code": "1111",
  "outturn": 500000,
  "budget": 480000
}
```

For monthly data the `month` field (1–12) is also present.  Optional fields: `agency`, `status`, `code`.

The `summarizeBudgetOutturn` helper aggregates rows into per-`(year, documentType)` totals:

```json
{
  "year": 2024,
  "documentType": "Inkomst",
  "totalOutturn": 700000,
  "totalBudget": 670000,
  "variance": 30000,
  "rowCount": 2
}
```

`variance` is `totalOutturn − totalBudget`; it is omitted when any contributing row had no budget figure.

---

## 6 · Security and data governance

- **Classification**: Public / High Integrity / Medium-High Availability.
- **Privacy**: Public authority and budget data only; no private-person data.
- **Integrity**: Source URL, retrieval timestamp, dataset and artifact are persisted in sidecar metadata.
- **Supply chain**: XLSX/ZIP parsing uses `jszip@3.10.1`; GitHub Advisory Database check completed with no known vulnerabilities for that version.
- **Threat surface**: External public-data ingestion from `www.statskontoret.se`; the `assertStatskontoretFetchTarget` guard rejects non-HTTPS or off-allowlist URLs before any fetch is issued; schema/shape validation and PR diff review mitigate data-poisoning risk.

