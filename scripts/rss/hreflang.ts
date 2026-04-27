/**
 * @module Infrastructure/Rss/Hreflang
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Hreflang code mapping
 *
 * @description
 * Pure helper that maps file-suffix language codes (the suffix used in
 * filenames like `…_no.html`) to BCP-47 hreflang codes (Norwegian uses
 * `nb`). All other codes pass through unchanged. Identical contract to
 * `sitemap-xml/hreflang.ts` — the duplication keeps each bounded
 * context self-contained.
 *
 * Round-6 split: extracted from `scripts/generate-rss.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

/**
 * Map a file-suffix language code to its BCP-47 hreflang code.
 * Norwegian files use the suffix `no` but hreflang should be `nb` (Bokmål).
 */
export function hreflangCode(lang: string): string {
  if (lang === 'no') return 'nb';
  return lang;
}
