/**
 * @module Infrastructure/SitemapHtml
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Sitemap HTML Generation — CLI shim
 *
 * @description
 * Thin CLI shim that runs `npx tsx scripts/generate-sitemap-html.ts` to
 * generate `sitemap_${lang}.html` for each of the 14 supported languages.
 *
 * Round-6 split — the 1041-LOC monolith was carved into bounded-context
 * leaf modules under `scripts/sitemap-html/`. This file is now just (1)
 * the CLI entry point and (2) a re-export shim so anything that imported
 * from `./generate-sitemap-html.js` (notably the
 * political-intelligence + news-indexes generators) keeps working.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 * @version 2.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { Language } from './types/language.js';
import {
  generateSitemapHtml,
  getArticlesByLanguage,
} from './sitemap-html/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');

const LANGUAGES: readonly Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

console.log('🗺️ Sitemap HTML Generation Script');

/**
 * Render every language and write each `sitemap_${lang}.html` file to
 * the repository root. Returns 0 on success, 1 on failure.
 */
function main(): number {
  try {
    console.log('🚀 Starting sitemap HTML generation...\n');

    const articlesByLang = getArticlesByLanguage();
    console.log(`📰 Found articles in ${articlesByLang.size} languages`);

    let generated = 0;
    for (const lang of LANGUAGES) {
      const html = generateSitemapHtml(lang, articlesByLang);
      const fileName = lang === 'en' ? 'sitemap.html' : `sitemap_${lang}.html`;
      const filePath = path.join(ROOT_DIR, fileName);
      fs.writeFileSync(filePath, html, 'utf8');
      const articleCount = (articlesByLang.get(lang) || []).length;
      console.log(`  ✅ Generated ${fileName} (${articleCount} articles)`);
      generated++;
    }

    console.log(`\n✅ Generated ${generated} sitemap HTML files`);
    return 0;
  } catch (error: unknown) {
    console.error('❌ Error generating sitemap HTML:', (error as Error).message);
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main());
}

// Re-export the public API surface so existing importers keep working.
export {
  generateSitemapHtml,
  getArticlesByLanguage,
  escapeHtml,
  LANGUAGE_META,
} from './sitemap-html/index.js';
