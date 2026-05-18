/**
 * @module scripts/agentic/gate-checks/scenario-analysis
 * @description Check 7c — Validate scenario-analysis.md has ≥3 scenarios.
 *
 * @see .github/prompts/05-analysis-gate.md §Check 7 (scenario-analysis)
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { GateCheckResult } from '../gate-shared/types.js';

/**
 * Check scenario-analysis.md for ≥3 distinct scenarios.
 */
export async function checkScenarioAnalysis(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'scenario-analysis.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');
  const scenarioMatches = content.match(/^##?\s+.*Scenario/gm);
  const count = scenarioMatches ? scenarioMatches.length : 0;

  if (count < 3) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: `scenario-analysis.md: fewer than 3 scenarios (found ${count})`,
      artifact: 'scenario-analysis.md',
    });
  } else {
    results.push({
      checkId: 'family-c-structure',
      passed: true,
      message: `scenario-analysis.md: ${count} scenarios found`,
      artifact: 'scenario-analysis.md',
    });
  }

  return results;
}
