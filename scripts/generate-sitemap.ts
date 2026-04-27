/**
 * @module Infrastructure/SitemapXml
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Sitemap XML Generation — CLI shim
 *
 * @description
 * Thin CLI shim that runs `npx tsx scripts/generate-sitemap.ts` to
 * generate `sitemap.xml` for the platform.
 *
 * Round-6 split — the 599-LOC monolith was carved into bounded-context
 * leaf modules under `scripts/sitemap-xml/`. This file is now just (1)
 * the CLI entry point and (2) a re-export shim so anything that
 * imported from `./generate-sitemap.js` keeps working.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 * @version 3.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { generateSitemap, validateSitemap } from './sitemap-xml/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const SITEMAP_FILE = path.join(ROOT_DIR, 'sitemap.xml');

console.log('🗺️ Sitemap Generation Script');

/**
 * Build, validate, and write `sitemap.xml`. Returns 0 on success, 1 on
 * failure (matches the legacy CLI exit-code contract).
 */
function main(): number {
  try {
    console.log('🚀 Starting sitemap generation...\n');

    const sitemap = generateSitemap();
    validateSitemap(sitemap);

    fs.writeFileSync(SITEMAP_FILE, sitemap, 'utf8');
    console.log(`\n✅ Sitemap written to: ${SITEMAP_FILE}`);

    const stats = fs.statSync(SITEMAP_FILE);
    console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);

    return 0;
  } catch (error: unknown) {
    console.error('❌ Error generating sitemap:', (error as Error).message);
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main());
}

// Re-export the public API surface so existing importers keep working.
export { generateSitemap, validateSitemap } from './sitemap-xml/index.js';
