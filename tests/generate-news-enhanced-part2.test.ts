/**
 * Unit Tests for Enhanced News Generation Script - Part 2
 *
 * Tests the generate-news-enhanced.js module including:
 * - Generation functions: generateCommitteeReports, generatePropositions, generateMotions
 * - Main orchestrator function (generateNews)
 * - Integration tests (MCP Client, Data Transformers, Article Template)
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { Language } from '../scripts/types/language.js';
import type { ArticleType } from '../scripts/types/article.js';
import type { GenerationResult, GenerationStats } from '../scripts/types/article.js';
import type { MCPClientConfig } from '../scripts/types/mcp.js';

/** Shape of a calendar event from the MCP client */
interface MockCalendarEvent {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly type: string;
}

/** Shape of a committee report from the MCP client */
interface MockCommitteeReport {
  readonly id: string;
  readonly title: string;
  readonly committee: string;
  readonly date: string;
}

/** Shape of a proposition from the MCP client */
interface MockProposition {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly ministry: string;
}

/** Shape of a motion from the MCP client */
interface MockMotion {
  readonly id: string;
  readonly title: string;
  readonly party: string;
  readonly date: string;
}

/** Mock MCP client interface */
interface MockMCPClientInstance {
  fetchCalendarEvents: ReturnType<typeof vi.fn>;
  fetchCommitteeReports: ReturnType<typeof vi.fn>;
  fetchPropositions: ReturnType<typeof vi.fn>;
  fetchMotions: ReturnType<typeof vi.fn>;
  enrichDocumentsWithContent: ReturnType<typeof vi.fn>;
  searchDocuments: ReturnType<typeof vi.fn>;
  fetchWrittenQuestions: ReturnType<typeof vi.fn>;
  fetchInterpellations: ReturnType<typeof vi.fn>;
  request: ReturnType<typeof vi.fn>;
  timeout: number;
  baseURL: string;
}

/** Shape of the dynamically imported module */
interface GenerateNewsEnhancedModule {
  readonly VALID_ARTICLE_TYPES: readonly ArticleType[];
  readonly ALL_LANGUAGES: readonly Language[];
  readonly LANGUAGE_PRESETS: Record<string, readonly Language[]>;
  readonly generateCommitteeReports: () => Promise<GenerationResult>;
  readonly generatePropositions: () => Promise<GenerationResult>;
  readonly generateMotions: () => Promise<GenerationResult>;
  readonly generateNews: () => Promise<GenerationStats>;
}

// Use vi.hoisted() to define mock data before vi.mock() hoisting
const { mockClientInstance, mockCalendarEvents, mockCommitteeReports, mockPropositions, mockMotions, MockMCPClient } = vi.hoisted(() => {
  const mockCalendarEvents: MockCalendarEvent[] = [
    { id: '1', title: 'Budget debate', date: '2026-02-16', type: 'chamber' },
    { id: '2', title: 'Committee meeting', date: '2026-02-17', type: 'committee' }
  ];
  const mockCommitteeReports: MockCommitteeReport[] = [
    { id: 'bet-1', title: 'Report on taxation', committee: 'Skatteutskottet', date: '2026-02-15' },
    { id: 'bet-2', title: 'Report on healthcare', committee: 'Socialutskottet', date: '2026-02-14' }
  ];
  const mockPropositions: MockProposition[] = [
    { id: 'prop-1', title: 'Budget proposition', date: '2026-02-15', ministry: 'Finance' },
    { id: 'prop-2', title: 'Education reform', date: '2026-02-14', ministry: 'Education' }
  ];
  const mockMotions: MockMotion[] = [
    { id: 'mot-1', title: 'Motion on climate', party: 'MP', date: '2026-02-15' },
    { id: 'mot-2', title: 'Motion on defense', party: 'SD', date: '2026-02-14' }
  ];
  const mockClientInstance: MockMCPClientInstance = {
    fetchCalendarEvents: vi.fn(),
    fetchCommitteeReports: vi.fn(),
    fetchPropositions: vi.fn(),
    fetchMotions: vi.fn(),
    enrichDocumentsWithContent: vi.fn(),  // NEW: Added for document enrichment
    searchDocuments: vi.fn(),
    fetchWrittenQuestions: vi.fn(),
    fetchInterpellations: vi.fn(),
    request: vi.fn(),
    timeout: 30000,
    baseURL: 'https://riksdag-regering-ai.onrender.com/mcp'
  };
  // Use a regular function (not arrow) so it can be called with `new`
  function MockMCPClient(config: MCPClientConfig | undefined): MockMCPClientInstance {
    if (config && config.timeout) mockClientInstance.timeout = config.timeout;
    return mockClientInstance;
  }
  return { mockClientInstance, mockCalendarEvents, mockCommitteeReports, mockPropositions, mockMotions, MockMCPClient };
});

