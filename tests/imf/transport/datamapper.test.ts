/**
 * IMF Datamapper transport — unauth REST + Mozilla/5.0 UA + SDMX-only
 * diagnostic + WEO-only Datamapper-path tests.
 *
 * Migrated verbatim from tests/imf-client.test.ts (describes
 * 'getWeoIndicator', 'getLatestWeoIndicator', 'compareCountriesWeo',
 * 'getWeoIndicatorsBatch', and the WEO→SDMX-only diagnostic describe).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ImfClient, ImfWeoSdmxOnlyError } from '../../../scripts/imf-client.js';

describe('ImfClient — Datamapper transport', () => {
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

  describe('getWeoIndicator', () => {
    it('parses the Datamapper envelope and returns descending years', async () => {
      global.fetch = vi.fn(async () =>
        new Response(
          JSON.stringify({
            values: {
              NGDP_RPCH: {
                SWE: {
                  '2022': 2.7,
                  '2023': -0.1,
                  '2024': 1.1,
                  '2025': 1.9,
                },
              },
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ) as unknown as typeof global.fetch;

      const series = await client.getWeoIndicator('SWE', 'NGDP_RPCH', 10);
      expect(series).toHaveLength(4);
      expect(series[0].date).toBe('2025');
      expect(series[series.length - 1].date).toBe('2022');
      for (const dp of series) {
        expect(dp.provider).toBe('imf');
        expect(dp.indicatorId).toBe('NGDP_RPCH');
        expect(dp.countryCode).toBe('SWE');
      }
    });

    it('flags future years as projections and stamps the vintage', async () => {
      const currentYear = new Date().getUTCFullYear();
      global.fetch = vi.fn(async () =>
        new Response(
          JSON.stringify({
            values: {
              GGXWDG_NGDP: {
                SWE: {
                  [String(currentYear - 1)]: 32.0,
                  [String(currentYear)]: 31.5,
                  [String(currentYear + 1)]: 31.0,
                  [String(currentYear + 3)]: 30.1,
                },
              },
            },
          }),
          { status: 200 },
        ),
      ) as unknown as typeof global.fetch;

      const series = await client.getWeoIndicator('SWE', 'GGXWDG_NGDP');
      const past = series.find((p) => p.date === String(currentYear - 1));
      const current = series.find((p) => p.date === String(currentYear));
      const future = series.find((p) => p.date === String(currentYear + 1));
      expect(past?.projection).toBe(false);
      expect(past?.projectionVintage).toBeUndefined();
      expect(current?.projection).toBe(false);
      expect(future?.projection).toBe(true);
      expect(future?.projectionVintage).toBe('WEO-2026-04');
    });

    it('returns an empty array when the response has no matching indicator', async () => {
      global.fetch = vi.fn(async () =>
        new Response(JSON.stringify({ values: {} }), { status: 200 }),
      ) as unknown as typeof global.fetch;
      const series = await client.getWeoIndicator('SWE', 'NGDP_RPCH');
      expect(series).toEqual([]);
    });

    it('drops non-finite / null values defensively', async () => {
      global.fetch = vi.fn(async () =>
        new Response(
          JSON.stringify({
            values: {
              NGDP_RPCH: {
                SWE: { '2022': 2.7, '2023': null, '2024': 'n/a', '2025': 1.9 },
              },
            },
          }),
          { status: 200 },
        ),
      ) as unknown as typeof global.fetch;
      const series = await client.getWeoIndicator('SWE', 'NGDP_RPCH');
      expect(series.map((p) => p.date).sort()).toEqual(['2022', '2025']);
    });

    it('truncates to the requested year count', async () => {
      global.fetch = vi.fn(async () =>
        new Response(
          JSON.stringify({
            values: {
              NGDP_RPCH: {
                SWE: {
                  '2018': 1, '2019': 2, '2020': 3, '2021': 4,
                  '2022': 5, '2023': 6, '2024': 7,
                },
              },
            },
          }),
          { status: 200 },
        ),
      ) as unknown as typeof global.fetch;
      const series = await client.getWeoIndicator('SWE', 'NGDP_RPCH', 3);
      expect(series).toHaveLength(3);
      expect(series.map((p) => p.date)).toEqual(['2024', '2023', '2022']);
    });

    it('rejects non-positive or non-integer year counts', async () => {
      await expect(client.getWeoIndicator('SWE', 'NGDP_RPCH', 0)).rejects.toThrow();
      await expect(client.getWeoIndicator('SWE', 'NGDP_RPCH', -1)).rejects.toThrow();
      await expect(client.getWeoIndicator('SWE', 'NGDP_RPCH', 2.5)).rejects.toThrow();
    });

    it('normalises ISO-3 input to uppercase before building the URL', async () => {
      const spy = vi.fn(async () =>
        new Response(
          JSON.stringify({ values: { NGDP_RPCH: { SWE: { '2024': 1.1 } } } }),
          { status: 200 },
        ),
      ) as unknown as typeof global.fetch;
      global.fetch = spy;
      await client.getWeoIndicator('swe', 'NGDP_RPCH');
      const calledUrl = (spy as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0] as string;
      expect(calledUrl).toContain('/NGDP_RPCH/SWE');
    });

    it('sends an explicit User-Agent for IMF Datamapper compatibility', async () => {
      const spy = vi.fn(async () =>
        new Response(
          JSON.stringify({ values: { NGDP_RPCH: { SWE: { '2024': 1.1 } } } }),
          { status: 200 },
        ),
      ) as unknown as typeof global.fetch;
      global.fetch = spy;
      await client.getWeoIndicator('SWE', 'NGDP_RPCH');
      const init = (spy as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][1] as {
        headers: Record<string, string>;
      };
      expect(init.headers['User-Agent']).toContain('Riksdagsmonitor');
      // Browser-style Mozilla/5.0 prefix prevents IMF Datamapper 403 (verified via curl)
      expect(init.headers['User-Agent']).toMatch(/^Mozilla\/5\.0\b/);
    });

    // NEW invariant (acceptance criteria of #2620): Datamapper requests
    // must never carry the SDMX subscription key header — that header
    // belongs to the SDMX transport only.
    it('does NOT send Ocp-Apim-Subscription-Key on Datamapper requests (case-insensitive check)', async () => {
      const keyed = new ImfClient({ sdmxSubscriptionKey: 'must-not-leak', maxRetries: 0 });
      const spy = vi.fn(async () =>
        new Response(
          JSON.stringify({ values: { NGDP_RPCH: { SWE: { '2024': 1.1 } } } }),
          { status: 200 },
        ),
      ) as unknown as typeof global.fetch;
      global.fetch = spy;
      await keyed.getWeoIndicator('SWE', 'NGDP_RPCH', 1);
      const init = (spy as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][1] as RequestInit;
      const headers = (init.headers ?? {}) as Record<string, string>;
      // Case-insensitive — any casing variant counts as a leak.
      const lowerCaseKeys = Object.keys(headers).map((k) => k.toLowerCase());
      expect(lowerCaseKeys).not.toContain('ocp-apim-subscription-key');
    });
  });
});

describe('ImfClient.getWeoIndicator → SDMX-only diagnostic', () => {
  it('throws ImfWeoSdmxOnlyError when Datamapper returns 0 points for a known SDMX-only code', async () => {
    const client = new ImfClient({ maxRetries: 0, timeout: 3_000 });
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ values: {} }), { status: 200 }));
    await expect(client.getWeoIndicator('SWE', 'GGR_NGDP')).rejects.toThrow(ImfWeoSdmxOnlyError);
  });

  it('returns [] (does NOT throw) for non-listed codes when the Datamapper envelope is genuinely empty', async () => {
    // Future / experimental codes not yet in IMF_WEO_SDMX_ONLY must keep
    // the soft-empty contract so adding new codes to the catalog is safe.
    const client = new ImfClient({ maxRetries: 0, timeout: 3_000 });
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ values: {} }), { status: 200 }));
    await expect(client.getWeoIndicator('SWE', 'EXPERIMENTAL_FUTURE_CODE')).resolves.toEqual([]);
  });
});
