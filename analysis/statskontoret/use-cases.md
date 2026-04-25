# Statskontoret Use Cases

## 1 · Department headcount dashboard

Use `myndighetsforteckning` to calculate annual `årsarbetskrafter` grouped by department. This provides context for articles about government reorganisation, budget pressure, administrative capacity and committee oversight.

Evidence standard: cite Statskontoret source URL, workbook year, department name and derived headcount value.

## 2 · Agency-level budget execution context

Use `arsutfall` for annual and `manadsutfall` for monthly budget execution. Pair with Riksdag budget documents and committee reports to show whether parliamentary appropriations translate into agency-level spending patterns.

Evidence standard: cite Statskontoret source URL, document type (`Inkomst`/`Utgift`), year/month/status and budget line.

## 3 · Long-run central-government fiscal context

Use `budget-time-series` to provide long-run historical framing for Swedish state-budget revenue, expenditure and balance. IMF remains primary for macro/fiscal projection and cross-country methodology; Statskontoret is the Swedish budget-execution layer.

Evidence standard: cite Statskontoret official-statistics publication year and table label.

## 4 · Annual budget outturn summary (income vs. expenditure)

Use `summarizeBudgetOutturn` to aggregate individual `StatskontoretBudgetRow` records from `arsutfall` or `manadsutfall` into per-year, per-documentType totals. This is the standard pattern for producing summary tables in articles and committee-report context.

```ts
import { parseBudgetRows, summarizeBudgetOutturn } from '../scripts/statskontoret-client.js';

const rows = parseBudgetRows(records, { documentType: 'Inkomst' });
const summary = summarizeBudgetOutturn(rows);
// summary[0] → { year: 2024, documentType: 'Inkomst', totalOutturn: 700000, totalBudget: 670000, variance: 30000, rowCount: 2 }
```

`variance` = `totalOutturn − totalBudget` (positive = revenue above plan; negative = expenditure below appropriation or income undershot). Omitted when any source row had no budget figure.

Evidence standard: cite Statskontoret source URL, year, document type, outturn and variance; note preliminary vs. definitive `status`.

## 5 · High-frequency monitoring with månadsutfall

Use `manadsutfall` to monitor budget execution monthly for specific agencies or income categories.  Combine with IMF SDMX monthly fiscal data (`sdmxcentral.imf.org`) for cross-validation.

Evidence standard: cite Statskontoret månadsutfall URL, year/month, agency name and outturn amount.

