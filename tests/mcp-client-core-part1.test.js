/**
 * Unit Tests for MCP Client
 * Tests HTTP client for riksdag-regering-mcp server
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  MCPClient,
  getDefaultClient,
  fetchCalendarEvents,
  fetchCommitteeReports,
  fetchPropositions,
  fetchMotions,
  searchDocuments,
  searchSpeeches,
  fetchMPs,
  fetchVotingRecords,
  fetchGovernmentDocuments
} from '../scripts/mcp-client.js';

describe('MCPClient', () => {
  let client;
  let originalFetch;

  beforeEach(() => {
    client = new MCPClient();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();  // Clear mock data to prevent memory leaks
  });

  describe('constructor', () => {
    it('should create client with default configuration', () => {
      expect(client).toBeDefined();
      expect(client.baseURL).toBe('https://riksdag-regering-ai.onrender.com/mcp');
      expect(client.timeout).toBe(30000);
      expect(client.maxRetries).toBe(3);
    });

    it('should accept custom configuration', () => {
      const customClient = new MCPClient({
        baseURL: 'https://custom.example.com',
        timeout: 10000,
        maxRetries: 5
      });
      expect(customClient.baseURL).toBe('https://custom.example.com');
      expect(customClient.timeout).toBe(10000);
      expect(customClient.maxRetries).toBe(5);
    });

    it('should accept string URL for backwards compatibility', () => {
      const customClient = new MCPClient('https://legacy.example.com');
      expect(customClient.baseURL).toBe('https://legacy.example.com');
      expect(customClient.timeout).toBe(30000);
      expect(customClient.maxRetries).toBe(3);
    });

    it('should accept serverUrl alias in config', () => {
      const customClient = new MCPClient({ serverUrl: 'https://alias.example.com' });
      expect(customClient.baseURL).toBe('https://alias.example.com');
    });

    it('should initialize request and error counts to zero', () => {
      expect(client.requestCount).toBe(0);
      expect(client.errorCount).toBe(0);
    });
  });

  describe('request', () => {
    it('should make successful HTTP request with JSON-RPC 2.0', async () => {
      const mockJsonRpcResponse = { 
        jsonrpc: '2.0',
        id: 1,
        result: { data: [], success: true }
      };
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockJsonRpcResponse)
      }));

      const result = await client.request('test_tool', { param: 'value' });
      expect(result).toEqual({ data: [], success: true });
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should send correct JSON-RPC 2.0 request format', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: {} })
      }));

      await client.request('test_tool', { key: 'val' });
      
      const callArgs = global.fetch.mock.calls[0];
      // JSON-RPC posts to base URL, not /tools/{tool}
      expect(callArgs[0]).toBe('https://riksdag-regering-ai.onrender.com/mcp');
      expect(callArgs[1].method).toBe('POST');
      expect(callArgs[1].headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(callArgs[1].body);
      expect(body.jsonrpc).toBe('2.0');
      expect(body.id).toBeDefined();
      expect(body.method).toBe('tools/call');
      // Direct server URL: tool names are NOT prefixed
      expect(body.params).toEqual({
        name: 'test_tool',
        arguments: { key: 'val' }
      });
    });

    it('should handle JSON-RPC error responses', async () => {
      const jsonRpcError = {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      };
      
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(jsonRpcError)
      }));

      await expect(client.request('unknown_tool', {})).rejects.toThrow('MCP tool error: Method not found');
    });

    it('should throw on non-ok HTTP response', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error details')
      }));

      await expect(client.request('test_tool', {})).rejects.toThrow('MCP server error: 500 Internal Server Error');
    });

    it('should throw on 404 response', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('')
      }));

      await expect(client.request('bad_tool', {})).rejects.toThrow('404 Not Found');
    });

    it('should retry on network error', async () => {
      let attempt = 0;
      global.fetch = vi.fn(() => {
        attempt++;
        if (attempt < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { success: true } })
        });
      });

      const result = await client.request('test_tool', {});
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should retry on ECONNREFUSED error', async () => {
      let attempt = 0;
      global.fetch = vi.fn(() => {
        attempt++;
        if (attempt < 2) {
          return Promise.reject(new Error('ECONNREFUSED'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { ok: true } })
        });
      });

      const result = await client.request('test_tool', {});
      expect(result).toEqual({ ok: true });
    });

    it('should fail after max retries', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      await expect(client.request('test_tool', {})).rejects.toThrow('Network error');
      expect(global.fetch).toHaveBeenCalledTimes(3); // maxRetries
    });

    it('should not retry on non-network errors', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('')
      }));

      // Non-network errors (HTTP errors) are not retried — they throw immediately
      await expect(client.request('test_tool', {})).rejects.toThrow('MCP server error');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should track statistics', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { success: true } })
      }));

      const statsBefore = client.getStats();
      expect(statsBefore.requests).toBe(0);

      await client.request('test_tool', {});
      
      const statsAfter = client.getStats();
      expect(statsAfter.requests).toBe(1);
      expect(statsAfter.errors).toBe(0);
    });

    it('should use default empty params when none provided', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { ok: true } })
      }));

      await client.request('test_tool');
      const callArgs = global.fetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.params.arguments).toEqual({});
    });

    it('should not add prefix when using direct server URL', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { success: true } })
      }));

      await client.request('test_tool', {});
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      // Direct server URL: no prefix
      expect(body.params.name).toBe('test_tool');
    });

    it('should add prefix when using MCP gateway URL', async () => {
      const gatewayClient = new MCPClient({ baseURL: 'http://host.docker.internal:80/mcp/riksdag-regering' });
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { success: true } })
      }));

      await gatewayClient.request('test_tool', {});
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      // Gateway URL: prefix added
      expect(body.params.name).toBe('riksdag-regering--test_tool');
    });

    it('should try without prefix if gateway returns Internal error', async () => {
      const gatewayClient = new MCPClient({ baseURL: 'http://host.docker.internal:80/mcp/riksdag-regering' });
      let callCount = 0;
      global.fetch = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          // First call with prefix fails with Internal error
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              jsonrpc: '2.0',
              id: 1,
              error: { code: -32603, message: 'Internal error' }
            })
          });
        }
        // Second call without prefix succeeds
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ jsonrpc: '2.0', id: 2, result: { success: true } })
        });
      });

      const result = await gatewayClient.request('test_tool', {});
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(2);
      
      // First call should have prefix
      const firstCall = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(firstCall.params.name).toBe('riksdag-regering--test_tool');
      
      // Second call should not have prefix
      const secondCall = JSON.parse(global.fetch.mock.calls[1][1].body);
      expect(secondCall.params.name).toBe('test_tool');
    });
  });

  describe('sleep', () => {
    it('should resolve after specified delay', async () => {
      const start = Date.now();
      await client.sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40); // Allow some tolerance
    });
  });

  describe('fetchCalendarEvents', () => {
    it('should fetch calendar events with date range', async () => {
      const mockEvents = [
        { title: 'Event 1', start: '2026-02-10T10:00:00' },
        { title: 'Event 2', start: '2026-02-11T14:00:00' }
      ];

      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { events: mockEvents } })
      }));

      const events = await client.fetchCalendarEvents('2026-02-10', '2026-02-17');
      expect(events).toHaveLength(2);
      expect(events[0].title).toBe('Event 1');
    });

    it('should pass optional org and akt parameters', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { events: [] } })
      }));

      await client.fetchCalendarEvents('2026-02-10', '2026-02-17', 'kammaren', 'debatt');
      const callArgs = global.fetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.params.arguments).toEqual({ from: '2026-02-10', tom: '2026-02-17', org: 'kammaren', akt: 'debatt' });
    });

    it('should return empty array when response has no events key', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: "2.0", id: 1, result: {} })
      }));

      const events = await client.fetchCalendarEvents('2026-02-10', '2026-02-17');
      expect(events).toEqual([]);
    });
  });

  describe('fetchCommitteeReports', () => {
    it('should fetch committee reports with limit', async () => {
      const mockReports = [
        { title: 'Report 1', organ: 'UbU' },
        { title: 'Report 2', organ: 'SoU' }
      ];

      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { reports: mockReports } })
      }));

      const reports = await client.fetchCommitteeReports(10);
      expect(reports).toHaveLength(2);
    });

    it('should pass optional rm and organ parameters', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { reports: [] } })
      }));

      await client.fetchCommitteeReports(5, '2025/26', 'UbU');
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.params.arguments).toEqual({ limit: 5, rm: '2025/26', organ: 'UbU' });
    });

    it('should return empty array when response has no reports key', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: "2.0", id: 1, result: {} })
      }));

      const reports = await client.fetchCommitteeReports();
      expect(reports).toEqual([]);
    });
  });

  describe('fetchPropositions', () => {
    it('should fetch propositions with default limit', async () => {
      const mockProps = [{ title: 'Prop 1' }];
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { propositions: mockProps } })
      }));

      const props = await client.fetchPropositions();
      expect(props).toHaveLength(1);
      expect(props[0].title).toBe('Prop 1');
    });

    it('should pass optional rm parameter', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { propositions: [] } })
      }));

      await client.fetchPropositions(5, '2025/26');
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.params.arguments).toEqual({ limit: 5, rm: '2025/26' });
    });

    it('should call correct tool name', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { propositions: [] } })
      }));

      await client.fetchPropositions();
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      // Direct server URL: unprefixed tool name
      expect(body.params.name).toBe('get_propositioner');
    });

    it('should return empty array when response has no propositions key', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: "2.0", id: 1, result: {} })
      }));

      const props = await client.fetchPropositions();
      expect(props).toEqual([]);
    });
  });

});
