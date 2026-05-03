/**
 * @module Infrastructure/SitemapHtml/Render/Page
 * @category Intelligence Operations / Supporting Infrastructure
 * @name sitemap_${lang}.html page builder
 *
 * @description
 * Builds a complete sitemap HTML document for one language, wrapping the
 * (article list + dashboards + docs links + language switcher) body in
 * the shared site chrome via `buildChrome`. Pure string render — accepts
 * the pre-grouped article map and returns the HTML string; no
 * filesystem writes.
 *
 * Round-6 split: extracted from `scripts/generate-sitemap-html.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import type { Language } from '../../types/language.js';
import { buildChrome } from '../../render-lib/chrome.js';
import { getFaqItems, FAQ_HEADING } from '../../render-lib/faq-i18n.js';

import type { ArticleInfo } from '../articles/scanner.js';
import { getDocsSections } from '../articles/docs-sections.js';
import { escapeHtml } from '../escape.js';
import { LANGUAGE_META } from '../i18n.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..', '..', '..');
const BASE_URL = 'https://riksdagsmonitor.com';

const LANGUAGES: readonly Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

/**
 * Generate a sitemap HTML page for a specific language.
 */
export function generateSitemapHtml(lang: Language, articlesByLang: Map<Language, ArticleInfo[]>): string {
  const meta = LANGUAGE_META[lang];
  const t = meta.translations;
  const isEnglish = lang === 'en';
  const sitemapFile = isEnglish ? 'sitemap.html' : `sitemap_${lang}.html`;
  const indexFile = isEnglish ? 'index.html' : `index_${lang}.html`;
  const newsIndexFile = isEnglish ? 'news/index.html' : `news/index_${lang}.html`;

  const articles = articlesByLang.get(lang) || [];
  // Include every article for the target language — the problem statement
  // explicitly calls for "links to all pages". Articles are already sorted
  // by publication date (desc) in getArticlesByLanguage().
  const recentArticles = articles;

  const docsSections = getDocsSections();

  // Build other language links section
  const otherLanguageLinks = LANGUAGES
    .filter((l) => l !== lang)
    .map((l) => {
      const lm = LANGUAGE_META[l];
      const href = l === 'en' ? 'sitemap.html' : `sitemap_${l}.html`;
      return `                    <li>
                        <a href="${href}">${lm.flag} ${lm.nativeName} (${lm.name})</a>
                    </li>`;
    })
    .join('\n');

  // Build multi-language platform links
  const multiLangLinks = LANGUAGES.map((l) => {
    const lm = LANGUAGE_META[l];
    const href = l === 'en' ? 'index.html' : `index_${l}.html`;
    return `                    <li>
                        <a href="${href}">${lm.flag} ${lm.nativeName} (${lm.name})</a>
                    </li>`;
  }).join('\n');

  // Build dashboard links
  const dashboardLinks = LANGUAGES.map((l) => {
    const lm = LANGUAGE_META[l];
    const dFile = l === 'en' ? 'dashboard/index.html' : `dashboard/index_${l}.html`;
    const dashPath = path.join(ROOT_DIR, dFile);
    if (!fs.existsSync(dashPath)) return '';
    return `                    <li>
                        <a href="${dFile}">${escapeHtml(t.ciaDashboard)} - ${lm.nativeName}</a>
                    </li>`;
  }).filter(Boolean).join('\n');

  // Build news article list — includes every article for this language,
  // sorted by publication date (desc). Each entry exposes the date as a
  // semantic <time datetime="…"> element for machine parsing and visual
  // confirmation that newest articles are listed first.
  const articleListHtml = recentArticles.map((article) => {
    const escapedTitle = escapeHtml(article.title);
    const escapedDesc = escapeHtml(article.description);
    const dateHtml = article.date
      ? `<time class="sitemap-article-date" datetime="${article.date}">${article.date}</time>`
      : '';
    return `                    <li>
                        <a href="news/${escapeHtml(article.file)}">${escapedTitle}</a>
                        ${dateHtml}
                        ${escapedDesc ? `<p class="sitemap-description">${escapedDesc}</p>` : ''}
                    </li>`;
  }).join('\n');

  // Build docs section
  let docsHtml = '';
  if (docsSections.index || docsSections.api || docsSections.coverage || docsSections.testResults || docsSections.cypress) {
    docsHtml = `
            <section class="sitemap-section" id="documentation">
                <h2>${escapeHtml(t.documentation)}</h2>
                <ul class="sitemap-list">`;
    if (docsSections.index) {
      docsHtml += `
                    <li>
                        <a href="docs/index.html">${escapeHtml(t.documentation)}</a>
                        <p class="sitemap-description">${escapeHtml(t.apiDocsDesc)}</p>
                    </li>`;
    }
    if (docsSections.api) {
      docsHtml += `
                    <li>
                        <a href="docs/api/index.html">${escapeHtml(t.apiDocs)}</a>
                        <p class="sitemap-description">${escapeHtml(t.apiDocsDesc)}</p>
                    </li>`;
    }
    if (docsSections.coverage) {
      docsHtml += `
                    <li>
                        <a href="docs/coverage/index.html">${escapeHtml(t.coverageReports)}</a>
                        <p class="sitemap-description">${escapeHtml(t.coverageReportsDesc)}</p>
                    </li>`;
    }
    if (docsSections.testResults) {
      docsHtml += `
                    <li>
                        <a href="docs/test-results/index.html">${escapeHtml(t.testResults)}</a>
                        <p class="sitemap-description">${escapeHtml(t.testResultsDesc)}</p>
                    </li>`;
    }
    if (docsSections.cypress) {
      docsHtml += `
                    <li>
                        <a href="docs/cypress/index.html">${escapeHtml(t.testResults)} (Cypress)</a>
                        <p class="sitemap-description">${escapeHtml(t.testResultsDesc)}</p>
                    </li>`;
    }
    docsHtml += `
                </ul>
            </section>`;
  }

  // Build hreflang alternates map for the chrome — each language maps to
  // its sibling sitemap file (sitemap.html / sitemap_${lang}.html).
  const hreflangAlternates: Partial<Record<Language, string>> = {};
  for (const l of LANGUAGES) {
    hreflangAlternates[l] = l === 'en' ? 'sitemap.html' : `sitemap_${l}.html`;
  }

  // SEO uplift (round-7): build a localised, 140–200-char meta description
  // that cites the article count + native language name, plus a localised
  // keyword list pulled from the existing translation dictionary so every
  // sitemap_${lang}.html exposes language-appropriate terminology
  // (English-only keyword stuffing was previously flagged by Bing
  // Webmaster). The description floor matches `seo-metadata-contract.md` §3.1.
  const articleCount = recentArticles.length;
  const baseDescription = t.completeNavigation;
  // `${baseDescription}` is typically 30–80 chars — extend with article
  // count + native lang + brand to land in the 140–200 band.
  const rawDescription = `${baseDescription} — ${articleCount} ${t.recentArticles} · ${meta.nativeName} · Riksdagsmonitor (${t.mainPlatform}, ${t.dashboards}, ${t.newsAnalysis}, ${t.documentation}).`;
  // Clamp to 140–200 chars: truncate at ~197 with ellipsis if too long,
  // or pad with site context if under 140 (CJK may naturally be shorter).
  let seoDescription = rawDescription;
  if (seoDescription.length > 200) {
    seoDescription = seoDescription.slice(0, 197).trimEnd() + '…';
  } else if (seoDescription.length < 140) {
    const pad = ` ${t.resources} — ${meta.nativeName} · Riksdagsmonitor.`;
    seoDescription = (seoDescription + pad).slice(0, 200);
  }
  const seoKeywords = [
    'Riksdagsmonitor',
    t.siteMap,
    t.mainPlatform,
    t.dashboards,
    t.newsAnalysis,
    t.documentation,
    t.resources,
    t.recentArticles,
    'OSINT',
    meta.nativeName,
  ].join(', ');
  const seoTitle = `${t.siteMap} — ${meta.nativeName}`;

  // FAQ entries for this language (round-7 SEO uplift).
  const faqItems = getFaqItems('sitemap', lang);

  // JSON-LD: Organization + WebSite (always) + SiteNavigationElement +
  // BreadcrumbList. The article renderer emits the same Organization +
  // WebSite shape so the three top-level navigable pages are now
  // structurally consistent for Google Rich Results.
  const jsonLd: unknown[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Hack23 AB',
      url: 'https://www.hack23.com',
      logo: `${BASE_URL}/images/android-chrome-512x512.png`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      name: 'Riksdagsmonitor',
      url: BASE_URL,
      description: 'Swedish Parliament Intelligence Platform - Real-time monitoring, coalition predictions, and comprehensive political analysis',
      inLanguage: ['en', 'sv', 'da', 'nb', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'],
      publisher: {
        '@type': 'Organization',
        name: 'Hack23 AB',
        url: 'https://www.hack23.com',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SiteNavigationElement',
      name: t.siteMap,
      url: `${BASE_URL}/${sitemapFile}`,
      inLanguage: meta.hreflang,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${BASE_URL}/${sitemapFile}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t.home, item: `${BASE_URL}/${indexFile}` },
        { '@type': 'ListItem', position: 2, name: t.siteMap, item: `${BASE_URL}/${sitemapFile}` },
      ],
    },
  ];

  // WebPage self-node — provides `mainEntity` pointing at the catalogued
  // article ItemList plus `dateModified` for freshness signalling.
  const buildIso = new Date().toISOString();
  jsonLd.push({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${BASE_URL}/${sitemapFile}#webpage`,
    name: seoTitle,
    url: `${BASE_URL}/${sitemapFile}`,
    description: seoDescription,
    inLanguage: meta.hreflang,
    isPartOf: { '@type': 'WebSite', '@id': `${BASE_URL}/#website` },
    dateModified: buildIso,
    mainEntity: { '@id': `${BASE_URL}/${sitemapFile}#articles-itemlist` },
    breadcrumb: { '@id': `${BASE_URL}/${sitemapFile}#breadcrumb` },
  });

  // ItemList of catalogued articles (up to 200) — exposes the sitemap's
  // article inventory (title + URL + position) so crawlers see the
  // archive even if the visual UI paginates client-side.
  if (recentArticles.length > 0) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${BASE_URL}/${sitemapFile}#articles-itemlist`,
      name: t.recentArticles,
      numberOfItems: recentArticles.length,
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      itemListElement: recentArticles.slice(0, 200).map((article, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: article.title,
        url: `${BASE_URL}/news/${article.file}`,
      })),
    });
  }

  // Inline page-specific stylesheet for the sitemap body. Chrome owns
  // header + footer + theme bootstrap; the styles below scope only to
  // sitemap-specific markup (.sitemap-section, .sitemap-list, etc.).
  const extraStyle = `
        .sitemap-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem 1rem;
        }

        .sitemap-page-hero {
            text-align: center;
            margin-bottom: 3rem;
            padding-bottom: 2rem;
            border-bottom: 2px solid var(--primary-cyan);
        }

        .sitemap-page-hero h1 {
            font-family: var(--font-heading);
            color: var(--primary-cyan);
            font-size: clamp(2rem, 4vw, 3rem);
            margin-bottom: 1rem;
        }

        .sitemap-page-hero p {
            color: var(--light-text);
            font-size: 1.125rem;
        }

        .sitemap-section { margin-bottom: 3rem; }

        .sitemap-section h2 {
            font-family: var(--font-heading);
            color: var(--primary-magenta);
            font-size: clamp(1.5rem, 3vw, 2rem);
            margin-bottom: 1.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--primary-magenta);
        }

        .sitemap-section h3 {
            font-family: var(--font-heading);
            color: var(--primary-yellow);
            font-size: 1.25rem;
            margin-top: 2rem;
            margin-bottom: 1rem;
        }

        .sitemap-list { list-style: none; padding: 0; }

        .sitemap-list li {
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: var(--card-bg);
            border-radius: 8px;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .sitemap-list li:hover {
            transform: translateX(5px);
            box-shadow: 0 4px 12px rgba(0, 217, 255, 0.2);
        }

        .sitemap-list a {
            color: var(--primary-cyan);
            text-decoration: none;
            font-weight: 600;
            font-size: 1.125rem;
            display: block;
            margin-bottom: 0.5rem;
        }

        .sitemap-list a:hover { text-decoration: underline; }
        .sitemap-list a:focus { outline: 2px solid var(--primary-cyan); outline-offset: 2px; }

        .sitemap-description {
            color: var(--muted-text);
            font-size: 0.9375rem;
            line-height: 1.6;
        }

        .sitemap-article-date {
            display: inline-block;
            font-family: var(--font-mono, 'Courier New', monospace);
            font-size: 0.8125rem;
            color: var(--primary-yellow);
            background: rgba(255, 190, 11, 0.08);
            border: 1px solid rgba(255, 190, 11, 0.25);
            border-radius: 4px;
            padding: 0.125rem 0.5rem;
            margin-bottom: 0.5rem;
            letter-spacing: 0.02em;
        }

        .language-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
        }

        .language-grid li { margin-bottom: 0; }

        @media (max-width: 768px) {
            .sitemap-container { padding: 1rem 0.5rem; }
            .language-grid { grid-template-columns: 1fr; }
        }

        .toc-nav {
            background: var(--mid-bg);
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            border-left: 4px solid var(--primary-cyan);
        }

        .toc-nav h2 {
            font-family: var(--font-heading);
            color: var(--primary-cyan);
            font-size: 1.25rem;
            margin-bottom: 1rem;
            border: none;
            padding: 0;
        }

        .toc-list {
            list-style: none;
            padding: 0;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.5rem;
        }

        .toc-list li { margin: 0; padding: 0; }

        .toc-list a {
            color: var(--primary-cyan);
            text-decoration: none;
            display: inline-block;
            padding: 0.5rem 0;
            transition: transform 0.2s ease;
        }

        .toc-list a:hover { transform: translateX(5px); text-decoration: underline; }
        .toc-list a:focus { outline: 2px solid var(--primary-cyan); outline-offset: 2px; }
`;

  const chrome = buildChrome({
    lang,
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    canonicalPath: sitemapFile,
    hreflangAlternates,
    defaultAlternateBase: 'sitemap.html',
    ogType: 'website',
    rssHref: lang === 'en' ? '/rss.xml' : `/rss_${lang}.xml`,
    breadcrumb: [
      { label: t.home, href: indexFile },
      { label: t.siteMap },
    ],
    jsonLd,
    extraStyle,
    faqItems,
    speakableSelectors: ['.sitemap-page-hero h1', '.sitemap-page-hero p'],
    modifiedIso: buildIso,
  });

  // Body content — keeps the rich sitemap sections from the legacy
  // template; the surrounding chrome (header / breadcrumb / footer /
  // language switcher / theme toggle) is now provided by `buildChrome`.
  const body = `    <div class="sitemap-container">
        <header class="sitemap-page-hero">
            <h1>${escapeHtml(t.siteMap)}</h1>
            <p>${escapeHtml(t.completeNavigation)}</p>
        </header>

        <!-- Quick Navigation -->
        <nav class="toc-nav" aria-label="${escapeHtml(t.quickJumpTo)}">
            <h2>${escapeHtml(t.quickJumpTo)}</h2>
            <ul class="toc-list">
                <li><a href="#main-platform">${escapeHtml(t.mainPlatform)}</a></li>
                <li><a href="#dashboards">${escapeHtml(t.dashboards)}</a></li>
                <li><a href="#news">${escapeHtml(t.newsAnalysis)}</a></li>
                <li><a href="#languages">${escapeHtml(t.multiLanguage)}</a></li>${docsHtml ? `
                <li><a href="#documentation">${escapeHtml(t.documentation)}</a></li>` : ''}
                <li><a href="#resources">${escapeHtml(t.resources)}</a></li>
                <li><a href="#sitemap-languages">${escapeHtml(t.sitemapLanguages)}</a></li>
            </ul>
        </nav>

        <!-- Main Platform Section -->
        <section class="sitemap-section" id="main-platform">
            <h2>${escapeHtml(t.mainPlatform)}</h2>
            <ul class="sitemap-list">
                <li>
                    <a href="${indexFile}">${escapeHtml(t.home)} - ${escapeHtml(meta.nativeName)}</a>
                    <p class="sitemap-description">${escapeHtml(t.mainPlatformDesc)}</p>
                </li>
            </ul>
        </section>

        <!-- Dashboards Section -->
        <section class="sitemap-section" id="dashboards">
            <h2>${escapeHtml(t.dashboards)}</h2>
            <ul class="sitemap-list">
${dashboardLinks}
                <li>
                    <a href="politician-dashboard.html">${escapeHtml(t.politicianDashboard)}</a>
                    <p class="sitemap-description">${escapeHtml(t.politicianDashboardDesc)}</p>
                </li>
            </ul>
        </section>

        <!-- News Section -->
        <section class="sitemap-section" id="news">
            <h2>${escapeHtml(t.newsAnalysis)}</h2>
            <h3>${escapeHtml(t.newsIndexPages)}</h3>
            <ul class="sitemap-list">
                <li>
                    <a href="${newsIndexFile}">${escapeHtml(t.newsIndex)} - ${escapeHtml(meta.nativeName)}</a>
                    <p class="sitemap-description">${escapeHtml(t.newsDesc)}</p>
                </li>
                <li>
                    <a href="${lang === 'en' ? 'political-intelligence.html' : `political-intelligence_${lang}.html`}">🧠 Political Intelligence - ${escapeHtml(meta.nativeName)}</a>
                    <p class="sitemap-description">Methodologies, analysis templates, and every daily intelligence artifact (linked to GitHub for full auditability).</p>
                </li>
            </ul>
            ${recentArticles.length > 0 ? `
            <h3>${escapeHtml(t.recentArticles)}</h3>
            <ul class="sitemap-list">
