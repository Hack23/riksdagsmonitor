/**
 * @module scripts/statskontoret-client
 * @description Thin re-export shim for the bounded-context Statskontoret client.
 *
 * The implementation was split into `scripts/statskontoret/` in the 2026-05
 * refactor (Hack23/riksdagsmonitor#2581). This shim preserves the stable
 * public surface so callers (`statskontoret-fetch`, `fetch-statskontoret`,
 * and the test suite) keep working unchanged. Add new symbols to the
 * relevant submodule, not here.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export { StatskontoretClient } from './statskontoret/client.js';
export { StatskontoretError } from './statskontoret/errors.js';
export {
  STATSKONTORET_BASE_URL,
  STATSKONTORET_SOURCES,
  getStatskontoretSource,
} from './statskontoret/source-registry.js';
export {
  classifyStatskontoretResource,
  extractStatskontoretDownloadLinks,
} from './statskontoret/extractors/download-links.js';
export { rowsToRecords } from './statskontoret/extractors/rows-to-records.js';
export { parseStatskontoretXlsx } from './statskontoret/parsers/xlsx.js';
export { parseStatskontoretCsvZip } from './statskontoret/parsers/csv-zip.js';
export {
  aggregateHeadcountByDepartment,
  buildHeadcountTimeSeries,
} from './statskontoret/domain/headcount.js';
export {
  buildBudgetTimeSeries,
  parseBudgetRows,
  summarizeBudgetOutturn,
} from './statskontoret/domain/budget.js';
export {
  parseStatskontoretOptionalInt,
  parseStatskontoretSwedishNumber,
} from './statskontoret/internal/text.js';
export { assertStatskontoretFetchTarget } from './statskontoret/internal/url-guard.js';
export type {
  StatskontoretBudgetOptions,
  StatskontoretBudgetRow,
  StatskontoretBudgetSummary,
  StatskontoretClientConfig,
  StatskontoretDownloadLink,
  StatskontoretHeadcountOptions,
  StatskontoretHeadcountRow,
  StatskontoretResourceType,
  StatskontoretSheet,
  StatskontoretSourceDefinition,
  StatskontoretSourceKey,
  StatskontoretWorkbook,
} from './statskontoret/types.js';
