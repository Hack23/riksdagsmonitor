/**
 * @module Intelligence/NewsGeneration
 * @description Public API barrel for the news index generation modules.
 *
 * Implementation split into focused modules under `./generate-news-indexes/`:
 *
 * | Module       | Lines | Responsibility                                          |
 * |------------- |-------|---------------------------------------------------------|
 * | types.ts     | ~100  | Shared interfaces (FilterLabels, NewsArticleMetadata…)  |
 * | constants.ts | ~255  | i18n config for 14 languages, flags, translations       |
 * | helpers.ts   | ~400  | Article parsing, scanning, classification, badges       |
 * | template.ts  | ~470  | generateIndexHTML + RTL styles + language notices        |
 * | index.ts     | ~120  | Barrel re-export + orchestration (generateAllIndexes)   |
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
export {
  generateAllIndexes,
  parseArticleMetadata,
  scanNewsArticles,
  generateLanguageBadge,
  generateAvailableLanguages,
} from './generate-news-indexes/index.js';

export type {
  FilterLabels,
  I18nStrings,
  BreadcrumbLabels,
  LanguageConfig,
  LanguageCode,
  ArticleTypeValue,
  NewsArticleMetadata,
  ArticleDisplayData,
  GenerationResult,
  LanguageNoticeMessage,
} from './generate-news-indexes/index.js';
