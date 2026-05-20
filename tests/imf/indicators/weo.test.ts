/**
 * IMF WEO indicator catalog — IMF_WEO_INDICATORS,
 * IMF_WEO_DATAMAPPER_AVAILABLE, IMF_WEO_SDMX_ONLY, weoSdmxPath.
 *
 * Migrated verbatim from tests/imf-client.test.ts (describes
 * 'IMF_WEO_INDICATORS / IMF_FM_INDICATORS' [WEO half],
 * 'IMF_WEO_DATAMAPPER_AVAILABLE / IMF_WEO_SDMX_ONLY', and 'weoSdmxPath').
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  IMF_WEO_INDICATORS,
  IMF_WEO_DATAMAPPER_AVAILABLE,
  IMF_WEO_SDMX_ONLY,
  weoSdmxPath,
} from '../../../scripts/imf-client.js';

describe('IMF_WEO_INDICATORS', () => {
  it('exposes the canonical WEO headline indicator codes', () => {
    expect(IMF_WEO_INDICATORS.gdpGrowth).toBe('NGDP_RPCH');
    expect(IMF_WEO_INDICATORS.inflationCpi).toBe('PCPIPCH');
    expect(IMF_WEO_INDICATORS.unemployment).toBe('LUR');
    expect(IMF_WEO_INDICATORS.generalGovGrossDebt).toBe('GGXWDG_NGDP');
    expect(IMF_WEO_INDICATORS.currentAccountBalance).toBe('BCA_NGDPD');
  });
});

describe('IMF_WEO_DATAMAPPER_AVAILABLE / IMF_WEO_SDMX_ONLY', () => {
  it('lists exactly the 9 WEO codes verified live on the Datamapper (2026-05-10)', () => {
    expect([...IMF_WEO_DATAMAPPER_AVAILABLE].sort()).toEqual([
      'BCA_NGDPD',
      'GGXCNL_NGDP',
      'GGXWDG_NGDP',
      'LP',
      'LUR',
      'NGDPD',
      'NGDPDPC',
      'NGDP_RPCH',
      'PCPIPCH',
    ]);
  });

  it('flags the 4 IMF_WEO_INDICATORS codes that are SDMX-only (Datamapper returns empty envelopes)', () => {
    expect([...IMF_WEO_SDMX_ONLY].sort()).toEqual(['GGR_NGDP', 'GGXONLB_NGDP', 'GGX_NGDP', 'TX_RPCH']);
  });

  it('partitions IMF_WEO_INDICATORS into available + SDMX-only with no overlap', () => {
    const allWeo = new Set(Object.values(IMF_WEO_INDICATORS));
    for (const code of IMF_WEO_DATAMAPPER_AVAILABLE) {
      expect(IMF_WEO_SDMX_ONLY.has(code), `${code} cannot be both Datamapper and SDMX-only`).toBe(false);
    }
    // Every IMF_WEO_INDICATORS entry must be on exactly one transport
    // (so agents always know which transport handles the citation).
    for (const code of allWeo) {
      const onDatamapper = IMF_WEO_DATAMAPPER_AVAILABLE.has(code);
      const onSdmxOnly = IMF_WEO_SDMX_ONLY.has(code);
      expect(onDatamapper !== onSdmxOnly, `${code} must be in exactly one transport set`).toBe(true);
    }
  });
});

describe('weoSdmxPath', () => {
  it('builds the canonical WEO 9.0.0 SDMX path', () => {
    expect(weoSdmxPath('SWE', 'GGR_NGDP')).toBe('/data/IMF.RES,WEO,9.0.0/A.SWE.GGR_NGDP');
  });

  it('upper-cases the country code so case-mismatched ISO inputs still resolve', () => {
    expect(weoSdmxPath('swe', 'NGDP_RPCH')).toBe('/data/IMF.RES,WEO,9.0.0/A.SWE.NGDP_RPCH');
  });

  it('URL-encodes both the indicator and country segments', () => {
    // Defensive: codes never contain reserved chars in practice, but the
    // helper must not silently produce an invalid URL if one ever does.
    expect(weoSdmxPath('SWE', 'A B')).toBe('/data/IMF.RES,WEO,9.0.0/A.SWE.A%20B');
  });
});
