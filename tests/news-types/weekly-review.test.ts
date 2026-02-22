/**
 * Unit Tests for Weekly Review Article Generation Module
 * 
 * Tests the scripts/news-types/weekly-review.ts module including:
 * - Document search (7-day lookback)
 * - Multi-language support
 * - Article structure validation
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import type { GeneratedArticle, GenerationResult, MCPCallRecord } from '../../scripts/types/article.js';
import type { Language } from '../../scripts/types/language.js';

/** Document from MCP server */
interface SearchDocument {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly type: string;
}

/** Mock MCP client shape */
interface MockMCPClientShape {
  searchDocuments: Mock<(params: Record<string, unknown>) => Promise<SearchDocument[]>>;
}

/** Validation input */
interface ArticleInput {
  content?: string;
  sources?: string[];
  [key: string]: unknown;
}

/** Weekly review validation result */
interface WeeklyReviewValidationResult {
  hasWeeklySummary: boolean;
  hasMinimumSources: boolean;
  hasRetrospectiveTone: boolean;
  hasKeyOutcomes: boolean;
  passed: boolean;
}

/** Extended generation result for weekly review */
interface WeeklyReviewGenerationResult extends Omit<GenerationResult, 'crossReferences' | 'articles'> {
  readonly articles: readonly GeneratedArticle[];
  readonly crossReferences: {
    readonly event: string;
    readonly sources: readonly string[];
  };
}

/** Shape of the dynamically imported weekly-review module */
interface WeeklyReviewModule {
  readonly REQUIRED_TOOLS: readonly string[];
  readonly generateWeeklyReview: (options?: {
    languages?: Language[];
    lookbackDays?: number;
    writeArticle?: (html: string, filename: string) => void;
  }) => Promise<WeeklyReviewGenerationResult>;
  readonly validateWeeklyReview: (article: ArticleInput) => WeeklyReviewValidationResult;
}

// Mock MCP client
const { mockClientInstance, mockDocuments, MockMCPClient } = vi.hoisted(() => {
  const mockDocuments: SearchDocument[] = [
    { id: 'doc-1', title: 'Budget vote results', date: '2026-02-18', type: 'votering' },
    { id: 'doc-2', title: 'Defense committee report', date: '2026-02-17', type: 'betankande' },
    { id: 'doc-3', title: 'Immigration motion', date: '2026-02-16', type: 'motion' }
  ];

  const mockClientInstance: MockMCPClientShape = {
    searchDocuments: vi.fn().mockResolvedValue(mockDocuments) as MockMCPClientShape['searchDocuments']
  };

  function MockMCPClient(): MockMCPClientShape {
    return mockClientInstance;
  }

  return { mockClientInstance, mockDocuments, MockMCPClient };
});

vi.mock('../../scripts/mcp-client.js', () => ({
  MCPClient: MockMCPClient
}));

let weeklyReviewModule: WeeklyReviewModule;

beforeAll(async () => {
  weeklyReviewModule = await import('../../scripts/news-types/weekly-review.js') as unknown as WeeklyReviewModule;
});

describe('Weekly Review Article Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClientInstance.searchDocuments.mockResolvedValue(mockDocuments);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should export REQUIRED_TOOLS constant', () => {
      expect(weeklyReviewModule.REQUIRED_TOOLS).toBeDefined();
      expect(Array.isArray(weeklyReviewModule.REQUIRED_TOOLS)).toBe(true);
      expect(weeklyReviewModule.REQUIRED_TOOLS.length).toBeGreaterThan(0);
    });

    it('should require search_dokument tool', () => {
      expect(weeklyReviewModule.REQUIRED_TOOLS).toContain('search_dokument');
    });
  });

  describe('Data Collection', () => {
    it('should fetch documents from MCP', async () => {
      const result = await weeklyReviewModule.generateWeeklyReview({
        languages: ['en']
      });

      expect(mockClientInstance.searchDocuments).toHaveBeenCalled();
      expect(result.mcpCalls!.some((call: MCPCallRecord) => call.tool === 'search_dokument')).toBe(true);
    });

    it('should handle empty documents', async () => {
      mockClientInstance.searchDocuments.mockResolvedValue([]);

      const result = await weeklyReviewModule.generateWeeklyReview({
        languages: ['en']
      });

      expect(result.success).toBe(true);
      expect(result.files).toBe(0);
    });
  });

  describe('Article Structure', () => {
    it('should generate articles for requested languages', async () => {
      const result = await weeklyReviewModule.generateWeeklyReview({
        languages: ['en', 'sv', 'de']
      });

      expect(result.success).toBe(true);
      expect(result.files).toBe(3);
      expect(result.articles.length).toBe(3);
    });

    it('should include correct slug format', async () => {
      const result = await weeklyReviewModule.generateWeeklyReview({
        languages: ['en']
      });

      expect(result.slug).toMatch(/^\d{4}-\d{2}-\d{2}-weekly-review$/);
    });
  });

  describe('Validation', () => {
    it('should export validateWeeklyReview function', () => {
      expect(weeklyReviewModule.validateWeeklyReview).toBeDefined();
      expect(typeof weeklyReviewModule.validateWeeklyReview).toBe('function');
    });

    it('should validate weekly review content', () => {
      const article: ArticleInput = {
        content: 'This week in review the parliament voted and concluded on the budget decision outcome.',
        sources: ['source1', 'source2', 'source3']
      };

      const validation = weeklyReviewModule.validateWeeklyReview(article);
      expect(validation.hasWeeklySummary).toBe(true);
      expect(validation.hasRetrospectiveTone).toBe(true);
    });
  });

  describe('Multi-Language', () => {
    it('should generate language-specific titles', async () => {
      const result = await weeklyReviewModule.generateWeeklyReview({
        languages: ['en', 'sv']
      });

      const enArticle = result.articles.find((a: GeneratedArticle) => a.lang === 'en');
      const svArticle = result.articles.find((a: GeneratedArticle) => a.lang === 'sv');

      expect(enArticle!.html).toContain('Weekly Review');
      expect(svArticle!.html).toContain('Veckans sammanfattning');
    });
  });

  describe('Error Handling', () => {
    it('should handle MCP errors', async () => {
      mockClientInstance.searchDocuments.mockRejectedValue(
        new Error('Network error')
      );

      const result = await weeklyReviewModule.generateWeeklyReview({
        languages: ['en']
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Integration with Writer', () => {
    it('should call writeArticle function if provided', async () => {
      const mockWriter = vi.fn();

      await weeklyReviewModule.generateWeeklyReview({
        languages: ['en'],
        writeArticle: mockWriter
      });

      expect(mockWriter).toHaveBeenCalled();
    });

    it('should work without writeArticle function', async () => {
      const result = await weeklyReviewModule.generateWeeklyReview({
        languages: ['en']
      });

      expect(result.success).toBe(true);
      expect(result.articles.length).toBe(1);
    });
  });
});
