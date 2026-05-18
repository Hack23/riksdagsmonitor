/**
 * @module scripts/agentic/gate-checks/swot-evidence
 * @description Check 4a — Every bullet / table row inside a SWOT section of
 *              `swot-analysis.md` must carry a primary-source citation
 *              (a dok_id or a recognised URL host).
 *
 * @see .github/prompts/05-analysis-gate.md §Check 4 (SWOT half)
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { EVIDENCE_PATTERN } from '../artifact-inventory.js';
import {
  ANY_HEADING_RE,
  BULLET_RE,
  TABLE_ROW_RE,
  TABLE_SEP_RE,
} from '../gate-shared/markdown-helpers.js';
import type { GateCheckResult } from '../gate-shared/types.js';

/** SWOT section headings that trigger per-line evidence enforcement. */
const SWOT_SECTION_RE = /^###\s+.*(Strengths|Weaknesses|Opportunities|Threats)\b/i;

/**
 * Check swot-analysis.md: every bullet and table row inside a SWOT section
 * must contain at least one evidence citation.
 */
export async function checkSwotEvidence(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'swot-analysis.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  let currentSection = '';
  let tableRowCount = 0;

  for (const line of lines) {
    if (SWOT_SECTION_RE.test(line)) {
      currentSection = line.trim();
      tableRowCount = 0;
      continue;
    }
    if (ANY_HEADING_RE.test(line)) {
      currentSection = '';
      tableRowCount = 0;
      continue;
    }
    if (!currentSection) continue;

    if (/^\s*$/.test(line)) {
      tableRowCount = 0;
      continue;
    }

    if (BULLET_RE.test(line)) {
      if (!EVIDENCE_PATTERN.test(line)) {
        results.push({
          checkId: 'evidence-citations',
          passed: false,
          message: `swot-analysis.md ${currentSection}: bullet missing evidence (dok_id or primary-source URL): ${line.trim()}`,
          artifact: 'swot-analysis.md',
        });
      }
      continue;
    }

    if (TABLE_ROW_RE.test(line)) {
      if (TABLE_SEP_RE.test(line)) continue;
      tableRowCount++;
      if (tableRowCount === 1) continue;
      if (!EVIDENCE_PATTERN.test(line)) {
        results.push({
          checkId: 'evidence-citations',
          passed: false,
          message: `swot-analysis.md ${currentSection}: table row missing evidence (dok_id or primary-source URL): ${line.trim()}`,
          artifact: 'swot-analysis.md',
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({
      checkId: 'evidence-citations',
      passed: true,
      message: 'swot-analysis.md: evidence citations present',
      artifact: 'swot-analysis.md',
    });
  }

  return results;
}
