/**
 * Unit Tests for Motions Article Generation Module
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import type { GeneratedArticle, GenerationResult, MCPCallRecord } from '../../scripts/types/article.js';
import type { Language } from '../../scripts/types/language.js';

/** Motion record from MCP server */
interface MotionRecord {
  readonly id: string;
  readonly title: string;
  readonly party: string;
  readonly date: string;
}

/** Mock MCP client shape */
interface MockMCPClientShape {
  fetchMotions: Mock<(limit: number) => Promise<MotionRecord[]>>;
  request: Mock<(tool: string, params: Record<string, unknown>) => Promise<Record<string, unknown>>>;
  searchSpeeches: Mock<(params: Record<string, unknown>) => Promise<unknown[]>>;
}

/** Validation input */
interface ArticleInput {
  content?: string;
  sources?: string[];
  [key: string]: unknown;
}

/** Motions validation result */
interface MotionsValidationResult {
  hasMotions: boolean;
  hasMinimumSources: boolean;
  hasOppositionAnalysis: boolean;
  passed: boolean;
}

/** Shape of the dynamically imported motions module */
interface MotionsModule {
  readonly REQUIRED_TOOLS: readonly string[];
  readonly generateMotions: (options?: {
    languages?: Language[];
    limit?: number;
    writeArticle?: (html: string, filename: string) => void;
  }) => Promise<GenerationResult>;
  readonly validateMotions: (article: ArticleInput) => MotionsValidationResult;
}

const { mockClientInstance, mockMotions, MockMCPClient } = vi.hoisted(() => {
  const mockMotions: MotionRecord[] = [
    { id: 'mot-1', title: 'Motion on climate', party: 'MP', date: '2026-02-15' },
    { id: 'mot-2', title: 'Motion on defense', party: 'SD', date: '2026-02-14' }
  ];
  
  const mockClientInstance: MockMCPClientShape = {
    fetchMotions: vi.fn().mockResolvedValue(mockMotions) as MockMCPClientShape['fetchMotions'],
    request: vi.fn().mockResolvedValue({}) as MockMCPClientShape['request'],
    searchSpeeches: vi.fn().mockResolvedValue([]) as MockMCPClientShape['searchSpeeches'],
  };
  
  function MockMCPClient(): MockMCPClientShape {
    return mockClientInstance;
  }
  
  return { mockClientInstance, mockMotions, MockMCPClient };
});

vi.mock('../../scripts/mcp-client.js', () => ({
  MCPClient: MockMCPClient
}));

let motionsModule: MotionsModule;

beforeAll(async () => {
  motionsModule = await import('../../scripts/news-types/motions.js') as unknown as MotionsModule;
});

