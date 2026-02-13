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
      expect(body.params).toEqual({
        name: 'riksdag-regering--test_tool',
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

    it('should try without prefix if tool not found with prefix', async () => {
      let callCount = 0;
      global.fetch = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          // First call with prefix fails
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              jsonrpc: '2.0',
              id: 1,
              error: { code: -32601, message: 'Tool riksdag-regering--test_tool not found' }
            })
          });
        }
        // Second call without prefix succeeds
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ jsonrpc: '2.0', id: 2, result: { success: true } })
        });
      });

      const result = await client.request('test_tool', {});
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
      expect(body.params.name).toBe('riksdag-regering--get_propositioner');
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

  describe('fetchMotions', () => {
    it('should fetch motions with default limit', async () => {
      const mockMotions = [{ title: 'Motion 1' }, { title: 'Motion 2' }];
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { motions: mockMotions } })
      }));

      const motions = await client.fetchMotions();
      expect(motions).toHaveLength(2);
    });

    it('should pass optional rm parameter', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { motions: [] } })
      }));

      await client.fetchMotions(15, '2025/26');
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.params.arguments).toEqual({ limit: 15, rm: '2025/26' });
    });

    it('should call correct tool name', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { motions: [] } })
      }));

      await client.fetchMotions();
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.params.name).toBe('riksdag-regering--get_motioner');
    });

    it('should return empty array when response has no motions key', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: "2.0", id: 1, result: {} })
      }));

      const motions = await client.fetchMotions();
      expect(motions).toEqual([]);
    });
  });

  describe('searchDocuments', () => {
    it('should search documents with query parameters', async () => {
      const mockDocs = [{ id: '1', title: 'Doc 1' }];
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { documents: mockDocs } })
      }));

      const docs = await client.searchDocuments({ sok: 'budget', doktyp: 'mot', limit: 5 });
      expect(docs).toHaveLength(1);
      expect(docs[0].title).toBe('Doc 1');
    });

    it('should call correct tool name', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { documents: [] } })
      }));

      await client.searchDocuments({ sok: 'test' });
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.params.name).toBe('riksdag-regering--search_dokument');
    });

    it('should return empty array when response has no documents key', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: "2.0", id: 1, result: {} })
      }));

      const docs = await client.searchDocuments({ sok: 'test' });
      expect(docs).toEqual([]);
    });
  });

  describe('searchSpeeches', () => {
    it('should search speeches with query parameters', async () => {
      const mockSpeeches = [{ speaker: 'MP1', text: 'Speech text' }];
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { speeches: mockSpeeches } })
      }));

      const speeches = await client.searchSpeeches({ sok: 'klimat', parti: 'S' });
      expect(speeches).toHaveLength(1);
      expect(speeches[0].speaker).toBe('MP1');
    });

    it('should call correct tool name', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { speeches: [] } })
      }));

      await client.searchSpeeches({ sok: 'test' });
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.params.name).toBe('riksdag-regering--search_anforanden');
    });

    it('should return empty array when response has no speeches key', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: "2.0", id: 1, result: {} })
      }));

      const speeches = await client.searchSpeeches({ sok: 'test' });
      expect(speeches).toEqual([]);
    });
  });

  describe('fetchMPs', () => {
    it('should fetch MPs with filters', async () => {
      const mockMPs = [{ name: 'MP1', parti: 'S' }, { name: 'MP2', parti: 'M' }];
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { mps: mockMPs } })
      }));

      const mps = await client.fetchMPs({ parti: 'S' });
      expect(mps).toHaveLength(2);
    });

    it('should call correct tool name', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { mps: [] } })
      }));

      await client.fetchMPs();
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.params.name).toBe('riksdag-regering--search_ledamoter');
    });

    it('should pass empty object when no filters provided', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { mps: [] } })
      }));

      await client.fetchMPs();
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.params.arguments).toEqual({});
    });

    it('should return empty array when response has no mps key', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: "2.0", id: 1, result: {} })
      }));

      const mps = await client.fetchMPs();
      expect(mps).toEqual([]);
    });
  });

  describe('fetchVotingRecords', () => {
    it('should fetch voting records with filters', async () => {
      const mockVotes = [{ bet: '2025/26:UbU1', punkt: '1' }];
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { votes: mockVotes } })
      }));

      const votes = await client.fetchVotingRecords({ rm: '2025/26', bet: '2025/26:UbU1' });
      expect(votes).toHaveLength(1);
    });

    it('should call correct tool name', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { votes: [] } })
      }));

      await client.fetchVotingRecords({ rm: '2025/26' });
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.params.name).toBe('riksdag-regering--search_voteringar');
    });

    it('should return empty array when response has no votes key', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: "2.0", id: 1, result: {} })
      }));

      const votes = await client.fetchVotingRecords({ rm: '2025/26' });
      expect(votes).toEqual([]);
    });
  });

  describe('fetchGovernmentDocuments', () => {
    it('should fetch government documents', async () => {
      const mockDocs = [{ type: 'SOU', title: 'Betänkande' }];
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { documents: mockDocs } })
      }));

      const docs = await client.fetchGovernmentDocuments({ type: 'SOU', limit: 10 });
      expect(docs).toHaveLength(1);
      expect(docs[0].type).toBe('SOU');
    });

    it('should call correct tool name', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { documents: [] } })
      }));

      await client.fetchGovernmentDocuments({ type: 'press' });
      const body = JSON.parse(global.fetch.mock.calls[0][1].body);
      expect(body.params.name).toBe('riksdag-regering--search_regering');
    });

    it('should return empty array when response has no documents key', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: "2.0", id: 1, result: {} })
      }));

      const docs = await client.fetchGovernmentDocuments({});
      expect(docs).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return request statistics', () => {
      const stats = client.getStats();
      expect(stats).toHaveProperty('requests');
      expect(stats).toHaveProperty('errors');
      expect(stats).toHaveProperty('successRate');
    });

    it('should return 0% success rate when no requests made', () => {
      const stats = client.getStats();
      expect(stats.successRate).toBe('0%');
    });

    it('should calculate success rate correctly', async () => {
      // 2 successful requests
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { status: 'success' } })
      }));
      await client.request('test1', {});
      await client.request('test2', {});

      // 1 failed request
      global.fetch = vi.fn(() => Promise.reject(new Error('Fail')));
      try {
        await client.request('test3', {});
      } catch (e) {
        // Expected
      }

      const stats = client.getStats();
      expect(stats.requests).toBe(3);
      expect(stats.errors).toBe(1);
      expect(stats.successRate).toBe('67%'); // 2/3 = 66.67%
    });

    it('should show 100% success rate when all requests succeed', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: "2.0", id: 1, result: {} })
      }));

      await client.request('t1', {});
      await client.request('t2', {});

      const stats = client.getStats();
      expect(stats.successRate).toBe('100%');
    });
  });

  describe('resetStats', () => {
    it('should reset request and error counts to zero', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: "2.0", id: 1, result: {} })
      }));

      await client.request('test', {});
      expect(client.getStats().requests).toBe(1);

      client.resetStats();

      const stats = client.getStats();
      expect(stats.requests).toBe(0);
      expect(stats.errors).toBe(0);
    });

    it('should reset after errors too', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Fail')));
      try { await client.request('test', {}); } catch (e) { /* expected */ }
      
      expect(client.getStats().errors).toBe(1);
      client.resetStats();
      expect(client.getStats().errors).toBe(0);
    });
  });

  describe('tool name validation', () => {
    it('should reject empty tool names', async () => {
      await expect(client.request('', {})).rejects.toThrow('Invalid tool name');
    });

    it('should reject null/undefined tool names', async () => {
      await expect(client.request(null, {})).rejects.toThrow('Invalid tool name');
      await expect(client.request(undefined, {})).rejects.toThrow('Invalid tool name');
    });

    it('should reject non-string tool names', async () => {
      await expect(client.request(123, {})).rejects.toThrow('Invalid tool name');
    });

    it('should reject tool names with path traversal characters', async () => {
      await expect(client.request('../admin', {})).rejects.toThrow('Invalid tool name');
      await expect(client.request('tools/../../etc', {})).rejects.toThrow('Invalid tool name');
    });

    it('should reject tool names with special characters', async () => {
      await expect(client.request('tool;rm -rf', {})).rejects.toThrow('Invalid tool name');
      await expect(client.request('tool name with spaces', {})).rejects.toThrow('Invalid tool name');
    });

    it('should accept valid tool names', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { status: 'success' } })
      }));

      // Valid tool names should not throw validation errors
      await expect(client.request('get_calendar_events', {})).resolves.toBeDefined();
      await expect(client.request('search_dokument', {})).resolves.toBeDefined();
      await expect(client.request('get-betankanden', {})).resolves.toBeDefined();
    });
  });

  describe('error counting accuracy', () => {
    it('should not over-count errors on retried requests', async () => {
      let attempt = 0;
      global.fetch = vi.fn(() => {
        attempt++;
        if (attempt < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { status: 'success' } })
        });
      });

      await client.request('test_tool', {});
      
      const stats = client.getStats();
      // Request succeeded after retries — should count as 1 request, 0 errors
      expect(stats.requests).toBe(1);
      expect(stats.errors).toBe(0);
    });

    it('should count exactly one error for a fully failed request', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      try {
        await client.request('test_tool', {});
      } catch (e) {
        // Expected
      }

      const stats = client.getStats();
      expect(stats.requests).toBe(1);
      expect(stats.errors).toBe(1);
    });
  });
});
