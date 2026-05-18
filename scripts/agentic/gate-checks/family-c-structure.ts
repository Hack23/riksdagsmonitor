/**
 * @module scripts/agentic/gate-checks/family-c-structure
 * @description Check 7 — Aggregator for Family C structural requirements
 *              (executive-brief, intelligence-assessment, scenario-analysis,
 *              devils-advocate, methodology-reflection, comparative-international).
 *
 * @see .github/prompts/05-analysis-gate.md §Check 7
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { checkComparativeInternational } from './comparative-international.js';
import { checkDevilsAdvocate } from './devils-advocate.js';
import { checkExecutiveBrief } from './executive-brief.js';
import { checkIntelligenceAssessment } from './intelligence-assessment.js';
import { checkMethodologyReflection } from './methodology-reflection.js';
import { checkScenarioAnalysis } from './scenario-analysis.js';
import type { GateCheckResult } from '../gate-shared/types.js';

/**
 * Validate Family C structural requirements.
 */
export async function checkFamilyCStructure(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];

  results.push(...(await checkExecutiveBrief(analysisDir)));
  results.push(...(await checkIntelligenceAssessment(analysisDir)));
  results.push(...(await checkScenarioAnalysis(analysisDir)));
  results.push(...(await checkDevilsAdvocate(analysisDir)));
  results.push(...(await checkMethodologyReflection(analysisDir)));
  results.push(...(await checkComparativeInternational(analysisDir)));

  return results;
}
