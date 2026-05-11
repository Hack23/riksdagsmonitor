/**
 * @module generate-news-indexes/template
 * @description HTML template generation for news index pages.
 * Produces complete HTML5 documents with Schema.org structured data,
 * filtering UI, and responsive card-based article listings.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../html-utils.js';
import type {
  ArticleDisplayData,
  FilterLabels,
  LanguageConfig,
  LanguageNoticeMessage,
  NewsArticleMetadata,
} from './types.js';
import { LANGUAGES, AVAILABLE_IN_TRANSLATIONS, LANGUAGE_FLAGS } from './constants.js';
import { buildChrome } from '../render-lib/chrome.js';
import { getFaqItems, FAQ_HEADING } from '../render-lib/faq-i18n.js';
import type { Language } from '../types/language.js';

const APP_VERSION_FALLBACK = '0.0.0';

const BASE_URL = 'https://riksdagsmonitor.com';

/**
 * Localised "Clear filters" label per language. Kept here (not in
 * `constants.ts`) so we don't need a synchronised migration of the
 * `LanguageConfig.i18n` interface and every entry. Falls back to the
 * English label if a language is missing.
 */
const CLEAR_FILTERS_LABELS: Readonly<Record<string, string>> = {
  en: 'Clear filters',
  sv: 'Rensa filter',
  da: 'Ryd filtre',
  no: 'Tøm filtre',
  fi: 'Tyhjennä suodattimet',
  de: 'Filter zurücksetzen',
  fr: 'Effacer les filtres',
  es: 'Borrar filtros',
  nl: 'Filters wissen',
  ar: 'مسح الفلاتر',
  he: 'נקה מסננים',
  ja: 'フィルタをクリア',
  ko: '필터 지우기',
  zh: '清除筛选',
};

/** Localised recency-badge labels (today / this-week / this-month). */
const RECENCY_LABELS: Readonly<Record<string, Readonly<Record<'today' | 'this-week' | 'this-month', string>>>> = {
  en: { 'today': 'Today', 'this-week': 'This week', 'this-month': 'This month' },
  sv: { 'today': 'Idag', 'this-week': 'Denna vecka', 'this-month': 'Denna månad' },
  da: { 'today': 'I dag', 'this-week': 'Denne uge', 'this-month': 'Denne måned' },
  no: { 'today': 'I dag', 'this-week': 'Denne uken', 'this-month': 'Denne måneden' },
  fi: { 'today': 'Tänään', 'this-week': 'Tällä viikolla', 'this-month': 'Tässä kuussa' },
  de: { 'today': 'Heute', 'this-week': 'Diese Woche', 'this-month': 'Diesen Monat' },
  fr: { 'today': "Aujourd'hui", 'this-week': 'Cette semaine', 'this-month': 'Ce mois-ci' },
  es: { 'today': 'Hoy', 'this-week': 'Esta semana', 'this-month': 'Este mes' },
  nl: { 'today': 'Vandaag', 'this-week': 'Deze week', 'this-month': 'Deze maand' },
  ar: { 'today': 'اليوم', 'this-week': 'هذا الأسبوع', 'this-month': 'هذا الشهر' },
  he: { 'today': 'היום', 'this-week': 'השבוע', 'this-month': 'החודש' },
  ja: { 'today': '今日', 'this-week': '今週', 'this-month': '今月' },
  ko: { 'today': '오늘', 'this-week': '이번 주', 'this-month': '이번 달' },
  zh: { 'today': '今天', 'this-week': '本周', 'this-month': '本月' },
};

const HERO_METRIC_LABELS: Readonly<Record<string, Readonly<Record<'articles' | 'languages' | 'latest' | 'pipeline', string>>>> = {
  en: { articles: 'Articles indexed', languages: 'Languages', latest: 'Latest update', pipeline: 'Agentic newsroom' },
  sv: { articles: 'Indexerade artiklar', languages: 'Språk', latest: 'Senaste uppdatering', pipeline: 'Agentbaserad redaktion' },
  da: { articles: 'Indekserede artikler', languages: 'Sprog', latest: 'Seneste opdatering', pipeline: 'Agentisk redaktion' },
  no: { articles: 'Indekserte artikler', languages: 'Språk', latest: 'Siste oppdatering', pipeline: 'Agentbasert redaksjon' },
  fi: { articles: 'Indeksoidut artikkelit', languages: 'Kielet', latest: 'Viimeisin päivitys', pipeline: 'Agenttipohjainen toimitus' },
  de: { articles: 'Indexierte Artikel', languages: 'Sprachen', latest: 'Letzte Aktualisierung', pipeline: 'Agentische Redaktion' },
  fr: { articles: 'Articles indexés', languages: 'Langues', latest: 'Dernière mise à jour', pipeline: 'Rédaction agentique' },
  es: { articles: 'Artículos indexados', languages: 'Idiomas', latest: 'Última actualización', pipeline: 'Redacción agéntica' },
  nl: { articles: 'Geïndexeerde artikelen', languages: 'Talen', latest: 'Laatste update', pipeline: 'Agentische redactie' },
  ar: { articles: 'مقالات مفهرسة', languages: 'لغات', latest: 'آخر تحديث', pipeline: 'غرفة أخبار وكيلة' },
  he: { articles: 'מאמרים באינדקס', languages: 'שפות', latest: 'עדכון אחרון', pipeline: 'מערכת סוכנים' },
  ja: { articles: '索引済み記事', languages: '言語', latest: '最新更新', pipeline: 'エージェント newsroom' },
  ko: { articles: '색인된 기사', languages: '언어', latest: '최신 업데이트', pipeline: '에이전트 뉴스룸' },
  zh: { articles: '已索引文章', languages: '语言', latest: '最新更新', pipeline: '代理新闻室' },
};

