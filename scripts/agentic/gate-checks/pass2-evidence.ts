/**
 * @module scripts/agentic/gate-checks/pass2-evidence
 * @description Check 6 — Verify that Pass-2 iteration was performed on
 *              each artifact: either a `pass1/` snapshot exists on disk
 *              that differs from the current file, OR the file's mtime is
 *              at least 180 s after its birth time.
 *
 * @see .github/prompts/05-analysis-gate.md §Check 6
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { PASS2_REQUIRED_ARTIFACTS } from '../artifact-inventory.js';
import type { GateCheckResult } from '../gate-shared/types.js';

/**
 * Minimum mtime delta (ms) from birth time that constitutes evidence of a
 * second-pass edit (180 seconds = 3 minutes, matching the bash gate
 * threshold in `05-analysis-gate.md §Check 6`).
 */
export const PASS2_MTIME_THRESHOLD_MS = 180_000;

/**
 * Verify that Pass-2 iteration was performed on each artifact. The
 * `pass1/` snapshot check is the preferred mechanism; the mtime-vs-birth
 * fallback exists because Linux birth time may not be reliable.
 */
export async function checkPass2Evidence(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const pass1Dir = join(analysisDir, 'pass1');

  for (const filename of PASS2_REQUIRED_ARTIFACTS) {
    const filePath = join(analysisDir, filename);
    if (!existsSync(filePath)) continue;

    let pass2Done = false;

    const pass1Path = join(pass1Dir, filename);
    if (existsSync(pass1Path)) {
      const [current, snapshot] = await Promise.all([
        readFile(filePath, 'utf-8'),
        readFile(pass1Path, 'utf-8'),
      ]);
      if (current !== snapshot) {
        pass2Done = true;
      }
    }

    if (!pass2Done) {
      const fileStat = await stat(filePath);
      const birthtimeMs = fileStat.birthtimeMs;
      const mtimeMs = fileStat.mtimeMs;
      if (birthtimeMs > 0 && mtimeMs >= birthtimeMs + PASS2_MTIME_THRESHOLD_MS) {
        pass2Done = true;
      }
    }

    if (!pass2Done) {
      results.push({
        checkId: 'pass2-evidence',
        passed: false,
        message: `${filename}: Pass-2 evidence missing (mtime < birth+180s and no differing pass1/ snapshot)`,
        artifact: filename,
      });
    } else {
      results.push({
        checkId: 'pass2-evidence',
        passed: true,
        message: `${filename}: Pass-2 evidence confirmed`,
        artifact: filename,
      });
    }
  }

  return results;
}
