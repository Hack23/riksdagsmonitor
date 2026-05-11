/**
 * @module Validation/TranslationQuality
 * @category Validation
 *
 * @title News Article Translation Completeness Validator
 *
 * @description
 * Validates that news articles published in non-Swedish languages are
 * fully translated, preventing partially-translated articles from publication.
 * Checks both data-translate markers AND actual untranslated English/Swedish
 * body content by comparing translated articles against their EN source.
 *
 * @author Hack23 AB (Multilingual Intelligence & Quality Assurance)
 * @license Apache-2.0
 * @version 3.0.0
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, basename, dirname } from 'path';

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

/** Record for files with untranslated body content (English or Swedish leakage) */
interface ContentLeakageRecord {
  readonly filename: string;
  readonly lang: string;
  readonly untranslatedParagraphs: number;
  readonly phraseMatches: number;
  readonly totalParagraphs: number;
  readonly percentUntranslated: number;
  readonly samples: string[];
}

// NOTE: AI_MUST_REPLACE marker handling has been removed in the
// aggregate+render pipeline (scripts/aggregate-analysis.ts → scripts/render-articles.ts).
// Articles are derived 100% from real analysis artifacts under
// analysis/daily/$DATE/$SUB/, so placeholder markers never appear in output.

// ---------------------------------------------------------------------------
// English / Swedish body-content leakage detection
// ---------------------------------------------------------------------------

/**
 * Minimum paragraph character length to consider for leakage checks.
 * Short fragments like dates or single words are skipped.
 */
const MIN_PARAGRAPH_LENGTH = 40;

/**
 * Regex patterns that match opening-through-closing script/style tags,
 * handling whitespace and attributes in closing tags (e.g. </script > or </style\tbar>).
 * Hoisted to module level to avoid repeated compilation per file.
 */
const SCRIPT_TAG_RE = /<script\b[^<]*(?:(?!<\/script\b)<[^<]*)*<\/script\b[^>]*>/gi;
const STYLE_TAG_RE = /<style\b[^<]*(?:(?!<\/style\b)<[^<]*)*<\/style\b[^>]*>/gi;

/**
 * English phrases that MUST NOT appear verbatim in non-EN translations.
 * These indicate untranslated analytical body content.
 */
const ENGLISH_LEAKAGE_PHRASES: readonly RegExp[] = [
  /\bThe pace of activity signals\b/i,
  /\bbroad legislative push\b/i,
  /\bculmination of legislative review\b/i,
  /\bcascade through committee deliberations\b/i,
  /\bStandard parliamentary procedures\b/i,
  /\bWhile parliament deliberates\b/i,
  /\bWhy It Matters\b/i,
  /\bPolicy Context\b/i,
  /\bCoalition Dynamics\b/i,
  /\bStakeholder Impact\b/i,
  /\bForward Indicators\b/i,
  /\bRead the full proposition\b/i,
  /\bLive intelligence platform for Swedish Parliament\b/i,
  /\bSwedish cybersecurity consultancy specializing\b/i,
  /\bAI-generated political intelligence based on OSINT\b/i,
  /\bThe outcomes of these proceedings will cascade\b/i,
  /\bThe legislative activity reflects the ongoing interplay\b/i,
  /\bopposition parties have mounted coordinated responses\b/i,
  /\banalysis confidence:/i,
  /\bThis article is supported by structured political intelligence\b/i,
];

/**
 * Swedish phrases that MUST NOT appear in non-SV articles.
 * These indicate raw API text that was not translated.
 */
const SWEDISH_LEAKAGE_PHRASES: readonly RegExp[] = [
  /Regeringen överlämnar denna/,
  /till riksdagen/,
  /riksdagen\.?\s*Stockholm den/,
  /Riksrevisionens rapport om/,
  /med anledning av prop\./,
  /med anledning av skr\./,
  /Skyddet för yttrandefriheten/,
  /Åtgärder mot social dumpning/,
  /Regeringens integrationspolitik/,
  /Nationell plan för nya datacenter/,
  /Funktionsrätt Sveriges granskning/,
  /Polismyndighetens myndighetsutövning/,
  /Fördelning av ansvar för infrastrukturkostnader/,
  /Statligt säkerställande av bra vård/,
];

