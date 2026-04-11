/**
 * Tests for the fix-analysis-references module.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  parseArticleFilename,
  hasAnalysisReferences,
  injectAnalysisReferences,
  FILENAME_SLUG_TO_ARTICLE_TYPE,
} from '../scripts/fix-analysis-references.js';

describe('fix-analysis-references', () => {
  describe('FILENAME_SLUG_TO_ARTICLE_TYPE', () => {
    it('maps all standard filename slugs to article types', () => {
      expect(FILENAME_SLUG_TO_ARTICLE_TYPE['committee-reports']).toBe('committee-reports');
      expect(FILENAME_SLUG_TO_ARTICLE_TYPE['government-propositions']).toBe('propositions');
      expect(FILENAME_SLUG_TO_ARTICLE_TYPE['opposition-motions']).toBe('motions');
      expect(FILENAME_SLUG_TO_ARTICLE_TYPE['interpellation-debates']).toBe('interpellations');
      expect(FILENAME_SLUG_TO_ARTICLE_TYPE['evening-analysis']).toBe('evening-analysis');
      expect(FILENAME_SLUG_TO_ARTICLE_TYPE['week-ahead']).toBe('week-ahead');
      expect(FILENAME_SLUG_TO_ARTICLE_TYPE['month-ahead']).toBe('month-ahead');
      expect(FILENAME_SLUG_TO_ARTICLE_TYPE['weekly-review']).toBe('weekly-review');
      expect(FILENAME_SLUG_TO_ARTICLE_TYPE['monthly-review']).toBe('monthly-review');
      expect(FILENAME_SLUG_TO_ARTICLE_TYPE['deep-inspection']).toBe('deep-inspection');
    });
  });

  describe('parseArticleFilename()', () => {
    it('parses standard article filenames', () => {
      const result = parseArticleFilename('2026-04-10-committee-reports-en.html');
      expect(result).not.toBeNull();
      expect(result!.date).toBe('2026-04-10');
      expect(result!.slug).toBe('committee-reports');
      expect(result!.articleType).toBe('committee-reports');
      expect(result!.lang).toBe('en');
    });

    it('parses government-propositions and maps to propositions type', () => {
      const result = parseArticleFilename('2026-04-09-government-propositions-sv.html');
      expect(result).not.toBeNull();
      expect(result!.articleType).toBe('propositions');
    });

    it('parses opposition-motions and maps to motions type', () => {
      const result = parseArticleFilename('2026-04-10-opposition-motions-en.html');
      expect(result).not.toBeNull();
      expect(result!.articleType).toBe('motions');
    });

    it('parses interpellation-debates and maps to interpellations type', () => {
      const result = parseArticleFilename('2026-04-09-interpellation-debates-ja.html');
      expect(result).not.toBeNull();
      expect(result!.articleType).toBe('interpellations');
    });

    it('parses evening-analysis articles', () => {
      const result = parseArticleFilename('2026-04-10-evening-analysis-ar.html');
      expect(result).not.toBeNull();
      expect(result!.articleType).toBe('evening-analysis');
      expect(result!.lang).toBe('ar');
    });

    it('parses breaking news with dynamic slug', () => {
      const result = parseArticleFilename('2026-04-09-breaking-svenskt-bidrag-till-natos-framskjutna-nr-en.html');
      expect(result).not.toBeNull();
      expect(result!.articleType).toBe('breaking');
    });

    it('returns null for index files', () => {
      expect(parseArticleFilename('index.html')).toBeNull();
      expect(parseArticleFilename('index_sv.html')).toBeNull();
    });

    it('returns null for non-matching filenames', () => {
      expect(parseArticleFilename('not-an-article.html')).toBeNull();
      expect(parseArticleFilename('README.md')).toBeNull();
    });

    it('returns null for unknown language codes', () => {
      expect(parseArticleFilename('2026-04-10-committee-reports-xx.html')).toBeNull();
    });
  });

  describe('hasAnalysisReferences()', () => {
    it('returns true when section exists', () => {
      expect(hasAnalysisReferences('<section class="analysis-references">')).toBe(true);
    });

    it('returns false when section is missing', () => {
      expect(hasAnalysisReferences('<html><body>content</body></html>')).toBe(false);
    });
  });

  describe('injectAnalysisReferences()', () => {
    it('injects before article-footer', () => {
      const html = '<body><main>content</main><footer class="article-footer">foot</footer></body>';
      const refs = '<section class="analysis-references">refs</section>';
      const result = injectAnalysisReferences(html, refs);
      expect(result).not.toBeNull();
      expect(result!).toContain('analysis-references');
      const refsIdx = result!.indexOf('analysis-references');
      const footerIdx = result!.indexOf('article-footer');
      expect(refsIdx).toBeLessThan(footerIdx);
    });

    it('injects before any footer tag', () => {
      const html = '<body><main>content</main><footer>foot</footer></body>';
      const refs = '<section class="analysis-references">refs</section>';
      const result = injectAnalysisReferences(html, refs);
      expect(result).not.toBeNull();
      expect(result!).toContain('analysis-references');
      const refsIdx = result!.indexOf('analysis-references');
      const footerIdx = result!.indexOf('<footer>');
      expect(refsIdx).toBeLessThan(footerIdx);
    });

    it('injects before </body> when no footer', () => {
      const html = '<body><main>content</main></body>';
      const refs = '<section class="analysis-references">refs</section>';
      const result = injectAnalysisReferences(html, refs);
      expect(result).not.toBeNull();
      expect(result!).toContain('analysis-references');
      const refsIdx = result!.indexOf('analysis-references');
      const bodyCloseIdx = result!.indexOf('</body>');
      expect(refsIdx).toBeLessThan(bodyCloseIdx);
    });

    it('returns null for empty references HTML', () => {
      const result = injectAnalysisReferences('<body></body>', '');
      expect(result).toBeNull();
    });
  });
});
