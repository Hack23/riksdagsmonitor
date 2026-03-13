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
  /** Organ/committee identifier returned by the MCP calendar API (e.g. 'Kammaren', 'FiU') */
  organ?: string;
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
  dok_url?: string;
  summary?: string;
  notis?: string;
  intressent_namn?: string;
  author?: string;
  parti?: string;
  /** Target minister for interpellations (mottagare field from API) */
  mottagare?: string;
  /** intressent_id — parliamentary member ID who authored the document */
  intressent_id?: string;
  /** Publication date from the MCP API (ISO format YYYY-MM-DD) */
  datum?: string;
  /** Riksmöte (parliamentary session, e.g. "2025/26") */
  rm?: string;
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
  /** CIA intelligence context for enriched analysis */
  ciaContext?: CIAContext;
}

/**
 * Monthly metrics for trend analysis, party rankings, and legislative efficiency.
 * Computed in monthly-review.ts and consumed by generateMonthlyReviewContent.
 *
 * NOTE: Document count fields may be based on limited/sampled search results
 * (e.g., when upstream `search_dokument` calls use a hard result limit) and
 * are therefore not guaranteed to be exact global totals for the period.
 */
export interface MonthlyMetrics {
  /**
   * Sampled document count for this month.
   * Derived from the number of documents returned by upstream search and may
   * be capped by search limits rather than representing an exact total.
   */
  totalDocuments: number;
  /** Number of committee reports (betänkanden) in the sampled set */
  reportCount: number;
  /** Number of government propositions in the sampled set */
  propositionCount: number;
  /** Number of parliamentary motions in the sampled set */
  motionCount: number;
  /** Number of speeches (anföranden) in the sampled set */
  speechCount: number;
  /**
   * Previous month's sampled document count (for trend).
   * Subject to the same upstream search limits as totalDocuments.
   */
  previousMonthDocCount: number;
  /**
   * Sampled document count from two months ago (for rolling average).
   * Subject to the same upstream search limits as totalDocuments.
   */
  twoMonthsAgoDocCount: number;
  /** Party activity rankings sorted by total activity (motions + speeches) */
  partyRankings: Array<{ party: string; motionCount: number; speechCount: number }>;
  /**
   * Legislative efficiency rate: committee reports divided by propositions.
   * This is a non-negative ratio (reportCount / propositionCount) and may exceed 1
   * when there are more reports than propositions in the same period.
   */
  legislativeEfficiencyRate: number;
}

/** Article generation data */
export interface ArticleContentData {
  events?: RawCalendarEvent[];
  reports?: RawDocument[];
  propositions?: RawDocument[];
  motions?: RawDocument[];
  /** Parliamentary interpellations (interpellationer) — used by interpellations article type */
  interpellations?: RawDocument[];
  documents?: RawDocument[];
  highlights?: Array<{ title: string; description: string }>;
  context?: string;
  /** CIA intelligence context for enriched analysis */
  ciaContext?: CIAContext;
  /** Monthly metrics for trend analysis (monthly-review specific) */
  monthlyMetrics?: MonthlyMetrics;
  /** Voting records for cross-referencing committee decisions */
  votes?: unknown[];
  /** Parliamentary speeches for committee debate context */
  speeches?: unknown[];
  /** Government department analysis from analyze_g0v_by_department */
  govDeptData?: Record<string, unknown>[];
  /** Full-text search results for policy substance extraction */
  fullTextResults?: unknown[];
  /** Government department analysis from analyze_g0v_by_department */
  departmentAnalysis?: Record<string, unknown>;
  /** Parliamentary debate speeches from search_anforanden */
  speechDebates?: unknown[];
  /** SCB statistical context for economic/demographic enrichment */
  scbContext?: SCBContext;
  /** Statistical claims detected for fact-checking against World Bank / SCB data */
  statisticalClaims?: Array<{
    sourceText: string;
    topic: string;
    claimedValue?: number;
    speaker?: string;
    party?: string;
    verificationSource: 'world-bank' | 'scb' | 'both';
  }>;
}

// ---------------------------------------------------------------------------
// SCB (Statistics Sweden) data types for statistical enrichment
// ---------------------------------------------------------------------------

/**
 * SCB statistical context for enriching political analysis with
 * official Swedish statistics from Statistics Sweden (SCB).
 * Data sourced via the scb-mcp server (PxWebAPI 2.0).
 */
export interface SCBContext {
  /** Fiscal policy — government revenue / expenditure (domain: fiscal) */
  publicFinances?: SCBIndicator;
  /** Defence spending as % of GDP (domain: defence) */
  defence?: SCBIndicator;
  /** Greenhouse gas emissions, renewable energy (domain: environment) */
  emissions?: SCBIndicator;
  /** Student enrollment, graduation rates (domain: education) */
  education?: SCBIndicator;
  /** Healthcare expenditure, hospital capacity (domain: healthcare) */
  healthcare?: SCBIndicator;
  /** Immigration / emigration data (domain: migration) */
  migration?: SCBIndicator;
  /** Export/import value, trade balance (domain: eu-foreign) */
  euForeign?: SCBIndicator;
  /** Reported crimes, conviction rate (domain: justice) */
  crime?: SCBIndicator;
  /** Unemployment rate, employment rate (domain: labour) */
  unemployment?: SCBIndicator;
  /** Housing starts, price index (domain: housing) */
  housing?: SCBIndicator;
  /** Road traffic volume, public transport (domain: transport) */
  transport?: SCBIndicator;
  /** GDP growth, industrial production (domain: trade) */
  gdpGrowth?: SCBIndicator;
  /** Inflation / CPI data (cross-domain, relevant to fiscal/trade) */
  inflation?: SCBIndicator;
  /** Population statistics (cross-domain, relevant to migration/education) */
  population?: SCBIndicator;
}

/** Single SCB statistical indicator with value, period, and source table */
export interface SCBIndicator {
  /** Human-readable label (e.g. "Unemployment rate") */
  label: string;
  /** Numeric value */
  value: number;
  /** Unit of measurement (e.g. "percent", "SEK millions", "persons") */
  unit: string;
  /** Time period (e.g. "2025Q3", "2025M11", "2024") */
  period: string;
  /** SCB table ID for traceability (e.g. "TAB637") */
  tableId: string;
  /** Optional trend compared to previous period */
  trend?: 'up' | 'down' | 'stable';
  /** Optional previous period value for comparison */
  previousValue?: number;
}
