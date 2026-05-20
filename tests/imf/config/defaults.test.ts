/**
 * ImfClient constructor — default values and override semantics.
 *
 * Migrated from tests/imf-client.test.ts (describe 'constructor') as part
 * of the test-suite split (#2620 follow-up to #2591/#2592). Assertions
 * are verbatim — only the import path and surrounding scaffolding changed.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { ImfClient } from '../../../scripts/imf-client.js';

describe('ImfClient constructor', () => {
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
