/**
 * @module Infrastructure/RenderLib/Chrome
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Shared HTML chrome (head / header / footer / SEO) for articles
 *
 * @description
 * Pure, stateless string builder for the `<!DOCTYPE html>…<head>` plus
 * `<body>…<header>…</header>` plus `</main>…<footer>…</footer>` blocks
 * wrapping every rendered article. **No filesystem access, no markdown
 * parsing** — all inputs are plain strings / POJOs described by
 * {@link ChromeOptions}.
 *
 * ## SEO surface
 * - `<title>` · `<meta name="description">` · keywords · robots
 * - Open Graph (incl. `og:locale:alternate` for the 13 non-current langs)
 * - Twitter Card
 * - JSON-LD blocks via {@link ChromeOptions.jsonLd}
 * - `hreflang` link rel alternates via {@link renderHreflangBlock}
 *   (x-default always points at the English alternate or the canonical
 *   path if no English alternate is supplied)
 *
 * ## Accessibility surface
 * - Skip-link (`<a class="skip-link" href="#main">`)
 * - Semantic `<header role="banner">` / `<main id="main" tabindex="-1">`
 *   / `<footer role="contentinfo">`
 * - Breadcrumb row (`<nav class="rm-breadcrumb" aria-label="Breadcrumb">`)
 *   with ordered list + `aria-current="page"` on the current node
 * - Language switcher (header dropdown) exposes `role="menuitem"` on
 *   each option
 * - Secondary inline language switcher in the footer for discoverability
 *   without requiring the user to expand the header dropdown
 *
 * Round-4 architecture split: extracted from `render-lib/index.ts`. The
 * module has zero cyclic dependencies on the aggregator or markdown
 * modules, so it can be unit-tested in isolation.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../types/language.js';
import { LANGUAGE_META, escapeHtml } from '../generate-sitemap-html.js';
import {
  BASE_URL,
  GITHUB_BLOB,
  GITHUB_TREE,
  LANGUAGES,
} from './constants.js';
import { chromeStrings } from './chrome-i18n.js';

// ---------------------------------------------------------------------------
// Options + return shape
// ---------------------------------------------------------------------------

/**
 * One breadcrumb node. The last item in the array is rendered with
 * `aria-current="page"` and no anchor (it is the current page); all
 * other items must supply an `href`.
 */
export interface BreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}

export interface ChromeOptions {
  readonly lang: Language;
  readonly title: string;
  readonly description: string;
  readonly keywords?: string;
  /** Canonical filename in the site root, e.g. `news/2026-04-23/propositions-en.html`. */
  readonly canonicalPath: string;
  /** Per-language alternate paths. If omitted, chrome only emits the current one. */
  readonly hreflangAlternates?: Partial<Record<Language, string>>;
  /** ISO-8601 date for `article:published_time`. */
  readonly publishedIso?: string;
  /** ISO-8601 date for `article:modified_time` / `og:updated_time`. */
  readonly modifiedIso?: string;
  /** JSON-LD blob(s) appended inside `<head>`. Already-stringified objects. */
  readonly jsonLd?: readonly unknown[];
  /** Extra `<meta>` / `<link>` lines to splice into `<head>`. */
  readonly extraHead?: string;
  /** Inline `<style>` body, appended verbatim. */
  readonly extraStyle?: string;
  /** Prebuilt breadcrumb nav HTML (skipped if empty). */
  readonly breadcrumbHtml?: string;
  /** Section identifier (og:article:section). */
  readonly section?: string;
  /** RSS feed URL, defaults to `/rss.xml`. */
  readonly rssHref?: string;
  /**
   * og:type. Defaults to `'article'` for backwards-compat with the article
   * renderer. Index/sitemap/methodology pages should set `'website'` so
   * that crawlers do not treat them as individual articles and the
   * `article:*` meta block is suppressed.
   */
  readonly ogType?: 'article' | 'website';
  /**
   * Custom breadcrumb path used by `buildChrome` to render the sub-navigation
   * row. The last item is the current page. When omitted, `buildChrome`
   * falls back to the legacy 3-tier `Home > Political Intelligence > {title}`
   * breadcrumb used by individual articles.
   */
  readonly breadcrumb?: readonly BreadcrumbItem[];
  /**
   * Filename used by the lang-switcher fallback (when an explicit
   * `hreflangAlternates` entry for a given language is not supplied). For
   * the English version, this is the literal file (e.g. `'sitemap.html'`,
   * `'political-intelligence.html'`); other languages get the
   * `_${lang}` suffix automatically. Defaults to `'index.html'` so the
   * fallback always lands on a valid landing page even if the current
   * page is not translated.
   */
  readonly defaultAlternateBase?: string;
  /**
   * Extra space-separated CSS classes appended to the `<body>` after the
   * canonical `rm-article-body` class. Used by the news-index renderer to
   * opt back into the legacy `body.news-page .article-card` palette in
   * `styles.css`, which provides the colour-coded card layout that the
   * unified chrome would otherwise bypass.
   */
  readonly bodyClass?: string;
  /**
   * When set to `false`, suppresses the always-visible horizontal
   * `<nav class="language-switcher rm-lang-bar">` row that follows the
   * sticky header. Defaults to `true` so every chromed page (article,
   * news index, sitemap, political-intelligence) gets the horizontal
   * row in addition to the compact `<details class="rm-lang-switcher">`
   * dropdown. Articles/PI/Sitemap pre-PR2012 already exposed an inline
   * row; restoring it here re-establishes parity.
   */
  readonly languageBar?: boolean;
}

