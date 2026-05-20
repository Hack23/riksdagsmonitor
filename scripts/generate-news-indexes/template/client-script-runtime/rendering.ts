/**
 * @module generate-news-indexes/template/client-script-runtime/rendering
 * @description Card-building and page-rendering string fragment of the
 * inline client runtime. Includes recency bucketing, type-icon mapping,
 * date formatting and `renderPage()`.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Card building + page render + recency helpers. Includes STATE prefix. */
export const RENDERING = `
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
`;
