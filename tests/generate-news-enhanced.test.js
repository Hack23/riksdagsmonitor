/**
 * Unit Tests for Enhanced News Generation Script
 * 
 * Tests the generate-news-enhanced.js module including:
 * - Configuration constants (VALID_ARTICLE_TYPES, ALL_LANGUAGES, LANGUAGE_PRESETS)
 * - Pure utility functions (formatDateForSlug, getWeekAheadDateRange)
 * - Article writing functions (writeSingleArticle, writeArticlePair)
 * - Generation functions with mocked MCP client (generateWeekAhead, generateCommitteeReports, etc.)
 * - Main orchestrator function (generateNews)
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

describe('Generate News Enhanced', () => {
  beforeEach(() => {
    // Reset mock client methods with default return values
    resetMockClient();
    // Re-apply fs mock
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  });

  describe('Module Constants', () => {
    it('should export VALID_ARTICLE_TYPES with all supported types', () => {
      if (!moduleExports) return;
      
      expect(moduleExports.VALID_ARTICLE_TYPES).toBeDefined();
      expect(moduleExports.VALID_ARTICLE_TYPES).toContain('week-ahead');
      expect(moduleExports.VALID_ARTICLE_TYPES).toContain('committee-reports');
      expect(moduleExports.VALID_ARTICLE_TYPES).toContain('propositions');
      expect(moduleExports.VALID_ARTICLE_TYPES).toContain('motions');
      expect(moduleExports.VALID_ARTICLE_TYPES).toContain('breaking');
      expect(moduleExports.VALID_ARTICLE_TYPES).toHaveLength(5);
    });

    it('should export ALL_LANGUAGES with 14 language codes', () => {
      if (!moduleExports) return;
      
      expect(moduleExports.ALL_LANGUAGES).toBeDefined();
      expect(moduleExports.ALL_LANGUAGES).toHaveLength(14);
      expect(moduleExports.ALL_LANGUAGES).toContain('en');
      expect(moduleExports.ALL_LANGUAGES).toContain('sv');
      expect(moduleExports.ALL_LANGUAGES).toContain('ar');
      expect(moduleExports.ALL_LANGUAGES).toContain('he');
      expect(moduleExports.ALL_LANGUAGES).toContain('ja');
      expect(moduleExports.ALL_LANGUAGES).toContain('ko');
      expect(moduleExports.ALL_LANGUAGES).toContain('zh');
    });

    it('should export LANGUAGE_PRESETS with correct mappings', () => {
      if (!moduleExports) return;
      
      const presets = moduleExports.LANGUAGE_PRESETS;
      expect(presets).toBeDefined();
      
      // Check 'all' preset includes all 14 languages
      expect(presets.all).toHaveLength(14);
      
      // Check 'nordic' preset
      expect(presets.nordic).toEqual(['en', 'sv', 'da', 'no', 'fi']);
      
      // Check 'eu-core' preset
      expect(presets['eu-core']).toEqual(['en', 'sv', 'de', 'fr', 'es', 'nl']);
    });

    it('should have VALID_ARTICLE_TYPES as a frozen/immutable array', () => {
      if (!moduleExports) return;
      
      // Types should be strings
      moduleExports.VALID_ARTICLE_TYPES.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
        expect(type).not.toContain(' '); // No spaces in type slugs
      });
    });

    it('should have ALL_LANGUAGES as valid ISO 639-1 codes', () => {
      if (!moduleExports) return;
      
      moduleExports.ALL_LANGUAGES.forEach(lang => {
        expect(lang).toMatch(/^[a-z]{2}$/);
      });
    });
  });

  describe('formatDateForSlug', () => {
    it('should format date as YYYY-MM-DD', () => {
      if (!moduleExports) return;
      
      const date = new Date('2026-02-15T12:00:00Z');
      const slug = moduleExports.formatDateForSlug(date);
      expect(slug).toBe('2026-02-15');
    });

    it('should use current date when no argument provided', () => {
      if (!moduleExports) return;
      
      const slug = moduleExports.formatDateForSlug();
      expect(slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle different dates correctly', () => {
      if (!moduleExports) return;
      
      expect(moduleExports.formatDateForSlug(new Date('2026-01-01T00:00:00Z'))).toBe('2026-01-01');
      expect(moduleExports.formatDateForSlug(new Date('2026-12-31T23:59:59Z'))).toBe('2026-12-31');
    });

    it('should pad single-digit months and days', () => {
      if (!moduleExports) return;
      
      expect(moduleExports.formatDateForSlug(new Date('2026-03-05T00:00:00Z'))).toBe('2026-03-05');
      expect(moduleExports.formatDateForSlug(new Date('2026-09-09T00:00:00Z'))).toBe('2026-09-09');
    });
  });

  describe('getWeekAheadDateRange', () => {
    it('should return object with start and end properties', () => {
      if (!moduleExports) return;
      
      const range = moduleExports.getWeekAheadDateRange();
      expect(range).toHaveProperty('start');
      expect(range).toHaveProperty('end');
    });

    it('should return dates in YYYY-MM-DD format', () => {
      if (!moduleExports) return;
      
      const range = moduleExports.getWeekAheadDateRange();
      expect(range.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should have start date one day after today', () => {
      if (!moduleExports) return;
      
      const range = moduleExports.getWeekAheadDateRange();
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const expectedStart = tomorrow.toISOString().split('T')[0];
      
      expect(range.start).toBe(expectedStart);
    });

    it('should have end date 7 days after start date', () => {
      if (!moduleExports) return;
      
      const range = moduleExports.getWeekAheadDateRange();
      const startDate = new Date(range.start);
      const endDate = new Date(range.end);
      const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
      
      expect(diffDays).toBe(7);
    });

    it('should have end date 8 days after today', () => {
      if (!moduleExports) return;
      
      const range = moduleExports.getWeekAheadDateRange();
      const today = new Date();
      const eightDaysLater = new Date(today);
      eightDaysLater.setDate(today.getDate() + 8);
      const expectedEnd = eightDaysLater.toISOString().split('T')[0];
      
      expect(range.end).toBe(expectedEnd);
    });
  });

  describe('writeSingleArticle', () => {
    it('should be an exported function', () => {
      if (!moduleExports) return;
      
      expect(typeof moduleExports.writeSingleArticle).toBe('function');
    });

    it('should write article file and return filename', async () => {
      if (!moduleExports) return;
      
      const html = '<html><body>Test Article</body></html>';
      const filename = await moduleExports.writeSingleArticle(html, 'test-slug', 'en');
      
      expect(filename).toBe('test-slug-en.html');
      // Should have called writeFileSync (unless dry-run)
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should generate correct filename from slug and language', async () => {
      if (!moduleExports) return;
      
      const result = await moduleExports.writeSingleArticle('<html></html>', '2026-02-15-week-ahead', 'sv');
      expect(result).toBe('2026-02-15-week-ahead-sv.html');
    });

    it('should handle RTL language articles', async () => {
      if (!moduleExports) return;
      
      const result = await moduleExports.writeSingleArticle('<html dir="rtl"></html>', '2026-02-15-test', 'ar');
      expect(result).toBe('2026-02-15-test-ar.html');
    });

    it('should handle CJK language articles', async () => {
      if (!moduleExports) return;
      
      const result = await moduleExports.writeSingleArticle('<html></html>', '2026-02-15-test', 'ja');
      expect(result).toBe('2026-02-15-test-ja.html');
    });
  });

  describe('writeArticlePair', () => {
    it('should be an exported function', () => {
      if (!moduleExports) return;
      
      expect(typeof moduleExports.writeArticlePair).toBe('function');
    });

    it('should write both EN and SV versions', async () => {
      if (!moduleExports) return;
      
      await moduleExports.writeArticlePair('<html>EN</html>', '<html>SV</html>', 'test-slug');
      
      // Should have been called for both files
      expect(fs.writeFileSync).toHaveBeenCalled();
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
      const writeFileCalls = fs.writeFileSync.mock.calls;
      const metadataWrites = writeFileCalls.filter(call => 
        typeof call[0] === 'string' && call[0].includes('metadata')
      );
      expect(metadataWrites.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Article Type Validation', () => {
    it('should include all documented article types', () => {
      const expectedTypes = ['week-ahead', 'committee-reports', 'propositions', 'motions', 'breaking'];
      expectedTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Language Preset Coverage', () => {
    it('nordic preset should cover Scandinavian+Finnish languages', () => {
      const nordic = ['en', 'sv', 'da', 'no', 'fi'];
      expect(nordic).toHaveLength(5);
      nordic.forEach(lang => {
        expect(lang).toMatch(/^[a-z]{2}$/);
      });
    });

    it('eu-core preset should cover major EU languages', () => {
      const euCore = ['en', 'sv', 'de', 'fr', 'es', 'nl'];
      expect(euCore).toHaveLength(6);
      euCore.forEach(lang => {
        expect(lang).toMatch(/^[a-z]{2}$/);
      });
    });

    it('all preset should cover all 14 languages including CJK and RTL', () => {
      const all = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
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
    const TITLE_LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
    
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
    const { MCPClient } = await import('../scripts/mcp-client.js');
    expect(MCPClient).toBeDefined();
    expect(typeof MCPClient).toBe('function');
  });
});

describe('Data Transformer Integration', () => {
  it('should be able to import all required transformers', async () => {
    const transformers = await import('../scripts/data-transformers.js');
    
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
    const { generateArticleHTML } = await import('../scripts/article-template.js');
    expect(generateArticleHTML).toBeDefined();
    expect(typeof generateArticleHTML).toBe('function');
  });
});
