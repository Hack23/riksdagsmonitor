/**
 * Unit Tests for Month-Ahead Article Generation Module
 * 
 * Tests the scripts/news-types/month-ahead.ts module including:
 * - Calendar events fetching (30-day horizon)
 * - Multi-language support
 * - Article structure validation
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import type { GeneratedArticle, GenerationResult, MCPCallRecord } from '../../scripts/types/article.js';
import type { Language } from '../../scripts/types/language.js';

/** Calendar event from MCP server */
interface CalendarEvent {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly type: string;
}

/** Mock MCP client shape */
interface MockMCPClientShape {
  fetchCalendarEvents: Mock<(from: string, tom: string) => Promise<CalendarEvent[]>>;
  searchDocuments: Mock<(params: Record<string, unknown>) => Promise<unknown[]>>;
  fetchCommitteeReports: Mock<(limit: number, rm: string | null) => Promise<unknown[]>>;
  fetchPropositions: Mock<(limit: number, rm: string | null) => Promise<unknown[]>>;
  fetchMotions: Mock<(limit: number, rm: string | null) => Promise<unknown[]>>;
}

/** Validation input */
interface ArticleInput {
  content?: string;
  sources?: string[];
  [key: string]: unknown;
}

/** Month-ahead validation result */
interface MonthAheadValidationResult {
  hasCalendarEvents: boolean;
  hasMinimumSources: boolean;
  hasForwardLookingTone: boolean;
  hasStrategicContext: boolean;
  hasLegislativePipeline: boolean;
  passed: boolean;
}

/** Extended generation result for month-ahead */
interface MonthAheadGenerationResult extends Omit<GenerationResult, 'crossReferences' | 'articles'> {
  readonly articles: readonly GeneratedArticle[];
  readonly crossReferences: {
    readonly event: string;
    readonly sources: readonly string[];
  };
}

/** Shape of the dynamically imported month-ahead module */
interface MonthAheadModule {
  readonly REQUIRED_TOOLS: readonly string[];
  readonly generateMonthAhead: (options?: {
    languages?: Language[];
    daysAhead?: number;
    writeArticle?: (html: string, filename: string) => void;
  }) => Promise<MonthAheadGenerationResult>;
  readonly validateMonthAhead: (article: ArticleInput) => MonthAheadValidationResult;
}

// Mock MCP client
const { mockClientInstance, mockCalendarEvents, MockMCPClient } = vi.hoisted(() => {
  const mockCalendarEvents: CalendarEvent[] = [
    { id: 'evt-1', title: 'Budget debate', date: '2026-03-01', type: 'plenum' },
    { id: 'evt-2', title: 'Committee hearing on defense', date: '2026-03-05', type: 'committee' },
    { id: 'evt-3', title: 'Government policy statement', date: '2026-03-10', type: 'government' }
  ];

  const mockClientInstance: MockMCPClientShape = {
    fetchCalendarEvents: vi.fn().mockResolvedValue(mockCalendarEvents) as MockMCPClientShape['fetchCalendarEvents'],
    searchDocuments: vi.fn().mockResolvedValue([]) as MockMCPClientShape['searchDocuments'],
    fetchCommitteeReports: vi.fn().mockResolvedValue([]) as MockMCPClientShape['fetchCommitteeReports'],
    fetchPropositions: vi.fn().mockResolvedValue([]) as MockMCPClientShape['fetchPropositions'],
    fetchMotions: vi.fn().mockResolvedValue([]) as MockMCPClientShape['fetchMotions'],
  };

  function MockMCPClient(): MockMCPClientShape {
    return mockClientInstance;
  }

  return { mockClientInstance, mockCalendarEvents, MockMCPClient };
});

vi.mock('../../scripts/mcp-client.js', () => ({
  MCPClient: MockMCPClient
}));

let monthAheadModule: MonthAheadModule;

beforeAll(async () => {
  monthAheadModule = await import('../../scripts/news-types/month-ahead.js') as unknown as MonthAheadModule;
});

