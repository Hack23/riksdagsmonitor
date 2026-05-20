/**
 * @module generate-news-indexes/template/client-script-runtime/sorting
 * @description Pagination + URL sync fragment. `loadMore()` advances the
 * `visibleCount` cursor (PAGE_SIZE = 20) and `updateURL()` mirrors filter
 * + sort + search state into `?type/topic/sort/q/page` query params via
 * `history.replaceState`. `localizeType` / `formatDate` live here because
 * they are pure formatting helpers consumed by both the card renderer
 * and the URL writer.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Pagination cursor + URL state writer + per-row label helpers. */
export const SORTING = `
    function loadMore() {
      const prevCount = visibleCount;
      visibleCount += PAGE_SIZE;
      updateURL();
      renderPage();
      const cards = document.querySelectorAll('.article-card');
      if (cards[prevCount]) {
        const link = cards[prevCount].querySelector('a');
        if (link) link.focus();
      }
    }

    function updateURL() {
      const typeFilter = document.getElementById('filter-type').value;
      const topicFilter = document.getElementById('filter-topic').value;
      const sortFilter = document.getElementById('filter-sort').value;
      const searchInput = document.getElementById('search-input').value.trim();
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (topicFilter !== 'all') params.set('topic', topicFilter);
      if (sortFilter !== 'date-desc') params.set('sort', sortFilter);
      if (searchInput) params.set('q', searchInput);
      const effectiveVisible = Math.min(visibleCount, filteredArticles.length);
      const page = Math.ceil(effectiveVisible / PAGE_SIZE);
      if (page > 1 && filteredArticles.length > PAGE_SIZE) {
        params.set('page', String(page));
      }
      const newURL = params.toString() ? '?' + params.toString() : window.location.pathname;
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', newURL);
      }
    }

    function localizeType(type) {
      return typeLabels[type] || type;
    }

    function formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString(LOCALE_CODE, { year: 'numeric', month: 'long', day: 'numeric' });
    }
`;
