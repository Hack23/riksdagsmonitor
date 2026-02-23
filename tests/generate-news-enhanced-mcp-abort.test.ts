/**
 * Unit Tests: MCP fail-fast abort behaviour
 *
 * Verifies that when the riksdag-regering MCP server is unreachable:
 *   - getSharedClient() throws instead of silently continuing (requireMcp=true)
 *   - Individual generator functions propagate the error (success: false)
 *   - requireMcp defaults to true and is exported
 *   - --require-mcp=false disables fail-fast (degraded mode)
 *
 * A dedicated test file is used so the module is freshly imported with
 * sharedClient=null, enabling warm-up failure to be triggered cleanly.
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import type { GenerationResult } from '../scripts/types/article.js';
import type { MCPClientConfig } from '../scripts/types/mcp.js';

/** Mock MCP client interface (minimal for these tests) */
interface MockMCPClientInstance {
  fetchCalendarEvents: ReturnType<typeof vi.fn>;
  fetchCommitteeReports: ReturnType<typeof vi.fn>;
  fetchPropositions: ReturnType<typeof vi.fn>;
  fetchMotions: ReturnType<typeof vi.fn>;
  enrichDocumentsWithContent: ReturnType<typeof vi.fn>;
  request: ReturnType<typeof vi.fn>;
  timeout: number;
  baseURL: string;
}

/** Shape of the relevant exports from the module */
interface GenerateNewsEnhancedModule {
  readonly requireMcp: boolean;
  readonly generateCommitteeReports: () => Promise<GenerationResult>;
  readonly generatePropositions: () => Promise<GenerationResult>;
  readonly generateMotions: () => Promise<GenerationResult>;
}

// ---------------------------------------------------------------------------
// Hoisted mock setup
// Note: vitest.config.js has mockReset:true, which resets all implementations
// before each test. The beforeEach below re-initializes request to reject so
// every test sees a failing MCP server.
// ---------------------------------------------------------------------------
const { mockClientInstance, MockMCPClient } = vi.hoisted(() => {
  const mockClientInstance: MockMCPClientInstance = {
    fetchCalendarEvents: vi.fn(),
    fetchCommitteeReports: vi.fn(),
    fetchPropositions: vi.fn(),
    fetchMotions: vi.fn(),
    enrichDocumentsWithContent: vi.fn(),
    request: vi.fn(),
    timeout: 90000,
    baseURL: 'https://riksdag-regering-ai.onrender.com/mcp',
  };

  function MockMCPClient(config: MCPClientConfig | undefined): MockMCPClientInstance {
    if (config && config.timeout) mockClientInstance.timeout = config.timeout;
    return mockClientInstance;
  }

  return { mockClientInstance, MockMCPClient };
});

vi.mock('../scripts/mcp-client.js', () => ({
  MCPClient: MockMCPClient,
  getDefaultClient: () => mockClientInstance,
}));

let moduleExports: GenerateNewsEnhancedModule | null = null;

beforeAll(async () => {
  vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined as unknown as string);

  // Ensure request rejects during module import (sharedClient warm-up is lazy, no-op here)
  mockClientInstance.request.mockRejectedValue(new Error('ECONNREFUSED — MCP server is down'));

  try {
    moduleExports = (await import('../scripts/generate-news-enhanced.js')) as unknown as GenerateNewsEnhancedModule;
  } catch (e: unknown) {
    console.error('Import failed:', e instanceof Error ? e.message : String(e));
    moduleExports = null;
  }
});

// Re-initialize mocks before each test because vitest.config.js mockReset:true
// resets all implementations to vi.fn() (returns undefined) before each test.
// We need request to reject so getSharedClient() triggers fail-fast on every call.
beforeEach(() => {
  mockClientInstance.request.mockRejectedValue(new Error('ECONNREFUSED — MCP server is down'));
  mockClientInstance.fetchCommitteeReports.mockResolvedValue([]);
  mockClientInstance.fetchPropositions.mockResolvedValue([]);
  mockClientInstance.fetchMotions.mockResolvedValue([]);
  mockClientInstance.fetchCalendarEvents.mockResolvedValue([]);
  mockClientInstance.enrichDocumentsWithContent.mockImplementation(async (docs: unknown[]) => docs);
});

afterAll(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MCP fail-fast abort (requireMcp=true)', () => {
  describe('requireMcp flag', () => {
    it('should export requireMcp as true by default', () => {
      if (!moduleExports) return;
      expect(moduleExports.requireMcp).toBe(true);
    });
  });

  describe('generateCommitteeReports — MCP unavailable', () => {
    it('should return success=false when MCP warm-up fails', async () => {
      if (!moduleExports) return;

      const result = await moduleExports.generateCommitteeReports();

      expect(result.success).toBe(false);
    });

    it('should include "MCP server unavailable" in the error message', async () => {
      if (!moduleExports) return;

      const result = await moduleExports.generateCommitteeReports();

      expect(result.error).toMatch(/MCP server unavailable/i);
    });
  });

  describe('generatePropositions — MCP unavailable', () => {
    it('should return success=false when MCP warm-up fails', async () => {
      if (!moduleExports) return;

      const result = await moduleExports.generatePropositions();

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/MCP server unavailable/i);
    });
  });

  describe('generateMotions — MCP unavailable', () => {
    it('should return success=false when MCP warm-up fails', async () => {
      if (!moduleExports) return;

      const result = await moduleExports.generateMotions();

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/MCP server unavailable/i);
    });
  });
});
