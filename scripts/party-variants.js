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
  
  if (!html) {
    return parties;
  }
  
  for (const [canonicalCode, variants] of Object.entries(PARTY_VARIANTS)) {
    for (const variant of variants) {
      // Escape special regex characters in variant
      const escapedVariant = variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Use Unicode-aware non-letter/non-number boundary for ALL variants.
      // This handles HTML tags (>), parentheses, punctuation, whitespace etc.
      // \b doesn't work well with non-ASCII (ä, ö, å) so we use [^\p{L}\p{N}].
      // For short codes (S, M, V, C, L, MP, SD, KD), this prevents matching
      // inside words like "Sörling", "USA", or "MP" when looking for "M".
      const pattern = new RegExp(
        `(?:^|[^\\p{L}\\p{N}])${escapedVariant}(?=$|[^\\p{L}\\p{N}])`, 'ui'
      );
      if (pattern.test(html)) {
        parties.add(canonicalCode);
        break;
      }
    }
  }
  
  return parties;
}
