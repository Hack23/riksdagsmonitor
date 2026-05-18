/**
 * @module scripts/agentic/gate-checks/per-document-coverage
 * @description Check 2 — Per-document coverage (Family E vs manifest).
 *
 * Extracts dok_ids from the data-download-manifest and verifies each has
 * a corresponding analysis document in the `documents/` subdirectory.
 *
 * @see .github/prompts/05-analysis-gate.md §Check 2
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { DOK_ID_PATTERN } from '../artifact-inventory.js';
import type { GateCheckResult } from '../gate-shared/types.js';

/**
 * Extract dok_ids from the data-download-manifest and verify each has
 * a corresponding analysis document in the `documents/` subdirectory.
 */
export async function checkPerDocumentCoverage(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const manifestPath = join(analysisDir, 'data-download-manifest.md');

  if (!existsSync(manifestPath)) {
    return results;
  }

  const content = await readFile(manifestPath, 'utf-8');
  const dokIds = extractDokIds(content);

  if (dokIds.length === 0) {
    results.push({
      checkId: 'per-document-coverage',
      passed: false,
      message: 'Manifest has no dok_id entries',
    });
    return results;
  }

  const documentsDir = join(analysisDir, 'documents');
  for (const dokId of dokIds) {
    const found = hasDocumentAnalysis(documentsDir, dokId);
    results.push({
      checkId: 'per-document-coverage',
      passed: found,
      message: found
        ? `Document analysis found for ${dokId}`
        : `documents/${dokId}.md or documents/${dokId}-analysis.md missing (any case)`,
      artifact: `documents/${dokId}-analysis.md`,
    });
  }

  return results;
}

/**
 * Extract unique dok_ids from markdown content.
 */
export function extractDokIds(content: string): string[] {
  const globalPattern = new RegExp(DOK_ID_PATTERN.source, 'g');
  const matches = content.match(globalPattern);
  if (!matches) return [];
  return [...new Set(matches)];
}

/**
 * Check if a document analysis file exists and is non-empty (any case variant).
 * Mirrors the prompt gate's `-s` check (file exists AND size > 0).
 */
function hasDocumentAnalysis(documentsDir: string, dokId: string): boolean {
  const variants = [
    `${dokId}.md`,
    `${dokId}-analysis.md`,
    `${dokId.toLowerCase()}.md`,
    `${dokId.toLowerCase()}-analysis.md`,
  ];
  return variants.some((v) => {
    const p = join(documentsDir, v);
    return existsSync(p) && statSync(p).size > 0;
  });
}
