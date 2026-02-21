/**
 * @module Intelligence/PartyAnalysis
 * @description Swedish political party name normalization and mention extraction.
 * Bounded context: Political Entities
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { PartyCode, PartyVariantMap } from './types/party.js';

/**
 * Canonical mapping from party codes to their known name variants.
 * Used for normalizing different textual references to the same party.
 */
export const PARTY_VARIANTS: PartyVariantMap = {
  S: ['Socialdemokraterna', 'S'],
  M: ['Moderaterna', 'M'],
  SD: ['Sverigedemokraterna', 'SD'],
  V: ['Vänsterpartiet', 'V'],
  MP: ['Miljöpartiet', 'MP'],
  C: ['Centerpartiet', 'C'],
  L: ['Liberalerna', 'L'],
  KD: ['Kristdemokraterna', 'KD'],
} as const;

/**
 * Extract unique party mentions from HTML content.
 * Uses Unicode-aware regex boundaries for proper word detection across scripts.
 *
 * @param html - HTML content to search for party references
 * @returns Set of canonical party codes found in the content
 */
export function extractPartyMentions(html: string | null | undefined): Set<PartyCode> {
  const parties = new Set<PartyCode>();

  if (!html) {
    return parties;
  }

  for (const [canonicalCode, variants] of Object.entries(PARTY_VARIANTS) as Array<
    [PartyCode, readonly string[]]
  >) {
    for (const variant of variants) {
      // Escape special regex characters in variant
      const escapedVariant = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Unicode-aware non-letter/non-number boundary for ALL variants.
      // \b doesn't work well with non-ASCII (ä, ö, å) so we use [^\p{L}\p{N}].
      const pattern = new RegExp(
        `(?:^|[^\\p{L}\\p{N}])${escapedVariant}(?=$|[^\\p{L}\\p{N}])`,
        'ui',
      );
      if (pattern.test(html)) {
        parties.add(canonicalCode);
        break;
      }
    }
  }

  return parties;
}
