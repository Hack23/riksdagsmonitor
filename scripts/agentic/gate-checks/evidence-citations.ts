/**
 * @module scripts/agentic/gate-checks/evidence-citations
 * @description Check 4 — Aggregator that fans out to the SWOT and
 *              significance-scoring evidence checks.
 *
 * @see .github/prompts/05-analysis-gate.md §Check 4
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { checkSwotEvidence } from './swot-evidence.js';
import { checkSignificanceScoringEvidence } from './significance-scoring.js';
import type { GateCheckResult } from '../gate-shared/types.js';

/**
 * Verify that swot-analysis.md and significance-scoring.md contain
 * primary-source evidence (a dok_id or recognised URL host) in each
 * bullet/table row. Mirrors the awk-based gate in `05-analysis-gate.md`
 * (check 4).
 */
export async function checkEvidenceCitations(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];

  results.push(...(await checkSwotEvidence(analysisDir)));
  results.push(...(await checkSignificanceScoringEvidence(analysisDir)));

  return results;
}
