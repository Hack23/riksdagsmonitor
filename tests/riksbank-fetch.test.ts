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
    expect(payload.json).toEqual({ repoRate: 2.25 });
    expect(payload.text).toBeUndefined();
  });
});
