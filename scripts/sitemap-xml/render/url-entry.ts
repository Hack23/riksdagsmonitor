/**
 * @module Infrastructure/SitemapXml/Render/UrlEntry
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Single `<url>` entry XML builder
 *
 * @description
 * Pure string builder for a single `<url>` block including its optional
 * `<xhtml:link rel="alternate">` hreflang siblings. Hreflang codes are
 * normalised through `hreflangCode` so the file-suffix `no` becomes
 * `nb` (Norwegian Bokmål) on the wire.
 *
 * Round-6 split: extracted from `scripts/generate-sitemap.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { hreflangCode } from '../hreflang.js';

const BASE_URL = 'https://riksdagsmonitor.com';

/** One `rel="alternate"` link target keyed by hreflang code. */
export interface HreflangAlternate {
  lang: string;
  href: string;
}

/**
 * Generate XML for a URL entry.
 */
export function generateUrlEntry(
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: string,
  alternates: HreflangAlternate[] = [],
): string {
  let xml = `
<url>
  <loc>${BASE_URL}/${loc}</loc>
  <lastmod>${lastmod}</lastmod>
  <changefreq>${changefreq}</changefreq>
  <priority>${priority}</priority>`;

  alternates.forEach((alt) => {
    xml += `
  <xhtml:link rel="alternate" hreflang="${hreflangCode(alt.lang)}" href="${BASE_URL}/${alt.href}"/>`;
  });

  xml += `
</url>`;

  return xml;
}
