/**
 * @module scripts/validators/executive-brief-translations/extractors/dok-ids
 * @description Extract `dok_id`-style identifiers (e.g. `H901FiU1`,
 *              `H8011AU10`, `HA02UU3`) for parity comparison between
 *              source and translation.
 *
 *              Rule census: extracted from
 *              `scripts/validate-executive-brief-translations.ts` lines
 *              170–176. Logic is byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { stripFencesAndComments } from '../strippers.js';

/** Extract `dok_id`-style identifiers (e.g. `H901FiU1`, `H8011AU10`, `HA02UU3`). */
export function extractDokIds(md: string): Set<string> {
  const stripped = stripFencesAndComments(md);
  // Riksdag dok_id pattern: starts with H, total length 6–12, letters (mixed case) and digits.
  const matches = stripped.match(/\bH[0-9A-Za-z]{4,11}\b/g) ?? [];
  return new Set(matches);
}
