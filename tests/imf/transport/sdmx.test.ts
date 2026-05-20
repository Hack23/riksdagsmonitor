/**
 * IMF SDMX transport — Ocp-Apim header, sdmxFetch describe block,
 * 401/403/404 auth diagnostics, and the SDMX 3.0 path-normaliser.
 *
 * Migrated verbatim from tests/imf-client.test.ts (describes
 * 'sdmxFetch' and 'normalizeSdmxPathForBase').  Per #2620 spec,
 * dedicated parsers/sdmx-payload.test.ts is folded in here because
 * there is no separate parser module under scripts/imf/parsers/.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ImfClient, normalizeSdmxPathForBase } from '../../../scripts/imf-client.js';

describe('sdmxFetch', () => {
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
