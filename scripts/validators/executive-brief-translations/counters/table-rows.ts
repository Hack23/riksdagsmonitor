/**
 * @module scripts/validators/executive-brief-translations/counters/table-rows
 * @description Count Markdown table rows (lines starting with `|`
 *              outside fenced blocks).
 *
 *              Rule census: extracted from
 *              `scripts/validate-executive-brief-translations.ts` lines
 *              163–168. Logic is byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { stripFencesAndComments } from '../strippers.js';

/** Count Markdown table rows (lines starting with `|` outside fenced blocks). */
export function countTableRows(md: string): number {
  const stripped = stripFencesAndComments(md);
  const lines = stripped.split('\n');
  return lines.filter((l) => /^\s*\|.*\|\s*$/.test(l)).length;
}
