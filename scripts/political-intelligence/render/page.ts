/**
 * @module Infrastructure/PoliticalIntelligence/Render/Page
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Top-level political-intelligence page builder
 *
 * @description
 * Orchestrates a single rendered `political-intelligence_${lang}.html`
 * page. Calls the catalog/daily-streams collectors, slices recent vs.
 * older days, builds the JSON-LD blocks (CollectionPage, ItemList,
 * BreadcrumbList, Organization, WebSite), then composes the body and
 * wraps it in chrome.
 *
 * Round-6 split: extracted from `scripts/generate-political-intelligence.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import path from 'path';
import { fileURLToPath } from 'url';

import type { Language } from '../../types/language.js';
import { LANGUAGE_META, escapeHtml } from '../../sitemap-html/index.js';
import { buildChrome } from '../../render-lib/chrome.js';

import { collectCatalog } from '../catalog.js';
import { collectDailyDays } from '../daily-streams.js';
import { METHODOLOGY_META } from '../i18n/methodology-i18n.js';
import { TEMPLATE_META } from '../i18n/template-i18n.js';
import { PI_TRANSLATIONS } from '../i18n/page-translations.js';

import { renderCatalogGrid } from './grid.js';
import { renderDailyDay } from './daily-day.js';
import { PI_EXTRA_STYLE } from './style.js';

const BASE_URL = 'https://riksdagsmonitor.com';
const GITHUB_TREE = 'https://github.com/Hack23/riksdagsmonitor/tree/main';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..', '..', '..');
const ANALYSIS_DIR = path.join(ROOT_DIR, 'analysis');
const METHODOLOGIES_DIR = path.join(ANALYSIS_DIR, 'methodologies');
const TEMPLATES_DIR = path.join(ANALYSIS_DIR, 'templates');

const LANGUAGES: readonly Language[] = [
  'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
];

/** Map a `Language` file-suffix code to its BCP-47 hreflang code. */
function hreflangCodeOf(lang: Language): string {
  return LANGUAGE_META[lang].hreflang;
}

/**
 * Render a complete `political-intelligence_${lang}.html` page for the
 * requested language. Pure with respect to its inputs (the filesystem is
 * read by the catalog/daily-streams collectors but no output is written).
 */
