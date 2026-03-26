/**
 * @module analysis-framework
 * @description Multi-perspective document analysis framework orchestrator.
 *
 * Applies all six analysis lenses to every parliamentary document:
 * 1. Government  🏛️ — Policy execution, budget implications, coalition alignment
 * 2. Opposition  ⚖️ — Scrutiny opportunities, electoral positioning
 * 3. Citizen     👥 — Service delivery, rights, cost-of-living
 * 4. Economic    💰 — GDP/employment, business regulation, trade
 * 5. International 🌍 — EU alignment, Nordic cooperation, treaty obligations
 * 6. Media       📰 — Newsworthiness, narrative framing, controversy
 *
 * Integration points:
 * - **SWOT Generator**    — `perspective.swotContribution` entries
 * - **Dashboard Generator** — `perspective.dashboardMetrics` entries
 * - **Mindmap Generator**  — `perspective.mindmapNodes` entries
 * - **Article Content**   — `result.keyInsights` and per-lens `summary`
 * - **Newsworthiness**    — `result.overallSignificance` drives article focus
 *
 * @example
 * ```typescript
 * import { analyzeDocument, analyzeDocuments } from './analysis-framework/index.js';
 * const result = analyzeDocument(doc, cia, 'en');
 * console.log(result.overallSignificance); // 1–10
 * ```
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { RawDocument, CIAContext } from '../data-transformers/types.js';
import type { Language } from '../types/language.js';
import type {
  DocumentAnalysisResult,
  BatchAnalysisResult,
  PerspectiveAnalysis,
} from './types.js';

import { detectPolicyDomains } from '../data-transformers/policy-analysis.js';
import { analyzeGovernmentPerspective } from './lenses/government.js';
import { analyzeOppositionPerspective } from './lenses/opposition.js';
import { analyzeCitizenPerspective } from './lenses/citizen.js';
import { analyzeEconomicPerspective } from './lenses/economic.js';
import { analyzeInternationalPerspective } from './lenses/international.js';
import { analyzeMediaPerspective } from './lenses/media.js';
import { detectCrossDocumentLinks, docId } from './cross-reference.js';
import {
  computeSignificanceScore,
  computeOverallConfidence,
  extractKeyInsights,
} from './significance-scorer.js';

// ---------------------------------------------------------------------------
// Core per-document analysis
// ---------------------------------------------------------------------------

/**
 * Apply all six analysis lenses to a single parliamentary document.
 *
 * Cross-document links are set to an empty array because this function
 * operates on a single document without batch context. Use
 * `analyzeDocuments()` to get inter-document relationships.
 *
 * @param doc  - The parliamentary document to analyse
 * @param cia  - Optional CIA context (coalition stability, party performance, etc.)
 * @param lang - Target language for all generated text (default: 'en')
 * @param precomputedDomains - Optional pre-computed policy domains for this document.
 *                             When provided (e.g. from `analyzeDocuments()`), avoids a
 *                             redundant `detectPolicyDomains` call.
 * @returns    A complete `DocumentAnalysisResult`
 */
export function analyzeDocument(
  doc: RawDocument,
  cia?: CIAContext,
  lang: Language | string = 'en',
  precomputedDomains?: string[],
): DocumentAnalysisResult {
  // Reuse caller-provided domains or compute once per document
  const domains = precomputedDomains ?? detectPolicyDomains(doc, 'en');

  const perspectives: PerspectiveAnalysis[] = [
    analyzeGovernmentPerspective(doc, cia, lang, domains),
    analyzeOppositionPerspective(doc, cia, lang, domains),
    analyzeCitizenPerspective(doc, cia, lang, domains),
    analyzeEconomicPerspective(doc, cia, lang, domains),
    analyzeInternationalPerspective(doc, cia, lang, domains),
    analyzeMediaPerspective(doc, cia, lang, domains),
  ];

  const overallSignificance = computeSignificanceScore(doc, cia, perspectives, domains);
  const confidenceScore = computeOverallConfidence(doc, perspectives);
  const keyInsights = extractKeyInsights(perspectives);

  return {
    document: doc,
    overallSignificance,
    perspectives,
    crossDocumentLinks: [],
    keyInsights,
    confidenceScore,
  };
}

