/**
 * @module scripts/agentic/analysis-gate
 * @description Orchestrator for the analysis gate validation logic defined
 *              in `.github/prompts/05-analysis-gate.md`. Each individual
 *              gate rule lives in its own module under `./gate-checks/`;
 *              this file aggregates them into a single
 *              `validateAnalysisGate()` entry point and re-exports them
 *              for backwards-compatible external imports.
 *
 * Implemented checks (1-to-1 mapping with the bash gate):
 *   1.  Artifact existence                — gate-checks/artifact-existence.ts
 *   2.  Per-document coverage             — gate-checks/per-document-coverage.ts
 *   3.  No stub placeholders              — gate-checks/no-stubs.ts
 *   4.  Evidence citations (SWOT + sig.)  — gate-checks/evidence-citations.ts
 *   5.  Mermaid diagrams                  — gate-checks/mermaid-diagrams.ts
 *   6.  Pass-2 evidence                   — gate-checks/pass2-evidence.ts
 *   7.  Family C structure                — gate-checks/family-c-structure.ts
 *   8.  Family D structure                — gate-checks/family-d-structure.ts
 *   9.  PIR status sidecar                — gate-checks/pir-status.ts
 *   9b. Statskontoret evidence            — gate-checks/statskontoret-evidence.ts
 *
 * Additional prompt-level gates (e.g. check 10 full-text outcomes,
 * supplementary/editorial gates) are NOT covered here and must be
 * validated separately.
 *
 * @example
 *   import { validateAnalysisGate } from './analysis-gate.js';
 *   const result = await validateAnalysisGate('analysis/daily/2026-05-01/propositions');
 *   if (!result.passed) {
 *     result.checks.filter(c => !c.passed).forEach(c => console.error(c.message));
 *   }
 *
 * @see .github/prompts/05-analysis-gate.md — canonical gate specification
 * @see scripts/agentic/gate-checks/index.ts — per-check module barrel
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type {
  GateCheckResult,
  GateValidationResult,
} from './gate-shared/types.js';

import {
  checkArtifactExistence,
  checkEvidenceCitations,
  checkFamilyCStructure,
  checkFamilyDStructure,
  checkMermaidDiagrams,
  checkNoStubs,
  checkPass2Evidence,
  checkPerDocumentCoverage,
  checkPirStatus,
  checkStatskontoretEvidence,
} from './gate-checks/index.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run all analysis gate checks against an analysis directory.
 *
 * @param analysisDir - Absolute or relative path to the analysis subfolder
 *                      (e.g. `analysis/daily/2026-05-01/propositions`).
 * @returns Aggregate validation result with per-check details.
 */
export async function validateAnalysisGate(
  analysisDir: string,
): Promise<GateValidationResult> {
  const checks: GateCheckResult[] = [];

  checks.push(...checkArtifactExistence(analysisDir));
  checks.push(...(await checkPerDocumentCoverage(analysisDir)));
  checks.push(...(await checkNoStubs(analysisDir)));
  checks.push(...(await checkEvidenceCitations(analysisDir)));
  checks.push(...(await checkMermaidDiagrams(analysisDir)));
  checks.push(...(await checkPass2Evidence(analysisDir)));
  checks.push(...(await checkFamilyCStructure(analysisDir)));
  checks.push(...(await checkFamilyDStructure(analysisDir)));
  checks.push(...(await checkPirStatus(analysisDir)));
  checks.push(...(await checkStatskontoretEvidence(analysisDir)));

  const failureCount = checks.filter((c) => !c.passed).length;
  return {
    passed: failureCount === 0,
    checks,
    failureCount,
  };
}

// ---------------------------------------------------------------------------
// Backwards-compatible re-exports
// ---------------------------------------------------------------------------
//
// External callers (other scripts, tests, downstream tooling) import the
// individual check functions directly from `scripts/agentic/analysis-gate`.
// Preserve that import surface — every public symbol the monolithic file
// previously exposed is re-exported here, one-to-one.
//

export {
  checkArtifactExistence,
  checkPerDocumentCoverage,
  checkNoStubs,
  checkEvidenceCitations,
  checkSwotEvidence,
  checkSignificanceScoringEvidence,
  checkMermaidDiagrams,
  checkPass2Evidence,
  checkFamilyCStructure,
  checkExecutiveBrief,
  checkIntelligenceAssessment,
  checkScenarioAnalysis,
  checkDevilsAdvocate,
  checkMethodologyReflection,
  checkComparativeInternational,
  checkFamilyDStructure,
  checkForwardIndicators,
  checkCoalitionMathematics,
  checkPirStatus,
  checkStatskontoretEvidence,
  extractDokIds,
  extractExecutiveBriefH1,
  PASS2_MTIME_THRESHOLD_MS,
} from './gate-checks/index.js';
