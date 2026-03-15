/**
 * @module analysis-framework/significance-scorer
 * @description Political significance scoring for parliamentary documents.
 *
 * Produces a 1–10 integer score reflecting the document's overall political
 * significance. The score is used by:
 * - Article focus prioritisation (high-significance documents get more depth)
 * - Newsworthiness routing (deep-inspection vs standard vs brief)
 * - SWOT and mindmap weighting (critical vs significant vs moderate)
 *
 * Scoring dimensions (each normalised to 0–10 before weighting):
 * 1. Document type tier      (weight 0.25)
 * 2. Committee tier          (weight 0.20)
 * 3. Policy domain breadth   (weight 0.15)
 * 4. Coalition context       (weight 0.20)
 * 5. Content richness        (weight 0.10)
 * 6. Perspective impact sum  (weight 0.10)
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument, CIAContext } from '../data-transformers/types.js';
import type { PerspectiveAnalysis } from './types.js';
import { detectPolicyDomains, assessConfidenceLevel } from '../data-transformers/policy-analysis.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Document types ranked by parliamentary significance (highest first) */
const DOC_TYPE_SCORES: Readonly<Record<string, number>> = {
  prop: 10,   // Government proposition
  bet: 9,     // Committee report
  skr: 7,     // Government communication
  sou: 8,     // Swedish Government Official Report
  ds: 6,      // Departmental series
  dir: 5,     // Committee directive
  mot: 3,     // Parliamentary motion
  ip: 4,      // Interpellation
  fr: 2,      // Written question
  frs: 2,     // Response to written question
};

/** Committees ranked by strategic significance (highest first) */
const COMMITTEE_SCORES: Readonly<Record<string, number>> = {
  FiU: 10,  // Finance
  KU: 10,   // Constitutional
  FöU: 9,   // Defence
  UU: 9,    // Foreign Affairs
  JuU: 8,   // Justice
  SoU: 7,   // Social Affairs & Health
  SfU: 7,   // Social Insurance
  AU: 6,    // Labour Market
  TU: 5,    // Transport
  MJU: 6,   // Environment
  UbU: 6,   // Education
  NU: 5,    // Trade & Industry
  CU: 5,    // Civil Affairs
  SkU: 6,   // Taxation
};

// ---------------------------------------------------------------------------
// Dimension scorers (each returns 0–10)
// ---------------------------------------------------------------------------

function scoreDocumentType(doc: RawDocument): number {
  const type = doc.doktyp || doc.documentType || '';
  return DOC_TYPE_SCORES[type] ?? 1;
}

function scoreCommitteeTier(doc: RawDocument): number {
  const committee = doc.organ || doc.committee || '';
  return COMMITTEE_SCORES[committee] ?? 1;
}

function scorePolicyDomainBreadth(doc: RawDocument, precomputedDomains?: string[]): number {
  const domains = precomputedDomains ?? detectPolicyDomains(doc, 'en');
  // 1 domain = 3, 2 domains = 5, 3+ = 8, 4+ = 10
  if (domains.length === 0) return 1;
  if (domains.length === 1) return 3;
  if (domains.length === 2) return 5;
  if (domains.length === 3) return 8;
  return 10;
}

function scoreCoalitionContext(cia: CIAContext | undefined): number {
  if (!cia?.coalitionStability) return 5; // Neutral default

  const stability = cia.coalitionStability.stabilityScore ?? 100;
  const margin = cia.coalitionStability.majorityMargin ?? 10;

  let score = 3; // Base

  // Instability amplifies significance
  if (stability < 30) score += 5;
  else if (stability < 50) score += 3;
  else if (stability < 70) score += 1;

  // Thin majority amplifies significance
  if (margin <= 1) score += 2;
  else if (margin <= 3) score += 1;

  return Math.min(10, score);
}

function scoreContentRichness(doc: RawDocument): number {
  let score = 1;
  if (doc.summary || doc.notis) score += 3;
  if (doc.fullText || doc.fullContent) score += 4;
  if (doc.speeches && doc.speeches.length > 0) score += 2;
  return Math.min(10, score);
}

