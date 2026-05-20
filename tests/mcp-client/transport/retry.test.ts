/**
 * Transport — retry primitives + end-to-end retry behaviour.
 *
 * Covers `scripts/mcp-client/transport/retry.ts`:
 *   - `calculateRetryDelay()` exponential-backoff anchored on `RETRY_DELAY`.
 *   - `isRetryableNetworkError()` classification matrix.
 *
 * Plus the dispatcher-side retry loop (the
 * `Hack23/riksdagsmonitor#2580`-equivalent retry cap that the news Timer A
 * budget depends on — see the issue's "Security / ISMS Notes" section).
 *
 * Migrated from `tests/mcp-client-core-part1.test.ts` lines 706-746
 * plus new unit coverage of the pure retry helpers
 * (Hack23/riksdagsmonitor#2578 follow-up).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPClient } from '../../../scripts/mcp-client.js';
import {
  calculateRetryDelay,
  isRetryableNetworkError,
} from '../../../scripts/mcp-client/transport/retry.js';
import { RETRY_DELAY } from '../../../scripts/mcp-client/config/defaults.js';

describe('transport/retry — pure helpers', () => {
  describe('calculateRetryDelay', () => {
    it('returns RETRY_DELAY for retryCount=0 (first retry)', () => {
      expect(calculateRetryDelay(0)).toBe(RETRY_DELAY);
    });

    it('doubles per retry (2^N exponential backoff)', () => {
      expect(calculateRetryDelay(1)).toBe(RETRY_DELAY * 2);
      expect(calculateRetryDelay(2)).toBe(RETRY_DELAY * 4);
      expect(calculateRetryDelay(3)).toBe(RETRY_DELAY * 8);
    });

    it('clamps negative retryCount to 0 (no underflow)', () => {
      expect(calculateRetryDelay(-1)).toBe(RETRY_DELAY);
      expect(calculateRetryDelay(-5)).toBe(RETRY_DELAY);
    });
  });

  describe('isRetryableNetworkError', () => {
    it('returns true for AbortError (timeout-induced)', () => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      expect(isRetryableNetworkError(err)).toBe(true);
    });

    it.each([
      ['Network error'],
      ['ECONNREFUSED'],
      ['Connection closed'],
      ['Too Many Requests'],
      ['fetch failed: network issue'],
    ])('returns true for transient signature: %s', (msg) => {
      expect(isRetryableNetworkError(new Error(msg))).toBe(true);
    });

    it('returns false for HTTP server errors (non-network)', () => {
      expect(isRetryableNetworkError(new Error('MCP server error: 500'))).toBe(false);
      expect(isRetryableNetworkError(new Error('Invalid tool name'))).toBe(false);
    });

    it('handles empty / undefined message safely', () => {
      const err = new Error('');
      expect(isRetryableNetworkError(err)).toBe(false);
    });
  });
});

describe('MCPClient.request — end-to-end retry loop', () => {
  let client: MCPClient;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    client = new MCPClient();
    originalFetch = global.fetch;
    // Patch sleep to skip the 2s/4s backoff during tests.
    vi.spyOn(client, 'sleep').mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should retry on network error', async () => {
    let attempt = 0;
    global.fetch = vi.fn(() => {
      attempt++;
      if (attempt < 3) return Promise.reject(new Error('Network error'));
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { success: true } }),
      });
    }) as unknown as typeof global.fetch;

    const result = await client.request('test_tool', {});
    expect(result).toEqual({ success: true });
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('should retry on ECONNREFUSED error', async () => {
    let attempt = 0;
    global.fetch = vi.fn(() => {
      attempt++;
      if (attempt < 2) return Promise.reject(new Error('ECONNREFUSED'));
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { ok: true } }),
      });
    }) as unknown as typeof global.fetch;

    const result = await client.request('test_tool', {});
    expect(result).toEqual({ ok: true });
  });

  it('should fail after max retries', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as unknown as typeof global.fetch;
    await expect(client.request('test_tool', {})).rejects.toThrow('Network error');
    // maxRetries = 3 → request() runs maxRetries - 1 retries (= 2) plus original = 3 total
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});
