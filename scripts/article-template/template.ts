/**
 * @module article-template/template
 * @description Main article HTML template generator producing complete
 * HTML5 documents with Schema.org structured data, Open Graph / Twitter
 * Card metadata, hreflang tags, and 14-language support.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../html-utils.js';
import { CONTENT_LABELS } from '../data-transformers.js';
import type { Language } from '../types/language.js';
import type { ArticleData, EventGridItem, WatchPoint, TemplateSection } from '../types/article.js';
import { SITE_TAGLINE, OG_LOCALE_MAP, TYPE_LABELS, ALL_LANG_CODES } from './constants.js';
import {
  getBreadcrumbName,
  getFooterLabel,
  getNewsIndexFilename,
  sanitizeArticleBody,
  fixHtmlNesting,
  formatDate,
  generateEventCalendar,
  generateWatchSection,
  generateArticleLanguageSwitcher,
  generateSiteFooter,
} from './helpers.js';

/**
 * Generate complete article HTML document.
 *
 * @param data - Article data including title, subtitle, content, events, watchPoints, etc.
 * @returns Complete HTML5 document string
 */
export function generateArticleHTML(data: ArticleData): string {
  const {
    slug,
    title,
    subtitle,
    date,
    type,
    readTime = '5 min read',
    lang = 'en',
    locale,
    content,
    events = [],
    watchPoints = [],
    sources = [],
    keywords = [],
    tags = [],
    sections = [],
  } = data;

  // Use proper OG locale for the language
  const ogLocale: string = locale || OG_LOCALE_MAP[lang] || 'en_US';

  const dateObj: Date = new Date(date);
  const formattedDate: string = formatDate(dateObj, lang);
  const isoDate: string = dateObj.toISOString().split('T')[0] ?? '';

  // Fall back to English labels if language not supported
  const typeLabel: string = TYPE_LABELS[lang]?.[type] || TYPE_LABELS.en[type] || 'News';

  // Generate hreflang tags for all available language variants
  const isRTL: boolean = lang === 'ar' || lang === 'he';
  const dirAttr: string = isRTL ? ' dir="rtl"' : '';
  const baseSlug: string = slug.replace(`-${lang}.html`, '');
  const altLang: Language = lang === 'en' ? 'sv' : 'en';
  const altSlug: string = slug.replace(`-${lang}.html`, `-${altLang}.html`);

  return `<!DOCTYPE html>
<html lang="${lang}"${dirAttr}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${escapeHtml(subtitle).substring(0, 160)}">
  <meta name="keywords" content="${keywords.join(', ')}">
  <meta name="author" content="James Pether Sörling, CISSP, CISM">
  <link rel="canonical" href="https://riksdagsmonitor.com/news/${slug}">
  
  <!-- Open Graph / Social Media -->
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(subtitle).substring(0, 200)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://riksdagsmonitor.com/news/${slug}">
  <meta property="og:image" content="https://hack23.com/cia-icon-140.webp">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Riksdagsmonitor - Swedish Parliament Intelligence">
  <meta property="og:locale" content="${ogLocale}">
  <meta property="og:site_name" content="Riksdagsmonitor - Swedish Parliament Intelligence">
  <meta property="article:published_time" content="${dateObj.toISOString()}">
  <meta property="article:modified_time" content="${dateObj.toISOString()}">
  <meta property="article:author" content="James Pether Sörling">
  <meta property="article:section" content="${typeLabel}">
${tags.map(tag => `  <meta property="article:tag" content="${escapeHtml(tag)}">`).join('\n')}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(subtitle).substring(0, 200)}">
  <meta name="twitter:image" content="https://hack23.com/cia-icon-140.webp">
  <meta name="twitter:image:alt" content="Riksdagsmonitor - Swedish Parliament Intelligence">
  <meta name="twitter:site" content="@riksdagsmonitor">
  <meta name="twitter:creator" content="@jamessorling">
  <meta name="twitter:label1" content="${CONTENT_LABELS[lang]?.twitterLabel1 ?? CONTENT_LABELS.en.twitterLabel1}">
  <meta name="twitter:data1" content="${readTime}">
  <meta name="twitter:label2" content="${CONTENT_LABELS[lang]?.twitterLabel2 ?? CONTENT_LABELS.en.twitterLabel2}">
  <meta name="twitter:data2" content="${typeLabel}">
  
  <!-- Hreflang for language alternatives -->
${ALL_LANG_CODES.map(l => `  <link rel="alternate" hreflang="${l}" href="https://riksdagsmonitor.com/news/${baseSlug}-${l}.html">`).join('\n')}
  <link rel="alternate" hreflang="x-default" href="https://riksdagsmonitor.com/news/${baseSlug}-en.html">
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Orbitron:wght@400;500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet">
  
  <!-- Main stylesheet - contains all article styles -->
  <link rel="stylesheet" href="../styles.css">
  
  <!-- Schema.org NewsArticle structured data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": "${escapeHtml(title)}",
    "alternativeHeadline": "${escapeHtml(subtitle).substring(0, 100)}",
    "description": "${escapeHtml(subtitle).substring(0, 200)}",
    "datePublished": "${dateObj.toISOString()}",
    "dateModified": "${dateObj.toISOString()}",
    "author": {
      "@type": "Person",
      "name": "James Pether Sörling",
      "jobTitle": "${CONTENT_LABELS[lang]?.jobTitle ?? CONTENT_LABELS.en.jobTitle}",
      "affiliation": {
        "@type": "Organization",
        "name": "Hack23 AB"
      },
      "url": "https://riksdagsmonitor.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Riksdagsmonitor",
      "url": "https://riksdagsmonitor.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://hack23.com/cia-icon-140.webp",
        "width": 600,
        "height": 60
      }
    },
    "image": {
      "@type": "ImageObject",
      "url": "https://hack23.com/cia-icon-140.webp",
      "width": 1200,
      "height": 630
    },
    "articleSection": "${typeLabel}",
    "articleBody": "${sanitizeArticleBody(escapeHtml(content))}...",
    "wordCount": ${Math.ceil(content.length / 5)},
    "inLanguage": "${lang}",
    "keywords": "${keywords.join(', ')}",
    "about": {
      "@type": "Thing",
      "name": "Swedish Parliament",
      "sameAs": "https://www.wikidata.org/wiki/Q1968818"
    },
    "isAccessibleForFree": true,
    "isPartOf": {
      "@type": "WebSite",
      "name": "Riksdagsmonitor",
      "url": "https://riksdagsmonitor.com"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://riksdagsmonitor.com/news/${slug}"
    }${tags.length > 0 ? `,
    "mentions": [${tags.map(tag => `
      {
        "@type": "Thing",
        "name": "${escapeHtml(tag)}"
      }`).join(',')}
    ]` : ''}
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
        "name": "${getBreadcrumbName(lang, 'home')}",
        "item": "https://riksdagsmonitor.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "${getBreadcrumbName(lang, 'news')}",
        "item": "https://riksdagsmonitor.com/news/index.html"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "${escapeHtml(title).substring(0, 50)}",
        "item": "https://riksdagsmonitor.com/news/${slug}"
      }
    ]
  }
  </script>
  
  <!-- Organization structured data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Riksdagsmonitor",
    "url": "https://riksdagsmonitor.com",
    "logo": "https://hack23.com/cia-icon-140.webp",
    "description": "${CONTENT_LABELS[lang]?.siteDescription ?? CONTENT_LABELS.en.siteDescription}",
    "foundingDate": "2020",
    "founder": {
      "@type": "Person",
      "name": "James Pether Sörling"
    },
    "sameAs": [
      "https://github.com/Hack23/riksdagsmonitor"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Technical Support",
      "url": "https://github.com/Hack23/riksdagsmonitor/issues"
    }
  }
  </script>
  
</head>
<body>
<a href="#main-content" class="skip-link">${getFooterLabel(lang, 'skipToContent')}</a>
${generateArticleLanguageSwitcher(baseSlug, lang)}

<div class="article-top-nav">
  <a href="${getNewsIndexFilename(ALL_LANG_CODES.includes(lang as Language) ? lang : 'en')}" class="back-to-news">
    \u2190 ${getFooterLabel(lang, 'backToNews')}
  </a>
</div>

<article id="main-content" class="news-article">
  <header class="article-header">
    <div class="site-tagline">${SITE_TAGLINE[lang] || SITE_TAGLINE.en}</div>
    <h1>${title}</h1>
    <div class="article-meta">
      <time datetime="${isoDate}">${formattedDate}</time>
      <span class="separator">•</span>
      <span>${typeLabel}</span>
      <span class="separator">•</span>
      <span>${readTime}</span>
    </div>
  </header>

${events.length > 0 ? generateEventCalendar(events as ReadonlyArray<EventGridItem>, lang) : ''}

  <div class="article-content prose">
    <p class="lede">
      ${subtitle}
    </p>

${fixHtmlNesting(content)}

${watchPoints.length > 0 ? generateWatchSection(watchPoints as ReadonlyArray<WatchPoint>, lang) : ''}

${(sections as TemplateSection[]).length > 0 ? (sections as TemplateSection[]).map(s => `<div id="${escapeHtml(s.id)}" class="${escapeHtml(s.className ?? 'article-section')}">${s.html}</div>`).join('\n') : ''}
  </div>

  <footer class="article-footer">
    <div class="article-sources">
      <h3>${getFooterLabel(lang, 'sourcesTitle')}</h3>
      <p><strong>${getFooterLabel(lang, 'dataSources')}:</strong> ${sources.join(', ')}</p>
      <p><strong>${getFooterLabel(lang, 'generatedBy')}:</strong> ${getFooterLabel(lang, 'generatedByValue')}</p>
      <p><strong>${getFooterLabel(lang, 'analysisTools')}:</strong> ${getFooterLabel(lang, 'analysisToolsValue')}</p>
    </div>
    
    <div class="article-nav">
      <a href="${getNewsIndexFilename(ALL_LANG_CODES.includes(lang as Language) ? lang : 'en')}" class="back-to-news">
        \u2190 ${getFooterLabel(lang, 'backToNews')}
      </a>
    </div>
  </footer>
</article>

${generateSiteFooter(lang)}

<script type="module" src="../scripts/back-to-top.ts"></script>
</body>
</html>`;
}
