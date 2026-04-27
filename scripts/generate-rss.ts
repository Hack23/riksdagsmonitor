/**
 * @module Infrastructure/Rss
 * @category Intelligence Operations / Supporting Infrastructure
 * @name RSS Feed Generation — CLI shim
 *
 * @description
 * Thin CLI shim that runs `npx tsx scripts/generate-rss.ts` to emit
 * `rss.xml` for the platform.
 *
 * Round-6 split — the 372-LOC monolith was carved into bounded-context
 * leaf modules under `scripts/rss/`. This file is now just (1) the CLI
 * entry point and (2) a re-export shim so anything that imported from
 * `./generate-rss.js` keeps working.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 * @version 2.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { generateRss, validateRss } from './rss/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const RSS_FILE = path.join(ROOT_DIR, 'rss.xml');

console.log('📡 RSS Feed Generation Script');

/**
 * Build, validate, and write `rss.xml`. Returns 0 on success, 1 on
 * failure (matches the legacy CLI exit-code contract).
 */
function main(): number {
  try {
    console.log('🚀 Starting RSS feed generation...\n');

    const rss = generateRss();
    validateRss(rss);

    fs.writeFileSync(RSS_FILE, rss, 'utf8');
    console.log(`\n✅ RSS feed written to: ${RSS_FILE}`);

    const stats = fs.statSync(RSS_FILE);
    console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);

    return 0;
  } catch (error: unknown) {
    console.error('❌ Error generating RSS feed:', (error as Error).message);
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main());
}

// Re-export the public API surface so existing importers keep working.
export {
  generateRss,
  validateRss,
  getRssArticles,
  escapeXml,
} from './rss/index.js';
