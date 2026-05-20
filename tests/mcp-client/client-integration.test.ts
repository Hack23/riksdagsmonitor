/**
 * Client-integration spine for `scripts/mcp-client/**`.
 *
 * Per Hack23/riksdagsmonitor#2578 follow-up acceptance criteria:
 *   - end-to-end transport + retry coverage,
 *   - transport-error classification,
 *   - constructor / lifecycle smoke,
 *   - one happy-path call into each `methods/*.ts` module.
 *
 * Per-domain exhaustive coverage lives under
 * `tests/mcp-client/{config,transport,error-classification,methods}/`.
 *
 * MUST stay ≤ 400 lines.
 *
 * Migrated from `tests/mcp-client-core-part1.test.ts` (constructor lines
 * 22-94, sleep lines 832-839) plus targeted integration scenarios.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPClient } from '../../scripts/mcp-client.js';
import type { MCPStats } from '../../scripts/types/mcp.js';

function mockOk<T>(result: T): typeof global.fetch {
  return vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result }),
    }),
  ) as unknown as typeof global.fetch;
}

describe('MCPClient — integration spine', () => {
  let client: MCPClient;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    client = new MCPClient();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------------------
  // constructor / lifecycle smoke
  // ----------------------------------------------------------------------
  describe('constructor', () => {
    it('should create client with default configuration', () => {
      expect(client).toBeDefined();
      expect(client.baseURL).toBe('https://riksdag-regering-ai.onrender.com/mcp');
      expect(client.timeout).toBe(30000);
      expect(client.maxRetries).toBe(3);
    });

    it('should accept custom configuration', () => {
      const c = new MCPClient({
        baseURL: 'https://custom.example.com',
        timeout: 10000,
        maxRetries: 5,
      });
      expect(c.baseURL).toBe('https://custom.example.com');
      expect(c.timeout).toBe(10000);
      expect(c.maxRetries).toBe(5);
    });

    it('should accept string URL for backwards compatibility', () => {
      const c = new MCPClient('https://legacy.example.com');
      expect(c.baseURL).toBe('https://legacy.example.com');
      expect(c.timeout).toBe(30000);
      expect(c.maxRetries).toBe(3);
    });

    it('should accept serverUrl alias in config', () => {
      const c = new MCPClient({ serverUrl: 'https://alias.example.com' });
      expect(c.baseURL).toBe('https://alias.example.com');
    });

    it('should initialize request and error counts to zero', () => {
      expect(client.requestCount).toBe(0);
      expect(client.errorCount).toBe(0);
    });

    it('should accept custom headers in config', () => {
      const c = new MCPClient({
        baseURL: 'https://custom.example.com',
        headers: { 'X-Custom-Header': 'v', 'X-API-Key': 'abc123' },
      });
      expect(c.customHeaders).toEqual({ 'X-Custom-Header': 'v', 'X-API-Key': 'abc123' });
    });

    it('should initialize empty customHeaders when no headers provided', () => {
      expect(client.customHeaders).toEqual({});
    });

    it('should initialize empty customHeaders for string URL config', () => {
      const c = new MCPClient('https://test.com');
      expect(c.customHeaders).toEqual({});
    });
  });

  // ----------------------------------------------------------------------
  // utility
  // ----------------------------------------------------------------------
  describe('sleep', () => {
    it('should resolve after specified time', async () => {
      const start = Date.now();
      await client.sleep(50);
      expect(Date.now() - start).toBeGreaterThanOrEqual(45);
    });
  });

  // ----------------------------------------------------------------------
  // transport + retry end-to-end
  // ----------------------------------------------------------------------
  describe('end-to-end retry + transport', () => {
    beforeEach(() => {
      vi.spyOn(client, 'sleep').mockImplementation(() => Promise.resolve());
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('retries on transient network error then succeeds', async () => {
      let attempt = 0;
      global.fetch = vi.fn(() => {
        attempt++;
        if (attempt < 2) return Promise.reject(new Error('Network error'));
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { ok: true } }),
        });
      }) as unknown as typeof global.fetch;

      const result = await client.request('test_tool', {});
      expect(result).toEqual({ ok: true });
      expect(attempt).toBe(2);
    });

    it('does not retry on JSON-RPC error response', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              jsonrpc: '2.0',
              id: 1,
              error: { code: -32601, message: 'Method not found' },
            }),
        }),
      ) as unknown as typeof global.fetch;

      await expect(client.request('unknown_tool', {})).rejects.toThrow('Method not found');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('surfaces transport error via TRANSPORT_ERROR_RE-matchable message', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 502,
          statusText: 'Bad Gateway',
          text: () => Promise.resolve(''),
        }),
      ) as unknown as typeof global.fetch;

      await expect(client.request('test_tool', {})).rejects.toThrow(/MCP server error/);
    });
  });

  // ----------------------------------------------------------------------
  // statistics surface
  // ----------------------------------------------------------------------
  describe('statistics surface', () => {
    it('exposes getStats/resetStats with the documented shape', async () => {
      const initial: MCPStats = client.getStats();
      expect(initial).toEqual({ requests: 0, errors: 0, successRate: '0%' });

      global.fetch = mockOk({ ok: true });
      await client.request('test_tool', {});
      const after = client.getStats();
      expect(after.requests).toBe(1);

      client.resetStats();
      expect(client.getStats()).toEqual({ requests: 0, errors: 0, successRate: '0%' });
    });
  });

  // ----------------------------------------------------------------------
  // one happy path from each method module
  // ----------------------------------------------------------------------
  describe('methods/* happy-path smoke', () => {
    it('calendar.fetchCalendarEvents returns events array', async () => {
      global.fetch = mockOk({ events: [{ title: 'X' }] });
      const events = await client.fetchCalendarEvents('2026-02-10', '2026-02-17');
      expect(events).toHaveLength(1);
    });

    it('reports.fetchPropositions returns array', async () => {
      global.fetch = mockOk({ propositions: [{ title: 'P' }] });
      const props = await client.fetchPropositions();
      expect(props).toHaveLength(1);
    });

    it('documents.searchDocuments returns array', async () => {
      global.fetch = mockOk({ documents: [{ dok_id: 'D1' }] });
      const docs = await client.searchDocuments({ rm: '2025/26' });
      expect(docs).toHaveLength(1);
    });

    it('speeches.searchSpeeches returns array', async () => {
      global.fetch = mockOk({ speeches: [{ id: 'S' }] });
      const speeches = await client.searchSpeeches({ rm: '2025/26' });
      expect(speeches).toHaveLength(1);
    });

    it('members.fetchMPs returns array', async () => {
      global.fetch = mockOk({ mps: [{ id: 'M' }] });
      const mps = await client.fetchMPs({});
      expect(mps).toHaveLength(1);
    });

    it('votes.fetchVotingGroup returns array', async () => {
      global.fetch = mockOk({ groups: [{ id: 'G' }] });
      const groups = await client.fetchVotingGroup({ bet: 'FiU1' });
      expect(groups).toHaveLength(1);
    });
  });
});