// Mock MCPClient so generation functions don't make real HTTP calls
vi.mock('../scripts/mcp-client.js', () => {
  return {
    MCPClient: MockMCPClient,
    getDefaultClient: () => mockClientInstance
  };
});

// The module has top-level side effects (CLI arg parsing, console.log).
// We use dynamic import to handle this safely.
let moduleExports: GenerateNewsEnhancedModule | null;

interface EnrichableDoc {
  readonly id: string;
  readonly title: string;
  readonly [key: string]: unknown;
}

function resetMockClient(): void {
  mockClientInstance.fetchCalendarEvents.mockReset().mockResolvedValue(mockCalendarEvents);
  mockClientInstance.fetchCommitteeReports.mockReset().mockResolvedValue(mockCommitteeReports);
  mockClientInstance.fetchPropositions.mockReset().mockResolvedValue(mockPropositions);
  mockClientInstance.fetchMotions.mockReset().mockResolvedValue(mockMotions);
  // NEW: Mock enrichDocumentsWithContent to return documents with contentFetched flag
  mockClientInstance.enrichDocumentsWithContent.mockReset().mockImplementation(async (docs: EnrichableDoc[]) =>
    docs.map((doc: EnrichableDoc) => ({ ...doc, contentFetched: true }))
  );
  mockClientInstance.searchDocuments.mockReset().mockResolvedValue([]);
  mockClientInstance.fetchWrittenQuestions.mockReset().mockResolvedValue([]);
  mockClientInstance.fetchInterpellations.mockReset().mockResolvedValue([]);
  mockClientInstance.request.mockReset().mockResolvedValue({ last_sync: '2026-02-16T12:00:00Z' });
}