// ---------------------------------------------------------------------------
// Batch analysis
// ---------------------------------------------------------------------------

/**
 * Apply all six analysis lenses to a batch of parliamentary documents.
 *
 * Also performs cross-document relationship detection across the entire batch.
 *
 * Performance target: 6 lenses × 30 documents < 120 seconds.
 * The implementation is synchronous and CPU-bound; network calls are not made.
 * Typical execution: ~1–5ms per document.
 *
 * @param docs - Documents to analyse
 * @param cia  - Optional CIA context shared across all documents
 * @param lang - Target language for all generated text (default: 'en')
 * @returns    A `BatchAnalysisResult` containing per-document results and
 *             cross-document links detected across the whole batch
 */
export function analyzeDocuments(
  docs: RawDocument[],
  cia?: CIAContext,
  lang: Language | string = 'en',
): BatchAnalysisResult {
  const startMs = Date.now();

  // Per-document analyses (no cross-references yet)
  // Build a shared domain map so detectCrossDocumentLinks() doesn't re-compute.
  const domainMap = new Map<string, string[]>();
  const results: DocumentAnalysisResult[] = docs.map(doc => {
    const domains = detectPolicyDomains(doc, 'en');
    domainMap.set(docId(doc), domains);
    return analyzeDocument(doc, cia, lang, domains);
  });

  // Cross-document link detection across the full batch — reuses domain map
  const crossDocumentLinks = detectCrossDocumentLinks(docs, domainMap);

  // Attach relevant links to each document result
  for (const result of results) {
    const id = docId(result.document);
    result.crossDocumentLinks = crossDocumentLinks.filter(
      link => link.sourceId === id || link.targetId === id
    );
  }

  return {
    results,
    crossDocumentLinks,
    processingTimeMs: Date.now() - startMs,
  };
}

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export type {
  AnalysisLens,
  ImpactLevel,
  Sentiment,
  SwotContribution,
  DashboardMetric,
  MindmapNode,
  MindmapNodeWeight,
  PerspectiveAnalysis,
  DocumentLink,
  DocumentLinkType,
  DocumentAnalysisResult,
  BatchAnalysisResult,
} from './types.js';

export { detectCrossDocumentLinks, docId } from './cross-reference.js';
export { computeSignificanceScore, computeOverallConfidence, extractKeyInsights } from './significance-scorer.js';
export { analyzeGovernmentPerspective } from './lenses/government.js';
export { analyzeOppositionPerspective } from './lenses/opposition.js';
export { analyzeCitizenPerspective } from './lenses/citizen.js';
export { analyzeEconomicPerspective } from './lenses/economic.js';
export { analyzeInternationalPerspective } from './lenses/international.js';
export { analyzeMediaPerspective } from './lenses/media.js';

// ---------------------------------------------------------------------------
// Methodology exports (ISMS-inspired political analysis)
// ---------------------------------------------------------------------------

export type {
  PoliticalClassification,
  PublicInterestSensitivity,
  DemocraticIntegrityImpact,
  PolicyUrgency,
  EconomicImpact,
  GovernanceImpact,
  PoliticalCapitalImpact,
  LegislativeImpact,
  OverallClassification,
  PoliticalRiskCategory,
  LikelihoodLevel,
  RiskImpactLevel,
  PoliticalRiskAssessment,
  PoliticalRiskProfile,
  PridesCategory,
  ThreatAgent,
  ThreatSeverity,
  PoliticalThreatAnalysis,
  PoliticalThreatProfile,
  MethodologyAnalysis,
} from './methodology-types.js';

export { LIKELIHOOD_PROBABILITY, IMPACT_WEIGHT } from './methodology-types.js';

export { classifyPoliticalDocument, classifyPoliticalDocuments } from './political-classification.js';
export { assessPoliticalRisk, assessSingleRiskCategory, computeRiskScore, deriveRiskPriority } from './political-risk-assessment.js';
export { analysePoliticalThreats, analyseSinglePridesCategory } from './political-threat-analysis.js';
