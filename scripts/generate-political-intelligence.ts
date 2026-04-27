/**
 * @module Infrastructure/PoliticalIntelligence
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Political Intelligence Index Generation — Multi-Language CLI
 *
 * @description
 * Thin CLI shim that runs `npx tsx scripts/generate-political-intelligence.ts`
 * to generate a polished `political-intelligence_${lang}.html` page for each
 * of the 14 supported languages.
 *
 * Round-6 split — the 2289-LOC monolith was carved into bounded-context
 * leaf modules under `scripts/political-intelligence/`. This file is now
 * just (1) the CLI entry point and (2) a re-export shim so anything that
 * imported from `./generate-political-intelligence.js` keeps working.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 * @version 2.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { Language } from './types/language.js';
import { generatePoliticalIntelligenceHtml } from './political-intelligence/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');

const LANGUAGES: readonly Language[] = [
  'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
];

console.log('🧠 Political Intelligence HTML Generation');

/**
 * Render every language and write each `political-intelligence_${lang}.html`
 * file to the repository root. Returns 0 on success, 1 on failure.
 */
function main(): number {
  try {
    console.log('🚀 Starting political-intelligence HTML generation...\n');

    let generated = 0;
    for (const lang of LANGUAGES) {
      const html = generatePoliticalIntelligenceHtml(lang);
      const fileName = lang === 'en' ? 'political-intelligence.html' : `political-intelligence_${lang}.html`;
      const filePath = path.join(ROOT_DIR, fileName);
      fs.writeFileSync(filePath, html, 'utf8');
      console.log(`  ✅ Generated ${fileName}`);
      generated++;
    }

    console.log(`\n✅ Generated ${generated} political-intelligence HTML files`);
    return 0;
  } catch (error: unknown) {
    console.error('❌ Error generating political-intelligence HTML:', (error as Error).message);
    if (process.env.DEBUG) console.error((error as Error).stack);
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main());
}

// Re-export the public API surface so existing importers keep working.
export {
  generatePoliticalIntelligenceHtml,
  collectCatalog,
  collectDailyDays,
  METHODOLOGY_META,
  TEMPLATE_META,
  STREAM_META,
  PI_TRANSLATIONS,
} from './political-intelligence/index.js';
