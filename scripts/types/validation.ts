/**
 * @module Types/Validation
 * @description Validation result types for article quality and cross-reference checks.
 */

import type { ArticleType } from './article.js';

// ---------------------------------------------------------------------------
// Evening analysis validation
// ---------------------------------------------------------------------------

/** Word-count breakdown for each editorial pillar section */
export interface SectionWordCounts {
  leadParagraph: number;
  parliamentaryPulse: number;
  governmentWatch: number;
  oppositionDynamics: number;
  lookingAhead: number;
}

/** Structural completeness result for an evening analysis article */
export interface StructureValidation {
  hasLeadParagraph: boolean;
  hasParliamentaryPulse: boolean;
  hasGovernmentWatch: boolean;
  hasOppositionDynamics: boolean;
  hasLookingAhead: boolean;
  wordCounts: SectionWordCounts;
  meetsMinimumLength: boolean;
  hasAllPillars: boolean;
}

/** Source attribution validation result */
export interface SourceValidation {
  count: number;
  sources: string[];
  hasSources: boolean;
}

/** Full validation result for an evening analysis article */
export interface EveningAnalysisValidation {
  filepath: string;
  filename: string;
  structure: StructureValidation;
  analyticalDepth: number;
  historicalContext: number;
  internationalComparison: boolean;
  forwardLooking: boolean;
  partyPerspectives: number;
  sources: SourceValidation;
  totalWordCount: number;
  qualityScore: number;
}

// ---------------------------------------------------------------------------
// Article quality enhancer
// ---------------------------------------------------------------------------

/** Configurable quality thresholds for editorial standards */
export interface QualityThresholds {
  minQualityScore: number;
  minAnalyticalDepth: number;
  minPartySources: number;
  minCrossReferences: number;
  requireWhyThisMatters: boolean;
  requireHistoricalContext: boolean;
  recommendHistoricalContext: boolean;
  recommendInternationalComparison: boolean;
  /** Recommend economic context from World Bank data (non-blocking) */
  recommendEconomicContext?: boolean;
}

/** Measured quality metrics for a single article */
export interface QualityMetrics {
  analyticalDepth: number;
  partyCount: number;
  crossReferences: number;
  hasWhyThisMatters: boolean;
  hasHistoricalContext: boolean;
  hasInternationalComparison: boolean;
  /** Whether the article contains economic context (World Bank indicators, GDP, unemployment, etc.) */
  hasEconomicContext?: boolean;
}

/** Quality assessment result for a single article */
export interface QualityResult {
  passed: boolean;
  articlePath: string;
  error?: string;
  qualityScore?: number;
  metrics?: QualityMetrics;
  issues?: string[];
  warnings?: string[];
  thresholds?: QualityThresholds;
}

// ---------------------------------------------------------------------------
// Cross-reference validation
// ---------------------------------------------------------------------------

/** Validation result for a single article's MCP source coverage */
export interface CrossRefValidationResult {
  articleType: string;
  requiredTools: string[];
  usedTools: string[];
  missingTools: string[];
  extraTools: string[];
  crossReferencesInText: string[];
  sourceCount: number;
  hasMinimumSources: boolean;
  allRequiredToolsUsed: boolean;
  hasCrossReferencesInText: boolean;
  passed: boolean;
  score: number;
}

/** Single article item submitted for batch validation */
export interface ArticleBatchItem {
  type: string;
  content: string;
  mcpCalls: ReadonlyArray<{ readonly tool: string }>;
}

/** Aggregated results from a batch of article validations */
export interface BatchValidationResult {
  total: number;
  passed: number;
  failed: number;
  avgScore: number;
  passRate: number;
  details: CrossRefValidationResult[];
}

/** CI-friendly summary exported from batch validation */
export interface CISummary {
  status: 'success' | 'failure';
  total: number;
  passed: number;
  failed: number;
  passRate: string;
  avgScore: string;
  timestamp: string;
}

/** Map from article type to required MCP tool names */
export type RequiredToolsMap = Record<ArticleType | string, readonly string[]>;
