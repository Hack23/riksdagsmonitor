/**
 * IMF client integration spine — singleton + listDatamapperIndicators.
 *
 * Aggregates the top-level ImfClient surface tests that exercise public
 * API across multiple sub-modules and don't fit a single transport /
 * parser / errors file.
 *
 * Migrated verbatim from tests/imf-client.test.ts ('getDefaultImfClient'
 * and 'ImfClient.listDatamapperIndicators').
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ImfClient, getDefaultImfClient } from '../../scripts/imf-client.js';

describe('getDefaultImfClient', () => {
  it('returns the same instance across calls (singleton)', () => {
    expect(getDefaultImfClient()).toBe(getDefaultImfClient());
  });
});

describe('ImfClient.listDatamapperIndicators', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('hits the /indicators endpoint and parses the envelope', async () => {
    const client = new ImfClient({ maxRetries: 0, timeout: 3_000 });
    const calledUrls: string[] = [];
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      calledUrls.push(typeof input === 'string' ? input : input.toString());
      return new Response(
        JSON.stringify({
          indicators: {
            NGDP_RPCH: { label: 'Real GDP growth', dataset: 'WEO' },
            GGR_G01_GDP_PT: { label: 'Revenue', dataset: 'FM' },
          },
        }),
        { status: 200 },
      );
    });
    const out = await client.listDatamapperIndicators();
    expect(calledUrls[0]).toBe('https://www.imf.org/external/datamapper/api/v1/indicators');
    expect(out.size).toBe(2);
    expect(out.get('NGDP_RPCH')?.dataset).toBe('WEO');
  });
});

describe('ImfClient.getWeoIndicatorsBatch', () => {
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

  it('issues one Datamapper call per indicator for the same country', async () => {
    const spy = vi.fn(async (url: string) => {
      const parts = url.split('/');
      const indicator = parts[parts.length - 2];
      const country = parts[parts.length - 1];
      return new Response(
        JSON.stringify({ values: { [indicator]: { [country]: { '2024': 1.23 } } } }),
        { status: 200 },
      );
    }) as unknown as typeof global.fetch;
    global.fetch = spy;

    const result = await client.getWeoIndicatorsBatch('SWE', ['NGDP_RPCH', 'PCPIPCH', 'LUR']);
    expect(result.size).toBe(3);
    expect(result.get('NGDP_RPCH')?.[0]?.value).toBe(1.23);
    expect(result.get('PCPIPCH')?.[0]?.value).toBe(1.23);
    expect(result.get('LUR')?.[0]?.value).toBe(1.23);
    expect((spy as unknown as { mock: { calls: unknown[][] } }).mock.calls).toHaveLength(3);
  });

  it('isolates individual failures — a flaky indicator maps to []', async () => {
    let call = 0;
    global.fetch = vi.fn(async () => {
      call += 1;
      if (call === 2) {
        return new Response('boom', { status: 500 });
      }
      return new Response(
        JSON.stringify({
          values: { NGDP_RPCH: { SWE: { '2024': 2.1 } }, LUR: { SWE: { '2024': 7.5 } } },
        }),
        { status: 200 },
      );
    }) as unknown as typeof global.fetch;

    const noRetryClient = new ImfClient({ maxRetries: 0, timeout: 1_000 });
    const result = await noRetryClient.getWeoIndicatorsBatch('SWE', ['NGDP_RPCH', 'PCPIPCH', 'LUR']);
    expect(result.get('NGDP_RPCH')?.length).toBe(1);
    expect(result.get('PCPIPCH')).toEqual([]);
    expect(result.get('LUR')?.length).toBe(1);
  });

  it('emits a diagnostic event when one indicator is fail-softed', async () => {
    const diagnostics = vi.fn();
    global.fetch = vi.fn(async () => new Response('boom', { status: 500 })) as unknown as typeof global.fetch;

    const noRetryClient = new ImfClient({
      maxRetries: 0,
      timeout: 1_000,
      onBatchIndicatorError: diagnostics,
    });
    const result = await noRetryClient.getWeoIndicatorsBatch('SWE', ['PCPIPCH']);

    expect(result.get('PCPIPCH')).toEqual([]);
    expect(diagnostics).toHaveBeenCalledOnce();
    expect(diagnostics).toHaveBeenCalledWith(
      expect.objectContaining({
        countryCode: 'SWE',
        indicatorId: 'PCPIPCH',
        error: expect.any(Error),
      }),
    );
  });

  it('rethrows non-retryable indicator HTTP errors instead of fail-softing them', async () => {
    const diagnostics = vi.fn();
    global.fetch = vi.fn(async () => new Response('missing', { status: 404 })) as unknown as typeof global.fetch;

    const noRetryClient = new ImfClient({
      maxRetries: 0,
      timeout: 1_000,
      onBatchIndicatorError: diagnostics,
    });

    await expect(noRetryClient.getWeoIndicatorsBatch('SWE', ['BAD_CODE'])).rejects.toThrow(
      /IMF API error: 404/,
    );
    expect(diagnostics).not.toHaveBeenCalled();
  });

  it('fail-softs fetch network TypeErrors but not programmer TypeErrors', async () => {
    global.fetch = vi.fn(async () => {
      throw new TypeError('fetch failed');
    }) as unknown as typeof global.fetch;
    const noRetryClient = new ImfClient({ maxRetries: 0, timeout: 1_000 });

    const result = await noRetryClient.getWeoIndicatorsBatch('SWE', ['PCPIPCH']);
    expect(result.get('PCPIPCH')).toEqual([]);

    global.fetch = vi.fn(async () => {
      throw new TypeError('Cannot read properties of undefined');
    }) as unknown as typeof global.fetch;
    await expect(noRetryClient.getWeoIndicatorsBatch('SWE', ['PCPIPCH'])).rejects.toThrow(
      /Cannot read properties/,
    );
  });

  it('validates years up-front instead of swallowing caller errors', async () => {
    global.fetch = vi.fn();

    await expect(client.getWeoIndicatorsBatch('SWE', ['NGDP_RPCH'], 0)).rejects.toThrow(
      /positive integer/,
    );
    expect((global.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls).toHaveLength(0);
  });
});

describe('ImfClient.getLatestWeoIndicator', () => {
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

  it('prefers the latest non-projection value when available', async () => {
    const currentYear = new Date().getUTCFullYear();
    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          values: {
            NGDP_RPCH: {
              SWE: {
                [String(currentYear - 1)]: 1.9,
                [String(currentYear)]: 2.3,
                [String(currentYear + 1)]: 2.1,
              },
            },
          },
        }),
        { status: 200 },
      ),
    ) as unknown as typeof global.fetch;
    const latest = await client.getLatestWeoIndicator('SWE', 'NGDP_RPCH');
    expect(latest?.projection).toBe(false);
    expect(latest?.date).toBe(String(currentYear));
  });

  it('falls back to the earliest projection when only projections are present', async () => {
    const currentYear = new Date().getUTCFullYear();
    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          values: {
            NGDP_RPCH: {
              SWE: {
                [String(currentYear + 1)]: 2.1,
                [String(currentYear + 2)]: 2.0,
              },
            },
          },
        }),
        { status: 200 },
      ),
    ) as unknown as typeof global.fetch;
    const latest = await client.getLatestWeoIndicator('SWE', 'NGDP_RPCH');
    expect(latest?.projection).toBe(true);
  });

  it('returns null when the series is empty', async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ values: {} }), { status: 200 }),
    ) as unknown as typeof global.fetch;
    const latest = await client.getLatestWeoIndicator('SWE', 'NGDP_RPCH');
    expect(latest).toBeNull();
  });
});

describe('ImfClient.compareCountriesWeo', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('returns one entry per country, null on failure', async () => {
    let call = 0;
    global.fetch = vi.fn(async () => {
      call += 1;
      if (call === 2) {
        return new Response('boom', { status: 500 });
      }
      return new Response(
        JSON.stringify({ values: { NGDP_RPCH: { FOO: { '2024': 1.1 } } } }),
        { status: 200 },
      );
    }) as unknown as typeof global.fetch;

    const fast = new ImfClient({ maxRetries: 0 });
    const out = await fast.compareCountriesWeo(['SWE', 'DNK', 'NOR'], 'NGDP_RPCH');
    expect(out.size).toBe(3);
    expect(out.get('DNK')).toBeNull();
  });
});
