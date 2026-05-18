/**
 * @module scripts/agentic/gate-checks/index
 * @description Barrel — re-exports every gate-check module so the
 *              orchestrator (`analysis-gate.ts`) has a single import surface.
 *
 * @see .github/prompts/05-analysis-gate.md — canonical bash gate parity
 * @author Hack23 AB
 * @license Apache-2.0
 */

export { checkArtifactExistence } from './artifact-existence.js';
export {
  checkPerDocumentCoverage,
  extractDokIds,
} from './per-document-coverage.js';
export { checkNoStubs } from './no-stubs.js';
export { checkEvidenceCitations } from './evidence-citations.js';
export { checkSwotEvidence } from './swot-evidence.js';
export { checkSignificanceScoringEvidence } from './significance-scoring.js';
export { checkMermaidDiagrams } from './mermaid-diagrams.js';
export {
  checkPass2Evidence,
  PASS2_MTIME_THRESHOLD_MS,
} from './pass2-evidence.js';
export { checkFamilyCStructure } from './family-c-structure.js';
export {
  checkExecutiveBrief,
  extractExecutiveBriefH1,
} from './executive-brief.js';
export { checkIntelligenceAssessment } from './intelligence-assessment.js';
export { checkScenarioAnalysis } from './scenario-analysis.js';
export { checkDevilsAdvocate } from './devils-advocate.js';
export { checkMethodologyReflection } from './methodology-reflection.js';
export { checkComparativeInternational } from './comparative-international.js';
export { checkFamilyDStructure } from './family-d-structure.js';
export { checkForwardIndicators } from './forward-indicators.js';
export { checkCoalitionMathematics } from './coalition-mathematics.js';
export { checkPirStatus } from './pir-status.js';
export { checkStatskontoretEvidence } from './statskontoret-evidence.js';
