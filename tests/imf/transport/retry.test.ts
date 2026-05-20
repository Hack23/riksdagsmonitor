/**
 * IMF transport retry — calculateRetryDelay back-off table, Retry-After
 * cap, and ImfClient retry-on-429 / 5xx integration.
 *
 * Migrated from tests/imf-client.test.ts (describes 'retry behaviour'
 * and 'calculateRetryDelay'). Adds the RETRY_AFTER_CAP_MS=30_000
 * invariant required by acceptance criteria of #2620.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ImfClient,
  calculateRetryDelay,
  RETRY_AFTER_CAP_MS,
} from '../../../scripts/imf-client.js';

describe('RETRY_AFTER_CAP_MS', () => {
  // NEW invariant (acceptance criteria of #2620): pin the cap so a
  // future "let's wait longer" tweak can't accidentally introduce
  // pathological multi-minute sleeps that block CI workflows.
  it('is exactly 30_000 ms (30 s)', () => {
    expect(RETRY_AFTER_CAP_MS).toBe(30_000);
  });
});

describe('calculateRetryDelay', () => {
  it('applies exponential back-off: 1s / 2s / 4s', () => {
    expect(calculateRetryDelay(0)).toBe(1_000);
    expect(calculateRetryDelay(1)).toBe(2_000);
    expect(calculateRetryDelay(2)).toBe(4_000);
  });

  it('honours a positive Retry-After header (delta-seconds)', () => {
    expect(calculateRetryDelay(0, '5')).toBe(5_000);
  });

  it('caps Retry-After at 30 s to avoid pathological sleeps', () => {
    expect(calculateRetryDelay(0, '3600')).toBe(30_000);
  });

  it('ignores invalid / non-positive Retry-After and falls back to exponential', () => {
    expect(calculateRetryDelay(1, 'abc')).toBe(2_000);
    expect(calculateRetryDelay(1, '0')).toBe(2_000);
    expect(calculateRetryDelay(1, '-5')).toBe(2_000);
    expect(calculateRetryDelay(1, null)).toBe(2_000);
    expect(calculateRetryDelay(1, undefined)).toBe(2_000);
  });

  it('clamps negative attempt numbers to attempt 0', () => {
    expect(calculateRetryDelay(-3)).toBe(1_000);
  });
});

describe('ImfClient retry behaviour', () => {
  let client: ImfClient;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    client = new ImfClient({ weoVintage: 'WEO-2026-04', maxRetries: 1, timeout: 3_000 });
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('retries on 429 with back-off', async () => {
    let calls = 0;
    global.fetch = vi.fn(async () => {
      calls += 1;
      if (calls === 1) return new Response('rate-limited', { status: 429 });
      return new Response(
        JSON.stringify({ values: { NGDP_RPCH: { SWE: { '2024': 1.1 } } } }),
        { status: 200 },
      );
    }) as unknown as typeof global.fetch;

    const series = await client.getWeoIndicator('SWE', 'NGDP_RPCH');
    expect(calls).toBe(2);
    expect(series).toHaveLength(1);
  });

  it('retries on 5xx and gives up after maxRetries', async () => {
    global.fetch = vi.fn(async () => new Response('boom', { status: 500 })) as unknown as typeof global.fetch;
    await expect(client.getWeoIndicator('SWE', 'NGDP_RPCH')).rejects.toThrow(/IMF API error/);
  });

  it('does not retry non-transient 4xx responses', async () => {
    const spy = vi.fn(async () => new Response('not found', { status: 404 })) as unknown as typeof global.fetch;
    global.fetch = spy;

    await expect(client.getWeoIndicator('SWE', 'NGDP_RPCH')).rejects.toThrow(/IMF API error/);
    expect((spy as unknown as { mock: { calls: unknown[][] } }).mock.calls).toHaveLength(1);
  });

  it('does not retry JSON parse errors from successful responses', async () => {
    const spy = vi.fn(async () => new Response('not-json', { status: 200 })) as unknown as typeof global.fetch;
    global.fetch = spy;

    await expect(client.getWeoIndicator('SWE', 'NGDP_RPCH')).rejects.toThrow();
    expect((spy as unknown as { mock: { calls: unknown[][] } }).mock.calls).toHaveLength(1);
  });

  it('does not retry non-network TypeError programmer errors', async () => {
    const spy = vi.fn(async () => {
      throw new TypeError('Cannot read properties of undefined');
    }) as unknown as typeof global.fetch;
    global.fetch = spy;

    await expect(client.getWeoIndicator('SWE', 'NGDP_RPCH')).rejects.toThrow(
      /Cannot read properties/,
    );
    expect((spy as unknown as { mock: { calls: unknown[][] } }).mock.calls).toHaveLength(1);
  });
});
