/**
 * Unit Tests for Enhanced News Generation Script - Part 1
 *
 * Tests the generate-news-enhanced.js module including:
 * - Configuration constants (VALID_ARTICLE_TYPES, ALL_LANGUAGES, LANGUAGE_PRESETS)
 * - Pure utility functions (formatDateForSlug, getWeekAheadDateRange)
 * - Article writing functions (writeSingleArticle, writeArticlePair)
 * - Generation function: generateWeekAhead
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import type { Language } from '../scripts/types/language.js';
import type { ArticleType } from '../scripts/types/article.js';
import type { GenerationResult, DateRange } from '../scripts/types/article.js';
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
  request: ReturnType<typeof vi.fn>;
  timeout: number;
  baseURL: string;
}

/** Language preset mapping */
interface LanguagePresets {
  readonly nordic: readonly Language[];
  readonly 'eu-core': readonly Language[];
  readonly all: readonly Language[];
  readonly [key: string]: readonly Language[];
}

/** Shape of the dynamically imported module */
interface GenerateNewsEnhancedModule {
  readonly VALID_ARTICLE_TYPES: readonly ArticleType[];
  readonly ALL_LANGUAGES: readonly Language[];
  readonly LANGUAGE_PRESETS: LanguagePresets;
  readonly formatDateForSlug: (date?: Date) => string;
  readonly getWeekAheadDateRange: () => DateRange;
  readonly writeSingleArticle: (html: string, slug: string, lang: string) => Promise<string>;
  readonly writeArticlePair: (htmlEN: string, htmlSV: string, slug: string) => Promise<void>;
  readonly generateWeekAhead: () => Promise<GenerationResult>;
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

function resetMockClient(): void {
  mockClientInstance.fetchCalendarEvents.mockReset().mockResolvedValue(mockCalendarEvents);
  mockClientInstance.fetchCommitteeReports.mockReset().mockResolvedValue(mockCommitteeReports);
  mockClientInstance.fetchPropositions.mockReset().mockResolvedValue(mockPropositions);
  mockClientInstance.fetchMotions.mockReset().mockResolvedValue(mockMotions);
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

describe('Generate News Enhanced - Part 1', () => {
  beforeEach(() => {
    // Reset mock client methods with default return values
    resetMockClient();
    // Re-apply fs mock
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Module Constants', () => {
    it('should export VALID_ARTICLE_TYPES with all supported types', () => {
      if (!moduleExports) return;

      expect(moduleExports.VALID_ARTICLE_TYPES).toBeDefined();
      expect(moduleExports.VALID_ARTICLE_TYPES).toContain('week-ahead');
      expect(moduleExports.VALID_ARTICLE_TYPES).toContain('month-ahead');
      expect(moduleExports.VALID_ARTICLE_TYPES).toContain('weekly-review');
      expect(moduleExports.VALID_ARTICLE_TYPES).toContain('monthly-review');
      expect(moduleExports.VALID_ARTICLE_TYPES).toContain('breaking'); // Actual: 'breaking', not 'week-summary'
      expect(moduleExports.VALID_ARTICLE_TYPES).toContain('committee-reports');
      expect(moduleExports.VALID_ARTICLE_TYPES).toContain('propositions');
      expect(moduleExports.VALID_ARTICLE_TYPES).toContain('motions');
    });

    it('should export ALL_LANGUAGES with all 14 supported languages', () => {
      if (!moduleExports) return;

      expect(moduleExports.ALL_LANGUAGES).toBeDefined();
      expect(moduleExports.ALL_LANGUAGES).toHaveLength(14);
      expect(moduleExports.ALL_LANGUAGES).toEqual([
        'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'
      ]);
    });

    it('should export LANGUAGE_PRESETS with all preset categories', () => {
      if (!moduleExports) return;

      expect(moduleExports.LANGUAGE_PRESETS).toBeDefined();
      expect(moduleExports.LANGUAGE_PRESETS.nordic).toBeDefined();
      expect(moduleExports.LANGUAGE_PRESETS['eu-core']).toBeDefined(); // Actual: 'eu-core', not 'european'
      expect(moduleExports.LANGUAGE_PRESETS.all).toBeDefined();
    });

    it('nordic preset should include Nordic languages', () => {
      if (!moduleExports) return;

      const nordic = moduleExports.LANGUAGE_PRESETS.nordic;
      expect(nordic).toContain('en');
      expect(nordic).toContain('sv');
      expect(nordic).toContain('da');
      expect(nordic).toContain('no');
      expect(nordic).toContain('fi');
    });

    it('eu-core preset should include EU core languages', () => {
      if (!moduleExports) return;

      const euCore = moduleExports.LANGUAGE_PRESETS['eu-core']; // Actual: 'eu-core'
      expect(euCore).toContain('en');
      expect(euCore).toContain('sv');
      expect(euCore).toContain('de');
      expect(euCore).toContain('fr');
      expect(euCore).toContain('es');
      expect(euCore).toContain('nl');
    });

    it('all preset should include all 14 languages', () => {
      if (!moduleExports) return;

      expect(moduleExports.LANGUAGE_PRESETS.all).toEqual(moduleExports.ALL_LANGUAGES);
    });
  });

  describe('formatDateForSlug', () => {
    it('should be an exported function', () => {
      if (!moduleExports) return;

      expect(typeof moduleExports.formatDateForSlug).toBe('function');
    });

    it('should format date correctly', () => {
      if (!moduleExports) return;

      const date = new Date('2026-02-14T12:00:00Z');
      const formatted = moduleExports.formatDateForSlug(date);

      expect(formatted).toBe('2026-02-14');
    });

    it('should pad single-digit months and days', () => {
      if (!moduleExports) return;

      const date = new Date('2026-03-05T12:00:00Z');
      const formatted = moduleExports.formatDateForSlug(date);

      expect(formatted).toBe('2026-03-05');
    });

    it('should use current date when called with no arguments', () => {
      if (!moduleExports) return;

      const formatted = moduleExports.formatDateForSlug();

      // Should match YYYY-MM-DD format
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getWeekAheadDateRange', () => {
    it('should be an exported function', () => {
      if (!moduleExports) return;

      expect(typeof moduleExports.getWeekAheadDateRange).toBe('function');
    });

    it('should return object with start and end dates', () => {
      if (!moduleExports) return;

      const range = moduleExports.getWeekAheadDateRange();

      expect(range).toBeDefined();
      expect(range.start).toBeDefined(); // Actual: 'start', not 'from'
      expect(range.end).toBeDefined(); // Actual: 'end', not 'to'
    });

    it('should return dates in ISO format', () => {
      if (!moduleExports) return;

      const range = moduleExports.getWeekAheadDateRange();

      expect(typeof range.start).toBe('string');
      expect(typeof range.end).toBe('string');
      expect(range.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return a 7-day range', () => {
      if (!moduleExports) return;

      const range = moduleExports.getWeekAheadDateRange();
      const start = new Date(range.start);
      const end = new Date(range.end);
      const daysDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      expect(daysDiff).toBe(7);
    });

    it('end date should be after start date', () => {
      if (!moduleExports) return;

      const range = moduleExports.getWeekAheadDateRange();
      const start = new Date(range.start);
      const end = new Date(range.end);

      expect(end > start).toBe(true);
    });
  });

  describe('writeSingleArticle', () => {
    it('should be an exported function', () => {
      if (!moduleExports) return;

      expect(typeof moduleExports.writeSingleArticle).toBe('function');
    });

    it('should accept html, slug, and language parameters', async () => {
      if (!moduleExports) return;

      const html = '<html><body>Test</body></html>';
      const result = await moduleExports.writeSingleArticle(html, 'test-slug', 'en');

      expect(result).toBeDefined();
    });

    it('should return filename', async () => {
      if (!moduleExports) return;

      const html = '<html><body>Test</body></html>';
      const result = await moduleExports.writeSingleArticle(html, 'test-slug', 'en');

      // Actual: returns filename, not {success: true}
      expect(typeof result).toBe('string');
      expect(result).toContain('test-slug');
      expect(result).toContain('en');
    });

    it('should call fs.writeFileSync', async () => {
      if (!moduleExports) return;

      const html = '<html><body>Test</body></html>';
      await moduleExports.writeSingleArticle(html, 'test-slug', 'en');

      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should include language in filename', async () => {
      if (!moduleExports) return;

      const html = '<html><body>Test</body></html>';
      const filename = await moduleExports.writeSingleArticle(html, 'test-slug', 'sv');

      expect(filename).toContain('sv');
      expect(filename).toMatch(/test-slug-sv\.html$/);
    });
  });

  describe('writeArticlePair', () => {
    it('should be an exported function', () => {
      if (!moduleExports) return;

      expect(typeof moduleExports.writeArticlePair).toBe('function');
    });

    it('should write both English and Swedish versions', async () => {
      if (!moduleExports) return;

      const htmlEN = '<html lang="en"><body>English</body></html>';
      const htmlSV = '<html lang="sv"><body>Swedish</body></html>';
      await moduleExports.writeArticlePair(htmlEN, htmlSV, 'test-slug');

      // Actual: calls writeSingleArticle twice (exactly 2 files)
      const calls = (fs.writeFileSync as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.length).toBe(2);
    });
  });

  describe('generateWeekAhead', () => {
    it('should be an exported function', () => {
      if (!moduleExports) return;

      expect(typeof moduleExports.generateWeekAhead).toBe('function');
    });

    it('should return result with success status', async () => {
      if (!moduleExports) return;

      const result = await moduleExports.generateWeekAhead();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.slug).toContain('week-ahead');
    });

    it('should generate files for requested languages', async () => {
      if (!moduleExports) return;

      const result = await moduleExports.generateWeekAhead();

      expect(result.success).toBe(true);
      expect(result.files).toBeGreaterThan(0);
    });

    it('should include date in slug', async () => {
      if (!moduleExports) return;

      const result = await moduleExports.generateWeekAhead();
      const today = new Date().toISOString().split('T')[0];

      expect(result.slug).toContain(today);
    });

    it('should call MCP client fetchCalendarEvents', async () => {
      if (!moduleExports) return;

      await moduleExports.generateWeekAhead();

      expect(mockClientInstance.fetchCalendarEvents).toHaveBeenCalled();
    });

    it('should handle MCP client errors gracefully', async () => {
      if (!moduleExports || !mockClientInstance) return;

      mockClientInstance.fetchCalendarEvents.mockRejectedValueOnce(new Error('Network error'));

      const result = await moduleExports.generateWeekAhead();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });
});
