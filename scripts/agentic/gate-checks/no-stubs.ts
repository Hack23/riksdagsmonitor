/**
 * @module scripts/agentic/gate-checks/no-stubs
 * @description Check 3 — No stub placeholders (recursive scan).
 *
 * Scans all markdown files under the analysis directory (recursive,
 * including `documents/` and `pass1/` subdirs) for stub placeholder
 * strings. The canonical gate uses a recursive grep over the entire
 * `$ANALYSIS_DIR`.
 *
 * @see .github/prompts/05-analysis-gate.md §Check 3
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { STUB_PLACEHOLDERS } from '../artifact-inventory.js';
import { collectMdFilesRecursive } from '../gate-shared/file-walkers.js';
import type { GateCheckResult } from '../gate-shared/types.js';

/**
 * Scan all markdown files under the analysis directory for stub
 * placeholder strings.
 */
export async function checkNoStubs(analysisDir: string): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];

  const mdFiles = await collectMdFilesRecursive(analysisDir, '');

  for (const relPath of mdFiles) {
    const filePath = join(analysisDir, relPath);
    const content = await readFile(filePath, 'utf-8');
    for (const stub of STUB_PLACEHOLDERS) {
      if (content.includes(stub)) {
        results.push({
          checkId: 'no-stubs',
          passed: false,
          message: `Stub placeholder "${stub}" found in ${relPath}`,
          artifact: relPath,
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({
      checkId: 'no-stubs',
      passed: true,
      message: 'No stub placeholders detected',
    });
  }

  return results;
}
