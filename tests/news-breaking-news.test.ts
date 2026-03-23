/**
 * Breaking News Significance & Generation Tests
 *
 * Tests breaking news generation with significance threshold validation,
 * urgency classification, and event-driven generation flows.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import type { GenerationResult, BreakingEventData } from '../scripts/types/article.js';
import type { Language } from '../scripts/types/language.js';

// ---------------------------------------------------------------------------
// Mock MCP client
// ---------------------------------------------------------------------------

interface MockMCPClientShape {
  fetchVotingRecords: Mock<(...args: unknown[]) => Promise<unknown[]>>;
  searchSpeeches: Mock<(...args: unknown[]) => Promise<unknown[]>>;
  fetchVotingGroup: Mock<(...args: unknown[]) => Promise<unknown[]>>;
  fetchMPs: Mock<(...args: unknown[]) => Promise<unknown[]>>;
}

const { mockClientInstance, MockMCPClient } = vi.hoisted(() => {
  const inst: MockMCPClientShape = {
    fetchVotingRecords: vi.fn().mockResolvedValue([]),
    searchSpeeches: vi.fn().mockResolvedValue([]),
    fetchVotingGroup: vi.fn().mockResolvedValue([]),
    fetchMPs: vi.fn().mockResolvedValue([]),
  };
  function MockMCPClient(): MockMCPClientShape { return inst; }
  return { mockClientInstance: inst, MockMCPClient };
});

vi.mock('../scripts/mcp-client.js', () => ({
  MCPClient: MockMCPClient,
}));

// ---------------------------------------------------------------------------
// Module shape
// ---------------------------------------------------------------------------

interface BreakingNewsModule {
  readonly REQUIRED_TOOLS: readonly string[];
  readonly generateBreakingNews: (opts?: {
    languages?: Language[];
    eventContext?: string;
    eventData?: BreakingEventData | null;
    writeArticle?: ((html: string, filename: string) => void) | null;
  }) => Promise<GenerationResult>;
  readonly validateBreakingNews: (article: {
    content?: string;
    sources?: string[];
    [key: string]: unknown;
  }) => {
    hasBreakingEvent: boolean;
    hasMinimumSources: boolean;
    hasTimeliness: boolean;
    hasImpactAnalysis: boolean;
    passed: boolean;
  };
}

let mod: BreakingNewsModule;

beforeAll(async () => {
  mod = await import('../scripts/news-types/breaking-news.js') as unknown as BreakingNewsModule;
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Significance threshold tests
// ---------------------------------------------------------------------------

describe('Breaking News — significance thresholds', () => {
  it('REQUIRED_TOOLS includes expected MCP tools', () => {
    expect(mod.REQUIRED_TOOLS).toContain('search_voteringar');
    expect(mod.REQUIRED_TOOLS).toContain('get_voting_group');
  });

  it('rejects generation when no event data is provided', async () => {
    const result = await mod.generateBreakingNews({ languages: ['en'] });
    expect(result.success).toBe(false);
    expect(result.error).toContain('requires event context');
  });

  it('rejects generation with null event data', async () => {
    const result = await mod.generateBreakingNews({ languages: ['en'], eventData: null });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('succeeds when minimal event data (slug only) is provided', async () => {
    const result = await mod.generateBreakingNews({
      languages: ['en'],
      eventData: { slug: 'test-event' },
    });
    expect(result.success).toBe(true);
  });

  it('succeeds with complete event data', async () => {
    const eventData: BreakingEventData = {
      voteId: 'v2026-budget',
      topic: 'Budget vote 2026',
      slug: 'budget-vote-2026',
    };
    const result = await mod.generateBreakingNews({ languages: ['en'], eventData });
    expect(result.success).toBe(true);
    expect(result.articles!.length).toBe(1);
  });

  it('includes mcpCalls even on early failure (no event data)', async () => {
    const result = await mod.generateBreakingNews({ languages: ['en'] });
    expect(result.mcpCalls).toBeDefined();
    expect(Array.isArray(result.mcpCalls)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// MCP tool invocation
// ---------------------------------------------------------------------------

describe('Breaking News — MCP tool calls', () => {
  it('fetches voting records when voteId is provided', async () => {
    await mod.generateBreakingNews({
      languages: ['en'],
      eventData: { voteId: 'v123', slug: 'test' },
    });
    expect(mockClientInstance.fetchVotingRecords).toHaveBeenCalled();
  });

  it('searches speeches when topic is provided', async () => {
    await mod.generateBreakingNews({
      languages: ['en'],
      eventData: { topic: 'Defense debate', slug: 'test' },
    });
    expect(mockClientInstance.searchSpeeches).toHaveBeenCalled();
  });

  it('always fetches voting group by party', async () => {
    await mod.generateBreakingNews({
      languages: ['en'],
      eventData: { voteId: 'v123', slug: 'test' },
    });
    expect(mockClientInstance.fetchVotingGroup).toHaveBeenCalledWith(
      expect.objectContaining({ groupBy: 'parti' }),
    );
  });

  it('fetches MP profiles with speaker name from speech results', async () => {
    mockClientInstance.searchSpeeches.mockResolvedValueOnce([
      { talare: 'Anna Svensson' } as Record<string, unknown>,
    ]);
    await mod.generateBreakingNews({
      languages: ['en'],
      eventData: { topic: 'Budget', slug: 'test' },
    });
    expect(mockClientInstance.fetchMPs).toHaveBeenCalledWith(
      expect.objectContaining({ namn: 'Anna Svensson', limit: 1 }),
    );
  });

  it('calls all 4 required tools with minimal event data', async () => {
    await mod.generateBreakingNews({
      languages: ['en'],
      eventData: { slug: 'test' },
    });
    expect(mockClientInstance.fetchVotingRecords).toHaveBeenCalled();
    expect(mockClientInstance.fetchVotingGroup).toHaveBeenCalled();
    expect(mockClientInstance.searchSpeeches).toHaveBeenCalled();
    expect(mockClientInstance.fetchMPs).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Error resilience
// ---------------------------------------------------------------------------

describe('Breaking News — error resilience', () => {
  it('succeeds even when all MCP tools fail', async () => {
    mockClientInstance.fetchVotingRecords.mockRejectedValueOnce(new Error('timeout'));
    mockClientInstance.fetchVotingGroup.mockRejectedValueOnce(new Error('timeout'));
    mockClientInstance.searchSpeeches.mockRejectedValueOnce(new Error('timeout'));
    mockClientInstance.fetchMPs.mockRejectedValueOnce(new Error('timeout'));

    const result = await mod.generateBreakingNews({
      languages: ['en'],
      eventData: { slug: 'test', topic: 'test' },
    });
    expect(result.success).toBe(true);
    expect(result.mcpCalls).toBeDefined();
  });

  it('handles partial MCP failures gracefully', async () => {
    mockClientInstance.fetchVotingRecords.mockRejectedValueOnce(new Error('timeout'));
    // Other tools succeed
    const result = await mod.generateBreakingNews({
      languages: ['en'],
      eventData: { slug: 'test', topic: 'test' },
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Multi-language generation
// ---------------------------------------------------------------------------

describe('Breaking News — multi-language', () => {
  it('generates articles for multiple languages', async () => {
    const result = await mod.generateBreakingNews({
      languages: ['en', 'sv', 'de'],
      eventData: { slug: 'test', topic: 'test' },
    });
    expect(result.articles!.length).toBe(3);
  });

  it('English article contains "Breaking"', async () => {
    const result = await mod.generateBreakingNews({
      languages: ['en'],
      eventContext: 'Critical Vote',
      eventData: { slug: 'test', topic: 'test' },
    });
    const en = result.articles!.find(a => a.lang === 'en');
    expect(en!.html).toContain('Breaking');
  });

  it('Swedish article contains "Senaste nytt"', async () => {
    const result = await mod.generateBreakingNews({
      languages: ['sv'],
      eventContext: 'Critical Vote',
      eventData: { slug: 'test', topic: 'test' },
    });
    const sv = result.articles!.find(a => a.lang === 'sv');
    expect(sv!.html).toContain('Senaste nytt');
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('Breaking News — validateBreakingNews', () => {
  it('validates breaking event presence', () => {
    const v = mod.validateBreakingNews({
      content: 'Breaking: Parliament votes on emergency bill',
      sources: ['voteringar', 'anforanden', 'ledamoter'],
    });
    expect(v.hasBreakingEvent).toBe(true);
    expect(v.hasMinimumSources).toBe(true);
  });

  it('detects timeliness in content', () => {
    const v = mod.validateBreakingNews({
      content: 'Breaking news just now: new vote results',
      sources: ['voteringar'],
    });
    expect(v.hasTimeliness).toBe(true);
  });

  it('fails when content is empty', () => {
    const v = mod.validateBreakingNews({ content: '', sources: [] });
    expect(v.hasBreakingEvent).toBe(false);
    expect(v.hasMinimumSources).toBe(false);
  });

  it('requires minimum sources for passing', () => {
    const v = mod.validateBreakingNews({
      content: 'Breaking news about budget vote',
      sources: ['voteringar'],
    });
    // Single source is insufficient for full pass
    expect(v.hasMinimumSources).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Slug generation
// ---------------------------------------------------------------------------

describe('Breaking News — slug generation', () => {
  it('generates slug with breaking prefix', async () => {
    const result = await mod.generateBreakingNews({
      languages: ['en'],
      eventData: { slug: 'crisis-vote', topic: 'test' },
    });
    expect(result.slug).toMatch(/breaking-crisis-vote$/);
  });

  it('uses date prefix in slug', async () => {
    const result = await mod.generateBreakingNews({
      languages: ['en'],
      eventData: { slug: 'test-event', topic: 'test' },
    });
    expect(result.slug).toMatch(/^\d{4}-\d{2}-\d{2}-/);
  });
});
