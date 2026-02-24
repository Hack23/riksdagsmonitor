/**
 * @module Intelligence/NewsGeneration
 * @description Barrel re-export for backward compatibility.
 *
 * This file was previously a 1311-line monolith. It has been decomposed
 * into focused modules under `./generate-news-indexes/`:
 *
 * | Module       | Lines | Responsibility                                          |
 * |------------- |-------|---------------------------------------------------------|
 * | types.ts     | ~100  | Shared interfaces (FilterLabels, NewsArticleMetadata…)  |
 * | constants.ts | ~255  | i18n config for 14 languages, flags, translations       |
 * | helpers.ts   | ~400  | Article parsing, scanning, classification, badges       |
 * | template.ts  | ~470  | generateIndexHTML + RTL styles + language notices        |
 * | index.ts     | ~120  | Barrel re-export + orchestration (generateAllIndexes)   |
 *
 * All public exports are preserved — existing consumers require no changes.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
export {
  generateAllIndexes,
  parseArticleMetadata,
  scanNewsArticles,
  getAllArticlesWithLanguageInfo,
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
