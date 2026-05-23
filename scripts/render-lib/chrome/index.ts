/**
 * @module Infrastructure/RenderLib/Chrome
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Chrome sub-module barrel (types + head + header + footer + helpers)
 *
 * @description
 * Barrel re-export for the decomposed chrome bounded context. Each leaf
 * module is independently testable and has a focused responsibility:
 *
 * - `types.ts` — Shared interfaces (ChromeOptions, SiteChrome, BreadcrumbItem)
 * - `helpers.ts` — Pure utility functions (depth, hreflang, fallback alternates)
 * - `head.ts` — `<head>` builder (SEO, OpenGraph, JSON-LD, hreflang)
 * - `header.ts` — `<header>` builder (nav, lang switcher, CTAs, breadcrumb)
 * - `footer.ts` — `<footer>` builder (columns, trust badges, scripts)
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

export type { BreadcrumbItem, ChromeOptions, SiteChrome } from './types.js';
export { depth, renderHreflangBlock, fallbackAlternateHref } from './helpers.js';
export { brandTitle, renderChromeHead } from './head.js';
export { buildHeaderHtml } from './header.js';
export { buildFooterHtml } from './footer.js';