describe('Motions Article Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClientInstance.fetchMotions.mockResolvedValue(mockMotions);
    mockClientInstance.request.mockResolvedValue({});
    mockClientInstance.searchSpeeches.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should export REQUIRED_TOOLS constant', () => {
      expect(motionsModule.REQUIRED_TOOLS).toBeDefined();
      expect(motionsModule.REQUIRED_TOOLS).toContain('get_motioner');
    });

    it('should include all four required tools', () => {
      expect(motionsModule.REQUIRED_TOOLS).toContain('get_motioner');
      expect(motionsModule.REQUIRED_TOOLS).toContain('search_dokument_fulltext');
      expect(motionsModule.REQUIRED_TOOLS).toContain('analyze_g0v_by_department');
      expect(motionsModule.REQUIRED_TOOLS).toContain('search_anforanden');
      expect(motionsModule.REQUIRED_TOOLS).toHaveLength(4);
    });
  });

  describe('Data Collection', () => {
    it('should fetch motions from MCP', async () => {
      const result = await motionsModule.generateMotions({
        languages: ['en']
      });
      
      expect(mockClientInstance.fetchMotions).toHaveBeenCalled();
      expect(result.mcpCalls!.some((call: MCPCallRecord) => call.tool === 'get_motioner')).toBe(true);
    });

    it('should call search_dokument_fulltext when motions have titles', async () => {
      await motionsModule.generateMotions({ languages: ['en'] });
      expect(mockClientInstance.request).toHaveBeenCalledWith(
        'search_dokument_fulltext',
        expect.objectContaining({ query: expect.any(String), limit: 3 })
      );
    });

    it('should call analyze_g0v_by_department', async () => {
      await motionsModule.generateMotions({ languages: ['en'] });
      expect(mockClientInstance.request).toHaveBeenCalledWith(
        'analyze_g0v_by_department',
        expect.objectContaining({ dateFrom: expect.any(String), dateTo: expect.any(String) })
      );
    });

    it('should call search_anforanden for debate context', async () => {
      await motionsModule.generateMotions({ languages: ['en'] });
      expect(mockClientInstance.searchSpeeches).toHaveBeenCalledWith(
        expect.objectContaining({ text: expect.any(String), limit: 10 })
      );
    });

    it('should record all tool calls in mcpCalls', async () => {
      const result = await motionsModule.generateMotions({ languages: ['en'] });
      const toolNames = result.mcpCalls!.map((c: MCPCallRecord) => c.tool);
      expect(toolNames).toContain('get_motioner');
      expect(toolNames).toContain('search_dokument_fulltext');
      expect(toolNames).toContain('analyze_g0v_by_department');
      expect(toolNames).toContain('search_anforanden');
    });

    it('should handle empty motions', async () => {
      mockClientInstance.fetchMotions.mockResolvedValue([]);
      
      const result = await motionsModule.generateMotions({
        languages: ['en']
      });
      
      expect(result.success).toBe(true);
      expect(result.files).toBe(0);
    });

    it('should degrade gracefully when search_dokument_fulltext fails', async () => {
      mockClientInstance.request.mockRejectedValueOnce(new Error('Tool unavailable'));
      const result = await motionsModule.generateMotions({ languages: ['en'] });
      expect(result.success).toBe(true);
    });

    it('should degrade gracefully when analyze_g0v_by_department fails', async () => {
      // First request call (search_dokument_fulltext) succeeds; second (analyze_g0v_by_department) fails
      mockClientInstance.request
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Tool unavailable'));
      const result = await motionsModule.generateMotions({ languages: ['en'] });
      expect(result.success).toBe(true);
    });

    it('should degrade gracefully when search_anforanden fails', async () => {
      mockClientInstance.searchSpeeches.mockRejectedValueOnce(new Error('Tool unavailable'));
      const result = await motionsModule.generateMotions({ languages: ['en'] });
      expect(result.success).toBe(true);
    });
  });

  describe('Article Structure', () => {
    it('should generate articles for requested languages', async () => {
      const result = await motionsModule.generateMotions({
        languages: ['en', 'sv']
      });
      
      expect(result.articles!.length).toBe(2);
    });

    it('should include correct slug format', async () => {
      const result = await motionsModule.generateMotions({
        languages: ['en']
      });
      
      expect(result.slug).toMatch(/opposition-motions$/);
    });

    it('should include all four tool names in sources', async () => {
      const result = await motionsModule.generateMotions({ languages: ['en'] });
      // Verify the crossReferences.sources reflect the enriched pipeline
      expect(result.crossReferences?.sources).toContain('fulltext');
      expect(result.crossReferences?.sources).toContain('gov-dept');
      expect(result.crossReferences?.sources).toContain('speeches');
    });
  });

  describe('Validation', () => {
    it('should export validateMotions function', () => {
      expect(motionsModule.validateMotions).toBeDefined();
    });

    it('should validate motions content', () => {
      const article: ArticleInput = {
        content: 'The opposition has submitted motions on climate policy.',
        sources: ['motioner', 'dokument', 'anforanden']
      };
      
      const validation = motionsModule.validateMotions(article);
      expect(validation.hasMotions).toBe(true);
      expect(validation.hasMinimumSources).toBe(true);
    });
  });

  describe('Multi-Language', () => {
    it('should generate language-specific titles', async () => {
      const result = await motionsModule.generateMotions({
        languages: ['en', 'sv']
      });
      
      const enArticle = result.articles!.find((a: GeneratedArticle) => a.lang === 'en');
      expect(enArticle!.html).toContain('Opposition Motions');
    });
  });

  describe('Error Handling', () => {
    it('should handle MCP errors', async () => {
      mockClientInstance.fetchMotions.mockRejectedValue(
        new Error('MCP error')
      );
      
      const result = await motionsModule.generateMotions({
        languages: ['en']
      });
      
      expect(result.success).toBe(false);
    });
  });
});
