/**
 * @module scripts/agentic/gate-checks/mermaid-diagrams
 * @description Check 5 — Verify Mermaid diagrams with colour-coded config
 *              exist in required files.
 *
 * @see .github/prompts/05-analysis-gate.md §Check 5
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { MERMAID_REQUIRED_ARTIFACTS } from '../artifact-inventory.js';
import type { GateCheckResult } from '../gate-shared/types.js';

/**
 * Verify Mermaid diagrams with colour-coded config exist in required files.
 */
export async function checkMermaidDiagrams(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];

  for (const filename of MERMAID_REQUIRED_ARTIFACTS) {
    const filePath = join(analysisDir, filename);
    if (!existsSync(filePath)) continue;

    const content = await readFile(filePath, 'utf-8');

    const hasMermaid = /^```mermaid/m.test(content);
    if (!hasMermaid) {
      results.push({
        checkId: 'mermaid-diagrams',
        passed: false,
        message: `${filename}: missing Mermaid block`,
        artifact: filename,
      });
      continue;
    }

    const hasColourConfig =
      /^\s*style\s+/m.test(content) ||
      /themeVariables/m.test(content) ||
      /%%\{\s*init/m.test(content);

    if (!hasColourConfig) {
      results.push({
        checkId: 'mermaid-diagrams',
        passed: false,
        message: `${filename}: missing Mermaid colour-coded config`,
        artifact: filename,
      });
    } else {
      results.push({
        checkId: 'mermaid-diagrams',
        passed: true,
        message: `${filename}: Mermaid with colour config present`,
        artifact: filename,
      });
    }
  }

  return results;
}
