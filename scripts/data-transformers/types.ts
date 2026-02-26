/**
 * @module data-transformers/types
 * @description Shared data interfaces for the data transformation pipeline.
 * Defines the bounded-context types exchanged between MCP server responses
 * and article generation modules.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Raw calendar event from MCP server */
export interface RawCalendarEvent {
  datum?: string;
  from?: string;
  start?: string;
  tid?: string;
  time?: string;
  rubrik?: string;
  titel?: string;
  title?: string;
  description?: string;
  details?: string;
  dayName?: string;
}

/** Raw document from MCP server */
export interface RawDocument {
  doktyp?: string;
  organ?: string;
  committee?: string;
  titel?: string;
  rubrik?: string;
  undertitel?: string;
  title?: string;
  dokumentnamn?: string;
  dok_id?: string;
  subtyp?: string;
  subtype?: string;
  documentType?: string;
  url?: string;
  summary?: string;
  notis?: string;
  intressent_namn?: string;
  author?: string;
  parti?: string;
  /** Full document text loaded via get_dokument_innehall */
  fullText?: string;
  /** Full document HTML content from API */
  fullContent?: string;
  /** Whether this document was enriched with full content */
  contentFetched?: boolean;
  /** Related speeches mentioning this document */
  speeches?: Array<{ talare?: string; parti?: string; text?: string; anforande_nummer?: string }>;
}

/** CIA intelligence context for enriching analysis */
export interface CIAContext {
  partyPerformance: Array<{
    id: string;
    partyName: string;
    metrics: { seats: number; successRate: number; motionsSubmitted: number; motionsPassed: number; cohesionScore?: number };
    trends: { supportTrend: string; activityTrend: string };
  }>;
  coalitionStability: { stabilityScore: number; riskLevel: string; defectionProbability: number; majorityMargin: number };
  votingPatterns: { keyIssues: Array<{ topic: string; coalitionAlignment: number; oppositionAlignment: number; crossPartyVotes: number }> };
  /** Percentage of motions denied (typically 99%+) */
  overallMotionDenialRate: number;
}

/** Week ahead data structure */
export interface WeekAheadData {
  events: RawCalendarEvent[];
  highlights?: Array<{ title: string; description: string }>;
  context?: string;
  /** Upcoming legislative documents — used when calendar is empty */
  documents?: RawDocument[];
  /** Parliamentary written questions (fragor) for the coming period */
  questions?: RawDocument[];
  /** Parliamentary interpellations (interpellationer) for the coming period */
  interpellations?: RawDocument[];
}

/**
 * Monthly metrics for trend analysis, party rankings, and legislative efficiency.
 * Computed in monthly-review.ts and consumed by generateMonthlyReviewContent.
 */
export interface MonthlyMetrics {
  /** Total documents processed this month */
  totalDocuments: number;
  /** Number of committee reports (betänkanden) */
  reportCount: number;
  /** Number of government propositions */
  propositionCount: number;
  /** Number of parliamentary motions */
  motionCount: number;
  /** Number of speeches (anföranden) */
  speechCount: number;
  /** Previous month's total document count (for trend) */
  previousMonthDocCount: number;
  /** Two months ago total document count (for rolling average) */
  twoMonthsAgoDocCount: number;
  /** Party activity rankings sorted by total activity (motions + speeches) */
  partyRankings: Array<{ party: string; motionCount: number; speechCount: number }>;
  /**
   * Legislative efficiency rate: committee reports divided by propositions (0–1).
   * Higher values indicate faster committee processing.
   */
  legislativeEfficiencyRate: number;
}

/** Article generation data */
export interface ArticleContentData {
  events?: RawCalendarEvent[];
  reports?: RawDocument[];
  propositions?: RawDocument[];
  motions?: RawDocument[];
  documents?: RawDocument[];
  highlights?: Array<{ title: string; description: string }>;
  context?: string;
  /** CIA intelligence context for enriched analysis */
  ciaContext?: CIAContext;
  /** Monthly metrics for trend analysis (monthly-review specific) */
  monthlyMetrics?: MonthlyMetrics;
}