export function generatePoliticalIntelligenceHtml(lang: Language): string {
  const t = PI_TRANSLATIONS[lang];
  const isEnglish = lang === 'en';
  const selfFile = isEnglish ? 'political-intelligence.html' : `political-intelligence_${lang}.html`;
  const indexFile = isEnglish ? 'index.html' : `index_${lang}.html`;
  const sitemapFile = isEnglish ? 'sitemap.html' : `sitemap_${lang}.html`;

  const methodologies = collectCatalog(METHODOLOGIES_DIR, 'analysis/methodologies', METHODOLOGY_META, 'methodologies');
  const templates = collectCatalog(TEMPLATES_DIR, 'analysis/templates', TEMPLATE_META, 'templates');
  const days = collectDailyDays();
  const totalArtifacts = days.reduce((a, d) => a + d.totalArtifacts, 0);

  const RECENT = 14;
  const recentDays = days.slice(0, RECENT);
  const olderDays = days.slice(RECENT);

  const methodologyCardsHtml = renderCatalogGrid(methodologies, t.openOnGithub, lang);
  const templateCardsHtml = renderCatalogGrid(templates, t.openOnGithub, lang);
  const recentDaysHtml = recentDays.map((d) => renderDailyDay(d, t, lang)).join('\n');
  const olderDaysHtml = olderDays.map((d) => renderDailyDay(d, t, lang)).join('\n');

  // Latest analysis date — used as `dateModified` for SEO/JSON-LD; falls back
  // to today when no daily artifacts have been generated yet.
  const latestDate = days[0]?.date ?? new Date().toISOString().slice(0, 10);
  const buildIso = new Date().toISOString();

  const collectionPageLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${t.title} — Riksdagsmonitor`,
    headline: `${t.title} — Riksdagsmonitor`,
    description: t.metaDescription,
    keywords: t.metaKeywords,
    inLanguage: hreflangCodeOf(lang),
    url: `${BASE_URL}/${selfFile}`,
    mainEntityOfPage: `${BASE_URL}/${selfFile}`,
    dateModified: latestDate,
    dateCreated: '2026-04-01',
    isPartOf: { '@type': 'WebSite', name: 'Riksdagsmonitor', url: BASE_URL },
    publisher: {
      '@type': 'Organization', name: 'Hack23 AB', url: 'https://www.hack23.com',
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/images/logo.png` },
    },
    about: [
      { '@type': 'Thing', name: 'Swedish Parliament political intelligence' },
      { '@type': 'Thing', name: 'OSINT methodologies' },
      { '@type': 'Thing', name: 'Political risk assessment' },
    ],
    hasPart: [
      { '@type': 'CreativeWork', name: t.methodologies, url: `${GITHUB_TREE}/analysis/methodologies`, description: t.methodologiesDesc },
      { '@type': 'CreativeWork', name: t.templates, url: `${GITHUB_TREE}/analysis/templates`, description: t.templatesDesc },
      { '@type': 'Dataset', name: t.dailyArtifacts, url: `${GITHUB_TREE}/analysis/daily`, description: t.dailyArtifactsDesc },
    ],
  };

  const recentDaysItemList = recentDays.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t.recentDays,
    numberOfItems: recentDays.length,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: recentDays.map((d, i) => ({
      '@type': 'ListItem', position: i + 1, name: d.date, url: d.githubUrl,
    })),
  } : null;

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t.home, item: `${BASE_URL}/${indexFile}` },
      { '@type': 'ListItem', position: 2, name: t.title, item: `${BASE_URL}/${selfFile}` },
    ],
  };

  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Hack23 AB',
    url: 'https://www.hack23.com',
    logo: `${BASE_URL}/images/android-chrome-512x512.png`,
  };
  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Riksdagsmonitor',
    url: BASE_URL,
    description: 'Swedish Parliament Intelligence Platform - Real-time monitoring, coalition predictions, and comprehensive political analysis',
    inLanguage: ['en', 'sv', 'da', 'nb', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'],
    publisher: { '@type': 'Organization', name: 'Hack23 AB', url: 'https://www.hack23.com' },
  };

  const jsonLd: unknown[] = [
    organizationLd,
    websiteLd,
    collectionPageLd,
    breadcrumbLd,
  ];
  if (recentDaysItemList) jsonLd.push(recentDaysItemList);

  const hreflangAlternates: Partial<Record<Language, string>> = {};
  for (const l of LANGUAGES) {
    hreflangAlternates[l] = l === 'en' ? 'political-intelligence.html' : `political-intelligence_${l}.html`;
  }

  const chrome = buildChrome({
    lang,
    title: t.title,
    description: t.metaDescription,
    keywords: t.metaKeywords,
    canonicalPath: selfFile,
    hreflangAlternates,
    defaultAlternateBase: 'political-intelligence.html',
    ogType: 'website',
    section: t.title,
    publishedIso: `${latestDate}T00:00:00Z`,
    modifiedIso: buildIso,
    rssHref: lang === 'en' ? '/rss/news.xml' : `/rss/news_${lang}.xml`,
    breadcrumb: [
      { label: t.home, href: indexFile },
      { label: t.title },
    ],
    jsonLd,
    extraStyle: PI_EXTRA_STYLE,
  });

  const body = `    <div class="pi-container">
        <header class="pi-page-hero">
            <h1><span aria-hidden="true">🧠</span> ${escapeHtml(t.title)}</h1>
            <p class="pi-subtitle">${escapeHtml(t.subtitle)}</p>
            <p class="pi-intro">${escapeHtml(t.intro)}</p>
            <div class="pi-stats" role="list">
                <span class="pi-stat" role="listitem"><strong>${methodologies.length}</strong> ${escapeHtml(t.methodologies)}</span>
                <span class="pi-stat" role="listitem"><strong>${templates.length}</strong> ${escapeHtml(t.templates)}</span>
                <span class="pi-stat" role="listitem"><strong>${days.length}</strong> ${escapeHtml(t.dailyArtifacts)}</span>
                <span class="pi-stat" role="listitem"><strong>${totalArtifacts}</strong> ${escapeHtml(t.artifacts)}</span>
            </div>
        </header>

        <nav class="toc-nav" aria-label="${escapeHtml(t.quickJumpTo)}">
            <h2>${escapeHtml(t.quickJumpTo)}</h2>
            <ul class="toc-list">
                <li><a href="#methodologies"><span aria-hidden="true">📚</span> ${escapeHtml(t.methodologies)}</a></li>
                <li><a href="#templates"><span aria-hidden="true">📋</span> ${escapeHtml(t.templates)}</a></li>
                <li><a href="#daily"><span aria-hidden="true">📅</span> ${escapeHtml(t.dailyArtifacts)}</a></li>
                <li><a href="/${sitemapFile}"><span aria-hidden="true">🗺️</span> ${escapeHtml(t.sitemap)}</a></li>
            </ul>
        </nav>

        <section id="methodologies" class="pi-section">
            <div class="pi-section-header">
                <h2><span aria-hidden="true">📚</span> ${escapeHtml(t.methodologies)}</h2>
                <span class="pi-section-link"><a href="${GITHUB_TREE}/analysis/methodologies" target="_blank" rel="noopener noreferrer">${escapeHtml(t.browseDirectoryOnGithub)} <span aria-hidden="true">↗</span></a></span>
            </div>
            <p class="pi-section-desc">${escapeHtml(t.methodologiesDesc)}</p>
            <div class="pi-grid">
${methodologyCardsHtml}
            </div>
        </section>

        <section id="templates" class="pi-section">
            <div class="pi-section-header">
                <h2><span aria-hidden="true">📋</span> ${escapeHtml(t.templates)}</h2>
                <span class="pi-section-link"><a href="${GITHUB_TREE}/analysis/templates" target="_blank" rel="noopener noreferrer">${escapeHtml(t.browseDirectoryOnGithub)} <span aria-hidden="true">↗</span></a></span>
            </div>
            <p class="pi-section-desc">${escapeHtml(t.templatesDesc)}</p>
            <div class="pi-grid">
${templateCardsHtml}
            </div>
        </section>

        <section id="daily" class="pi-section">
            <div class="pi-section-header">
                <h2><span aria-hidden="true">📅</span> ${escapeHtml(t.dailyArtifacts)}</h2>
                <span class="pi-section-link"><a href="${GITHUB_TREE}/analysis/daily" target="_blank" rel="noopener noreferrer">${escapeHtml(t.browseAllDays)} <span aria-hidden="true">↗</span></a></span>
            </div>
            <p class="pi-section-desc">${escapeHtml(t.dailyArtifactsDesc)}</p>

            <h3 style="font-family: var(--font-heading, 'Orbitron', sans-serif); color: var(--primary-yellow, #ffbe0b); font-size: 1.1rem; margin-top: 1.5rem;">${escapeHtml(t.recentDays)}</h3>
${recentDaysHtml}
${olderDays.length > 0 ? `
            <button type="button" class="pi-older-toggle" aria-expanded="false" aria-controls="pi-older-days" onclick="(function(b){var el=document.getElementById('pi-older-days');var exp=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',(!exp).toString());if(exp){el.setAttribute('hidden','');}else{el.removeAttribute('hidden');}})(this)">
                <span aria-hidden="true">🕰️</span> ${escapeHtml(t.olderDays)} (${olderDays.length}) — ${escapeHtml(t.showMore)}
            </button>
            <div id="pi-older-days" class="pi-older-content" hidden>
${olderDaysHtml}
            </div>` : ''}
        </section>
    </div>`;

  return `${chrome.head}
${chrome.headerHtml}
${body}
${chrome.footerHtml}`;
}
