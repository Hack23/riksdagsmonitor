/**
 * @module analysis-reader
 * @description Thin compatibility shim. The implementation has been split
 * into focused modules under `scripts/analysis-reader/`:
 *
 * - `types.ts`              — all public type / interface definitions
 * - `helpers/`              — small markdown-extraction helpers
 * - `parsers/`              — one parser per analysis artifact
 * - `index.ts`              — orchestrator + public API
 *
 * This file is kept so existing imports
 * (`from '../analysis-reader.js'`) continue to resolve.
 *
 * ## ⚠️ Scoped deprecation (§P0-6 of the agentic-workflow quality plan)
 *
 * The structural parsers in this module (SWOT, threat, significance, risk,
 * stakeholder-perspective extractors) **must not** be used to summarise or
 * pre-digest the analysis body for article prose. The user-level rule is:
 *
 * > "Analysis in md files should not ever be parsed. AI must read it all
 * > as context."
 *
 * The *only* remaining permitted use of this module is
 * `deriveArticleClassificationMeta()` and the `readLatestAnalysis()`
 * front-matter derivation, which extract a tiny classification tuple
 * (label + confidence) for article HTML metadata.
 *
 * @see analysis/agentic-workflow-quality-plan §P0-5 / §P0-6
 * @author Hack23 AB
 * @license Apache-2.0
 */

export type {
  UrgencyLabel,
  ClassificationLevel,
  PriorityLevel,
  ConfidenceLabel,
  RiskLevel,
  DemocraticHealthLabel,
  ClassificationResult,
  RiskAssessment,
  AnalysisSwotEntry,
  SwotAnalysisResult,
  ThreatAnalysisResult,
  StakeholderPerspectivesResult,
  SignificanceScoringResult,
  SynthesisSummaryResult,
  DailyAnalysis,
} from './analysis-reader/types.js';

export {
  parseClassificationResults,
  toClassificationLevel,
  toPriorityLevel,
} from './analysis-reader/parsers/classification.js';
export { toConfidenceLabel } from './analysis-reader/parsers/confidence.js';
export {
  parseRiskAssessment,
  toRiskLevel,
} from './analysis-reader/parsers/risk.js';
export { parseSwotAnalysis } from './analysis-reader/parsers/swot.js';
export {
  parseThreatAnalysis,
  toDemocraticHealthLabel,
} from './analysis-reader/parsers/threat.js';
export { parseStakeholderPerspectives } from './analysis-reader/parsers/stakeholders.js';
export {
  parseSignificanceScoring,
  toUrgencyLabel,
  DEFAULT_SIGNIFICANCE_SCORE,
} from './analysis-reader/parsers/significance.js';
export { parseSynthesisSummary } from './analysis-reader/parsers/synthesis.js';

export {
  readDailyAnalysis,
  findLatestAnalysisDate,
  readLatestAnalysis,
  deriveArticleClassificationMeta,
  isNonEmptyAnalysis,
  readLatestNonEmptyAnalysis,
} from './analysis-reader/index.js';