export interface SiteChrome {
  /** Entire `<!DOCTYPE html>…<head>…</head>` block. */
  readonly head: string;
  /** `<body>…<header>…</header>` block (skip-link + header + language switcher). */
  readonly headerHtml: string;
  /** `<footer>…</footer></body></html>` block. */
  readonly footerHtml: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Compute the relative path prefix to reach the site root. */
function depth(canonicalPath: string): string {
  const clean = canonicalPath.replace(/^\/+/, '');
  const depthLevel = clean.split('/').length - 1;
  return depthLevel > 0 ? '../'.repeat(depthLevel) : '';
}

function renderHreflangBlock(
  current: Language,
  canonicalPath: string,
  alternates: Partial<Record<Language, string>> | undefined,
): string {
  if (!alternates) {
    return [
      `    <link rel="alternate" hreflang="${LANGUAGE_META[current].hreflang}" href="${BASE_URL}/${canonicalPath}">`,
      `    <link rel="canonical" href="${BASE_URL}/${canonicalPath}">`,
    ].join('\n');
  }
  const lines: string[] = [];
  for (const l of LANGUAGES) {
    const href = alternates[l];
    if (!href) continue;
    lines.push(
      `    <link rel="alternate" hreflang="${LANGUAGE_META[l].hreflang}" href="${BASE_URL}/${href}">`,
    );
  }
  const enHref = alternates.en ?? canonicalPath;
  lines.push(`    <link rel="alternate" hreflang="x-default" href="${BASE_URL}/${enHref}">`);
  lines.push(`    <link rel="canonical" href="${BASE_URL}/${canonicalPath}">`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function renderChromeHead(opts: ChromeOptions): string {
  const meta = LANGUAGE_META[opts.lang];
  const keywords = opts.keywords ?? 'Riksdagsmonitor, Swedish Parliament, political intelligence, OSINT, Riksdagen';
  const published = opts.publishedIso ?? new Date().toISOString();
  const modified = opts.modifiedIso ?? published;
  const jsonLdBlocks = (opts.jsonLd ?? [])
    .map((b) => `    <script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join('\n');

  // Title brand discipline (per `seo-metadata-contract.md` §2): append
  // ` — Riksdagsmonitor` only when the title does not already contain
  // the brand. Prevents double-branding like
  // `Riksdagsmonitor report — Riksdagsmonitor`.
  const brandedTitle = /riksdagsmonitor/i.test(opts.title)
    ? opts.title
    : `${opts.title} — Riksdagsmonitor`;
  const escapedTitle = escapeHtml(opts.title);
  const escapedBrandedTitle = escapeHtml(brandedTitle);

  const alternateLocalesHtml = LANGUAGES
    .filter((l) => l !== opts.lang)
    .map((l) => `    <meta property="og:locale:alternate" content="${LANGUAGE_META[l].locale}">`)
    .join('\n');

  const hreflangHtml = renderHreflangBlock(opts.lang, opts.canonicalPath, opts.hreflangAlternates);

  const ogType = opts.ogType ?? 'article';
  const articleMetaBlock = ogType === 'article'
    ? `    <meta property="article:publisher" content="https://www.hack23.com">
    <meta property="article:section" content="${escapeHtml(opts.section ?? 'Political Intelligence')}">
    <meta property="article:modified_time" content="${modified}">
    <meta property="article:published_time" content="${published}">
`
    : '';

  return `<!DOCTYPE html>
<html lang="${meta.hreflang}" dir="${meta.dir}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapedBrandedTitle}</title>
    <meta name="description" content="${escapeHtml(opts.description)}">
    <meta name="keywords" content="${escapeHtml(keywords)}">
    <meta name="news_keywords" content="${escapeHtml(keywords)}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="author" content="James Pether Sörling, CISSP, CISM">
    <meta name="publisher" content="Hack23 AB">
    <meta name="theme-color" content="#0a0e27">
    <meta name="color-scheme" content="dark light">
    <meta name="generator" content="riksdagsmonitor:scripts/render-lib">
    <meta name="referrer" content="strict-origin-when-cross-origin">
    <meta http-equiv="Content-Language" content="${meta.hreflang}">

    <link rel="preconnect" href="https://github.com" crossorigin>
    <link rel="dns-prefetch" href="https://github.com">
    <link rel="preconnect" href="https://www.hack23.com" crossorigin>

    <link rel="stylesheet" type="text/css" href="${depth(opts.canonicalPath)}styles.css">

${hreflangHtml}

    <link rel="sitemap" type="application/xml" href="/sitemap.xml">
    <link rel="alternate" type="application/rss+xml" title="Riksdagsmonitor news (${escapeHtml(meta.nativeName)})" href="${opts.rssHref ?? '/rss.xml'}">

    <meta property="og:type" content="${ogType}">
    <meta property="og:site_name" content="Riksdagsmonitor">
    <meta property="og:title" content="${escapedBrandedTitle}">
    <meta property="og:description" content="${escapeHtml(opts.description)}">
    <meta property="og:url" content="${BASE_URL}/${opts.canonicalPath}">
    <meta property="og:locale" content="${meta.locale}">
${alternateLocalesHtml}
    <meta property="og:image" content="${BASE_URL}/images/og-image.webp">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Riksdagsmonitor ${escapedTitle}">
    <meta property="og:updated_time" content="${modified}">

${articleMetaBlock}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@riksdagsmonitor">
    <meta name="twitter:creator" content="@hack23ab">
    <meta name="twitter:title" content="${escapedBrandedTitle}">
    <meta name="twitter:description" content="${escapeHtml(opts.description)}">
    <meta name="twitter:image" content="${BASE_URL}/images/og-image.webp">
    <meta name="twitter:image:alt" content="Riksdagsmonitor ${escapedTitle}">

    <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png">
    <link rel="icon" href="/favicon.ico" sizes="48x48">
    <link rel="manifest" href="/site.webmanifest">

${jsonLdBlocks}
${opts.extraHead ?? ''}
    <!-- Anti-flash theme bootstrap: applies the user's saved/preferred
         theme to <html data-theme> before first paint. Same storage key
         (\`riksdagsmonitor-theme\`) and resolution rules as the legacy
         article pages so the toggle button stays in sync. -->
    <script>(function(){var k='riksdagsmonitor-theme';var t=null;try{t=localStorage.getItem(k);}catch(e){}if(t!=='dark'&&t!=='light'){if(t!==null){try{localStorage.removeItem(k);}catch(e){}}t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}());</script>
${opts.extraStyle ? `    <style>${opts.extraStyle}</style>` : ''}
</head>`;
}

export function buildChrome(opts: ChromeOptions): SiteChrome {
  const meta = LANGUAGE_META[opts.lang];
  const t = meta.translations;
  const cs = chromeStrings(opts.lang);
  const prefix = depth(opts.canonicalPath);
  const indexFile = opts.lang === 'en' ? 'index.html' : `index_${opts.lang}.html`;
  const sitemapFile = opts.lang === 'en' ? 'sitemap.html' : `sitemap_${opts.lang}.html`;
  const piFile = opts.lang === 'en' ? 'political-intelligence.html' : `political-intelligence_${opts.lang}.html`;
  const newsFile = opts.lang === 'en' ? 'news/index.html' : `news/index_${opts.lang}.html`;
  const dashboardFile = opts.lang === 'en' ? 'dashboard/index.html' : `dashboard/index_${opts.lang}.html`;
  const rssHref = opts.rssHref ?? (opts.lang === 'en' ? '/rss.xml' : `/rss_${opts.lang}.xml`);

  /**
   * Resolve the lang-switcher fallback href for a given language.
   *
   * Caller-supplied `hreflangAlternates[lang]` always wins. Otherwise
   * we use the configurable `defaultAlternateBase` (e.g. `'sitemap.html'`
   * for the sitemap generator, `'political-intelligence.html'` for PI),
   * defaulting to `'index.html'` so the legacy article behaviour is
   * preserved when no explicit base is supplied.
   */
  const altBase = opts.defaultAlternateBase ?? 'index.html';
  const altBaseStem = altBase.replace(/\.html$/i, '');
  const fallbackAltHref = (l: Language): string =>
    l === 'en' ? altBase : `${altBaseStem}_${l}.html`;

  // Header dropdown (compact "more languages") — excludes the current
  // language (which is shown in the summary). When no explicit alternate
  // is provided for a given lang, fall back to the language homepage —
  // the article-renderer populates alternates for all 14 languages so
  // in practice every link here lands on a sibling article.
  const languageSwitcher = LANGUAGES
    .filter((l) => l !== opts.lang)
    .map((l) => {
      const lm = LANGUAGE_META[l];
      const href = opts.hreflangAlternates?.[l] ?? fallbackAltHref(l);
      return `          <a href="${prefix}${href}" lang="${lm.hreflang}" title="${escapeHtml(lm.nativeName)}" role="menuitem"><span aria-hidden="true">${lm.flag}</span> ${lm.nativeName}</a>`;
    })
    .join('\n');

  // Footer inline lang-switcher (secondary, always-visible, not inside
  // <details>) — same hrefs but rendered as a flat row for accessibility.
  const footerLangRow = LANGUAGES
    .filter((l) => l !== opts.lang)
    .map((l) => {
      const lm = LANGUAGE_META[l];
      const href = opts.hreflangAlternates?.[l] ?? fallbackAltHref(l);
      const displayCode = l === 'no' ? 'NO' : lm.hreflang.toUpperCase();
      return `          <a href="${prefix}${href}" lang="${lm.hreflang}" title="${escapeHtml(lm.nativeName)}"><span aria-hidden="true">${lm.flag}</span> <span class="rm-lang-code">${displayCode}</span></a>`;
    })
    .join('\n');

  const tagline = 'Swedish parliamentary intelligence · Open-source · Apache-2.0';
  const apiDocsHref = 'https://riksdagsmonitor.com/docs/api/index.html';
  const issueHref = 'https://github.com/Hack23/riksdagsmonitor/issues/new/choose';
  const lastUpdatedIso = opts.modifiedIso ?? new Date().toISOString();
  const lastUpdatedDisplay = lastUpdatedIso.slice(0, 16).replace('T', ' ') + ' UTC';

  // Render the breadcrumb sub-navigation. When the caller supplies a
  // custom `breadcrumb` array, render it verbatim (last item gets
  // `aria-current="page"` and no anchor). Otherwise fall back to the
  // legacy 3-tier `Home > Political Intelligence > {title}` breadcrumb
  // used by individual articles.
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

  // Inline horizontal language switcher row (always visible) — restores the
  // pre-PR2012 `<nav class="language-switcher">` UX where every language is
  // discoverable as a flag + native name link without expanding a dropdown.
  // Includes the current language with `aria-current="page"` so screen-readers
  // and keyboard users can confirm context.
  const horizontalLangBar = LANGUAGES
    .map((l) => {
      const lm = LANGUAGE_META[l];
      const isCurrent = l === opts.lang;
      if (isCurrent) {
        // Render the current language as a non-interactive `<span>` rather
        // than an `<a href="#">` so we avoid (a) a stray fragment navigation
        // that scrolls to the page top and (b) advertising a `hreflang`
        // whose destination doesn't actually point at the alternate.
        return `      <span class="lang-link active" lang="${lm.hreflang}" title="${escapeHtml(lm.nativeName)}" aria-current="page"><span aria-hidden="true">${lm.flag}</span> ${escapeHtml(lm.nativeName)}</span>`;
      }
      const href = `${prefix}${opts.hreflangAlternates?.[l] ?? fallbackAltHref(l)}`;
      return `      <a href="${href}" class="lang-link" hreflang="${lm.hreflang}" lang="${lm.hreflang}" title="${escapeHtml(lm.nativeName)}"><span aria-hidden="true">${lm.flag}</span> ${escapeHtml(lm.nativeName)}</a>`;
    })
    .join('\n');

  const headerHtml = `<body class="rm-article-body${opts.bodyClass ? ' ' + escapeHtml(opts.bodyClass) : ''}">
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
    </header>${(opts.languageBar ?? true) ? `
    <nav class="language-switcher rm-lang-bar" role="navigation" aria-label="${escapeHtml(cs.thisPageInOtherLanguages)}">
${horizontalLangBar}
    </nav>` : ''}
${opts.breadcrumbHtml ?? ''}
    <main id="main" class="rm-article-main" tabindex="-1">`;

  const footerHtml = `    </main>
    <footer class="rm-site-footer" role="contentinfo">
      <div class="rm-site-footer-inner">
        <section class="rm-footer-col rm-footer-brand" aria-labelledby="rm-ft-about">
          <h2 id="rm-ft-about" class="rm-footer-heading">${escapeHtml(cs.footerAboutHeading)}</h2>
          <p>${escapeHtml(meta.translations.mainPlatformDesc)}</p>
          <p>${escapeHtml(cs.footerCybersecurityTagline)}</p>
          <p class="rm-footer-attribution">
            ${escapeHtml(cs.footerPoweredBy)}
            <a href="https://github.com/Hack23/cia" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkCiaPlatform)}</a>
            · ${escapeHtml(cs.footerBuiltBy)}
            <a href="https://www.hack23.com" target="_blank" rel="noopener noreferrer">Hack23 AB</a>
          </p>
          <p class="rm-footer-updated"><small>${escapeHtml(cs.footerLastUpdated)} <time datetime="${lastUpdatedIso}">${escapeHtml(lastUpdatedDisplay)}</time></small></p>
        </section>
        <section class="rm-footer-col rm-footer-navigate" aria-labelledby="rm-ft-nav">
          <h2 id="rm-ft-nav" class="rm-footer-heading">${escapeHtml(cs.footerQuickLinksHeading)}</h2>
          <ul>
            <li><a href="${prefix}${indexFile}">${escapeHtml(t.home)}</a></li>
            <li><a href="${prefix}${newsFile}">${escapeHtml(cs.news)}</a></li>
            <li><a href="${prefix}${dashboardFile}">${escapeHtml(cs.dashboard)}</a></li>
            <li><a href="${prefix}${piFile}"><span aria-hidden="true">🧠</span> ${escapeHtml(cs.politicalIntelligence)}</a></li>
            <li><a href="${prefix}${sitemapFile}"><span aria-hidden="true">🗺️</span> ${escapeHtml(t.siteMap)}</a></li>
            <li><a href="${apiDocsHref}"><span aria-hidden="true">📚</span> ${escapeHtml(cs.linkApiDocs)}</a></li>
            <li><a href="https://github.com/Hack23/cia" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkCiaPlatform)}</a></li>
            <li><a href="https://github.com/Hack23/riksdagsmonitor" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkGithubRepo)}</a></li>
            <li><a href="https://www.riksdagen.se" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkRiksdag)}</a></li>
            <li><a href="${rssHref}" type="application/rss+xml" rel="alternate"><span aria-hidden="true">📡</span> ${escapeHtml(cs.linkRss)}</a></li>
          </ul>
        </section>
        <section class="rm-footer-col rm-footer-trust" aria-labelledby="rm-ft-trust">
          <h2 id="rm-ft-trust" class="rm-footer-heading">${escapeHtml(cs.footerBuiltByHeading)}</h2>
          <ul>
            <li><a href="https://www.hack23.com" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkHack23Home)}</a></li>
            <li><a href="https://www.hack23.com/riksdagsmonitor.html" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkHack23Riksdagsmonitor)}</a></li>
            <li><a href="https://www.hack23.com/riksdagsmonitor-features.html" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkHack23Features)}</a></li>
            <li><a href="https://github.com/sponsors/Hack23" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">💖</span> ${escapeHtml(cs.linkSponsorHack23)}</a></li>
            <li><a href="https://www.linkedin.com/company/hack23/" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkLinkedin)}</a></li>
            <li><a href="https://github.com/Hack23" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkHack23Org)}</a></li>
            <li><a href="mailto:info@hack23.com">${escapeHtml(cs.linkContactUs)}</a></li>
          </ul>
        </section>
        <section class="rm-footer-col rm-footer-isms" aria-labelledby="rm-ft-isms">
          <h2 id="rm-ft-isms" class="rm-footer-heading"><span aria-hidden="true">🛡️</span> ${escapeHtml(cs.footerIsmsHeading)}</h2>
          <p class="rm-footer-isms-tagline">${cs.footerIsmsTagline}</p>
          <ul>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkPublicIsmsRepo)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Information_Security_Policy.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkInfoSecPolicy)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Privacy_Policy.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkPrivacyPolicy)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkSecureDevPolicy)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/AI_Policy.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkAiPolicy)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Threat_Modeling.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkThreatModeling)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Vulnerability_Management.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkVulnMgmt)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Incident_Response_Plan.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkIncidentResponse)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Access_Control_Policy.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkAccessControl)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Cryptography_Policy.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkCryptoPolicy)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Open_Source_Policy.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkOpenSourcePolicy)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Change_Management.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkChangeMgmt)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/CLASSIFICATION.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkClassification)}</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Security_Metrics.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkSecurityMetrics)}</a></li>
          </ul>
        </section>
        <section class="rm-footer-col rm-footer-trust" aria-labelledby="rm-ft-compliance">
          <h2 id="rm-ft-compliance" class="rm-footer-heading"><span aria-hidden="true">🔐</span> ${cs.footerComplianceHeading}</h2>
          <ul>
            <li><a href="${GITHUB_BLOB}/SECURITY.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkSecurityPolicy)}</a></li>
            <li><a href="${GITHUB_BLOB}/CRA-ASSESSMENT.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkCraAssessment)}</a></li>
            <li><a href="${GITHUB_BLOB}/THREAT_MODEL.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkThreatModel)}</a></li>
            <li><a href="${GITHUB_BLOB}/TRANSLATION_GUIDE.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkTranslationGuide)}</a></li>
            <li><a href="${GITHUB_BLOB}/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkContributing)}</a></li>
            <li><a href="${GITHUB_BLOB}/CODE_OF_CONDUCT.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkCodeOfConduct)}</a></li>
            <li><a href="${GITHUB_BLOB}/CHANGELOG.md" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkChangelog)}</a></li>
            <li><a href="${GITHUB_BLOB}/LICENSE" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkLicense)}</a></li>
            <li><a href="${issueHref}" target="_blank" rel="noopener noreferrer">${escapeHtml(cs.linkReportIssue)}</a></li>
          </ul>
        </section>
      </div>
      <nav class="rm-footer-trust-badges" aria-label="${escapeHtml(cs.trustBadgesAria)}">
        <a href="https://www.npmjs.com/package/riksdagsmonitor" target="_blank" rel="noopener noreferrer" aria-label="Riksdagsmonitor on npmjs">
          <img src="https://img.shields.io/npm/v/riksdagsmonitor.svg?logo=npm&label=npm" alt="Riksdagsmonitor on npmjs" width="100" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://scorecard.dev/viewer/?uri=github.com/Hack23/riksdagsmonitor" target="_blank" rel="noopener noreferrer" aria-label="OpenSSF Scorecard">
          <img src="https://api.securityscorecards.dev/projects/github.com/Hack23/riksdagsmonitor/badge" alt="OpenSSF Scorecard" width="120" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://www.bestpractices.dev/projects/12069" target="_blank" rel="noopener noreferrer" aria-label="OpenSSF Best Practices">
          <img src="https://www.bestpractices.dev/projects/12069/badge" alt="OpenSSF Best Practices" width="124" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://github.com/Hack23/riksdagsmonitor/actions/workflows/codeql.yml" target="_blank" rel="noopener noreferrer" aria-label="CodeQL workflow status">
          <img src="https://github.com/Hack23/riksdagsmonitor/actions/workflows/codeql.yml/badge.svg" alt="CodeQL workflow status" width="120" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://github.com/Hack23/riksdagsmonitor/actions/workflows/quality-checks.yml" target="_blank" rel="noopener noreferrer" aria-label="Quality checks workflow status">
          <img src="https://github.com/Hack23/riksdagsmonitor/actions/workflows/quality-checks.yml/badge.svg" alt="Quality checks workflow status" width="160" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://github.com/Hack23/riksdagsmonitor/actions/workflows/dependency-review.yml" target="_blank" rel="noopener noreferrer" aria-label="Dependency review workflow status">
          <img src="https://github.com/Hack23/riksdagsmonitor/actions/workflows/dependency-review.yml/badge.svg" alt="Dependency review workflow status" width="170" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://github.com/Hack23/riksdagsmonitor/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" aria-label="Apache-2.0 License">
          <img src="https://img.shields.io/github/license/Hack23/riksdagsmonitor" alt="Apache-2.0 License" width="120" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://github.com/Hack23/ISMS-PUBLIC" target="_blank" rel="noopener noreferrer" aria-label="Hack23 ISMS-PUBLIC">
          <img src="https://img.shields.io/badge/Hack23-ISMS-blue?logo=shield" alt="Hack23 ISMS-PUBLIC" width="100" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md" target="_blank" rel="noopener noreferrer" aria-label="ISO 27001:2022 alignment">
          <img src="https://img.shields.io/badge/ISO-27001:2022-purple" alt="ISO 27001:2022 alignment" width="110" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md" target="_blank" rel="noopener noreferrer" aria-label="NIST CSF 2.0 alignment">
          <img src="https://img.shields.io/badge/NIST-CSF_2.0-orange" alt="NIST CSF 2.0 alignment" width="100" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://github.com/Hack23/ISMS-PUBLIC/blob/main/Secure_Development_Policy.md" target="_blank" rel="noopener noreferrer" aria-label="CIS Controls v8.1 alignment">
          <img src="https://img.shields.io/badge/CIS-Controls_v8.1-red" alt="CIS Controls v8.1 alignment" width="120" height="20" loading="lazy" decoding="async">
        </a>
        <a href="https://riksdagsmonitor.com" target="_blank" rel="noopener noreferrer" aria-label="Riksdagsmonitor.com website status">
          <img src="https://img.shields.io/website?url=https%3A%2F%2Friksdagsmonitor.com" alt="Riksdagsmonitor.com website status" width="120" height="20" loading="lazy" decoding="async">
        </a>
      </nav>
      <nav class="rm-footer-langs" aria-label="${escapeHtml(cs.footerLangsAria)}">
        <span class="rm-footer-langs-label" aria-hidden="true">🌐</span>
${footerLangRow}
      </nav>
      <p class="rm-footer-legal">
        © ${new Date().getFullYear()} ${cs.footerLegal}
      </p>
    </footer>
    <!-- Mermaid + back-to-top + theme toggle bootstrap.
         The src strings below are imperatively assembled at runtime so that
         Vite's HTML/script-tag transformer does NOT try to bundle, hash and
         re-emit the underlying modules under \`/assets/…\` (which previously
         caused 404s like \`/assets/mermaid.esm.min-XXXX.mjs\` whenever the
         pinned \`mermaid\` devDependency was upgraded between deploys).
         The unhashed runtime files live under \`/js/lib/\` and \`/js/\` and are
         deployed verbatim to S3 by the "Copy JS libraries to build output"
         step in \`.github/workflows/deploy-s3.yml\`. -->
    <script>
      (function () {
        function inject(src, isModule) {
          var s = document.createElement('script');
          if (isModule) s.type = 'module';
          else s.defer = true;
          s.src = src;
          document.head.appendChild(s);
        }
        inject('/js/lib/mermaid-init.mjs', true);
        inject('/js/back-to-top.js', true);
        inject('/js/theme-toggle.js', false);
      })();
    </script>
  </body>
</html>
`;

  return {
    head: renderChromeHead(opts),
    headerHtml,
    footerHtml,
  };
}
