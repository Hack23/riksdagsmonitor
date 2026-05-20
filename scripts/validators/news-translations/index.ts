/**
 * @module scripts/validators/news-translations
 * @description Public orchestrator for the news-translations validator.
 *              Walks `news/`, runs the per-rule scanners against every
 *              non-Swedish HTML file, and prints a coloured summary.
 *
 *              Rule census: extracted from
 *              `scripts/validate-news-translations.ts` lines 451–628
 *              (`validateNewsTranslations`). Re-exports the per-rule
 *              modules so the CLI shim (`scripts/validate-news-translations.ts`)
 *              and `tests/` can keep importing from a single surface.
 *              Logic is byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { basename } from 'path';

import { colors } from './colors.js';
import { getLanguageCode, NON_SWEDISH_LANGS } from './language.js';
import { checkFileForAIMustReplaceMarkers } from './rules/ai-must-replace.js';
import { validateBCP47Consistency } from './rules/bcp47.js';
import { checkBodyContentLeakage } from './rules/body-leakage.js';
import { checkFileForUntranslatedContent } from './rules/untranslated.js';
import type { AIMarkerFileRecord, ContentLeakageRecord, FailedFileRecord } from './types.js';
import { deriveEnSourcePath, getAllHtmlFiles } from './walker.js';

/**
 * Main validation function.
 */
