/**
 * @module ai-analysis/types
 * @description TypeScript interfaces for the AI-first analysis pipeline.
 *
 * The AI analysis pipeline produces structured intelligence assessments from
 * parliamentary documents through multiple refinement iterations:
 *   1. Initial analysis — document classification, entity extraction, domain detection
 *   2. Refinement     — SWOT enrichment using full-text content from enriched documents
 *   3. Validation     — stakeholder completeness and confidence scoring (deep mode only)
 *
 * Templates in `generators.ts` consume `AnalysisResult` to render HTML sections;
 * analytical text originates from the analysis pipeline with placeholder fallbacks
 * when document evidence is missing for a stakeholder × quadrant combination.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';
import type { RawDocument } from '../data-transformers/types.js';

// ---------------------------------------------------------------------------
// Analysis depth
// ---------------------------------------------------------------------------

/**
 * Controls how many AI analysis iterations run.
 *
 * - `quick`    — 1 pass: initial document analysis only (fast, for breaking/time-sensitive)
 * - `standard` — 2 passes: initial analysis + SWOT refinement (default for most article types)
 * - `deep`     — 3 passes: initial + refinement + stakeholder validation (deep-inspection)
 */
export type AnalysisDepth = 'quick' | 'standard' | 'deep';

// ---------------------------------------------------------------------------
// Core analysis data structures
// ---------------------------------------------------------------------------

/**
 * A single SWOT entry backed by evidence extracted from actual document content.
 * Impact and confidence are derived analytically, not from hardcoded defaults.
 */
export interface AnalysisSwotEntry {
  /** The analytical claim derived from document content. */
  text: string;
  /** Evidence rating for this entry. */
  impact: 'high' | 'medium' | 'low';
  /**
   * Source document identifiers that back this entry.
   * Empty when the entry is a structural placeholder.
   */
  sourceDocIds: string[];
  /**
   * Confidence rating for this entry: proportion of supporting evidence
   * relative to total documents in the set.
   */
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * A SWOT matrix for a single stakeholder perspective.
 * All text fields are AI-derived from document content analysis.
 */
export interface AnalysisStakeholderSwot {
  /** Localised stakeholder name (Government, Parliament, Private Sector, etc.) */
  name: string;
  /** Internal role key for cross-language consistency */
  role: 'government' | 'parliament' | 'private-sector' | string;
  swot: {
    strengths: AnalysisSwotEntry[];
    weaknesses: AnalysisSwotEntry[];
    opportunities: AnalysisSwotEntry[];
    threats: AnalysisSwotEntry[];
  };
}

/**
 * A single watch point derived from document analysis.
 * Replaces hardcoded watch-point templates.
 *
 * All string fields (`title`, `description`) contain **plain text** — HTML
 * escaping is performed by the downstream renderer (`generateWatchSection`)
 * at interpolation time, consistent with the escaping contract for all other
 * pipeline outputs (SWOT entries, mindmap items, dashboard labels).
 */
export interface AnalysisWatchPoint {
  /** Plain-text watch point heading (escaped by renderer) */
  title: string;
  /** Plain-text watch point body (escaped by renderer) */
  description: string;
  /** Urgency level for display sorting */
  urgency: 'critical' | 'high' | 'medium' | 'low';
  /** Document IDs that triggered this watch point */
  sourceDocIds: string[];
}

/**
 * A branch in the conceptual mindmap derived from document analysis.
 */
export interface AnalysisMindmapBranch {
  label: string;
  color: 'cyan' | 'green' | 'yellow' | 'purple' | 'orange' | 'magenta';
  icon: string;
  items: string[];
}

/**
 * Policy domain assessment derived from document analysis.
 */
export interface PolicyAssessment {
  /** Detected policy domains (localised) */
  domains: string[];
  /** Primary domain focus */
  primaryDomain: string | null;
  /**
   * Brief narrative assessment of the policy landscape.
   * Derived from document content, not templates.
   */
  narrative: string;
  /** Overall confidence in the assessment */
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Structured dashboard data derived from document analysis.
 */
export interface DashboardData {
  /** Title for the dashboard section */
  title: string;
  /** Summary text */
  summary: string;
  /** Chart label-value pairs for document type distribution */
  typeDistribution: Array<{ label: string; value: number; color: string }>;
}

// ---------------------------------------------------------------------------
// Analysis result
// ---------------------------------------------------------------------------

/**
 * The complete output of the AI analysis pipeline for a given document set.
 * This is the single source of truth for all analytical content in the article.
 */
export interface AnalysisResult {
  /** Stakeholder SWOT analyses — all text derived from document content */
  stakeholderSwot: AnalysisStakeholderSwot[];
  /** Policy domain assessment */
  policyAssessment: PolicyAssessment;
  /** Mindmap branches derived from analysis */
  mindmapBranches: AnalysisMindmapBranch[];
  /** Dashboard data for visualisation */
  dashboardData: DashboardData;
  /** Watch points for the article sidebar */
  watchPoints: AnalysisWatchPoint[];
  /**
   * Overall confidence score (0-100) for the analysis.
   * Higher values indicate more enriched documents and stronger evidence.
   */
  confidenceScore: number;
  /** Number of analysis iterations completed */
  iterationsCompleted: number;
  /** ISO timestamp of when analysis was completed */
  completedAt: string;
  /** Language of the analysis */
  lang: Language;
  /** Number of documents analysed */
  documentCount: number;
  /** Number of metadata-enriched documents (contentFetched = true).
   *  This counts documents whose metadata was fetched via enrichDocumentsWithContent(),
   *  regardless of whether full text is available. */
  enrichedCount: number;
  /** Focus topic (null if multi-document analysis without topic) */
  focusTopic: string | null;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Result of validating an analysis for completeness and depth.
 */
export interface ValidationResult {
  /** Whether the analysis meets the minimum quality threshold */
  passed: boolean;
  /** Quality score (0-100) */
  score: number;
  /** Specific issues found during validation */
  issues: string[];
  /** Suggested improvements (informational, not blocking) */
  suggestions: string[];
}

// ---------------------------------------------------------------------------
// Pipeline interface
// ---------------------------------------------------------------------------

/**
 * Options controlling the analysis pipeline execution.
 */
export interface AnalysisPipelineOptions {
  /** How many AI iterations to run (default: 'standard') */
  depth: AnalysisDepth;
  /** Language for localised analysis output */
  lang: Language;
  /** Optional focus topic — analysis is exclusively scoped to this topic when provided */
  focusTopic: string | null;
}

/**
 * The AI analysis pipeline contract.
 *
 * Lifecycle for a `deep` analysis:
 *   1. `analyzeDocuments` — iteration 1: initial extraction from document metadata + content
 *   2. `refineAnalysis`   — iteration 2: enrich SWOT entries using full document text
 *   3. `validateCompleteness` — iteration 3: check stakeholder coverage and confidence
 *
 * For `standard` depth, only iterations 1-2 run.
 * For `quick` depth, only iteration 1 runs.
 */
export interface AnalysisPipeline {
  /**
   * Iteration 1: Analyse documents and produce an initial AnalysisResult.
   * Extracts document types, detected policy domains, entities, and
   * assembles initial SWOT entries from document titles and available metadata.
   */
  analyzeDocuments(
    docs: RawDocument[],
    options: AnalysisPipelineOptions,
  ): Promise<AnalysisResult>;

