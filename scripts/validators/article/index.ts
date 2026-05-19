/**
 * @module scripts/validators/article
 * @description Public orchestrator for the aggregated `article.md`
 *              content validator. Each rule lives in `./rules/` (or in
 *              `./slug.ts` / `./source-mermaid.ts` for the cross-cutting
 *              helpers) and exposes a `check*` function returning
 *              `ArticleViolation[]`. The orchestrator simply
 *              concatenates — no rule logic is duplicated here.
 *
 *              Rule census: replaces `scripts/validate-article.ts`
 *              lines 498–748 (`validateArticle`). All public exports
 *              consumed by `tests/validate-article.test.ts` and the
 *              CLI shim are preserved.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile } from 'node:fs/promises';
import { basename, dirname, relative } from 'node:path';

import { REPO_ROOT, type ArticleViolation } from './types.js';
import { checkHeadingSlugs } from './slug.js';
import { checkBluf } from './rules/bluf.js';
import { checkFooterMarkers } from './rules/footer.js';
import { checkLandmarks } from './rules/landmarks.js';
import { checkUnclosedMermaidFences } from './rules/mermaid-fences.js';
import { checkPerDocument } from './rules/per-document.js';
import { checkPlaceholders } from './rules/placeholders.js';
import { checkBannedPhrases } from './rules/banned-phrases.js';
import { checkCitationDensity } from './rules/citation-density.js';
import { checkStaleProvenance } from './rules/stale-provenance.js';
import { checkRequiredArtifacts } from './rules/required-artifacts.js';
import { checkMermaidCoverage } from './source-mermaid.js';

/**
 * Validate a single aggregated `article.md`. Returns the list of
 * violations (empty array means the article passes).
 *
 * Rule execution order mirrors the original `validate-article.ts`
 * top-to-bottom flow so error messages and CI output remain stable.
 */
export async function validateArticle(absPath: string): Promise<ArticleViolation[]> {
  const rel = relative(REPO_ROOT, absPath);
  const text = await readFile(absPath, 'utf8');
  const parentDir = dirname(absPath);
  const subfolderName = basename(parentDir);

  return [
    ...checkPlaceholders(rel, text),
    ...checkLandmarks(rel, text),
    ...checkBluf(rel, text),
    ...checkFooterMarkers(rel, text),
    ...checkHeadingSlugs(rel, text),
    ...checkPerDocument(rel, text),
    ...(await checkRequiredArtifacts(rel, parentDir, subfolderName)),
    ...checkBannedPhrases(rel, text),
    ...checkCitationDensity(rel, text, subfolderName),
    ...checkStaleProvenance(rel, text),
    ...checkUnclosedMermaidFences(rel, text),
    ...(await checkMermaidCoverage(rel, text, parentDir)),
  ];
}

// Re-export every public symbol consumed by tests + CLI shim.
export { REPO_ROOT, type ArticleViolation } from './types.js';
export { walk } from './walker.js';
export { permissiveSlug } from './slug.js';
export {
  MAX_BLUF_PROSE_CHARS,
  MIN_BLUF_EVIDENCE_ANCHORS,
  MIN_BLUF_PROSE_CHARS,
  countBlufEvidenceAnchors,
  extractBluf,
} from './rules/bluf.js';
export { FOOTER_MARKER_PATTERNS } from './rules/footer.js';
export { REQUIRED_LANDMARKS } from './rules/landmarks.js';
export {
  countMermaidOpenings,
  findUnclosedMermaidFences,
  type UnclosedMermaidFence,
} from './rules/mermaid-fences.js';
export {
  DOK_ID_TOKEN_RE,
  MIN_PER_DOC_DOK_ID_HITS,
  extractPerDocumentSections,
} from './rules/per-document.js';
export { PLACEHOLDER_PATTERNS, scanPlaceholders } from './rules/placeholders.js';
export {
  loadBannedPhrases,
  resetBannedPhrasesCache,
  scanBannedPhrases,
} from './rules/banned-phrases.js';
export { countArticleEvidenceAnchors } from './rules/evidence-anchors.js';
export { computeCitationDensity, countWords } from './rules/citation-density.js';
export { scanStaleProvenance } from './rules/stale-provenance.js';
export { countSourceArtifactMermaidOpenings } from './source-mermaid.js';
