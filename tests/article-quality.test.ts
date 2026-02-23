/**
 * Unit Tests for Article Quality Validation (ArticleQualityScore)
 *
 * Tests the validateArticleQuality function from generate-news-enhanced.ts:
 * - Word count detection and scoring (0–50 pts, proportional up to 1000 words)
 * - Unknown (Unknown) author counting (reported, does not affect score)
 * - Untranslated data-translate span detection (non-Swedish only, 0–20 pts)
 * - Analytical section (h2 header) counting and scoring (0–30 pts)
 * - Composite quality score calculation
 * - Pass/fail against default threshold (40)
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import type { ArticleQualityScore } from '../scripts/types/article.js';
import type { MCPClientConfig } from '../scripts/types/mcp.js';

/** Partial shape of the generate-news-enhanced module we need for these tests */
interface GenerateNewsEnhancedModule {
  readonly validateArticleQuality: (
    html: string,
    lang: string,
    articleType: string,
    filename: string
  ) => ArticleQualityScore;
}

// ---------------------------------------------------------------------------
// Mock MCPClient to prevent real HTTP calls during module import
// ---------------------------------------------------------------------------

const { MockMCPClient, mockClientInstance } = vi.hoisted(() => {
  const mockClientInstance = {
    fetchCalendarEvents: vi.fn().mockResolvedValue([]),
    fetchCommitteeReports: vi.fn().mockResolvedValue([]),
    fetchPropositions: vi.fn().mockResolvedValue([]),
    fetchMotions: vi.fn().mockResolvedValue([]),
    fetchVotingRecords: vi.fn().mockResolvedValue([]),
    searchDocuments: vi.fn().mockResolvedValue([]),
    fetchWrittenQuestions: vi.fn().mockResolvedValue([]),
    fetchInterpellations: vi.fn().mockResolvedValue([]),
    enrichDocumentsWithContent: vi.fn().mockResolvedValue([]),
    request: vi.fn().mockResolvedValue({ last_sync: '2026-02-23T00:00:00Z' }),
    timeout: 30000,
    baseURL: 'https://riksdag-regering-ai.onrender.com/mcp'
  };
  function MockMCPClient(_config?: MCPClientConfig) {
    return mockClientInstance;
  }
  return { MockMCPClient, mockClientInstance };
});

vi.mock('../scripts/mcp-client.js', () => ({
  MCPClient: MockMCPClient,
  getDefaultClient: () => mockClientInstance
}));

// ---------------------------------------------------------------------------
// Module import (dynamic, to handle top-level side-effects safely)
// ---------------------------------------------------------------------------

let mod: GenerateNewsEnhancedModule | null = null;

beforeAll(async () => {
  vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined as unknown as string);
  vi.spyOn(fs, 'existsSync').mockReturnValue(true);
  vi.spyOn(fs, 'readdirSync').mockReturnValue([]);
  try {
    mod = await import('../scripts/generate-news-enhanced.js') as unknown as GenerateNewsEnhancedModule;
  } catch (e) {
    console.error('Module import failed:', e);
    mod = null;
  }
});

