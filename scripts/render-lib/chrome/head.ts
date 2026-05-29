/**
 * @module Infrastructure/RenderLib/Chrome/Head
 * @category Intelligence Operations / Supporting Infrastructure
 * @name HTML `<head>` builder (SEO, OpenGraph, JSON-LD, hreflang)
 *
 * @description
 * Pure, stateless string builder for the `<!DOCTYPE html>…<head>…</head>`
 * block. Handles SEO meta tags, Open Graph, Twitter Cards, JSON-LD
 * injection, hreflang alternate links, and pagination relations.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { LANGUAGE_META, escapeHtml } from '../../sitemap-html/index.js';
import type { Language } from '../../types/language.js';
import { titleWindowForLanguage } from '../aggregator/seo/serp-budgets.js';
import { BASE_URL, LANGUAGES } from '../constants.js';
import type { ChromeOptions } from './types.js';
import { depth, renderHreflangBlock } from './helpers.js';

/**
 * Brand suffix appended to non-branded titles. Kept in sync with the
 * `SITE_SUFFIX` constant in `article-seo.ts § buildSeoTitle` — both must
 * use the same 18-char string so the budget arithmetic in this module
 * and in `buildSeoTitle` agrees on whether the suffix fits.
 */
export const BRAND_TITLE_SUFFIX = ' — Riksdagsmonitor';

/** JSON-LD node shape — typed replacement for `any` in findIndex. */
interface JsonLdNode {
  readonly '@type'?: string;
  readonly [key: string]: unknown;
}

/**
 * Apply the canonical Riksdagsmonitor brand-suffix rule to a `<title>` string.
 *
 * The brand suffix ` — Riksdagsmonitor` (18 chars) is appended **only**
 * when all three conditions hold:
 *
 *  1. The title does not already contain "Riksdagsmonitor"
 *     (case-insensitive) — avoids the literal `… — Riksdagsmonitor —
 *     Riksdagsmonitor` double-brand bug.
 *  2. The title does not end with the ellipsis character `…` —
 *     `buildSeoTitle()` only emits a trailing `…` when it already
 *     truncated at the per-language SERP `hardMax`. Appending the
 *     brand to a truncated title would re-overshoot the budget and
 *     ship `<title>` like `"Sweden Passes AI Facial Recognition Law as
 *     Riksdag Advances Five… — Riksdagsmonitor"` (84 chars, > Google's
 *     70-char EN cap). Pre-2026-05-24 audit `Test Article Headers` run
 *     #26364730339 reported 145/202 EN titles overshooting because of
 *     this regression.
 *  3. `title.length + BRAND_TITLE_SUFFIX.length ≤
 *     titleWindowForLanguage(lang).hardMax` — the suffix fits inside
 *     the per-language Google SERP budget defined in
 *     `serp-budgets.ts`.
 *
 * When any condition fails the original `title` is returned unchanged
 * — the SERP signal of the story text always outranks the brand suffix
 * (the brand is also surfaced through `og:site_name`, the canonical
 * URL, and the JSON-LD `publisher` node, so dropping the suffix never
 * costs brand SEO).
 *
 * The `lang` parameter defaults to `'en'` for backwards compatibility
 * with the small number of internal callers that don't yet thread a
 * locale through; all production article-render call sites pass the
 * article's actual language.
 *
 * Exported so that `article-head-metadata.ts` (which must report the
 * *exact* branded title that `renderChromeHead` emits) can reuse the
 * same rule without duplicating it.
 */
export function brandTitle(title: string, lang: Language = 'en'): string {
  if (/riksdagsmonitor/i.test(title)) return title;
  // `buildSeoTitle` only emits a trailing `…` when it has already
  // hit the per-language SERP `hardMax`; appending the brand suffix
  // would re-overshoot, so leave the truncated title alone.
  if (title.endsWith('…')) return title;
  const { hardMax } = titleWindowForLanguage(lang);
  if (title.length + BRAND_TITLE_SUFFIX.length > hardMax) return title;
  return `${title}${BRAND_TITLE_SUFFIX}`;
}

/**
 * Canonical default for `article:section` / `articleSection`.
 *
 * Exported so that {@link ../article-head-metadata.ts | computeArticleHeadMetadata}
 * can mirror the exact value emitted by `renderChromeHead` without duplicating
 * the string literal — eliminating the drift risk flagged in PR review.
 */
export const DEFAULT_ARTICLE_SECTION = 'Political Intelligence';

/**
 * Render the complete `<!DOCTYPE html><html…><head>…</head>` block.
 *
 * This function is synchronous and deterministic for identical inputs
 * (modulo the current timestamp used as `publishedIso` fallback).
 */
