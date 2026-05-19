/**
 * @module generate-news-indexes/template/filters
 * @description Sticky/collapsible filter bar at the top of the article grid.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { escapeHtml } from '../../html-utils.js';
import type { FilterLabels, LanguageConfig } from '../types.js';

/** Render the collapsible filter bar (`<details>` with selects + search + clear). */
export function renderFilterBar(lang: LanguageConfig, clearFiltersLabel: string): string {
  const f: FilterLabels = lang.filters;
  return `    <details class="filter-bar-wrapper" open>
      <summary class="filter-bar-toggle" aria-label="${escapeHtml(f.type).replace(/:$/, '')}">
        <span aria-hidden="true">⚙️</span>
        <span class="filter-bar-toggle-label">${escapeHtml(f.type).replace(/:$/, '') + ' / ' + escapeHtml(f.topic).replace(/:$/, '')}</span>
        <span class="filter-bar-active-count" id="filter-active-count" aria-live="polite"></span>
      </summary>
      <div class="filter-bar">
      <div class="filter-group">
        <label for="filter-type">${f.type}</label>
        <select id="filter-type">
          <option value="all">${escapeHtml(f.allTypes)}</option>
          <option value="prospective">${escapeHtml(f.prospective)}</option>
          <option value="retrospective">${escapeHtml(f.retrospective)}</option>
          <option value="analysis">${escapeHtml(f.analysis)}</option>
          <option value="breaking">${escapeHtml(f.breaking)}</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="filter-topic">${f.topic}</label>
        <select id="filter-topic">
          <option value="all">${escapeHtml(f.allTopics)}</option>
          <option value="parliament">${escapeHtml(f.parliament)}</option>
          <option value="government">${escapeHtml(f.government)}</option>
          <option value="eu">EU</option>
          <option value="defense">${escapeHtml(f.defense)}</option>
          <option value="environment">${escapeHtml(f.environment)}</option>
          <option value="committees">${escapeHtml(f.committees)}</option>
          <option value="legislation">${escapeHtml(f.legislation)}</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="filter-sort">${f.sort}</label>
        <select id="filter-sort">
          <option value="date-desc">${escapeHtml(f.newest)}</option>
          <option value="date-asc">${escapeHtml(f.oldest)}</option>
          <option value="title">${escapeHtml(f.titleSort)}</option>
        </select>
      </div>

      <div class="filter-group search-group">
        <label for="search-input">${escapeHtml(lang.i18n.search)}</label>
        <input type="search" id="search-input" placeholder="${escapeHtml(lang.i18n.searchPlaceholder)}" aria-label="${escapeHtml(lang.i18n.search)}" autocomplete="off">
      </div>

      <div class="filter-group filter-actions-group">
        <button type="button" id="clear-filters-btn" class="clear-filters-btn" hidden>
          <span aria-hidden="true">✕</span>
          <span class="clear-filters-label">${escapeHtml(clearFiltersLabel)}</span>
        </button>
      </div>
    </div>
    </details>`;
}
