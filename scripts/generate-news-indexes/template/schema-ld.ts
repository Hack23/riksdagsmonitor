/**
 * @module generate-news-indexes/template/schema-ld
 * @description JSON-LD structured-data builders for the news-index page.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { LanguageConfig, NewsArticleMetadata } from '../types.js';
import { BASE_URL } from './constants.js';
import { toBcp47 } from './i18n.js';

/** Build the `ItemList` JSON-LD of the 10 most-recent articles. */
export function buildItemListLd(
  lang: LanguageConfig,
  displayArticles: readonly NewsArticleMetadata[],
): unknown {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: lang.title,
    description: lang.subtitle,
    numberOfItems: displayArticles.length,
    itemListElement: displayArticles.slice(0, 10).map((article, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'NewsArticle',
        headline: article.title,
        url: `${BASE_URL}/news/${article.slug}`,
        mainEntityOfPage: `${BASE_URL}/news/${article.slug}`,
        datePublished: article.date,
        dateModified: article.date,
        image: `${BASE_URL}/images/og-image.webp`,
        description: article.description.length > 150
          ? article.description.substring(0, 150).replace(/\s+\S*$/, '') + '...'
          : article.description,
        inLanguage: toBcp47(article.lang || lang.code, lang.code),
        author: { '@type': 'Organization', name: 'Riksdagsmonitor' },
        publisher: {
          '@type': 'Organization',
          name: 'Hack23 AB',
          logo: { '@type': 'ImageObject', url: `${BASE_URL}/images/android-chrome-512x512.png` },
        },
        articleSection: lang.breadcrumbs.news,
        // Per-card story-specific keyword stream — surfaces the same
        // bill IDs / committee codes / agency acronyms / named entities
        // that the article page's `<meta name="keywords">` exposes, so
        // SERP crawlers see consistent topic anchors across both
        // the standalone article and the news-index card.
        ...(article.keywords ? { keywords: article.keywords } : {}),
        about: {
          '@type': 'GovernmentOrganization',
          name: 'Riksdag',
          alternateName: 'Swedish Parliament',
          url: 'https://www.riksdagen.se/',
        },
      },
    })),
  };
}

/** Build the breadcrumb JSON-LD (Home → News). */
export function buildBreadcrumbLd(lang: LanguageConfig, filename: string): unknown {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: lang.breadcrumbs.home, item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: lang.breadcrumbs.news, item: `${BASE_URL}/news/${filename}` },
    ],
  };
}

/** Build the Organization JSON-LD block. */
export function buildOrganizationLd(): unknown {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Hack23 AB',
    url: 'https://www.hack23.com',
    logo: `${BASE_URL}/images/android-chrome-512x512.png`,
  };
}

/** Build the WebSite JSON-LD block (with `SearchAction`). */
export function buildWebsiteLd(lang: LanguageConfig, filename: string): unknown {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    name: 'Riksdagsmonitor',
    url: BASE_URL,
    description: lang.schemaDescription || 'Swedish Parliament Intelligence Platform - Monitor political activity with systematic transparency',
    inLanguage: toBcp47(lang.code, lang.code),
    publisher: {
      '@type': 'Organization',
      name: 'Hack23 AB',
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/images/android-chrome-512x512.png` },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/news/${filename}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

/** Combine the four blocks above in their canonical order. */
export function buildAllJsonLd(
  lang: LanguageConfig,
  displayArticles: readonly NewsArticleMetadata[],
  filename: string,
): unknown[] {
  return [
    buildOrganizationLd(),
    buildWebsiteLd(lang, filename),
    buildItemListLd(lang, displayArticles),
    buildBreadcrumbLd(lang, filename),
  ];
}
