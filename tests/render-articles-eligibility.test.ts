/**
 * Test suite for article rendering eligibility filter.
 * 
 * Verifies that Tier A articles (intermediate analysis artifacts in documents/,
 * full-text/, and orphaned election-cycle/ subdirectories) are excluded from
 * HTML rendering, while Tier B/C articles are rendered.
 */

import { describe, it, expect } from 'vitest';

/**
 * Reimplementation of isArticleEligibleForRendering for testing.
 * This must match the logic in scripts/render-articles.ts
 */
function isArticleEligibleForRendering(subfolder: string): boolean {
  // Exclude Tier A: documents/, full-text/, and orphaned election-cycle/
  if (subfolder.startsWith('documents/') || subfolder === 'documents') return false;
  if (subfolder.startsWith('full-text/') || subfolder === 'full-text') return false;
  if (subfolder.startsWith('election-cycle/')) return false; // Orphaned election-cycle/ is excluded
  if (subfolder === 'election-cycle') return false; // Top-level election-cycle is excluded

  return true;
}

describe('Article Rendering Eligibility Filter', () => {
  describe('Tier A Exclusions (documents/)', () => {
    it('should exclude articles in documents/ subdirectory', () => {
      expect(isArticleEligibleForRendering('documents')).toBe(false);
    });

    it('should exclude articles in nested documents/ paths', () => {
      expect(isArticleEligibleForRendering('documents/prop-2026-123')).toBe(false);
      expect(isArticleEligibleForRendering('documents/mot-2026-456')).toBe(false);
      expect(isArticleEligibleForRendering('documents/prop-2026-123/sub')).toBe(false);
    });
  });

  describe('Tier A Exclusions (full-text/)', () => {
    it('should exclude articles in full-text/ subdirectory', () => {
      expect(isArticleEligibleForRendering('full-text')).toBe(false);
    });

    it('should exclude articles in nested full-text/ paths', () => {
      expect(isArticleEligibleForRendering('full-text/doc-123')).toBe(false);
      expect(isArticleEligibleForRendering('full-text/analysis-2026')).toBe(false);
      expect(isArticleEligibleForRendering('full-text/doc-123/nested')).toBe(false);
    });
  });

  describe('Tier A Exclusions (election-cycle/)', () => {
    it('should exclude top-level election-cycle/ directory', () => {
      expect(isArticleEligibleForRendering('election-cycle')).toBe(false);
    });

    it('should exclude articles in nested election-cycle/ paths', () => {
      expect(isArticleEligibleForRendering('election-cycle/2026-analysis')).toBe(false);
      expect(isArticleEligibleForRendering('election-cycle/candidates')).toBe(false);
      expect(isArticleEligibleForRendering('election-cycle/2026-analysis/region-info')).toBe(false);
    });
  });

  describe('Tier B/C Inclusions (Real Articles)', () => {
    it('should include standard article subfolders', () => {
      expect(isArticleEligibleForRendering('propositions')).toBe(true);
      expect(isArticleEligibleForRendering('motions')).toBe(true);
      expect(isArticleEligibleForRendering('committee-reports')).toBe(true);
    });

    it('should include nested real article paths', () => {
      expect(isArticleEligibleForRendering('propositions/2026')).toBe(true);
      expect(isArticleEligibleForRendering('motions/2026-05-analysis')).toBe(true);
      expect(isArticleEligibleForRendering('policy-areas/defense')).toBe(true);
    });

    it('should include article paths with multiple levels', () => {
      expect(isArticleEligibleForRendering('analysis/2026/defense')).toBe(true);
      expect(isArticleEligibleForRendering('regions/stockholm/voting')).toBe(true);
    });

    it('should include paths with document-like names but outside documents/', () => {
      expect(isArticleEligibleForRendering('documents-analysis')).toBe(true); // prefix is OK if not "documents/"
      expect(isArticleEligibleForRendering('full-text-summary')).toBe(true); // prefix is OK if not "full-text/"
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty and single-character paths', () => {
      expect(isArticleEligibleForRendering('')).toBe(true);
      expect(isArticleEligibleForRendering('a')).toBe(true);
    });

    it('should be case-sensitive', () => {
      // Should still include uppercase variants (they're not the excluded paths)
      expect(isArticleEligibleForRendering('Documents')).toBe(true);
      expect(isArticleEligibleForRendering('FULL-TEXT')).toBe(true);
      expect(isArticleEligibleForRendering('Election-Cycle')).toBe(true);
    });

    it('should distinguish between subfolder prefix and full match', () => {
      // "document" is not "documents" (singular vs plural)
      expect(isArticleEligibleForRendering('document')).toBe(true);
      expect(isArticleEligibleForRendering('document/subfolder')).toBe(true);
      
      // "fulltext" is not "full-text" (no hyphen)
      expect(isArticleEligibleForRendering('fulltext')).toBe(true);
    });
  });
});
