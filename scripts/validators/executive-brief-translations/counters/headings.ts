/**
 * @module scripts/validators/executive-brief-translations/counters/headings
 * @description Count `#`-style headings (any depth) outside fenced
 *              code blocks.
 *
 *              Rule census: extracted from
 *              `scripts/validate-executive-brief-translations.ts` lines
 *              142–147. Logic is byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { stripFencesAndComments } from '../strippers.js';

/** Count `#`-style headings in markdown (any depth). Ignores headings inside fenced blocks. */
export function countHeadings(md: string): number {
  const stripped = stripFencesAndComments(md);
  const lines = stripped.split('\n');
  return lines.filter((l) => /^#{1,6}\s+\S/.test(l)).length;
}
