/**
 * @module scripts/agentic/gate-checks/intelligence-assessment
 * @description Check 7b — Validate intelligence-assessment.md structure
 *              (≥3 Key Judgments, ≥3 confidence labels, PIR reference).
 *
 * @see .github/prompts/05-analysis-gate.md §Check 7 (intelligence-assessment)
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { GateCheckResult } from '../gate-shared/types.js';

/**
 * Check intelligence-assessment.md for Key Judgments, confidence labels, PIR.
 */
export async function checkIntelligenceAssessment(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'intelligence-assessment.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');

  const kjPattern = /(Key\s+Judgment|KJ-?\d+)/;
  const kjLines = content.split('\n').filter((line) => kjPattern.test(line));
  const kjCount = kjLines.length;
  if (kjCount < 3) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: `intelligence-assessment.md: fewer than 3 Key Judgments (found ${kjCount})`,
      artifact: 'intelligence-assessment.md',
    });
  }

  const confMatches = content.match(
    /\b(VERY\s+HIGH|VERY\s+LOW|HIGH|MEDIUM|LOW)\b/g,
  );
  const confCount = confMatches ? confMatches.length : 0;
  if (confCount < 3) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: `intelligence-assessment.md: fewer than 3 confidence labels (found ${confCount})`,
      artifact: 'intelligence-assessment.md',
    });
  }

  const hasPir = /PIR/i.test(content);
  if (!hasPir) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: 'intelligence-assessment.md: no PIR reference',
      artifact: 'intelligence-assessment.md',
    });
  }

  if (kjCount >= 3 && confCount >= 3 && hasPir) {
    results.push({
      checkId: 'family-c-structure',
      passed: true,
      message: 'intelligence-assessment.md: structure valid',
      artifact: 'intelligence-assessment.md',
    });
  }

  return results;
}
