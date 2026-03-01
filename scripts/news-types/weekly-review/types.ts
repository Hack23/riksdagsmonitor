/**
 * @module news-types/weekly-review/types
 * @description Exported interfaces and constants for weekly-review article generation.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { CoalitionRiskIndex, AnomalyFlag, TrendComparison } from '../../data-transformers/risk-analysis.js';
import type { Language } from '../../types/language.js';

export type { CoalitionRiskIndex, AnomalyFlag, TrendComparison };

/**
 * Required MCP tools for weekly-review articles
 */
export const REQUIRED_TOOLS: readonly string[] = [
  'search_dokument',
  'get_dokument_innehall',
  'search_anforanden',
  'get_betankanden',
  'get_propositioner',
  'get_motioner',
  'search_voteringar',
];

export interface TitleSet {
  title: string;
  subtitle: string;
}

export interface WeeklyReviewValidationResult {
  hasWeeklySummary: boolean;
  hasMinimumSources: boolean;
  hasRetrospectiveTone: boolean;
  hasKeyOutcomes: boolean;
  passed: boolean;
}

export interface ArticleInput {
  content?: string;
  sources?: string[];
  [key: string]: unknown;
}

export interface GenerationOptions {
  languages?: Language[];
  lookbackDays?: number;
  writeArticle?: ((html: string, filename: string) => Promise<void | boolean>) | null;
}

/** Shape of a single voting record returned by search_voteringar */
export interface VotingRecord {
  parti?: string;
  /** Ja | Nej | Avstår | Frånvarande */
  rost?: string;
  bet?: string;
  punkt?: string;
  /** ISO date string (YYYY-MM-DD) used for post-query date filtering */
  datum?: string;
  [key: string]: unknown;
}

/** Coalition stress analysis result derived from voting records */
export interface CoalitionStressResult {
  /** Number of vote points where the government bloc position (Ja/Nej) matched the chamber majority */
  governmentWins: number;
  /** Number of vote points where the government bloc position did not match the chamber majority */
  governmentLosses: number;
  /** Vote points where opposition parties voted with the government */
  crossPartyVotes: number;
  /** Vote points with internal government-bloc defections */
  defections: number;
  /** Composite risk index from risk-analysis.ts */
  riskIndex: CoalitionRiskIndex;
  /** Detected anomaly flags from risk-analysis.ts */
  anomalies: AnomalyFlag[];
  /** Total distinct vote-points analysed */
  totalVotes: number;
}

/** Weekly activity metrics — current-week counts with CIA coalition-stability trend direction (not a prior-week comparison) */
export interface WeeklyActivityMetrics {
  currentDocuments: number;
  currentSpeeches: number;
  currentVotes: number;
  trendComparison: TrendComparison;
  activityChange: 'increasing' | 'stable' | 'declining';
}
