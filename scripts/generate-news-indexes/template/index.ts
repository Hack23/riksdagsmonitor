/**
 * @module generate-news-indexes/template/index
 * @description Top-level HTML composer for the news-index pages. Stitches
 * together the `<head>` + chrome from `buildChrome` with the page-specific
 * sections (hero, filter bar, article grid, inline script, SEO fallback,
 * AI-newsroom banner, FAQ).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { buildChrome } from '../../render-lib/chrome.js';
import { getFaqItems } from '../../render-lib/faq-i18n.js';
import type { Language } from '../../types/language.js';
import { LANGUAGES } from '../constants.js';
import type {
  ArticleDisplayData,
  LanguageConfig,
  NewsArticleMetadata,
} from '../types.js';
import { appVersionMarker } from './constants.js';
import { heroMetricLabels, localizeClearFilters, toChromeLang } from './i18n.js';
import { buildAllJsonLd } from './schema-ld.js';
import { renderHero } from './hero.js';
import { renderFilterBar } from './filters.js';
import { renderArticleGrid } from './article-grid.js';
import { renderClientScript } from './client-script.js';
import { renderSeoFallback } from './seo-fallback.js';
import { renderAiNewsroomSection, renderFaqSection } from './page-sections.js';
import { generateLanguageNotice } from './language-notice.js';
import { newsPageExtraRtlStyle } from './rtl.js';

const RTL_LANGS: ReadonlySet<string> = new Set(['ar', 'he']);
const EXCERPT_LIMIT = 200;

/** Build the per-language `index*.html` filename. */
function indexFilename(langKey: string): string {
  if (langKey === 'en') return 'index.html';
  return `index_${langKey === 'no' ? 'no' : langKey}.html`;
}

/** Trim an article description to a fixed-width word-boundary excerpt. */
function buildExcerpt(description: string): string {
  if (description.length <= EXCERPT_LIMIT) return description;
  return description.substring(0, EXCERPT_LIMIT).replace(/\s+\S*$/, '') + '...';
}

/** Project a full article record onto the slim payload the client renders. */
function toDisplayData(a: NewsArticleMetadata): ArticleDisplayData {
  return {
    title: a.title,
    date: a.date,
    type: a.type,
    slug: a.slug,
    lang: a.lang,
    availableLanguages: a.availableLanguages || [a.lang],
    excerpt: buildExcerpt(a.description),
    topics: a.topics,
    tags: a.tags,
  };
}

/** Pick the most-recent article date, falling back to today (YYYY-MM-DD). */
function pickLatestDate(articles: readonly NewsArticleMetadata[]): string {
  if (articles.length === 0) return new Date().toISOString().slice(0, 10);
  return articles.map((a) => a.date).sort((a, b) => b.localeCompare(a))[0]!;
}

/** Build the hreflang alternates map for every supported language. */
function buildHreflangAlternates(): Partial<Record<Language, string>> {
  const out: Partial<Record<Language, string>> = {};
  for (const k of Object.keys(LANGUAGES)) {
    out[toChromeLang(k)] = `news/${indexFilename(k)}`;
  }
  return out;
}

// No third-party font CDN — styles.css uses a system-ui font stack
// (San Francisco / Segoe UI / Roboto) so every platform renders in its
// native UI font with zero network cost and zero font-swap CLS.
const EXTRA_HEAD = '';

/**
 * Generate the full HTML document for a single news-index page.
 *
 * @param langKey               Two-letter language key (`en`, `sv`, …).
 * @param languageArticles      Articles to display for this language.
 * @param _allArticlesByLang    Reserved for future cross-language coverage
 *                              widgets; currently unused.
 */
export function generateIndexHTML(
  langKey: string,
  languageArticles: NewsArticleMetadata[],
  _allArticlesByLang: Record<string, NewsArticleMetadata[]>,
): string {
  const lang: LanguageConfig = (LANGUAGES as Record<string, LanguageConfig>)[langKey]!;
  const filename = indexFilename(langKey);
  const isRTL = RTL_LANGS.has(langKey);
  const needsLanguageNotice = languageArticles.length === 0;

  const displayArticles = languageArticles;
  const displayData = displayArticles.map(toDisplayData);
  const latestDate = pickLatestDate(displayArticles);
  const metricLabels = heroMetricLabels(langKey);

  const chromeLang = toChromeLang(langKey);
  const faqItems = getFaqItems('newsIndex', chromeLang);
  const jsonLd = buildAllJsonLd(lang, displayArticles, filename);

  const chrome = buildChrome({
    lang: chromeLang,
    title: lang.title,
    description: lang.subtitle,
    keywords: lang.keywords,
    canonicalPath: `news/${filename}`,
    hreflangAlternates: buildHreflangAlternates(),
    defaultAlternateBase: filename,
    ogType: 'website',
    rssHref: langKey === 'en' ? '/rss.xml' : `/rss_${langKey}.xml`,
    breadcrumb: [
      { label: lang.breadcrumbs.home, href: `../${langKey === 'en' ? 'index.html' : `index_${langKey}.html`}` },
      { label: lang.breadcrumbs.news },
    ],
    jsonLd,
    extraHead: EXTRA_HEAD,
    extraStyle: newsPageExtraRtlStyle(isRTL),
    bodyClass: 'news-page',
    heroBannerImage: 'images/riksdagsmonitornews-banner.webp',
    faqItems,
    speakableSelectors: ['header.news-page-heading h1', 'header.news-page-heading .news-page-subtitle'],
  });

  const hero = renderHero(lang, metricLabels, displayArticles.length, latestDate);
  const filters = renderFilterBar(lang, localizeClearFilters(langKey));
  const grid = renderArticleGrid(lang);
  const script = renderClientScript({ langKey, lang, displayData, isRTL });
  const seoFallback = renderSeoFallback(lang, langKey, displayArticles);
  const aiNewsroom = renderAiNewsroomSection(lang);
  const faq = renderFaqSection(chromeLang, faqItems);

  // Page heading note: canonical chrome puts brand only in <header>; the
  // news-index page itself owns the document <h1> for a11y heading hierarchy
  // and SEO, matching sitemap.html and political-intelligence.html.
  const body = `  <div class="container">
${needsLanguageNotice ? generateLanguageNotice(langKey) : ''}

${hero}

    <!-- Filter Bar (sticky on scroll, collapsible on mobile via <details>) -->
${filters}

    <!-- Articles Grid (skeleton state until client JS hydrates) -->
${grid}
  </div>

${script}

${aiNewsroom}

  <!-- SEO: crawler-visible article list (capped at 200 most-recent). -->
${seoFallback}

${faq}
  ${appVersionMarker()}`;

  return `${chrome.head}
${chrome.headerHtml}
${body}
${chrome.footerHtml}`;
}
