/**
 * @module Validation/TranslationQuality
 * @category Validation
 *
 * @title News Article Translation Completeness Validator
 *
 * @description
 * Validates that news articles published in non-Swedish languages are
 * fully translated, preventing partially-translated articles from publication.
 *
 * @author Hack23 AB (Multilingual Intelligence & Quality Assurance)
 * @license Apache-2.0
 * @version 2.0.0
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

import type { Language } from './types/language.js';

// ---------------------------------------------------------------------------
// Terminal colour codes
// ---------------------------------------------------------------------------

interface Colors {
  readonly reset: string;
  readonly green: string;
  readonly red: string;
  readonly yellow: string;
  readonly cyan: string;
  readonly bold: string;
}

const colors: Colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Language codes to check (exclude Swedish)
const NON_SWEDISH_LANGS: readonly Language[] = [
  'en', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckResultPassed {
  readonly passed: true;
  readonly error?: undefined;
  readonly markerCount?: undefined;
  readonly samples?: undefined;
}

interface CheckResultFailed {
  readonly passed: false;
  readonly markerCount: number;
  readonly samples: string[];
  readonly error?: undefined;
}

interface CheckResultError {
  readonly passed?: undefined;
  readonly error: string;
  readonly markerCount?: undefined;
  readonly samples?: undefined;
}

type CheckResult = CheckResultPassed | CheckResultFailed | CheckResultError;

interface FailedFileRecord {
  readonly filename: string;
  readonly lang: string;
  readonly count: number;
  readonly samples: string[];
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Check if a file contains untranslated Swedish content markers.
 */
function checkFileForUntranslatedContent(filepath: string): CheckResult {
  try {
    const content = readFileSync(filepath, 'utf-8');
    const markers = content.match(/data-translate="true"/g);

    if (!markers) {
      return { passed: true };
    }

    // Extract samples of untranslated content
    const samples: string[] = [];
    const sampleRegex = /<span data-translate="true"[^>]*>([^<]{0,80})/g;
    let match: RegExpExecArray | null;
    let count = 0;

    while ((match = sampleRegex.exec(content)) !== null && count < 3) {
      const raw = match[1] ?? '';
      const text = raw.length >= 80 ? raw + '...' : raw;
      samples.push(text);
      count++;
    }

    return {
      passed: false,
      markerCount: markers.length,
      samples,
    };
  } catch (error: unknown) {
    return {
      error: (error as Error).message,
    };
  }
}

/**
 * Get all HTML files in a directory (recursive).
 */
function getAllHtmlFiles(dir: string): string[] {
  const files: string[] = [];

  try {
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...getAllHtmlFiles(fullPath));
      } else if (item.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  } catch (error: unknown) {
    console.error(
      `${colors.red}Error reading directory ${dir}: ${(error as Error).message}${colors.reset}`,
    );
  }

  return files;
}

/**
 * Determine language code from filename.
 */
function getLanguageCode(filename: string): string | null {
  const match = filename.match(/-([a-z]{2})\.html$/);
  return match ? match[1] ?? null : null;
}

/**
 * Main validation function.
 */
function validateNewsTranslations(directory: string = 'news'): number {
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
  const failedFiles: FailedFileRecord[] = [];

  for (const filepath of nonSwedishFiles) {
    const filename = basename(filepath);
    const lang = getLanguageCode(filename);
    const result = checkFileForUntranslatedContent(filepath);

    if (result.error !== undefined) {
      console.log(`${colors.red}ERROR: ${filename}${colors.reset}`);
      console.log(`  ${colors.red}${result.error}${colors.reset}\n`);
      totalErrors++;
    } else if (result.passed) {
      console.log(`${colors.green}✓ ${filename} (${(lang ?? '').toUpperCase()})${colors.reset}`);
      totalPassed++;
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

  // Summary
  console.log(`\n${colors.bold}${colors.cyan}===========================================`);
  console.log(`Summary`);
  console.log(`===========================================${colors.reset}\n`);
  console.log(`Total articles checked: ${nonSwedishFiles.length}`);
  console.log(`${colors.green}✓ Fully translated: ${totalPassed}${colors.reset}`);
  console.log(
    `${colors.red}✗ Contains untranslated content: ${totalFailed}${colors.reset}`,
  );

  if (totalErrors > 0) {
    console.log(`${colors.red}✗ Errors: ${totalErrors}${colors.reset}`);
  }

  if (totalFailed > 0) {
    console.log(`\n${colors.bold}${colors.red}❌ VALIDATION FAILED${colors.reset}`);
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

    return 1;
  } else {
    console.log(
      `\n${colors.bold}${colors.green}✅ ALL ARTICLES FULLY TRANSLATED${colors.reset}\n`,
    );
    return 0;
  }
}

// Run validation
const directory: string = process.argv[2] || 'news';
const exitCode: number = validateNewsTranslations(directory);

process.exit(exitCode);
