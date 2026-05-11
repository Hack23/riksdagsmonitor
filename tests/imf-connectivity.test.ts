/**
 * Tests for the IMF connectivity pre-flight gate
 * (`scripts/check-imf-connectivity.ts`).
 *
 * Covers the three code paths called out in the issue's acceptance
 * criteria:
 *
 *   1. success         — all probes return data → status 'ok',
 *                        imf-context.json written
 *   2. network-fail    — probes throw → status 'unavailable',
 *                        imf-unavailable.flag written, ⚠️ block emitted
 *   3. stale-vintage   — probes ok but vintage > 6 months → status
 *                        'stale-vintage', ℹ️ annotation emitted
 *
 * Transport is not exercised here — `imf-client.test.ts` already covers
 * the Datamapper / SDMX envelope parsing. We inject a stub client.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  buildReport,
  formatStaleVintageAnnotation,
  formatDegradedWarning,
  formatUnavailableWarning,
  parseVintage,
  runProbes,
  vintageAgeMonths,
  writeReport,
  PROBE_TIMEOUT_MS,
  STALE_VINTAGE_MAX_MONTHS,
  type ImfProbeResult,
} from '../scripts/check-imf-connectivity.js';
import type { ImfClient, ImfDataPoint } from '../scripts/imf-client.js';

// ---------------------------------------------------------------------------
// Stub helpers
// ---------------------------------------------------------------------------

function fakeDataPoint(year: number, value: number, projection = false): ImfDataPoint {
  return {
    countryCode: 'SWE',
    countryName: 'Sweden',
    indicatorId: 'NGDP_RPCH',
    indicatorName: 'NGDP_RPCH',
    date: String(year),
    value,
    projection,
    provider: 'imf',
    ...(projection ? { projectionVintage: 'WEO-2026-04' } : {}),
  };
}

interface StubBehaviour {
  readonly weo?: 'ok' | 'throw' | 'empty';
  readonly fm?: 'ok' | 'throw' | 'empty';
  readonly sdmx?: 'ok' | 'throw' | 'non-object' | 'auth-401' | 'auth-403' | 'auth-404';
  readonly sdmxSubscriptionKey?: string;
}

function makeStubClient(b: StubBehaviour = {}): ImfClient {
  return {
    weoVintage: 'WEO-2026-04',
    sdmxSubscriptionKey: b.sdmxSubscriptionKey ?? '',
    async getWeoIndicator(_iso3: string, weoCode: string): Promise<ImfDataPoint[]> {
      const mode = weoCode === 'GGXWDG_NGDP' ? (b.fm ?? 'ok') : (b.weo ?? 'ok');
      if (mode === 'throw') throw new Error('network: ECONNREFUSED');
      if (mode === 'empty') return [];
      return [fakeDataPoint(2025, 1.9)];
    },
    async sdmxFetch(_path: string): Promise<unknown> {
      const mode = b.sdmx ?? 'ok';
      if (mode === 'throw') throw new Error('SDMX 503');
      if (mode === 'auth-401') {
        throw new Error(
          'IMF API error: 401 Unauthorized for https://api.imf.org/external/sdmx/3.0/data/IMF.STA,CPI,5.0.0/SWE.CPI._T.IX.M — IMF SDMX subscription key missing or invalid (set IMF_SDMX_SUBSCRIPTION_KEY)',
        );
      }
      if (mode === 'auth-403') {
        throw new Error('IMF API error: 403 Forbidden for https://api.imf.org/external/sdmx/3.0/data/...');
      }
      if (mode === 'auth-404') {
        // Real-world: IMF Azure APIM gateway returns 404 (not 401) when no
        // Ocp-Apim-Subscription-Key header is sent. Confirmed via curl
        // 2026-05-10.
        throw new Error('IMF API error: 404  for https://api.imf.org/external/sdmx/3.0/data/IMF.STA,CPI,5.0.0/SWE.CPI._T.IX.M');
      }
      if (mode === 'non-object') return 'plain-string';
      // SDMX-JSON 2.0 envelope shape: at least one named series so the
      // post-2026-05 connectivity probe (which now requires non-empty
      // `dataSets[].series` to mark CPI ok) sees a healthy response.
      return { data: { dataSets: [{ series: { 'SWE.CPI._T.IX.M': { observations: { '0': [120.5] } } } }] } };
    },
  } as unknown as ImfClient;
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

describe('parseVintage', () => {
  it('parses a canonical WEO tag', () => {
    expect(parseVintage('WEO-2026-04')).toEqual({ year: 2026, month: 4 });
  });

  it('parses a Fiscal Monitor tag', () => {
    expect(parseVintage('FM-2026-04')).toEqual({ year: 2026, month: 4 });
  });

  it('returns null on malformed input', () => {
    expect(parseVintage('WEO-2026-13')).toBeNull();
    expect(parseVintage('weo-2026-04')).toBeNull();
    expect(parseVintage('WEO-202604')).toBeNull();
    expect(parseVintage('')).toBeNull();
  });
});

describe('vintageAgeMonths', () => {
  const ref = new Date('2026-04-26T00:00:00Z');

  it('reports 0 months for the current vintage', () => {
    expect(vintageAgeMonths('WEO-2026-04', ref)).toBe(0);
  });

  it('reports the gap in months for older vintages', () => {
    expect(vintageAgeMonths('WEO-2025-10', ref)).toBe(6);
    expect(vintageAgeMonths('WEO-2024-04', ref)).toBe(24);
  });

  it('clamps future-dated vintages to 0', () => {
    expect(vintageAgeMonths('WEO-2026-10', ref)).toBe(0);
  });

  it('returns +Infinity for malformed vintages', () => {
    expect(vintageAgeMonths('garbage', ref)).toBe(Number.POSITIVE_INFINITY);
  });
});

// ---------------------------------------------------------------------------
// Probe orchestration
// ---------------------------------------------------------------------------

describe('runProbes', () => {
  it('reports ok=true on all three probes when the client succeeds', async () => {
    const probes = await runProbes(makeStubClient());
    expect(probes).toHaveLength(3);
    expect(probes.map((p) => p.dataflow).sort()).toEqual(['CPI', 'FM', 'WEO']);
    expect(probes.every((p) => p.ok)).toBe(true);
    for (const p of probes) {
      expect(p.error).toBeUndefined();
      expect(p.latencyMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('captures network failures into ok=false + error', async () => {
    const probes = await runProbes(makeStubClient({ weo: 'throw', fm: 'throw', sdmx: 'throw' }));
    expect(probes.every((p) => p.ok === false)).toBe(true);
    for (const p of probes) {
      expect(p.error).toBeTruthy();
    }
  });

  it('marks empty WEO/FM series as not ok (defensive against silent schema drift)', async () => {
    const probes = await runProbes(makeStubClient({ weo: 'empty', fm: 'empty' }));
    const weo = probes.find((p) => p.dataflow === 'WEO');
    const fm = probes.find((p) => p.dataflow === 'FM');
    expect(weo?.ok).toBe(false);
    expect(weo?.error).toBe('empty-series');
    expect(fm?.ok).toBe(false);
    expect(fm?.error).toBe('empty-series');
  });

  it('marks non-object SDMX responses as not ok', async () => {
    const probes = await runProbes(makeStubClient({ sdmx: 'non-object' }));
    const ifs = probes.find((p) => p.dataflow === 'CPI');
    expect(ifs?.ok).toBe(false);
    expect(ifs?.error).toBe('non-object-response');
  });

  it('reports SDMX as sdmx-subscription-key-not-configured when key missing AND endpoint returns 401/403', async () => {
    const probes = await runProbes(makeStubClient({ sdmx: 'auth-401' /* sdmxSubscriptionKey defaults to '' */ }));
    const ifs = probes.find((p) => p.dataflow === 'CPI');
    expect(ifs?.ok).toBe(false);
    expect(ifs?.error).toBe('sdmx-subscription-key-not-configured');
  });

  it('reports SDMX as sdmx-subscription-key-not-configured on 403 when key missing', async () => {
    const probes = await runProbes(makeStubClient({ sdmx: 'auth-403' }));
    const ifs = probes.find((p) => p.dataflow === 'CPI');
    expect(ifs?.error).toBe('sdmx-subscription-key-not-configured');
  });

  it('reports SDMX as sdmx-subscription-key-not-configured on 404 (real APIM gateway response when no key sent)', async () => {
    // IMF's Azure APIM gateway masks unauthenticated requests as HTTP 404
    // on the `/data/...` path (confirmed via curl 2026-05-10). Without
    // this special-case, operators would chase a non-existent "dataflow
    // missing" issue instead of the real "secret not set" cause.
    const probes = await runProbes(makeStubClient({ sdmx: 'auth-404' }));
    const ifs = probes.find((p) => p.dataflow === 'CPI');
    expect(ifs?.ok).toBe(false);
    expect(ifs?.error).toBe('sdmx-subscription-key-not-configured');
  });

  it('preserves the raw SDMX error when a key IS configured (so ops can see real cause)', async () => {
    const probes = await runProbes(
      makeStubClient({ sdmx: 'auth-401', sdmxSubscriptionKey: 'configured-key-xyz' }),
    );
    const ifs = probes.find((p) => p.dataflow === 'CPI');
    expect(ifs?.ok).toBe(false);
    // Configured key + auth failure means rotated/revoked key — don't mask the cause.
    expect(ifs?.error).toMatch(/IMF SDMX subscription key missing or invalid/);
    expect(ifs?.error).not.toBe('sdmx-subscription-key-not-configured');
  });

  it('preserves a non-auth SDMX failure (e.g. 503) even when key missing', async () => {
    // SDMX 503 is an outage — the operator must NOT see it as a "key not configured" issue.
    const probes = await runProbes(makeStubClient({ sdmx: 'throw' }));
    const ifs = probes.find((p) => p.dataflow === 'CPI');
    expect(ifs?.ok).toBe(false);
    expect(ifs?.error).toBe('SDMX 503');
  });

  it('enforces PROBE_TIMEOUT_MS so a hung IMF endpoint cannot starve the composite-action budget', async () => {
    // Stub an `ImfClient` whose probes never resolve. Without timeout
    // enforcement runProbes would hang forever; with it the probes
    // resolve as ok=false / "probe timeout after Xms" within the
    // configured PROBE_TIMEOUT_MS budget.
    const hangingClient = {
      weoVintage: 'WEO-2026-04',
      getWeoIndicator(): Promise<unknown[]> {
        return new Promise(() => {
          /* never resolves */
        });
      },
      sdmxFetch(): Promise<unknown> {
        return new Promise(() => {
          /* never resolves */
        });
      },
    } as unknown as Parameters<typeof runProbes>[0];

    vi.useFakeTimers();
    try {
      const probesPromise = runProbes(hangingClient);
      // Three sequential probes × PROBE_TIMEOUT_MS — advance enough virtual
      // time for all three to time out. The probe budget is 3×20 s = 60 s,
      // matching the pre-warm action's `timeout 60` envelope.
      await vi.advanceTimersByTimeAsync(PROBE_TIMEOUT_MS * 3 + 100);
      const probes = await probesPromise;
      expect(probes).toHaveLength(3);
      expect(probes.every((p) => p.ok === false)).toBe(true);
      for (const p of probes) {
        expect(p.error).toMatch(/probe timeout/);
      }
    } finally {
      vi.useRealTimers();
    }
  });
});

