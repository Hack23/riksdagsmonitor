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

// ---------------------------------------------------------------------------
// Options + return shape
// ---------------------------------------------------------------------------

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

    <meta property="og:type" content="article">
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

    <meta property="article:publisher" content="https://www.hack23.com">
    <meta property="article:section" content="${escapeHtml(opts.section ?? 'Political Intelligence')}">
    <meta property="article:modified_time" content="${modified}">
    <meta property="article:published_time" content="${published}">

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
${opts.extraStyle ? `    <style>${opts.extraStyle}</style>` : ''}
</head>`;
}

export function buildChrome(opts: ChromeOptions): SiteChrome {
  const meta = LANGUAGE_META[opts.lang];
  const t = meta.translations;
  const prefix = depth(opts.canonicalPath);
  const indexFile = opts.lang === 'en' ? 'index.html' : `index_${opts.lang}.html`;
  const sitemapFile = opts.lang === 'en' ? 'sitemap.html' : `sitemap_${opts.lang}.html`;
  const piFile = opts.lang === 'en' ? 'political-intelligence.html' : `political-intelligence_${opts.lang}.html`;
  const rssHref = opts.rssHref ?? (opts.lang === 'en' ? '/rss.xml' : `/rss_${opts.lang}.xml`);

  // Header dropdown (compact "more languages") — excludes the current
  // language (which is shown in the summary). When no explicit alternate
  // is provided for a given lang, fall back to the language homepage —
  // the article-renderer populates alternates for all 14 languages so
  // in practice every link here lands on a sibling article.
  const languageSwitcher = LANGUAGES
    .filter((l) => l !== opts.lang)
    .map((l) => {
      const lm = LANGUAGE_META[l];
      const href = opts.hreflangAlternates?.[l] ?? (l === 'en' ? 'index.html' : `index_${l}.html`);
      return `          <a href="${prefix}${href}" lang="${lm.hreflang}" title="${escapeHtml(lm.nativeName)}" role="menuitem"><span aria-hidden="true">${lm.flag}</span> ${lm.nativeName}</a>`;
    })
    .join('\n');

  // Footer inline lang-switcher (secondary, always-visible, not inside
  // <details>) — same hrefs but rendered as a flat row for accessibility.
  const footerLangRow = LANGUAGES
    .filter((l) => l !== opts.lang)
    .map((l) => {
      const lm = LANGUAGE_META[l];
      const href = opts.hreflangAlternates?.[l] ?? (l === 'en' ? 'index.html' : `index_${l}.html`);
      return `          <a href="${prefix}${href}" lang="${lm.hreflang}" title="${escapeHtml(lm.nativeName)}"><span aria-hidden="true">${lm.flag}</span> <span class="rm-lang-code">${lm.hreflang}</span></a>`;
    })
    .join('\n');

  const tagline = 'Swedish parliamentary intelligence · Open-source · Apache-2.0';
  const lastUpdatedIso = opts.modifiedIso ?? new Date().toISOString();
  const lastUpdatedDisplay = lastUpdatedIso.slice(0, 16).replace('T', ' ') + ' UTC';

  const headerHtml = `<body class="rm-article-body">
    <a class="skip-link" href="#main">${escapeHtml('Skip to main content')}</a>
    <header class="rm-site-header" role="banner">
      <div class="rm-site-header-inner">
        <a class="rm-logo" href="${prefix}${indexFile}" aria-label="Riksdagsmonitor ${escapeHtml(t.home)}">
          <span class="rm-logo-glyph" aria-hidden="true">🇸🇪</span>
          <span class="rm-logo-text">
            <span class="rm-logo-brand">Riksdagsmonitor</span>
            <span class="rm-logo-tagline">${escapeHtml(tagline)}</span>
          </span>
        </a>
        <nav class="rm-site-nav" aria-label="${escapeHtml(t.mainPlatform)}">
          <a href="${prefix}${indexFile}">${escapeHtml(t.home)}</a>
          <a href="${prefix}${piFile}">${escapeHtml('Political Intelligence')}</a>
          <a href="${prefix}${sitemapFile}">${escapeHtml(t.siteMap)}</a>
        </nav>
        <details class="rm-lang-switcher">
          <summary aria-label="${escapeHtml(t.sitemapInOtherLanguages)}">
            <span aria-hidden="true">${meta.flag}</span>
            <span class="rm-lang-current-label">${escapeHtml(meta.nativeName)}</span>
            <span class="rm-lang-switcher-caret" aria-hidden="true">▾</span>
          </summary>
          <div class="rm-lang-switcher-dropdown" role="menu">
