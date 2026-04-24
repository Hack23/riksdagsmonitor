/**
 * @module data-transformers
 * @description Minimal barrel re-export for shared data-transformer types
 * and helpers used by the parliamentary data pipeline and analysis scripts.
 *
 * The legacy HTML-scaffold article generator (content-generators, calendar
 * transformers, policy/document analysis HTML stubs, metadata/title
 * generators, text cleaners, etc.) has been removed in favour of the
 * markdown aggregate+render pipeline under
 * `scripts/aggregate-analysis.ts` + `scripts/render-articles.ts`.
 *
 * Only the small shared surface that other scripts still import survives
 * here — primarily `RawDocument` / `RawCalendarEvent` / `CIAContext`
 * types and a couple of helpers needed by the data downloader.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export type {
  RawCalendarEvent,
  RawDocument,
  CIAContext,
  WeekAheadData,
  ArticleContentData,
  MonthlyMetrics,
} from './types.js';

export { L, isPersonProfileText, formatDocumentDate, filterFreshDocuments } from './helpers.js';
