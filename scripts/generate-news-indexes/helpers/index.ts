/**
 * @module generate-news-indexes/helpers
 * @description Barrel re-export for the news-index helper modules.
 *
 * | Module          | Responsibility                                              |
 * |-----------------|-------------------------------------------------------------|
 * | i18n.ts         | Language badges + switcher (BCP-47 `nb`/`no` normalisation) |
 * | frontmatter.ts  | HTML metadata extraction + `parseArticleMetadata`           |
 * | slug.ts         | Article-type classification + topic/tag extraction          |
 * | article-merge.ts| Cross-language slug → languages map                          |
 * | path-utils.ts   | `NEWS_DIR` + recursive HTML scanning                         |
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

export {
  generateLanguageBadge,
  generateLanguageSwitcherNav,
  generateAvailableLanguages,
} from './i18n.js';

export {
  extractDescriptionFromJSONLD,
  stripBrandSuffix,
  chooseBestDescription,
  extractMetaContent,
  extractTitle,
  normalizeDateString,
  extractDateFromJSONLD,
  extractFromFilename,
  parseArticleMetadata,
} from './frontmatter.js';

export {
  classifyArticleType,
  extractTopics,
  extractTags,
  LANG_SUFFIX_RE,
} from './slug.js';

export { buildSlugToLanguagesMap } from './article-merge.js';

export { NEWS_DIR, scanNewsArticles } from './path-utils.js';
