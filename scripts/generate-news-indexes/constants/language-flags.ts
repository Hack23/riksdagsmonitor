/**
 * @module generate-news-indexes/constants/language-flags
 * @description Per-language flag emojis and "Available in" translations
 * used by the language badges and cross-language switcher.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Language flags mapping for badges */
export const LANGUAGE_FLAGS: Record<string, string> = {
  en: '🇬🇧', sv: '🇸🇪', da: '🇩🇰', no: '🇳🇴', fi: '🇫🇮',
  de: '🇩🇪', fr: '🇫🇷', es: '🇪🇸', nl: '🇳🇱', ar: '🇸🇦',
  he: '🇮🇱', ja: '🇯🇵', ko: '🇰🇷', zh: '🇨🇳'
};

/** "Available in" translations for each language */
export const AVAILABLE_IN_TRANSLATIONS: Record<string, string> = {
  en: 'Available in', sv: 'Tillgänglig på', da: 'Tilgængelig på', no: 'Tilgjengelig på', fi: 'Saatavilla kielellä',
  de: 'Verfügbar in', fr: 'Disponible en', es: 'Disponible en', nl: 'Beschikbaar in', ar: 'متاح في',
  he: 'זמין ב', ja: '利用可能な言語', ko: '사용 가능 언어', zh: '可用语言'
};