function localizeClearFilters(langKey: string): string {
  return CLEAR_FILTERS_LABELS[langKey] ?? CLEAR_FILTERS_LABELS.en!;
}

function buildRecencyLabels(langKey: string): Record<string, string> {
  const map = RECENCY_LABELS[langKey] ?? RECENCY_LABELS.en!;
  return { 'today': map['today'], 'this-week': map['this-week'], 'this-month': map['this-month'] };
}

/** Map a news-index `langKey` to a `Language` accepted by `buildChrome`. */
function toChromeLang(langKey: string): Language {
  return langKey as Language;
}

export function generateIndexHTML(
  langKey: string,
  languageArticles: NewsArticleMetadata[],
  _allArticlesByLang: Record<string, NewsArticleMetadata[]>,
): string {
  const lang: LanguageConfig = (LANGUAGES as Record<string, LanguageConfig>)[langKey]!;
  const f: FilterLabels = lang.filters;
  const filename: string = langKey === 'en' ? 'index.html' : `index_${langKey === 'no' ? 'no' : langKey}.html`;
  const isRTL: boolean = ['ar', 'he'].includes(langKey);

  const displayArticles: NewsArticleMetadata[] = languageArticles;
  const needsLanguageNotice: boolean = languageArticles.length === 0;

  const displayData: ArticleDisplayData[] = displayArticles.map((a) => ({
    title: a.title,
    date: a.date,
    type: a.type,
    slug: a.slug,
    lang: a.lang,
    availableLanguages: a.availableLanguages || [a.lang],
    excerpt: a.description.length > 200 ? a.description.substring(0, 200).replace(/\s+\S*$/, '') + '...' : a.description,
    topics: a.topics,
    tags: a.tags,
  }));
  const latestDate = displayArticles.length > 0
    ? displayArticles.map((a) => a.date).sort((a, b) => b.localeCompare(a))[0]!
    : new Date().toISOString().slice(0, 10);
  const heroMetricLabels = HERO_METRIC_LABELS[langKey] ?? HERO_METRIC_LABELS.en!;

  const hreflangAlternates: Partial<Record<Language, string>> = {};
  for (const k of Object.keys(LANGUAGES)) {
    const fName = k === 'en' ? 'index.html' : `index_${k === 'no' ? 'no' : k}.html`;
    hreflangAlternates[toChromeLang(k)] = `news/${fName}`;
  }

  const toBcp47 = (code: string | undefined): string => {
    if (!code) return lang.code;
    return code === 'no' ? 'nb' : code;
  };

  const itemListLd: unknown = {
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
        inLanguage: toBcp47(article.lang || lang.code),
        author: { '@type': 'Organization', name: 'Riksdagsmonitor' },
        publisher: {
          '@type': 'Organization',
          name: 'Hack23 AB',
          logo: { '@type': 'ImageObject', url: `${BASE_URL}/images/android-chrome-512x512.png` },
        },
        articleSection: lang.breadcrumbs.news,
        about: {
          '@type': 'GovernmentOrganization',
          name: 'Riksdag',
          alternateName: 'Swedish Parliament',
          url: 'https://www.riksdagen.se/',
        },
      },
    })),
  };

  const breadcrumbLd: unknown = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: lang.breadcrumbs.home, item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: lang.breadcrumbs.news, item: `${BASE_URL}/news/${filename}` },
    ],
  };

  const organizationLd: unknown = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Hack23 AB',
    url: 'https://www.hack23.com',
    logo: `${BASE_URL}/images/android-chrome-512x512.png`,
  };

  const websiteLd: unknown = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    name: 'Riksdagsmonitor',
    url: BASE_URL,
    description: lang.schemaDescription || 'Swedish Parliament Intelligence Platform - Monitor political activity with systematic transparency',
    inLanguage: toBcp47(lang.code),
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

  const faqItems = getFaqItems('newsIndex', toChromeLang(langKey));

  const jsonLd: unknown[] = [organizationLd, websiteLd, itemListLd, breadcrumbLd];

  const extraHead = `    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700&display=swap" media="print" onload="this.media='all'">
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700&display=swap"></noscript>`;

  const extraStyle = isRTL ? `
    /* RTL-specific overrides for Arabic and Hebrew */
    .news-page .language-notice {
      border-left: none;
      border-right: 4px solid var(--primary-yellow, #ffbe0b);
    }
    .news-page .language-badge { margin-left: 0; margin-right: 0.5rem; }
` : '';

  const chrome = buildChrome({
    lang: toChromeLang(langKey),
    title: lang.title,
    description: lang.subtitle,
    keywords: lang.keywords,
    canonicalPath: `news/${filename}`,
    hreflangAlternates,
    defaultAlternateBase: filename,
    ogType: 'website',
    rssHref: langKey === 'en' ? '/rss.xml' : `/rss_${langKey}.xml`,
    breadcrumb: [
      { label: lang.breadcrumbs.home, href: `../${langKey === 'en' ? 'index.html' : `index_${langKey}.html`}` },
      { label: lang.breadcrumbs.news },
    ],
    jsonLd,
    extraHead,
    extraStyle,
    bodyClass: 'news-page',
    heroBannerImage: 'images/riksdagsmonitornews-banner.webp',
    faqItems,
    speakableSelectors: ['header.news-page-heading h1', 'header.news-page-heading .news-page-subtitle'],
  });

  const APP_VERSION = (process.env.npm_package_version ?? APP_VERSION_FALLBACK).trim();
  const APP_VERSION_MARKER = `<!-- app-version: v${APP_VERSION} -->`;
  const body = `  <div class="container">
${needsLanguageNotice ? generateLanguageNotice(langKey) : ''}

    <!-- Page heading (canonical chrome puts brand only in <header>; the
         news-index page itself owns the document <h1> for a11y heading
         hierarchy and SEO, matching sitemap.html and political-intelligence.html). -->
    <header class="news-page-heading">
      <p class="news-kicker">${escapeHtml(heroMetricLabels.pipeline)}</p>
      <h1>${escapeHtml(lang.title)}</h1>
      <p class="news-page-subtitle">${escapeHtml(lang.subtitle)}</p>
      <dl class="news-hero-metrics" aria-label="${escapeHtml(lang.title)} statistics">
        <div>
          <dt>${escapeHtml(heroMetricLabels.articles)}</dt>
          <dd>${displayArticles.length.toLocaleString(lang.code)}</dd>
        </div>
        <div>
          <dt>${escapeHtml(heroMetricLabels.languages)}</dt>
          <dd>${Object.keys(LANGUAGES).length}</dd>
        </div>
        <div>
          <dt>${escapeHtml(heroMetricLabels.latest)}</dt>
          <dd><time datetime="${latestDate}">${latestDate}</time></dd>
        </div>
      </dl>
    </header>

    <!-- Filter Bar (sticky on scroll, collapsible on mobile via <details>) -->
    <details class="filter-bar-wrapper" open>
      <summary class="filter-bar-toggle" aria-label="${escapeHtml(f.type).replace(/:$/, '')}">
        <span aria-hidden="true">⚙️</span>
        <span class="filter-bar-toggle-label">${escapeHtml(f.type).replace(/:$/, '') + ' / ' + escapeHtml(f.topic).replace(/:$/, '')}</span>
        <span class="filter-bar-active-count" id="filter-active-count" aria-live="polite"></span>
      </summary>
      <div class="filter-bar">
      <div class="filter-group">
        <label for="filter-type">${f.type}</label>
        <select id="filter-type">
          <option value="all">${escapeHtml(f.allTypes)}</option>
          <option value="prospective">${escapeHtml(f.prospective)}</option>
          <option value="retrospective">${escapeHtml(f.retrospective)}</option>
          <option value="analysis">${escapeHtml(f.analysis)}</option>
          <option value="breaking">${escapeHtml(f.breaking)}</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="filter-topic">${f.topic}</label>
        <select id="filter-topic">
          <option value="all">${escapeHtml(f.allTopics)}</option>
          <option value="parliament">${escapeHtml(f.parliament)}</option>
          <option value="government">${escapeHtml(f.government)}</option>
          <option value="eu">EU</option>
          <option value="defense">${escapeHtml(f.defense)}</option>
          <option value="environment">${escapeHtml(f.environment)}</option>
          <option value="committees">${escapeHtml(f.committees)}</option>
          <option value="legislation">${escapeHtml(f.legislation)}</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="filter-sort">${f.sort}</label>
        <select id="filter-sort">
          <option value="date-desc">${escapeHtml(f.newest)}</option>
          <option value="date-asc">${escapeHtml(f.oldest)}</option>
          <option value="title">${escapeHtml(f.titleSort)}</option>
        </select>
      </div>

      <div class="filter-group search-group">
        <label for="search-input">${escapeHtml(lang.i18n.search)}</label>
        <input type="search" id="search-input" placeholder="${escapeHtml(lang.i18n.searchPlaceholder)}" aria-label="${escapeHtml(lang.i18n.search)}" autocomplete="off">
      </div>

      <div class="filter-group filter-actions-group">
        <button type="button" id="clear-filters-btn" class="clear-filters-btn" hidden>
          <span aria-hidden="true">✕</span>
          <span class="clear-filters-label">${escapeHtml(localizeClearFilters(langKey))}</span>
        </button>
      </div>
    </div>
    </details>

    <!-- Articles Grid (skeleton state until client JS hydrates) -->
    <div class="articles-grid" id="articles-grid" aria-busy="true">
      <div class="article-card-skeleton" aria-hidden="true">
        <div class="skeleton-line skeleton-meta"></div>
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-title-2"></div>
        <div class="skeleton-line skeleton-excerpt"></div>
        <div class="skeleton-line skeleton-excerpt-2"></div>
        <div class="skeleton-line skeleton-tags"></div>
      </div>
      <div class="article-card-skeleton" aria-hidden="true">
        <div class="skeleton-line skeleton-meta"></div>
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-title-2"></div>
        <div class="skeleton-line skeleton-excerpt"></div>
        <div class="skeleton-line skeleton-excerpt-2"></div>
        <div class="skeleton-line skeleton-tags"></div>
      </div>
      <div class="article-card-skeleton" aria-hidden="true">
        <div class="skeleton-line skeleton-meta"></div>
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-title-2"></div>
        <div class="skeleton-line skeleton-excerpt"></div>
        <div class="skeleton-line skeleton-excerpt-2"></div>
        <div class="skeleton-line skeleton-tags"></div>
      </div>
    </div>

    <div id="no-articles" style="text-align: center; padding: 3rem; color: #888;" hidden>
      ${escapeHtml(lang.i18n.noArticles)}
    </div>

    <div id="no-results" style="text-align: center; padding: 3rem; color: #888;" hidden>
      ${escapeHtml(lang.noResults)}
    </div>

    <!-- Pagination controls -->
    <div class="pagination-controls" role="navigation" aria-label="${escapeHtml(lang.i18n.loadMore)}">
      <p id="article-counter" class="article-counter" aria-live="polite" aria-atomic="true"></p>
      <button id="load-more-btn" class="load-more-btn btn" hidden aria-label="${escapeHtml(lang.i18n.loadMore)}">${escapeHtml(lang.i18n.loadMore)}</button>
    </div>
  </div>

  <script>
    // Language flags mapping (shared with server-side)
    const LANGUAGE_FLAGS = ${JSON.stringify(LANGUAGE_FLAGS)};

    // RTL page flag (used to set dir="ltr" on language badges)
    const IS_RTL = ${isRTL};

    // Available in translation (for current language)
    const AVAILABLE_IN_TEXT = '${escapeHtml(AVAILABLE_IN_TRANSLATIONS[langKey] || 'Available in')}';

    // HTML-escape helper to prevent XSS when interpolating article fields into innerHTML
    function esc(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
    }

    function safeHref(slug) {
      var s = String(slug);
      // Allow relative HTML paths including subdirectory articles (e.g. "2026-05-04-election-cycle/current-en.html").
      // Block control chars, backslashes, and protocol-relative URLs.
      if (!s || /[\\\\\\x00-\\x1F\\x7F]/.test(s) || s.indexOf('//') === 0) {
        return '#';
      }
      if (!/^[A-Za-z0-9._/-]+\\.html$/.test(s)) {
        return '#';
      }
      return esc(s);
    }

    // Pagination i18n strings
    const i18nLoadMore = ${JSON.stringify(lang.i18n.loadMore)};
    const i18nShowingConfig = ${JSON.stringify(lang.i18n.showing)};
    function i18nShowing(shown, total) {
      var template;
      if (i18nShowingConfig && typeof i18nShowingConfig === 'object') {
        if (shown === 1 && Object.prototype.hasOwnProperty.call(i18nShowingConfig, 'one')) {
          template = i18nShowingConfig.one;
        } else if (Object.prototype.hasOwnProperty.call(i18nShowingConfig, 'other')) {
          template = i18nShowingConfig.other;
        } else {
          template = String(i18nShowingConfig);
        }
      } else {
        template = i18nShowingConfig || '';
      }
      if (typeof template !== 'string') {
        template = String(template);
      }
      return template
        .replace('{shown}', String(shown))
        .replace('{total}', String(total));
    }

    // Pagination state
    const PAGE_SIZE = 20;
    let visibleCount = PAGE_SIZE;
    let restoringFromURL = false;

    // Dynamic articles array - generated from news/ directory
    const articles = ${JSON.stringify(displayData, null, 2).replace(/<\//g, '<\\/')};

    let filteredArticles = [...articles];

    function buildArticleCard(article) {
      const flag = LANGUAGE_FLAGS[article.lang] || '🌐';
      const dirAttr = IS_RTL ? ' dir="ltr"' : '';
      const langBadge = \`<span class="language-badge"\${dirAttr} aria-label="\${esc(article.lang)} language"><span aria-hidden="true">\${flag}</span> \${esc(article.lang.toUpperCase())}</span>\`;

      const availableLangs = article.availableLanguages || [article.lang];
      let availableDisplay = '';
      if (availableLangs.length > 1) {
        const availableBadges = availableLangs.map(l => {
          const lf = LANGUAGE_FLAGS[l] || '🌐';
          return \`<span class="lang-badge-sm"\${dirAttr}><span aria-hidden="true">\${lf}</span> \${esc(l.toUpperCase())}</span>\`;
        }).join(' ');
        availableDisplay = \`<p class="available-languages"><strong>\${AVAILABLE_IN_TEXT}:</strong> \${availableBadges}</p>\`;
      }

      const primaryTopic = (article.topics && article.topics.length > 0) ? article.topics[0] : '';
      const recency = computeRecency(article.date);
      const recencyAttr = recency ? \` data-date-recent="\${recency}"\` : '';
      const recencyBadge = recency ? \`<span class="recency-badge" data-recency="\${recency}">\${esc(localizeRecency(recency))}</span>\` : '';

      return \`
      <article class="article-card" data-type="\${esc(article.type)}" data-topic="\${esc(primaryTopic)}"\${recencyAttr}>
        <div class="article-meta">
          <time class="article-date" datetime="\${esc(article.date)}">\${formatDate(article.date)}</time>
          <span class="article-type" data-type="\${esc(article.type)}">\${typeIcon(article.type)} \${localizeType(article.type)}</span>
          \${recencyBadge}
          \${langBadge}
        </div>
        <h2 class="article-title">
          <a href="\${safeHref(article.slug)}">\${esc(article.title)}</a>
        </h2>
        <p class="article-excerpt">\${esc(article.excerpt)}</p>
        \${availableDisplay}
        <div class="article-tags">
          \${article.tags.filter(Boolean).map(tag => \`<span class="tag">\${esc(tag)}</span>\`).join('')}
        </div>
      </article>
    \`;
    }

    // Compute coarse recency bucket so CSS can surface a "today" / "this-week"
    // / "this-month" badge without re-running JS per scroll. Uses the
    // article date in the user's timezone, not UTC, so "today" feels right.
    function computeRecency(dateStr) {
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        const now = new Date();
        const dayMs = 24 * 60 * 60 * 1000;
        const diff = (now.getTime() - d.getTime()) / dayMs;
        if (diff < 0) return null;             // future-dated, leave plain
        if (diff < 1.0) return 'today';
        if (diff < 7.0) return 'this-week';
        if (diff < 31.0) return 'this-month';
        return null;
      } catch (e) { return null; }
    }

    const RECENCY_LABELS = ${JSON.stringify(buildRecencyLabels(langKey))};
    function localizeRecency(bucket) {
      return RECENCY_LABELS[bucket] || bucket;
    }

    // Emoji icon per article type — keeps the visual language consistent with
    // the rest of the site (root index.html, political-intelligence.html).
    function typeIcon(type) {
      switch (type) {
        case 'prospective': return '<span aria-hidden="true">🔮</span>';
        case 'retrospective': return '<span aria-hidden="true">📊</span>';
        case 'analysis': return '<span aria-hidden="true">🧠</span>';
        case 'breaking': return '<span aria-hidden="true">⚡</span>';
        default: return '<span aria-hidden="true">📰</span>';
      }
    }

    function renderPage() {
      const grid = document.getElementById('articles-grid');
      const noArticles = document.getElementById('no-articles');
      const noResults = document.getElementById('no-results');
      const counter = document.getElementById('article-counter');
      const btn = document.getElementById('load-more-btn');

      if (articles.length === 0) {
        grid.innerHTML = '';
        grid.removeAttribute('aria-busy');
        if (noArticles) noArticles.hidden = false;
        noResults.hidden = true;
        if (counter) counter.textContent = '';
        if (btn) btn.hidden = true;
        updateFilterChrome();
        return;
      }

      if (filteredArticles.length === 0) {
        grid.innerHTML = '';
        grid.removeAttribute('aria-busy');
        noResults.hidden = false;
        if (noArticles) noArticles.hidden = true;
        if (counter) counter.textContent = '';
        if (btn) btn.hidden = true;
        updateFilterChrome();
        return;
      }

      if (noArticles) noArticles.hidden = true;
      noResults.hidden = true;

      const visible = filteredArticles.slice(0, visibleCount);
      grid.innerHTML = visible.map(buildArticleCard).join('');
      grid.removeAttribute('aria-busy');

      const shown = visible.length;
      const total = filteredArticles.length;
      if (counter) counter.textContent = i18nShowing(shown, total);

      if (btn) {
        if (total > visibleCount) {
          btn.hidden = false;
          btn.setAttribute('aria-label', i18nLoadMore);
        } else {
          btn.hidden = true;
        }
      }

      updateFilterChrome();
    }

    // Show/hide the "Clear filters" button + active-count badge based on
    // whether any filter is set away from its default. Keeps the filter
    // bar honest: empty state shows zero affordances, active state shows
    // exactly how many filters are biting.
    function updateFilterChrome() {
      const typeFilter = document.getElementById('filter-type').value;
      const topicFilter = document.getElementById('filter-topic').value;
      const sortFilter = document.getElementById('filter-sort').value;
      const searchInput = document.getElementById('search-input').value.trim();

      let activeCount = 0;
      if (typeFilter !== 'all') activeCount++;
      if (topicFilter !== 'all') activeCount++;
      if (sortFilter !== 'date-desc') activeCount++;
      if (searchInput) activeCount++;

      const clearBtn = document.getElementById('clear-filters-btn');
      if (clearBtn) {
        clearBtn.hidden = activeCount === 0;
      }
      const countBadge = document.getElementById('filter-active-count');
      if (countBadge) {
        countBadge.textContent = activeCount > 0 ? '(' + activeCount + ')' : '';
        countBadge.hidden = activeCount === 0;
      }
    }

    function clearAllFilters() {
      const typeEl = document.getElementById('filter-type');
      const topicEl = document.getElementById('filter-topic');
      const sortEl = document.getElementById('filter-sort');
      const searchEl = document.getElementById('search-input');
      if (typeEl) typeEl.value = 'all';
      if (topicEl) topicEl.value = 'all';
      if (sortEl) sortEl.value = 'date-desc';
      if (searchEl) searchEl.value = '';
      filterArticles();
      if (searchEl) searchEl.focus();
    }

    function loadMore() {
      const prevCount = visibleCount;
      visibleCount += PAGE_SIZE;
      updateURL();
      renderPage();
      const cards = document.querySelectorAll('.article-card');
      if (cards[prevCount]) {
        const link = cards[prevCount].querySelector('a');
        if (link) link.focus();
      }
    }

    function updateURL() {
      const typeFilter = document.getElementById('filter-type').value;
      const topicFilter = document.getElementById('filter-topic').value;
      const sortFilter = document.getElementById('filter-sort').value;
      const searchInput = document.getElementById('search-input').value.trim();
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (topicFilter !== 'all') params.set('topic', topicFilter);
      if (sortFilter !== 'date-desc') params.set('sort', sortFilter);
      if (searchInput) params.set('q', searchInput);
      const effectiveVisible = Math.min(visibleCount, filteredArticles.length);
      const page = Math.ceil(effectiveVisible / PAGE_SIZE);
      if (page > 1 && filteredArticles.length > PAGE_SIZE) {
        params.set('page', String(page));
      }
      const newURL = params.toString() ? '?' + params.toString() : window.location.pathname;
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', newURL);
      }
    }

    const typeLabels = ${JSON.stringify({
      prospective: f.prospective,
      retrospective: f.retrospective,
      analysis: f.analysis,
      breaking: f.breaking,
    })};

    function localizeType(type) {
      return typeLabels[type] || type;
    }

    function formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString('${lang.code}', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function filterArticles() {
      const typeFilter = document.getElementById('filter-type').value;
      const topicFilter = document.getElementById('filter-topic').value;
      const sortFilter = document.getElementById('filter-sort').value;
      const searchQuery = document.getElementById('search-input').value.toLowerCase().trim();

      let filtered = [...articles];

      if (typeFilter !== 'all') {
        filtered = filtered.filter(article => article.type === typeFilter);
      }

      if (topicFilter !== 'all') {
        filtered = filtered.filter(article => article.topics.includes(topicFilter));
      }

      if (searchQuery) {
        filtered = filtered.filter(article => article.title.toLowerCase().includes(searchQuery));
      }

      switch(sortFilter) {
        case 'date-desc':
          filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
          break;
        case 'date-asc':
          filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
          break;
        case 'title':
          filtered.sort((a, b) => a.title.localeCompare(b.title));
          break;
      }

      filteredArticles = filtered;
      if (restoringFromURL) {
        restoringFromURL = false;
      } else {
        visibleCount = PAGE_SIZE;
      }
      updateURL();
      renderPage();
    }

    function readURLParams() {
      const params = new URLSearchParams(window.location.search);

      function safeSetSelect(id, value) {
        const el = document.getElementById(id);
        if (!el) return;
        const opts = Array.from(el.options);
        if (opts.some(o => o.value === value)) {
          el.value = value;
        }
      }

      if (params.has('type')) safeSetSelect('filter-type', params.get('type'));
      if (params.has('topic')) safeSetSelect('filter-topic', params.get('topic'));
      if (params.has('sort')) safeSetSelect('filter-sort', params.get('sort'));
      const searchInput = document.getElementById('search-input');
      if (searchInput && params.has('q')) searchInput.value = params.get('q');
      if (params.has('page')) {
        const page = parseInt(params.get('page'), 10);
        if (!isNaN(page) && page > 1) {
          visibleCount = page * PAGE_SIZE;
          restoringFromURL = true;
        }
      }
    }

    document.getElementById('filter-type').addEventListener('change', filterArticles);
    document.getElementById('filter-topic').addEventListener('change', filterArticles);
    document.getElementById('filter-sort').addEventListener('change', filterArticles);
    document.getElementById('load-more-btn').addEventListener('click', loadMore);
    var __clearBtn = document.getElementById('clear-filters-btn');
    if (__clearBtn) __clearBtn.addEventListener('click', clearAllFilters);

    let searchTimer;
    document.getElementById('search-input').addEventListener('input', function() {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(filterArticles, 300);
    });

    readURLParams();
    filterArticles();
  </script>

  <section class="ai-newsroom-section" aria-labelledby="ai-newsroom-heading">
    <div class="container">
      <h2 id="ai-newsroom-heading"><span aria-hidden="true">🤖</span> ${escapeHtml(lang.aiNewsroomTitle)}</h2>
      <p>${escapeHtml(lang.aiNewsroomText)}</p>
    </div>
  </section>

  <!-- SEO: crawler-visible article list (capped at 200 most-recent to
       keep HTML size / parse time reasonable). The .articles-grid above is
       hydrated client-side from JSON, leaving search-engine crawlers
       with only a skeleton + the truncated 10-item ItemList JSON-LD.
       This collapsible fallback exposes article URLs + titles + dates
       in the initial HTML so the archive is discoverable from the index
       page even without JS. Using <details> keeps the list out of the
       default keyboard tab order and avoids overwhelming screen readers
       while remaining fully crawlable. -->
  <details class="seo-article-list" aria-labelledby="seo-article-list-heading">
    <summary id="seo-article-list-heading">${escapeHtml(lang.title)} — ${Math.min(displayArticles.length, 200)} / ${displayArticles.length}</summary>
    <ul>
${displayArticles.slice(0, 200).map((a) => `      <li><a href="${escapeHtml(a.slug)}"><time datetime="${escapeHtml(a.date)}">${escapeHtml(a.date)}</time> — ${escapeHtml(a.title)}</a></li>`).join('\n')}
    </ul>${displayArticles.length > 200 ? `\n    <p><a href="/sitemap_${langKey === 'en' ? '' : langKey + '_'}html">→ Full archive (${displayArticles.length} articles)</a></p>` : ''}
  </details>

  <section class="news-faq-section" aria-labelledby="news-faq-heading">
    <div class="container">
      <h2 id="news-faq-heading"><span aria-hidden="true">❓</span> ${escapeHtml(FAQ_HEADING[toChromeLang(langKey)])}</h2>
${faqItems.map((f) => `      <details class="news-faq-item">
        <summary>${escapeHtml(f.question)}</summary>
        <p>${escapeHtml(f.answer)}</p>
      </details>`).join('\n')}
    </div>
  </section>
  ${APP_VERSION_MARKER}`;

  const html = `${chrome.head}
${chrome.headerHtml}
${body}
${chrome.footerHtml}`;

  return html;
}

