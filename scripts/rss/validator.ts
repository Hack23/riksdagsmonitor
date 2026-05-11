/**
 * @module Infrastructure/Rss/Validator
 * @category Intelligence Operations / Supporting Infrastructure
 * @name rss.xml structural validator
 *
 * @description
 * Cheap structural checks on the generated XML: declaration, RSS 2.0
 * version, `<channel>`, mandatory channel children, item count, and
 * per-item presence of `<title>`, `<link>`, `<guid>`. Throws a
 * descriptive error on the first failed check so the CLI exits with
 * status 1 in CI.
 *
 * Round-6 split: extracted from `scripts/generate-rss.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

/**
 * Validate the structural integrity of an RSS XML string. Returns
 * `true` on success and throws on the first failed check.
 */
export function validateRss(xml: string): boolean {
  console.log('✅ Validating RSS feed...');

  if (!xml.includes('<?xml version="1.0"')) {
    throw new Error('Invalid XML declaration');
  }

  if (!xml.includes('<rss version="2.0"')) {
    throw new Error('Missing RSS 2.0 version');
  }

  if (!xml.includes('<channel>')) {
    throw new Error('Missing <channel> element');
  }

  if (!xml.includes('<title>')) {
    throw new Error('Missing <title> element');
  }

  if (!xml.includes('<link>')) {
    throw new Error('Missing <link> element');
  }

  if (!xml.includes('<description>')) {
    throw new Error('Missing <description> element');
  }

  const itemCount = (xml.match(/<item>/g) || []).length;
  console.log(`  Found ${itemCount} items in RSS feed`);

  if (itemCount === 0) {
    throw new Error('No items in RSS feed');
  }

  const titleCount = (xml.match(/<item>[\s\S]*?<title>/g) || []).length;
  const linkCount = (xml.match(/<item>[\s\S]*?<link>/g) || []).length;
  const guidCount = (xml.match(/<guid/g) || []).length;

  if (titleCount !== itemCount) {
    throw new Error(`Not all items have <title> tags (${titleCount}/${itemCount})`);
  }

  if (linkCount !== itemCount) {
    throw new Error(`Not all items have <link> tags (${linkCount}/${itemCount})`);
  }

  if (guidCount !== itemCount) {
    throw new Error(`Not all items have <guid> tags (${guidCount}/${itemCount})`);
  }

  console.log('  ✅ RSS feed validation passed');
  return true;
}
