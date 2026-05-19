/**
 * @module generate-news-indexes/template/article-grid
 * @description Article-grid skeleton placeholders + empty/no-result/pagination markup.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import type { LanguageConfig } from '../types.js';

/** Render a single article-card skeleton (used three times in the grid). */
function skeletonCard(): string {
  return `      <div class="article-card-skeleton" aria-hidden="true">
        <div class="skeleton-line skeleton-meta"></div>
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-title-2"></div>
        <div class="skeleton-line skeleton-excerpt"></div>
        <div class="skeleton-line skeleton-excerpt-2"></div>
        <div class="skeleton-line skeleton-tags"></div>
      </div>`;
}

/** Render the article grid (3 skeleton placeholders + empty-state slots). */
export function renderArticleGrid(lang: LanguageConfig): string {
  return `    <div class="articles-grid" id="articles-grid" aria-busy="true">
${skeletonCard()}
${skeletonCard()}
${skeletonCard()}
    </div>

    <div id="no-articles" style="text-align: center; padding: 3rem; color: #888;" hidden>
      ${escapeHtml(lang.i18n.noArticles)}
    </div>

    <div id="no-results" style="text-align: center; padding: 3rem; color: #888;" hidden>
      ${escapeHtml(lang.noResults)}
    </div>

    <div class="pagination-controls" role="navigation" aria-label="${escapeHtml(lang.i18n.loadMore)}">
      <p id="article-counter" class="article-counter" aria-live="polite" aria-atomic="true"></p>
      <button id="load-more-btn" class="load-more-btn btn" hidden aria-label="${escapeHtml(lang.i18n.loadMore)}">${escapeHtml(lang.i18n.loadMore)}</button>
    </div>`;
}
