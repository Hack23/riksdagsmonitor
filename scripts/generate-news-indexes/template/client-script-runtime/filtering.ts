/**
 * @module generate-news-indexes/template/client-script-runtime/filtering
 * @description Filter chrome (updateFilterChrome) + clearAllFilters
 * fragment. The dispatcher `filterArticles` lives in `./search.ts`
 * alongside the URL-param restorer so search + sort wiring sits together.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Filter chrome (button visibility + active-count badge) and reset. */
export const FILTERING = `
    // Show/hide the "Clear filters" button + active-count badge based on
    // whether any filter is set away from its default. Keeps the filter
    // bar honest: empty state shows zero affordances, active state shows
    // exactly how many filters are biting.
    function updateFilterChrome() {
      const typeFilter = document.getElementById('filter-type').value;
      const topicFilter = document.getElementById('filter-topic').value;
      const sortFilter = document.getElementById('filter-sort').value;
      const searchInput = document.getElementById('search-input').value.trim();

      let activeCount = 0;
      if (typeFilter !== 'all') activeCount++;
      if (topicFilter !== 'all') activeCount++;
      if (sortFilter !== 'date-desc') activeCount++;
      if (searchInput) activeCount++;

      const clearBtn = document.getElementById('clear-filters-btn');
      if (clearBtn) {
        clearBtn.hidden = activeCount === 0;
      }
      const countBadge = document.getElementById('filter-active-count');
      if (countBadge) {
        countBadge.textContent = activeCount > 0 ? '(' + activeCount + ')' : '';
        countBadge.hidden = activeCount === 0;
      }
    }

    function clearAllFilters() {
      const typeEl = document.getElementById('filter-type');
      const topicEl = document.getElementById('filter-topic');
      const sortEl = document.getElementById('filter-sort');
      const searchEl = document.getElementById('search-input');
      if (typeEl) typeEl.value = 'all';
      if (topicEl) topicEl.value = 'all';
      if (sortEl) sortEl.value = 'date-desc';
      if (searchEl) searchEl.value = '';
      filterArticles();
      if (searchEl) searchEl.focus();
    }
`;
