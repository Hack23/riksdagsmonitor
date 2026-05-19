/**
 * @module scripts/validators/news-translations/language
 * @description Language constants + filename language inference for the
 *              news-translations validator.
 *
 *              Rule census: extracted from
 *              `scripts/validate-news-translations.ts` lines 45–48
 *              (`NON_SWEDISH_LANGS`), 311–327
 *              (`BCP47_TAG`, `OG_LOCALE_EXPECTED`), and 442–449
 *              (`getLanguageCode`). Logic is byte-identical to the
 *              original; the BCP-47 `nb` (preferred) mapping for the
 *              `no`-suffix filenames is preserved.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';

/** Language codes to check (exclude Swedish). */
export const NON_SWEDISH_LANGS: readonly Language[] = [
  'en', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
];

/**
 * Map from filename language suffix to the expected BCP-47 tag used in
 * `html[lang]`, `og:locale`, and JSON-LD `inLanguage`.
 *
 * Norwegian files use the filename suffix 'no' but must be advertised as 'nb'.
 */
export const BCP47_TAG: Record<string, string> = {
  en: 'en', sv: 'sv', da: 'da', no: 'nb', fi: 'fi',
  de: 'de', fr: 'fr', es: 'es', nl: 'nl',
  ar: 'ar', he: 'he', ja: 'ja', ko: 'ko', zh: 'zh',
};

export const OG_LOCALE_EXPECTED: Record<string, string> = {
  en: 'en_US', sv: 'sv_SE', da: 'da_DK', no: 'nb_NO', fi: 'fi_FI',
  de: 'de_DE', fr: 'fr_FR', es: 'es_ES', nl: 'nl_NL',
  ar: 'ar_SA', he: 'he_IL', ja: 'ja_JP', ko: 'ko_KR', zh: 'zh_CN',
};

/** Determine language code from filename. */
export function getLanguageCode(filename: string): string | null {
  const match = filename.match(/-([a-z]{2})\.html$/);
  return match ? match[1] ?? null : null;
}