${languageSwitcher}
          </div>
        </details>
      </div>
      <div class="rm-site-subnav" aria-label="Article context">
        <nav class="rm-breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li><a href="${prefix}${indexFile}">${escapeHtml(t.home)}</a></li>
            <li><a href="${prefix}${piFile}">${escapeHtml('Political Intelligence')}</a></li>
            <li aria-current="page">${escapeHtml(opts.title)}</li>
          </ol>
        </nav>
        ${opts.publishedIso ? `<time class="rm-article-published" datetime="${opts.publishedIso}">${opts.publishedIso.slice(0, 10)}</time>` : ''}
      </div>
    </header>
${opts.breadcrumbHtml ?? ''}
    <main id="main" class="rm-article-main" tabindex="-1">`;

  const footerHtml = `    </main>
    <footer class="rm-site-footer" role="contentinfo">
      <div class="rm-site-footer-inner">
        <section class="rm-footer-col rm-footer-brand" aria-labelledby="rm-ft-about">
          <h2 id="rm-ft-about" class="rm-footer-heading">Riksdagsmonitor</h2>
          <p>${escapeHtml(meta.translations.mainPlatformDesc)}</p>
          <p class="rm-footer-attribution">
            Powered by
            <a href="https://github.com/Hack23/cia" target="_blank" rel="noopener noreferrer">CIA OSINT Platform</a>
            · Built by
            <a href="https://www.hack23.com" target="_blank" rel="noopener noreferrer">Hack23 AB</a>
          </p>
          <p class="rm-footer-updated"><small>Last updated: <time datetime="${lastUpdatedIso}">${escapeHtml(lastUpdatedDisplay)}</time></small></p>
        </section>
        <section class="rm-footer-col rm-footer-navigate" aria-labelledby="rm-ft-nav">
          <h2 id="rm-ft-nav" class="rm-footer-heading">${escapeHtml(t.resources)}</h2>
          <ul>
            <li><a href="${prefix}${indexFile}">${escapeHtml(t.home)}</a></li>
            <li><a href="${prefix}${piFile}">${escapeHtml('Political Intelligence')}</a></li>
            <li><a href="${prefix}${sitemapFile}">${escapeHtml(t.siteMap)}</a></li>
            <li><a href="${rssHref}" type="application/rss+xml" rel="alternate"><span aria-hidden="true">📡</span> RSS feed</a></li>
            <li><a href="${GITHUB_TREE}/analysis" target="_blank" rel="noopener noreferrer">GitHub · analysis/</a></li>
            <li><a href="${GITHUB_TREE}" target="_blank" rel="noopener noreferrer">GitHub · source</a></li>
          </ul>
        </section>
        <section class="rm-footer-col rm-footer-trust" aria-labelledby="rm-ft-trust">
          <h2 id="rm-ft-trust" class="rm-footer-heading">Trust &amp; compliance</h2>
          <ul>
            <li><a href="${GITHUB_BLOB}/SECURITY.md" target="_blank" rel="noopener noreferrer">Security policy</a></li>
            <li><a href="${GITHUB_BLOB}/CRA-ASSESSMENT.md" target="_blank" rel="noopener noreferrer">EU CRA assessment</a></li>
            <li><a href="${GITHUB_BLOB}/THREAT_MODEL.md" target="_blank" rel="noopener noreferrer">Threat model</a></li>
            <li><a href="${GITHUB_BLOB}/TRANSLATION_GUIDE.md" target="_blank" rel="noopener noreferrer">Translation guide</a></li>
            <li><a href="${GITHUB_BLOB}/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">Contributing</a></li>
            <li><a href="https://github.com/Hack23/ISMS-PUBLIC" target="_blank" rel="noopener noreferrer">Hack23 ISMS policies</a></li>
          </ul>
        </section>
      </div>
      <nav class="rm-footer-langs" aria-label="Switch language">
        <span class="rm-footer-langs-label" aria-hidden="true">🌐</span>
${footerLangRow}
      </nav>
      <p class="rm-footer-legal">
        © ${new Date().getFullYear()} Hack23 AB · Apache-2.0 · Public political data only — GDPR Art. 9(2)(e,g). No cookies, no tracking, no advertising.
      </p>
    </footer>
    <script type="module" src="${prefix}js/lib/mermaid-init.mjs"></script>
    <script type="module" src="${prefix}js/back-to-top.js"></script>
  </body>
</html>
`;

  return {
    head: renderChromeHead(opts),
    headerHtml,
    footerHtml,
  };
}
