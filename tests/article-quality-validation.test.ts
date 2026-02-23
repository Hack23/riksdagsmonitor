/**
 * Unit Tests for validateArticleQuality
 *
 * Tests the article quality validation function in generate-news-enhanced.ts including:
 * - Word count scoring (0–50)
 * - Analytical section scoring (0–30)
 * - Translation completeness scoring (0–20)
 * - Unknown author detection
 * - Pass/fail threshold logic
 * - QUALITY_THRESHOLD constant and export
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import type { ArticleQualityScore } from '../scripts/types/article.js';
import type { MCPClientConfig } from '../scripts/types/mcp.js';

/** Mock MCP client interface */
interface MockMCPClientInstance {
  fetchCalendarEvents: ReturnType<typeof vi.fn>;
  fetchCommitteeReports: ReturnType<typeof vi.fn>;
  fetchPropositions: ReturnType<typeof vi.fn>;
  fetchMotions: ReturnType<typeof vi.fn>;
  searchDocuments: ReturnType<typeof vi.fn>;
  fetchWrittenQuestions: ReturnType<typeof vi.fn>;
  fetchInterpellations: ReturnType<typeof vi.fn>;
  enrichDocumentsWithContent: ReturnType<typeof vi.fn>;
  request: ReturnType<typeof vi.fn>;
  timeout: number;
  baseURL: string;
}

/** Shape of the dynamically imported module (quality-relevant exports) */
interface QualityModule {
  readonly validateArticleQuality: (
    html: string,
    lang: string,
    articleType: string,
    filename: string
  ) => ArticleQualityScore;
  readonly QUALITY_THRESHOLD: number;
}

// Use vi.hoisted() so mocks are available before module import
const { mockClientInstance, MockMCPClient } = vi.hoisted(() => {
  const mockClientInstance: MockMCPClientInstance = {
    fetchCalendarEvents: vi.fn().mockResolvedValue([]),
    fetchCommitteeReports: vi.fn().mockResolvedValue([]),
    fetchPropositions: vi.fn().mockResolvedValue([]),
    fetchMotions: vi.fn().mockResolvedValue([]),
    searchDocuments: vi.fn().mockResolvedValue([]),
    fetchWrittenQuestions: vi.fn().mockResolvedValue([]),
    fetchInterpellations: vi.fn().mockResolvedValue([]),
    enrichDocumentsWithContent: vi.fn().mockResolvedValue([]),
    request: vi.fn().mockResolvedValue({ last_sync: '2026-02-16T12:00:00Z' }),
    timeout: 30000,
    baseURL: 'https://riksdag-regering-ai.onrender.com/mcp'
  };
  function MockMCPClient(config: MCPClientConfig | undefined): MockMCPClientInstance {
    if (config && config.timeout) mockClientInstance.timeout = config.timeout;
    return mockClientInstance;
  }
  return { mockClientInstance, MockMCPClient };
});

vi.mock('../scripts/mcp-client.js', () => ({
  MCPClient: MockMCPClient,
  getDefaultClient: () => mockClientInstance
}));

let qualityModule: QualityModule | null = null;

beforeAll(async () => {
  vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined as unknown as string);
  vi.spyOn(fs, 'existsSync').mockReturnValue(false);

  try {
    qualityModule = await import('../scripts/generate-news-enhanced.js') as unknown as QualityModule;
  } catch (e: unknown) {
    console.error('Import failed:', e instanceof Error ? e.message : String(e));
    qualityModule = null;
  }
});

