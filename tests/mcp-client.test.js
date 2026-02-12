/**
 * Unit Tests for MCP Client
 * Tests HTTP client for riksdag-regering-mcp server
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPClient } from '../scripts/mcp-client.js';

describe('MCPClient', () => {
  let client;
  let originalFetch;

  beforeEach(() => {
    client = new MCPClient();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
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
  });

  describe('request', () => {
    it('should make successful HTTP request', async () => {
      const mockResponse = { result: 'success', data: [] };
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      }));

      const result = await client.request('test_tool', { param: 'value' });
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);
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
          json: () => Promise.resolve({ result: 'success' })
        });
      });

      const result = await client.request('test_tool', {});
      expect(result).toEqual({ result: 'success' });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      await expect(client.request('test_tool', {})).rejects.toThrow('Network error');
      expect(global.fetch).toHaveBeenCalledTimes(3); // maxRetries
    });

    it('should track statistics', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ result: 'success' })
      }));

      const statsBefore = client.getStats();
      expect(statsBefore.requests).toBe(0);

      await client.request('test_tool', {});
      
      const statsAfter = client.getStats();
      expect(statsAfter.requests).toBe(1);
      expect(statsAfter.errors).toBe(0);
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
        json: () => Promise.resolve({ events: mockEvents })
      }));

      const events = await client.fetchCalendarEvents('2026-02-10', '2026-02-17');
      expect(events).toHaveLength(2);
      expect(events[0].title).toBe('Event 1');
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
        json: () => Promise.resolve({ reports: mockReports })
      }));

      const reports = await client.fetchCommitteeReports(10);
      expect(reports).toHaveLength(2);
    });
  });

  describe('getStats', () => {
    it('should return request statistics', () => {
      const stats = client.getStats();
      expect(stats).toHaveProperty('requests');
      expect(stats).toHaveProperty('errors');
      expect(stats).toHaveProperty('successRate');
    });

    it('should calculate success rate correctly', async () => {
      // 2 successful requests
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ result: 'success' })
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
  });
});
