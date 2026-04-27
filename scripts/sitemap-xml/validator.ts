/**
 * @module Infrastructure/SitemapXml/Validator
 * @category Intelligence Operations / Supporting Infrastructure
 * @name sitemap.xml structural validator
 *
 * @description
 * Cheap structural checks on the generated XML: declaration present,
 * correct sitemap namespace, at least one `<url>` block, at least one
 * `<loc>` tag. Throws a descriptive error on failure so the CLI exits
 * with status 1 in CI.
 *
 * Round-6 split: extracted from `scripts/generate-sitemap.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

/**
 * Validate the structural integrity of a sitemap XML string. Returns
 * `true` on success and throws on the first failed check so callers
 * can rely on a clear stack trace.
 */
export function validateSitemap(xml: string): boolean {
  console.log('✅ Validating sitemap...');

  if (!xml.includes('<?xml version="1.0"')) {
    throw new Error('Invalid XML declaration');
  }

  if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
    throw new Error('Invalid sitemap namespace');
  }

  const urlCount = (xml.match(/<url>/g) || []).length;
  console.log(`  Found ${urlCount} URLs in sitemap`);

  if (urlCount === 0) {
    throw new Error('No URLs in sitemap');
  }

  if (!xml.includes('<loc>')) {
    throw new Error('Missing <loc> tags');
  }

  console.log('  ✅ Sitemap validation passed');
  return true;
}
