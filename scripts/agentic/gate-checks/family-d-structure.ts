/**
 * @module scripts/agentic/gate-checks/family-d-structure
 * @description Check 8 — Aggregator for Family D structural requirements
 *              (forward-indicators, coalition-mathematics).
 *
 * @see .github/prompts/05-analysis-gate.md §Check 8
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { checkCoalitionMathematics } from './coalition-mathematics.js';
import { checkForwardIndicators } from './forward-indicators.js';
import type { GateCheckResult } from '../gate-shared/types.js';

/**
 * Validate Family D structural requirements.
 */
export async function checkFamilyDStructure(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];

  results.push(...(await checkForwardIndicators(analysisDir)));
  results.push(...(await checkCoalitionMathematics(analysisDir)));

  return results;
}
