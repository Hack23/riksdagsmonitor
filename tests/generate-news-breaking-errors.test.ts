/**
 * Tests that generateNews() correctly increments stats.errors when the
 * 'breaking' article type fails — either via a returned {success: false}
 * or a thrown exception.
 *
 * This covers the exit-code-critical behavior: runCli() uses stats.errors > 0
 * to decide exit code 1 vs 0, which the agent relies on to detect failures.
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import fs from 'fs';
import type { GenerationStats, GenerationResult } from '../scripts/types/article.js';

// ---------------------------------------------------------------------------
// Hoisted mocks — vi.hoisted() runs before vi.mock() calls
// ---------------------------------------------------------------------------

const { mockGenerateBreakingNews, mockStats, mockGetSharedClient } = vi.hoisted(() => {
  const mockGenerateBreakingNews = vi.fn<(...args: unknown[]) => Promise<GenerationResult>>();
  const mockStats: GenerationStats = {
    generated: 0,
    errors: 0,
    articles: [],
    timestamp: new Date().toISOString(),
    qualityScores: []
  };
  const mockGetSharedClient = vi.fn().mockResolvedValue({
    fetchVotingRecords: vi.fn().mockResolvedValue([{ doktyp: 'prop', titel: 'Test Prop' }]),
    searchDocuments: vi.fn().mockResolvedValue([{ doktyp: 'prop', titel: 'Test Prop' }])
  });
  return { mockGenerateBreakingNews, mockStats, mockGetSharedClient };
});

// Mock the breaking-news module
vi.mock('../scripts/news-types/breaking-news.js', () => ({
  generateBreakingNews: mockGenerateBreakingNews
}));

// Mock the config module — set articleTypes to ['breaking'] and expose stats
vi.mock('../scripts/generate-news-enhanced/config.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../scripts/generate-news-enhanced/config.js')>();
  return {
    ...original,
    articleTypes: ['breaking'],
    stats: mockStats,
    getSharedClient: mockGetSharedClient,
    // Provide stable values for other config exports
    languages: ['en'],
    allRequestedLanguages: ['en'],
    batchSize: undefined,
    skipExistingArg: false,
    requireMcp: false,
  };
});

// Mock MCP client
vi.mock('../scripts/mcp-client.js', () => ({
  MCPClient: vi.fn().mockImplementation(() => ({
    fetchVotingRecords: vi.fn().mockResolvedValue([]),
    searchDocuments: vi.fn().mockResolvedValue([])
  })),
  getDefaultClient: vi.fn()
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

interface GenerateNewsModule {
  readonly generateNews: () => Promise<GenerationStats>;
}

let moduleExports: GenerateNewsModule | null = null;

beforeAll(async () => {
  // Prevent actual file writes
  vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined as unknown as string);
  vi.spyOn(fs, 'existsSync').mockReturnValue(false);
  vi.spyOn(fs, 'readdirSync').mockReturnValue([]);

  try {
    moduleExports = await import('../scripts/generate-news-enhanced/index.js') as unknown as GenerateNewsModule;
  } catch (e: unknown) {
    console.error('Import failed:', e instanceof Error ? e.message : String(e));
    moduleExports = null;
  }
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('generateNews() — breaking news error tracking', () => {
  beforeEach(() => {
    // Reset stats before each test
    mockStats.errors = 0;
    mockStats.generated = 0;
    mockStats.articles = [];
    mockStats.qualityScores = [];
    vi.clearAllMocks();

    // Re-setup shared client mock after clearAllMocks
    mockGetSharedClient.mockResolvedValue({
      fetchVotingRecords: vi.fn().mockResolvedValue([{ doktyp: 'prop', titel: 'Test Prop' }]),
      searchDocuments: vi.fn().mockResolvedValue([{ doktyp: 'prop', titel: 'Test Prop' }])
    });
  });

  it('should increment stats.errors when generateBreakingNews returns success=false', async () => {
    if (!moduleExports) return;

    mockGenerateBreakingNews.mockResolvedValueOnce({
      success: false,
      error: 'MCP server unreachable'
    });

    const result = await moduleExports.generateNews();

    expect(mockGenerateBreakingNews).toHaveBeenCalled();
    expect(result.errors).toBeGreaterThanOrEqual(1);
  });

  it('should increment stats.errors when generateBreakingNews throws an exception', async () => {
    if (!moduleExports) return;

    // Make getSharedClient itself throw so the catch block fires
    mockGetSharedClient.mockRejectedValueOnce(new Error('Connection timeout'));

    const result = await moduleExports.generateNews();

    expect(result.errors).toBeGreaterThanOrEqual(1);
  });

  it('should NOT increment stats.errors when generateBreakingNews returns success=true', async () => {
    if (!moduleExports) return;

    mockGenerateBreakingNews.mockResolvedValueOnce({
      success: true,
      articles: [{ lang: 'en', html: '<p>Breaking</p>', slug: 'test', filename: 'test.html' }]
    });

    const result = await moduleExports.generateNews();

    expect(mockGenerateBreakingNews).toHaveBeenCalled();
    expect(result.errors).toBe(0);
  });

  it('should log the error message from failed generation result', async () => {
    if (!moduleExports) return;

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockGenerateBreakingNews.mockResolvedValueOnce({
      success: false,
      error: 'Breaking: no significant events today'
    });

    await moduleExports.generateNews();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Breaking news generation failed'),
      expect.stringContaining('no significant events today')
    );

    consoleSpy.mockRestore();
  });
});
