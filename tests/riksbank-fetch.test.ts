import { describe, it, expect, vi, afterEach } from 'vitest';

import {
  assertRiksbankFetchTarget,
  fetchRiksbankPayload,
  parseRiksbankArgs,
  parseRiksbankKind,
} from '../scripts/riksbank-fetch.js';

describe('Riksbank fetch CLI helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses commands and artifact kinds', () => {
    const parsed = parseRiksbankArgs(['fetch', '--kind', 'minutes', '--url', 'https://www.riksbank.se/en-gb/x']);
    expect(parsed.command).toBe('fetch');
    expect(parsed.flags.get('kind')).toBe('minutes');
    expect(parseRiksbankKind('repo-rate-path')).toBe('repo-rate-path');
  });

  it('rejects unsafe or non-Riksbank URLs', () => {
    expect(() => assertRiksbankFetchTarget('https://www.riksbank.se/en-gb/')).not.toThrow();
    expect(() => assertRiksbankFetchTarget('http://www.riksbank.se/en-gb/')).toThrow(/HTTPS/);
    expect(() => assertRiksbankFetchTarget('https://example.com/')).toThrow(/allowlist/);
    expect(() => assertRiksbankFetchTarget('not a url')).toThrow(/invalid/);
  });

  it('builds provenance for HTML responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<html><head><title>Minutes - Riksbank</title></head><body>content</body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }),
    );
    const payload = await fetchRiksbankPayload('minutes', 'https://www.riksbank.se/en-gb/minutes/');
    expect(payload.provider).toBe('riksbank');
    expect(payload.status).toBe('ok');
    expect(payload.title).toBe('Minutes - Riksbank');
    expect(payload.economicProvenance.provider).toBe('riksbank');
    expect(payload.economicProvenance.indicator).toBe('minutes');
  });

  it('builds provenance for JSON responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ repoRate: 2.25 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const payload = await fetchRiksbankPayload('repo-rate-path', 'https://www.riksbank.se/en-gb/rate.json');
    expect(payload.status).toBe('ok');
    expect(payload.json).toEqual({ repoRate: 2.25 });
    expect(payload.text).toBeUndefined();
  });

  it('encodes PDF responses as base64 with a byte-length cap', async () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // "%PDF-1.4"
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(pdfBytes, {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      }),
    );
    const payload = await fetchRiksbankPayload('minutes', 'https://www.riksbank.se/en-gb/min.pdf');
    expect(payload.status).toBe('ok');
    expect(payload.contentType).toContain('pdf');
    expect(payload.pdfBytes).toBe(pdfBytes.byteLength);
    expect(payload.pdfBase64).toBe(Buffer.from(pdfBytes).toString('base64'));
    expect(payload.text).toBeUndefined();
  });

  it('fail-softs to a no-data payload on network outage', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Riksbank unreachable'));
    const payload = await fetchRiksbankPayload('repo-rate-path', 'https://www.riksbank.se/en-gb/rate/');
    expect(payload.status).toBe('no-data');
    expect(payload.warning).toMatch(/cached analysis\/data\/riksbank/i);
    expect(payload.economicProvenance.provider).toBe('riksbank');
  });

  it('fail-softs to a no-data payload on non-2xx HTTP status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Server Error', { status: 503, statusText: 'Service Unavailable' }),
    );
    const payload = await fetchRiksbankPayload('minutes', 'https://www.riksbank.se/en-gb/m/');
    expect(payload.status).toBe('no-data');
    expect(payload.warning).toMatch(/HTTP 503/);
  });
});
