/**
 * @module scripts/agentic/gate-checks/significance-scoring
 * @description Check 4b — Every ranked bullet / list item / table row
 *              (outside Mermaid) in `significance-scoring.md` must contain
 *              a primary-source citation. Mermaid node labels are also
 *              checked unless they are structural keywords.
 *
 * @see .github/prompts/05-analysis-gate.md §Check 4 (significance half)
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { EVIDENCE_PATTERN } from '../artifact-inventory.js';
import { TABLE_ROW_RE, TABLE_SEP_RE } from '../gate-shared/markdown-helpers.js';
import type { GateCheckResult } from '../gate-shared/types.js';

/** Mermaid structural keywords — these lines are never checked for evidence. */
const MERMAID_STRUCTURAL_RE =
  /^\s*(%%|style\b|classDef\b|class\b|linkStyle\b|subgraph\b|end\b|graph\b|flowchart\b|quadrantChart\b|mindmap\b|timeline\b|journey\b|gantt\b|pie\b|xychart-beta\b|sequenceDiagram\b|stateDiagram(-v2)?\b|erDiagram\b|sankey-beta\b|gitGraph\b|requirementDiagram\b|block-beta\b)/;
/** Mermaid node/label content — lines with bracket/paren/curly-enclosed content indicate node labels. */
const MERMAID_NODE_RE = /\[[^\]\n]+\]|\([^)\n]+\)|\{[^}\n]+\}/;

/**
 * Check significance-scoring.md: every ranked bullet/list item and table
 * row (outside Mermaid) must contain evidence. Mermaid node labels are
 * also checked unless they are structural keywords.
 */
export async function checkSignificanceScoringEvidence(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'significance-scoring.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  let inMermaid = false;
  let tableRowCount = 0;

  for (const line of lines) {
    if (/^```mermaid\s*$/.test(line)) {
      inMermaid = true;
      tableRowCount = 0;
      continue;
    }
    if (inMermaid && /^```\s*$/.test(line)) {
      inMermaid = false;
      continue;
    }

    if (inMermaid) {
      if (MERMAID_STRUCTURAL_RE.test(line)) continue;
      if (MERMAID_NODE_RE.test(line) && !EVIDENCE_PATTERN.test(line)) {
        results.push({
          checkId: 'evidence-citations',
          passed: false,
          message: `significance-scoring.md Mermaid node missing evidence (dok_id or primary-source URL): ${line.trim()}`,
          artifact: 'significance-scoring.md',
        });
      }
      continue;
    }

    if (/^\s*$/.test(line)) {
      tableRowCount = 0;
      continue;
    }

    if (/^\s*([0-9]+\.\s+|[-*]\s+)/.test(line) && !EVIDENCE_PATTERN.test(line)) {
      results.push({
        checkId: 'evidence-citations',
        passed: false,
        message: `significance-scoring.md ranked item missing evidence (dok_id or primary-source URL): ${line.trim()}`,
        artifact: 'significance-scoring.md',
      });
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
          message: `significance-scoring.md ranking table row missing evidence (dok_id or primary-source URL): ${line.trim()}`,
          artifact: 'significance-scoring.md',
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({
      checkId: 'evidence-citations',
      passed: true,
      message: 'significance-scoring.md: evidence citations present',
      artifact: 'significance-scoring.md',
    });
  }

  return results;
}
