/**
 * @module scripts/agentic/gate-checks/methodology-reflection
 * @description Check 7e — Validate methodology-reflection.md contains the
 *              full Pass-2 audit section contract (ICD 203 audit, DA KJ
 *              coverage matrix with 100% coverage, confidence distribution
 *              with filled Posterior column, Lagrådet/Statskontoret/SKR
 *              tracking, sibling-folder ingestion record, unified re-run
 *              log schema, banned-phrase audit grid, Pass 1 → Pass 2 delta
 *              table, improvement-opportunities → PIR roll-forward).
 *
 * @see .github/prompts/05-analysis-gate.md §Check 7 (methodology-reflection)
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

export async function checkMethodologyReflection(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'methodology-reflection.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');

  const kjCoverageSection = extractSection(
    content,
    /Devil'?s[-\s]Advocate\s+Key\s+Judgment\s+Coverage\s+Matrix/i,
  );
  const confidenceSection = extractSection(
    content,
    /Confidence\s+Distribution\s+by\s+Key\s+Judgment/i,
  );
  const reRunSection = extractSection(content, /Re[-\s]?run\s+Log/i);

  // Re-run log unified column schema — must appear as a table header row
  // inside the Re-run Log section, not just anywhere in the file.
  const reRunColumnHeaderPresent = reRunSection.split('\n').some((line) => {
    if (!line.trim().startsWith('|')) return false;
    const lower = line.toLowerCase();
    return (
      lower.includes('run_id') &&
      lower.includes('attempt') &&
      /new[\s_]+dok_ids/.test(lower) &&
      /artifacts[\s_]+extended/.test(lower) &&
      /flags[\s_]+closed/.test(lower) &&
      /vintage[\s_]+refresh/.test(lower)
    );
  });

  // KJ-coverage content quality — every KJ row must be ✅ and CLOSED.
  const kjCoverageRows = kjCoverageSection
    .split('\n')
    .filter((line) => /^\|\s*KJ[-\s]?\d/i.test(line.trim()));
  const kjCoverageHasUncovered = kjCoverageRows.some((row) => /❌/.test(row));
  const kjCoverageHasOpenStatus = kjCoverageRows.some((row) =>
    /\bOPEN\b/i.test(row),
  );
  const kjCoverageRowsPresent = kjCoverageRows.length > 0;

  // Posterior content quality — every KJ row must have a filled Posterior
  // value (no `[REQUIRED]` placeholder, no empty cell).
  const confidencePosteriorFilledForAllKjs = checkConfidencePosteriorColumn(
    confidenceSection,
  );

  const requiredSectionChecks: Array<{ label: string; present: boolean }> = [
    {
      label: 'ICD 203 audit checklist (## heading)',
      present: hasHeading(content, /ICD\s+203/i),
    },
    {
      label: "Devil's-Advocate KJ coverage matrix (## heading)",
      present: hasHeading(
        content,
        /Devil'?s[-\s]Advocate\s+Key\s+Judgment\s+Coverage\s+Matrix/i,
      ),
    },
    {
      label: "Devil's-Advocate KJ coverage matrix: 100% coverage (no ❌ / OPEN rows)",
      present:
        kjCoverageRowsPresent &&
        !kjCoverageHasUncovered &&
        !kjCoverageHasOpenStatus,
    },
    {
      label: 'Confidence distribution (## heading)',
      present: hasHeading(content, /Confidence\s+Distribution\s+by\s+Key\s+Judgment/i),
    },
    {
      label: 'Confidence distribution: filled Posterior per KJ row',
      present: confidencePosteriorFilledForAllKjs,
    },
    {
      label: 'Lagrådet / Statskontoret / SKR tracking (## heading)',
      present: hasHeading(content, /Lagrådet.*Statskontoret.*SKR/i),
    },
    {
      label: 'Sibling-folder ingestion record (## heading)',
      present: hasHeading(content, /Sibling[-\s]?Folder\s+Ingestion/i),
    },
    {
      label: 'Re-run log (## heading)',
      present: hasHeading(content, /Re[-\s]?run\s+Log/i),
    },
    {
      label: 'Re-run log unified schema (header row inside Re-run Log section)',
      present: reRunColumnHeaderPresent,
    },
    {
      label: 'Banned-phrase audit grid (## heading)',
      present: hasHeading(content, /Banned[-\s]?Phrase\s+Audit/i),
    },
    {
      label: 'Pass 1 → Pass 2 delta table (## heading)',
      present: hasHeading(content, /Pass\s*1.*Pass\s*2.*Delta/i),
    },
    {
      label: 'Improvement opportunities → PIR roll-forward (## heading)',
      present: hasHeading(
        content,
        /Improvement\s+Opportunities.*PIR\s+Roll[-\s]?Forward/i,
      ),
    },
  ];

  const missingSections = requiredSectionChecks
    .filter(({ present }) => !present)
    .map(({ label }) => label);

  if (missingSections.length > 0) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: `methodology-reflection.md: missing required section(s): ${missingSections.join(', ')}`,
      artifact: 'methodology-reflection.md',
    });
  } else {
    results.push({
      checkId: 'family-c-structure',
      passed: true,
      message: 'methodology-reflection.md: all required sections present',
      artifact: 'methodology-reflection.md',
    });
  }

  return results;
}

/**
 * Confidence distribution table audit — every KJ row must have a non-empty
 * Posterior cell (no `[REQUIRED]` placeholder, no dash, no blank).
 */
function checkConfidencePosteriorColumn(confidenceSection: string): boolean {
  const confidenceLines = confidenceSection.split('\n');
  const headerLineIndex = confidenceLines.findIndex(
    (line) => line.trim().startsWith('|') && /posterior/i.test(line),
  );
  let posteriorColumnIndex = -1;
  if (headerLineIndex >= 0) {
    const cells = confidenceLines[headerLineIndex]!
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim().toLowerCase());
    posteriorColumnIndex = cells.findIndex((cell) =>
      cell.includes('posterior'),
    );
  }
  const confidenceKjRows = confidenceLines.filter((line) =>
    /^\|\s*KJ[-\s]?\d/i.test(line.trim()),
  );
  if (confidenceKjRows.length === 0) return false;
  if (posteriorColumnIndex < 0) return false;
  for (const row of confidenceKjRows) {
    const cells = row.split('|').slice(1, -1).map((c) => c.trim());
    const cell = cells[posteriorColumnIndex] ?? '';
    const stripped = cell.replace(/`/g, '').trim();
    if (
      stripped === '' ||
      /^\[\s*REQUIRED\s*\]?$/i.test(stripped) ||
      /^-+$/.test(stripped)
    ) {
      return false;
    }
  }
  return true;
}
