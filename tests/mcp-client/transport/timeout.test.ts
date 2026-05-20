/**
 * Transport — external-URL fetch timeout tests.
 *
 * Covers `scripts/mcp-client/transport/timeout.ts`:
 *   - `EXTERNAL_URL_FETCH_TIMEOUT_MS` constant
 *   - `fetchExternalUrlText()` happy path (text body)
 *   - non-2xx → null with console.warn
 *   - network error → null with console.warn
 *   - AbortController-backed abort on slow response
 *
 * Hack23/riksdagsmonitor#2578 follow-up — per-domain layout under
 * `tests/mcp-client/transport/`. The pre-existing
 * `tests/mcp-client-transport-timeout.test.ts` is intentionally left
 * in place (disjoint scope) — this file adds focused coverage of the
 * pure helper signature.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  EXTERNAL_URL_FETCH_TIMEOUT_MS,
  fetchExternalUrlText,
} from '../../../scripts/mcp-client/transport/timeout.js';

describe('transport/timeout', () => {
  let originalFetch: typeof global.fetch;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    originalFetch = global.fetch;
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    warnSpy.mockRestore();
  });

  it('should expose EXTERNAL_URL_FETCH_TIMEOUT_MS = 15000 ms', () => {
    expect(EXTERNAL_URL_FETCH_TIMEOUT_MS).toBe(15_000);
  });

  it('should return body text on 2xx response', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve('hello world') }),
    ) as unknown as typeof global.fetch;
    const result = await fetchExternalUrlText('https://example.com/data.txt');
    expect(result).toBe('hello world');
  });

  it('should pass Accept header on the outgoing request', async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve('') }),
    ) as unknown as typeof global.fetch;
    global.fetch = fetchSpy;
    await fetchExternalUrlText('https://example.com/data.md');
    const call = (fetchSpy as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(call[1].headers).toMatchObject({ Accept: expect.stringContaining('text/') });
  });

  it('should return null on non-2xx response and log a warning', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, status: 503, text: () => Promise.resolve('') }),
    ) as unknown as typeof global.fetch;
    const result = await fetchExternalUrlText('https://example.com/missing');
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('HTTP 503'));
  });

  it('should return null on network error and log a warning', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('ECONNREFUSED'))) as unknown as typeof global.fetch;
    const result = await fetchExternalUrlText('https://example.com/down');
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Could not fetch external URL'));
  });

  it('should honour the timeoutMs override', async () => {
    let signal: AbortSignal | undefined;
    global.fetch = vi.fn((_url: string, init: RequestInit) => {
      signal = init.signal as AbortSignal;
      return new Promise((_, reject) => {
        if (signal) {
          signal.addEventListener('abort', () => reject(new Error('aborted')));
        }
      });
    }) as unknown as typeof global.fetch;

    const result = await fetchExternalUrlText('https://example.com/slow', 5);
    expect(result).toBeNull();
    expect(signal?.aborted).toBe(true);
  });
});
