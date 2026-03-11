/**
 * Unit Tests for Breaking News Article Generation Module
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import type { GeneratedArticle, GenerationResult, BreakingEventData } from '../../scripts/types/article.js';
import type { Language } from '../../scripts/types/language.js';

/** Mock MCP client shape for breaking news */
interface MockMCPClientShape {
  fetchVotingRecords: Mock<(...args: unknown[]) => Promise<unknown[]>>;
  searchSpeeches: Mock<(...args: unknown[]) => Promise<unknown[]>>;
  fetchVotingGroup: Mock<(...args: unknown[]) => Promise<unknown[]>>;
  fetchMPs: Mock<(...args: unknown[]) => Promise<unknown[]>>;
}

/** Validation input */
interface ArticleInput {
  content?: string;
  sources?: string[];
  [key: string]: unknown;
}

/** Breaking news validation result */
interface BreakingNewsValidationResult {
  hasBreakingEvent: boolean;
  hasMinimumSources: boolean;
  hasTimeliness: boolean;
  hasImpactAnalysis: boolean;
  passed: boolean;
}

/** Shape of the dynamically imported breaking-news module */
interface BreakingNewsModule {
  readonly REQUIRED_TOOLS: readonly string[];
  readonly generateBreakingNews: (options?: {
    languages?: Language[];
    eventContext?: string;
    eventData?: BreakingEventData | null;
    writeArticle?: ((html: string, filename: string) => void) | null;
  }) => Promise<GenerationResult>;
  readonly validateBreakingNews: (article: ArticleInput) => BreakingNewsValidationResult;
}

const { mockClientInstance, MockMCPClient } = vi.hoisted(() => {
  const mockClientInstance: MockMCPClientShape = {
    fetchVotingRecords: vi.fn().mockResolvedValue([]) as MockMCPClientShape['fetchVotingRecords'],
    searchSpeeches: vi.fn().mockResolvedValue([]) as MockMCPClientShape['searchSpeeches'],
    fetchVotingGroup: vi.fn().mockResolvedValue([]) as MockMCPClientShape['fetchVotingGroup'],
    fetchMPs: vi.fn().mockResolvedValue([]) as MockMCPClientShape['fetchMPs']
  };
  
  function MockMCPClient(): MockMCPClientShape {
    return mockClientInstance;
  }
  
  return { mockClientInstance, MockMCPClient };
});

vi.mock('../../scripts/mcp-client.js', () => ({
  MCPClient: MockMCPClient
}));

let breakingNewsModule: BreakingNewsModule;

beforeAll(async () => {
  breakingNewsModule = await import('../../scripts/news-types/breaking-news.js') as unknown as BreakingNewsModule;
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
      const eventData: BreakingEventData = {
        voteId: 'v123',
        topic: 'Budget vote',
        slug: 'budget-vote'
      };
      
      const result = await breakingNewsModule.generateBreakingNews({
        languages: ['en'],
        eventData
      });
      
      expect(result.success).toBe(true);
      expect(result.articles!.length).toBe(1);
    });

    it('should fetch votes if voteId provided', async () => {
      const eventData: BreakingEventData = {
        voteId: 'v123',
        slug: 'test'
      };
      
      await breakingNewsModule.generateBreakingNews({
        languages: ['en'],
        eventData
      });
      
      expect(mockClientInstance.fetchVotingRecords).toHaveBeenCalled();
    });

    it('should fetch speeches if topic provided', async () => {
      const eventData: BreakingEventData = {
        topic: 'Budget debate',
        slug: 'test'
      };
      
      await breakingNewsModule.generateBreakingNews({
        languages: ['en'],
        eventData
      });
      
      expect(mockClientInstance.searchSpeeches).toHaveBeenCalled();
    });

    it('should always fetch voting group (enriched with voteId when provided)', async () => {
      const eventData: BreakingEventData = {
        voteId: 'v123',
        slug: 'test'
      };
      
      await breakingNewsModule.generateBreakingNews({
        languages: ['en'],
        eventData
      });
      
      expect(mockClientInstance.fetchVotingGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          punkt: eventData.voteId,
          groupBy: 'parti'
        })
      );
    });

    it('should always fetch MP profiles (enriched with speaker name from speech results)', async () => {
      const eventData: BreakingEventData = {
        topic: 'Budget debate',
        slug: 'test'
      };

      const mockSpeakerName = 'Jane Doe';
      mockClientInstance.searchSpeeches.mockResolvedValueOnce([
        { talare: mockSpeakerName } as unknown as Record<string, unknown>
      ]);
      
      await breakingNewsModule.generateBreakingNews({
        languages: ['en'],
        eventData
      });
      
      expect(mockClientInstance.fetchMPs).toHaveBeenCalledWith(
        expect.objectContaining({
          namn: mockSpeakerName,
          limit: 1
        })
      );
    });

    it('should call all 4 required tools even with minimal event data', async () => {
      const eventData: BreakingEventData = {
        slug: 'test'
      };

      await breakingNewsModule.generateBreakingNews({
        languages: ['en'],
        eventData
      });

      expect(mockClientInstance.fetchVotingRecords).toHaveBeenCalled();
      expect(mockClientInstance.fetchVotingGroup).toHaveBeenCalled();
      expect(mockClientInstance.searchSpeeches).toHaveBeenCalled();
      expect(mockClientInstance.fetchMPs).toHaveBeenCalled();
    });
  });

  describe('Article Structure', () => {
    it('should generate breaking news slug', async () => {
      const eventData: BreakingEventData = {
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
      const eventData: BreakingEventData = {
        slug: 'test',
        topic: 'test'
      };
      
      const result = await breakingNewsModule.generateBreakingNews({
        languages: ['en', 'sv', 'de'],
        eventData
      });
      
      expect(result.articles!.length).toBe(3);
    });
  });

  describe('Validation', () => {
    it('should export validateBreakingNews function', () => {
      expect(breakingNewsModule.validateBreakingNews).toBeDefined();
    });

    it('should validate breaking event content', () => {
      const article: ArticleInput = {
        content: 'Breaking development: Parliament votes on critical bill today.',
        sources: ['voteringar', 'anforanden', 'ledamoter']
      };
      
      const validation = breakingNewsModule.validateBreakingNews(article);
      expect(validation.hasBreakingEvent).toBe(true);
      expect(validation.hasMinimumSources).toBe(true);
    });

    it('should check for timeliness', () => {
      const article: ArticleInput = {
        content: 'Breaking news just now: Vote results announced.',
        sources: ['voteringar']
      };
      
      const validation = breakingNewsModule.validateBreakingNews(article);
      expect(validation.hasTimeliness).toBe(true);
    });
  });

  describe('Multi-Language', () => {
    it('should generate language-specific titles', async () => {
      const eventData: BreakingEventData = {
        slug: 'test',
        topic: 'test'
      };
      
      const result = await breakingNewsModule.generateBreakingNews({
        languages: ['en', 'sv'],
        eventContext: 'Critical Vote',
        eventData
      });
      
      const enArticle = result.articles!.find((a: GeneratedArticle) => a.lang === 'en');
      const svArticle = result.articles!.find((a: GeneratedArticle) => a.lang === 'sv');
      
      expect(enArticle!.html).toContain('Breaking');
      expect(svArticle!.html).toContain('Senaste nytt');
    });
  });
});