/**
 * Generate hreflang tags for all languages.
 * NOTE: kept as a public export for backward compatibility with tests; the
 * canonical hreflang block is now emitted by `buildChrome`.
 */
export function generateHreflangTags(): string {
  const tags: string[] = [];

  Object.keys(LANGUAGES).forEach((langKey) => {
    const filename: string = langKey === 'en' ? 'index.html' : `index_${langKey === 'no' ? 'no' : langKey}.html`;
    const hrefLang: string = (LANGUAGES as Record<string, LanguageConfig>)[langKey]!.code;
    tags.push(`  <link rel="alternate" hreflang="${hrefLang}" href="https://riksdagsmonitor.com/news/${filename}">`);
  });

  tags.push(`  <link rel="alternate" hreflang="x-default" href="https://riksdagsmonitor.com/news/index.html">`);

  return tags.join('\n');
}

/**
 * Generate minimal RTL-specific styles.
 * NOTE: kept as a public export for backward compatibility; the canonical
 * RTL handling is now performed by `buildChrome` via `dir="rtl"` on `<html>`.
 */
export function generateRTLStyles(isRTL: boolean | undefined): string {
  if (!isRTL) return '';

  return `
  <style>
    /* RTL-specific overrides for Arabic and Hebrew */
    .news-page .language-notice {
      border-left: none;
      border-right: 4px solid var(--primary-yellow, #ffbe0b);
    }

    .news-page .language-badge {
      margin-left: 0;
      margin-right: 0.5rem;
    }

    .news-page .back-link:hover {
      transform: translateX(5px); /* Reverse direction for RTL */
    }
  </style>`;
}

