/**
 * Tests for IMF Client
 *
 * Covers Datamapper JSON parsing, projection detection, retry behaviour,
 * rate-limit (429) back-off, and SDMX passthrough. No live network
 * calls — all transport stubbed with `global.fetch` mocks.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ImfClient,
  getDefaultImfClient,
  IMF_WEO_INDICATORS,
  IMF_FM_INDICATORS,
  IMF_WEO_DATAMAPPER_AVAILABLE,
  IMF_WEO_SDMX_ONLY,
  ImfWeoSdmxOnlyError,
  calculateRetryDelay,
  parseDatamapperValues,
  parseDatamapperIndicators,
  weoSdmxPath,
  normalizeSdmxPathForBase,
} from '../scripts/imf-client.js';

describe('ImfClient', () => {
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

  describe('constructor', () => {
    it('applies sensible defaults', () => {
      const defaults = new ImfClient();
      expect(defaults.datamapperBaseURL).toBe('https://www.imf.org/external/datamapper/api/v1');
      expect(defaults.sdmxBaseURL).toBe('https://api.imf.org/external/sdmx/3.0');
      expect(defaults.timeout).toBe(15_000);
      expect(defaults.maxRetries).toBe(2);
      expect(defaults.userAgent).toContain('Riksdagsmonitor');
      expect(defaults.userAgent).not.toMatch(/Riksdagsmonitor\/\d/);
      // Mozilla/5.0 prefix is required for IMF Datamapper (403 without it, confirmed via curl)
      expect(defaults.userAgent).toMatch(/^Mozilla\/5\.0\b/);
      expect(defaults.weoVintage).toMatch(/^WEO-\d{4}-\d{2}$/);
    });

    it('accepts overrides', () => {
      const custom = new ImfClient({
        datamapperBaseURL: 'https://example.test/api',
        sdmxBaseURL: 'https://sdmx.example.test',
        timeout: 1_000,
        maxRetries: 0,
        userAgent: 'custom-agent',
        weoVintage: 'WEO-2999-99',
      });
      expect(custom.datamapperBaseURL).toBe('https://example.test/api');
      expect(custom.sdmxBaseURL).toBe('https://sdmx.example.test');
      expect(custom.timeout).toBe(1_000);
      expect(custom.maxRetries).toBe(0);
      expect(custom.userAgent).toBe('custom-agent');
      expect(custom.weoVintage).toBe('WEO-2999-99');
    });
  });

  describe('IMF_WEO_INDICATORS / IMF_FM_INDICATORS', () => {
    it('exposes the canonical WEO headline indicator codes', () => {
      expect(IMF_WEO_INDICATORS.gdpGrowth).toBe('NGDP_RPCH');
      expect(IMF_WEO_INDICATORS.inflationCpi).toBe('PCPIPCH');
      expect(IMF_WEO_INDICATORS.unemployment).toBe('LUR');
      expect(IMF_WEO_INDICATORS.generalGovGrossDebt).toBe('GGXWDG_NGDP');
      expect(IMF_WEO_INDICATORS.currentAccountBalance).toBe('BCA_NGDPD');
    });

    it('exposes Fiscal Monitor indicators', () => {
      expect(IMF_FM_INDICATORS.primaryBalance).toBe('GGXONLB_NGDP');
    });
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
                  '2018': 1,
                  '2019': 2,
                  '2020': 3,
                  '2021': 4,
                  '2022': 5,
                  '2023': 6,
                  '2024': 7,
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
  });

  describe('getLatestWeoIndicator', () => {
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

  describe('compareCountriesWeo', () => {
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

  describe('retry behaviour', () => {
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

  describe('sdmxFetch', () => {
    it('prepends the SDMX base URL when path is missing the leading slash', async () => {
      const spy = vi.fn(async () =>
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      ) as unknown as typeof global.fetch;
      global.fetch = spy;
      await client.sdmxFetch('data/IMF.RES,WEO,9.0.0/NGDP_RPCH.SWE.A.');
      const url = (spy as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0] as string;
      // sdmxFetch rewrites the human-readable comma-form dataflow ref into the
      // SDMX 3.0 slash-form (`/data/dataflow/<agency>/<flow>/<version>/...`)
      // because api.imf.org/sdmx/3.0 silently 404s the comma form.
      expect(url).toBe(
        'https://api.imf.org/external/sdmx/3.0/data/dataflow/IMF.RES/WEO/9.0.0/NGDP_RPCH.SWE.A.',
      );
    });

    it('sends Ocp-Apim-Subscription-Key header when configured via constructor option', async () => {
      const keyed = new ImfClient({ sdmxSubscriptionKey: 'test-primary-key-12345' });
      const spy = vi.fn(async () =>
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      ) as unknown as typeof global.fetch;
      global.fetch = spy;
      await keyed.sdmxFetch('/data/IMF.STA,CPI,5.0.0/M.SE.PCPI_IX');
      const init = (spy as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][1] as RequestInit;
      const headers = init.headers as Record<string, string>;
      expect(headers['Ocp-Apim-Subscription-Key']).toBe('test-primary-key-12345');
      expect(headers.Accept).toBe('application/vnd.sdmx.data+json;version=2.0.0');
    });

    it('falls back to IMF_SDMX_SUBSCRIPTION_KEY env var when constructor option omitted', async () => {
      const original = process.env.IMF_SDMX_SUBSCRIPTION_KEY;
      process.env.IMF_SDMX_SUBSCRIPTION_KEY = 'env-fallback-key-67890';
      try {
        const envClient = new ImfClient();
        const spy = vi.fn(async () =>
          new Response(JSON.stringify({ ok: true }), { status: 200 }),
        ) as unknown as typeof global.fetch;
        global.fetch = spy;
        await envClient.sdmxFetch('/data/IMF.STA,CPI,5.0.0/M.SE.PCPI_IX');
        const init = (spy as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][1] as RequestInit;
        const headers = init.headers as Record<string, string>;
        expect(headers['Ocp-Apim-Subscription-Key']).toBe('env-fallback-key-67890');
      } finally {
        if (original === undefined) {
          delete process.env.IMF_SDMX_SUBSCRIPTION_KEY;
        } else {
          process.env.IMF_SDMX_SUBSCRIPTION_KEY = original;
        }
      }
    });

    it('omits Ocp-Apim-Subscription-Key when no key is configured', async () => {
      const original = process.env.IMF_SDMX_SUBSCRIPTION_KEY;
      delete process.env.IMF_SDMX_SUBSCRIPTION_KEY;
      try {
        const noKey = new ImfClient();
        const spy = vi.fn(async () =>
          new Response(JSON.stringify({ ok: true }), { status: 200 }),
        ) as unknown as typeof global.fetch;
        global.fetch = spy;
        await noKey.sdmxFetch('/data/IMF.STA,CPI,5.0.0/M.SE.PCPI_IX');
        const init = (spy as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][1] as RequestInit;
        const headers = init.headers as Record<string, string>;
        expect(headers['Ocp-Apim-Subscription-Key']).toBeUndefined();
      } finally {
        if (original !== undefined) {
          process.env.IMF_SDMX_SUBSCRIPTION_KEY = original;
        }
      }
    });

    it('does NOT send the SDMX subscription key on Datamapper (WEO) calls', async () => {
      const keyed = new ImfClient({ sdmxSubscriptionKey: 'must-not-leak-to-datamapper' });
      const spy = vi.fn(async () =>
        new Response(
          JSON.stringify({ values: { NGDP_RPCH: { SWE: { '2025': 1.9 } } } }),
          { status: 200 },
        ),
      ) as unknown as typeof global.fetch;
      global.fetch = spy;
      await keyed.getWeoIndicator('SWE', 'NGDP_RPCH', 1);
      const init = (spy as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][1] as RequestInit;
      const headers = init.headers as Record<string, string>;
      expect(headers['Ocp-Apim-Subscription-Key']).toBeUndefined();
      // Sanity: Datamapper still gets the standard headers
      expect(headers.Accept).toBe('application/json');
      expect(headers['User-Agent']).toMatch(/^Mozilla\/5\.0/);
    });

    it('surfaces a "subscription key missing or invalid" diagnostic on SDMX 401', async () => {
      const keyless = new ImfClient({ maxRetries: 0 });
      global.fetch = vi.fn(async () =>
        new Response('Unauthorized', {
          status: 401,
          statusText: 'Unauthorized',
          headers: { 'content-type': 'text/plain' },
        }),
      ) as unknown as typeof global.fetch;
      await expect(
        keyless.sdmxFetch('/data/IMF.STA,CPI,5.0.0/M.SE.PCPI_IX'),
      ).rejects.toThrow(/IMF SDMX subscription key missing or invalid \(set IMF_SDMX_SUBSCRIPTION_KEY\)/);
    });

    it('surfaces the auth-failure diagnostic on SDMX 403', async () => {
      const keyless = new ImfClient({ maxRetries: 0 });
      global.fetch = vi.fn(async () =>
        new Response('Forbidden', {
          status: 403,
          statusText: 'Forbidden',
          headers: { 'content-type': 'text/plain' },
        }),
      ) as unknown as typeof global.fetch;
      await expect(
        keyless.sdmxFetch('/data/IMF.STA,CPI,5.0.0/M.SE.PCPI_IX'),
      ).rejects.toThrow(/IMF SDMX subscription key missing or invalid/);
    });

    it('surfaces the auth-failure diagnostic on SDMX 404 when no subscription key was sent (APIM mask)', async () => {
      // APIM returns 404 "Resource not found" — not 401 — when
      // `/data/...` is hit without a subscription key (verified via
      // curl 2026-05-10). Without this branch a direct sdmxFetch()
      // caller sees an indistinguishable 404 and chases a phantom bug.
      // Force-empty `sdmxSubscriptionKey` to override any
      // `IMF_SDMX_SUBSCRIPTION_KEY` that the shell environment may
      // have set (the new copilot-setup-steps wiring exports it
      // session-wide, which would otherwise short-circuit the
      // "no key sent" branch under test).
      const keyless = new ImfClient({ maxRetries: 0, sdmxSubscriptionKey: '' });
      global.fetch = vi.fn(async () =>
        new Response('Resource not found', {
          status: 404,
          statusText: 'Not Found',
          headers: { 'content-type': 'text/plain' },
        }),
      ) as unknown as typeof global.fetch;
      await expect(
        keyless.sdmxFetch('/data/IMF.STA,CPI,5.0.0/M.SE.PCPI_IX'),
      ).rejects.toThrow(/IMF SDMX subscription key missing or invalid \(set IMF_SDMX_SUBSCRIPTION_KEY\)/);
    });

    it('does NOT mask a real 404 as auth-failure when a subscription key WAS sent', async () => {
      const keyed = new ImfClient({ maxRetries: 0, sdmxSubscriptionKey: 'real-key' });
      global.fetch = vi.fn(async () =>
        new Response('Resource not found', {
          status: 404,
          statusText: 'Not Found',
          headers: { 'content-type': 'text/plain' },
        }),
      ) as unknown as typeof global.fetch;
      await expect(
        keyed.sdmxFetch('/data/IMF.STA,DOES_NOT_EXIST,1.0.0/A.SE'),
      ).rejects.toThrow(/IMF API error: 404/);
      await expect(
        keyed.sdmxFetch('/data/IMF.STA,DOES_NOT_EXIST,1.0.0/A.SE'),
      ).rejects.not.toThrow(/subscription key missing or invalid/);
    });
  });

  describe('getDefaultImfClient', () => {
    it('returns the same instance across calls (singleton)', () => {
      expect(getDefaultImfClient()).toBe(getDefaultImfClient());
    });
  });

  describe('getWeoIndicatorsBatch', () => {
    it('issues one Datamapper call per indicator for the same country', async () => {
      const spy = vi.fn(async (url: string) => {
        // URL pattern: /{indicator}/{country}
        const parts = url.split('/');
        const indicator = parts[parts.length - 2];
        const country = parts[parts.length - 1];
        return new Response(
          JSON.stringify({
            values: { [indicator]: { [country]: { '2024': 1.23 } } },
          }),
          { status: 200 },
        );
      }) as unknown as typeof global.fetch;
      global.fetch = spy;

      const result = await client.getWeoIndicatorsBatch('SWE', [
        'NGDP_RPCH',
        'PCPIPCH',
        'LUR',
      ]);

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
          // Second indicator fetch fails permanently.
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
      const result = await noRetryClient.getWeoIndicatorsBatch('SWE', [
        'NGDP_RPCH',
        'PCPIPCH',
        'LUR',
      ]);

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
});

// ---------------------------------------------------------------------------
// Pure-helper tests (no network)
// ---------------------------------------------------------------------------

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

describe('parseDatamapperValues', () => {
  const VINTAGE = 'WEO-2026-04';
  const currentYear = new Date().getUTCFullYear();

  it('returns [] when the indicator node is absent', () => {
    expect(parseDatamapperValues({ values: {} }, 'NGDP_RPCH', 'SWE', VINTAGE)).toEqual([]);
  });

  it('returns [] when the country node is absent', () => {
    const raw = { values: { NGDP_RPCH: { USA: { '2024': 1 } } } };
    expect(parseDatamapperValues(raw, 'NGDP_RPCH', 'SWE', VINTAGE)).toEqual([]);
  });

  it('sorts descending by year', () => {
    const raw = {
      values: {
        NGDP_RPCH: { SWE: { '2021': 1, '2023': 3, '2022': 2 } },
      },
    };
    const points = parseDatamapperValues(raw, 'NGDP_RPCH', 'SWE', VINTAGE);
    expect(points.map((p) => p.date)).toEqual(['2023', '2022', '2021']);
  });

  it('stamps projection years with the supplied vintage', () => {
    const raw = {
      values: {
        GGXWDG_NGDP: {
          SWE: {
            [String(currentYear - 1)]: 30,
            [String(currentYear + 2)]: 28,
          },
        },
      },
    };
    const points = parseDatamapperValues(raw, 'GGXWDG_NGDP', 'SWE', VINTAGE);
    const historical = points.find((p) => p.date === String(currentYear - 1));
    const projection = points.find((p) => p.date === String(currentYear + 2));
    expect(historical?.projection).toBe(false);
    expect(historical?.projectionVintage).toBeUndefined();
    expect(projection?.projection).toBe(true);
    expect(projection?.projectionVintage).toBe(VINTAGE);
  });

  it('drops null / "n/a" / NaN values and non-numeric years', () => {
    const raw = {
      values: {
        NGDP_RPCH: {
          SWE: {
            '2022': null,
            '2023': 'n/a',
            '2024': 2.1,
            banana: 99, // non-numeric year key
          },
        },
      },
    };
    const points = parseDatamapperValues(raw, 'NGDP_RPCH', 'SWE', VINTAGE);
    expect(points.map((p) => p.date)).toEqual(['2024']);
  });

  it('tolerates empty or missing raw envelopes', () => {
    expect(parseDatamapperValues({}, 'NGDP_RPCH', 'SWE', VINTAGE)).toEqual([]);
    expect(parseDatamapperValues(null, 'NGDP_RPCH', 'SWE', VINTAGE)).toEqual([]);
    expect(parseDatamapperValues(undefined, 'NGDP_RPCH', 'SWE', VINTAGE)).toEqual([]);
  });

  it('tolerates partial Datamapper envelope nodes', () => {
    expect(parseDatamapperValues({ values: { NGDP_RPCH: undefined } }, 'NGDP_RPCH', 'SWE', VINTAGE)).toEqual([]);
    expect(parseDatamapperValues({ values: { NGDP_RPCH: { SWE: undefined } } }, 'NGDP_RPCH', 'SWE', VINTAGE)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// WEO transport routing — Datamapper subset vs SDMX-only codes
// ---------------------------------------------------------------------------

describe('IMF_WEO_DATAMAPPER_AVAILABLE / IMF_WEO_SDMX_ONLY', () => {
  it('lists exactly the 9 WEO codes verified live on the Datamapper (2026-05-10)', () => {
    expect([...IMF_WEO_DATAMAPPER_AVAILABLE].sort()).toEqual([
      'BCA_NGDPD',
      'GGXCNL_NGDP',
      'GGXWDG_NGDP',
      'LP',
      'LUR',
      'NGDPD',
      'NGDPDPC',
      'NGDP_RPCH',
      'PCPIPCH',
    ]);
  });

  it('flags the 4 IMF_WEO_INDICATORS codes that are SDMX-only (Datamapper returns empty envelopes)', () => {
    expect([...IMF_WEO_SDMX_ONLY].sort()).toEqual(['GGR_NGDP', 'GGXONLB_NGDP', 'GGX_NGDP', 'TX_RPCH']);
  });

  it('partitions IMF_WEO_INDICATORS into available + SDMX-only with no overlap', () => {
    const allWeo = new Set(Object.values(IMF_WEO_INDICATORS));
    for (const code of IMF_WEO_DATAMAPPER_AVAILABLE) {
      expect(IMF_WEO_SDMX_ONLY.has(code), `${code} cannot be both Datamapper and SDMX-only`).toBe(false);
    }
    // Every IMF_WEO_INDICATORS entry must be on exactly one transport
    // (so agents always know which transport handles the citation).
    for (const code of allWeo) {
      const onDatamapper = IMF_WEO_DATAMAPPER_AVAILABLE.has(code);
      const onSdmxOnly = IMF_WEO_SDMX_ONLY.has(code);
      expect(onDatamapper !== onSdmxOnly, `${code} must be in exactly one transport set`).toBe(true);
    }
  });
});

describe('weoSdmxPath', () => {
  it('builds the canonical WEO 9.0.0 SDMX path', () => {
    expect(weoSdmxPath('SWE', 'GGR_NGDP')).toBe('/data/IMF.RES,WEO,9.0.0/A.SWE.GGR_NGDP');
  });

  it('upper-cases the country code so case-mismatched ISO inputs still resolve', () => {
    expect(weoSdmxPath('swe', 'NGDP_RPCH')).toBe('/data/IMF.RES,WEO,9.0.0/A.SWE.NGDP_RPCH');
  });

  it('URL-encodes both the indicator and country segments', () => {
    // Defensive: codes never contain reserved chars in practice, but the
    // helper must not silently produce an invalid URL if one ever does.
    expect(weoSdmxPath('SWE', 'A B')).toBe('/data/IMF.RES,WEO,9.0.0/A.SWE.A%20B');
  });
});

describe('ImfClient.getWeoIndicator → SDMX-only diagnostic', () => {
  it('throws ImfWeoSdmxOnlyError when Datamapper returns 0 points for a known SDMX-only code', async () => {
    const client = new ImfClient({ maxRetries: 0, timeout: 3_000 });
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ values: {} }), { status: 200 }));
    await expect(client.getWeoIndicator('SWE', 'GGR_NGDP')).rejects.toThrow(ImfWeoSdmxOnlyError);
  });

  it('error payload carries the SDMX path so callers can recover programmatically', async () => {
    const client = new ImfClient({ maxRetries: 0, timeout: 3_000 });
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ values: {} }), { status: 200 }));
    try {
      await client.getWeoIndicator('SWE', 'TX_RPCH');
      throw new Error('expected ImfWeoSdmxOnlyError');
    } catch (err) {
      expect(err).toBeInstanceOf(ImfWeoSdmxOnlyError);
      const e = err as ImfWeoSdmxOnlyError;
      expect(e.weoCode).toBe('TX_RPCH');
      expect(e.countryCode).toBe('SWE');
      expect(e.sdmxPath).toBe('/data/IMF.RES,WEO,9.0.0/A.SWE.TX_RPCH');
      expect(e.message).toContain('IMF_SDMX_SUBSCRIPTION_KEY');
    }
  });

  it('returns [] (does NOT throw) for non-listed codes when the Datamapper envelope is genuinely empty', async () => {
    // Future / experimental codes not yet in IMF_WEO_SDMX_ONLY must keep
    // the soft-empty contract so adding new codes to the catalog is safe.
    const client = new ImfClient({ maxRetries: 0, timeout: 3_000 });
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ values: {} }), { status: 200 }));
    await expect(client.getWeoIndicator('SWE', 'EXPERIMENTAL_FUTURE_CODE')).resolves.toEqual([]);
  });

  it('normalises lower-cased ISO3 inputs to upper-case in the error payload', () => {
    // Direct construction so the test does not depend on getWeoIndicator's
    // upper-casing — the error itself must be the canonical source.
    const err = new ImfWeoSdmxOnlyError('swe', 'GGR_NGDP');
    expect(err.countryCode).toBe('SWE');
    expect(err.sdmxPath).toBe('/data/IMF.RES,WEO,9.0.0/A.SWE.GGR_NGDP');
    expect(err.message).toContain("'SWE'");
    expect(err.message).not.toContain("'swe'");
  });
});

// ---------------------------------------------------------------------------
// Datamapper indicator catalog
// ---------------------------------------------------------------------------

describe('parseDatamapperIndicators', () => {
  it('converts the indicators envelope into a Map keyed by code', () => {
    const raw = {
      indicators: {
        NGDP_RPCH: { label: 'Real GDP growth', dataset: 'WEO', unit: 'Annual percent change' },
        GGR_G01_GDP_PT: { label: 'Revenue', dataset: 'FM', unit: '% of GDP' },
      },
    };
    const out = parseDatamapperIndicators(raw);
    expect(out.size).toBe(2);
    expect(out.get('NGDP_RPCH')?.label).toBe('Real GDP growth');
    expect(out.get('GGR_G01_GDP_PT')?.dataset).toBe('FM');
  });

  it('skips entries missing the dataset field (defensive against schema drift)', () => {
    const raw = {
      indicators: {
        VALID: { label: 'X', dataset: 'WEO' },
        BROKEN: { label: 'Y' /* no dataset */ },
        ALSO_BROKEN: null as unknown,
      },
    };
    const out = parseDatamapperIndicators(raw as never);
    expect([...out.keys()]).toEqual(['VALID']);
  });

  it('returns an empty Map for null / undefined / missing-indicators envelopes', () => {
    expect(parseDatamapperIndicators(null).size).toBe(0);
    expect(parseDatamapperIndicators(undefined).size).toBe(0);
    expect(parseDatamapperIndicators({}).size).toBe(0);
  });

  it('passes through optional lastUpdate when present, omits it otherwise', () => {
    const raw = {
      indicators: {
        WITH: { label: 'W', dataset: 'WEO', lastUpdate: '2026-04-22' },
        WITHOUT: { label: 'X', dataset: 'WEO' },
      },
    };
    const out = parseDatamapperIndicators(raw);
    expect(out.get('WITH')?.lastUpdate).toBe('2026-04-22');
    expect(out.get('WITHOUT')?.lastUpdate).toBeUndefined();
  });
});

