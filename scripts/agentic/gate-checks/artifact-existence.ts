/**
 * @module scripts/agentic/gate-checks/artifact-existence
 * @description Check 1 — Verify all 23 required artifacts exist and are non-empty.
 *
 * @see .github/prompts/05-analysis-gate.md §Check 1
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { REQUIRED_ARTIFACT_FILENAMES } from '../artifact-inventory.js';
import type { GateCheckResult } from '../gate-shared/types.js';

/**
 * Verify all 23 required artifacts exist and are non-empty.
 */
export function checkArtifactExistence(analysisDir: string): GateCheckResult[] {
  const results: GateCheckResult[] = [];
  for (const filename of REQUIRED_ARTIFACT_FILENAMES) {
    const filePath = join(analysisDir, filename);
    if (!existsSync(filePath)) {
      results.push({
        checkId: 'artifact-existence',
        passed: false,
        message: `Missing artifact: ${filename}`,
        artifact: filename,
      });
    } else if (statSync(filePath).size === 0) {
      results.push({
        checkId: 'artifact-existence',
        passed: false,
        message: `Empty artifact (zero bytes): ${filename}`,
        artifact: filename,
      });
    } else {
      results.push({
        checkId: 'artifact-existence',
        passed: true,
        message: `Artifact present: ${filename}`,
        artifact: filename,
      });
    }
  }
  return results;
}
