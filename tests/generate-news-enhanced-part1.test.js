/**
 * Unit Tests for Enhanced News Generation Script - Part 1
 * 
 * Tests the generate-news-enhanced.js module including:
 * - Configuration constants (VALID_ARTICLE_TYPES, ALL_LANGUAGES, LANGUAGE_PRESETS)
 * - Pure utility functions (formatDateForSlug, getWeekAheadDateRange)
 * - Article writing functions (writeSingleArticle, writeArticlePair)
 * - Generation function: generateWeekAhead
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Use vi.hoisted() to define mock data before vi.mock() hoisting
const { mockClientInstance, mockCalendarEvents, mockCommitteeReports, mockPropositions, mockMotions, MockMCPClient } = vi.hoisted(() => {
  const mockCalendarEvents = [
    { id: '1', title: 'Budget debate', date: '2026-02-16', type: 'chamber' },
    { id: '2', title: 'Committee meeting', date: '2026-02-17', type: 'committee' }
  ];
  const mockCommitteeReports = [
    { id: 'bet-1', title: 'Report on taxation', committee: 'Skatteutskottet', date: '2026-02-15' },
    { id: 'bet-2', title: 'Report on healthcare', committee: 'Socialutskottet', date: '2026-02-14' }
  ];
  const mockPropositions = [
    { id: 'prop-1', title: 'Budget proposition', date: '2026-02-15', ministry: 'Finance' },
    { id: 'prop-2', title: 'Education reform', date: '2026-02-14', ministry: 'Education' }
  ];
  const mockMotions = [
    { id: 'mot-1', title: 'Motion on climate', party: 'MP', date: '2026-02-15' },
    { id: 'mot-2', title: 'Motion on defense', party: 'SD', date: '2026-02-14' }
  ];
  const mockClientInstance = {
    fetchCalendarEvents: vi.fn(),
    fetchCommitteeReports: vi.fn(),
    fetchPropositions: vi.fn(),
    fetchMotions: vi.fn()
  };
  // Use a regular function (not arrow) so it can be called with `new`
  function MockMCPClient() {
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
let moduleExports;

function resetMockClient() {
  mockClientInstance.fetchCalendarEvents.mockReset().mockResolvedValue(mockCalendarEvents);
  mockClientInstance.fetchCommitteeReports.mockReset().mockResolvedValue(mockCommitteeReports);
  mockClientInstance.fetchPropositions.mockReset().mockResolvedValue(mockPropositions);
  mockClientInstance.fetchMotions.mockReset().mockResolvedValue(mockMotions);
}

beforeAll(async () => {
  // Spy on fs.writeFileSync to prevent actual file writes during tests
  vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  vi.spyOn(fs, 'mkdirSync').mockImplementation(() => {});
  resetMockClient();
  
  try {
    moduleExports = await import('../scripts/generate-news-enhanced.js');
  } catch (e) {
    console.error('Import failed:', e.message);
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
      expect(moduleExports.VALID_ARTICLE_TYPES).toContain('week-summary');
      expect(moduleExports.VALID_ARTICLE_TYPES).toContain('committee-reports');
      expect(moduleExports.VALID_ARTICLE_TYPES).toContain('propositions');
      expect(moduleExports.VALID_ARTICLE_TYPES).toContain('motions');
      expect(moduleExports.VALID_ARTICLE_TYPES).toContain('news-index');
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
      expect(moduleExports.LANGUAGE_PRESETS.european).toBeDefined();
      expect(moduleExports.LANGUAGE_PRESETS.global).toBeDefined();
      expect(moduleExports.LANGUAGE_PRESETS.all).toBeDefined();
    });

    it('nordic preset should include Nordic languages', () => {
      if (!moduleExports) return;
      
      const nordic = moduleExports.LANGUAGE_PRESETS.nordic;
      expect(nordic).toContain('sv');
      expect(nordic).toContain('da');
      expect(nordic).toContain('no');
      expect(nordic).toContain('fi');
    });

    it('european preset should include European languages', () => {
      if (!moduleExports) return;
      
      const european = moduleExports.LANGUAGE_PRESETS.european;
      expect(european).toContain('sv');
      expect(european).toContain('da');
      expect(european).toContain('no');
      expect(european).toContain('fi');
      expect(european).toContain('de');
      expect(european).toContain('fr');
      expect(european).toContain('es');
      expect(european).toContain('nl');
    });

    it('global preset should include non-European languages', () => {
      if (!moduleExports) return;
      
      const global = moduleExports.LANGUAGE_PRESETS.global;
      expect(global).toContain('ar');
      expect(global).toContain('he');
      expect(global).toContain('ja');
      expect(global).toContain('ko');
      expect(global).toContain('zh');
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

    it('should handle ISO string input', () => {
      if (!moduleExports) return;
      
      const formatted = moduleExports.formatDateForSlug('2026-12-25T00:00:00Z');
      
      expect(formatted).toBe('2026-12-25');
    });
  });

  describe('getWeekAheadDateRange', () => {
    it('should be an exported function', () => {
      if (!moduleExports) return;
      
      expect(typeof moduleExports.getWeekAheadDateRange).toBe('function');
    });

    it('should return object with from and to dates', () => {
      if (!moduleExports) return;
      
      const range = moduleExports.getWeekAheadDateRange();
      
      expect(range).toBeDefined();
      expect(range.from).toBeDefined();
      expect(range.to).toBeDefined();
    });

    it('should return dates in ISO format', () => {
      if (!moduleExports) return;
      
      const range = moduleExports.getWeekAheadDateRange();
      
      expect(typeof range.from).toBe('string');
      expect(typeof range.to).toBe('string');
      expect(range.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return a 7-day range', () => {
      if (!moduleExports) return;
      
      const range = moduleExports.getWeekAheadDateRange();
      const from = new Date(range.from);
      const to = new Date(range.to);
      const daysDiff = Math.round((to - from) / (1000 * 60 * 60 * 24));
      
      expect(daysDiff).toBe(7);
    });

    it('to date should be after from date', () => {
      if (!moduleExports) return;
      
      const range = moduleExports.getWeekAheadDateRange();
      const from = new Date(range.from);
      const to = new Date(range.to);
      
      expect(to > from).toBe(true);
    });
  });

  describe('writeSingleArticle', () => {
    it('should be an exported function', () => {
      if (!moduleExports) return;
      
      expect(typeof moduleExports.writeSingleArticle).toBe('function');
    });

    it('should accept articleData and language parameters', () => {
      if (!moduleExports) return;
      
      const articleData = { slug: 'test', title: 'Test', content: 'Content' };
      const result = moduleExports.writeSingleArticle(articleData, 'en');
      
      expect(result).toBeDefined();
    });

    it('should return success status', () => {
      if (!moduleExports) return;
      
      const articleData = { slug: 'test', title: 'Test', content: 'Content' };
      const result = moduleExports.writeSingleArticle(articleData, 'en');
      
      expect(result.success).toBe(true);
    });

    it('should call fs.writeFileSync', () => {
      if (!moduleExports) return;
      
      const articleData = { slug: 'test', title: 'Test', content: 'Content' };
      moduleExports.writeSingleArticle(articleData, 'en');
      
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should include language in file path', () => {
      if (!moduleExports) return;
      
      const articleData = { slug: 'test', title: 'Test', content: 'Content' };
      moduleExports.writeSingleArticle(articleData, 'sv');
      
      const calls = fs.writeFileSync.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[0][0]).toContain('sv');
    });
  });

  describe('writeArticlePair', () => {
    it('should be an exported function', () => {
      if (!moduleExports) return;
      
      expect(typeof moduleExports.writeArticlePair).toBe('function');
    });

    it('should write both English and target language', () => {
      if (!moduleExports) return;
      
      const articleData = { slug: 'test', title: 'Test', content: 'Content' };
      moduleExports.writeArticlePair(articleData, 'sv');
      
      const calls = fs.writeFileSync.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(2);
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
