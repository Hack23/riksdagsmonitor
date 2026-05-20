/**
 * Datamapper envelope parsers — parseDatamapperValues +
 * parseDatamapperIndicators.
 *
 * Migrated verbatim from tests/imf-client.test.ts. Per #2620 spec, the
 * "sdmx-payload" parser file is folded elsewhere because there is no
 * separate SDMX-payload parser module under scripts/imf/parsers/ today.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  parseDatamapperValues,
  parseDatamapperIndicators,
} from '../../../scripts/imf-client.js';

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
