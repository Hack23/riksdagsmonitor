/**
 * @module Intelligence/PartyAnalysis
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Party Variants - Political Party Name Normalization Framework
 * 
 * @description
 * Essential party name normalization utility providing canonical mappings of Swedish
 * political party names to their abbreviated codes. Prevents double-counting and
 * analytical bias when multiple party name variants appear in the same content.
 * Critical infrastructure for accurate party perspective analysis and coalition dynamics tracking.
 * 
 * Political Party Context (Swedish Riksdag - 8 parties):
 * - Socialdemokraterna (S): Left-wing social democratic party
 * - Moderaterna (M): Right-wing conservative/liberal party
 * - Sverigedemokraterna (SD): Right-wing populist/nationalist party
 * - Vänsterpartiet (V): Far-left communist party
 * - Miljöpartiet (MP): Green party (left-wing)
 * - Centerpartiet (C): Centrist/rural representation party
 * - Liberalerna (L): Classical liberal party
 * - Kristdemokraterna (KD): Christian democratic party
 * 
 * Party Naming Challenges:
 * Articles often reference parties by multiple name variants (full Swedish name,
 * English translation, formal abbreviation). Example: "Moderaterna" = "Moderate Party" = "M".
 * Without normalization, party mention counting becomes inaccurate, leading to:
 * - Overstated party perspective counts (same party counted multiple times)
 * - Analytical bias (some parties may use translated names more frequently)
 * - Quality metrics misalignment (perspective diversity falsely inflated)
 * 
 * Normalization Strategy:
 * - Maps all party name variants to single canonical party code (S, M, SD, V, MP, C, L, KD)
 * - Prevents double-counting when both full names and abbreviations appear
 * - Ensures consistent party perspective analysis across content
 * - Enables reliable coalition analysis based on party groupings
 * 
 * Core Data Structure:
 * PARTY_VARIANTS object maps canonical codes to arrays of name variants:
 * {
 *   'S': ['Socialdemokraterna', 'S'],
 *   'M': ['Moderaterna', 'M'],
 *   'SD': ['Sverigedemokraterna', 'SD'],
 *   // ... etc for all 8 parties
 * }
 * 
 * Text Matching Implementation:
 * extractPartyMentions() function implements robust text search:
 * - Uses Unicode-aware regex boundaries (\p{L}\p{N}) for proper word detection
 * - Handles non-ASCII characters: ä, ö, å in Swedish names
 * - Prevents false matches: searching "M" doesn't match "Moderaterna"'s M
 * - Searches HTML content directly (works with generated articles)
 * - Returns Set<string> of canonical party codes found
 * 
 * Integration Usage Across Codebase:
 * - article-quality-enhancer.js: Counts unique parties for perspective diversity metric
 * - validate-evening-analysis.js: Extracts party mentions for analytical scoring
 * - news-evening-analysis.test.js: Tests party mention extraction accuracy
 * - Intelligence dashboards: Party affiliation tracking and coalition analysis
 * 
 * Intelligence Applications:
 * - Coalition dynamics analysis: Track party alliances and opposition blocs
 * - Perspective diversity measurement: Ensure balanced party coverage
 * - Political polarization tracking: Identify party positioning shifts
 * - Media bias detection: Identify systematic under/over-coverage of parties
 * - Electoral analysis: Monitor party popularity and messaging
 * 
 * Unicode Handling for Swedish Characters:
 * Pattern: (?:^|[^\p{L}\p{N}])VARIANT(?=$|[^\p{L}\p{N}])
 * - \p{L}: Unicode letter (handles ä, ö, å, and all other scripts)
 * - \p{N}: Unicode number
 * - Prevents matching party codes inside word boundaries
 * - Works across all languages despite Swedish character specifics
 * 
 * Boolean Flags for Language Variety:
 * If future expansion includes English translations or other languages:
 * - S: ['Socialdemokraterna', 'S', 'Social Democrats'] (if needed)
 * - M: ['Moderaterna', 'M', 'Moderate Party']
 * - Extension maintains backward compatibility
 * 
 * Data Protection:
 * - No personal identifiers stored or processed
 * - Operates on published party entity references only
 * - Complies with GDPR by not identifying individual politicians
 * - Audit trail of political party mentions in articles
 * 
 * ISMS Compliance:
 * - ISO 27001:2022 A.12.2.1 (change log maintenance - version control)
 * - NIST CSF 2.0 PR.DS-1 (data classification - public content)
 * 
 * Functions:
 * - extractPartyMentions(html): Searches HTML content for party references
 *   Input: HTML string from article
 *   Output: Set<string> of canonical party codes (e.g., new Set(['S', 'M', 'SD']))
 * 
 * Usage Example:
 *   import { extractPartyMentions } from './party-variants.js';
 *   const parties = extractPartyMentions(articleHtml);
 *   const uniquePartyCount = parties.size;  // 0-8
 *   const hasBalancedCoverage = uniquePartyCount >= 4;  // Min 4 parties threshold
 * 
 * @intelligence Core utility for accurate party perspective analysis
 * @osint Analyzes public political party references from news coverage
 * @risk Inaccurate normalization leads to biased party perspective counts
 * @gdpr No personal data processing (political entity references only)
 * @security Case-sensitive matching for proper abbreviation detection
 * 
 * @author Hack23 AB (Political Intelligence Team)
 * @license Apache-2.0
 * @version 1.8.0
 * @see article-quality-enhancer.js (primary consumer)
 * @see validate-evening-analysis.js (party mention validation)
 * @see Swedish political party system structure
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