export function renderChromeHead(opts: ChromeOptions): string {
  const meta = LANGUAGE_META[opts.lang];
  const keywords = opts.keywords ?? 'Riksdagsmonitor, Swedish Parliament, political intelligence, OSINT, Riksdagen';
  const published = opts.publishedIso ?? new Date().toISOString();
  const modified = opts.modifiedIso ?? published;

  // Defence-in-depth SEO guarantee: every page that flows through the
  // shared chrome MUST ship a non-empty `<meta name="description">` (and
  // the mirrored `og:`/`twitter:` description). A blank or whitespace-only
  // `opts.description` — e.g. an article with empty front-matter or a
  // news-index whose `subtitle` is missing for a locale — would otherwise
  // emit `content=""`, which crawlers report as "description missing".
  // Fall back to the page title so the tag is always populated and
  // relevant; the title is itself synthesised non-empty upstream
  // (see `buildSeoTitle`).
  const description =
    opts.description && opts.description.trim().length > 0
      ? opts.description
      : opts.title;

  const autoJsonLd: unknown[] = [];
  if (opts.faqItems && opts.faqItems.length >= 2) {
    autoJsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: opts.faqItems.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      })),
    });
  }

  let mergedJsonLd = opts.jsonLd ?? [];
  if (opts.speakableSelectors && opts.speakableSelectors.length > 0) {
    const speakableSpec = {
      '@type': 'SpeakableSpecification' as const,
      cssSelector: [...opts.speakableSelectors],
    };
    const existingIdx = mergedJsonLd.findIndex(
      (node) => (node as JsonLdNode)?.['@type'] === 'WebPage',
    );
    if (existingIdx >= 0) {
      const cloned = [...mergedJsonLd];
      const clonedNode = { ...(cloned[existingIdx] as Record<string, unknown>) };
      clonedNode['speakable'] = speakableSpec;
      if (!clonedNode['isPartOf']) {
        clonedNode['isPartOf'] = { '@type': 'WebSite', '@id': `${BASE_URL}/#website` };
      }
      cloned[existingIdx] = clonedNode;
      mergedJsonLd = cloned;
    } else {
      autoJsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        url: `${BASE_URL}/${opts.canonicalPath}`,
        inLanguage: meta.hreflang,
        speakable: speakableSpec,
        isPartOf: { '@type': 'WebSite', '@id': `${BASE_URL}/#website` },
      });
    }
  }
  const allJsonLd = [...mergedJsonLd, ...autoJsonLd];
  const jsonLdBlocks = allJsonLd
    .map((b) => {
      const raw = JSON.stringify(b);
      const safe = raw.replace(/</g, '\\u003c');
      return `    <script type="application/ld+json">${safe}</script>`;
    })
    .join('\n');

  const pagerLinks: string[] = [];
  if (opts.relPrev) pagerLinks.push(`    <link rel="prev" href="${escapeHtml(opts.relPrev)}">`);
  if (opts.relNext) pagerLinks.push(`    <link rel="next" href="${escapeHtml(opts.relNext)}">`);
  const pagerLinksHtml = pagerLinks.length > 0 ? pagerLinks.join('\n') + '\n' : '';

  const brandedTitle = brandTitle(opts.title, opts.lang);
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
    <meta property="article:section" content="${escapeHtml(opts.section ?? DEFAULT_ARTICLE_SECTION)}">
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
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="keywords" content="${escapeHtml(keywords)}">
    <meta name="news_keywords" content="${escapeHtml(keywords)}">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="bingbot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="author" content="James Pether Sörling, CISSP, CISM">
    <meta name="publisher" content="Hack23 AB">
    <meta name="theme-color" content="#0a0e27">
    <meta name="color-scheme" content="dark light">
    <meta name="generator" content="riksdagsmonitor:scripts/render-lib">
    <meta name="referrer" content="strict-origin-when-cross-origin">
    <meta name="format-detection" content="telephone=no">
    <meta http-equiv="Content-Language" content="${meta.hreflang}">

    <link rel="preconnect" href="https://github.com" crossorigin>
    <link rel="dns-prefetch" href="https://github.com">
    <link rel="preconnect" href="https://www.hack23.com" crossorigin>

    <link rel="stylesheet" type="text/css" href="${depth(opts.canonicalPath)}styles.css">

${hreflangHtml}

    <link rel="sitemap" type="application/xml" href="/sitemap.xml">
    <link rel="alternate" type="application/rss+xml" title="Riksdagsmonitor news (${escapeHtml(meta.nativeName)})" href="${opts.rssHref ?? (opts.lang === 'en' ? '/rss.xml' : `/rss_${opts.lang}.xml`)}">
${pagerLinksHtml}
    <meta property="og:type" content="${ogType}">
    <meta property="og:site_name" content="Riksdagsmonitor">
    <meta property="og:title" content="${escapedBrandedTitle}">
    <meta property="og:description" content="${escapeHtml(description)}">
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
    <meta name="twitter:description" content="${escapeHtml(description)}">
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
