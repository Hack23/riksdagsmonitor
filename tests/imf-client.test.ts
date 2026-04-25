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
  calculateRetryDelay,
  parseDatamapperValues,
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
      expect(defaults.weoVintage).toMatch(/^WEO-\d{4}-\d{2}$/);
    });

    it('accepts overrides', () => {
      const custom = new ImfClient({
        datamapperBaseURL: 'https://example.test/api',
        sdmxBaseURL: 'https://sdmx.example.test',
        timeout: 1_000,
        maxRetries: 0,
        weoVintage: 'WEO-2999-99',
      });
      expect(custom.datamapperBaseURL).toBe('https://example.test/api');
      expect(custom.sdmxBaseURL).toBe('https://sdmx.example.test');
      expect(custom.timeout).toBe(1_000);
      expect(custom.maxRetries).toBe(0);
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
      await client.sdmxFetch('data/IMF.RES,WEO/NGDP_RPCH.SWE.A.');
      const url = (spy as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0] as string;
      expect(url).toBe(
        'https://api.imf.org/external/sdmx/3.0/data/IMF.RES,WEO/NGDP_RPCH.SWE.A.',
      );
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
    const points = parseDatamapperValues(raw as never, 'NGDP_RPCH', 'SWE', VINTAGE);
    expect(points.map((p) => p.date)).toEqual(['2024']);
  });

  it('tolerates a completely empty raw envelope', () => {
    expect(parseDatamapperValues({}, 'NGDP_RPCH', 'SWE', VINTAGE)).toEqual([]);
  });
});
