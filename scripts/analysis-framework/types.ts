/**
 * @module analysis-framework/types
 * @description Core type definitions for the multi-perspective document analysis
 * framework. Provides the bounded-context types shared across all six analysis
 * lenses, the cross-reference detector, the significance scorer, and the
 * integration adapters for SWOT, dashboard, and mindmap generators.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument } from '../data-transformers/types.js';

// ---------------------------------------------------------------------------
// Analysis Lenses
// ---------------------------------------------------------------------------

/**
 * The six analytical perspectives applied to every parliamentary document.
 * Each lens examines the document from a distinct stakeholder vantage point.
 */
export type AnalysisLens =
  | 'government'    // 🏛️ Policy execution, budget implications, coalition alignment
  | 'opposition'    // ⚖️ Scrutiny opportunities, alternative proposals, electoral positioning
  | 'citizen'       // 👥 Service delivery, rights, cost-of-living, democratic participation
  | 'economic'      // 💰 GDP/employment, business regulation, investment climate, trade
  | 'international' // 🌍 EU alignment, Nordic cooperation, treaty obligations, diplomatic signals
  | 'media';        // 📰 Newsworthiness, public sentiment, narrative framing, controversy

// ---------------------------------------------------------------------------
// Impact / Sentiment types
// ---------------------------------------------------------------------------

/** Relative magnitude of an effect on a stakeholder or dimension */
export type ImpactLevel = 'high' | 'medium' | 'low';

/** Directionality of the effect for the stakeholder represented by the lens */
export type Sentiment = 'positive' | 'neutral' | 'negative';

// ---------------------------------------------------------------------------
// SWOT contribution (feeds into SWOT/stakeholder-SWOT generators)
// ---------------------------------------------------------------------------

/** A single SWOT contribution entry sourced from a perspective analysis */
export interface SwotContribution {
  /** Which SWOT quadrant this entry belongs to */
  quadrant: 'strength' | 'weakness' | 'opportunity' | 'threat';
  /** The stakeholder for whom this quadrant entry applies */
  forStakeholder: string;
  /** Human-readable description of the SWOT point */
  text: string;
  /** Relative importance of this SWOT entry */
  impact?: ImpactLevel;
}

// ---------------------------------------------------------------------------
// Dashboard metrics (feeds into dashboard-section generator)
// ---------------------------------------------------------------------------

/** A numeric metric that can be rendered in a Chart.js dashboard */
export interface DashboardMetric {
  /** Display name for this metric */
  metricName: string;
  /** Numeric value */
  value: number;
  /** Unit label (e.g. "seats", "%", "score") */
  unit: string;
}

// ---------------------------------------------------------------------------
// Mindmap nodes (feeds into mindmap-section generator)
// ---------------------------------------------------------------------------

/** Relative conceptual weight of a mindmap node */
export type MindmapNodeWeight = 'critical' | 'significant' | 'moderate';

/** A single node contributed to the mindmap by a perspective analysis */
export interface MindmapNode {
  /** Top-level branch the node belongs to (e.g. "EU Alignment", "Budget") */
  branch: string;
  /** Node label / leaf item */
  item: string;
  /** Conceptual weight determining visual prominence */
  weight: MindmapNodeWeight;
}

// ---------------------------------------------------------------------------
// Perspective Analysis
// ---------------------------------------------------------------------------

/**
 * The result of applying a single analysis lens to a parliamentary document.
 * All text fields are in the language specified by the calling context.
 */
export interface PerspectiveAnalysis {
  /** Which analytical lens produced this result */
  lens: AnalysisLens;
  /** AI-generated 50–100 word perspective summary */
  summary: string;
  /** Magnitude of the document's impact from this perspective */
  impact: ImpactLevel;
  /** Directionality of the impact for the lens stakeholder */
  sentiment: Sentiment;
  /** Key actors relevant to this perspective */
  keyActors: string[];
  /** Related policy areas or programmes mentioned */
  relatedPolicies: string[];
  /** Contributions to the SWOT matrix for this perspective */
  swotContribution: SwotContribution[];
  /** Numeric metrics for dashboard rendering */
  dashboardMetrics: DashboardMetric[];
  /** Mindmap nodes for conceptual map rendering */
  mindmapNodes: MindmapNode[];
  /** Confidence in this perspective analysis (0–100) */
  confidence: number;
}

// ---------------------------------------------------------------------------
// Cross-document links
// ---------------------------------------------------------------------------

/** Type of relationship between two parliamentary documents */
export type DocumentLinkType =
  | 'responds-to'    // Motion responds to a proposition
  | 'amends'         // Amending legislation
  | 'implements'     // Implementation measure for a directive or commitment
  | 'contradicts'    // Conflicting policy positions
  | 'related-topic'; // Thematically related

/** A detected relationship between two documents */
export interface DocumentLink {
  /** dok_id of the source document */
  sourceId: string;
  /** dok_id of the related document */
  targetId: string;
  /** Nature of the relationship */
  type: DocumentLinkType;
  /** Human-readable explanation */
  reason: string;
  /** Confidence score for this link (0–100) */
  confidence: number;
}

// ---------------------------------------------------------------------------
// Full Document Analysis Result
// ---------------------------------------------------------------------------

/**
 * The complete multi-perspective analysis result for a single parliamentary document.
 * This is the primary output of `analyzeDocument()` in the framework orchestrator.
 */
export interface DocumentAnalysisResult {
  /** The source document */
  document: RawDocument;
  /**
   * Political significance score (1–10).
   * Drives article focus and newsworthiness prioritization.
   */
  overallSignificance: number;
  /**
   * All six perspective analyses.
   * Always contains exactly one entry per `AnalysisLens` value.
   */
  perspectives: PerspectiveAnalysis[];
  /** Cross-document relationships detected in the batch context */
  crossDocumentLinks: DocumentLink[];
  /** Top-level insights synthesised across all perspectives (3–5 items) */
  keyInsights: string[];
  /**
   * Overall confidence in the combined analysis (0–100).
   * Computed as the arithmetic mean of per-perspective confidence scores.
   */
  confidenceScore: number;
}

// ---------------------------------------------------------------------------
// Batch result
// ---------------------------------------------------------------------------

/**
 * Output of `analyzeDocuments()` when processing a batch of documents.
 */
export interface BatchAnalysisResult {
  /** Per-document analysis results */
  results: DocumentAnalysisResult[];
  /** Cross-document links detected across the entire batch */
  crossDocumentLinks: DocumentLink[];
  /** Wall-clock milliseconds taken to complete the batch */
  processingTimeMs: number;
}