${articleListHtml}
            </ul>` : ''}
        </section>

        <!-- Multi-Language Section -->
        <section class="sitemap-section" id="languages">
            <h2>${escapeHtml(t.multiLanguage)}</h2>
            <p class="sitemap-description" style="margin-bottom: 1.5rem;">${escapeHtml(t.accessPlatform)}</p>
            <ul class="sitemap-list language-grid">
${multiLangLinks}
            </ul>
        </section>
        ${docsHtml}
        <!-- Additional Resources -->
        <section class="sitemap-section" id="resources">
            <h2>${escapeHtml(t.resources)}</h2>
            <ul class="sitemap-list">
                <li>
                    <a href="sitemap.xml">${escapeHtml(t.xmlSitemap)}</a>
                    <p class="sitemap-description">${escapeHtml(t.xmlSitemapDesc)}</p>
                </li>
                <li>
                    <a href="robots.txt">${escapeHtml(t.robotsTxt)}</a>
                    <p class="sitemap-description">${escapeHtml(t.robotsTxtDesc)}</p>
                </li>
            </ul>
        </section>

        <!-- Other Sitemap Languages -->
        <section class="sitemap-section" id="sitemap-languages">
            <h2>${escapeHtml(t.sitemapInOtherLanguages)}</h2>
            <ul class="sitemap-list language-grid">
${otherLanguageLinks}
            </ul>
        </section>

        <!-- FAQ section (round-7 SEO uplift) — crawler-visible
             progressive disclosure so Google's FAQ rich-result panel
             can pick up the answers from the same DOM as the JSON-LD. -->
        <section class="sitemap-section sitemap-faq" id="faq" aria-labelledby="sitemap-faq-heading">
            <h2 id="sitemap-faq-heading">${escapeHtml(FAQ_HEADING[lang])}</h2>
${faqItems.map((f) => `            <details class="sitemap-faq-item">
                <summary>${escapeHtml(f.question)}</summary>
                <p>${escapeHtml(f.answer)}</p>
            </details>`).join('\n')}
        </section>
    </div>`;

  return `${chrome.head}
${chrome.headerHtml}
${body}
${chrome.footerHtml}`;
}
