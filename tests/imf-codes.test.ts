/**
 * Tests for IMF country / area code mappings.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  COUNTRY_CODES,
  ISO3_TO_IMF_AREA,
  IMF_AREA_TO_ISO3,
  toDatamapperCode,
  toImfAreaCode,
  isKnownIso3,
  listKnownIso3Codes,
  COUNTRY_NAMES_EN,
} from '../scripts/imf-codes.js';

describe('imf-codes', () => {
  describe('COUNTRY_CODES', () => {
    it('exposes Nordic + German + EU peer set in ISO-3', () => {
      expect(COUNTRY_CODES.sweden).toBe('SWE');
      expect(COUNTRY_CODES.denmark).toBe('DNK');
      expect(COUNTRY_CODES.norway).toBe('NOR');
      expect(COUNTRY_CODES.finland).toBe('FIN');
      expect(COUNTRY_CODES.germany).toBe('DEU');
      expect(COUNTRY_CODES.europeanUnion).toBe('EU');
      expect(COUNTRY_CODES.euroArea).toBe('EURO');
    });
  });

  describe('ISO3_TO_IMF_AREA', () => {
    it('covers the full Nordic + DE peer set', () => {
      for (const iso3 of ['SWE', 'DNK', 'NOR', 'FIN', 'DEU']) {
        expect(ISO3_TO_IMF_AREA[iso3]).toMatch(/^\d{3}$/);
      }
    });

    it('is deep-frozen (immutable)', () => {
      expect(Object.isFrozen(ISO3_TO_IMF_AREA)).toBe(true);
    });

    it('has a consistent inverse map', () => {
      for (const [iso3, area] of Object.entries(ISO3_TO_IMF_AREA)) {
        expect(IMF_AREA_TO_ISO3[area]).toBe(iso3);
      }
    });
  });

  describe('toDatamapperCode', () => {
    it('returns ISO-3 codes uppercase, trimmed', () => {
      expect(toDatamapperCode('swe')).toBe('SWE');
      expect(toDatamapperCode(' DNK ')).toBe('DNK');
    });

    it('passes through EU / EURO aggregates', () => {
      expect(toDatamapperCode('EU')).toBe('EU');
      expect(toDatamapperCode('EURO')).toBe('EURO');
    });
  });

  describe('toImfAreaCode', () => {
    it('converts ISO-3 to 3-digit IMF AREA code', () => {
      expect(toImfAreaCode('SWE')).toBe('144');
      expect(toImfAreaCode('deu')).toBe('134');
      expect(toImfAreaCode(' FIN ')).toBe('172');
    });

    it('throws for unknown ISO-3 instead of silently dropping the request', () => {
      expect(() => toImfAreaCode('XXX')).toThrow(/no IMF area code mapping/);
    });

    it('throws for empty / whitespace input', () => {
      expect(() => toImfAreaCode('')).toThrow();
      expect(() => toImfAreaCode('   ')).toThrow();
    });
  });

  describe('isKnownIso3', () => {
    it('returns true for mapped codes', () => {
      expect(isKnownIso3('SWE')).toBe(true);
      expect(isKnownIso3('swe')).toBe(true);
    });

    it('returns false for unknown codes', () => {
      expect(isKnownIso3('XXX')).toBe(false);
      expect(isKnownIso3('')).toBe(false);
    });
  });

  describe('COUNTRY_NAMES_EN', () => {
    it('carries English display names for the peer set', () => {
      expect(COUNTRY_NAMES_EN.SWE).toBe('Sweden');
      expect(COUNTRY_NAMES_EN.DEU).toBe('Germany');
      expect(COUNTRY_NAMES_EN.EU).toBe('European Union');
      expect(COUNTRY_NAMES_EN.EURO).toBe('Euro Area');
    });

    it('covers the expanded Eurozone comparator set (BEL / AUT / IRL)', () => {
      expect(COUNTRY_NAMES_EN.BEL).toBe('Belgium');
      expect(COUNTRY_NAMES_EN.AUT).toBe('Austria');
      expect(COUNTRY_NAMES_EN.IRL).toBe('Ireland');
    });
  });

  describe('listKnownIso3Codes', () => {
    it('returns every ISO-3 code in ISO3_TO_IMF_AREA, sorted', () => {
      const codes = listKnownIso3Codes();
      const expected = Object.keys(ISO3_TO_IMF_AREA).sort();
      expect([...codes]).toEqual(expected);
    });

    it('includes the Nordic + DE peer set', () => {
      const codes = listKnownIso3Codes();
      for (const iso3 of ['SWE', 'DNK', 'NOR', 'FIN', 'DEU']) {
        expect(codes).toContain(iso3);
      }
    });

    it('is frozen (immutable)', () => {
      expect(Object.isFrozen(listKnownIso3Codes())).toBe(true);
    });
  });
});
