/**
 * @module ai-analysis
 * @description Barrel re-export for the AI-powered document analysis framework.
 *
 * The framework provides a shared analytical backbone for all content generators
 * and agentic workflows, delivering multi-stakeholder impact assessment, PESTLE
 * analysis, coalition dynamics, historical context, implementation feasibility,
 * risk assessment, and confidence scoring through a four-iteration protocol.
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


export {
  analyzeDocument,
  analyzeDocuments,
  clearAnalysisCache,
  MAX_CACHE_SIZE,
  selectRelevantStakeholders,
  buildPestleAnalysis,
  buildCoalitionDynamics,
  buildHistoricalContext,
  buildImplementationAssessment,
  buildRiskAssessment,
  generateExecutiveSummary,
} from './document-analyzer.js';

export type {
  StakeholderGroup,
  ImpactDirection,
  BurdenLevel,
  ImpactAssessment,
  StakeholderImpact,
  PESTLEAnalysis,
  PolicyDomain,
  CoalitionAnalysis,
  HistoricalContext,
  ImplementationAssessment,
  RiskAssessment,
  AnalysisIteration,
  DocumentAnalysis,
  PrecomputedContext,
} from './document-analyzer.js';
