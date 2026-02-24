/**
 * @module generate-news-indexes
 * @description Barrel re-export and orchestration for multi-language news
 * index generation. Scans published articles, generates 14 index pages
 * with Schema.org / Open Graph metadata, and writes to the news/ directory.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import type { GenerationResult, NewsArticleMetadata } from './types.js';
import { LANGUAGES } from './constants.js';
import {
  NEWS_DIR,
  scanNewsArticles,
  buildSlugToLanguagesMap,
} from './helpers.js';
import { generateIndexHTML } from './template.js';

// Re-export public API
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
} from './types.js';

export { LANGUAGES, LANGUAGE_FLAGS, AVAILABLE_IN_TRANSLATIONS } from './constants.js';
export {
  NEWS_DIR,
  generateLanguageBadge,
  generateLanguageSwitcherNav,
  generateAvailableLanguages,
  extractMetaContent,
  extractTitle,
  normalizeDateString,
  extractDateFromJSONLD,
  extractFromFilename,
  classifyArticleType,
  extractTopics,
  extractTags,
  parseArticleMetadata,
  scanNewsArticles,
  buildSlugToLanguagesMap,
  getAllArticlesWithLanguageInfo,
} from './helpers.js';

export {
  generateIndexHTML,
  generateHreflangTags,
  generateRTLStyles,
  generateLanguageNotice,
} from './template.js';

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

/**
 * Main generation function — scans articles, builds cross-language maps,
 * generates 14 index HTML files.
 */
export function generateAllIndexes(): GenerationResult {
  console.log('\n🚀 Generating dynamic news indexes...');

  const articlesByLang: Record<string, NewsArticleMetadata[]> = scanNewsArticles();
  const slugToLanguages: Record<string, string[]> = buildSlugToLanguagesMap(articlesByLang);

  console.log('\n📝 Generating index files...');

  let successCount = 0;
  let errorCount = 0;

  Object.keys(LANGUAGES).forEach((langKey) => {
    try {
      const filename: string = langKey === 'en' ? 'index.html' : `index_${langKey === 'no' ? 'no' : langKey}.html`;
      const filePath: string = path.join(NEWS_DIR, filename);

      const languageArticles: NewsArticleMetadata[] = articlesByLang[langKey] || [];

      const enrichedArticles: NewsArticleMetadata[] = languageArticles.map((article) => ({
        ...article,
        availableLanguages: slugToLanguages[article.slug] || [article.lang],
      }));

      const html: string = generateIndexHTML(langKey, enrichedArticles, articlesByLang);
      fs.writeFileSync(filePath, html, 'utf-8');

      console.log(`  ✅ Generated: ${filename} (${languageArticles.length} articles)`);
      successCount++;
    } catch (error: unknown) {
      console.error(`  ❌ Failed to generate ${langKey}:`, (error as Error).message);
      errorCount++;
    }
  });

  console.log('\n✨ Generation complete!');
  console.log(`  ✅ Success: ${successCount} files`);
  console.log(`  ❌ Errors: ${errorCount} files`);
  const totalArticles: number = Object.values(articlesByLang).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`  📊 Total articles: ${totalArticles}`);

  return {
    success: errorCount === 0,
    successCount,
    errorCount,
    articles: articlesByLang,
  };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result: GenerationResult = generateAllIndexes();
    process.exit(result.success ? 0 : 1);
  } catch (error: unknown) {
    console.error('\n❌ Fatal error:', (error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  }
}