// ---------------------------------------------------------------------------
// Report assembly
// ---------------------------------------------------------------------------

describe('buildReport', () => {
  const allOk: ImfProbeResult[] = [
    { dataflow: 'WEO', transport: 'datamapper', ok: true, latencyMs: 10 },
    { dataflow: 'FM', transport: 'datamapper', ok: true, latencyMs: 10 },
    { dataflow: 'CPI', transport: 'sdmx', ok: true, latencyMs: 10 },
  ];

  it('returns status=ok with no warning block when fresh + all probes ok', () => {
    const ref = new Date('2026-04-26T00:00:00Z');
    const r = buildReport(allOk, 'WEO-2026-04', ref);
    expect(r.status).toBe('ok');
    expect(r.stale).toBe(false);
    expect(r.vintageAgeMonths).toBe(0);
    expect(r.warningBlock).toBe('');
    expect(r.checkedAt).toBe(ref.toISOString());
  });

  it('returns status=stale-vintage with ℹ️ annotation when vintage > 6 months', () => {
    const ref = new Date('2026-12-01T00:00:00Z');
    const r = buildReport(allOk, 'WEO-2025-04', ref);
    expect(r.status).toBe('stale-vintage');
    expect(r.stale).toBe(true);
    expect(r.vintageAgeMonths).toBeGreaterThan(STALE_VINTAGE_MAX_MONTHS);
    expect(r.warningBlock).toContain('IMF vintage older than 6 months');
    expect(r.warningBlock).toContain('WEO-2025-04');
  });

  it('returns status=degraded with ℹ️ block when only the auxiliary SDMX probe failed', () => {
    const probes: ImfProbeResult[] = [
      ...allOk.slice(0, 2),
      { dataflow: 'CPI', transport: 'sdmx', ok: false, latencyMs: 5, error: 'SDMX 503' },
    ];
    const r = buildReport(probes, 'WEO-2026-04', new Date('2026-04-26T00:00:00Z'));
    expect(r.status).toBe('degraded');
    expect(r.warningBlock).toContain('IMF auxiliary transport degraded');
    expect(r.warningBlock).toContain('CPI');
    expect(r.warningBlock).toContain('SDMX 503');
  });

  it('returns status=unavailable with ⚠️ block when a critical WEO/FM probe failed', () => {
    const probes: ImfProbeResult[] = [
      { dataflow: 'WEO', transport: 'datamapper', ok: false, latencyMs: 5, error: '403 Forbidden' },
      ...allOk.slice(1),
    ];
    const r = buildReport(probes, 'WEO-2026-04', new Date('2026-04-26T00:00:00Z'));
    expect(r.status).toBe('unavailable');
    expect(r.warningBlock).toContain('IMF context unavailable');
    expect(r.warningBlock).toContain('WEO');
    expect(r.warningBlock).toContain('403 Forbidden');
  });

  it('treats malformed vintage as definitely stale', () => {
    const r = buildReport(allOk, 'garbage', new Date('2026-04-26T00:00:00Z'));
    expect(r.stale).toBe(true);
    expect(r.vintageAgeMonths).toBe(-1);
  });
});

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

