/**
 * @module data-transformers/constants/locale-map
 * @description Locale code mapping for date/time formatting across all 14 supported languages.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Map of custom locale codes to Intl-compatible locale strings.
 * Used for date/time formatting across all 14 supported languages.
 */
export const LOCALE_MAP: Record<string, string> = {
  en: 'en-GB', sv: 'sv-SE', da: 'da-DK', no: 'no-NO', fi: 'fi-FI',
  de: 'de-DE', fr: 'fr-FR', es: 'es-ES', nl: 'nl-NL', ar: 'ar-SA',
  he: 'he-IL', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN'
};
