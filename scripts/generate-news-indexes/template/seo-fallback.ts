/**
 * @module generate-news-indexes/template/seo-fallback
 * @description Crawler-visible `<details>` fallback list of all articles.
 *
 * The `.articles-grid` is hydrated client-side from JSON, leaving search-
 * engine crawlers with only a skeleton + the truncated 10-item ItemList
 * JSON-LD. This collapsible fallback exposes article URLs + titles + dates
 * in the initial HTML so the archive is discoverable from the index page
 * even without JS. Capped at 200 entries to keep HTML size reasonable.
 * Using `<details>` keeps the list out of the default keyboard tab order
 * and avoids overwhelming screen readers while remaining fully crawlable.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import type { LanguageConfig, NewsArticleMetadata } from '../types.js';

const MAX_FALLBACK_ITEMS = 200;

/** Render the crawler-visible article-list fallback. */
export function renderSeoFallback(
  lang: LanguageConfig,
  langKey: string,
  displayArticles: readonly NewsArticleMetadata[],
): string {
  const cappedCount = Math.min(displayArticles.length, MAX_FALLBACK_ITEMS);
  const items = displayArticles
    .slice(0, MAX_FALLBACK_ITEMS)
    .map((a) => `      <li><a href="${escapeHtml(a.slug)}"><time datetime="${escapeHtml(a.date)}">${escapeHtml(a.date)}</time> — ${escapeHtml(a.title)}</a></li>`)
    .join('\n');
  const overflow = displayArticles.length > MAX_FALLBACK_ITEMS
    ? `\n    <p><a href="/sitemap_${langKey === 'en' ? '' : langKey + '_'}html">→ Full archive (${displayArticles.length} articles)</a></p>`
    : '';
  return `  <details class="seo-article-list" aria-labelledby="seo-article-list-heading">
    <summary id="seo-article-list-heading">${escapeHtml(lang.title)} — ${cappedCount} / ${displayArticles.length}</summary>
    <ul>
${items}
    </ul>${overflow}
  </details>`;
}
