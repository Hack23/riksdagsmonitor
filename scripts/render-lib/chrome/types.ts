/**
 * @module Infrastructure/RenderLib/Chrome/Types
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Chrome type definitions (options, return shapes, breadcrumbs)
 *
 * @description
 * Shared type definitions consumed by all chrome sub-modules (head, header,
 * footer, helpers). Extracted from the monolithic `chrome.ts` to enable
 * independent testability of each chrome component.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import type { Language } from '../../types/language.js';
import type { FAQItem } from '../../types/editorial.js';

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
  /** JSON-LD object(s) to inject inside `<head>` as `<script type="application/ld+json">`. Pass plain (non-serialised) JS objects — the head renderer serialises them via `JSON.stringify`. */
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
   * canonical `rm-article-body` class.
   */
  readonly bodyClass?: string;
  /**
   * When set to `false`, suppresses the always-visible horizontal
   * `<nav class="language-switcher rm-lang-bar">` row. Defaults to `true`.
   */
  readonly languageBar?: boolean;
  /**
   * When `true` (default), emits the brand `.hero-banner` block immediately
   * after `<header class="rm-site-header">`. Set `false` for chrome variants
   * where a full-bleed banner conflicts with the page's own hero.
   */
  readonly heroBanner?: boolean;
  /**
   * Optional site-root-relative banner image used when `heroBanner` is enabled.
   */
  readonly heroBannerImage?: string;
  /**
   * Optional FAQ entries. When ≥2 well-formed entries are provided, chrome
   * auto-emits a Schema.org `FAQPage` JSON-LD block.
   */
  readonly faqItems?: readonly FAQItem[];
  /**
   * CSS selectors for SpeakableSpecification.
   */
  readonly speakableSelectors?: readonly string[];
  /**
   * Optional `<link rel="prev">` absolute URL for paginated listing pages.
   */
  readonly relPrev?: string;
  /**
   * Optional `<link rel="next">` absolute URL for paginated listing pages.
   */
  readonly relNext?: string;
}

export interface SiteChrome {
  /** Entire `<!DOCTYPE html>…<head>…</head>` block. */
  readonly head: string;
  /** `<body>…<header>…</header>` block (skip-link + header + language switcher). */
  readonly headerHtml: string;
  /** `<footer>…</footer></body></html>` block. */
  readonly footerHtml: string;
}
