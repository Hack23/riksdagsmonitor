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
import {
  generateLanguageSwitcherNav,
  generateAvailableLanguages,
} from './helpers.js';

export function generateIndexHTML(
  langKey: string,
  languageArticles: NewsArticleMetadata[],
  _allArticlesByLang: Record<string, NewsArticleMetadata[]>,
): string {
  const lang: LanguageConfig = (LANGUAGES as Record<string, LanguageConfig>)[langKey]!;
  const f: FilterLabels = lang.filters;
  const filename: string = langKey === 'en' ? 'index.html' : `index_${langKey === 'no' ? 'no' : langKey}.html`;
  const mainIndex: string = langKey === 'en' ? 'index.html' : `index_${langKey === 'no' ? 'no' : langKey}.html`;
  const isRTL: boolean = ['ar', 'he'].includes(langKey);

  // Display only articles in this language
  const displayArticles: NewsArticleMetadata[] = languageArticles;
  const needsLanguageNotice: boolean = languageArticles.length === 0;

  const escapedSubtitle: string = escapeHtml(lang.subtitle);

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

  const html = `<!DOCTYPE html>
<html lang="${lang.code}"${lang.rtl ? ' dir="rtl"' : ''}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(lang.title)} - Riksdagsmonitor</title>
  <meta name="description" content="${escapedSubtitle}">
  <meta name="keywords" content="${escapeHtml(lang.keywords)}">
  <meta name="author" content="James Pether Sörling, CISSP, CISM">
  <link rel="canonical" href="https://riksdagsmonitor.com/news/${filename}">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(lang.title)} - Riksdagsmonitor">
  <meta property="og:description" content="${escapedSubtitle}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://riksdagsmonitor.com/news/${filename}">
  <meta property="og:image" content="https://hack23.com/cia-icon-140.webp">
  <meta property="og:site_name" content="Riksdagsmonitor">
  <meta property="og:locale" content="${lang.locale}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(lang.title)} - Riksdagsmonitor">
  <meta name="twitter:description" content="${escapedSubtitle}">
  <meta name="twitter:image" content="https://hack23.com/cia-icon-140.webp">
  
  <!-- Hreflang -->
${generateHreflangTags()}
  
  <!-- Schema.org ItemList structured data for article aggregation -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "${escapeHtml(lang.title)}",
    "description": "${escapedSubtitle}",
    "numberOfItems": ${displayArticles.length},
    "itemListElement": [${displayArticles.slice(0, 10).map((article, index) => `
      {
        "@type": "ListItem",
        "position": ${index + 1},
        "item": {
          "@type": "NewsArticle",
          "headline": "${escapeHtml(article.title)}",
          "url": "https://riksdagsmonitor.com/news/${article.slug}",
          "datePublished": "${article.date}",
          "description": "${(d => d.length > 150 ? d.substring(0, 150).replace(/\s+\S*$/, '') + '...' : d)(escapeHtml(article.description))}",
          "inLanguage": "${article.lang || lang.code}",
          "author": {
            "@type": "Organization",
            "name": "Riksdagsmonitor"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Hack23 AB",
            "logo": {
              "@type": "ImageObject",
              "url": "https://hack23.com/cia-icon-140.webp"
            }
          },
          "articleSection": "${escapeHtml(lang.breadcrumbs.news)}",
          "about": {
            "@type": "GovernmentOrganization",
            "name": "Riksdag",
            "alternateName": "Swedish Parliament",
            "url": "https://www.riksdagen.se/"
          }
        }
      }`).join(',')}
    ]
  }
  </script>
  
  <!-- BreadcrumbList structured data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "${escapeHtml(lang.breadcrumbs.home)}",
        "item": "https://riksdagsmonitor.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "${escapeHtml(lang.breadcrumbs.news)}",
        "item": "https://riksdagsmonitor.com/news/${filename}"
      }
    ]
  }
  </script>
  
  <!-- WebSite structured data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Riksdagsmonitor",
    "url": "https://riksdagsmonitor.com",
    "description": "${escapeHtml(lang.schemaDescription || 'Swedish Parliament Intelligence Platform - Monitor political activity with systematic transparency')}",
    "inLanguage": "${lang.code}",
    "publisher": {
      "@type": "Organization",
      "name": "Hack23 AB",
      "logo": {
        "@type": "ImageObject",
        "url": "https://hack23.com/cia-icon-140.webp"
      }
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://riksdagsmonitor.com/news/${filename}?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }
  </script>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" href="https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7.woff2" as="font" type="font/woff2" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700&display=swap" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700&display=swap"></noscript>
  
  <link rel="stylesheet" href="../styles.css">
  ${generateRTLStyles(lang.rtl)}
</head>
<body class="news-page">
  <header class="header-section">
    <div class="header-content">
      <h1>${escapeHtml(lang.title)}</h1>
      <p class="subtitle">${lang.subtitle}</p>
      <a href="../${mainIndex}" class="back-link">\u2190 ${escapeHtml(lang.backLink)}</a>
    </div>
  </header>
  ${generateLanguageSwitcherNav(langKey)}
  <main role="main">
  <div class="container">
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
    
    <div id="no-articles" style="display: none; text-align: center; padding: 3rem; color: #888;">
      ${escapeHtml(lang.i18n.noArticles)}
    </div>
    
    <div id="no-results" style="display: none; text-align: center; padding: 3rem; color: #888;">
      ${escapeHtml(lang.noResults)}
    </div>
    
    <!-- Pagination controls -->
    <div class="pagination-controls" role="navigation" aria-label="${escapeHtml(lang.i18n.loadMore)}">
      <p id="article-counter" class="article-counter" aria-live="polite" aria-atomic="true"></p>
      <button id="load-more-btn" class="load-more-btn btn" style="display:none" aria-label="${escapeHtml(lang.i18n.loadMore)}">${escapeHtml(lang.i18n.loadMore)}</button>
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
      // Reject empty strings, backslashes, and control characters outright.
      if (!s || /[\\\\\\x00-\\x1F\\x7F]/.test(s)) {
        return '#';
      }
      // Allow only [A-Za-z0-9._-] characters with a required ".html" suffix.
      if (!/^[A-Za-z0-9._-]+\\.html$/.test(s)) {
        return '#';
      }
      return esc(s);
    }
    
    // Pagination i18n strings
    const i18nLoadMore = ${JSON.stringify(lang.i18n.loadMore)};
    const i18nShowingTemplate = ${JSON.stringify(lang.i18n.showing)};
    function i18nShowing(shown, total) {
      return i18nShowingTemplate
        .replace('{shown}', String(shown))
        .replace('{total}', String(total));
    }
    
    // Pagination state
    const PAGE_SIZE = 20;
    let visibleCount = PAGE_SIZE;
    
    // Dynamic articles array - generated from news/ directory
    const articles = ${JSON.stringify(displayData, null, 2).replace(/<\//g, '<\\/')};
    
    let filteredArticles = [...articles];
    
    function buildArticleCard(article) {
      // Generate language badge for the article using shared LANGUAGE_FLAGS
      const flag = LANGUAGE_FLAGS[article.lang] || '🌐';
      const dirAttr = IS_RTL ? ' dir="ltr"' : '';
      const langBadge = \`<span class="language-badge"\${dirAttr} aria-label="\${esc(article.lang)} language"><span aria-hidden="true">\${flag}</span> \${esc(article.lang.toUpperCase())}</span>\`;
      
      // Generate available languages display if multiple languages exist
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
        if (noArticles) noArticles.style.display = 'block';
        noResults.style.display = 'none';
        if (counter) counter.textContent = '';
        if (btn) btn.style.display = 'none';
        return;
      }
      
      if (filteredArticles.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        if (noArticles) noArticles.style.display = 'none';
        if (counter) counter.textContent = '';
        if (btn) btn.style.display = 'none';
        return;
      }
      
      if (noArticles) noArticles.style.display = 'none';
      noResults.style.display = 'none';
      
      const visible = filteredArticles.slice(0, visibleCount);
      grid.innerHTML = visible.map(buildArticleCard).join('');
      
      // Update counter
      const shown = visible.length;
      const total = filteredArticles.length;
      if (counter) counter.textContent = i18nShowing(shown, total);
      
      // Update load more button
      if (btn) {
        if (total > visibleCount) {
          btn.style.display = 'inline-block';
          btn.setAttribute('aria-label', i18nLoadMore);
        } else {
          btn.style.display = 'none';
        }
      }
    }
    
    function loadMore() {
      const prevCount = visibleCount;
      visibleCount += PAGE_SIZE;
      updateURL();
      renderPage();
      // Focus management: move focus to first newly visible article link
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
      const page = Math.ceil(visibleCount / PAGE_SIZE);
      if (page > 1) params.set('page', String(page));
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
      
      // Apply type filter
      if (typeFilter !== 'all') {
        filtered = filtered.filter(article => article.type === typeFilter);
      }
      
      // Apply topic filter
      if (topicFilter !== 'all') {
        filtered = filtered.filter(article => article.topics.includes(topicFilter));
      }
      
      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter(article => article.title.toLowerCase().includes(searchQuery));
      }
      
      // Apply sorting
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
      visibleCount = PAGE_SIZE;
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
        if (!isNaN(page) && page > 1) visibleCount = page * PAGE_SIZE;
      }
    }
    
    // Event listeners
    document.getElementById('filter-type').addEventListener('change', filterArticles);
    document.getElementById('filter-topic').addEventListener('change', filterArticles);
    document.getElementById('filter-sort').addEventListener('change', filterArticles);
    document.getElementById('load-more-btn').addEventListener('click', loadMore);
    
    // Debounced search input listener
    let searchTimer;
    document.getElementById('search-input').addEventListener('input', function() {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(filterArticles, 300);
    });
    
    // Read URL state and render
    readURLParams();
    filterArticles();
  </script>

  </main>
  <footer class="footer-section">
    <p>&copy; 2026 Riksdagsmonitor - Swedish Parliament Intelligence</p>
  </footer>
</body>
</html>`;

  return html;
}

/**
 * Generate hreflang tags for all languages.
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
 * All other styles are now in styles.css under .news-page scope.
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
