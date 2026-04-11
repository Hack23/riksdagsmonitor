/**
 * Tests for the fix-analysis-references module.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseArticleFilename,
  hasAnalysisReferences,
  hasBrokenAnalysisLinks,
  hasCrossReferences,
  removeAnalysisReferences,
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

  describe('hasBrokenAnalysisLinks()', () => {
    let existsSyncSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      // Default: mock fs.existsSync to return false (files don't exist)
      const fs = require('fs');
      existsSyncSpy = vi.spyOn(fs, 'existsSync');
    });

    afterEach(() => {
      existsSyncSpy.mockRestore();
    });

    it('returns false when no analysis-references section exists', () => {
      expect(hasBrokenAnalysisLinks('<html><body>no section</body></html>')).toBe(false);
    });

    it('returns false when section exists but has no analysis links', () => {
      const html = '<section class="analysis-references"><p>Some text</p></section>';
      expect(hasBrokenAnalysisLinks(html)).toBe(false);
    });

    it('returns true when GitHub blob link points to missing file', () => {
      existsSyncSpy.mockReturnValue(false);
      const html = `<section class="analysis-references">
        <a href="https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-04-11/weekly-review/synthesis-summary.md">link</a>
      </section>`;
      expect(hasBrokenAnalysisLinks(html)).toBe(true);
    });

    it('returns false when GitHub blob link points to existing file', () => {
      existsSyncSpy.mockReturnValue(true);
      const html = `<section class="analysis-references">
        <a href="https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-04-11/weekly-review/synthesis-summary.md">link</a>
      </section>`;
      expect(hasBrokenAnalysisLinks(html)).toBe(false);
    });

    it('returns true when GitHub tree link points to missing directory', () => {
      existsSyncSpy.mockReturnValue(false);
      const html = `<section class="analysis-references">
        <a href="https://github.com/Hack23/riksdagsmonitor/tree/main/analysis/daily/2026-04-11/weekly-review/">dir link</a>
      </section>`;
      expect(hasBrokenAnalysisLinks(html)).toBe(true);
    });

    it('returns false when GitHub tree link points to existing directory', () => {
      existsSyncSpy.mockReturnValue(true);
      const html = `<section class="analysis-references">
        <a href="https://github.com/Hack23/riksdagsmonitor/tree/main/analysis/daily/2026-04-11/weekly-review/">dir link</a>
      </section>`;
      expect(hasBrokenAnalysisLinks(html)).toBe(false);
    });

    it('returns true when relative path link points to missing file', () => {
      existsSyncSpy.mockReturnValue(false);
      const html = `<section class="analysis-references">
        <a href="analysis/daily/2026-04-11/weekly-review/swot-analysis.md">relative link</a>
      </section>`;
      expect(hasBrokenAnalysisLinks(html)).toBe(true);
    });

    it('detects broken links among a mix of valid and invalid', () => {
      existsSyncSpy.mockImplementation((p: string) => {
        return typeof p === 'string' && p.includes('synthesis-summary');
      });
      const html = `<section class="analysis-references">
        <a href="https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-04-11/weekly-review/synthesis-summary.md">exists</a>
        <a href="https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-04-11/weekly-review/nonexistent.md">broken</a>
      </section>`;
      expect(hasBrokenAnalysisLinks(html)).toBe(true);
    });

    it('returns false when section is missing closing tag', () => {
      const html = '<section class="analysis-references"><p>no closing tag';
      expect(hasBrokenAnalysisLinks(html)).toBe(false);
    });
  });

  describe('hasCrossReferences()', () => {
    it('returns true when English cross-reference text exists', () => {
      expect(hasCrossReferences('<div>Cross-Referenced Analysis</div>')).toBe(true);
    });

    it('returns true when Swedish cross-reference text exists', () => {
      expect(hasCrossReferences('<div>Korsrefererad analys</div>')).toBe(true);
    });

    it('returns false when no cross-reference text exists', () => {
      expect(hasCrossReferences('<div>Some other content</div>')).toBe(false);
    });
  });

  describe('removeAnalysisReferences()', () => {
    it('removes section from HTML', () => {
      const html = '<body><main>content</main><section class="analysis-references"><p>refs</p></section>\n<footer>foot</footer></body>';
      const result = removeAnalysisReferences(html);
      expect(result).not.toContain('analysis-references');
      expect(result).toContain('<main>content</main>');
      expect(result).toContain('<footer>foot</footer>');
    });

    it('returns original HTML when no section exists', () => {
      const html = '<body><main>content</main></body>';
      expect(removeAnalysisReferences(html)).toBe(html);
    });

    it('returns original HTML when section has no closing tag', () => {
      const html = '<body><section class="analysis-references"><p>no close';
      expect(removeAnalysisReferences(html)).toBe(html);
    });
  });
});