describe('formatUnavailableWarning', () => {
  it('renders failed probes with their dataflow + error in the warning text', () => {
    const block = formatUnavailableWarning({
      probes: [
        { dataflow: 'WEO', transport: 'datamapper', ok: false, latencyMs: 5, error: 'ECONNRESET' },
        { dataflow: 'FM', transport: 'datamapper', ok: true, latencyMs: 10 },
      ],
      checkedAt: '2026-04-26T00:00:00.000Z',
    });
    expect(block).toContain('IMF context unavailable');
    expect(block).toContain('WEO');
    expect(block).toContain('ECONNRESET');
    expect(block).toContain('2026-04-26T00:00:00.000Z');
  });
});

describe('formatStaleVintageAnnotation', () => {
  it('mentions the vintage tag and the age in months', () => {
    const block = formatStaleVintageAnnotation({ vintage: 'WEO-2025-04', vintageAgeMonths: 12 });
    expect(block).toContain('WEO-2025-04');
    expect(block).toContain('12 months');
  });

  it('uses STALE_VINTAGE_MAX_MONTHS in the heading instead of a hardcoded number', () => {
    const block = formatStaleVintageAnnotation({ vintage: 'WEO-2025-04', vintageAgeMonths: 12 });
    expect(block).toContain('older than ' + String(STALE_VINTAGE_MAX_MONTHS) + ' months');
  });

  it('renders -1 (sentinel for malformed vintage) as "unknown age" instead of a literal "-1 months"', () => {
    const block = formatStaleVintageAnnotation({ vintage: 'garbage', vintageAgeMonths: -1 });
    expect(block).toContain('unknown age');
    expect(block).toContain('invalid vintage tag');
    expect(block).not.toContain('-1 months');
  });
});