describe('ImfClient.listDatamapperIndicators', () => {
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

describe('normalizeSdmxPathForBase (SDMX 3.0 dataflow rewrite)', () => {
  const SDMX30 = 'https://api.imf.org/external/sdmx/3.0';
  const NON_SDMX30 = 'https://api.imf.org/external/datamapper/api/v1';

  it('rewrites comma-form into /data/dataflow/.../ slash-form for sdmx/3.0', () => {
    expect(
      normalizeSdmxPathForBase(SDMX30, '/data/IMF.STA,CPI,4.0.0/M.SE.PCPI_IX'),
    ).toBe('/data/dataflow/IMF.STA/CPI/4.0.0/M.SE.PCPI_IX');
  });

  it('preserves the query string when rewriting', () => {
    expect(
      normalizeSdmxPathForBase(
        SDMX30,
        '/data/IMF.STA,CPI,4.0.0/M.SE.PCPI_IX?startPeriod=2024-01',
      ),
    ).toBe('/data/dataflow/IMF.STA/CPI/4.0.0/M.SE.PCPI_IX?startPeriod=2024-01');
  });

  it('handles missing leading slash on input', () => {
    expect(
      normalizeSdmxPathForBase(SDMX30, 'data/IMF.RES,WEO,9.0.0/A.SWE.GGR_NGDP'),
    ).toBe('data/dataflow/IMF.RES/WEO/9.0.0/A.SWE.GGR_NGDP');
  });

  it('handles dataflow ref without a key suffix (structure-only query)', () => {
    expect(
      normalizeSdmxPathForBase(SDMX30, '/data/IMF.STA,CPI,4.0.0'),
    ).toBe('/data/dataflow/IMF.STA/CPI/4.0.0');
  });

  it('does NOT rewrite when base URL is not the sdmx/3.0 surface (defence-in-depth)', () => {
    // SDMX 3.0 is the only IMF SDMX surface we target; the rewrite is
    // gated on the `/sdmx/3.0` segment so any future swap to a different
    // base URL (e.g. Datamapper) is a no-op.
    expect(
      normalizeSdmxPathForBase(NON_SDMX30, '/data/IMF.STA,CPI,4.0.0/M.SE.PCPI_IX'),
    ).toBe('/data/IMF.STA,CPI,4.0.0/M.SE.PCPI_IX');
  });

  it('does NOT double-rewrite an already slash-form path', () => {
    expect(
      normalizeSdmxPathForBase(SDMX30, '/data/dataflow/IMF.STA/CPI/4.0.0/M.SE.PCPI_IX'),
    ).toBe('/data/dataflow/IMF.STA/CPI/4.0.0/M.SE.PCPI_IX');
  });

  it('passes through non-data paths unchanged (e.g. /structure, /dataflow)', () => {
    expect(normalizeSdmxPathForBase(SDMX30, '/structure/dataflow/IMF.STA')).toBe(
      '/structure/dataflow/IMF.STA',
    );
    expect(normalizeSdmxPathForBase(SDMX30, '/dataflow/IMF.STA')).toBe('/dataflow/IMF.STA');
  });
});