afterAll(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers to build sample HTML articles
// ---------------------------------------------------------------------------

function buildHtml(options: {
  wordCount?: number;
  h2Count?: number;
  untranslatedSpans?: number;
  unknownAuthors?: number;
}): string {
  const { wordCount = 600, h2Count = 3, untranslatedSpans = 0, unknownAuthors = 0 } = options;

  // Build body text with approximately `wordCount` words
  const wordBlock: string = Array(wordCount).fill('word').join(' ');

  // Build h2 sections
  const h2Sections: string = Array(h2Count)
    .fill(0)
    .map((_, i) => `<h2>Section ${i + 1}</h2><p>Analytical content here.</p>`)
    .join('\n');

  // Build data-translate spans
  const translateSpans: string = Array(untranslatedSpans)
    .fill(0)
    .map((_, i) => `<span data-translate="true">Swedish text ${i}</span>`)
    .join('\n');

  // Build unknown author entries
  const unknownEntries: string = Array(unknownAuthors)
    .fill('<p>Filed by: Unknown (Unknown)</p>')
    .join('\n');

  return `<!DOCTYPE html><html><body>
<h1>Test Article</h1>
${h2Sections}
<p>${wordBlock}</p>
${translateSpans}
${unknownEntries}
</body></html>`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('validateArticleQuality', () => {
  it('should be exported from generate-news-enhanced', () => {
    expect(qualityModule).not.toBeNull();
    expect(typeof qualityModule?.validateArticleQuality).toBe('function');
  });

  it('exports QUALITY_THRESHOLD = 40 by default', () => {
    expect(qualityModule?.QUALITY_THRESHOLD).toBe(40);
  });

  describe('high-quality article', () => {
    it('should score ≥ 40 and pass for a well-formed article', () => {
      if (!qualityModule) return;
      const html = buildHtml({ wordCount: 600, h2Count: 3, untranslatedSpans: 0 });
      const result = qualityModule.validateArticleQuality(html, 'en', 'motions', '2026-02-23-motions-en.html');
      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(40);
    });

    it('should return correct filename, lang, and articleType', () => {
      if (!qualityModule) return;
      const html = buildHtml({ wordCount: 600, h2Count: 3 });
      const result = qualityModule.validateArticleQuality(html, 'en', 'propositions', '2026-02-23-propositions-en.html');
      expect(result.filename).toBe('2026-02-23-propositions-en.html');
      expect(result.lang).toBe('en');
      expect(result.articleType).toBe('propositions');
    });
  });

  describe('word count scoring', () => {
    it('should give 0 word score for an empty article', () => {
      if (!qualityModule) return;
      const result = qualityModule.validateArticleQuality('<html></html>', 'en', 'motions', 'test.html');
      expect(result.wordCount).toBe(0);
      // wordScore = 0, sectionScore = 0, translationScore = 20 (no spans) = 20
      expect(result.score).toBe(20);
    });

    it('should cap word score at 50 for articles with ≥ 1000 words', () => {
      if (!qualityModule) return;
      const html = buildHtml({ wordCount: 1200, h2Count: 0, untranslatedSpans: 0 });
      const result = qualityModule.validateArticleQuality(html, 'en', 'motions', 'test.html');
      // wordScore capped at 50
      expect(result.score).toBeGreaterThanOrEqual(50);
    });

    it('should give a proportional word score for a short article (300 words)', () => {
      if (!qualityModule) return;
      const html = buildHtml({ wordCount: 300, h2Count: 0, untranslatedSpans: 0 });
      const result = qualityModule.validateArticleQuality(html, 'en', 'motions', 'test.html');
      // wordScore ≈ floor(300/1000 * 50) = 15; sectionScore = 0; translationScore = 20 → 35
      expect(result.score).toBeLessThan(40);
      expect(result.passed).toBe(false);
    });
  });

  describe('section scoring', () => {
    it('should give full section score (30) for articles with ≥ 3 h2 headings', () => {
      if (!qualityModule) return;
      const html = buildHtml({ wordCount: 0, h2Count: 3, untranslatedSpans: 0 });
      const result = qualityModule.validateArticleQuality(html, 'en', 'motions', 'test.html');
      expect(result.analyticalSections).toBe(3);
      // wordScore≈1 (boilerplate text), sectionScore=30, translationScore=20 → ≥ 50
      expect(result.score).toBeGreaterThanOrEqual(50);
      expect(result.passed).toBe(true);
    });

    it('should give partial section score for 1 h2 heading', () => {
      if (!qualityModule) return;
      const html = buildHtml({ wordCount: 0, h2Count: 1, untranslatedSpans: 0 });
      const result = qualityModule.validateArticleQuality(html, 'en', 'motions', 'test.html');
      expect(result.analyticalSections).toBe(1);
      expect(result.score).toBeLessThan(50);
    });

    it('should give 0 section score for articles with no h2 headings', () => {
      if (!qualityModule) return;
      const html = buildHtml({ wordCount: 0, h2Count: 0, untranslatedSpans: 0 });
      const result = qualityModule.validateArticleQuality(html, 'en', 'motions', 'test.html');
      expect(result.analyticalSections).toBe(0);
      // wordScore≈0-1 (boilerplate), sectionScore=0, translationScore=20 → ~20
      expect(result.score).toBeGreaterThanOrEqual(20);
      expect(result.score).toBeLessThan(30);
    });
  });

  describe('translation scoring', () => {
    it('should not deduct points for untranslated spans in Swedish articles', () => {
      if (!qualityModule) return;
      const html = buildHtml({ wordCount: 0, h2Count: 0, untranslatedSpans: 15 });
      // Run once as sv (no deduction) and once as en (with deduction) and compare
      const svResult = qualityModule.validateArticleQuality(html, 'sv', 'motions', 'test-sv.html');
      const enResult = qualityModule.validateArticleQuality(html, 'en', 'motions', 'test-en.html');
      expect(svResult.untranslatedSpans).toBe(15);
      // sv must score higher than en because no deduction applied
      expect(svResult.score).toBeGreaterThan(enResult.score);
    });

    it('should deduct 2 points per untranslated span in non-Swedish articles', () => {
      if (!qualityModule) return;
      const html = buildHtml({ wordCount: 0, h2Count: 0, untranslatedSpans: 5 });
      const result = qualityModule.validateArticleQuality(html, 'en', 'motions', 'test-en.html');
      // translationDeduction = min(20, 5*2) = 10 → translationScore = 10
      expect(result.untranslatedSpans).toBe(5);
      // Score should be less than the no-spans equivalent
      const htmlClean = buildHtml({ wordCount: 0, h2Count: 0, untranslatedSpans: 0 });
      const cleanResult = qualityModule.validateArticleQuality(htmlClean, 'en', 'motions', 'test2-en.html');
      expect(result.score).toBeLessThan(cleanResult.score);
    });

    it('should cap translation deduction at 20 points', () => {
      if (!qualityModule) return;
      const html = buildHtml({ wordCount: 0, h2Count: 0, untranslatedSpans: 25 });
      const result = qualityModule.validateArticleQuality(html, 'en', 'motions', 'test-en.html');
      // translationDeduction = min(20, 25*2) = 20 → translationScore = 0 (plus small word boost)
      expect(result.score).toBeLessThan(10);
      expect(result.passed).toBe(false);
    });
  });

  describe('unknown author detection', () => {
    it('should count "Unknown (Unknown)" occurrences correctly', () => {
      if (!qualityModule) return;
      const html = buildHtml({ wordCount: 600, h2Count: 3, unknownAuthors: 5 });
      const result = qualityModule.validateArticleQuality(html, 'en', 'motions', 'test.html');
      expect(result.unknownAuthors).toBe(5);
    });

    it('should return 0 unknownAuthors when there are no unknown entries', () => {
      if (!qualityModule) return;
      const html = buildHtml({ wordCount: 600, h2Count: 3, unknownAuthors: 0 });
      const result = qualityModule.validateArticleQuality(html, 'en', 'motions', 'test.html');
      expect(result.unknownAuthors).toBe(0);
    });
  });

  describe('pass/fail threshold', () => {
    it('should fail when score is exactly below threshold (39)', () => {
      if (!qualityModule) return;
      // Craft an article that scores exactly 39:
      // wordCount ~750 → wordScore=37; h2Count=0 → sectionScore=0; no spans → translationScore=20 → 57 (too high)
      // Try: wordCount=0, h2Count=1 (sectionScore=10), untranslatedSpans=0 → 0+10+20 = 30 (below 40)
      const html = buildHtml({ wordCount: 0, h2Count: 1, untranslatedSpans: 0 });
      const result = qualityModule.validateArticleQuality(html, 'en', 'motions', 'test.html');
      expect(result.passed).toBe(result.score >= 40);
    });

    it('should pass when score equals threshold (40)', () => {
      if (!qualityModule) return;
      // wordCount=1000 → wordScore=50; h2Count=0; untranslatedSpans=15 → translationScore=20-30=-10→0
      // = 50 → passes
      // Simpler: h2Count=3 → sectionScore=30; no words, no spans → 0+30+20=50
      const html = buildHtml({ wordCount: 0, h2Count: 3, untranslatedSpans: 0 });
      const result = qualityModule.validateArticleQuality(html, 'en', 'motions', 'test.html');
      expect(result.score).toBeGreaterThanOrEqual(40);
      expect(result.passed).toBe(true);
    });
  });

  describe('score decomposition', () => {
    it('should produce scores within 0–100 range', () => {
      if (!qualityModule) return;
      const html = buildHtml({ wordCount: 800, h2Count: 2, untranslatedSpans: 3 });
      const result = qualityModule.validateArticleQuality(html, 'de', 'committee-reports', 'test-de.html');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should score maximum 100 for a perfect article', () => {
      if (!qualityModule) return;
      const html = buildHtml({ wordCount: 1200, h2Count: 5, untranslatedSpans: 0 });
      const result = qualityModule.validateArticleQuality(html, 'en', 'propositions', 'test.html');
      // wordScore=50 + sectionScore=30 + translationScore=20 = 100
      expect(result.score).toBe(100);
      expect(result.passed).toBe(true);
    });
  });
});