function scorePerspectiveImpacts(perspectives: PerspectiveAnalysis[]): number {
  if (perspectives.length === 0) return 1;
  const impactValues: Readonly<Record<string, number>> = { high: 10, medium: 5, low: 2 };
  const total = perspectives.reduce((sum, p) => sum + (impactValues[p.impact] ?? 1), 0);
  return Math.min(10, Math.round(total / perspectives.length));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute the overall political significance score (1–10) for a parliamentary document.
 *
 * Aggregates six weighted dimensions:
 * - Document type tier (25%)
 * - Committee tier (20%)
 * - Policy domain breadth (15%)
 * - Coalition context / stability (20%)
 * - Content richness (10%)
 * - Perspective impact average (10%)
 *
 * @param doc          - The document to score
 * @param cia          - Optional CIA context for coalition stability
 * @param perspectives - Pre-computed perspective analyses (for dimension 6)
 * @param precomputedDomains - Optional pre-computed policy domains (avoids redundant detectPolicyDomains call)
 * @returns            Integer significance score in range [1, 10]
 */
export function computeSignificanceScore(
  doc: RawDocument,
  cia: CIAContext | undefined,
  perspectives: PerspectiveAnalysis[],
  precomputedDomains?: string[],
): number {
  const dims = [
    { score: scoreDocumentType(doc), weight: 0.25 },
    { score: scoreCommitteeTier(doc), weight: 0.20 },
    { score: scorePolicyDomainBreadth(doc, precomputedDomains), weight: 0.15 },
    { score: scoreCoalitionContext(cia), weight: 0.20 },
    { score: scoreContentRichness(doc), weight: 0.10 },
    { score: scorePerspectiveImpacts(perspectives), weight: 0.10 },
  ];

  const weighted = dims.reduce((sum, d) => sum + d.score * d.weight, 0);
  return Math.max(1, Math.min(10, Math.round(weighted)));
}

/**
 * Compute a confidence score (0–100) for the overall document analysis.
 * Derived from the mean of per-perspective confidence scores, adjusted by
 * content richness.
 *
 * @param doc          - The source document
 * @param perspectives - Per-perspective analyses
 * @returns            Overall confidence score (0–100)
 */
export function computeOverallConfidence(
  doc: RawDocument,
  perspectives: PerspectiveAnalysis[],
): number {
  if (perspectives.length === 0) return 20;

  const meanPerspectiveConfidence = perspectives.reduce((sum, p) => sum + p.confidence, 0) / perspectives.length;

  // Adjust upward slightly for content richness
  const evidenceCount = [doc.fullText, doc.fullContent, doc.summary, doc.notis].filter(Boolean).length;
  const sourceQuality = doc.speeches && doc.speeches.length > 0 ? 80 : 60;
  const confidenceLevel = assessConfidenceLevel(evidenceCount, sourceQuality);
  const levelBonus = confidenceLevel === 'HIGH' ? 5 : confidenceLevel === 'MEDIUM' ? 2 : 0;

  return Math.min(100, Math.round(meanPerspectiveConfidence + levelBonus));
}

/**
 * Extract 3–5 key insights from a set of perspective analyses.
 *
 * Selects the most impactful summaries across lenses and synthesises
 * them into a concise ordered list.
 *
 * @param perspectives - All six perspective analyses for a document
 * @returns            Ordered array of 3–5 insight strings
 */
export function extractKeyInsights(perspectives: PerspectiveAnalysis[]): string[] {
  // Sort by impact (high first) then confidence
  const sorted = [...perspectives].sort((a, b) => {
    const impactOrder: Readonly<Record<string, number>> = { high: 3, medium: 2, low: 1 };
    const diff = (impactOrder[b.impact] ?? 0) - (impactOrder[a.impact] ?? 0);
    return diff !== 0 ? diff : b.confidence - a.confidence;
  });

  // Take top 5 summaries, ensuring each adds new information
  const insights: string[] = [];
  for (const p of sorted) {
    if (insights.length >= 5) break;
    if (p.summary && p.summary.length > 20) {
      insights.push(`[${p.lens.toUpperCase()}] ${p.summary.slice(0, 120).trim()}`);
    }
  }

  return insights.slice(0, 5);
}
