/**
 * @module download-parliamentary-data/cli
 * @description Aggregated re-export hub for the data-download pipeline
 * sub-modules. Keep this file import-safe — NO top-level side effects.
 * Entry-point invocation lives in `scripts/download-parliamentary-data.ts`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export { parseArgs, resolveAutoFullTextTopN } from './args.js';
export type { ParsedArgs } from './args.js';

export {
  buildDocumentCoverageSummary,
  escapeMarkdownCell,
  extractDokId,
  formatTimestampForMarkdown,
  serializeDataManifest,
} from './manifest.js';
export type { DocumentCoverageRow } from './manifest.js';

export {
  buildWeeklySummaryMarkdown,
  runWeeklyAggregation,
} from './weekly-aggregation.js';

export {
  isoWeekNumber,
  parseAndValidateIsoDate,
  parseIsoWeekLabel,
  riksMoteFromDate,
  isDateInIsoWeek,
} from './rm-helpers.js';

export { runPreArticleAnalysis } from './pre-article-analysis.js';
export type { RunPreArticleAnalysisOptions } from './pre-article-analysis.js';
