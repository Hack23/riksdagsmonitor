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
  MonthlyMetrics,
} from './types.js';

// ── Re-export constants ────────────────────────────────────────────────────
export { CONTENT_LABELS } from './constants.js';

// ── Re-export helpers ──────────────────────────────────────────────────────
export { L, isPersonProfileText, formatDocumentDate, filterFreshDocuments } from './helpers.js';

// ── Re-export calendar ─────────────────────────────────────────────────────
export { transformCalendarToEventGrid, extractTopics, extractWatchPoints } from './calendar.js';

// ── Re-export document analysis ────────────────────────────────────────────
export { groupMotionsByProposition, groupPropositionsByCommittee, calculateInfluenceScore } from './document-analysis.js';

// ── Re-export policy analysis (confidence levels & narrative framing) ──────
export type { ConfidenceLevel, NarrativeFrame } from './policy-analysis.js';
export { assessConfidenceLevel, detectNarrativeFrames } from './policy-analysis.js';

// ── Re-export risk analysis ────────────────────────────────────────────────
export type { RiskLevel, CoalitionRiskIndex, CoalitionRiskComponents, AnomalyFlag, TrendDirection, TrendDataPoint, TrendComparison } from './risk-analysis.js';
export { calculateCoalitionRiskIndex, detectAnomalousPatterns, generateTrendComparison } from './risk-analysis.js';

// ── Re-export SWOT & Dashboard section generators ─────────────────────────
export {
  generateSwotSection,
  generateDashboardSection,
  generateStakeholderSwotSection,
  generateEconomicDashboardSection,
  findIndicatorsForDomains,
  buildEconomicCharts,
  buildEconomicTables,
  scoreNewsworthiness,
  generateMindmapSection,
  generateSankeySection,
  generateCiaOverviewSection,
} from './content-generators.js';
export type {
  SwotSectionOptions,
  DashboardSectionOptions,
  StakeholderSwotSectionOptions,
  StakeholderSwot,
  EconomicDashboardOptions,
  EconomicDataPoint,
  NewsworthinessScore,
  NewsworthinessDimension,
  MindmapSectionOptions,
  MindmapBranch,
  MindmapBranchColor,
  SankeySectionOptions,
  SankeyNode,
  SankeyFlow,
  SankeyNodeColor,
  CiaOverviewSectionOptions,
} from './content-generators.js';

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
  generateMonthlyReviewContent,
  generateMonthAheadContent,
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
      return generateMonthAheadContent(data, lang);
    case 'committee-reports':
      return generateCommitteeContent(data, lang);
    case 'propositions':
      return generatePropositionsContent(data, lang);
    case 'motions':
      return generateMotionsContent(data, lang);
    case 'monthly-review':
      return generateMonthlyReviewContent(data, lang);
    case 'weekly-review':
    case 'breaking':
    default:
      return generateGenericContent(data, lang);
  }
}
