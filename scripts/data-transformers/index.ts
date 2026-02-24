/**
 * @module data-transformers
 * @description Barrel re-export preserving the original public API.
 * All consumers that previously imported from `./data-transformers.js`
 * continue to work without changes via this barrel file.
 *
 * The monolithic module has been decomposed into bounded-context modules:
 * - **types** — shared interfaces (RawCalendarEvent, RawDocument, …)
 * - **constants** — CONTENT_LABELS, COMMITTEE_NAMES, LOCALE_MAP
 * - **helpers** — utility functions (sanitizeUrl, svSpan, L, date formatting, …)
 * - **calendar** — transformCalendarToEventGrid, extractWatchPoints, extractTopics
 * - **content-generators** — per-article-type HTML generators
 * - **policy-analysis** — detectPolicyDomains, generatePolicySignificance, …
 * - **document-analysis** — groupMotionsByProposition, renderMotionEntry, …
 * - **metadata** — generateMetadata, calculateReadTime, generateContentTitle, …
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

// ── Re-export types ────────────────────────────────────────────────────────
export type {
  RawCalendarEvent,
  RawDocument,
  CIAContext,
  WeekAheadData,
  ArticleContentData,
} from './types.js';

// ── Re-export constants ────────────────────────────────────────────────────
export { CONTENT_LABELS } from './constants.js';

// ── Re-export helpers ──────────────────────────────────────────────────────
export { L, isPersonProfileText } from './helpers.js';

// ── Re-export calendar ─────────────────────────────────────────────────────
export { transformCalendarToEventGrid, extractTopics, extractWatchPoints } from './calendar.js';

// ── Re-export document analysis ────────────────────────────────────────────
export { groupMotionsByProposition, groupPropositionsByCommittee } from './document-analysis.js';

// ── Re-export metadata ─────────────────────────────────────────────────────
export {
  generateMetadata,
  calculateReadTime,
  generateContentTitle,
  generateSources,
} from './metadata.js';

// ── Re-export content generation (dispatcher) ──────────────────────────────
import type { Language } from '../types/language.js';
import type { ArticleType } from '../types/article.js';
import type { ArticleContentData, WeekAheadData } from './types.js';
import {
  generateWeekAheadContent,
  generateCommitteeContent,
  generatePropositionsContent,
  generateMotionsContent,
  generateGenericContent,
} from './content-generators.js';

/**
 * Generate article content from MCP data.
 * Dispatches to the appropriate content generator based on article type.
 *
 * @param data - Structured data from MCP API calls
 * @param type - Article type determining the rendering strategy
 * @param lang - Target language (defaults to English)
 * @returns Generated HTML content string
 */
export function generateArticleContent(
  data: ArticleContentData,
  type: ArticleType | string,
  lang: Language = 'en',
): string {
  switch (type) {
    case 'week-ahead':
      return generateWeekAheadContent(data as WeekAheadData, lang);
    case 'month-ahead':
      return generateWeekAheadContent(data as WeekAheadData, lang);
    case 'committee-reports':
      return generateCommitteeContent(data, lang);
    case 'propositions':
      return generatePropositionsContent(data, lang);
    case 'motions':
      return generateMotionsContent(data, lang);
    case 'weekly-review':
    case 'monthly-review':
    case 'breaking':
    default:
      return generateGenericContent(data, lang);
  }
}
