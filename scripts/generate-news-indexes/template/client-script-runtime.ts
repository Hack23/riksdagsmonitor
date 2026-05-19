/**
 * @module generate-news-indexes/template/client-script-runtime
 * @description Pure-literal JavaScript runtime body emitted into the inline
 * `<script>` tag on every news-index page. Declarations are provided by
 * `./client-script-prelude.ts`; this body references them by name.
 *
 * The body is a CommonJS-style single-quoted multi-line string so that
 * client-side template-literal syntax (backticks + `${…}`) survives the
 * server-side template-rendering step verbatim.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Pure-literal client runtime body (see module doc). */
export const CLIENT_RUNTIME_BODY = `
    // HTML-escape helper to prevent XSS when interpolating article fields into innerHTML
    function esc(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
    }

    function safeHref(slug) {
      var s = String(slug);
      // Allow relative HTML paths including subdirectory articles (e.g. "2026-05-04-election-cycle/current-en.html").
      // Block control chars, backslashes, and protocol-relative URLs.
      if (!s || /[\\\\\\x00-\\x1F\\x7F]/.test(s) || s.indexOf('//') === 0) {
        return '#';
      }
      if (!/^[A-Za-z0-9._/-]+\\.html$/.test(s)) {
        return '#';
      }
      return esc(s);
    }

    function i18nShowing(shown, total) {
      var template;
      if (i18nShowingConfig && typeof i18nShowingConfig === 'object') {
        if (shown === 1 && Object.prototype.hasOwnProperty.call(i18nShowingConfig, 'one')) {
          template = i18nShowingConfig.one;
        } else if (Object.prototype.hasOwnProperty.call(i18nShowingConfig, 'other')) {
          template = i18nShowingConfig.other;
        } else {
          template = String(i18nShowingConfig);
        }
      } else {
        template = i18nShowingConfig || '';
      }
      if (typeof template !== 'string') {
        template = String(template);
      }
      return template
        .replace('{shown}', String(shown))
        .replace('{total}', String(total));
    }

    // Pagination state
    const PAGE_SIZE = 20;
    let visibleCount = PAGE_SIZE;
    let restoringFromURL = false;

    let filteredArticles = [...articles];

    function buildArticleCard(article) {
      const flag = LANGUAGE_FLAGS[article.lang] || '🌐';
      const dirAttr = IS_RTL ? ' dir="ltr"' : '';
      const langBadge = \`<span class="language-badge"\${dirAttr} aria-label="\${esc(article.lang)} language"><span aria-hidden="true">\${flag}</span> \${esc(article.lang.toUpperCase())}</span>\`;

      const availableLangs = article.availableLanguages || [article.lang];
      let availableDisplay = '';
      if (availableLangs.length > 1) {
        const availableBadges = availableLangs.map(l => {
          const lf = LANGUAGE_FLAGS[l] || '🌐';
          return \`<span class="lang-badge-sm"\${dirAttr}><span aria-hidden="true">\${lf}</span> \${esc(l.toUpperCase())}</span>\`;
        }).join(' ');
        availableDisplay = \`<p class="available-languages"><strong>\${AVAILABLE_IN_TEXT}:</strong> \${availableBadges}</p>\`;
      }

      const primaryTopic = (article.topics && article.topics.length > 0) ? article.topics[0] : '';
      const recency = computeRecency(article.date);
      const recencyAttr = recency ? \` data-date-recent="\${recency}"\` : '';
      const recencyBadge = recency ? \`<span class="recency-badge" data-recency="\${recency}">\${esc(localizeRecency(recency))}</span>\` : '';

      return \`
      <article class="article-card" data-type="\${esc(article.type)}" data-topic="\${esc(primaryTopic)}"\${recencyAttr}>
        <div class="article-meta">
          <time class="article-date" datetime="\${esc(article.date)}">\${formatDate(article.date)}</time>
          <span class="article-type" data-type="\${esc(article.type)}">\${typeIcon(article.type)} \${localizeType(article.type)}</span>
          \${recencyBadge}
          \${langBadge}
        </div>
        <h2 class="article-title">
          <a href="\${safeHref(article.slug)}">\${esc(article.title)}</a>
        </h2>
        <p class="article-excerpt">\${esc(article.excerpt)}</p>
        \${availableDisplay}
        <div class="article-tags">
          \${article.tags.filter(Boolean).map(tag => \`<span class="tag">\${esc(tag)}</span>\`).join('')}
        </div>
      </article>
    \`;
    }

    // Compute coarse recency bucket so CSS can surface a "today" / "this-week"
    // / "this-month" badge without re-running JS per scroll. Uses the
    // article date in the user's timezone, not UTC, so "today" feels right.
    function computeRecency(dateStr) {
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return null;
        const now = new Date();
        const dayMs = 24 * 60 * 60 * 1000;
        const diff = (now.getTime() - d.getTime()) / dayMs;
        if (diff < 0) return null;             // future-dated, leave plain
        if (diff < 1.0) return 'today';
        if (diff < 7.0) return 'this-week';
        if (diff < 31.0) return 'this-month';
        return null;
      } catch (e) { return null; }
    }

    function localizeRecency(bucket) {
      return RECENCY_LABELS[bucket] || bucket;
    }

    // Emoji icon per article type — keeps the visual language consistent with
    // the rest of the site (root index.html, political-intelligence.html).
    function typeIcon(type) {
      switch (type) {
        case 'prospective': return '<span aria-hidden="true">🔮</span>';
        case 'retrospective': return '<span aria-hidden="true">📊</span>';
        case 'analysis': return '<span aria-hidden="true">🧠</span>';
        case 'breaking': return '<span aria-hidden="true">⚡</span>';
        default: return '<span aria-hidden="true">📰</span>';
      }
    }

    function renderPage() {
      const grid = document.getElementById('articles-grid');
      const noArticles = document.getElementById('no-articles');
      const noResults = document.getElementById('no-results');
      const counter = document.getElementById('article-counter');
      const btn = document.getElementById('load-more-btn');

      if (articles.length === 0) {
        grid.innerHTML = '';
        grid.removeAttribute('aria-busy');
        if (noArticles) noArticles.hidden = false;
        noResults.hidden = true;
        if (counter) counter.textContent = '';
        if (btn) btn.hidden = true;
        updateFilterChrome();
        return;
      }

      if (filteredArticles.length === 0) {
        grid.innerHTML = '';
        grid.removeAttribute('aria-busy');
        noResults.hidden = false;
        if (noArticles) noArticles.hidden = true;
        if (counter) counter.textContent = '';
        if (btn) btn.hidden = true;
        updateFilterChrome();
        return;
      }

      if (noArticles) noArticles.hidden = true;
      noResults.hidden = true;

      const visible = filteredArticles.slice(0, visibleCount);
      grid.innerHTML = visible.map(buildArticleCard).join('');
      grid.removeAttribute('aria-busy');

      const shown = visible.length;
      const total = filteredArticles.length;
      if (counter) counter.textContent = i18nShowing(shown, total);

      if (btn) {
        if (total > visibleCount) {
          btn.hidden = false;
          btn.setAttribute('aria-label', i18nLoadMore);
        } else {
          btn.hidden = true;
        }
      }

      updateFilterChrome();
    }

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
