/**
 * @module scripts/validators/executive-brief-translations/counters/words
 * @description Top-level word count for executive-brief translations
 *              (rough: split on whitespace after stripping fences/comments).
 *
 *              Rule census: extracted from
 *              `scripts/validate-executive-brief-translations.ts` lines
 *              189–193. Logic is byte-identical to the original.
 *
 *              NOTE: This is the executive-brief-flavoured `countWords`
 *              and differs from `scripts/validators/article/rules/citation-density`
 *              `countWords` — the article variant strips additional
 *              markdown (links, tables, blockquotes) because it feeds
 *              the citation-density ratio rather than parity comparisons.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { stripFencesAndComments } from '../strippers.js';

/** Top-level word count (rough: split on whitespace after stripping fences/comments). */
export function countWords(md: string): number {
  const stripped = stripFencesAndComments(md);
  return stripped.split(/\s+/).filter((w) => /\p{L}|\p{N}/u.test(w)).length;
}
