/**
 * @module Types/Article
 * @description Core article and content generation types.
 */

import type { Language } from './language.js';

/** Category label shown in article headers */
export type ArticleCategory = 'prospective' | 'retrospective' | 'analysis' | 'breaking';

/** Internal article type identifiers for content routing */
export type ArticleType =
  | 'week-ahead'
  | 'month-ahead'
  | 'weekly-review'
  | 'monthly-review'
  | 'committee-reports'
  | 'propositions'
  | 'motions'
  | 'breaking';

/** A single calendar event in the event grid */
export interface EventGridItem {
  date: string;
  dayName: string;
  dayNumber: string;
  dayLabel: string;
  isToday: boolean;
  items: Array<{ time: string; title: string }>;
}

/** A single watch point (key development to monitor) */
export interface WatchPoint {
  title: string;
  description: string;
}

/** SEO and taxonomy metadata for an article */
export interface ArticleMetadata {
  keywords: string[];
  topics: string[];
  tags: string[];
}

/** Full data payload passed to the article HTML template */
export interface ArticleData {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  type: ArticleCategory;
  readTime?: string;
  lang?: Language;
  locale?: string;
  content: string;
  events?: EventGridItem[];
  watchPoints?: WatchPoint[];
  sources?: string[];
  keywords?: string[];
  topics?: string[];
  tags?: string[];
}

/** A single generated article (language variant) */
export interface GeneratedArticle {
  lang: Language;
  html: string;
  filename: string;
  slug: string;
}

/** Date range used for week-ahead article fetching */
export interface DateRange {
  start: string;
  end: string;
}

/** Aggregate statistics for a full news generation run */
export interface GenerationStats {
  generated: number;
  errors: number;
  articles: string[];
  timestamp: string;
  qualityScores: number[];
}

/** MCP tool call record for cross-reference validation */
export interface MCPCallRecord {
  tool: string;
  result?: unknown;
}

/** Result returned from a single article-type generation function */
export interface GenerationResult {
  success: boolean;
  files?: number;
  slug?: string;
  error?: string;
  articles?: GeneratedArticle[];
  mcpCalls?: MCPCallRecord[];
  crossReferences?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Breaking news types
// ---------------------------------------------------------------------------

/** Event data passed into the breaking news generator */
export interface BreakingEventData {
  voteId?: string;
  topic?: string;
  slug?: string;
  [key: string]: unknown;
}

/** Options for breaking news article generation */
export interface BreakingNewsOptions {
  languages?: Language[];
  eventContext?: string;
  eventData?: BreakingEventData | null;
  writeArticle?: ((html: string, filename: string) => Promise<void | boolean>) | null;
}

/** Validation result for a breaking news article */
export interface BreakingNewsValidation {
  hasBreakingEvent: boolean;
  hasMinimumSources: boolean;
  hasTimeliness: boolean;
  hasImpactAnalysis: boolean;
  passed: boolean;
}
