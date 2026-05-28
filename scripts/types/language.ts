/**
 * @module Types/Language
 * @description Supported language codes for 14-language content generation.
 */

/** ISO 639-1 language codes supported by Riksdagsmonitor */
export type Language =
  | 'en'
  | 'sv'
  | 'da'
  | 'no'
  | 'fi'
  | 'de'
  | 'fr'
  | 'es'
  | 'nl'
  | 'ar'
  | 'he'
  | 'ja'
  | 'ko'
  | 'zh';

/** Reader-context depth by language for article explainers. */
export type ContextDepth = 'minimal' | 'medium' | 'maximum';

/**
 * Swedish content assumes local civic context; several non-Latin locales
 * receive maximum onboarding by default.
 */
export const CONTEXT_DEPTH_BY_LANGUAGE: Record<Language, ContextDepth> = {
  sv: 'minimal',
  en: 'medium',
  da: 'medium',
  no: 'medium',
  fi: 'medium',
  de: 'medium',
  fr: 'medium',
  es: 'medium',
  nl: 'medium',
  ar: 'maximum',
  he: 'maximum',
  ja: 'maximum',
  ko: 'maximum',
  zh: 'maximum',
};
