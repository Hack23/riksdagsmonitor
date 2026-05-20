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
