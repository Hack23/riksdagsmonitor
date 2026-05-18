/**
 * @module scripts/agentic/gate-checks/comparative-international
 * @description Check 7f — Validate comparative-international.md has a
 *              comparator set or ≥2 comparator rows.
 *
 * @see .github/prompts/05-analysis-gate.md §Check 7 (comparative-international)
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { GateCheckResult } from '../gate-shared/types.js';

/**
 * Check comparative-international.md for comparator set or ≥2 rows.
 */
export async function checkComparativeInternational(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'comparative-international.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');

  const COMPARATOR_SET_RE = /^\s*\*{0,2}Comparator set\*{0,2}\s*:/m;
  const hasComparatorSet = COMPARATOR_SET_RE.test(content) &&
    !/^\s*\*{0,2}Comparator set\*{0,2}\s*:\s*[-–—]*\s*$/m.test(content);

  const tableRows = content.split('\n').filter((line) => {
    if (!/^\|/.test(line)) return false;
    if (/^\|[\s:-]+(\|[\s:-]+)+\|?\s*$/.test(line)) return false;
    if (/^\|\s*(Jurisdiction|Comparator|Country)\s*\|/.test(line)) return false;
    return true;
  });

  const hasEnoughRows = tableRows.length >= 2;

  if (!hasComparatorSet && !hasEnoughRows) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: 'comparative-international.md: missing comparator set or fewer than 2 comparator rows',
      artifact: 'comparative-international.md',
    });
  } else {
    results.push({
      checkId: 'family-c-structure',
      passed: true,
      message: 'comparative-international.md: comparator data present',
      artifact: 'comparative-international.md',
    });
  }

  return results;
}