  /**
   * Iteration 2: Refine the initial analysis using full document text.
   * Replaces generic SWOT entries with content-derived insights when
   * enriched document text is available. Adds additional watch points
   * and strengthens confidence scores.
   *
   * When no documents are enriched, the analysis content (SWOT, watch
   * points, etc.) remains unchanged but metadata fields
   * (`iterationsCompleted`, `completedAt`) are always updated.
   */
  refineAnalysis(
    initial: AnalysisResult,
    docs: RawDocument[],
    options: AnalysisPipelineOptions,
  ): Promise<AnalysisResult>;

  /**
   * Iteration 3: Validate completeness of the analysis.
   * Checks that all three stakeholder perspectives have substantive entries,
   * that policy domains are correctly identified, and that confidence
   * thresholds are met.
   *
   * Returns a ValidationResult with a score and improvement suggestions.
   * Does not modify the AnalysisResult — call `refineAnalysis` again if
   * the score is below threshold.
   */
  validateCompleteness(
    analysis: AnalysisResult,
    docs: RawDocument[],
  ): Promise<ValidationResult>;
}

// ---------------------------------------------------------------------------
// Iteration metadata (written to news/metadata/ for audit trail)
// ---------------------------------------------------------------------------

/**
 * Metadata record written after each analysis run for audit and debugging.
 * Stored as `news/metadata/ai-analysis-<slug>-<lang>.json`.
 */
export interface AnalysisIterationMetadata {
  /** Article slug this analysis was produced for */
  articleSlug: string;
  /** Language of the analysis */
  lang: Language;
  /** Analysis depth used */
  depth: AnalysisDepth;
  /** Number of iterations completed */
  iterationsCompleted: number;
  /** Per-iteration duration in milliseconds */
  iterationDurationsMs: number[];
  /** Final confidence score */
  confidenceScore: number;
  /** Validation result (null when depth < 'deep') */
  validationResult: ValidationResult | null;
  /** Number of documents analysed */
  documentCount: number;
  /** Number of metadata-enriched documents (contentFetched = true) */
  enrichedCount: number;
  /** Focus topic (null if none) */
  focusTopic: string | null;
  /** ISO timestamp when analysis completed */
  completedAt: string;
}
