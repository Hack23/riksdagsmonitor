/**
 * @module Types/Article
 * @description Core article and content generation types.
 */

import type { Language } from './language.js';
import type { MultiDimensionalQualityAssessment } from '../ai-analysis/quality-assessor.js';

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
  | 'interpellations'
  | 'breaking'
  | 'deep-inspection';

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

// ---------------------------------------------------------------------------
// Extensible template sections
// ---------------------------------------------------------------------------

/**
 * A pluggable HTML section inserted into the article body.
 *
 * New content types (risk indicators, trend charts, pull quotes, etc.) can be
 * added without modifying the core template — just append a `TemplateSection`
 * to the `sections` array in `ArticleData`.
 */
export interface TemplateSection {
  /** Unique identifier used as the HTML element `id`. */
  id: string;
  /**
   * Pre-rendered HTML string for this section.
   * Must be safe to embed directly (callers are responsible for escaping).
   */
  html: string;
  /**
   * Optional CSS class name(s) added to the wrapper `<div>`.
   * Defaults to `'article-section'` when omitted.
   */
  className?: string;
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
  /**
   * Optional extensible sections appended after the main article content.
   * Each entry is rendered as an isolated `<div>` block, allowing new content
   * types to be injected without changing the template core.
   */
  sections?: TemplateSection[];
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

// ---------------------------------------------------------------------------
// Multi-dimensional quality assessment types — single source of truth in
// scripts/ai-analysis/quality-assessor.ts, re-exported here for convenience.
// ---------------------------------------------------------------------------

export type {
  DimensionScore,
  QualityIssueSeverity,
  QualityIssue,
  MultiDimensionalQualityAssessment,
} from '../ai-analysis/quality-assessor.js';

/** Quality metrics for a single generated article */
export interface ArticleQualityScore {
  /** Filename of the article (e.g. "2026-02-23-motions-en.html") */
  filename: string;
  /** Language code of the article */
  lang: string;
  /** Article type (e.g. "motions") */
  articleType: string;
  /** Approximate word count based on text content after stripping HTML tags */
  wordCount: number;
  /** Number of "Unknown (Unknown)" occurrences */
  unknownAuthors: number;
  /** Number of data-translate="true" spans (should be 0 for non-Swedish) */
  untranslatedSpans: number;
  /** Number of analytical <h2> sections found */
  analyticalSections: number;
  /** Final 0–100 quality score */
  score: number;
  /** Whether the article passed the quality threshold */
  passed: boolean;
  /** Optional multi-dimensional quality assessment (populated by quality-assessor) */
  multidimensional?: MultiDimensionalQualityAssessment;
}

/** Aggregate statistics for a full news generation run */
export interface GenerationStats {
  generated: number;
  errors: number;
  articles: string[];
  timestamp: string;
  /** Per-article quality scores collected during the run */
  qualityScores: ArticleQualityScore[];
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

// ---------------------------------------------------------------------------
// SWOT analysis types
// ---------------------------------------------------------------------------

/** Impact level for a SWOT entry */
export type SwotImpact = 'high' | 'medium' | 'low';

/** A single item in one of the four SWOT quadrants */
export interface SwotEntry {
  /** Description text for this factor */
  text: string;
  /** Relative impact or significance */
  impact?: SwotImpact;
}

/** Data for generating an embeddable SWOT analysis section */
export interface SwotData {
  /** Internal factors: capabilities and advantages */
  strengths: SwotEntry[];
  /** Internal factors: limitations and gaps */
  weaknesses: SwotEntry[];
  /** External factors: favourable conditions */
  opportunities: SwotEntry[];
  /** External factors: risks and challenges */
  threats: SwotEntry[];
  /** Subject being analysed (party, policy, institution, …) */
  subject?: string;
  /** Additional contextual note rendered below the matrix */
  context?: string;
}

// ---------------------------------------------------------------------------
// Dashboard / chart types for article embedding
// ---------------------------------------------------------------------------

/** Chart type supported by Chart.js */
export type DashboardChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'scatter';

/** A point object for scatter charts */
export interface DashboardPoint {
  x: number;
  y: number;
}

/** A single dataset within a chart */
export interface DashboardDataset {
  label: string;
  /** Numeric values for bar/line/pie/etc., or {x,y} points for scatter */
  data: number[] | DashboardPoint[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

/** Annotation overlay for a Chart.js chart */
export interface DashboardAnnotation {
  type: 'line' | 'label';
  /** Value on the scale where the annotation is placed (required) */
  value: number;
  label?: string;
  borderColor?: string;
  backgroundColor?: string;
}

/** Configuration for a single chart in the dashboard */
export interface DashboardChartConfig {
  /** Unique id used as the canvas element id */
  id: string;
  /** Chart.js chart type */
  type: DashboardChartType;
  /** Chart title rendered above the canvas */
  title: string;
  /** Category labels (x-axis for bar/line), optional for scatter charts */
  labels?: string[];
  /** One or more data series */
  datasets: DashboardDataset[];
  /** Optional annotation overlays (chartjs-plugin-annotation) */
  annotations?: DashboardAnnotation[];
}

/** A simple data table rendered alongside charts */
export interface DashboardTableConfig {
  /** Optional caption/title for the table */
  caption?: string;
  headers: string[];
  rows: string[][];
}

/** Data for generating an embeddable dashboard section */
export interface DashboardData {
  /** Dashboard section title */
  title: string;
  /** One or more Chart.js chart configurations */
  charts: DashboardChartConfig[];
  /** Optional data tables */
  tables?: DashboardTableConfig[];
  /** Optional narrative summary displayed above the charts */
  summary?: string;
}
