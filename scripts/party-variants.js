/**
 * Swedish Political Party Variants
 * 
 * Maps canonical party codes to their name/abbreviation variants
 * to prevent double-counting when both forms appear in the same article.
 * 
 * Used by:
 * - tests/news-evening-analysis.test.js (extractPartyMentions)
 * - scripts/validate-evening-analysis.js (countPartyPerspectives)
 */

export const PARTY_VARIANTS = {
  S: ['Socialdemokraterna', 'S'],
  M: ['Moderaterna', 'M'],
  SD: ['Sverigedemokraterna', 'SD'],
  V: ['Vänsterpartiet', 'V'],
  MP: ['Miljöpartiet', 'MP'],
  C: ['Centerpartiet', 'C'],
  L: ['Liberalerna', 'L'],
  KD: ['Kristdemokraterna', 'KD']
};

/**
 * Extract unique party mentions from HTML content
 * @param {string} html - HTML content to search
 * @returns {Set<string>} - Set of canonical party codes found
 */
export function extractPartyMentions(html) {
  const parties = new Set();
  
  for (const [canonicalCode, variants] of Object.entries(PARTY_VARIANTS)) {
    for (const variant of variants) {
      const pattern = new RegExp(`\\b${variant}\\b`, 'i');
      if (pattern.test(html)) {
        // Ensure we only count each party once, even if multiple variants appear
        parties.add(canonicalCode);
        break;
      }
    }
  }
  
  return parties;
}
