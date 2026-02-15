/**
 * Unit Tests for MCP Client - Part 2
 * Tests HTTP client for riksdag-regering-mcp server
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPClient } from '../scripts/mcp-client.js';

describe('MCPClient Part 2', () => {
  let client;
  let originalFetch;

  beforeEach(() => {
    client = new MCPClient();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
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
      // Direct server URL: unprefixed tool name
      expect(body.params.name).toBe('get_motioner');
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
      // Direct server URL: unprefixed tool name
      expect(body.params.name).toBe('search_dokument');
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
      // Direct server URL: unprefixed tool name
      expect(body.params.name).toBe('search_anforanden');
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
      // Direct server URL: unprefixed tool name
      expect(body.params.name).toBe('search_ledamoter');
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
      // Direct server URL: unprefixed tool name
      expect(body.params.name).toBe('search_voteringar');
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
      // Direct server URL: unprefixed tool name
      expect(body.params.name).toBe('search_regering');
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
      // Mock sleep to make test fast (prevent 3000ms delay causing OOM)
      vi.spyOn(client, 'sleep').mockResolvedValue();
      
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
      // Mock sleep to make test fast (prevent 3000ms delay causing OOM)
      vi.spyOn(client, 'sleep').mockResolvedValue();
      
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
