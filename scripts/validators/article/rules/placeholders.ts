/**
 * @module scripts/validators/article/rules/placeholders
 * @description Placeholder-pattern scanner — detects template tokens
 *              that the AI agent must replace during Pass-1 / Pass-2.
 *
 *              Rule census: extracted from
 *              `scripts/validate-article.ts` lines 67–73
 *              (`PLACEHOLDER_PATTERNS`). Logic is byte-identical to the
 *              original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Placeholder strings that templates contain on disk and that the AI
 * agent is instructed to replace during Pass-1 / Pass-2. Any of these
 * surviving in the aggregated article means the agent skipped the
 * substitution and the article is not publishable.
 *
 * Keep this list in sync with the markers used in
 * `analysis/templates/*.md`.
 */
export const PLACEHOLDER_PATTERNS: readonly RegExp[] = [
  /\[REQUIRED:[^\]]*\]/,
  /AI[_-]MUST[_-]REPLACE/i,
  /\bTBD\b\s*:/,
  /<insert\b[^>]*>/i,
  /\bFILL[_\s]IN\b/i,
];

/** Return every placeholder match in `text`. Returns the matched string for each pattern hit. */
export function scanPlaceholders(text: string): string[] {
  const hits: string[] = [];
  for (const pat of PLACEHOLDER_PATTERNS) {
    const m = text.match(pat);
    if (m) hits.push(m[0]);
  }
  return hits;
}

import type { ArticleViolation } from '../types.js';

/** Emit one `unresolved-placeholder` violation per matched pattern. */
export function checkPlaceholders(rel: string, text: string): ArticleViolation[] {
  const out: ArticleViolation[] = [];
  for (const pat of PLACEHOLDER_PATTERNS) {
    const m = text.match(pat);
    if (m) {
      out.push({
        file: rel,
        code: 'unresolved-placeholder',
        message: `Template placeholder ${JSON.stringify(m[0])} was not replaced during AI-FIRST Pass-2 — see analysis/templates/README.md "Reader-Facing Output Contract".`,
      });
    }
  }
  return out;
}
