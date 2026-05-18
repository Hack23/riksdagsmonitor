/**
 * @module scripts/agentic/gate-checks/forward-indicators
 * @description Check 8a — Validate forward-indicators.md has ≥10 dated
 *              indicators (ISO date, YYYYQn or +Nd/h offset).
 *
 * @see .github/prompts/05-analysis-gate.md §Check 8 (forward-indicators)
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { GateCheckResult } from '../gate-shared/types.js';

/**
 * Check forward-indicators.md for ≥10 dated indicators.
 */
export async function checkForwardIndicators(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'forward-indicators.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');
  const datePattern = /20[0-9]{2}-[0-1][0-9]-[0-3][0-9]|20[0-9]{2}Q[1-4]|\+[0-9]+\s*(h|d|day|week|month)/g;
  const matches = content.match(datePattern);
  const count = matches ? matches.length : 0;

  if (count < 10) {
    results.push({
      checkId: 'family-d-structure',
      passed: false,
      message: `forward-indicators.md: fewer than 10 dated indicators (found ${count})`,
      artifact: 'forward-indicators.md',
    });
  } else {
    results.push({
      checkId: 'family-d-structure',
      passed: true,
      message: `forward-indicators.md: ${count} dated indicators found`,
      artifact: 'forward-indicators.md',
    });
  }

  return results;
}
