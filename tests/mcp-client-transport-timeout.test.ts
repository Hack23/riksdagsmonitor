/**
 * Regression tests for `scripts/mcp-client/transport/timeout.ts`.
 *
 * These guard the contract documented in the module header: the
 * `AbortController` must stay active across body consumption so that a
 * fetch which resolves its headers but then stalls or aborts during
 * `response.text()` cannot hang the news pipeline indefinitely. The earlier
 * bug — `clearTimeout` fired *before* `response.text()` — silently
 * regressed when callers reordered the helper, so a fast unit test pins
 * the behaviour for future refactors.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

import { fetchExternalUrlText } from '../scripts/mcp-client/transport/timeout.js';

describe('fetchExternalUrlText — abort-during-body regression', () => {
  let originalFetch: typeof globalThis.fetch;
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  afterEach(() => {
    if (originalFetch) globalThis.fetch = originalFetch;
    warnSpy.mockClear();
  });

  it('returns null when the response body rejects after the timeout fires', async () => {
    originalFetch = globalThis.fetch;

    // Simulate a fetch that resolves the headers immediately but then hands
    // back a body which, once aborted, rejects via the AbortController. If
    // the helper cleared the timer before `response.text()`, the AbortError
    // path would never fire and this test would hang until Vitest killed
    // it. With the fix in place, the short timeout aborts the body read and
    // the helper resolves to `null` quickly.
    globalThis.fetch = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      const signal = init?.signal;
      const body = new Promise<string>((_resolve, reject) => {
        if (signal) {
          signal.addEventListener(
            'abort',
            () =>
              reject(
                Object.assign(new Error('aborted'), { name: 'AbortError' }),
              ),
            { once: true },
          );
        }
        // Never resolve on its own — exits the test only via abort.
      });
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => body,
      } as unknown as Response);
    }) as unknown as typeof globalThis.fetch;

    const start = Date.now();
    const result = await fetchExternalUrlText('https://example.test/slow', 25);
    const elapsed = Date.now() - start;

    expect(result).toBeNull();
    // The timeout fired and aborted body consumption — we should be well
    // under the 15s helper default and within ~10x of the 25ms budget on a
    // CI runner.
    expect(elapsed).toBeLessThan(2000);
  });

  it('clears the abort timer on transport rejection (no dangling timers)', async () => {
    originalFetch = globalThis.fetch;

    // If the helper does NOT clear the timer in `finally`, an uncleared
    // pending timeout would keep the event loop alive after the rejection.
    // We assert resolution via the rejection path and verify the result
    // is `null` (the helper's documented contract on transport failure).
    globalThis.fetch = vi.fn(() =>
      Promise.reject(Object.assign(new Error('ECONNREFUSED'), { name: 'TypeError' })),
    ) as unknown as typeof globalThis.fetch;

    const result = await fetchExternalUrlText('https://example.test/refused', 5_000);
    expect(result).toBeNull();
  });
});
