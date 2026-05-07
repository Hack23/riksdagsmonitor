/**
 * @module Infrastructure/RenderLib/Chrome/Header
 * @category Intelligence Operations / Supporting Infrastructure
 * @name HTML site header builder (nav, language switcher, CTAs, breadcrumb)
 *
 * @description
 * Pure, stateless string builder for the `<body>…<header>…</header>` block
 * including skip-link, site navigation, language switcher dropdown,
 * CTA buttons, breadcrumb row, hero banner, and horizontal language bar.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { LANGUAGE_META, escapeHtml } from '../../sitemap-html/index.js';
import { GITHUB_BLOB, LANGUAGES } from '../constants.js';
import { chromeStrings } from '../chrome-i18n.js';
import type { BreadcrumbItem, ChromeOptions } from './types.js';
import { depth, fallbackAlternateHref } from './helpers.js';

/**
 * Build the complete `<body>…<header>…</header>` + hero + language-bar
 * + breadcrumb + `<main>` opening tag.
 */
export function buildHeaderHtml(opts: ChromeOptions): string {
  const meta = LANGUAGE_META[opts.lang];
  const t = meta.translations;
  const cs = chromeStrings(opts.lang);
  const prefix = depth(opts.canonicalPath);
  const indexFile = opts.lang === 'en' ? 'index.html' : `index_${opts.lang}.html`;
  const sitemapFile = opts.lang === 'en' ? 'sitemap.html' : `sitemap_${opts.lang}.html`;
  const piFile = opts.lang === 'en' ? 'political-intelligence.html' : `political-intelligence_${opts.lang}.html`;
  const politiciansFile = opts.lang === 'en' ? 'politician-dashboard.html' : `politician-dashboard_${opts.lang}.html`;
  const newsFile = opts.lang === 'en' ? 'news/index.html' : `news/index_${opts.lang}.html`;
  const dashboardFile = opts.lang === 'en' ? 'dashboard/index.html' : `dashboard/index_${opts.lang}.html`;
  const apiDocsHref = 'https://riksdagsmonitor.com/docs/api/index.html';

  const altBase = opts.defaultAlternateBase ?? 'index.html';

  // Header dropdown language switcher
  const languageSwitcher = LANGUAGES
    .filter((l) => l !== opts.lang)
    .map((l) => {
      const lm = LANGUAGE_META[l];
      const href = opts.hreflangAlternates?.[l] ?? fallbackAlternateHref(l, altBase);
      return `          <a href="${prefix}${href}" lang="${lm.hreflang}" title="${escapeHtml(lm.nativeName)}" role="menuitem"><span aria-hidden="true">${lm.flag}</span> ${lm.nativeName}</a>`;
    })
    .join('\n');

  const tagline = cs.headerTagline;

  // Breadcrumb sub-navigation
  const breadcrumbItems: readonly BreadcrumbItem[] = opts.breadcrumb ?? [
    { label: t.home, href: `${prefix}${indexFile}` },
    { label: cs.politicalIntelligence, href: `${prefix}${piFile}` },
    { label: opts.title },
  ];
  const breadcrumbLis = breadcrumbItems
    .map((item, idx) => {
      const isLast = idx === breadcrumbItems.length - 1;
      if (isLast || !item.href) {
        return `            <li aria-current="page">${escapeHtml(item.label)}</li>`;
      }
      return `            <li><a href="${item.href}">${escapeHtml(item.label)}</a></li>`;
    })
    .join('\n');

  // Horizontal language bar
  const horizontalLangBar = LANGUAGES
    .map((l) => {
      const lm = LANGUAGE_META[l];
      const isCurrent = l === opts.lang;
      if (isCurrent) {
        return `      <span class="lang-link active" lang="${lm.hreflang}" title="${escapeHtml(lm.nativeName)}" aria-current="page"><span aria-hidden="true">${lm.flag}</span> ${escapeHtml(lm.nativeName)}</span>`;
      }
      const href = `${prefix}${opts.hreflangAlternates?.[l] ?? fallbackAlternateHref(l, altBase)}`;
      return `      <a href="${href}" class="lang-link" hreflang="${lm.hreflang}" lang="${lm.hreflang}" title="${escapeHtml(lm.nativeName)}"><span aria-hidden="true">${lm.flag}</span> ${escapeHtml(lm.nativeName)}</a>`;
    })
    .join('\n');

  return `<body class="rm-article-body${opts.bodyClass ? ' ' + escapeHtml(opts.bodyClass) : ''}">
    <a class="skip-link" href="#main">${escapeHtml(cs.skipToMain)}</a>
    <header class="rm-site-header" role="banner">
      <div class="rm-site-header-inner">
        <a class="rm-logo" href="${prefix}${indexFile}" aria-label="Riksdagsmonitor ${escapeHtml(t.home)}">
          <img class="rm-logo-img" data-rm-logo-img="true" src="${prefix}images/riksdagsmonitor-logo.webp" alt="" width="48" height="48" loading="eager" decoding="async">
          <span class="rm-logo-glyph" aria-hidden="true">🇸🇪</span>
          <span class="rm-logo-text">
            <span class="rm-logo-brand">Riksdagsmonitor</span>
            <span class="rm-logo-tagline">${escapeHtml(tagline)}</span>
          </span>
        </a>
        <nav class="rm-site-nav" aria-label="${escapeHtml(cs.mainNav)}">
          <a href="${prefix}${indexFile}">${escapeHtml(t.home)}</a>
          <a href="${prefix}${newsFile}">${escapeHtml(cs.news)}</a>
          <a href="${prefix}${dashboardFile}">${escapeHtml(cs.dashboard)}</a>
          <a href="${prefix}${politiciansFile}">👤 ${escapeHtml(cs.politicians)}</a>
          <a href="${prefix}${piFile}">🧠 ${escapeHtml(cs.politicalIntelligence)}</a>
          <a href="${prefix}${sitemapFile}">${escapeHtml(t.siteMap)}</a>
          <a href="${apiDocsHref}">${escapeHtml(t.apiDocs)}</a>
        </nav>
        <details class="rm-lang-switcher">
          <summary aria-label="${escapeHtml(cs.switchLanguage)}">
            <span aria-hidden="true">${meta.flag}</span>
            <span class="rm-lang-current-label">${escapeHtml(meta.nativeName)}</span>
            <span class="rm-lang-switcher-caret" aria-hidden="true">▾</span>
          </summary>
          <div class="rm-lang-switcher-dropdown" role="menu">
${languageSwitcher}
          </div>
        </details>
        <a class="rm-header-cta rm-header-cta-pi"
           href="${prefix}${piFile}"
           title="${escapeHtml(cs.politicalIntelligenceTitle)}"
           aria-label="${escapeHtml(cs.politicalIntelligenceTitle)}">
          <span class="rm-header-cta-icon" aria-hidden="true">🧠</span>
          <span class="rm-header-cta-label">${escapeHtml(cs.politicalIntelligenceLabel)}</span>
        </a>
        <a class="rm-header-cta rm-header-cta-transparency"
           href="${GITHUB_BLOB}/SECURITY.md"
           target="_blank" rel="noopener noreferrer"
           title="${escapeHtml(cs.transparencyTitle)}"
           aria-label="${escapeHtml(cs.transparencyTitle)}">
          <span class="rm-header-cta-icon" aria-hidden="true">🔐</span>
          <span class="rm-header-cta-label">${cs.transparencyLabel}</span>
        </a>
        <a class="rm-header-cta rm-header-cta-sponsor"
           href="https://github.com/sponsors/Hack23"
           target="_blank" rel="noopener noreferrer"
           title="${escapeHtml(cs.sponsorTitle)}"
           aria-label="${escapeHtml(cs.sponsorTitle)}">
          <span class="rm-header-cta-icon" aria-hidden="true">💖</span>
          <span class="rm-header-cta-label">${escapeHtml(cs.sponsorLabel)}</span>
        </a>
        <button id="theme-toggle" class="rm-theme-toggle" type="button"
                aria-pressed="false"
                aria-label="${escapeHtml(cs.themeAria)}"
                title="${escapeHtml(cs.themeAria)}"
                data-label-dark="${escapeHtml(cs.themeToLight)}"
                data-label-light="${escapeHtml(cs.themeToDark)}">
          <span class="rm-theme-toggle-icon" aria-hidden="true">🌓</span>
          <span class="rm-theme-toggle-label">${escapeHtml(cs.themeLabel)}</span>
        </button>
      </div>
      <div class="rm-site-subnav" aria-label="${escapeHtml(cs.pageContext)}">
        <nav class="rm-breadcrumb" aria-label="${escapeHtml(cs.breadcrumb)}">
          <ol>
${breadcrumbLis}
          </ol>
        </nav>
        ${opts.publishedIso ? `<time class="rm-article-published" datetime="${opts.publishedIso}">${opts.publishedIso.slice(0, 10)}</time>` : ''}
      </div>
    </header>${(opts.heroBanner ?? true) ? `
    <div class="hero-banner" aria-hidden="true">
      <img src="${prefix}${opts.heroBannerImage ?? 'images/riksdagsmonitor-banner.webp'}" alt="" class="hero-banner-bg" width="1536" height="1024" loading="eager" decoding="async">
    </div>` : ''}${(opts.languageBar ?? true) ? `
    <nav class="language-switcher rm-lang-bar" role="navigation" aria-label="${escapeHtml(cs.thisPageInOtherLanguages)}">
${horizontalLangBar}
    </nav>` : ''}
${opts.breadcrumbHtml ?? ''}
    <main id="main" class="rm-article-main" tabindex="-1">`;
}
