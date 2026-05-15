import { describe, it, expect, vi } from 'vitest';

import type { ImfDataPoint } from '../scripts/imf-client.js';
import { fetchWeoPayload } from '../scripts/imf-fetch.js';

function makePoint(overrides: Partial<ImfDataPoint> = {}): ImfDataPoint {
  return {
    countryCode: 'SWE',
    countryName: 'Sweden',
    indicatorId: 'NGDP_RPCH',
    indicatorName: 'GDP growth',
    date: '2026',
    value: 2.1,
    projection: false,
    provider: 'imf',
    ...overrides,
  };
}

function makeClient(overrides: Partial<Record<'getWeoIndicator' | 'sdmxFetch', unknown>> = {}) {
  return {
    datamapperBaseURL: 'https://www.imf.org/external/datamapper/api/v1',
    userAgent: 'Mozilla/5.0 (compatible; test)',
    timeout: 5_000,
    weoVintage: 'WEO-2026-04',
    sdmxSubscriptionKey: undefined,
    getWeoIndicator: vi.fn().mockResolvedValue([makePoint()]),
    sdmxFetch: vi.fn(),
    ...overrides,
  };
}

describe('fetchWeoPayload', () => {
  it('retries transient failures and succeeds before exhausting the budget', async () => {
    const client = makeClient({
      getWeoIndicator: vi.fn()
        .mockRejectedValueOnce(new Error('network timeout'))
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockResolvedValueOnce([makePoint({ value: 2.4 })]),
    });
    const sleepFn = vi.fn().mockResolvedValue(undefined);
    const logs: unknown[] = [];

    const payload = await fetchWeoPayload(
      { country: 'SWE', indicator: 'NGDP_RPCH', years: 1 },
      { client: client as never, sleepFn, logger: (event) => logs.push(event) },
    );

    expect(client.getWeoIndicator).toHaveBeenCalledTimes(3);
    expect(sleepFn).toHaveBeenCalledTimes(2);
    expect(payload.transport).toBe('datamapper');
    expect((payload.dataPoints as ImfDataPoint[])[0]?.value).toBe(2.4);
    expect(logs.some((event) => JSON.stringify(event).includes('weo-fetch-retrying'))).toBe(true);
  });

  it('falls back to direct Datamapper REST when repeated empty-series failures persist', async () => {
    const client = makeClient({
      getWeoIndicator: vi.fn().mockResolvedValue([]),
    });
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({
      values: { NGDP_RPCH: { SWE: { '2026': 1.8, '2025': 1.2 } } },
    }), { status: 200 })) as unknown as typeof fetch;

    const payload = await fetchWeoPayload(
      { country: 'SWE', indicator: 'NGDP_RPCH', years: 2 },
      { client: client as never, fetchFn, sleepFn: async () => {} },
    );

    expect(client.getWeoIndicator).toHaveBeenCalledTimes(3);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(payload.transport).toBe('direct-datamapper');
    expect((payload.dataPoints as ImfDataPoint[])).toHaveLength(2);
  });
});