describe('formatDegradedWarning', () => {
  it('renders failed auxiliary probes without saying IMF is unavailable', () => {
    const block = formatDegradedWarning({
      probes: [
        { dataflow: 'WEO', transport: 'datamapper', ok: true, latencyMs: 10 },
        { dataflow: 'CPI', transport: 'sdmx', ok: false, latencyMs: 5, error: '404' },
      ],
      checkedAt: '2026-05-05T00:00:00.000Z',
    });
    expect(block).toContain('IMF auxiliary transport degraded');
    expect(block).toContain('CPI');
    expect(block).toContain('404');
    expect(block).not.toContain('IMF context unavailable');
  });
});

// ---------------------------------------------------------------------------
// File-system side effects
// ---------------------------------------------------------------------------

describe('writeReport', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'imf-precheck-'));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('writes imf-context.json on success and does NOT write the unavailable flag', () => {
    const r = buildReport(
      [
        { dataflow: 'WEO', transport: 'datamapper', ok: true, latencyMs: 10 },
        { dataflow: 'FM', transport: 'datamapper', ok: true, latencyMs: 10 },
        { dataflow: 'CPI', transport: 'sdmx', ok: true, latencyMs: 10 },
      ],
      'WEO-2026-04',
      new Date('2026-04-26T00:00:00Z'),
    );
    writeReport(r, { outputDir: tmp });
    const ctx = JSON.parse(readFileSync(join(tmp, 'imf-context.json'), 'utf8')) as { status: string };
    expect(ctx.status).toBe('ok');
    expect(existsSync(join(tmp, 'imf-unavailable.flag'))).toBe(false);
  });

  it('writes BOTH imf-context.json AND imf-unavailable.flag on connectivity failure', () => {
    const r = buildReport(
      [
        { dataflow: 'WEO', transport: 'datamapper', ok: false, latencyMs: 5, error: 'ECONNREFUSED' },
        { dataflow: 'FM', transport: 'datamapper', ok: false, latencyMs: 5, error: 'ECONNREFUSED' },
        { dataflow: 'CPI', transport: 'sdmx', ok: false, latencyMs: 5, error: 'ECONNREFUSED' },
      ],
      'WEO-2026-04',
      new Date('2026-04-26T00:00:00Z'),
    );
    writeReport(r, { outputDir: tmp });
    expect(existsSync(join(tmp, 'imf-context.json'))).toBe(true);
    expect(existsSync(join(tmp, 'imf-unavailable.flag'))).toBe(true);
    const flag = readFileSync(join(tmp, 'imf-unavailable.flag'), 'utf8');
    expect(flag).toContain('IMF connectivity pre-flight failed');
    expect(flag).toContain('failed-probes: WEO,FM,CPI');
    // Last non-empty line is the structured JSON payload.
    const lines = flag.split('\n').filter((l) => l.length > 0);
    const json = JSON.parse(lines[lines.length - 1]) as { status: string };
    expect(json.status).toBe('unavailable');
  });

  it('does NOT write the unavailable flag on degraded auxiliary SDMX failure', () => {
    const r = buildReport(
      [
        { dataflow: 'WEO', transport: 'datamapper', ok: true, latencyMs: 10 },
        { dataflow: 'FM', transport: 'datamapper', ok: true, latencyMs: 10 },
        { dataflow: 'CPI', transport: 'sdmx', ok: false, latencyMs: 5, error: 'SDMX 404' },
      ],
      'WEO-2026-04',
      new Date('2026-04-26T00:00:00Z'),
    );
    writeReport(r, { outputDir: tmp });
    expect(existsSync(join(tmp, 'imf-context.json'))).toBe(true);
    expect(existsSync(join(tmp, 'imf-unavailable.flag'))).toBe(false);
    const ctx = JSON.parse(readFileSync(join(tmp, 'imf-context.json'), 'utf8')) as { status: string; warningBlock: string };
    expect(ctx.status).toBe('degraded');
    expect(ctx.warningBlock).toContain('IMF auxiliary transport degraded');
  });

  it('does NOT write the unavailable flag when status is stale-vintage (annotate, do not block)', () => {
    const r = buildReport(
      [
        { dataflow: 'WEO', transport: 'datamapper', ok: true, latencyMs: 10 },
        { dataflow: 'FM', transport: 'datamapper', ok: true, latencyMs: 10 },
        { dataflow: 'CPI', transport: 'sdmx', ok: true, latencyMs: 10 },
      ],
      'WEO-2024-04',
      new Date('2026-04-26T00:00:00Z'),
    );
    writeReport(r, { outputDir: tmp });
    expect(existsSync(join(tmp, 'imf-context.json'))).toBe(true);
    expect(existsSync(join(tmp, 'imf-unavailable.flag'))).toBe(false);
    const ctx = JSON.parse(readFileSync(join(tmp, 'imf-context.json'), 'utf8')) as {
      status: string;
      stale: boolean;
      vintageAgeMonths: number;
    };
    expect(ctx.status).toBe('stale-vintage');
    expect(ctx.stale).toBe(true);
    expect(ctx.vintageAgeMonths).toBe(24);
  });
});
