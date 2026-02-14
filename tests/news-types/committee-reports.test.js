/**
 * Unit Tests for Committee Reports Article Generation Module
 * 
 * Tests the scripts/news-types/committee-reports.js module including:
 * - Committee reports fetching
 * - Cross-reference validation
 * - Multi-language support
 * - Article structure validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock MCP client
const { mockClientInstance, mockCommitteeReports, MockMCPClient } = vi.hoisted(() => {
  const mockCommitteeReports = [
    { id: 'bet-1', title: 'Report on taxation', committee: 'Skatteutskottet', date: '2026-02-15', rm: '2024/25' },
    { id: 'bet-2', title: 'Report on healthcare', committee: 'Socialutskottet', date: '2026-02-14', rm: '2024/25' },
    { id: 'bet-3', title: 'Report on defense', committee: 'Försvarsutskottet', date: '2026-02-13', rm: '2024/25' }
  ];
  
  const mockClientInstance = {
    fetchCommitteeReports: vi.fn().mockResolvedValue(mockCommitteeReports)
  };
  
  function MockMCPClient() {
    return mockClientInstance;
  }
  
  return { mockClientInstance, mockCommitteeReports, MockMCPClient };
});

vi.mock('../../scripts/mcp-client.js', () => ({
  MCPClient: MockMCPClient
}));

let committeeReportsModule;

beforeAll(async () => {
  committeeReportsModule = await import('../../scripts/news-types/committee-reports.js');
});

describe('Committee Reports Article Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClientInstance.fetchCommitteeReports.mockResolvedValue(mockCommitteeReports);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should export REQUIRED_TOOLS constant', () => {
      expect(committeeReportsModule.REQUIRED_TOOLS).toBeDefined();
      expect(Array.isArray(committeeReportsModule.REQUIRED_TOOLS)).toBe(true);
      expect(committeeReportsModule.REQUIRED_TOOLS.length).toBe(4);
    });

    it('should require betankanden tool', () => {
      expect(committeeReportsModule.REQUIRED_TOOLS).toContain('get_betankanden');
    });

    it('should require voteringar tool', () => {
      expect(committeeReportsModule.REQUIRED_TOOLS).toContain('search_voteringar');
    });

    it('should require anforanden tool', () => {
      expect(committeeReportsModule.REQUIRED_TOOLS).toContain('search_anforanden');
    });

    it('should require propositioner tool', () => {
      expect(committeeReportsModule.REQUIRED_TOOLS).toContain('get_propositioner');
    });
  });

  describe('Cross-Referencing Pattern', () => {
    it('should call betankanden MCP tool', async () => {
      const result = await committeeReportsModule.generateCommitteeReports({
        languages: ['en']
      });
      
      expect(mockClientInstance.fetchCommitteeReports).toHaveBeenCalled();
      expect(result.mcpCalls.some(call => call.tool === 'get_betankanden')).toBe(true);
    });

    it('should fetch specified number of reports', async () => {
      await committeeReportsModule.generateCommitteeReports({
        languages: ['en'],
        limit: 5
      });
      
      expect(mockClientInstance.fetchCommitteeReports).toHaveBeenCalledWith(5);
    });

    it('should use default limit of 10 reports', async () => {
      await committeeReportsModule.generateCommitteeReports({
        languages: ['en']
      });
      
      expect(mockClientInstance.fetchCommitteeReports).toHaveBeenCalledWith(10);
    });

    it('should track MCP calls for validation', async () => {
      const result = await committeeReportsModule.generateCommitteeReports({
        languages: ['en']
      });
      
      expect(result.mcpCalls).toBeDefined();
      expect(Array.isArray(result.mcpCalls)).toBe(true);
      expect(result.mcpCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Data Handling', () => {
    it('should handle empty reports gracefully', async () => {
      mockClientInstance.fetchCommitteeReports.mockResolvedValue([]);
      
      const result = await committeeReportsModule.generateCommitteeReports({
        languages: ['en']
      });
      
      expect(result.success).toBe(true);
      expect(result.files).toBe(0);
    });

    it('should skip generation when no reports found', async () => {
      mockClientInstance.fetchCommitteeReports.mockResolvedValue([]);
      
      const result = await committeeReportsModule.generateCommitteeReports({
        languages: ['en', 'sv']
      });
      
      expect(result.files).toBe(0);
      expect(result.articles).toBeUndefined();
    });

    it('should process reports data correctly', async () => {
      const result = await committeeReportsModule.generateCommitteeReports({
        languages: ['en']
      });
      
      expect(result.crossReferences.reports).toBe(mockCommitteeReports.length);
    });
  });

  describe('Article Structure', () => {
    it('should generate articles for all requested languages', async () => {
      const result = await committeeReportsModule.generateCommitteeReports({
        languages: ['en', 'sv', 'de']
      });
      
      expect(result.success).toBe(true);
      expect(result.files).toBe(3);
      expect(result.articles.length).toBe(3);
    });

    it('should include correct slug format', async () => {
      const result = await committeeReportsModule.generateCommitteeReports({
        languages: ['en']
      });
      
      expect(result.slug).toMatch(/^\d{4}-\d{2}-\d{2}-committee-reports$/);
    });

    it('should generate HTML content for each language', async () => {
      const result = await committeeReportsModule.generateCommitteeReports({
        languages: ['en']
      });
      
      const article = result.articles[0];
      expect(article.html).toBeDefined();
      expect(typeof article.html).toBe('string');
      expect(article.html.length).toBeGreaterThan(0);
    });

    it('should include filename for each article', async () => {
      const result = await committeeReportsModule.generateCommitteeReports({
        languages: ['en']
      });
      
      const article = result.articles[0];
      expect(article.filename).toMatch(/committee-reports-en\.html$/);
    });
  });

  describe('Committee Analysis', () => {
    it('should include report count in metadata', async () => {
      const result = await committeeReportsModule.generateCommitteeReports({
        languages: ['en']
      });
      
      expect(result.crossReferences.reports).toBe(3);
    });

    it('should track betankanden as data source', async () => {
      const result = await committeeReportsModule.generateCommitteeReports({
        languages: ['en']
      });
      
      expect(result.crossReferences.sources).toContain('betankanden');
    });
  });

  describe('Validation Functions', () => {
    it('should export validateCommitteeReports function', () => {
      expect(committeeReportsModule.validateCommitteeReports).toBeDefined();
      expect(typeof committeeReportsModule.validateCommitteeReports).toBe('function');
    });

    it('should validate article has committee reports', () => {
      const article = {
        content: 'The committee has issued several reports on taxation.',
        sources: ['betankanden']
      };
      
      const validation = committeeReportsModule.validateCommitteeReports(article);
      expect(validation.hasCommitteeReports).toBe(true);
    });

    it('should check for minimum sources', () => {
      const article = {
        content: 'Committee reports analysis',
        sources: ['source1', 'source2', 'source3']
      };
      
      const validation = committeeReportsModule.validateCommitteeReports(article);
      expect(validation.hasMinimumSources).toBe(true);
    });

    it('should check for analysis tone', () => {
      const article = {
        content: 'Analysis of committee recommendations reveals key priorities.',
        sources: ['betankanden']
      };
      
      const validation = committeeReportsModule.validateCommitteeReports(article);
      expect(validation.hasAnalysisTone).toBe(true);
    });

    it('should check for party positions', () => {
      const article = {
        content: 'Party S supports the proposal while M opposes.',
        sources: ['betankanden']
      };
      
      const validation = committeeReportsModule.validateCommitteeReports(article);
      expect(validation.hasPartyPositions).toBe(true);
    });
  });

  describe('Multi-Language Support', () => {
    it('should generate language-specific titles', async () => {
      const result = await committeeReportsModule.generateCommitteeReports({
        languages: ['en', 'sv']
      });
      
      const enArticle = result.articles.find(a => a.lang === 'en');
      const svArticle = result.articles.find(a => a.lang === 'sv');
      
      expect(enArticle.html).toContain('Committee Reports');
      expect(svArticle.html).toContain('Utskottsbetänkanden');
    });

    it('should support all 14 languages', async () => {
      const languages = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      
      const result = await committeeReportsModule.generateCommitteeReports({
        languages
      });
      
      expect(result.articles.length).toBe(14);
    });
  });

  describe('Error Handling', () => {
    it('should return success false on MCP error', async () => {
      mockClientInstance.fetchCommitteeReports.mockRejectedValue(
        new Error('Network error')
      );
      
      const result = await committeeReportsModule.generateCommitteeReports({
        languages: ['en']
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should include error message in result', async () => {
      const errorMsg = 'MCP timeout';
      mockClientInstance.fetchCommitteeReports.mockRejectedValue(
        new Error(errorMsg)
      );
      
      const result = await committeeReportsModule.generateCommitteeReports({
        languages: ['en']
      });
      
      expect(result.error).toContain(errorMsg);
    });
  });

  describe('Integration with Writer', () => {
    it('should call writeArticle function if provided', async () => {
      const mockWriter = vi.fn();
      
      await committeeReportsModule.generateCommitteeReports({
        languages: ['en'],
        writeArticle: mockWriter
      });
      
      expect(mockWriter).toHaveBeenCalled();
    });

    it('should work without writeArticle function', async () => {
      const result = await committeeReportsModule.generateCommitteeReports({
        languages: ['en']
      });
      
      expect(result.success).toBe(true);
      expect(result.articles.length).toBe(1);
    });
  });
});
