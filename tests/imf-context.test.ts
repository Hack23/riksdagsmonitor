/**
 * Tests for the IMF context / policy mapping helpers.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  IMF_INDICATORS,
  findImfIndicatorsForDomains,
  findImfIndicatorsForCommittee,
  IMF_NORDIC_PEERS,
  imfCountryNameEn,
  imfCitation,
} from '../scripts/imf-context.js';

describe('imf-context', () => {
  describe('IMF_INDICATORS catalogue', () => {
    it('exposes the headline WEO indicators used by article workflows', () => {
      const codes = new Set(IMF_INDICATORS.map((i) => `${i.database}:${i.indicatorId}`));
      expect(codes.has('WEO:NGDP_RPCH')).toBe(true);
      expect(codes.has('WEO:GGXWDG_NGDP')).toBe(true);
      expect(codes.has('WEO:PCPIPCH')).toBe(true);
      expect(codes.has('WEO:LUR')).toBe(true);
      expect(codes.has('WEO:BCA_NGDPD')).toBe(true);
      expect(codes.has('FM:GGXONLB_NGDP')).toBe(true);
    });

    it('marks every WEO/FM indicator as projection-capable', () => {
      for (const ind of IMF_INDICATORS) {
        if (ind.database === 'WEO' || ind.database === 'FM') {
          expect(ind.publishesProjections).toBe(true);
        }
      }
    });

    it('has policyAreas and committees for every entry', () => {
      for (const ind of IMF_INDICATORS) {
        expect(ind.policyAreas.length).toBeGreaterThan(0);
        expect(ind.committees.length).toBeGreaterThan(0);
        expect(ind.name.length).toBeGreaterThan(0);
        expect(ind.unit.length).toBeGreaterThan(0);
      }
    });
  });

  describe('findImfIndicatorsForDomains', () => {
    it('returns fiscal-policy indicators for "fiscal policy"', () => {
      const hits = findImfIndicatorsForDomains(['fiscal policy']);
      const ids = hits.map((h) => h.indicatorId);
      expect(ids).toContain('GGXWDG_NGDP');
      expect(ids).toContain('GGXCNL_NGDP');
    });

    it('is case-insensitive', () => {
      const lower = findImfIndicatorsForDomains(['labor market']);
      const upper = findImfIndicatorsForDomains(['LABOR MARKET']);
      expect(lower.map((i) => i.indicatorId).sort()).toEqual(upper.map((i) => i.indicatorId).sort());
    });

    it('returns an empty list for an empty domain array', () => {
      expect(findImfIndicatorsForDomains([])).toEqual([]);
    });

    it('matches substrings defensively', () => {
      const hits = findImfIndicatorsForDomains(['inflation']);
      expect(hits.some((h) => h.indicatorId === 'PCPIPCH')).toBe(true);
    });
  });

  describe('findImfIndicatorsForCommittee', () => {
    it('returns FiU (finance) headline indicators', () => {
      const hits = findImfIndicatorsForCommittee('FiU');
      const ids = hits.map((h) => h.indicatorId);
      expect(ids).toContain('NGDP_RPCH');
      expect(ids).toContain('GGXWDG_NGDP');
      expect(ids).toContain('PCPIPCH');
    });

    it('returns AU (labour market) indicators', () => {
      const hits = findImfIndicatorsForCommittee('AU');
      expect(hits.some((h) => h.indicatorId === 'LUR')).toBe(true);
    });

    it('is case-insensitive', () => {
      const upper = findImfIndicatorsForCommittee('FIU');
      const mixed = findImfIndicatorsForCommittee('fiu');
      expect(upper).toEqual(mixed);
    });
  });

  describe('IMF_NORDIC_PEERS', () => {
    it('contains the SE/DK/NO/FI/DE peer set', () => {
      expect(IMF_NORDIC_PEERS).toEqual(['SWE', 'DNK', 'NOR', 'FIN', 'DEU']);
    });

    it('is immutable', () => {
      expect(Object.isFrozen(IMF_NORDIC_PEERS)).toBe(true);
    });
  });

  describe('imfCountryNameEn', () => {
    it('returns English display names', () => {
      expect(imfCountryNameEn('SWE')).toBe('Sweden');
      expect(imfCountryNameEn('deu')).toBe('Germany');
    });

    it('falls back to the upper-cased code when unknown', () => {
      expect(imfCountryNameEn('zzz')).toBe('ZZZ');
    });
  });

  describe('imfCitation', () => {
    it('joins database and indicator with a colon', () => {
      expect(imfCitation('WEO', 'NGDP_RPCH')).toBe('WEO:NGDP_RPCH');
      expect(imfCitation('FM', 'GGXONLB_NGDP')).toBe('FM:GGXONLB_NGDP');
      expect(imfCitation('GFS_COFOG', 'G01_GDP_PT')).toBe('GFS_COFOG:G01_GDP_PT');
    });
  });
});
