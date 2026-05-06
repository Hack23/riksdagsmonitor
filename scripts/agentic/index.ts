/**
 * @module scripts/agentic
 * @description Barrel export for the agentic workflow bounded context.
 *
 * This module exposes typed helpers that extract, validate, and inventory
 * the analysis artifacts produced by the 14 agentic news workflows.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export {
  type ArtifactFamily,
  type ArtifactDefinition,
  type GateCheckResult,
  type GateValidationResult,
  FAMILY_A_ARTIFACTS,
  FAMILY_B_ARTIFACTS,
  FAMILY_C_ARTIFACTS,
  FAMILY_D_ARTIFACTS,
  ALL_REQUIRED_ARTIFACTS,
  REQUIRED_ARTIFACT_FILENAMES,
  MERMAID_REQUIRED_ARTIFACTS,
  PASS2_REQUIRED_ARTIFACTS,
  STUB_PLACEHOLDERS,
  RECOGNISED_AGENCIES,
  EVIDENCE_URL_HOSTS,
  DOK_ID_PATTERN,
  EVIDENCE_PATTERN,
} from './artifact-inventory.js';

export {
  validateAnalysisGate,
  checkArtifactExistence,
  checkPerDocumentCoverage,
  checkNoStubs,
  checkMermaidDiagrams,
  checkFamilyCStructure,
  checkFamilyDStructure,
  checkPirStatus,
  checkStatskontoretEvidence,
  extractDokIds,
} from './analysis-gate.js';
