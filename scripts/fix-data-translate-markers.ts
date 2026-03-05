/**
 * Script to remove all remaining `data-translate="true"` markers from
 * non-Swedish news articles by applying the `translateSwedishContent()`
 * function from the translation dictionary.
 *
 * Usage: npx tsx scripts/fix-data-translate-markers.ts [--dry-run]
 *
 * What it does:
 * - For each non-SV article containing `data-translate="true"` spans:
 *   1. Attempts dictionary translation of the enclosed Swedish text
 *   2. Removes the `data-translate="true"` attribute (and the span wrapper
 *      when no other attributes remain)
 *   3. Keeps the `lang="sv"` attribute for screen-reader accessibility
 *      when the phrase could not be translated
 *
 * Result: zero `data-translate="true"` markers remain.
 */

import * as fs from 'fs';
import * as path from 'path';

import { translateSwedishContent } from './translation-dictionary.js';
import type { Language } from './types/language.js';

const NEWS_DIR = path.join(process.cwd(), 'news');
const dryRun = process.argv.includes('--dry-run');

const NON_SWEDISH_LANGS: readonly string[] = [
  'en', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
];

function getLanguageFromFilename(filename: string): string | null {
  const match = filename.match(/-([a-z]{2})\.html$/);
  return match ? (match[1] ?? null) : null;
}

function processFile(filepath: string): { modified: boolean; markersBefore: number; markersAfter: number } {
  const filename = path.basename(filepath);
  const lang = getLanguageFromFilename(filename);

  if (!lang || !NON_SWEDISH_LANGS.includes(lang)) {
    return { modified: false, markersBefore: 0, markersAfter: 0 };
  }

  const original = fs.readFileSync(filepath, 'utf-8');

  const markersBefore = (original.match(/data-translate="true"/g) ?? []).length;
  if (markersBefore === 0) {
    return { modified: false, markersBefore: 0, markersAfter: 0 };
  }

  const modified = translateSwedishContent(original, lang as Language);

  const markersAfter = (modified.match(/data-translate="true"/g) ?? []).length;

  if (modified === original) {
    return { modified: false, markersBefore, markersAfter };
  }

  if (!dryRun) {
    fs.writeFileSync(filepath, modified, 'utf-8');
  }

  return { modified: true, markersBefore, markersAfter };
}

// ---------------------------------------------------------------------------
// Main execution
// ---------------------------------------------------------------------------

console.log(`🔄 Removing data-translate="true" markers from non-Swedish articles (${dryRun ? 'DRY RUN' : 'LIVE'})...\n`);

const files = fs.readdirSync(NEWS_DIR)
  .filter(f => f.endsWith('.html'))
  .sort();

let modifiedCount = 0;
let skippedCount = 0;
let totalMarkersBefore = 0;
let totalMarkersAfter = 0;
const langStats: Record<string, { files: number; markersBefore: number; markersAfter: number }> = {};

for (const file of files) {
  const filepath = path.join(NEWS_DIR, file);
  const lang = getLanguageFromFilename(file);
  const result = processFile(filepath);

  totalMarkersBefore += result.markersBefore;
  totalMarkersAfter += result.markersAfter;

  if (result.modified) {
    modifiedCount++;
    if (lang) {
      if (!langStats[lang]) langStats[lang] = { files: 0, markersBefore: 0, markersAfter: 0 };
      langStats[lang].files++;
      langStats[lang].markersBefore += result.markersBefore;
      langStats[lang].markersAfter += result.markersAfter;
    }
    if (dryRun) {
      console.log(`  📝 Would modify: ${file} (${result.markersBefore} markers → ${result.markersAfter})`);
    }
  } else {
    skippedCount++;
  }
}

console.log(`\n✅ Done!`);
console.log(`  Modified: ${modifiedCount} files`);
console.log(`  Skipped: ${skippedCount} files (no changes needed)`);
console.log(`  Markers before: ${totalMarkersBefore}`);
console.log(`  Markers after:  ${totalMarkersAfter}`);

console.log(`\n📊 Changes by language:`);
for (const [lang, stats] of Object.entries(langStats).sort()) {
  console.log(`  ${lang}: ${stats.files} files, ${stats.markersBefore} markers removed (${stats.markersAfter} remaining)`);
}

if (totalMarkersAfter > 0) {
  console.log(`\n⚠️  ${totalMarkersAfter} markers could not be removed (check TRANSLATABLE_SV_SPAN_REGEX coverage).`);
} else {
  console.log(`\n✅ All data-translate="true" markers removed from non-Swedish articles.`);
}
