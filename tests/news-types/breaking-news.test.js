/**
 * Unit Tests for Breaking News Article Generation Module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockClientInstance, MockMCPClient } = vi.hoisted(() => {
  const mockClientInstance = {
    searchVoteringar: vi.fn().mockResolvedValue([]),
    searchAnforanden: vi.fn().mockResolvedValue([])
  };
  
  function MockMCPClient() {
    return mockClientInstance;
  }
  
  return { mockClientInstance, MockMCPClient };
});

vi.mock('../../scripts/mcp-client.js', () => ({
  MCPClient: MockMCPClient
}));

let breakingNewsModule;

beforeAll(async () => {
  breakingNewsModule = await import('../../scripts/news-types/breaking-news.js');
});

describe('Breaking News Article Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should export REQUIRED_TOOLS constant', () => {
      expect(breakingNewsModule.REQUIRED_TOOLS).toBeDefined();
      expect(breakingNewsModule.REQUIRED_TOOLS).toContain('search_voteringar');
      expect(breakingNewsModule.REQUIRED_TOOLS).toContain('get_voting_group');
    });
  });

  describe('Event-Driven Generation', () => {
    it('should require event data', async () => {
      const result = await breakingNewsModule.generateBreakingNews({
        languages: ['en']
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('requires event context');
    });

    it('should generate with event data', async () => {
      const eventData = {
        voteId: 'v123',
        topic: 'Budget vote',
        slug: 'budget-vote'
      };
      
      const result = await breakingNewsModule.generateBreakingNews({
        languages: ['en'],
        eventData
      });
      
      expect(result.success).toBe(true);
      expect(result.articles.length).toBe(1);
    });

    it('should fetch votes if voteId provided', async () => {
      const eventData = {
        voteId: 'v123',
        slug: 'test'
      };
      
      await breakingNewsModule.generateBreakingNews({
        languages: ['en'],
        eventData
      });
      
      expect(mockClientInstance.searchVoteringar).toHaveBeenCalled();
    });

    it('should fetch speeches if topic provided', async () => {
      const eventData = {
        topic: 'Budget debate',
        slug: 'test'
      };
      
      await breakingNewsModule.generateBreakingNews({
        languages: ['en'],
        eventData
      });
      
      expect(mockClientInstance.searchAnforanden).toHaveBeenCalled();
    });
  });

  describe('Article Structure', () => {
    it('should generate breaking news slug', async () => {
      const eventData = {
        slug: 'urgent-vote',
        topic: 'test'
      };
      
      const result = await breakingNewsModule.generateBreakingNews({
        languages: ['en'],
        eventData
      });
      
      expect(result.slug).toMatch(/breaking-urgent-vote$/);
    });

    it('should generate for multiple languages', async () => {
      const eventData = {
        slug: 'test',
        topic: 'test'
      };
      
      const result = await breakingNewsModule.generateBreakingNews({
        languages: ['en', 'sv', 'de'],
        eventData
      });
      
      expect(result.articles.length).toBe(3);
    });
  });

  describe('Validation', () => {
    it('should export validateBreakingNews function', () => {
      expect(breakingNewsModule.validateBreakingNews).toBeDefined();
    });

    it('should validate breaking event content', () => {
      const article = {
        content: 'Breaking development: Parliament votes on critical bill today.',
        sources: ['voteringar', 'anforanden', 'ledamoter']
      };
      
      const validation = breakingNewsModule.validateBreakingNews(article);
      expect(validation.hasBreakingEvent).toBe(true);
      expect(validation.hasMinimumSources).toBe(true);
    });

    it('should check for timeliness', () => {
      const article = {
        content: 'Breaking news just now: Vote results announced.',
        sources: ['voteringar']
      };
      
      const validation = breakingNewsModule.validateBreakingNews(article);
      expect(validation.hasTimeliness).toBe(true);
    });
  });

  describe('Multi-Language', () => {
    it('should generate language-specific titles', async () => {
      const eventData = {
        slug: 'test',
        topic: 'test'
      };
      
      const result = await breakingNewsModule.generateBreakingNews({
        languages: ['en', 'sv'],
        eventContext: 'Critical Vote',
        eventData
      });
      
      const enArticle = result.articles.find(a => a.lang === 'en');
      const svArticle = result.articles.find(a => a.lang === 'sv');
      
      expect(enArticle.html).toContain('Breaking');
      expect(svArticle.html).toContain('Senaste nytt');
    });
  });
});
