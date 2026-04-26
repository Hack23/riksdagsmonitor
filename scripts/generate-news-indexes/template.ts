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
import type { Language } from '../types/language.js';

const APP_VERSION_FALLBACK = '0.0.0';

const BASE_URL = 'https://riksdagsmonitor.com';

/** Map a news-index `langKey` to a `Language` accepted by `buildChrome`. */
function toChromeLang(langKey: string): Language {
  // The render-lib `Language` union currently uses the legacy `'no'` code
  // for Norwegian (BCP-47 hreflang `nb` is emitted by `LANGUAGE_META.no`).
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

  // Display only articles in this language
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

  // ── Build hreflang alternates map for the chrome —————————————————
  const hreflangAlternates: Partial<Record<Language, string>> = {};
  for (const k of Object.keys(LANGUAGES)) {
    const fName = k === 'en' ? 'index.html' : `index_${k === 'no' ? 'no' : k}.html`;
    hreflangAlternates[toChromeLang(k)] = `news/${fName}`;
  }

  // ── JSON-LD: Organization + WebSite (always) + ItemList + BreadcrumbList ──
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
        datePublished: article.date,
        description: article.description.length > 150
          ? article.description.substring(0, 150).replace(/\s+\S*$/, '') + '...'
          : article.description,
        inLanguage: article.lang || lang.code,
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
    name: 'Riksdagsmonitor',
    url: BASE_URL,
    description: lang.schemaDescription || 'Swedish Parliament Intelligence Platform - Monitor political activity with systematic transparency',
    inLanguage: lang.code,
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

  const jsonLd: unknown[] = [organizationLd, websiteLd, itemListLd, breadcrumbLd];

  // News-index needs a Google Fonts preconnect (Inter + Orbitron) plus a
  // small RTL override block. Chrome owns the rest of <head>.
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
  });

  // News-index body — preserves the rich filter bar, articles grid, JS,
  // pagination, AI-newsroom block. The surrounding chrome (head, header,
  // theme toggle, lang switcher, 3-column footer) is now provided by
  // `buildChrome` for parity with the article + sitemap + PI renderers.
  const APP_VERSION = (process.env.npm_package_version ?? APP_VERSION_FALLBACK).trim();
  const APP_VERSION_MARKER = `<!-- app-version: v${APP_VERSION} -->`;
  const body = `  <div class="container">
${needsLanguageNotice ? generateLanguageNotice(langKey) : ''}

    <!-- Filter Bar -->
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
    </div>

    <!-- Articles Grid -->
    <div class="articles-grid" id="articles-grid"></div>

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
      // Only allow simple relative HTML filenames to avoid URL parsing/normalization issues.
      if (!s || /[\\\\\\x00-\\x1F\\x7F]/.test(s)) {
        return '#';
      }
      if (!/^[A-Za-z0-9._-]+\\.html$/.test(s)) {
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

      return \`
      <article class="article-card">
        <div class="article-meta">
          <time class="article-date" datetime="\${esc(article.date)}">\${formatDate(article.date)}</time>
          <span class="article-type">\${localizeType(article.type)}</span>
          \${langBadge}
        </div>
        <h2 class="article-title">
          <a href="\${safeHref(article.slug)}">\${esc(article.title)}</a>
        </h2>
        <p class="article-excerpt">\${esc(article.excerpt)}</p>
        \${availableDisplay}
        <div class="article-tags">
          \${article.tags.map(tag => \`<span class="tag">\${esc(tag)}</span>\`).join('')}
        </div>
      </article>
    \`;
    }

    function renderPage() {
      const grid = document.getElementById('articles-grid');
      const noArticles = document.getElementById('no-articles');
      const noResults = document.getElementById('no-results');
      const counter = document.getElementById('article-counter');
      const btn = document.getElementById('load-more-btn');

      if (articles.length === 0) {
        grid.innerHTML = '';
        if (noArticles) noArticles.hidden = false;
        noResults.hidden = true;
        if (counter) counter.textContent = '';
        if (btn) btn.hidden = true;
        return;
      }

      if (filteredArticles.length === 0) {
        grid.innerHTML = '';
        noResults.hidden = false;
        if (noArticles) noArticles.hidden = true;
        if (counter) counter.textContent = '';
        if (btn) btn.hidden = true;
        return;
      }

      if (noArticles) noArticles.hidden = true;
      noResults.hidden = true;

      const visible = filteredArticles.slice(0, visibleCount);
      grid.innerHTML = visible.map(buildArticleCard).join('');

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
