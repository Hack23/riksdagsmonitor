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
      
      // For single-letter codes (S, M, V, C, L), use stricter matching to avoid false positives
      // in Swedish names like "Sörling" or words like "USA"
      if (variant.length === 1) {
        // Match only if preceded by whitespace/start and followed by whitespace/punctuation/end
        // This prevents matching 'S' in "Sörling" or 'M' in "MP"
        const pattern = new RegExp(`(?:^|\\s)${escapedVariant}(?:\\s|[,.:;!?]|$)`, 'i');
        if (pattern.test(html)) {
          parties.add(canonicalCode);
          break;
        }
      } else {
        // For multi-letter variants, use Unicode-aware word boundary
        // \b doesn't work well with non-ASCII (ä, ö, å)
        const pattern = new RegExp(`(?:^|\\s|[^\\p{L}\\p{N}])${escapedVariant}(?:$|\\s|[^\\p{L}\\p{N}])`, 'ui');
        if (pattern.test(html)) {
          // Ensure we only count each party once, even if multiple variants appear
          parties.add(canonicalCode);
          break;
        }
      }
    }
  }
  
  return parties;
}
