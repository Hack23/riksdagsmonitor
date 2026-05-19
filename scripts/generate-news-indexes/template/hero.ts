/**
 * @module generate-news-indexes/template/hero
 * @description Page heading (`<header class="news-page-heading">`) with the
 * H1, kicker, subtitle, and a `<dl>` of hero metrics.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import { LANGUAGES } from '../constants.js';
import type { LanguageConfig } from '../types.js';

/** Render the news-index page heading. */
export function renderHero(
  lang: LanguageConfig,
  metricLabels: Readonly<Record<'articles' | 'languages' | 'latest' | 'pipeline', string>>,
  articleCount: number,
  latestDate: string,
): string {
  return `    <header class="news-page-heading">
      <p class="news-kicker">${escapeHtml(metricLabels.pipeline)}</p>
      <h1>${escapeHtml(lang.title)}</h1>
      <p class="news-page-subtitle">${escapeHtml(lang.subtitle)}</p>
      <dl class="news-hero-metrics" aria-label="${escapeHtml(lang.title)} statistics">
        <div>
          <dt>${escapeHtml(metricLabels.articles)}</dt>
          <dd>${articleCount.toLocaleString(lang.code)}</dd>
        </div>
        <div>
          <dt>${escapeHtml(metricLabels.languages)}</dt>
          <dd>${Object.keys(LANGUAGES).length}</dd>
        </div>
        <div>
          <dt>${escapeHtml(metricLabels.latest)}</dt>
          <dd><time datetime="${latestDate}">${latestDate}</time></dd>
        </div>
      </dl>
    </header>`;
}
