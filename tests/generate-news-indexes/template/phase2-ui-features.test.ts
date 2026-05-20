/**
 * @module tests/generate-news-indexes/template/phase2-ui-features
 * @description Split from `tests/generate-news-indexes.test.ts` (924 lines)
 * per Hack23/riksdagsmonitor#2624 — was the nested `Phase 2 UI features`
 * describe inside `generateAllIndexes`. Extracted so the orchestrator
 * spine fits the ≤ 400-line budget.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NEWS_DIR = path.join(__dirname, '..', '..', '..', 'news');

    describe('Phase 2 UI features', () => {
      let enContent: string;
      let svContent: string;
      let arContent: string;

      beforeAll(async () => {
        // Re-import the module here because the outer `beforeEach` only
        // populates `module` before each `it()`, which fires *after* this
        // nested `beforeAll`. Importing locally and generating once is
        // dramatically faster than regenerating in every test.
        const localModule = await import('../../../scripts/generate-news-indexes.js') as unknown as GenerateNewsIndexesModule;
        localModule.generateAllIndexes();
        enContent = fs.readFileSync(path.join(NEWS_DIR, 'index.html'), 'utf-8');
        svContent = fs.readFileSync(path.join(NEWS_DIR, 'index_sv.html'), 'utf-8');
        arContent = fs.readFileSync(path.join(NEWS_DIR, 'index_ar.html'), 'utf-8');
      });

      it('should include collapsible filter-bar-wrapper details element', () => {
        expect(enContent).toContain('class="filter-bar-wrapper"');
        expect(enContent).toContain('class="filter-bar-toggle"');
        expect(enContent).toContain('class="filter-bar"');
      });

      it('should include clear-filters button with localized English label', () => {
        expect(enContent).toContain('id="clear-filters-btn"');
        expect(enContent).toContain('class="clear-filters-btn"');
        expect(enContent).toContain('Clear filters');
      });

      it('should include localized clear-filters label for Swedish', () => {
        expect(svContent).toContain('Rensa filter');
      });

      it('should include localized clear-filters label for Arabic', () => {
        expect(arContent).toContain('مسح الفلاتر');
      });

      it('should include filter-active-count badge with aria-live', () => {
        expect(enContent).toContain('id="filter-active-count"');
        expect(enContent).toContain('aria-live="polite"');
      });

      it('should include article-card-skeleton elements in articles grid', () => {
        expect(enContent).toContain('class="article-card-skeleton"');
        expect(enContent).toContain('class="skeleton-line skeleton-meta"');
        expect(enContent).toContain('class="skeleton-line skeleton-title"');
        expect(enContent).toContain('class="skeleton-line skeleton-excerpt"');
        expect(enContent).toContain('class="skeleton-line skeleton-tags"');
      });

      it('should set aria-busy on articles grid initially for skeleton state', () => {
        expect(enContent).toContain('id="articles-grid"');
        expect(enContent).toContain('aria-busy="true"');
      });

      it('should include skeleton cards with aria-hidden for accessibility', () => {
        // Skeletons are decorative — must be hidden from AT.
        // Use a regex that tolerates attribute reordering / whitespace so the
        // assertion is not coupled to the generator's output formatting.
        const skeletonWithAriaHidden = /<div\b[^>]*\bclass="[^"]*\barticle-card-skeleton\b[^"]*"[^>]*\baria-hidden="true"[^>]*>|<div\b[^>]*\baria-hidden="true"[^>]*\bclass="[^"]*\barticle-card-skeleton\b[^"]*"[^>]*>/;
        expect(enContent).toMatch(skeletonWithAriaHidden);
      });

      it('should include computeRecency function in client script', () => {
        expect(enContent).toContain('function computeRecency(');
        expect(enContent).toContain("return 'today'");
        expect(enContent).toContain("return 'this-week'");
        expect(enContent).toContain("return 'this-month'");
      });

      it('should include RECENCY_LABELS JSON blob in client script', () => {
        expect(enContent).toContain('const RECENCY_LABELS =');
        expect(enContent).toContain('"today"');
        expect(enContent).toContain('"this-week"');
        expect(enContent).toContain('"this-month"');
      });

      it('should localise RECENCY_LABELS for Swedish', () => {
        expect(svContent).toContain('Idag');
        expect(svContent).toContain('Denna vecka');
        expect(svContent).toContain('Denna månad');
      });

      it('should include localizeRecency function in client script', () => {
        expect(enContent).toContain('function localizeRecency(');
      });

      it('should include recency-badge in article card builder', () => {
        expect(enContent).toContain('class="recency-badge"');
        expect(enContent).toContain('data-recency=');
      });

      it('should include data-date-recent attribute in article card builder', () => {
        expect(enContent).toContain('data-date-recent=');
      });

      it('should include updateFilterChrome function in client script', () => {
        expect(enContent).toContain('function updateFilterChrome(');
        expect(enContent).toContain("clearBtn.hidden = activeCount === 0");
      });

      it('should include clearAllFilters function in client script', () => {
        expect(enContent).toContain('function clearAllFilters(');
      });

      it('should wire clear-filters button to clearAllFilters via onclick', () => {
        // Button calls clearAllFilters when clicked
        expect(enContent).toContain('clearAllFilters()');
      });

      it('should apply dir="ltr" to language badges in RTL layout (Arabic)', () => {
        // The Arabic page must (a) set the runtime flag `IS_RTL = true`, and
        // (b) embed the `buildArticleCard` wiring that consumes that flag
        // to emit `dir="ltr"` on the dynamically-injected language badges
        // (so Latin-script flags + locale codes render LTR even on an RTL
        // page). Asserting both validates the actual rendered behavior, not
        // just the bare flag value.
        expect(arContent).toContain('const IS_RTL = true');
        // The wiring that produces `dir="ltr"` when IS_RTL is true.
        expect(arContent).toContain(`const dirAttr = IS_RTL ? ' dir="ltr"' : '';`);
        // The language-badge template that consumes `dirAttr`.
        expect(arContent).toMatch(/class="language-badge"\$\{dirAttr\}/);
      });

      it('should set IS_RTL = false for non-RTL languages (English)', () => {
        // Inverse of the RTL assertion: English pages must opt out of the
        // `dir="ltr"` override (the wiring is still present, but the
        // ternary resolves to '' so badges get no `dir` attribute).
        expect(enContent).toContain('const IS_RTL = false');
      });

      it('should include filter-bar with all four filter groups', () => {
        // type, topic, sort, search — four filter groups
        expect(enContent).toContain('id="filter-type"');
        expect(enContent).toContain('id="filter-topic"');
        expect(enContent).toContain('id="filter-sort"');
        expect(enContent).toContain('id="search-input"');
      });
});