/**
 * Extract visible text paragraphs from HTML body content.
 * Strips tags, scripts, styles; returns non-trivial paragraphs.
 *
 * NOTE: This is a best-effort HTML text extraction helper for validator
 * comparisons, not a full HTML parser. Because it is used for leakage
 * detection, extraction correctness matters: missed script/style/tag
 * stripping can reduce comparison accuracy. The iterative approach is
 * intended to remove nested script/style content more completely.
 */
function extractBodyParagraphs(html: string): string[] {
  SCRIPT_TAG_RE.lastIndex = 0;
  STYLE_TAG_RE.lastIndex = 0;

  let cleaned = html;
  let prev = '';
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(SCRIPT_TAG_RE, '');
  }
  prev = '';
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(STYLE_TAG_RE, '');
  }

  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null;
  while ((match = pRegex.exec(cleaned)) !== null) {
    let text = match[1] ?? '';
    let prevText = '';
    while (prevText !== text) {
      prevText = text;
      text = text.replace(/<[^>]*>/g, '');
    }
    text = text.replace(/\s+/g, ' ').trim();
    if (text.length >= MIN_PARAGRAPH_LENGTH) {
      paragraphs.push(text);
    }
  }
  return paragraphs;
}

/**
 * Check how many paragraphs from an EN source appear verbatim in a translated article.
 * Returns an object with leakage metrics.
 */
function checkBodyContentLeakage(
  translatedFilePath: string,
  enSourcePath: string | null,
  fileLang: string,
): ContentLeakageRecord | null {
  if (fileLang === 'en') return null;

  const translatedContent = readFileSync(translatedFilePath, 'utf-8');
  const filename = basename(translatedFilePath);
  const translatedParagraphs = extractBodyParagraphs(translatedContent);

  if (translatedParagraphs.length === 0) return null;

  let enParagraphLeakageCount = 0;
  let phraseLeakageCount = 0;
  const samples: string[] = [];

  if (enSourcePath && existsSync(enSourcePath)) {
    const enContent = readFileSync(enSourcePath, 'utf-8');
    const enParagraphs = extractBodyParagraphs(enContent);
    const translatedParagraphSet = new Set(translatedParagraphs);

    for (const enPara of enParagraphs) {
      if (enPara.length >= MIN_PARAGRAPH_LENGTH && translatedParagraphSet.has(enPara)) {
        enParagraphLeakageCount++;
        if (samples.length < 5) {
          samples.push(`[EN leakage] ${enPara.slice(0, 100)}...`);
        }
      }
    }
  }

  for (const pattern of ENGLISH_LEAKAGE_PHRASES) {
    if (pattern.test(translatedContent)) {
      phraseLeakageCount++;
      const m = translatedContent.match(pattern);
      if (m && samples.length < 5) {
        samples.push(`[EN phrase] ${m[0]}`);
      }
    }
  }

  if (fileLang !== 'sv') {
    for (const pattern of SWEDISH_LEAKAGE_PHRASES) {
      if (pattern.test(translatedContent)) {
        phraseLeakageCount++;
        const m = translatedContent.match(pattern);
        if (m && samples.length < 5) {
          samples.push(`[SV leakage] ${m[0]}`);
        }
      }
    }
  }

  const totalParagraphs = translatedParagraphs.length;
  const percentUntranslated = totalParagraphs > 0
    ? Math.round((enParagraphLeakageCount / totalParagraphs) * 100)
    : 0;
  const hasLeakage = enParagraphLeakageCount > 0 || phraseLeakageCount > 0;

  if (!hasLeakage) return null;

  if (phraseLeakageCount > 0 && samples.length < 5) {
    samples.unshift(`[Phrase matches] ${phraseLeakageCount} English/Swedish leakage phrase match(es) detected.`);
  }

  return {
    filename,
    lang: fileLang,
    untranslatedParagraphs: enParagraphLeakageCount,
    phraseMatches: phraseLeakageCount,
    totalParagraphs,
    percentUntranslated,
    samples,
  };
}

