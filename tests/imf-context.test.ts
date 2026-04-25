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
  findImfIndicatorByCode,
  findImfIndicatorByCitation,
  getImfDatabasesInUse,
  getImfCommitteeMatrix,
  listImfCitations,
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
      expect(codes.has('ER:ENDA_XDC_USD_RATE')).toBe(true);
      expect(codes.has('PCPS:POILAPSP')).toBe(true);
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

  describe('findImfIndicatorByCode', () => {
    it('returns the matching indicator for a known (database, id) pair', () => {
      const hit = findImfIndicatorByCode('WEO', 'NGDP_RPCH');
      expect(hit?.indicatorId).toBe('NGDP_RPCH');
      expect(hit?.database).toBe('WEO');
      expect(hit?.name).toMatch(/Real GDP growth/i);
    });

    it('keeps strict ImfDatabase literal callers backwards compatible', () => {
      const database = 'WEO' as const;
      const hit = findImfIndicatorByCode(database, 'NGDP_RPCH');
      expect(hit?.database).toBe(database);
    });

    it('is case-insensitive on both arguments', () => {
      const mixed = findImfIndicatorByCode('weo', 'ngdp_rpch');
      expect(mixed?.indicatorId).toBe('NGDP_RPCH');
    });

    it('trims whitespace before matching', () => {
      const mixed = findImfIndicatorByCode(' WEO ', ' NGDP_RPCH ');
      expect(mixed?.indicatorId).toBe('NGDP_RPCH');
    });

    it('returns undefined for an unknown indicator id', () => {
      expect(findImfIndicatorByCode('WEO', 'NOT_A_REAL_CODE')).toBeUndefined();
    });

    it('returns undefined when database and id do not co-occur', () => {
      // GGXWDG_NGDP exists in WEO but not as a same-code IFS catalogue entry.
      expect(findImfIndicatorByCode('IFS', 'GGXWDG_NGDP')).toBeUndefined();
    });

    it('resolves GFS_COFOG committee-aligned spending indicators', () => {
      for (const id of ['G02', 'G07', 'G09', 'G10']) {
        const hit = findImfIndicatorByCode('GFS_COFOG', id);
        expect(hit?.database).toBe('GFS_COFOG');
        expect(hit?.indicatorId).toBe(id);
      }
    });
  });

  describe('findImfIndicatorByCitation', () => {
    it('parses a canonical DATABASE:INDICATOR citation', () => {
      const hit = findImfIndicatorByCitation('WEO:NGDP_RPCH');
      expect(hit?.indicatorId).toBe('NGDP_RPCH');
    });

    it('normalizes citation database prefixes without unsafe casts', () => {
      const hit = findImfIndicatorByCitation(' weo : ngdp_rpch ');
      expect(hit?.database).toBe('WEO');
      expect(hit?.indicatorId).toBe('NGDP_RPCH');
    });

    it('round-trips imfCitation for every catalogue entry', () => {
      for (const ind of IMF_INDICATORS) {
        const citation = imfCitation(ind.database, ind.indicatorId);
        expect(findImfIndicatorByCitation(citation)).toBe(ind);
      }
    });

    it('returns undefined for malformed citations', () => {
      expect(findImfIndicatorByCitation('no-colon')).toBeUndefined();
      expect(findImfIndicatorByCitation(':NGDP_RPCH')).toBeUndefined();
      expect(findImfIndicatorByCitation('WEO:')).toBeUndefined();
      expect(findImfIndicatorByCitation('')).toBeUndefined();
    });
  });

  describe('getImfDatabasesInUse', () => {
    it('includes the IMF databases actually referenced by the catalogue', () => {
      const dbs = getImfDatabasesInUse();
      for (const db of ['WEO', 'FM', 'GFS_COFOG', 'DOTS', 'ER', 'PCPS', 'MFS_IR']) {
        expect(dbs.has(db as Parameters<typeof imfCitation>[0])).toBe(true);
      }
    });

    it('never contains databases absent from IMF_INDICATORS', () => {
      const dbs = getImfDatabasesInUse();
      const catalogDbs = new Set(IMF_INDICATORS.map((ind) => ind.database));
      for (const db of dbs) {
        expect(catalogDbs.has(db)).toBe(true);
      }
    });
  });

  describe('getImfCommitteeMatrix', () => {
    it('keys are UPPER-CASE committee codes', () => {
      const matrix = getImfCommitteeMatrix();
      for (const key of matrix.keys()) {
        expect(key).toBe(key.toUpperCase());
      }
    });

    it('FIU surfaces the headline macro+fiscal indicator set', () => {
      const fiu = getImfCommitteeMatrix().get('FIU');
      expect(fiu).toBeDefined();
      expect(fiu).toContain('WEO:NGDP_RPCH');
      expect(fiu).toContain('WEO:GGXWDG_NGDP');
      expect(fiu).toContain('WEO:PCPIPCH');
    });

    it('FÖU surfaces COFOG G02 (defence spending)', () => {
      const fou = getImfCommitteeMatrix().get('FÖU');
      expect(fou).toBeDefined();
      expect(fou).toContain('GFS_COFOG:G02');
    });

    it('each entry is sorted and deduplicated', () => {
      const matrix = getImfCommitteeMatrix();
      for (const [, citations] of matrix) {
        const sorted = [...citations].sort();
        expect([...citations]).toEqual(sorted);
        expect(new Set(citations).size).toBe(citations.length);
      }
    });

    it('covers every committee referenced by any indicator', () => {
      const matrix = getImfCommitteeMatrix();
      const expected = new Set<string>();
      for (const ind of IMF_INDICATORS) {
        for (const c of ind.committees) expected.add(c.toUpperCase());
      }
      for (const committee of expected) {
        expect(matrix.has(committee)).toBe(true);
      }
    });
  });

  describe('listImfCitations', () => {
    it('returns every DATABASE:INDICATOR citation, sorted and frozen', () => {
      const citations = listImfCitations();
      expect(citations.length).toBe(IMF_INDICATORS.length);
      expect([...citations]).toEqual([...citations].sort());
      expect(Object.isFrozen(citations)).toBe(true);
    });

    it('citations are unique', () => {
      const citations = listImfCitations();
      expect(new Set(citations).size).toBe(citations.length);
    });
  });
});
