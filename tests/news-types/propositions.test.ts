/**
 * Unit Tests for Propositions Article Generation Module
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import type { GeneratedArticle, GenerationResult, MCPCallRecord } from '../../scripts/types/article.js';
import type { Language } from '../../scripts/types/language.js';

/** Proposition record from MCP server */
interface PropositionRecord {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly ministry: string;
}

/** Mock MCP client shape */
interface MockMCPClientShape {
  fetchPropositions: Mock<(limit: number) => Promise<PropositionRecord[]>>;
}

/** Validation input */
interface ArticleInput {
  content?: string;
  sources?: string[];
  [key: string]: unknown;
}

/** Propositions validation result */
interface PropositionsValidationResult {
  hasPropositions: boolean;
  hasMinimumSources: boolean;
  hasPolicyAnalysis: boolean;
  passed: boolean;
}

/** Shape of the dynamically imported propositions module */
interface PropositionsModule {
  readonly REQUIRED_TOOLS: readonly string[];
  readonly generatePropositions: (options?: {
    languages?: Language[];
    limit?: number;
    writeArticle?: (html: string, filename: string) => void;
  }) => Promise<GenerationResult>;
  readonly validatePropositions: (article: ArticleInput) => PropositionsValidationResult;
}

const { mockClientInstance, mockPropositions, MockMCPClient } = vi.hoisted(() => {
  const mockPropositions: PropositionRecord[] = [
    { id: 'prop-1', title: 'Budget proposition', date: '2026-02-15', ministry: 'Finance' },
    { id: 'prop-2', title: 'Education reform', date: '2026-02-14', ministry: 'Education' }
  ];
  
  const mockClientInstance: MockMCPClientShape = {
    fetchPropositions: vi.fn().mockResolvedValue(mockPropositions) as MockMCPClientShape['fetchPropositions']
  };
  
  function MockMCPClient(): MockMCPClientShape {
    return mockClientInstance;
  }
  
  return { mockClientInstance, mockPropositions, MockMCPClient };
});

vi.mock('../../scripts/mcp-client.js', () => ({
  MCPClient: MockMCPClient
}));

let propositionsModule: PropositionsModule;

beforeAll(async () => {
  propositionsModule = await import('../../scripts/news-types/propositions.js') as unknown as PropositionsModule;
});

describe('Propositions Article Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClientInstance.fetchPropositions.mockResolvedValue(mockPropositions);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should export REQUIRED_TOOLS constant', () => {
      expect(propositionsModule.REQUIRED_TOOLS).toBeDefined();
      expect(propositionsModule.REQUIRED_TOOLS).toContain('get_propositioner');
    });
  });

  describe('Data Collection', () => {
    it('should fetch propositions from MCP', async () => {
      const result = await propositionsModule.generatePropositions({
        languages: ['en']
      });
      
      expect(mockClientInstance.fetchPropositions).toHaveBeenCalled();
      expect(result.mcpCalls!.some((call: MCPCallRecord) => call.tool === 'get_propositioner')).toBe(true);
    });

    it('should handle empty propositions', async () => {
      mockClientInstance.fetchPropositions.mockResolvedValue([]);
      
      const result = await propositionsModule.generatePropositions({
        languages: ['en']
      });
      
      expect(result.success).toBe(true);
      expect(result.files).toBe(0);
    });
  });

  describe('Article Structure', () => {
    it('should generate articles for requested languages', async () => {
      const result = await propositionsModule.generatePropositions({
        languages: ['en', 'sv']
      });
      
      expect(result.articles!.length).toBe(2);
    });

    it('should include correct slug format', async () => {
      const result = await propositionsModule.generatePropositions({
        languages: ['en']
      });
      
      expect(result.slug).toMatch(/government-propositions$/);
    });
  });

  describe('Validation', () => {
    it('should export validatePropositions function', () => {
      expect(propositionsModule.validatePropositions).toBeDefined();
    });

    it('should validate propositions content', () => {
      const article: ArticleInput = {
        content: 'The government has submitted a proposition on budget reform.',
        sources: ['propositioner', 'dokument', 'anforanden']
      };
      
      const validation = propositionsModule.validatePropositions(article);
      expect(validation.hasPropositions).toBe(true);
      expect(validation.hasMinimumSources).toBe(true);
    });
  });

  describe('Multi-Language', () => {
    it('should generate language-specific titles', async () => {
      const result = await propositionsModule.generatePropositions({
        languages: ['en', 'sv']
      });
      
      const enArticle = result.articles!.find((a: GeneratedArticle) => a.lang === 'en');
      expect(enArticle!.html).toContain('Government Propositions');
    });
  });

  describe('Error Handling', () => {
    it('should handle MCP errors', async () => {
      mockClientInstance.fetchPropositions.mockRejectedValue(
        new Error('MCP error')
      );
      
      const result = await propositionsModule.generatePropositions({
        languages: ['en']
      });
      
      expect(result.success).toBe(false);
    });
  });
});