/**
 * Derive the EN source file path from a translated file path.
 * e.g. news/2026-04-09-committee-reports-de.html → news/2026-04-09-committee-reports-en.html
 */
function deriveEnSourcePath(filepath: string): string | null {
  const dir = dirname(filepath);
  const name = basename(filepath);
  const enName = name.replace(/-[a-z]{2}\.html$/, '-en.html');
  if (enName === name) return null;   const enPath = join(dir, enName);
  return existsSync(enPath) ? enPath : null;
}

/** BCP-47 validation error record */
export interface BCP47Error {
  readonly field: string;
  readonly expected: string;
  readonly actual: string;
}

/**
 * Map from filename language suffix to the expected BCP-47 tag used in
 * `html[lang]`, `og:locale`, and JSON-LD `inLanguage`.
 *
 * Norwegian files use the filename suffix 'no' but must be advertised as 'nb'.
 */
const BCP47_TAG: Record<string, string> = {
  en: 'en', sv: 'sv', da: 'da', no: 'nb', fi: 'fi',
  de: 'de', fr: 'fr', es: 'es', nl: 'nl',
  ar: 'ar', he: 'he', ja: 'ja', ko: 'ko', zh: 'zh',
};

const OG_LOCALE_EXPECTED: Record<string, string> = {
  en: 'en_US', sv: 'sv_SE', da: 'da_DK', no: 'nb_NO', fi: 'fi_FI',
  de: 'de_DE', fr: 'fr_FR', es: 'es_ES', nl: 'nl_NL',
  ar: 'ar_SA', he: 'he_IL', ja: 'ja_JP', ko: 'ko_KR', zh: 'zh_CN',
};

/**
 * Validate BCP-47 consistency within an article file.
 * Checks that `html[lang]`, `og:locale`, and JSON-LD `inLanguage` are
 * consistent with the expected values for the file's language suffix.
 */
export function validateBCP47Consistency(filePath: string, fileLang: string): BCP47Error[] {
  const errors: BCP47Error[] = [];
  const content = readFileSync(filePath, 'utf-8');
  const expectedTag = BCP47_TAG[fileLang] ?? fileLang;
  const expectedLocale = OG_LOCALE_EXPECTED[fileLang];

  const htmlLangMatch = content.match(/<html\s[^>]*lang="([^"]+)"/);
  if (htmlLangMatch) {
    const actual = htmlLangMatch[1] ?? '';
    if (actual !== expectedTag) {
      errors.push({ field: 'html[lang]', expected: expectedTag, actual });
    }
  }

  if (expectedLocale) {
    const ogMatch = content.match(/property="og:locale"\s+content="([^"]+)"/);
    if (ogMatch) {
      const actual = ogMatch[1] ?? '';
      if (actual !== expectedLocale) {
        errors.push({ field: 'og:locale', expected: expectedLocale, actual });
      }
    }
  }

  const inLangMatch = content.match(/"inLanguage":\s*"([^"]+)"/);
  if (inLangMatch) {
    const actual = inLangMatch[1] ?? '';
    if (actual !== expectedTag) {
      errors.push({ field: 'inLanguage', expected: expectedTag, actual });
    }
  }

  if (fileLang === 'ar' || fileLang === 'he') {
    if (!content.includes('dir="rtl"')) {
      errors.push({ field: 'dir', expected: 'rtl', actual: 'missing' });
    }
  }

  return errors;
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
  let totalBCP47Errors = 0;
  let totalContentLeakage = 0;
  const failedFiles: FailedFileRecord[] = [];
  const leakageFiles: ContentLeakageRecord[] = [];

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
      console.log(`${colors.green}✓ ${filename} (${(lang ?? '').toUpperCase()})${colors.reset}`);
      totalPassed++;
      if (fileLeakage) {
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

  if (totalContentLeakage > 0) {
    console.log(`${colors.yellow}⚠ Articles with EN/SV body content leakage: ${totalContentLeakage}${colors.reset}`);
  }

  const hasHardFailures = totalFailed > 0 || totalBCP47Errors > 0;

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

// Run validation
const directory: string = process.argv[2] || 'news';
const exitCode: number = validateNewsTranslations(directory);

process.exit(exitCode);
