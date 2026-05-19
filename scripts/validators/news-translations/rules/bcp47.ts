/**
 * @module scripts/validators/news-translations/rules/bcp47
 * @description BCP-47 consistency checker — validates that
 *              `html[lang]`, `og:locale`, JSON-LD `inLanguage`, and
 *              the `dir="rtl"` attribute (for ar/he) all agree with the
 *              file's language suffix.
 *
 *              Rule census: extracted from
 *              `scripts/validate-news-translations.ts` lines 304–373
 *              (`BCP47Error`, `validateBCP47Consistency`). Logic is
 *              byte-identical to the original; Norwegian filename
 *              suffix `no` continues to require BCP-47 `nb` advertisement
 *              everywhere.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFileSync } from 'fs';

import { BCP47_TAG, OG_LOCALE_EXPECTED } from '../language.js';

/** BCP-47 validation error record */
export interface BCP47Error {
  readonly field: string;
  readonly expected: string;
  readonly actual: string;
}

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
