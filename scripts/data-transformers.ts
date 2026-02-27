/**
 * @module data-transformers
 * @description Barrel re-export for backward compatibility.
 *
 * This file was previously a 3400+ line monolith. It has been decomposed
 * into focused, bounded-context modules under `./data-transformers/`:
 *
 * | Module               | Responsibility                              | Lines |
 * |----------------------|---------------------------------------------|-------|
 * | types.ts             | Shared interfaces (RawDocument, CIAContext…) |  ~90  |
 * | constants.ts         | CONTENT_LABELS, COMMITTEE_NAMES, LOCALE_MAP  | ~1100 |
 * | helpers.ts           | Utility fns (sanitizeUrl, L, date fmt, …)    |  ~360 |
 * | calendar.ts          | Calendar grid + watch-point extraction        |  ~150 |
 * | content-generators.ts| Per-article-type HTML generators              |  ~670 |
 * | policy-analysis.ts   | Policy domain detection & deep analysis       |  ~340 |
 * | document-analysis.ts | Motion grouping, opposition strategy, intel   |  ~260 |
 * | metadata.ts          | SEO, read-time, content-title, sources        |  ~340 |
 * | index.ts             | Public API barrel                             |  ~100 |
 *
 * All public exports are preserved — existing consumers require no changes.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
export {
  // Types
  type RawCalendarEvent,
  type RawDocument,
  type CIAContext,
  type WeekAheadData,
  type ArticleContentData,
  type MonthlyMetrics,

  // Constants
  CONTENT_LABELS,

  // Helpers
  L,
  isPersonProfileText,

  // Calendar
  transformCalendarToEventGrid,
  extractTopics,
  extractWatchPoints,

  // Document analysis
  groupMotionsByProposition,
  groupPropositionsByCommittee,

  // Content generation
  generateArticleContent,

  // Metadata
  generateMetadata,
  calculateReadTime,
  generateContentTitle,
  generateSources,
} from './data-transformers/index.js';
