/**
 * @module scripts/statskontoret/types
 * @description Shared type/interface declarations for the Statskontoret client.
 *
 * Pure type-level surface — no runtime behaviour, no imports beyond the
 * standard library so any submodule can depend on this without cycles.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export type StatskontoretSourceKey =
  | 'myndighetsforteckning'
  | 'budget-time-series'
  | 'arsutfall'
  | 'manadsutfall';

export type StatskontoretResourceType =
  | 'excel'
  | 'csv-zip'
  | 'zip'
  | 'document'
  | 'unknown';

export interface StatskontoretSourceDefinition {
  readonly key: StatskontoretSourceKey;
  readonly title: string;
  readonly url: string;
  readonly cadence: string;
  readonly coverage: string;
  readonly primaryUse: string;
}

export interface StatskontoretDownloadLink {
  readonly source: StatskontoretSourceKey;
  readonly sourcePage: string;
  readonly href: string;
  readonly url: string;
  readonly text: string;
  readonly resourceType: StatskontoretResourceType;
  readonly documentType?: string;
  readonly fileType?: string;
  readonly fileName?: string;
  readonly year?: number;
  readonly month?: number;
  readonly status?: string;
  readonly updatedAt?: string;
}

export interface StatskontoretClientConfig {
  readonly baseURL?: string;
  readonly timeout?: number;
  readonly fetchFn?: typeof fetch;
}

export interface StatskontoretWorkbook {
  readonly sheets: readonly StatskontoretSheet[];
}

export interface StatskontoretSheet {
  readonly name: string;
  readonly rows: readonly (readonly string[])[];
}

export interface StatskontoretHeadcountRow {
  readonly year: number;
  readonly department: string;
  readonly headcount: number;
  readonly authorityCount: number;
}

export interface StatskontoretHeadcountOptions {
  readonly sheetNamePattern?: RegExp;
  readonly fallbackYear?: number;
}

/**
 * A single budget-outturn row derived from an årsutfall, månadsutfall or
 * budget-time-series workbook.  Amounts are in MSEK (millions of Swedish
 * kronor) as published by Statskontoret.
 */
export interface StatskontoretBudgetRow {
  readonly year: number;
  /** Present only for månadsutfall (1–12). */
  readonly month?: number;
  /** 'Inkomst' | 'Utgift' or the raw documentType string from the download. */
  readonly documentType: string;
  /** Human-readable title: income title name or appropriation/expenditure-area name. */
  readonly title: string;
  /** Numeric code of the income title or appropriation, when present. */
  readonly code?: string;
  /** Outturn amount in MSEK. */
  readonly outturn: number;
  /** Budget amount in MSEK; may be absent in older series. */
  readonly budget?: number;
  /** Agency or authority name, when present (finest granularity). */
  readonly agency?: string;
  /** Preliminary / definitive / forecast status label. */
  readonly status?: string;
}

export interface StatskontoretBudgetOptions {
  /** Override the documentType label (e.g. when fetching a single-type workbook). */
  readonly documentType?: string;
  /** Hint for the year when the workbook has no year column (e.g. a single-year file). */
  readonly fallbackYear?: number;
  /** Hint for the month when the workbook has no month column. */
  readonly fallbackMonth?: number;
}

/**
 * Aggregated totals derived from one or more `StatskontoretBudgetRow` rows.
 *
 * `totalOutturn` and `totalBudget` are the sums of the individual row amounts
 * (in MSEK) within the selected grouping.  `variance` is `totalOutturn -
 * totalBudget`; it is `undefined` when any contributing row had no budget
 * figure.  `rowCount` records how many source rows were included.
 */
export interface StatskontoretBudgetSummary {
  readonly year: number;
  readonly documentType: string;
  readonly totalOutturn: number;
  readonly totalBudget?: number;
  readonly variance?: number;
  readonly rowCount: number;
}
