/**
 * @module Infrastructure/SitemapXml/Hreflang
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Hreflang code mapping
 *
 * @description
 * Pure helper that maps a file-suffix language code (the suffix used in
 * filenames like `…_no.html`) to a proper BCP-47 hreflang code (e.g.
 * Norwegian uses the suffix `no` but hreflang must be `nb`).
 *
 * Round-6 split: extracted from `scripts/generate-sitemap.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

/**
 * Map a file-suffix language code to its BCP-47 hreflang code.
 * Norwegian files use the suffix `no` but hreflang should be `nb` (Bokmål).
 * All other codes pass through unchanged.
 */
export function hreflangCode(lang: string): string {
  if (lang === 'no') return 'nb';
  return lang;
}