describe('Month-Ahead Article Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClientInstance.fetchCalendarEvents.mockResolvedValue(mockCalendarEvents);
    mockClientInstance.searchDocuments.mockResolvedValue([]);
    mockClientInstance.fetchCommitteeReports.mockResolvedValue([]);
    mockClientInstance.fetchPropositions.mockResolvedValue([]);
    mockClientInstance.fetchMotions.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should export REQUIRED_TOOLS constant', () => {
      expect(monthAheadModule.REQUIRED_TOOLS).toBeDefined();
      expect(Array.isArray(monthAheadModule.REQUIRED_TOOLS)).toBe(true);
      expect(monthAheadModule.REQUIRED_TOOLS.length).toBeGreaterThan(0);
    });

    it('should require calendar events tool', () => {
      expect(monthAheadModule.REQUIRED_TOOLS).toContain('get_calendar_events');
    });

    it('should require search_dokument tool for document fallback', () => {
      expect(monthAheadModule.REQUIRED_TOOLS).toContain('search_dokument');
    });

    it('should require get_betankanden tool for committee pipeline', () => {
      expect(monthAheadModule.REQUIRED_TOOLS).toContain('get_betankanden');
    });

    it('should require get_propositioner tool for strategic outlook', () => {
      expect(monthAheadModule.REQUIRED_TOOLS).toContain('get_propositioner');
    });

    it('should require get_motioner tool for trend analysis', () => {
      expect(monthAheadModule.REQUIRED_TOOLS).toContain('get_motioner');
    });
  });

  describe('Data Collection', () => {
    it('should fetch calendar events from MCP', async () => {
      const result = await monthAheadModule.generateMonthAhead({
        languages: ['en']
      });

      expect(mockClientInstance.fetchCalendarEvents).toHaveBeenCalled();
      expect(result.mcpCalls!.some((call: MCPCallRecord) => call.tool === 'get_calendar_events')).toBe(true);
    });

    it('should fetch committee reports from MCP', async () => {
      const result = await monthAheadModule.generateMonthAhead({
        languages: ['en']
      });

      expect(mockClientInstance.fetchCommitteeReports).toHaveBeenCalled();
      expect(result.mcpCalls!.some((call: MCPCallRecord) => call.tool === 'get_betankanden')).toBe(true);
    });

    it('should fetch propositions from MCP', async () => {
      const result = await monthAheadModule.generateMonthAhead({
        languages: ['en']
      });

      expect(mockClientInstance.fetchPropositions).toHaveBeenCalled();
      expect(result.mcpCalls!.some((call: MCPCallRecord) => call.tool === 'get_propositioner')).toBe(true);
    });

    it('should fetch motions from MCP', async () => {
      const result = await monthAheadModule.generateMonthAhead({
        languages: ['en']
      });

      expect(mockClientInstance.fetchMotions).toHaveBeenCalled();
      expect(result.mcpCalls!.some((call: MCPCallRecord) => call.tool === 'get_motioner')).toBe(true);
    });

    it('should handle empty calendar events', async () => {
      mockClientInstance.fetchCalendarEvents.mockResolvedValue([]);

      const result = await monthAheadModule.generateMonthAhead({
        languages: ['en']
      });

      expect(result.success).toBe(true);
      expect(result.files).toBe(0);
    });

    it('should generate article when calendar is empty but pipeline data is present', async () => {
      mockClientInstance.fetchCalendarEvents.mockResolvedValue([]);
      mockClientInstance.searchDocuments.mockResolvedValue([]);
      mockClientInstance.fetchPropositions.mockResolvedValue([
        { titel: 'Proposition on climate policy', organ: 'MN', parti: 'MP' },
        { titel: 'Tax reform bill', organ: 'FiU', parti: 'M' }
      ]);

      const result = await monthAheadModule.generateMonthAhead({
        languages: ['en']
      });

      expect(result.success).toBe(true);
      expect(result.files).toBeGreaterThan(0);
      const enArticle = result.articles.find((a: GeneratedArticle) => a.lang === 'en');
      expect(enArticle!.html).toContain('Strategic Legislative Outlook');
    });
  });

  describe('Article Structure', () => {
    it('should generate articles for requested languages', async () => {
      const result = await monthAheadModule.generateMonthAhead({
        languages: ['en', 'sv', 'de']
      });

      expect(result.success).toBe(true);
      expect(result.files).toBe(3);
      expect(result.articles.length).toBe(3);
    });

    it('should include correct slug format', async () => {
      const result = await monthAheadModule.generateMonthAhead({
        languages: ['en']
      });

      expect(result.slug).toMatch(/^\d{4}-\d{2}-\d{2}-month-ahead$/);
    });
  });

  describe('Validation', () => {
    it('should export validateMonthAhead function', () => {
      expect(monthAheadModule.validateMonthAhead).toBeDefined();
      expect(typeof monthAheadModule.validateMonthAhead).toBe('function');
    });

    it('should validate month-ahead content', () => {
      const article: ArticleInput = {
        content: 'Upcoming calendar events scheduled for the strategic outlook and agenda milestone.',
        sources: ['source1', 'source2', 'source3']
      };

      const validation = monthAheadModule.validateMonthAhead(article);
      expect(validation.hasCalendarEvents).toBe(true);
      expect(validation.hasForwardLookingTone).toBe(true);
    });

    it('should include hasLegislativePipeline in validation result', () => {
      const article: ArticleInput = {
        content: '<h2>Strategic Legislative Outlook</h2><p>Committee pipeline report proposition motion scheduled for next month.</p>',
        sources: ['source1', 'source2', 'source3']
      };

      const validation = monthAheadModule.validateMonthAhead(article);
      expect(validation).toHaveProperty('hasLegislativePipeline');
      expect(validation.hasLegislativePipeline).toBe(true);
    });
  });

  describe('Multi-Language', () => {
    it('should generate language-specific titles', async () => {
      const result = await monthAheadModule.generateMonthAhead({
        languages: ['en', 'sv']
      });

      const enArticle = result.articles.find((a: GeneratedArticle) => a.lang === 'en');
      const svArticle = result.articles.find((a: GeneratedArticle) => a.lang === 'sv');

      expect(enArticle!.html).toContain('Month Ahead');
      expect(svArticle!.html).toContain('Månaden framåt');
    });
  });

  describe('Error Handling', () => {
    it('should handle MCP errors', async () => {
      mockClientInstance.fetchCalendarEvents.mockRejectedValue(
        new Error('Network error')
      );

      const result = await monthAheadModule.generateMonthAhead({
        languages: ['en']
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Integration with Writer', () => {
    it('should call writeArticle function if provided', async () => {
      const mockWriter = vi.fn();

      await monthAheadModule.generateMonthAhead({
        languages: ['en'],
        writeArticle: mockWriter
      });

      expect(mockWriter).toHaveBeenCalled();
    });

    it('should work without writeArticle function', async () => {
      const result = await monthAheadModule.generateMonthAhead({
        languages: ['en']
      });

      expect(result.success).toBe(true);
      expect(result.articles.length).toBe(1);
    });
  });
});
