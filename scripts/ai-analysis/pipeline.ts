/**
 * @module ai-analysis/pipeline
 * @description Thin orchestrator for the AI-first analysis pipeline.
 *
 * Implements the `AnalysisPipeline` interface by delegating to focused
 * bounded-context modules:
 *   - `swot/`          — stakeholder SWOT construction, enrichment, confidence
 *   - `domains/`       — policy assessment, watch points, EU/Nordic comparative
 *   - `visualisation/` — mindmap branches, dashboard data
 *
 * Lifecycle for a `deep` analysis:
 *   1. `analyzeDocuments`     — iteration 1: initial extraction
 *   2. `refineAnalysis`       — iteration 2: SWOT enrichment from full text
 *   3. `validateCompleteness` — iteration 3: quality validation
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * @deprecated ANALYSIS GENERATION DEPRECATED — Per ai-driven-analysis-guide.md Rule 2,
 * scripts MUST NOT generate political analysis content. The AI agent in workflow prompts
 * is now the exclusive source of SWOT, risk, threat, classification, and stakeholder analysis.
 *
 * This module's analysis output (significance scores, SWOT entries, risk assessments,
 * stakeholder perspectives) should be treated as STUBS that the AI agent MUST overwrite
 * with real, template-compliant analysis citing specific dok_id, vote counts, and politicians.
 *
 * Scripts retain their data downloading and HTML formatting functions.
 * See: .github/workflows/SHARED_PROMPT_PATTERNS.md "Script Role Boundary" section.
 */


import type { RawDocument } from '../data-transformers/types.js';
import { detectPolicyDomains, detectNarrativeFrames } from '../data-transformers/policy-analysis.js';

import type {
  AnalysisPipeline,
  AnalysisPipelineOptions,
  AnalysisResult,
  ValidationResult,
} from './types.js';

import {
  buildStakeholderSwot,
  refineStakeholderSwot,
  calculateConfidenceScore,
} from './swot/index.js';

import { buildPolicyAssessment, buildWatchPoints } from './domains/index.js';

import {
  narrativeFramesLabel,
  buildMindmapBranches,
  buildDashboardData,
} from './visualisation/index.js';

import {
  docType,
  isMetadataEnriched,
  hasFullTextContent,
} from './helpers.js';

// ---------------------------------------------------------------------------
// Iteration 1: analyzeDocuments
// ---------------------------------------------------------------------------

async function analyzeDocuments(
  docs: RawDocument[],
  options: AnalysisPipelineOptions,
): Promise<AnalysisResult> {
  const { lang, focusTopic: topic } = options;

  const domains = (() => {
    const all = new Set<string>();
    docs.forEach(d => detectPolicyDomains(d, lang).forEach(dom => all.add(dom)));
    return [...all].slice(0, 8);
  })();

  const stakeholderSwot = buildStakeholderSwot(docs, topic, lang, domains);
  const policyAssessment = buildPolicyAssessment(docs, topic, lang, options.depth);
  const watchPoints = buildWatchPoints(docs, topic, lang);
  const mindmapBranches = buildMindmapBranches(docs, topic, policyAssessment.domains, lang);
  const dashboardData = buildDashboardData(docs, topic, lang);
  const confidenceScore = calculateConfidenceScore(docs, stakeholderSwot);

  return {
    stakeholderSwot,
    policyAssessment,
    mindmapBranches,
    dashboardData,
    watchPoints,
    confidenceScore,
    iterationsCompleted: 1,
    completedAt: new Date().toISOString(),
    lang,
    documentCount: docs.length,
    enrichedCount: docs.filter(isMetadataEnriched).length,
    focusTopic: topic,
  };
}

// ---------------------------------------------------------------------------
// Iteration 2: refineAnalysis
// ---------------------------------------------------------------------------

async function refineAnalysis(
  initial: AnalysisResult,
  docs: RawDocument[],
  options: AnalysisPipelineOptions,
): Promise<AnalysisResult> {
  const { lang, focusTopic: topic } = options;
  const fullTextDocs = docs.filter(hasFullTextContent);
  const metadataCount = docs.filter(isMetadataEnriched).length;

  if (fullTextDocs.length === 0) {
    return {
      ...initial,
      iterationsCompleted: 2,
      completedAt: new Date().toISOString(),
      enrichedCount: metadataCount,
      confidenceScore: calculateConfidenceScore(docs, initial.stakeholderSwot),
      policyAssessment: buildPolicyAssessment(docs, topic, lang, options.depth),
    };
  }

  const refined = { ...initial, iterationsCompleted: 2, completedAt: new Date().toISOString() };

  // Delegate SWOT enrichment to swot module
  refined.stakeholderSwot = refineStakeholderSwot(
    refined.stakeholderSwot, fullTextDocs, topic, lang,
  );

  // Rebuild watch points with enriched context
  refined.watchPoints = buildWatchPoints(docs, topic, lang);

  // Recalculate confidence and metadata
  refined.confidenceScore = calculateConfidenceScore(docs, refined.stakeholderSwot);
  refined.enrichedCount = metadataCount;
  refined.policyAssessment = buildPolicyAssessment(docs, topic, lang, options.depth);

  // Collect narrative frames for mindmap enrichment
  const allFrames = new Set<string>();
  fullTextDocs.slice(0, 20).forEach(d => detectNarrativeFrames(d).forEach(f => allFrames.add(f)));

  refined.mindmapBranches = buildMindmapBranches(docs, topic, refined.policyAssessment.domains, lang);

  // Add civil society branch if we have external docs
  const civilSocietyDocs = fullTextDocs.filter(d => ['ext', 'fpm', 'eu'].includes(docType(d)));
  if (civilSocietyDocs.length > 0 && allFrames.size > 0) {
    const hasBranch = refined.mindmapBranches.some(b => b.label === narrativeFramesLabel(lang));
    if (!hasBranch) {
      refined.mindmapBranches.push({
        label: narrativeFramesLabel(lang),
        color: 'orange',
        icon: '🎯',
        items: [...allFrames].slice(0, 6),
      });
    }
  }

  return refined;
}