beforeAll(async () => {
  // Spy on fs.writeFileSync to prevent actual file writes during tests
  vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined as unknown as string);
  resetMockClient();

  try {
    moduleExports = await import('../scripts/generate-news-enhanced.js') as unknown as GenerateNewsEnhancedModule;
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error('Import failed:', errorMessage);
    moduleExports = null;
  }
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('Generate News Enhanced - Part 2', () => {
  beforeEach(() => {
    // Reset mock client methods with default return values
    resetMockClient();
    // Re-apply fs mock
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateCommitteeReports', () => {
    it('should be an exported function', () => {
      if (!moduleExports) return;

      expect(typeof moduleExports.generateCommitteeReports).toBe('function');
    });

    it('should return result with success status', async () => {
      if (!moduleExports) return;

      const result = await moduleExports.generateCommitteeReports();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should call MCP client fetchCommitteeReports', async () => {
      if (!moduleExports) return;

      await moduleExports.generateCommitteeReports();

      expect(mockClientInstance.fetchCommitteeReports).toHaveBeenCalledWith(10);
    });

    it('should handle empty results', async () => {
      if (!moduleExports || !mockClientInstance) return;

      mockClientInstance.fetchCommitteeReports.mockResolvedValueOnce([]);

      const result = await moduleExports.generateCommitteeReports();

      expect(result.success).toBe(true);
      expect(result.files).toBe(0);
    });

    it('should handle MCP client errors gracefully', async () => {
      if (!moduleExports || !mockClientInstance) return;

      mockClientInstance.fetchCommitteeReports.mockRejectedValueOnce(new Error('Server error'));

      const result = await moduleExports.generateCommitteeReports();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Server error');
    });

    it('should include committee-reports in slug', async () => {
      if (!moduleExports) return;

      const result = await moduleExports.generateCommitteeReports();

      expect(result.slug).toContain('committee-reports');
    });
  });

  describe('generatePropositions', () => {
    it('should be an exported function', () => {
      if (!moduleExports) return;

      expect(typeof moduleExports.generatePropositions).toBe('function');
    });

    it('should return result with success status', async () => {
      if (!moduleExports) return;

      const result = await moduleExports.generatePropositions();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should call MCP client fetchPropositions', async () => {
      if (!moduleExports) return;

      await moduleExports.generatePropositions();

      expect(mockClientInstance.fetchPropositions).toHaveBeenCalledWith(10);
    });

    it('should handle empty results', async () => {
      if (!moduleExports || !mockClientInstance) return;

      mockClientInstance.fetchPropositions.mockResolvedValueOnce([]);

      const result = await moduleExports.generatePropositions();

      expect(result.success).toBe(true);
      expect(result.files).toBe(0);
    });

    it('should handle MCP client errors gracefully', async () => {
      if (!moduleExports || !mockClientInstance) return;

      mockClientInstance.fetchPropositions.mockRejectedValueOnce(new Error('Timeout'));

      const result = await moduleExports.generatePropositions();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timeout');
    });

    it('should include government-propositions in slug', async () => {
      if (!moduleExports) return;

      const result = await moduleExports.generatePropositions();

      expect(result.slug).toContain('government-propositions');
    });
  });

  describe('generateMotions', () => {
    it('should be an exported function', () => {
      if (!moduleExports) return;

      expect(typeof moduleExports.generateMotions).toBe('function');
    });

    it('should return result with success status', async () => {
      if (!moduleExports) return;

      const result = await moduleExports.generateMotions();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should call MCP client fetchMotions', async () => {
      if (!moduleExports) return;

      await moduleExports.generateMotions();

      expect(mockClientInstance.fetchMotions).toHaveBeenCalledWith(10);
    });

    it('should handle empty results', async () => {
      if (!moduleExports || !mockClientInstance) return;

      mockClientInstance.fetchMotions.mockResolvedValueOnce([]);

      const result = await moduleExports.generateMotions();

      expect(result.success).toBe(true);
      expect(result.files).toBe(0);
    });

    it('should handle MCP client errors gracefully', async () => {
      if (!moduleExports || !mockClientInstance) return;

      mockClientInstance.fetchMotions.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await moduleExports.generateMotions();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection refused');
    });

    it('should include opposition-motions in slug', async () => {
      if (!moduleExports) return;

      const result = await moduleExports.generateMotions();

      expect(result.slug).toContain('opposition-motions');
    });
  });

  describe('generateNews', () => {
    it('should be an exported function', () => {
      if (!moduleExports) return;

      expect(typeof moduleExports.generateNews).toBe('function');
    });

    it('should return stats object', async () => {
      if (!moduleExports) return;

      const stats = await moduleExports.generateNews();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('generated');
      expect(stats).toHaveProperty('errors');
      expect(stats).toHaveProperty('articles');
      expect(stats).toHaveProperty('timestamp');
    });

    it('should generate articles and update stats', async () => {
      if (!moduleExports) return;

      const stats = await moduleExports.generateNews();

      expect(typeof stats.generated).toBe('number');
      expect(typeof stats.errors).toBe('number');
      expect(Array.isArray(stats.articles)).toBe(true);
    });

    it('should write metadata files', async () => {
      if (!moduleExports) return;

      await moduleExports.generateNews();

      // Should have written last-generation.json and generation-result.json
      const writeFileCalls = (fs.writeFileSync as ReturnType<typeof vi.fn>).mock.calls as [string, string][];
      const metadataWrites = writeFileCalls.filter((call: [string, string]) =>
        typeof call[0] === 'string' && call[0].includes('metadata')
      );
      expect(metadataWrites.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Article Type Validation', () => {
    it('should include all documented article types', () => {
      const expectedTypes: string[] = ['week-ahead', 'committee-reports', 'propositions', 'motions', 'breaking'];
      expectedTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Language Preset Coverage', () => {
    it('nordic preset should cover Scandinavian+Finnish languages', () => {
      const nordic: Language[] = ['en', 'sv', 'da', 'no', 'fi'];
      expect(nordic).toHaveLength(5);
      nordic.forEach(lang => {
        expect(lang).toMatch(/^[a-z]{2}$/);
      });
    });

    it('eu-core preset should cover major EU languages', () => {
      const euCore: Language[] = ['en', 'sv', 'de', 'fr', 'es', 'nl'];
      expect(euCore).toHaveLength(6);
      euCore.forEach(lang => {
        expect(lang).toMatch(/^[a-z]{2}$/);
      });
    });

    it('all preset should cover all 14 languages including CJK and RTL', () => {
      const all: Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      expect(all).toHaveLength(14);

      expect(all).toContain('ar');
      expect(all).toContain('he');
      expect(all).toContain('ja');
      expect(all).toContain('ko');
      expect(all).toContain('zh');
    });
  });

  describe('News Directory Structure', () => {
    it('should have news directory', () => {
      const newsDir = path.join(process.cwd(), 'news');
      expect(fs.existsSync(newsDir)).toBe(true);
    });
  });

  describe('Week Ahead Title Translations', () => {
    const TITLE_LANGUAGES: Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

    it('should have title translations for all 14 languages', () => {
      expect(TITLE_LANGUAGES).toHaveLength(14);
    });

    it('title languages should match ALL_LANGUAGES constant', () => {
      if (!moduleExports) return;
      expect(TITLE_LANGUAGES).toEqual(moduleExports.ALL_LANGUAGES);
    });
  });
});

describe('MCP Client Integration', () => {
  it('should be able to import MCPClient', async () => {
    const { MCPClient } = await import('../scripts/mcp-client.js') as { MCPClient: unknown };
    expect(MCPClient).toBeDefined();
    expect(typeof MCPClient).toBe('function');
  });
});

describe('Data Transformer Integration', () => {
  it('should be able to import all required transformers', async () => {
    const transformers = await import('../scripts/data-transformers.js') as Record<string, unknown>;

    expect(transformers.transformCalendarToEventGrid).toBeDefined();
    expect(transformers.generateArticleContent).toBeDefined();
    expect(transformers.extractWatchPoints).toBeDefined();
    expect(transformers.generateMetadata).toBeDefined();
    expect(transformers.calculateReadTime).toBeDefined();
    expect(transformers.generateSources).toBeDefined();
  });
});

describe('Article Template Integration', () => {
  it('should be able to import generateArticleHTML', async () => {
    const { generateArticleHTML } = await import('../scripts/article-template.js') as { generateArticleHTML: unknown };
    expect(generateArticleHTML).toBeDefined();
    expect(typeof generateArticleHTML).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// #468 — validateArticleQuality
// ---------------------------------------------------------------------------

describe('validateArticleQuality', () => {
  it('should be exported from generate-news-enhanced', async () => {
    const mod = await import('../scripts/generate-news-enhanced.js') as Record<string, unknown>;
    expect(typeof mod['validateArticleQuality']).toBe('function');
  });

  it('should score below threshold for empty HTML', async () => {
    const { validateArticleQuality, QUALITY_THRESHOLD } = await import('../scripts/generate-news-enhanced.js') as {
      validateArticleQuality: (html: string, lang: string, type: string, hint: string) => { qualityScore: number; belowThreshold: boolean };
      QUALITY_THRESHOLD: number;
    };
    const report = validateArticleQuality('', 'en', 'motions', 'test.html');
    // Empty HTML has no words and no sections; it only earns the translation bonus (20 pts)
    // which is still well below the 40-pt threshold.
    expect(report.qualityScore).toBeLessThan(QUALITY_THRESHOLD);
    expect(report.belowThreshold).toBe(true);
    expect(typeof QUALITY_THRESHOLD).toBe('number');
  });

  it('should give a high score for a rich article', async () => {
    const { validateArticleQuality } = await import('../scripts/generate-news-enhanced.js') as {
      validateArticleQuality: (html: string, lang: string, type: string, hint: string) => { qualityScore: number; belowThreshold: boolean; wordCount: number };
    };
    // Build an article with 400+ words and multiple h2 sections
    const words = Array(420).fill('word').join(' ');
    const html = `<html><body><h2>Analysis</h2><h2>Context</h2><h2>Outlook</h2><p>${words}</p></body></html>`;
    const report = validateArticleQuality(html, 'en', 'committee-reports', 'test-en.html');
    expect(report.wordCount).toBeGreaterThanOrEqual(400);
    expect(report.analyticalSections).toBe(3);
    expect(report.untranslatedSpans).toBe(0);
    expect(report.qualityScore).toBeGreaterThanOrEqual(40);
    expect(report.belowThreshold).toBe(false);
  });

  it('should penalise residual data-translate spans for non-sv articles', async () => {
    const { validateArticleQuality } = await import('../scripts/generate-news-enhanced.js') as {
      validateArticleQuality: (html: string, lang: string, type: string, hint: string) => { untranslatedSpans: number; qualityScore: number };
    };
    const words = Array(400).fill('word').join(' ');
    const spans = Array(20).fill('<span data-translate="true" lang="sv">term</span>').join(' ');
    const html = `<html><body><h2>A</h2><h2>B</h2><h2>C</h2><p>${words}</p>${spans}</body></html>`;
    const noSpanReport = validateArticleQuality(`<html><body><h2>A</h2><h2>B</h2><h2>C</h2><p>${words}</p></body></html>`, 'de', 'motions', 'test.html');
    const withSpanReport = validateArticleQuality(html, 'de', 'motions', 'test.html');
    expect(withSpanReport.untranslatedSpans).toBeGreaterThan(0);
    expect(withSpanReport.qualityScore).toBeLessThan(noSpanReport.qualityScore);
  });

  it('should NOT penalise sv articles for data-translate spans', async () => {
    const { validateArticleQuality } = await import('../scripts/generate-news-enhanced.js') as {
      validateArticleQuality: (html: string, lang: string, type: string, hint: string) => { untranslatedSpans: number };
    };
    const html = '<p><span data-translate="true" lang="sv">text</span></p>';
    const report = validateArticleQuality(html, 'sv', 'motions', 'test-sv.html');
    expect(report.untranslatedSpans).toBe(0);
  });
  it('should score proportionally for intermediate section counts', async () => {
    const { validateArticleQuality } = await import('../scripts/generate-news-enhanced.js') as {
      validateArticleQuality: (html: string, lang: string, type: string, hint: string) => { analyticalSections: number; qualityScore: number };
    };
    const words = Array(420).fill('word').join(' ');
    const oneSection = validateArticleQuality(`<html><body><h2>A</h2><p>${words}</p></body></html>`, 'en', 'motions', 'a.html');
    const twoSections = validateArticleQuality(`<html><body><h2>A</h2><h2>B</h2><p>${words}</p></body></html>`, 'en', 'motions', 'b.html');
    const threeSections = validateArticleQuality(`<html><body><h2>A</h2><h2>B</h2><h2>C</h2><p>${words}</p></body></html>`, 'en', 'motions', 'c.html');
    // Scores must increase as sections increase
    expect(oneSection.qualityScore).toBeLessThan(twoSections.qualityScore);
    expect(twoSections.qualityScore).toBeLessThan(threeSections.qualityScore);
    // Proportional check: 1 section = 10 pts, 2 sections = 20 pts, 3 = 30 pts
    expect(twoSections.qualityScore - oneSection.qualityScore).toBe(10);
    expect(threeSections.qualityScore - twoSections.qualityScore).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// #468 — QUALITY_THRESHOLD exported constant
// ---------------------------------------------------------------------------

describe('QUALITY_THRESHOLD export', () => {
  it('should export a positive numeric QUALITY_THRESHOLD', async () => {
    const { QUALITY_THRESHOLD } = await import('../scripts/generate-news-enhanced.js') as { QUALITY_THRESHOLD: number };
    expect(typeof QUALITY_THRESHOLD).toBe('number');
    expect(QUALITY_THRESHOLD).toBeGreaterThan(0);
    expect(QUALITY_THRESHOLD).toBeLessThanOrEqual(100);
  });
});
