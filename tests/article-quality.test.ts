/**
 * Unit Tests for Article Quality Validation
 *
 * Tests the validateArticleQuality function from generate-news-enhanced.ts:
 * - Word count detection and scoring
 * - Unknown (Unknown) author counting and scoring
 * - Untranslated data-translate span detection (non-Swedish only)
 * - Analytical section (h2 header) counting and scoring
 * - Composite quality score calculation
 * - Pass/fail against default threshold (40)
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import type { MCPClientConfig } from '../scripts/types/mcp.js';

/** Shape of the quality report returned by validateArticleQuality */
interface ArticleQualityReport {
  readonly articleId: string;
  readonly wordCount: number;
  readonly unknownAuthorCount: number;
  readonly totalEntryCount: number;
  readonly untranslatedSpanCount: number;
  readonly analyticalSectionCount: number;
  readonly score: number;
  readonly passed: boolean;
  readonly issues: string[];
}

/** Partial shape of the generate-news-enhanced module we need for these tests */
interface GenerateNewsEnhancedModule {
  readonly validateArticleQuality: (html: string, lang: string, articleType: string) => ArticleQualityReport;
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

  describe('Word count scoring', () => {
    it('scores 25 pts for articles with >= 500 words', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, h2Count: 0, unknownCount: 0, untranslatedSpans: 0, listItemCount: 0 });
      const report = mod.validateArticleQuality(html, 'en', 'test');
      // wordScore=25, unknownScore=25 (no entries), untranslatedScore=0 (no spans but 0<=0), analyticalScore=0
      // unknownRatio: totalEntryCount=0 → unknownScore=25
      // untranslated: 0 spans → 25pts
      // analytical: 0 h2 → 0pts → issue
      expect(report.wordCount).toBeGreaterThanOrEqual(500);
      // word score contributes 25
      // total = 25 (word) + 25 (unknown) + 25 (untranslated) + 0 (analytical) = 75
      expect(report.score).toBe(75);
    });

    it('scores 15 pts for articles with 300-499 words', () => {
      if (!mod) return;
      const html = buildHtml({ words: 350, h2Count: 0, unknownCount: 0, untranslatedSpans: 0, listItemCount: 0 });
      const report = mod.validateArticleQuality(html, 'en', 'test');
      expect(report.wordCount).toBeGreaterThanOrEqual(300);
      expect(report.wordCount).toBeLessThan(500);
      // 15 (word) + 25 (unknown) + 25 (untranslated) + 0 (analytical) = 65
      expect(report.score).toBe(65);
    });

    it('scores 0 pts and adds REJECT issue for articles with < 300 words', () => {
      if (!mod) return;
      const html = buildHtml({ words: 50, h2Count: 3, unknownCount: 0, untranslatedSpans: 0, listItemCount: 0 });
      const report = mod.validateArticleQuality(html, 'en', 'test');
      expect(report.wordCount).toBeLessThan(300);
      expect(report.issues.some(i => i.includes('REJECT'))).toBe(true);
      // 0 (word) + 25 (unknown) + 25 (untranslated) + 25 (analytical) = 75
      expect(report.score).toBe(75);
    });
  });

  describe('Unknown author detection', () => {
    it('scores 25 pts when there are no Unknown (Unknown) entries', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, unknownCount: 0, listItemCount: 5, h2Count: 3, untranslatedSpans: 0 });
      const report = mod.validateArticleQuality(html, 'en', 'test');
      expect(report.unknownAuthorCount).toBe(0);
      expect(report.score).toBe(100);
    });

    it('adds a warning issue when > 50% are Unknown (Unknown)', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, unknownCount: 8, listItemCount: 10, h2Count: 3, untranslatedSpans: 0 });
      const report = mod.validateArticleQuality(html, 'en', 'test');
      expect(report.unknownAuthorCount).toBe(8);
      expect(report.totalEntryCount).toBe(10);
      expect(report.issues.some(i => i.includes('Unknown authors'))).toBe(true);
    });

    it('counts Unknown (Unknown) occurrences correctly', () => {
      if (!mod) return;
      const html = '<li>Filed by: Unknown (Unknown)</li><li>Filed by: Unknown (Unknown)</li><li>Filed by: Real Author (M)</li>';
      const report = mod.validateArticleQuality(html, 'en', 'test');
      expect(report.unknownAuthorCount).toBe(2);
      expect(report.totalEntryCount).toBe(3);
    });
  });

  describe('Untranslated span detection', () => {
    it('scores 25 pts for Swedish articles regardless of data-translate spans', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, untranslatedSpans: 20, h2Count: 3, unknownCount: 0, listItemCount: 0 });
      const report = mod.validateArticleQuality(html, 'sv', 'test');
      expect(report.untranslatedSpanCount).toBe(0); // sv gets 0 count
      // No untranslated penalty for Swedish
      expect(report.score).toBe(100);
    });

    it('scores 0 pts and warns when > 10 untranslated spans in non-Swedish', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, untranslatedSpans: 21, h2Count: 3, unknownCount: 0, listItemCount: 0 });
      const report = mod.validateArticleQuality(html, 'en', 'test');
      expect(report.untranslatedSpanCount).toBe(21);
      expect(report.issues.some(i => i.includes('Untranslated spans') && i.includes('10'))).toBe(true);
      // 25 (word) + 25 (unknown) + 0 (untranslated) + 25 (analytical) = 75
      expect(report.score).toBe(75);
    });

    it('scores 25 pts when there are 0 untranslated spans in non-Swedish', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, untranslatedSpans: 0, h2Count: 3, unknownCount: 0, listItemCount: 0 });
      const report = mod.validateArticleQuality(html, 'de', 'test');
      expect(report.untranslatedSpanCount).toBe(0);
      expect(report.score).toBe(100);
    });
  });

  describe('Analytical section detection', () => {
    it('scores 25 pts when there are >= 3 h2 sections', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, h2Count: 3, unknownCount: 0, untranslatedSpans: 0, listItemCount: 0 });
      const report = mod.validateArticleQuality(html, 'en', 'test');
      expect(report.analyticalSectionCount).toBe(3);
      expect(report.score).toBe(100);
    });

    it('scores partial pts and warns when there is 1 h2 section', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, h2Count: 1, unknownCount: 0, untranslatedSpans: 0, listItemCount: 0 });
      const report = mod.validateArticleQuality(html, 'en', 'test');
      expect(report.analyticalSectionCount).toBe(1);
      expect(report.issues.some(i => i.includes('Analytical sections'))).toBe(true);
      // analyticalScore = round(25 * 1/3) = 8
      expect(report.score).toBe(25 + 25 + 25 + 8);
    });

    it('scores 0 pts and warns when there are no h2 sections', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, h2Count: 0, unknownCount: 0, untranslatedSpans: 0, listItemCount: 0 });
      const report = mod.validateArticleQuality(html, 'en', 'test');
      expect(report.analyticalSectionCount).toBe(0);
      expect(report.issues.some(i => i.includes('Analytical sections') && i.includes('0/3'))).toBe(true);
      expect(report.score).toBe(75);
    });
  });

  describe('Quality score and pass/fail', () => {
    it('returns passed=true for a perfect article (score=100)', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, h2Count: 3, unknownCount: 0, untranslatedSpans: 0, listItemCount: 5 });
      const report = mod.validateArticleQuality(html, 'en', 'test');
      expect(report.score).toBe(100);
      expect(report.passed).toBe(true);
    });

    it('returns passed=false for a low-quality article (score < 40)', () => {
      if (!mod) return;
      // Very short, all unknowns, 21 untranslated spans, no sections
      const html = buildHtml({ words: 10, h2Count: 0, unknownCount: 5, listItemCount: 5, untranslatedSpans: 21 });
      const report = mod.validateArticleQuality(html, 'en', 'test');
      expect(report.score).toBeLessThan(40);
      expect(report.passed).toBe(false);
    });

    it('sets articleId as "<articleType>-<lang>"', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, h2Count: 3 });
      const report = mod.validateArticleQuality(html, 'fr', 'motions');
      expect(report.articleId).toBe('motions-fr');
    });

    it('returns no issues for a high-quality article', () => {
      if (!mod) return;
      const html = buildHtml({ words: 600, h2Count: 3, unknownCount: 0, untranslatedSpans: 0, listItemCount: 5 });
      const report = mod.validateArticleQuality(html, 'en', 'test');
      expect(report.issues).toHaveLength(0);
    });
  });
});
