/**
 * @module generate-news-indexes/helpers/article-merge
 * @description Cross-language merge helpers. Builds the slug → languages map
 * used by the index renderer to present "available in" badges.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { NewsArticleMetadata } from '../types.js';
import { LANG_SUFFIX_RE } from './slug.js';

/**
 * Build map of base slugs to available languages for cross-language discovery.
 *
 * O(n) implementation: two-pass approach avoids the previous O(n²) nested
 * iteration that caused timeouts when the news/ directory grew large.
 *
 * Pass 1 – baseSlug → string[] of languages that have that article.
 * Pass 2 – article.slug → the language list from pass 1.
 */
export function buildSlugToLanguagesMap(articlesByLang: Record<string, NewsArticleMetadata[]>): Record<string, string[]> {
  const baseSlugToLangs: Record<string, string[]> = {};

  Object.entries(articlesByLang).forEach(([lang, articles]) => {
    articles.forEach((article) => {
      const baseSlug: string = article.slug.replace(LANG_SUFFIX_RE, '.html');
      if (!baseSlugToLangs[baseSlug]) {
        baseSlugToLangs[baseSlug] = [];
      }
      if (!baseSlugToLangs[baseSlug]!.includes(lang)) {
        baseSlugToLangs[baseSlug]!.push(lang);
      }
    });
  });

  const slugToLanguages: Record<string, string[]> = {};

  Object.entries(articlesByLang).forEach(([lang, articles]) => {
    articles.forEach((article) => {
      if (!slugToLanguages[article.slug]) {
        const baseSlug: string = article.slug.replace(LANG_SUFFIX_RE, '.html');
        slugToLanguages[article.slug] = baseSlugToLangs[baseSlug] ?? [lang];
      }
    });
  });

  return slugToLanguages;
}
