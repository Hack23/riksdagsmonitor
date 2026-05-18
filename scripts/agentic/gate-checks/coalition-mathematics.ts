/**
 * @module scripts/agentic/gate-checks/coalition-mathematics
 * @description Check 8b — Validate coalition-mathematics.md contains a
 *              seat-count / vote-breakdown table.
 *
 * @see .github/prompts/05-analysis-gate.md §Check 8 (coalition-mathematics)
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { GateCheckResult } from '../gate-shared/types.js';

/**
 * Check coalition-mathematics.md for seat-count / vote-breakdown table.
 */
export async function checkCoalitionMathematics(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'coalition-mathematics.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');
  const hasTable = /^\|.*(Ja|Nej|Avstår|Frånvarande|Seats|Mandat)/m.test(content);

  if (!hasTable) {
    results.push({
      checkId: 'family-d-structure',
      passed: false,
      message: 'coalition-mathematics.md: missing seat-count / vote-breakdown table',
      artifact: 'coalition-mathematics.md',
    });
  } else {
    results.push({
      checkId: 'family-d-structure',
      passed: true,
      message: 'coalition-mathematics.md: vote/seat table present',
      artifact: 'coalition-mathematics.md',
    });
  }

  return results;
}
