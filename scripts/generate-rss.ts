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

import type { Language } from './types/language.js';

import { generateRss, validateRss, getRssArticles } from './rss/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');

/** All supported feed languages. English maps to `rss.xml`; others to `rss_<lang>.xml`. */
const LANGUAGES: readonly Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

/** Resolve the on-disk feed path for a language. */
function feedPath(lang: Language): string {
  return path.join(ROOT_DIR, lang === 'en' ? 'rss.xml' : `rss_${lang}.xml`);
}

console.log('📡 RSS Feed Generation Script');

/**
 * Build, validate, and write `rss.xml` plus one localized `rss_<lang>.xml`
 * per supported language. Returns 0 on success, 1 on failure (matches the
 * legacy CLI exit-code contract).
 */
function main(): number {
  try {
    console.log('🚀 Starting RSS feed generation...\n');

    for (const lang of LANGUAGES) {
      // A localized language may not have any translated articles yet.
      // Skipping keeps the build green and — together with the sitemap's
      // existence checks — ensures we never advertise an empty/missing
      // feed. English always emits to preserve the legacy contract.
      if (lang !== 'en' && getRssArticles(lang).length === 0) {
        console.log(`⏭️  rss_${lang}.xml skipped (no ${lang} articles)`);
        continue;
      }

      const rss = generateRss(lang);
      validateRss(rss);

      const file = feedPath(lang);
      fs.writeFileSync(file, rss, 'utf8');

      const stats = fs.statSync(file);
      console.log(`✅ ${path.basename(file)} written (${(stats.size / 1024).toFixed(2)} KB)`);
    }

    console.log(`\n✅ RSS feeds written to: ${ROOT_DIR}`);
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
