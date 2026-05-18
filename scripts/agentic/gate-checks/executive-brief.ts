/**
 * @module scripts/agentic/gate-checks/executive-brief
 * @description Check 7a — Validate executive-brief.md for BLUF/Decisions
 *              sections and H1 quality (placeholder, boilerplate, date,
 *              dangling punctuation, renderer-collapse, across-days
 *              uniqueness). The H1 is the SEO `<title>` source across all
 *              14 language variants — shipping a placeholder/boilerplate
 *              heading destroys SERP value via `titleFromBluf()` fallback.
 *
 * H1-specific validators live in `./executive-brief-h1.ts`; this file
 * is the orchestrator that wires them together.
 *
 * @see .github/prompts/05-analysis-gate.md §Check 7 (executive-brief half)
 * @see analysis/methodologies/per-artifact-methodologies.md#executive-brief
 * @see .github/prompts/seo-metadata-contract.md §2 + §6
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { GateCheckResult } from '../gate-shared/types.js';
import {
  checkH1AcrossDaysUniqueness,
  checkH1Boilerplate,
  checkH1Placeholders,
  checkH1RendererCollapse,
  extractExecutiveBriefH1,
} from './executive-brief-h1.js';

export { extractExecutiveBriefH1 } from './executive-brief-h1.js';

/**
 * Check executive-brief.md for BLUF, Decisions sections and H1 quality.
 */
export async function checkExecutiveBrief(
  analysisDir: string,
): Promise<GateCheckResult[]> {
  const results: GateCheckResult[] = [];
  const filePath = join(analysisDir, 'executive-brief.md');
  if (!existsSync(filePath)) return results;

  const content = await readFile(filePath, 'utf-8');

  const hasBluf = /^##\s.*BLUF/m.test(content);
  if (!hasBluf) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: "executive-brief.md: missing '## BLUF' section",
      artifact: 'executive-brief.md',
    });
  }

  const hasDecisions = /^##\s.*(Decision|Decisions\s+This\s+Brief)/m.test(content);
  if (!hasDecisions) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message: "executive-brief.md: missing 'Decisions' section",
      artifact: 'executive-brief.md',
    });
  }

  // Derive the subfolder slug (directory name immediately inside
  // analysis/daily/<date>/) so cleanArticleTitle() can apply the
  // boilerplate-collapse guard with the same rule the renderer uses.
  const analysisDirSegments = analysisDir.split(/[\\/]/).filter(Boolean);
  const subfolder = analysisDirSegments[analysisDirSegments.length - 1] ?? '';
  const h1 = extractExecutiveBriefH1(content);
  if (!h1) {
    results.push({
      checkId: 'family-c-structure',
      passed: false,
      message:
        "executive-brief.md: no '# H1' heading found — the H1 is the SERP <title> source across all 14 languages; add a publishable story-oriented title",
      artifact: 'executive-brief.md',
    });
  } else {
    checkH1Placeholders(h1, results);
    checkH1Boilerplate(h1, results);
    checkH1RendererCollapse(h1, subfolder, results);
    checkH1AcrossDaysUniqueness(h1, analysisDir, subfolder, results);
  }

  if (
    hasBluf &&
    hasDecisions &&
    results.filter((r) => !r.passed && r.artifact === 'executive-brief.md').length === 0
  ) {
    results.push({
      checkId: 'family-c-structure',
      passed: true,
      message: 'executive-brief.md: BLUF, Decisions present; H1 is publishable',
      artifact: 'executive-brief.md',
    });
  }

  return results;
}