// ---------------------------------------------------------------------------
// Iteration 3: validateCompleteness
// ---------------------------------------------------------------------------

async function validateCompleteness(
  analysis: AnalysisResult,
  docs: RawDocument[],
): Promise<ValidationResult> {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  for (const sh of analysis.stakeholderSwot) {
    const { strengths, weaknesses, opportunities, threats } = sh.swot;
    if (strengths.length === 0) {
      issues.push(`${sh.name}: no strengths entries`);
      score -= 5;
    }
    if (weaknesses.length === 0) {
      suggestions.push(`${sh.name}: consider adding weakness analysis`);
      score -= 2;
    }
    if (opportunities.length === 0) {
      suggestions.push(`${sh.name}: consider adding opportunity analysis`);
      score -= 2;
    }
    if (threats.length === 0) {
      suggestions.push(`${sh.name}: consider adding threat analysis`);
      score -= 2;
    }
    const allEntries = [...strengths, ...weaknesses, ...opportunities, ...threats];
    const allPlaceholders = allEntries.length > 0 && allEntries.every(e => e.sourceDocIds.length === 0);
    if (allPlaceholders) {
      issues.push(`${sh.name}: all SWOT entries lack document evidence (sourceDocIds empty) — enrich with document content`);
      score -= 10;
    }
  }

  if (analysis.policyAssessment.domains.length === 0) {
    issues.push('No policy domains detected — document titles may need more descriptive text');
    score -= 5;
  }

  if (analysis.watchPoints.length === 0) {
    suggestions.push('No watch points generated — check for actionable document types (prop, bet, sfs)');
    score -= 3;
  }

  const fullTextAvailable = docs.filter(hasFullTextContent).length;
  if (analysis.documentCount > 0 && analysis.enrichedCount === 0) {
    issues.push('No documents have been enriched — analysis quality is limited to raw metadata');
    score -= 15;
  } else if (analysis.enrichedCount > 0 && fullTextAvailable === 0) {
    suggestions.push('Documents are metadata-enriched but lack full text — consider using include_full_text=true for deeper analysis');
    score -= 5;
  }

  if (analysis.confidenceScore < 30) {
    issues.push(`Low confidence score (${analysis.confidenceScore}/100) — fetch more documents or enrich with full text`);
    score -= 5;
  }

  if (analysis.enrichedCount >= 3) {
    score = Math.min(100, score + 5);
  }
  if (fullTextAvailable >= 2) {
    score = Math.min(100, score + 3);
  }

  const finalScore = Math.max(0, score);
  return {
    passed: finalScore >= 60,
    score: finalScore,
    issues,
    suggestions,
  };
}

// ---------------------------------------------------------------------------
// Exported pipeline singleton
// ---------------------------------------------------------------------------

/**
 * The default AI analysis pipeline implementation.
 *
 * Usage in generators:
 * ```ts
 * import { aiAnalysisPipeline } from '../ai-analysis/pipeline.js';
 * const result = await aiAnalysisPipeline.analyzeDocuments(docs, { depth, lang, focusTopic });
 * ```
 */
export const aiAnalysisPipeline: AnalysisPipeline = {
  analyzeDocuments,
  refineAnalysis,
  validateCompleteness,
};

/**
 * Run the full analysis pipeline according to the specified depth.
 * Returns the final AnalysisResult, optional ValidationResult, and
 * per-iteration timing data for audit metadata.
 */
export async function runAnalysisPipeline(
  docs: RawDocument[],
  options: AnalysisPipelineOptions,
): Promise<{ analysis: AnalysisResult; validation: ValidationResult | null; iterationDurationsMs: number[] }> {
  const iterationDurationsMs: number[] = [];

  const t1 = Date.now();
  let analysis = await aiAnalysisPipeline.analyzeDocuments(docs, options);
  iterationDurationsMs.push(Date.now() - t1);

  if (options.depth !== 'quick') {
    const t2 = Date.now();
    analysis = await aiAnalysisPipeline.refineAnalysis(analysis, docs, options);
    iterationDurationsMs.push(Date.now() - t2);
  }

  let validation: ValidationResult | null = null;
  if (options.depth === 'deep') {
    const t3 = Date.now();
    validation = await aiAnalysisPipeline.validateCompleteness(analysis, docs);
    iterationDurationsMs.push(Date.now() - t3);
    analysis = { ...analysis, iterationsCompleted: 3, completedAt: new Date().toISOString() };
  }

  return { analysis, validation, iterationDurationsMs };
}