afterAll(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers to build test HTML snippets
// ---------------------------------------------------------------------------

function buildHtml({
  words = 600,
  unknownCount = 0,
  listItemCount = 0,
  untranslatedSpans = 0,
  h2Count = 3
}: {
  words?: number;
  unknownCount?: number;
  listItemCount?: number;
  untranslatedSpans?: number;
  h2Count?: number;
}): string {
  const wordText = Array.from({ length: words }, (_, i) => `word${i}`).join(' ');
  const unknownEntries = Array.from({ length: unknownCount }, () => '<li>Filed by: Unknown (Unknown)</li>').join('');
  const normalEntries = Array.from({ length: Math.max(0, listItemCount - unknownCount) }, (_, i) => `<li>Author ${i}</li>`).join('');
  const translationSpans = Array.from({ length: untranslatedSpans }, () => '<span data-translate="true">text</span>').join('');
  const h2Tags = Array.from({ length: h2Count }, (_, i) => `<h2>Section ${i + 1}</h2>`).join('');
  return `<html><body><p>${wordText}</p>${unknownEntries}${normalEntries}${translationSpans}${h2Tags}</body></html>`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Article Quality Validation', () => {
  it('should be exported from the module', () => {
    expect(mod).not.toBeNull();
    expect(typeof mod?.validateArticleQuality).toBe('function');
  });

  describe('Word count scoring (0–50 pts, proportional up to 1000 words)', () => {
    it('scores ~30 pts word score for a 600-word article (score 50: 30+0+20)', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, h2Count: 0, unknownCount: 0, untranslatedSpans: 0, listItemCount: 0 });
      const result = mod.validateArticleQuality(html, 'en', 'test', 'test.html');
      // wordScore = round(600/1000 * 50) = 30; sectionScore = 0; translationScore = 20
      expect(result.wordCount).toBeGreaterThanOrEqual(600);
      expect(result.score).toBe(50);
      expect(result.passed).toBe(true);
    });

    it('scores partial word pts for a 350-word article (fails threshold)', () => {
      if (!mod) return;
      const html = buildHtml({ words: 350, h2Count: 0, unknownCount: 0, untranslatedSpans: 0, listItemCount: 0 });
      const result = mod.validateArticleQuality(html, 'en', 'test', 'test.html');
      expect(result.wordCount).toBeGreaterThanOrEqual(350);
      expect(result.wordCount).toBeLessThan(500);
      // wordScore = round(350/1000 * 50) = 18; sectionScore = 0; translationScore = 20 → 38
      expect(result.score).toBeLessThan(40);
      expect(result.passed).toBe(false);
    });

    it('compensates very low word count with strong sections (short article still passes)', () => {
      if (!mod) return;
      const html = buildHtml({ words: 50, h2Count: 3, unknownCount: 0, untranslatedSpans: 0, listItemCount: 0 });
      const result = mod.validateArticleQuality(html, 'en', 'test', 'test.html');
      expect(result.wordCount).toBeLessThan(100);
      // wordScore ≈ 3; sectionScore = 30; translationScore = 20 → ≥ 50 → passes
      expect(result.score).toBeGreaterThanOrEqual(50);
      expect(result.passed).toBe(true);
    });
  });

  describe('Unknown author detection', () => {
    it('returns unknownAuthors = 0 when no Unknown (Unknown) entries', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, unknownCount: 0, listItemCount: 5, h2Count: 3, untranslatedSpans: 0 });
      const result = mod.validateArticleQuality(html, 'en', 'test', 'test.html');
      expect(result.unknownAuthors).toBe(0);
    });

    it('counts Unknown (Unknown) occurrences correctly', () => {
      if (!mod) return;
      const html = '<li>Filed by: Unknown (Unknown)</li><li>Filed by: Unknown (Unknown)</li><li>Filed by: Real Author (M)</li>';
      const result = mod.validateArticleQuality(html, 'en', 'test', 'test.html');
      expect(result.unknownAuthors).toBe(2);
    });

    it('reports unknown authors in the result (does not affect score calculation)', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, unknownCount: 8, listItemCount: 10, h2Count: 3, untranslatedSpans: 0 });
      const result = mod.validateArticleQuality(html, 'en', 'test', 'test.html');
      expect(result.unknownAuthors).toBe(8);
      // unknownAuthors are tracked but do not deduct from score in this model
      expect(result.score).toBeGreaterThan(0);
    });
  });

  describe('Untranslated span detection', () => {
    it('scores full translation pts (20) for Swedish articles regardless of data-translate spans', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, untranslatedSpans: 20, h2Count: 3, unknownCount: 0, listItemCount: 0 });
      const svResult = mod.validateArticleQuality(html, 'sv', 'test', 'test-sv.html');
      const enResult = mod.validateArticleQuality(html, 'en', 'test', 'test-en.html');
      // sv is exempt from translation deduction — must score higher than en
      expect(svResult.score).toBeGreaterThan(enResult.score);
      expect(svResult.passed).toBe(true);
    });

    it('deducts points for untranslated spans in non-Swedish (> 10 spans → translationScore = 0)', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, untranslatedSpans: 21, h2Count: 3, unknownCount: 0, listItemCount: 0 });
      const result = mod.validateArticleQuality(html, 'en', 'test', 'test.html');
      expect(result.untranslatedSpans).toBe(21);
      // translationDeduction = min(20, 21*2) = 20 → translationScore = 0
      expect(result.score).toBeGreaterThan(0); // still passes thanks to words + sections
    });

    it('scores full 20 translation pts when there are 0 untranslated spans in non-Swedish', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, untranslatedSpans: 0, h2Count: 3, unknownCount: 0, listItemCount: 0 });
      const result = mod.validateArticleQuality(html, 'de', 'test', 'test.html');
      expect(result.untranslatedSpans).toBe(0);
      expect(result.passed).toBe(true);
    });
  });

  describe('Analytical section detection', () => {
    it('scores full 30 section pts when there are >= 3 h2 sections', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, h2Count: 3, unknownCount: 0, untranslatedSpans: 0, listItemCount: 0 });
      const result = mod.validateArticleQuality(html, 'en', 'test', 'test.html');
      expect(result.analyticalSections).toBe(3);
      // wordScore ≈ 30 + sectionScore = 30 + translationScore = 20 → ≥ 70
      expect(result.score).toBeGreaterThanOrEqual(70);
    });

    it('scores partial section pts and lower total for 1 h2 section', () => {
      if (!mod) return;
      const html1 = buildHtml({ words: 600, h2Count: 1, unknownCount: 0, untranslatedSpans: 0, listItemCount: 0 });
      const html3 = buildHtml({ words: 600, h2Count: 3, unknownCount: 0, untranslatedSpans: 0, listItemCount: 0 });
      const result1 = mod.validateArticleQuality(html1, 'en', 'test', 'test.html');
      const result3 = mod.validateArticleQuality(html3, 'en', 'test', 'test.html');
      expect(result1.analyticalSections).toBe(1);
      // sectionScore(1) = round(1/3 * 30) = 10 < 30
      expect(result1.score).toBeLessThan(result3.score);
    });

    it('scores 0 section pts and lower total when no h2 sections', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, h2Count: 0, unknownCount: 0, untranslatedSpans: 0, listItemCount: 0 });
      const result = mod.validateArticleQuality(html, 'en', 'test', 'test.html');
      expect(result.analyticalSections).toBe(0);
      // wordScore = 30; sectionScore = 0; translationScore = 20 → 50
      expect(result.score).toBe(50);
    });
  });

  describe('Quality score and pass/fail', () => {
    it('returns passed=true for a high-quality article', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, h2Count: 3, unknownCount: 0, untranslatedSpans: 0, listItemCount: 5 });
      const result = mod.validateArticleQuality(html, 'en', 'test', 'test.html');
      expect(result.score).toBeGreaterThan(40);
      expect(result.passed).toBe(true);
    });

    it('returns passed=false for a low-quality article (score < 40)', () => {
      if (!mod) return;
      // Very short, all unknowns, 21 untranslated spans, no sections
      const html = buildHtml({ words: 10, h2Count: 0, unknownCount: 5, listItemCount: 5, untranslatedSpans: 21 });
      const result = mod.validateArticleQuality(html, 'en', 'test', 'test.html');
      expect(result.score).toBeLessThan(40);
      expect(result.passed).toBe(false);
    });

    it('achieves maximum score (100) for a perfect article (≥1000 words, ≥3 h2, 0 spans)', () => {
      if (!mod) return;
      const html = buildHtml({ words: 1200, h2Count: 5, unknownCount: 0, untranslatedSpans: 0, listItemCount: 0 });
      const result = mod.validateArticleQuality(html, 'en', 'test', 'test.html');
      // wordScore = 50 + sectionScore = 30 + translationScore = 20 = 100
      expect(result.score).toBe(100);
      expect(result.passed).toBe(true);
    });

    it('returns scores within 0–100 range for any input', () => {
      if (!mod) return;
      const html = buildHtml({ words: 800, h2Count: 2, unknownCount: 0, untranslatedSpans: 3 });
      const result = mod.validateArticleQuality(html, 'de', 'committee-reports', 'test-de.html');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });
});
