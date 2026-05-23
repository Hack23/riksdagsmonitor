/**
 * @module Infrastructure/RenderLib/Chrome
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Shared HTML chrome (head / header / footer / SEO) for articles
 *
 * @description
 * Façade module that delegates to the decomposed bounded-context modules
 * in `./chrome/` (types, helpers, head, header, footer). Maintains the
 * same public API as the original monolithic `chrome.ts` so all existing
 * importers (`article.ts`, `generate-news-indexes/template.ts`,
 * `sitemap-html/render/page.ts`, etc.) continue to work without changes.
 *
 * ## Architecture (Round-5 decomposition)
 * ```
 * chrome.ts (this file — façade)
 * └── chrome/
 *     ├── types.ts      — ChromeOptions, SiteChrome, BreadcrumbItem
 *     ├── helpers.ts    — depth(), renderHreflangBlock(), fallbackAlternateHref()
 *     ├── head.ts       — renderChromeHead() — SEO / OG / JSON-LD / hreflang
 *     ├── header.ts     — buildHeaderHtml() — nav / CTA / breadcrumb / hero
 *     ├── footer.ts     — buildFooterHtml() — columns / badges / scripts
 *     └── index.ts      — barrel re-export
 * ```
 *
 * Each sub-module is independently testable in isolation.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

// Re-export types for backward compatibility
export type { BreadcrumbItem, ChromeOptions, SiteChrome } from './chrome/types.js';

// Re-export sub-module functions
import type { ChromeOptions, SiteChrome } from './chrome/types.js';
import { brandTitle as _brandTitle, renderChromeHead as _renderChromeHead } from './chrome/head.js';
import { buildHeaderHtml } from './chrome/header.js';
import { buildFooterHtml } from './chrome/footer.js';

// ---------------------------------------------------------------------------
// Public API — preserves the exact same signatures as the original chrome.ts
// ---------------------------------------------------------------------------

/**
 * Apply the canonical Riksdagsmonitor brand-suffix rule to a `<title>` string.
 * Delegates to `chrome/head.ts`. Re-exported here for consumers that import
 * from the façade (`render-lib/chrome.js`) rather than the sub-module directly.
 */
export function brandTitle(title: string): string {
  return _brandTitle(title);
}

/**
 * Render the complete `<!DOCTYPE html><html…><head>…</head>` block.
 * Delegates to `chrome/head.ts`.
 */
export function renderChromeHead(opts: ChromeOptions): string {
  return _renderChromeHead(opts);
}

/**
 * Build the complete site chrome (head + header + footer) for a page.
 * Delegates to the decomposed `chrome/head.ts`, `chrome/header.ts`,
 * and `chrome/footer.ts` modules.
 */
export function buildChrome(opts: ChromeOptions): SiteChrome {
  return {
    head: _renderChromeHead(opts),
    headerHtml: buildHeaderHtml(opts),
    footerHtml: buildFooterHtml(opts),
  };
}