/**
 * Generate language availability notice for non-EN/SV indexes.
 */
export function generateLanguageNotice(langKey: string): string {
  const messages: Record<string, LanguageNoticeMessage> = {
    da: { title: 'Artikler tilgængelige på engelsk', text: 'Artikler er i øjeblikket kun tilgængelige på engelsk og svensk. Automatisk oversættelse til dansk kommer snart.' },
    no: { title: 'Artikler tilgjengelige på engelsk', text: 'Artikler er for tiden kun tilgjengelige på engelsk og svensk. Automatisk oversettelse til norsk kommer snart.' },
    fi: { title: 'Artikkelit saatavilla englanniksi', text: 'Artikkelit ovat tällä hetkellä saatavilla vain englanniksi ja ruotsiksi. Automaattinen käännös suomeksi tulossa pian.' },
    de: { title: 'Artikel auf Englisch verfügbar', text: 'Artikel sind derzeit nur auf Englisch und Schwedisch verfügbar. Automatische Übersetzung ins Deutsche folgt in Kürze.' },
    fr: { title: 'Articles disponibles en anglais', text: 'Les articles ne sont actuellement disponibles qu\'en anglais et en suédois. La traduction automatique en français arrive bientôt.' },
    es: { title: 'Artículos disponibles en inglés', text: 'Los artículos actualmente solo están disponibles en inglés y sueco. La traducción automática al español estará disponible pronto.' },
    nl: { title: 'Artikelen beschikbaar in het Engels', text: 'Artikelen zijn momenteel alleen beschikbaar in het Engels en Zweeds. Automatische vertaling naar het Nederlands komt binnenkort.' },
    ar: { title: 'المقالات متاحة بالإنجليزية', text: 'المقالات متاحة حالياً باللغتين الإنجليزية والسويدية فقط. الترجمة الآلية إلى العربية قريباً.' },
    he: { title: 'מאמרים זמינים באנגלית', text: 'מאמרים זמינים כעת רק באנגלית ובשוודית. תרגום אוטומטי לעברית בקרוב.' },
    ja: { title: '英語で利用可能な記事', text: '記事は現在、英語とスウェーデン語のみで利用可能です。日本語への自動翻訳は近日公開予定です。' },
    ko: { title: '영어로 제공되는 기사', text: '기사는 현재 영어와 스웨덴어로만 제공됩니다. 한국어 자동 번역이 곧 제공될 예정입니다.' },
    zh: { title: '文章以英文提供', text: '文章目前仅提供英文和瑞典文版本。中文自动翻译即将推出。' },
  };

  const msg: LanguageNoticeMessage | undefined = messages[langKey];
  if (!msg) return '';

  const isRTL: boolean = ['ar', 'he'].includes(langKey);

  return `    <div class="language-notice">
      <h2>${msg.title}</h2>
      <p>${msg.text} <span class="language-badge"${isRTL ? ' dir="ltr"' : ''} aria-label="English language"><span aria-hidden="true">🇬🇧</span> EN</span></p>
    </div>
`;
}