export function validateNewsTranslations(directory: string = 'news'): number {
  console.log(`${colors.bold}${colors.cyan}===========================================`);
  console.log(`News Article Translation Validation`);
  console.log(`===========================================${colors.reset}\n`);
  console.log(`Checking directory: ${directory}\n`);

  const htmlFiles = getAllHtmlFiles(directory);
  const nonSwedishFiles = htmlFiles.filter((file) => {
    const lang = getLanguageCode(basename(file));
    return lang !== null && (NON_SWEDISH_LANGS as readonly string[]).includes(lang);
  });

  console.log(`Found ${nonSwedishFiles.length} non-Swedish article files to check\n`);

  let totalPassed = 0;
  let totalFailed = 0;
  let totalErrors = 0;
  let totalBCP47Errors = 0;
  let totalContentLeakage = 0;
  let totalAIMarkers = 0;
  const failedFiles: FailedFileRecord[] = [];
  const leakageFiles: ContentLeakageRecord[] = [];
  const aiMarkerFiles: AIMarkerFileRecord[] = [];

  for (const filepath of nonSwedishFiles) {
    const filename = basename(filepath);
    const lang = getLanguageCode(filename);
    const result = checkFileForUntranslatedContent(filepath);

    const bcp47Errors = lang ? validateBCP47Consistency(filepath, lang) : [];
    if (bcp47Errors.length > 0) {
      totalBCP47Errors += bcp47Errors.length;
      console.log(`${colors.yellow}⚠ BCP-47: ${filename}${colors.reset}`);
      for (const err of bcp47Errors) {
        console.log(`  ${colors.yellow}${err.field}: expected "${err.expected}", got "${err.actual}"${colors.reset}`);
      }
    }

    // AI_MUST_REPLACE marker check — unresolved placeholders in HTML
    // comments are a hard failure (restored from pre-#2582 behaviour).
    const aiMarkerRecord = checkFileForAIMustReplaceMarkers(filepath);
    if (aiMarkerRecord) {
      aiMarkerFiles.push(aiMarkerRecord);
      totalAIMarkers += aiMarkerRecord.markerCount;
      const sampleStr = aiMarkerRecord.samples.length > 0
        ? ` [${aiMarkerRecord.samples.join(', ')}]`
        : '';
      console.log(`${colors.red}✗ AI_MUST_REPLACE: ${filename} — ${aiMarkerRecord.markerCount} unresolved marker(s)${sampleStr}${colors.reset}`);
    }

    let fileLeakage: ContentLeakageRecord | null = null;
    if (lang && lang !== 'en') {
      const enSourcePath = deriveEnSourcePath(filepath);
      fileLeakage = checkBodyContentLeakage(filepath, enSourcePath, lang);
      if (fileLeakage) {
        leakageFiles.push(fileLeakage);
        const paraMsg = fileLeakage.untranslatedParagraphs > 0
          ? `${fileLeakage.untranslatedParagraphs} leaked paragraph(s) (${fileLeakage.percentUntranslated}% of ${fileLeakage.totalParagraphs})`
          : '';
        const phraseMsg = fileLeakage.phraseMatches > 0
          ? `${fileLeakage.phraseMatches} phrase match(es)`
          : '';
        const combined = [paraMsg, phraseMsg].filter(Boolean).join(', ');
        console.log(`${colors.yellow}⚠ Content leakage: ${filename} — ${combined}${colors.reset}`);
        for (const sample of fileLeakage.samples.slice(0, 3)) {
          console.log(`  ${colors.yellow}  ${sample}${colors.reset}`);
        }
      }
    }

    if (result.error !== undefined) {
      console.log(`${colors.red}ERROR: ${filename}${colors.reset}`);
      console.log(`  ${colors.red}${result.error}${colors.reset}\n`);
      totalErrors++;
    } else if (result.passed) {
      // Files with AI_MUST_REPLACE markers are NOT counted as passed —
      // they are reported separately as a hard failure.
      if (!aiMarkerRecord) {
        console.log(`${colors.green}✓ ${filename} (${(lang ?? '').toUpperCase()})${colors.reset}`);
        totalPassed++;
      }
      if (fileLeakage && !aiMarkerRecord) {
        totalContentLeakage++;
      }
    } else {
      console.log(`${colors.red}✗ ${filename} (${(lang ?? '').toUpperCase()})${colors.reset}`);
      console.log(
        `  ${colors.red}Found ${result.markerCount} untranslated marker(s)${colors.reset}`,
      );

      if (result.samples.length > 0) {
        console.log(`  ${colors.yellow}Samples:${colors.reset}`);
        result.samples.forEach((sample, i) => {
          console.log(`    ${i + 1}. "${sample}"`);
        });
      }
      console.log('');

      failedFiles.push({
        filename,
        lang: lang ?? '',
        count: result.markerCount,
        samples: result.samples,
      });
      totalFailed++;
    }
  }

  console.log(`\n${colors.bold}${colors.cyan}===========================================`);
  console.log(`Summary`);
  console.log(`===========================================${colors.reset}\n`);
  console.log(`Total articles checked: ${nonSwedishFiles.length}`);
  if (totalContentLeakage > 0) {
    const fullyClean = totalPassed - totalContentLeakage;
    if (fullyClean > 0) {
      console.log(`${colors.green}✓ Fully translated: ${fullyClean}${colors.reset}`);
    }
    console.log(`${colors.green}✓ Marker check passed (with leakage warnings): ${totalContentLeakage}${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Fully translated: ${totalPassed}${colors.reset}`);
  }
  console.log(
    `${colors.red}✗ Contains untranslated content: ${totalFailed}${colors.reset}`,
  );

  if (totalErrors > 0) {
    console.log(`${colors.red}✗ Errors: ${totalErrors}${colors.reset}`);
  }

  if (totalBCP47Errors > 0) {
    console.log(`${colors.red}✗ BCP-47 inconsistencies: ${totalBCP47Errors}${colors.reset}`);
  }

  if (totalAIMarkers > 0) {
    console.log(`${colors.red}✗ Unresolved AI_MUST_REPLACE markers: ${totalAIMarkers} in ${aiMarkerFiles.length} article(s)${colors.reset}`);
  }

  if (totalContentLeakage > 0) {
    console.log(`${colors.yellow}⚠ Articles with EN/SV body content leakage: ${totalContentLeakage}${colors.reset}`);
  }

  const hasHardFailures = totalFailed > 0 || totalBCP47Errors > 0 || aiMarkerFiles.length > 0;

  if (hasHardFailures) {
    console.log(`\n${colors.bold}${colors.red}❌ VALIDATION FAILED${colors.reset}`);

    if (failedFiles.length > 0) {
      console.log(`\nFiles needing translation:\n`);
      failedFiles.forEach(({ filename, count }) => {
        console.log(`  ${colors.red}✗${colors.reset} ${filename} - ${count} markers`);
      });

      console.log(`\n${colors.yellow}Action Required:${colors.reset}`);
      console.log(`1. Open each file listed above`);
      console.log(
        `2. Find all <span data-translate="true" lang="sv">Swedish text</span> elements`,
      );
      console.log(`3. Translate the Swedish text to the article's target language`);
      console.log(`4. Replace the span with plain translated text`);
      console.log(`5. Consult TRANSLATION_GUIDE.md for terminology\n`);
    }

    if (totalBCP47Errors > 0) {
      console.log(`\n${colors.yellow}BCP-47 Action Required:${colors.reset}`);
      console.log(`Ensure html[lang], og:locale, and inLanguage are consistent per article.`);
      console.log(`Norwegian articles must use lang="nb", og:locale="nb_NO", inLanguage="nb".\n`);
    }

    if (aiMarkerFiles.length > 0) {
      console.log(`\n${colors.yellow}AI_MUST_REPLACE Action Required:${colors.reset}`);
      console.log(`The following articles contain unresolved AI_MUST_REPLACE placeholders in HTML comments.`);
      console.log(`The AI translation agent MUST replace these with genuine content in the target language:\n`);
      aiMarkerFiles.forEach(({ filename, markerCount, samples }) => {
        const sampleStr = samples.length > 0 ? ` [${samples.join(', ')}]` : '';
        console.log(`  ${colors.red}✗${colors.reset} ${filename} - ${markerCount} marker(s)${sampleStr}`);
      });
      console.log(`\n${colors.yellow}Fix:${colors.reset}`);
      console.log(`1. Open the source EN article and the translated article`);
      console.log(`2. Find every <!-- AI_MUST_REPLACE: ... --> comment`);
      console.log(`3. Replace the entire comment with genuine analysis in the target language`);
      console.log(`4. Re-run the translation workflow with updated prompts\n`);
    }

    return 1;
  }

  if (leakageFiles.length > 0) {
    console.log(`\n${colors.bold}${colors.yellow}⚠ TRANSLATION QUALITY WARNING${colors.reset}`);
    console.log(`\n${colors.yellow}Articles with untranslated English/Swedish body content:${colors.reset}\n`);
    for (const rec of leakageFiles) {
      const paraMsg = rec.untranslatedParagraphs > 0
        ? `${rec.untranslatedParagraphs} leaked paragraph(s) (${rec.percentUntranslated}% of ${rec.totalParagraphs})`
        : '';
      const phraseMsg = rec.phraseMatches > 0
        ? `${rec.phraseMatches} phrase match(es)`
        : '';
      const combined = [paraMsg, phraseMsg].filter(Boolean).join(', ');
      console.log(`  ${colors.yellow}⚠${colors.reset} ${rec.filename} — ${combined}`);
    }
    console.log(`\n${colors.yellow}Action Required:${colors.reset}`);
    console.log(`1. The translation workflow MUST translate ALL body paragraphs to the target language`);
    console.log(`2. Raw Swedish API text (interpellation/proposition excerpts) must be translated or summarized`);
    console.log(`3. English analytical paragraphs must not appear verbatim in non-EN articles`);
    console.log(`4. Re-run the news-translate workflow with improved prompts\n`);
    return 0;
  }

  console.log(
    `\n${colors.bold}${colors.green}✅ ALL ARTICLES FULLY TRANSLATED${colors.reset}\n`,
  );
  return 0;
}

// Public surface re-exports — consumed by the CLI shim and tests.
export { BCP47_TAG, NON_SWEDISH_LANGS, OG_LOCALE_EXPECTED, getLanguageCode } from './language.js';
export { checkFileForAIMustReplaceMarkers } from './rules/ai-must-replace.js';
export { validateBCP47Consistency, type BCP47Error } from './rules/bcp47.js';
export { checkBodyContentLeakage, extractBodyParagraphs } from './rules/body-leakage.js';
export { checkFileForUntranslatedContent } from './rules/untranslated.js';
export { deriveEnSourcePath, getAllHtmlFiles } from './walker.js';
export type { AIMarkerFileRecord, CheckResult, ContentLeakageRecord, FailedFileRecord } from './types.js';
