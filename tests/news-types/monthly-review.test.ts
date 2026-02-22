/**
 * Unit Tests for Monthly Review Article Generation Module
 * 
 * Tests the scripts/news-types/monthly-review.ts module including:
 * - Document search (30-day lookback)
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

/** Monthly review validation result */
interface MonthlyReviewValidationResult {
  hasMonthlySummary: boolean;
  hasMinimumSources: boolean;
  hasRetrospectiveTone: boolean;
  hasTrendAnalysis: boolean;
  passed: boolean;
}

/** Extended generation result for monthly review */
interface MonthlyReviewGenerationResult extends Omit<GenerationResult, 'crossReferences' | 'articles'> {
  readonly articles: readonly GeneratedArticle[];
  readonly crossReferences: {
    readonly event: string;
    readonly sources: readonly string[];
  };
}

/** Shape of the dynamically imported monthly-review module */
interface MonthlyReviewModule {
  readonly REQUIRED_TOOLS: readonly string[];
  readonly generateMonthlyReview: (options?: {
    languages?: Language[];
    lookbackDays?: number;
    writeArticle?: (html: string, filename: string) => void;
  }) => Promise<MonthlyReviewGenerationResult>;
  readonly validateMonthlyReview: (article: ArticleInput) => MonthlyReviewValidationResult;
}

// Mock MCP client
const { mockClientInstance, mockDocuments, MockMCPClient } = vi.hoisted(() => {
  const mockDocuments: SearchDocument[] = [
    { id: 'doc-1', title: 'Monthly budget review', date: '2026-02-01', type: 'proposition' },
    { id: 'doc-2', title: 'Defense spending report', date: '2026-02-10', type: 'betankande' },
    { id: 'doc-3', title: 'Healthcare reform motion', date: '2026-02-15', type: 'motion' },
    { id: 'doc-4', title: 'Education policy decision', date: '2026-02-20', type: 'votering' }
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

let monthlyReviewModule: MonthlyReviewModule;

beforeAll(async () => {
  monthlyReviewModule = await import('../../scripts/news-types/monthly-review.js') as unknown as MonthlyReviewModule;
});

describe('Monthly Review Article Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClientInstance.searchDocuments.mockResolvedValue(mockDocuments);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should export REQUIRED_TOOLS constant', () => {
      expect(monthlyReviewModule.REQUIRED_TOOLS).toBeDefined();
      expect(Array.isArray(monthlyReviewModule.REQUIRED_TOOLS)).toBe(true);
      expect(monthlyReviewModule.REQUIRED_TOOLS.length).toBeGreaterThan(0);
    });

    it('should require search_dokument tool', () => {
      expect(monthlyReviewModule.REQUIRED_TOOLS).toContain('search_dokument');
    });
  });

  describe('Data Collection', () => {
    it('should fetch documents from MCP', async () => {
      const result = await monthlyReviewModule.generateMonthlyReview({
        languages: ['en']
      });

      expect(mockClientInstance.searchDocuments).toHaveBeenCalled();
      expect(result.mcpCalls!.some((call: MCPCallRecord) => call.tool === 'search_dokument')).toBe(true);
    });

    it('should handle empty documents', async () => {
      mockClientInstance.searchDocuments.mockResolvedValue([]);

      const result = await monthlyReviewModule.generateMonthlyReview({
        languages: ['en']
      });

      expect(result.success).toBe(true);
      expect(result.files).toBe(0);
    });
  });

  describe('Article Structure', () => {
    it('should generate articles for requested languages', async () => {
      const result = await monthlyReviewModule.generateMonthlyReview({
        languages: ['en', 'sv', 'de']
      });

      expect(result.success).toBe(true);
      expect(result.files).toBe(3);
      expect(result.articles.length).toBe(3);
    });

    it('should include correct slug format', async () => {
      const result = await monthlyReviewModule.generateMonthlyReview({
        languages: ['en']
      });

      expect(result.slug).toMatch(/^\d{4}-\d{2}-\d{2}-monthly-review$/);
    });
  });

  describe('Validation', () => {
    it('should export validateMonthlyReview function', () => {
      expect(monthlyReviewModule.validateMonthlyReview).toBeDefined();
      expect(typeof monthlyReviewModule.validateMonthlyReview).toBe('function');
    });

    it('should validate monthly review content', () => {
      const article: ArticleInput = {
        content: 'This month in retrospective review the parliament achieved and completed key decisions with increasing trend.',
        sources: ['source1', 'source2', 'source3']
      };

      const validation = monthlyReviewModule.validateMonthlyReview(article);
      expect(validation.hasMonthlySummary).toBe(true);
      expect(validation.hasRetrospectiveTone).toBe(true);
    });
  });

  describe('Multi-Language', () => {
    it('should generate language-specific titles', async () => {
      const result = await monthlyReviewModule.generateMonthlyReview({
        languages: ['en', 'sv']
      });

      const enArticle = result.articles.find((a: GeneratedArticle) => a.lang === 'en');
      const svArticle = result.articles.find((a: GeneratedArticle) => a.lang === 'sv');

      expect(enArticle!.html).toContain('Monthly Review');
      expect(svArticle!.html).toContain('Månadskrönika');
    });
  });

  describe('Error Handling', () => {
    it('should handle MCP errors', async () => {
      mockClientInstance.searchDocuments.mockRejectedValue(
        new Error('Network error')
      );

      const result = await monthlyReviewModule.generateMonthlyReview({
        languages: ['en']
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Integration with Writer', () => {
    it('should call writeArticle function if provided', async () => {
      const mockWriter = vi.fn();

      await monthlyReviewModule.generateMonthlyReview({
        languages: ['en'],
        writeArticle: mockWriter
      });

      expect(mockWriter).toHaveBeenCalled();
    });

    it('should work without writeArticle function', async () => {
      const result = await monthlyReviewModule.generateMonthlyReview({
        languages: ['en']
      });

      expect(result.success).toBe(true);
      expect(result.articles.length).toBe(1);
    });
  });
});
