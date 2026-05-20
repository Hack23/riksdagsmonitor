/**
 * @module generate-news-indexes/template/client-script-runtime/search
 * @description Search dispatcher + URL-param restorer + event wiring.
 * `filterArticles()` is the central pipeline (type/topic/search filter →
 * sort switch → state mutation → URL update → render). `readURLParams()`
 * seeds initial state from the URL on page load. Event wiring sits at the
 * bottom so all referenced functions are already defined.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Filter dispatcher (incl. sort switch) + URL-param restorer. */
export const SEARCH = `
    function filterArticles() {
      const typeFilter = document.getElementById('filter-type').value;
      const topicFilter = document.getElementById('filter-topic').value;
      const sortFilter = document.getElementById('filter-sort').value;
      const searchQuery = document.getElementById('search-input').value.toLowerCase().trim();

      let filtered = [...articles];

      if (typeFilter !== 'all') {
        filtered = filtered.filter(article => article.type === typeFilter);
      }

      if (topicFilter !== 'all') {
        filtered = filtered.filter(article => article.topics.includes(topicFilter));
      }

      if (searchQuery) {
        filtered = filtered.filter(article => article.title.toLowerCase().includes(searchQuery));
      }

      switch(sortFilter) {
        case 'date-desc':
          filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
          break;
        case 'date-asc':
          filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
          break;
        case 'title':
          filtered.sort((a, b) => a.title.localeCompare(b.title));
          break;
      }

      filteredArticles = filtered;
      if (restoringFromURL) {
        restoringFromURL = false;
      } else {
        visibleCount = PAGE_SIZE;
      }
      updateURL();
      renderPage();
    }

    function readURLParams() {
      const params = new URLSearchParams(window.location.search);

      function safeSetSelect(id, value) {
        const el = document.getElementById(id);
        if (!el) return;
        const opts = Array.from(el.options);
        if (opts.some(o => o.value === value)) {
          el.value = value;
        }
      }

      if (params.has('type')) safeSetSelect('filter-type', params.get('type'));
      if (params.has('topic')) safeSetSelect('filter-topic', params.get('topic'));
      if (params.has('sort')) safeSetSelect('filter-sort', params.get('sort'));
      const searchInput = document.getElementById('search-input');
      if (searchInput && params.has('q')) searchInput.value = params.get('q');
      if (params.has('page')) {
        const page = parseInt(params.get('page'), 10);
        if (!isNaN(page) && page > 1) {
          visibleCount = page * PAGE_SIZE;
          restoringFromURL = true;
        }
      }
    }

    document.getElementById('filter-type').addEventListener('change', filterArticles);
    document.getElementById('filter-topic').addEventListener('change', filterArticles);
    document.getElementById('filter-sort').addEventListener('change', filterArticles);
    document.getElementById('load-more-btn').addEventListener('click', loadMore);
    var __clearBtn = document.getElementById('clear-filters-btn');
    if (__clearBtn) __clearBtn.addEventListener('click', clearAllFilters);

    let searchTimer;
    document.getElementById('search-input').addEventListener('input', function() {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(filterArticles, 300);
    });

    readURLParams();
    filterArticles();
`;
