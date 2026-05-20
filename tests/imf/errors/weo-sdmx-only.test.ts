/**
 * ImfWeoSdmxOnlyError — diagnostic payload tests.
 *
 * Migrated from tests/imf-client.test.ts (subset of the
 * 'ImfClient.getWeoIndicator → SDMX-only diagnostic' describe — the
 * Datamapper-side end-to-end cases stay in transport/datamapper.test.ts,
 * this file covers the error class shape directly).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import { ImfClient, ImfWeoSdmxOnlyError } from '../../../scripts/imf-client.js';

describe('ImfWeoSdmxOnlyError', () => {
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
