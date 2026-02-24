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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Orbitron:wght@400;500;600;700&display=swap" rel="stylesheet">
  
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
    </div>
    
    <!-- Articles Grid -->
    <div class="articles-grid" id="articles-grid"></div>
    
    <div id="no-results" style="display: none; text-align: center; padding: 3rem; color: #888;">
      ${escapeHtml(lang.noResults)}
    </div>
  </div>
  
  <script>
    // Language flags mapping (shared with server-side)
    const LANGUAGE_FLAGS = ${JSON.stringify(LANGUAGE_FLAGS)};
    
    // Available in translation (for current language)
    const AVAILABLE_IN_TEXT = '${escapeHtml(AVAILABLE_IN_TRANSLATIONS[langKey] || 'Available in')}';
    
    // Dynamic articles array - generated from news/ directory
    const articles = ${JSON.stringify(displayData, null, 2)};
    
    let filteredArticles = [...articles];
    
    function renderArticles(articlesToRender) {
      const grid = document.getElementById('articles-grid');
      const noResults = document.getElementById('no-results');
      
      if (articlesToRender.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        return;
      }
      
      noResults.style.display = 'none';
      
      grid.innerHTML = articlesToRender.map(article => {
        // Generate language badge for the article using shared LANGUAGE_FLAGS
        const flag = LANGUAGE_FLAGS[article.lang] || '🌐';
        const langBadge = \`<span class="language-badge" aria-label="\${article.lang} language"><span aria-hidden="true">\${flag}</span> \${article.lang.toUpperCase()}</span>\`;
        
        // Generate available languages display if multiple languages exist
        const availableLangs = article.availableLanguages || [article.lang];
        let availableDisplay = '';
        if (availableLangs.length > 1) {
          const availableBadges = availableLangs.map(l => {
            const f = LANGUAGE_FLAGS[l] || '🌐';
            return \`<span class="lang-badge-sm"><span aria-hidden="true">\${f}</span> \${l.toUpperCase()}</span>\`;
          }).join(' ');
          availableDisplay = \`<p class="available-languages"><strong>\${AVAILABLE_IN_TEXT}:</strong> \${availableBadges}</p>\`;
        }
        
        return \`
        <article class="article-card">
          <div class="article-meta">
            <time class="article-date" datetime="\${article.date}">\${formatDate(article.date)}</time>
            <span class="article-type">\${localizeType(article.type)}</span>
            \${langBadge}
          </div>
          <h2 class="article-title">
            <a href="\${article.slug}">\${article.title}</a>
          </h2>
          <p class="article-excerpt">\${article.excerpt}</p>
          \${availableDisplay}
          <div class="article-tags">
            \${article.tags.map(tag => \`<span class="tag">\${tag}</span>\`).join('')}
          </div>
        </article>
      \`;
      }).join('');
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
      
      let filtered = [...articles];
      
      // Apply type filter
      if (typeFilter !== 'all') {
        filtered = filtered.filter(article => article.type === typeFilter);
      }
      
      // Apply topic filter
      if (topicFilter !== 'all') {
        filtered = filtered.filter(article => article.topics.includes(topicFilter));
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
      renderArticles(filteredArticles);
    }
    
    // Event listeners
    document.getElementById('filter-type').addEventListener('change', filterArticles);
    document.getElementById('filter-topic').addEventListener('change', filterArticles);
    document.getElementById('filter-sort').addEventListener('change', filterArticles);
    
    // Initial render
    filterArticles();
  </script>

  <!-- Dynamic Content Loader -->
  <script>
    // Localization data
    const i18n = {
      noArticles: '${lang.i18n.noArticles}',
      loading: '${lang.i18n.loading}',
      articleCount: ${lang.i18n.articleCount}
    };
    
    // Dynamic content loader
    document.addEventListener('DOMContentLoaded', () => {
      const articlesGrid = document.querySelector('.articles-grid');
      if (!articlesGrid) return;
      
      const articleCards = articlesGrid.querySelectorAll('.article-card');
      const articleCount = articleCards.length;
      
      // Update article count if element exists
      const countElement = document.querySelector('.article-count');
      if (countElement) {
        countElement.textContent = i18n.articleCount(articleCount);
      }
      
      // Show no articles message if empty
      if (articleCount === 0) {
        articlesGrid.innerHTML = \`<p class="no-articles">\${i18n.noArticles}</p>\`;
      }
    });
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
