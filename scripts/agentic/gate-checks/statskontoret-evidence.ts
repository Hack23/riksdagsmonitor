/**
 * @module scripts/agentic/gate-checks/statskontoret-evidence
 * @description Check 9b — When implementation-feasibility.md names a
 *              recognised agency, verify the Statskontoret relevance row
 *              has a URL or 'none found'.
 *
 * @see .github/prompts/05-analysis-gate.md §Check 9b
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { RECOGNISED_AGENCIES } from '../artifact-inventory.js';
import type { GateCheckResult } from '../gate-shared/types.js';

/**
 * When implementation-feasibility.md names a recognised agency, verify
 * the Statskontoret relevance row has a URL or 'none found'.
 */
export async function checkStatskontoretEvidence(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'implementation-feasibility.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');

  const agencyPattern = new RegExp(RECOGNISED_AGENCIES.join('|'), 'i');
  if (!agencyPattern.test(content)) {
    results.push({
      checkId: 'statskontoret-evidence',
      passed: true,
      message: 'implementation-feasibility.md: no recognised agency mentioned',
      artifact: 'implementation-feasibility.md',
    });
    return results;
  }

  const statskontoretRow =
    /^\|\s*\*{0,2}Statskontoret relevance\*{0,2}\s*\|\s*([^|]*statskontoret\.se[^|]*|[^|]*none found[^|]*)\|/im;

  if (!statskontoretRow.test(content)) {
    results.push({
      checkId: 'statskontoret-evidence',
      passed: false,
      message: "implementation-feasibility.md: names a recognised agency but Statskontoret relevance row lacks a statskontoret.se URL or 'none found'",
      artifact: 'implementation-feasibility.md',
    });
  } else {
    results.push({
      checkId: 'statskontoret-evidence',
      passed: true,
      message: 'implementation-feasibility.md: Statskontoret evidence present',
      artifact: 'implementation-feasibility.md',
    });
  }

  return results;
}
