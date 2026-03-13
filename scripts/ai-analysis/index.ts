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

export {
  analyzeDocument,
  analyzeDocuments,
  clearAnalysisCache,
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
} from './document-analyzer.js';
