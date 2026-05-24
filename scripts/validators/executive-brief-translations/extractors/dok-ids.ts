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
  // Riksdag dok_id pattern: starts with H, total length 6–12, letters and digits,
  // AND must contain at least one digit. The digit requirement matches the canonical
  // `DOK_ID_PATTERN` in scripts/agentic/artifact-inventory.ts and prevents plain
  // English / translated words like "Housing", "Hvilken", "HAUTE", "Holzmasten",
  // "Hallituksen", "Haushaltsst", "Halten" from being misclassified as dok_ids.
  const candidates = stripped.match(/\bH[0-9A-Za-z]{4,11}\b/g) ?? [];
  return new Set(candidates.filter((c) => /[0-9]/.test(c)));
}
