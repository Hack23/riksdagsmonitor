/**
 * @module scripts/agentic/gate-checks/devils-advocate
 * @description Check 7d — Validate devils-advocate.md (≥3 competing
 *              hypotheses + KJ Coverage Matrix completeness).
 *
 * @see .github/prompts/05-analysis-gate.md §Check 7 (devils-advocate)
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  extractSection,
  hasHeading,
} from '../gate-shared/markdown-helpers.js';
import type { GateCheckResult } from '../gate-shared/types.js';

/**
 * Check devils-advocate.md for ≥3 competing hypotheses and the KJ
 * Coverage Matrix (mandatory in the template).
 */
export async function checkDevilsAdvocate(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'devils-advocate.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');
  const hyMatches = content.match(
    /^#{2,4}\s*(Hypothesis|H[0-9]+\s*[:.—-])/gm,
  );
  const count = hyMatches ? hyMatches.length : 0;

  if (count < 3) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: `devils-advocate.md: fewer than 3 competing hypotheses (found ${count})`,
      artifact: 'devils-advocate.md',
    });
  } else {
    results.push({
      checkId: 'family-c-structure',
      passed: true,
      message: `devils-advocate.md: ${count} hypotheses found`,
      artifact: 'devils-advocate.md',
    });
  }

  // KJ Coverage Matrix enforcement — the template documents this as a
  // required gate; verify the matching ## heading and that every KJ row is
  // covered (no ❌ markers on KJ rows).
  const kjMatrixHeadingPresent = hasHeading(
    content,
    /Key\s+Judgment\s+Coverage\s+Matrix/i,
  );
  if (!kjMatrixHeadingPresent) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: "devils-advocate.md: missing '## Key Judgment Coverage Matrix' section",
      artifact: 'devils-advocate.md',
    });
    return results;
  }

  const matrixSection = extractSection(
    content,
    /Key\s+Judgment\s+Coverage\s+Matrix/i,
  );
  const kjRows = matrixSection
    .split('\n')
    .filter((line) => /^\|\s*KJ[-\s]?\d/i.test(line.trim()));
  const uncoveredRow = kjRows.find((row) => /❌/.test(row));
  if (kjRows.length === 0) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: 'devils-advocate.md: KJ Coverage Matrix has no KJ rows (expected ≥1 row mapping each intelligence-assessment KJ to a hypothesis)',
      artifact: 'devils-advocate.md',
    });
  } else if (uncoveredRow) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: 'devils-advocate.md: KJ Coverage Matrix has ❌ row(s); coverage must be 100%',
      artifact: 'devils-advocate.md',
    });
  } else {
    results.push({
      checkId: 'family-c-structure',
      passed: true,
      message: `devils-advocate.md: KJ Coverage Matrix has ${kjRows.length} covered KJ row(s)`,
      artifact: 'devils-advocate.md',
    });
  }

  return results;
}
