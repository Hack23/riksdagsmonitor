/**
 * @module roll-forward-pirs/source-locator
 * @description Walks backwards from a target date to locate the most recent
 * `pir-status.json` for a given cycle.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

import { ANALYSIS_DIR, PIR_FILE } from './constants.js';
import { subtractDays } from './date-helpers.js';

/**
 * Walk backwards up to `maxLookback` days to find the most recent
 * `pir-status.json` for the given cycle.
 */
export function findLatestSource(
  cycle: string,
  beforeDate: string,
  maxLookback = 14,
  analysisDir: string = ANALYSIS_DIR,
): string | null {
  for (let i = 1; i <= maxLookback; i++) {
    const candidate = path.join(
      analysisDir,
      subtractDays(beforeDate, i),
      cycle,
      PIR_FILE,
    );
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}
