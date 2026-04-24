/**
 * @module data-transformers
 * @description Public API barrel for the shared data-transformer types
 * and helpers used by the parliamentary data pipeline and analysis
 * scripts. The legacy content/metadata/calendar HTML generators have
 * been removed — article bodies now come from the markdown aggregate +
 * render pipeline (`scripts/aggregate-analysis.ts` +
 * `scripts/render-articles.ts`).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
export {
  type RawCalendarEvent,
  type RawDocument,
  type CIAContext,
  type WeekAheadData,
  type ArticleContentData,
  type MonthlyMetrics,

  L,
  isPersonProfileText,
  formatDocumentDate,
  filterFreshDocuments,
} from './data-transformers/index.js';
