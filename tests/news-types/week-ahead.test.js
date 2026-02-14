/**
 * Unit Tests for Week-Ahead Article Generation Module
 * 
 * Tests the scripts/news-types/week-ahead.js module including:
 * - Date range calculation
 * - Article generation with MCP integration
 * - Cross-reference validation
 * - Multi-language support
 * - Article structure validation
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

// Mock MCP client
const { mockClientInstance, mockCalendarEvents, MockMCPClient } = vi.hoisted(() => {
  const mockCalendarEvents = [
    { id: '1', title: 'Budget debate', date: '2026-02-16', type: 'chamber', organ: 'Kammaren' },
    { id: '2', title: 'Committee meeting', date: '2026-02-17', type: 'committee', organ: 'FiU' },
    { id: '3', title: 'Question time', date: '2026-02-18', type: 'chamber', organ: 'Kammaren' }
  ];
  
  const mockClientInstance = {
    fetchCalendarEvents: vi.fn().mockResolvedValue(mockCalendarEvents)
  };
  
  function MockMCPClient() {
    return mockClientInstance;
  }
  
  return { mockClientInstance, mockCalendarEvents, MockMCPClient };
});

vi.mock('../../scripts/mcp-client.js', () => ({
  MCPClient: MockMCPClient
}));

// Import the module under test
let weekAheadModule;

beforeAll(async () => {
  weekAheadModule = await import('../../scripts/news-types/week-ahead.js');
});

describe('Week-Ahead Article Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClientInstance.fetchCalendarEvents.mockResolvedValue(mockCalendarEvents);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should export REQUIRED_TOOLS constant', () => {
      expect(weekAheadModule.REQUIRED_TOOLS).toBeDefined();
      expect(Array.isArray(weekAheadModule.REQUIRED_TOOLS)).toBe(true);
      expect(weekAheadModule.REQUIRED_TOOLS.length).toBeGreaterThan(0);
    });

    it('should require calendar_events tool', () => {
      expect(weekAheadModule.REQUIRED_TOOLS).toContain('get_calendar_events');
    });

    it('should require search_dokument tool', () => {
      expect(weekAheadModule.REQUIRED_TOOLS).toContain('search_dokument');
    });

    it('should require fragor tool', () => {
      expect(weekAheadModule.REQUIRED_TOOLS).toContain('get_fragor');
    });

    it('should require interpellationer tool', () => {
      expect(weekAheadModule.REQUIRED_TOOLS).toContain('get_interpellationer');
    });
  });

  describe('Date Range Calculation', () => {
    it('should export getWeekAheadDateRange function', () => {
      expect(weekAheadModule.getWeekAheadDateRange).toBeDefined();
      expect(typeof weekAheadModule.getWeekAheadDateRange).toBe('function');
    });

    it('should return date range starting tomorrow', () => {
      const range = weekAheadModule.getWeekAheadDateRange();
      
      expect(range).toHaveProperty('start');
      expect(range).toHaveProperty('end');
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      expect(range.start).toBe(tomorrow.toISOString().split('T')[0]);
    });

    it('should return 7-day range', () => {
      const range = weekAheadModule.getWeekAheadDateRange();
      
      const startDate = new Date(range.start);
      const endDate = new Date(range.end);
      
      const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(7);
    });

    it('should return ISO date format (YYYY-MM-DD)', () => {
      const range = weekAheadModule.getWeekAheadDateRange();
      
      expect(range.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Data Collection', () => {
    it('should fetch calendar events for next 7 days', async () => {
      const result = await weekAheadModule.generateWeekAhead({
        languages: ['en']
      });
      
      expect(mockClientInstance.fetchCalendarEvents).toHaveBeenCalled();
      expect(result.mcpCalls).toBeDefined();
      expect(result.mcpCalls.some(call => call.tool === 'get_calendar_events')).toBe(true);
    });

    it('should pass correct date range to MCP client', async () => {
      await weekAheadModule.generateWeekAhead({ languages: ['en'] });
      
      const callArgs = mockClientInstance.fetchCalendarEvents.mock.calls[0];
      expect(callArgs).toBeDefined();
      expect(callArgs.length).toBe(2); // start, end dates
      
      // Verify dates are in correct format
      expect(callArgs[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(callArgs[1]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle MCP client errors gracefully', async () => {
      mockClientInstance.fetchCalendarEvents.mockRejectedValue(
        new Error('MCP server unavailable')
      );
      
      const result = await weekAheadModule.generateWeekAhead({
        languages: ['en']
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('MCP server unavailable');
    });

    it('should track MCP calls for validation', async () => {
      const result = await weekAheadModule.generateWeekAhead({
        languages: ['en']
      });
      
      expect(result.mcpCalls).toBeDefined();
      expect(Array.isArray(result.mcpCalls)).toBe(true);
      expect(result.mcpCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Article Structure', () => {
    it('should generate articles for all requested languages', async () => {
      const result = await weekAheadModule.generateWeekAhead({
        languages: ['en', 'sv', 'de']
      });
      
      expect(result.success).toBe(true);
      expect(result.files).toBe(3);
      expect(result.articles.length).toBe(3);
    });

    it('should generate EN version by default', async () => {
      const result = await weekAheadModule.generateWeekAhead();
      
      expect(result.articles).toBeDefined();
      expect(result.articles.some(a => a.lang === 'en')).toBe(true);
    });

    it('should generate SV version by default', async () => {
      const result = await weekAheadModule.generateWeekAhead();
      
      expect(result.articles).toBeDefined();
      expect(result.articles.some(a => a.lang === 'sv')).toBe(true);
    });

    it('should include correct slug format', async () => {
      const result = await weekAheadModule.generateWeekAhead({
        languages: ['en']
      });
      
      expect(result.slug).toMatch(/^\d{4}-\d{2}-\d{2}-week-ahead$/);
    });

    it('should generate HTML content for each language', async () => {
      const result = await weekAheadModule.generateWeekAhead({
        languages: ['en']
      });
      
      const article = result.articles[0];
      expect(article.html).toBeDefined();
      expect(typeof article.html).toBe('string');
      expect(article.html.length).toBeGreaterThan(0);
    });

    it('should include filename for each article', async () => {
      const result = await weekAheadModule.generateWeekAhead({
        languages: ['en']
      });
      
      const article = result.articles[0];
      expect(article.filename).toMatch(/\.html$/);
      expect(article.filename).toContain('-en.html');
    });
  });

  describe('Cross-Referencing', () => {
    it('should include cross-reference data in result', async () => {
      const result = await weekAheadModule.generateWeekAhead({
        languages: ['en']
      });
      
      expect(result.crossReferences).toBeDefined();
      expect(result.crossReferences.events).toBeDefined();
      expect(result.crossReferences.sources).toBeDefined();
    });

    it('should track calendar events count', async () => {
      const result = await weekAheadModule.generateWeekAhead({
        languages: ['en']
      });
      
      expect(result.crossReferences.events).toBe(mockCalendarEvents.length);
    });

    it('should list data sources used', async () => {
      const result = await weekAheadModule.generateWeekAhead({
        languages: ['en']
      });
      
      expect(result.crossReferences.sources).toContain('calendar_events');
    });
  });

  describe('Validation Functions', () => {
    it('should export validateWeekAhead function', () => {
      expect(weekAheadModule.validateWeekAhead).toBeDefined();
      expect(typeof weekAheadModule.validateWeekAhead).toBe('function');
    });

    it('should validate article has calendar events', () => {
      const article = {
        content: 'This week we have several calendar events scheduled.',
        sources: ['calendar_events']
      };
      
      const validation = weekAheadModule.validateWeekAhead(article);
      expect(validation.hasCalendarEvents).toBe(true);
    });

    it('should check for minimum sources', () => {
      const article = {
        content: 'Article content',
        sources: ['source1', 'source2', 'source3']
      };
      
      const validation = weekAheadModule.validateWeekAhead(article);
      expect(validation.hasMinimumSources).toBe(true);
    });

    it('should check for prospective tone', () => {
      const article = {
        content: 'Next week the parliament will debate the budget.',
        sources: ['calendar_events']
      };
      
      const validation = weekAheadModule.validateWeekAhead(article);
      expect(validation.hasProspectiveTone).toBe(true);
    });

    it('should check daily coverage', () => {
      const article = {
        content: 'Coverage for the week',
        sources: ['calendar_events']
      };
      
      const validation = weekAheadModule.validateWeekAhead(article);
      expect(validation.hasAllDaysOfWeek).toBeDefined();
    });
  });

  describe('Multi-Language Support', () => {
    it('should support all 14 languages', async () => {
      const languages = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      
      const result = await weekAheadModule.generateWeekAhead({
        languages
      });
      
      expect(result.articles.length).toBe(14);
      languages.forEach(lang => {
        expect(result.articles.some(a => a.lang === lang)).toBe(true);
      });
    });

    it('should generate language-specific titles', async () => {
      const result = await weekAheadModule.generateWeekAhead({
        languages: ['en', 'sv']
      });
      
      const enArticle = result.articles.find(a => a.lang === 'en');
      const svArticle = result.articles.find(a => a.lang === 'sv');
      
      expect(enArticle.html).toContain('Week Ahead');
      expect(svArticle.html).toContain('Vecka Framåt');
    });

    it('should handle RTL languages (ar, he)', async () => {
      const result = await weekAheadModule.generateWeekAhead({
        languages: ['ar', 'he']
      });
      
      expect(result.articles.length).toBe(2);
      expect(result.articles.some(a => a.lang === 'ar')).toBe(true);
      expect(result.articles.some(a => a.lang === 'he')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return success false on MCP error', async () => {
      mockClientInstance.fetchCalendarEvents.mockRejectedValue(
        new Error('Network error')
      );
      
      const result = await weekAheadModule.generateWeekAhead({
        languages: ['en']
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should include error message in result', async () => {
      const errorMsg = 'MCP timeout';
      mockClientInstance.fetchCalendarEvents.mockRejectedValue(
        new Error(errorMsg)
      );
      
      const result = await weekAheadModule.generateWeekAhead({
        languages: ['en']
      });
      
      expect(result.error).toContain(errorMsg);
    });

    it('should still return mcpCalls on error', async () => {
      mockClientInstance.fetchCalendarEvents.mockRejectedValue(
        new Error('Error')
      );
      
      const result = await weekAheadModule.generateWeekAhead({
        languages: ['en']
      });
      
      expect(result.mcpCalls).toBeDefined();
      expect(Array.isArray(result.mcpCalls)).toBe(true);
    });
  });

  describe('Integration with Writer', () => {
    it('should call writeArticle function if provided', async () => {
      const mockWriter = vi.fn();
      
      await weekAheadModule.generateWeekAhead({
        languages: ['en'],
        writeArticle: mockWriter
      });
      
      expect(mockWriter).toHaveBeenCalled();
    });

    it('should pass html and filename to writer', async () => {
      const mockWriter = vi.fn();
      
      await weekAheadModule.generateWeekAhead({
        languages: ['en'],
        writeArticle: mockWriter
      });
      
      expect(mockWriter).toHaveBeenCalledWith(
        expect.any(String), // html
        expect.stringMatching(/\.html$/) // filename
      );
    });

    it('should work without writeArticle function', async () => {
      const result = await weekAheadModule.generateWeekAhead({
        languages: ['en']
      });
      
      expect(result.success).toBe(true);
      expect(result.articles.length).toBe(1);
    });
  });
});
