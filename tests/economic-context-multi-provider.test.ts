/**
 * Multi-provider `economic-data.json` loader tests.
 *
 * Schema v2.0 (2026-04-20) adds `source.imf[]` and optional
 * `dataPoints[].provider` / `projection` / `projectionVintage` fields.
 * This suite exercises both v1 artefacts (backward compatibility) and v2
 * artefacts with mixed provider sources.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { loadEconomicContext } from '../scripts/data-transformers/load-economic-context.js';

describe('load-economic-context (multi-provider, schema v2)', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'econ-ctx-'));
    fs.mkdirSync(path.join(tmp, 'analysis', 'daily', '2026-04-20', 'committeeReports'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  function writeContext(payload: Record<string, unknown>): void {
    fs.writeFileSync(
      path.join(tmp, 'analysis', 'daily', '2026-04-20', 'committeeReports', 'economic-data.json'),
      JSON.stringify(payload),
      'utf8',
    );
  }

  it('accepts a v1 artefact without source.imf[] and defaults it to an empty array', () => {
    writeContext({
      version: '1.0',
      policyDomains: ['fiscal'],
      dataPoints: [
        { countryCode: 'SWE', countryName: 'Sweden', indicatorId: 'NY.GDP.MKTP.KD.ZG', date: '2023', value: 1.1 },
      ],
      commentary: 'Test commentary',
      source: { worldBank: ['NY.GDP.MKTP.KD.ZG'], scb: [] },
    });
    const ctx = loadEconomicContext('2026-04-20', 'committee-reports', tmp);
    expect(ctx).not.toBeNull();
    expect(ctx?.version).toBe('1.0');
    expect(ctx?.source.imf).toEqual([]);
    expect(ctx?.source.worldBank).toEqual(['NY.GDP.MKTP.KD.ZG']);
    expect(ctx?.enrichedDataPoints[0].provider).toBe('worldBank');
    expect(ctx?.enrichedDataPoints[0].projection).toBe(false);
  });

  it('accepts a v2 artefact with IMF source and projection metadata', () => {
    writeContext({
      version: '2.0',
      policyDomains: ['fiscal', 'debt'],
      dataPoints: [
        {
          countryCode: 'SWE',
          countryName: 'Sweden',
          indicatorId: 'GGXWDG_NGDP',
          date: '2024',
          value: 32.1,
          provider: 'imf',
          projection: false,
        },
        {
          countryCode: 'SWE',
          countryName: 'Sweden',
          indicatorId: 'GGXWDG_NGDP',
          date: '2027',
          value: 32.4,
          provider: 'imf',
          projection: true,
          projectionVintage: 'WEO-2026-04',
        },
      ],
      commentary: 'IMF projects Sweden debt/GDP at 32.4% in 2027.',
      source: { worldBank: [], scb: [], imf: ['WEO:GGXWDG_NGDP'] },
    });
    const ctx = loadEconomicContext('2026-04-20', 'committee-reports', tmp);
    expect(ctx).not.toBeNull();
    expect(ctx?.version).toBe('2.0');
    expect(ctx?.source.imf).toEqual(['WEO:GGXWDG_NGDP']);
    expect(ctx?.enrichedDataPoints).toHaveLength(2);
    expect(ctx?.enrichedDataPoints[1].projection).toBe(true);
    expect(ctx?.enrichedDataPoints[1].projectionVintage).toBe('WEO-2026-04');
    expect(ctx?.enrichedDataPoints[0].projection).toBe(false);
    expect(ctx?.enrichedDataPoints[0].projectionVintage).toBeUndefined();
  });

  it('accepts a mixed-provider artefact (IMF + World Bank + SCB)', () => {
    writeContext({
      version: '2.0',
      policyDomains: ['fiscal'],
      dataPoints: [
        { countryCode: 'SWE', countryName: 'Sweden', indicatorId: 'NGDP_RPCH', date: '2025', value: 1.9, provider: 'imf', projection: false },
        { countryCode: 'SWE', countryName: 'Sweden', indicatorId: 'CC.EST', date: '2023', value: 2.1, provider: 'worldBank', projection: false },
        { countryCode: 'SWE', countryName: 'Sweden', indicatorId: 'TAB1291', date: '2025-01', value: 405.2, provider: 'scb', projection: false },
      ],
      commentary: 'Mix of sources',
      source: { worldBank: ['CC.EST'], scb: ['TAB1291'], imf: ['WEO:NGDP_RPCH'] },
    });
    const ctx = loadEconomicContext('2026-04-20', 'committee-reports', tmp);
    expect(ctx).not.toBeNull();
    expect(ctx?.source.imf).toEqual(['WEO:NGDP_RPCH']);
    expect(ctx?.source.worldBank).toEqual(['CC.EST']);
    expect(ctx?.source.scb).toEqual(['TAB1291']);
    const providers = ctx?.enrichedDataPoints.map((d) => d.provider) ?? [];
    expect(providers).toEqual(['imf', 'worldBank', 'scb']);
  });

  it('rejects a v2 artefact with a bad provider value', () => {
    writeContext({
      version: '2.0',
      policyDomains: ['fiscal'],
      dataPoints: [
        { countryCode: 'SWE', countryName: 'Sweden', indicatorId: 'NGDP_RPCH', date: '2025', value: 1.9, provider: 'wikipedia' },
      ],
      commentary: 'Bogus provider',
      source: { worldBank: [], scb: [], imf: ['WEO:NGDP_RPCH'] },
    });
    const ctx = loadEconomicContext('2026-04-20', 'committee-reports', tmp);
    expect(ctx).toBeNull();
  });

  it('rejects a v2 artefact with a non-string-array imf source', () => {
    writeContext({
      version: '2.0',
      policyDomains: ['fiscal'],
      dataPoints: [],
      commentary: '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      source: { worldBank: [], scb: [], imf: [42] as any },
    });
    const ctx = loadEconomicContext('2026-04-20', 'committee-reports', tmp);
    expect(ctx).toBeNull();
  });

  it('preserves the raw data points array shape for legacy consumers', () => {
    writeContext({
      version: '2.0',
      policyDomains: ['fiscal'],
      dataPoints: [
        { countryCode: 'SWE', countryName: 'Sweden', indicatorId: 'NGDP_RPCH', date: '2025', value: 1.9, provider: 'imf', projection: false },
      ],
      commentary: 'x',
      source: { worldBank: [], scb: [], imf: ['WEO:NGDP_RPCH'] },
    });
    const ctx = loadEconomicContext('2026-04-20', 'committee-reports', tmp);
    expect(ctx?.dataPoints).toHaveLength(1);
    expect(ctx?.dataPoints[0].value).toBe(1.9);
  });
});
