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
  fetchCommitteeReports: Mock<(limit?: number, rm?: string | null, organ?: string | null) => Promise<unknown[]>>;
  fetchPropositions: Mock<(limit?: number, rm?: string | null) => Promise<unknown[]>>;
  fetchMotions: Mock<(limit?: number, rm?: string | null) => Promise<unknown[]>>;
  fetchDocumentDetails: Mock<(dokId: string, full?: boolean) => Promise<Record<string, unknown>>>;
  searchSpeeches: Mock<(params: Record<string, unknown>) => Promise<unknown[]>>;
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
  hasPartyRankings: boolean;
  hasLegislativeEfficiency: boolean;
  hasMonthInNumbers: boolean;
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
    searchDocuments: vi.fn().mockResolvedValue(mockDocuments) as MockMCPClientShape['searchDocuments'],
    fetchCommitteeReports: vi.fn().mockResolvedValue([]) as MockMCPClientShape['fetchCommitteeReports'],
    fetchPropositions: vi.fn().mockResolvedValue([]) as MockMCPClientShape['fetchPropositions'],
    fetchMotions: vi.fn().mockResolvedValue([]) as MockMCPClientShape['fetchMotions'],
    fetchDocumentDetails: vi.fn().mockResolvedValue({}) as MockMCPClientShape['fetchDocumentDetails'],
    searchSpeeches: vi.fn().mockResolvedValue([]) as MockMCPClientShape['searchSpeeches'],
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
    mockClientInstance.fetchCommitteeReports.mockResolvedValue([]);
    mockClientInstance.fetchPropositions.mockResolvedValue([]);
    mockClientInstance.fetchMotions.mockResolvedValue([]);
    mockClientInstance.fetchDocumentDetails.mockResolvedValue({});
    mockClientInstance.searchSpeeches.mockResolvedValue([]);
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

    it('should require enrichment tools', () => {
      expect(monthlyReviewModule.REQUIRED_TOOLS).toContain('get_dokument_innehall');
      expect(monthlyReviewModule.REQUIRED_TOOLS).toContain('search_anforanden');
      expect(monthlyReviewModule.REQUIRED_TOOLS).toContain('get_betankanden');
      expect(monthlyReviewModule.REQUIRED_TOOLS).toContain('get_propositioner');
      expect(monthlyReviewModule.REQUIRED_TOOLS).toContain('get_motioner');
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

  describe('Monthly Enhancements', () => {
    it('should include Month in Numbers section in generated articles', async () => {
      const result = await monthlyReviewModule.generateMonthlyReview({
        languages: ['en']
      });

      expect(result.success).toBe(true);
      const article = result.articles[0];
      expect(article).toBeDefined();
      // Month in Numbers section should appear when documents are present
      expect(article!.html).toContain('Month in Numbers');
    });

    it('should include Legislative Efficiency section in generated articles', async () => {
      const result = await monthlyReviewModule.generateMonthlyReview({
        languages: ['en']
      });

      expect(result.success).toBe(true);
      const article = result.articles[0];
      expect(article).toBeDefined();
      expect(article!.html).toContain('Legislative Efficiency');
    });

    it('should include Strategic Outlook section in generated articles', async () => {
      const result = await monthlyReviewModule.generateMonthlyReview({
        languages: ['en']
      });

      expect(result.success).toBe(true);
      const article = result.articles[0];
      expect(article).toBeDefined();
      expect(article!.html).toContain('Strategic Outlook');
    });

    it('should generate Swedish-language monthly sections', async () => {
      const result = await monthlyReviewModule.generateMonthlyReview({
        languages: ['sv']
      });

      expect(result.success).toBe(true);
      const article = result.articles[0];
      expect(article).toBeDefined();
      expect(article!.html).toContain('Månaden i siffror');
      expect(article!.html).toContain('Lagstiftningseffektivitet');
      expect(article!.html).toContain('Strategisk utsikt');
    });

    it('should validate new section fields in validateMonthlyReview', () => {
      const article: ArticleInput = {
        content: 'Month in Numbers review. Committee reports throughput. Party Performance Rankings. Legislative Efficiency. Strategic Outlook trend analysis completed.',
        sources: ['s1', 's2', 's3']
      };

      const result = monthlyReviewModule.validateMonthlyReview(article);
      expect(result.hasMonthInNumbers).toBe(true);
      expect(result.hasLegislativeEfficiency).toBe(true);
      expect(result.hasPartyRankings).toBe(true);
    });

    it('should fetch previous months for trend analysis (3 searchDocuments calls)', async () => {
      await monthlyReviewModule.generateMonthlyReview({
        languages: ['en']
      });

      // Exactly 3 calls: current month + previous month + 2-months-ago
      expect(mockClientInstance.searchDocuments.mock.calls.length).toBe(3);
    });

    it('should render Party Performance Rankings when party data is available', async () => {
      // Provide documents with doktyp + parti so the party aggregation fires
      const docsWithParty = [
        { id: 'mot-1', title: 'Motion om bostäder', date: '2026-02-01', type: 'mot', doktyp: 'mot', parti: 'S' },
        { id: 'mot-2', title: 'Motion om skatter', date: '2026-02-05', type: 'mot', doktyp: 'mot', parti: 'M' },
        { id: 'mot-3', title: 'Motion om klimat', date: '2026-02-10', type: 'mot', doktyp: 'mot', parti: 'S' },
      ] as unknown as SearchDocument[];
      mockClientInstance.searchDocuments.mockResolvedValue(docsWithParty);
      mockClientInstance.searchSpeeches.mockResolvedValue([
        { parti: 'M', talare: 'Speaker A', anforandetext: 'Text' },
        { parti: 'SD', talare: 'Speaker B', anforandetext: 'Text' },
      ]);

      const result = await monthlyReviewModule.generateMonthlyReview({
        languages: ['en']
      });

      expect(result.success).toBe(true);
      const article = result.articles[0];
      expect(article).toBeDefined();
      expect(article!.html).toContain('Party Performance Rankings');
    });
  });
});
