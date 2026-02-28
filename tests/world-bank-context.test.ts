/**
 * Tests for World Bank Context
 * Tests economic context provider for news generation
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  ECONOMIC_INDICATORS,
  ECONOMIC_SECTION_HEADINGS,
  NORDIC_COMPARISON,
  getEconomicHeading,
  findRelevantIndicators,
  getSwedishIndicatorQueries,
  hasEconomicContext,
} from '../scripts/world-bank-context.js';
import type { Language } from '../scripts/types/language.js';

describe('world-bank-context', () => {
  describe('ECONOMIC_INDICATORS', () => {
    it('should define at least 8 indicators', () => {
      expect(ECONOMIC_INDICATORS.length).toBeGreaterThanOrEqual(8);
    });

    it('should have required fields for each indicator', () => {
      ECONOMIC_INDICATORS.forEach((indicator) => {
        expect(indicator.indicatorId).toBeDefined();
        expect(indicator.indicatorId.length).toBeGreaterThan(0);
        expect(indicator.name).toBeDefined();
        expect(indicator.name.length).toBeGreaterThan(0);
        expect(indicator.description).toBeDefined();
        expect(indicator.description.length).toBeGreaterThan(10);
        expect(indicator.policyAreas.length).toBeGreaterThan(0);
        expect(indicator.committees.length).toBeGreaterThan(0);
        expect(indicator.unit).toBeDefined();
      });
    });

    it('should include GDP growth indicator', () => {
      const gdp = ECONOMIC_INDICATORS.find((i) => i.name === 'GDP Growth');
      expect(gdp).toBeDefined();
      expect(gdp!.indicatorId).toBe('NY.GDP.MKTP.KD.ZG');
      expect(gdp!.committees).toContain('FiU');
    });

    it('should include unemployment indicator', () => {
      const unemployment = ECONOMIC_INDICATORS.find((i) => i.name === 'Unemployment Rate');
      expect(unemployment).toBeDefined();
      expect(unemployment!.indicatorId).toBe('SL.UEM.TOTL.ZS');
      expect(unemployment!.committees).toContain('AU');
    });

    it('should include military expenditure for defense policy', () => {
      const military = ECONOMIC_INDICATORS.find((i) => i.name === 'Military Expenditure');
      expect(military).toBeDefined();
      expect(military!.policyAreas).toContain('defense');
      expect(military!.committees).toContain('FöU');
    });

    it('should include CO2 emissions for climate policy', () => {
      const co2 = ECONOMIC_INDICATORS.find((i) => i.name.includes('CO₂'));
      expect(co2).toBeDefined();
      expect(co2!.policyAreas).toContain('climate policy');
      expect(co2!.committees).toContain('MJU');
    });

    it('should map indicators to valid Riksdag committees', () => {
      const validCommittees = [
        'FiU', 'AU', 'NU', 'UU', 'FöU', 'MJU', 'UbU', 'SoU',
        'JuU', 'CU', 'KU', 'SfU', 'TU', 'SkU',
      ];
      ECONOMIC_INDICATORS.forEach((indicator) => {
        indicator.committees.forEach((committee) => {
          expect(validCommittees).toContain(committee);
        });
      });
    });
  });

  describe('ECONOMIC_SECTION_HEADINGS', () => {
    it('should have all 14 supported languages', () => {
      const expectedLanguages: string[] = [
        'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
      ];
      const actualLanguages: string[] = Object.keys(ECONOMIC_SECTION_HEADINGS);
      expect(actualLanguages.sort()).toEqual(expectedLanguages.sort());
    });

    it('should have all 3 section headings per language', () => {
      const expectedSections = ['economicContext', 'nordicComparison', 'policyImplications'];
      Object.entries(ECONOMIC_SECTION_HEADINGS).forEach(([, headings]) => {
        const actualSections = Object.keys(headings);
        expect(actualSections.sort()).toEqual(expectedSections.sort());
      });
    });

    it('should have non-empty strings for all headings', () => {
      Object.entries(ECONOMIC_SECTION_HEADINGS).forEach(([, headings]) => {
        Object.values(headings).forEach((heading) => {
          expect(typeof heading).toBe('string');
          expect(heading.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have correct English headings', () => {
      expect(ECONOMIC_SECTION_HEADINGS.en).toEqual({
        economicContext: 'Economic Context',
        nordicComparison: 'Nordic Comparison',
        policyImplications: 'Policy Implications',
      });
    });

    it('should have correct Swedish headings', () => {
      expect(ECONOMIC_SECTION_HEADINGS.sv).toEqual({
        economicContext: 'Ekonomisk kontext',
        nordicComparison: 'Nordisk jämförelse',
        policyImplications: 'Policyimplikationer',
      });
    });
  });

  describe('NORDIC_COMPARISON', () => {
    it('should include Sweden and 4 comparison countries', () => {
      expect(NORDIC_COMPARISON.countries).toHaveLength(5);
      expect(NORDIC_COMPARISON.countries).toContain('SWE');
      expect(NORDIC_COMPARISON.countries).toContain('DNK');
      expect(NORDIC_COMPARISON.countries).toContain('NOR');
      expect(NORDIC_COMPARISON.countries).toContain('FIN');
      expect(NORDIC_COMPARISON.countries).toContain('DEU');
    });

    it('should have country names for all countries', () => {
      NORDIC_COMPARISON.countries.forEach((code) => {
        expect(NORDIC_COMPARISON.countryNames[code]).toBeDefined();
        expect(NORDIC_COMPARISON.countryNames[code].length).toBeGreaterThan(0);
      });
    });
  });

  describe('getEconomicHeading', () => {
    it('should return correct English heading', () => {
      expect(getEconomicHeading('en', 'economicContext')).toBe('Economic Context');
      expect(getEconomicHeading('en', 'nordicComparison')).toBe('Nordic Comparison');
      expect(getEconomicHeading('en', 'policyImplications')).toBe('Policy Implications');
    });

    it('should return correct Swedish heading', () => {
      expect(getEconomicHeading('sv', 'economicContext')).toBe('Ekonomisk kontext');
    });

    it('should fallback to English for unsupported language', () => {
      expect(getEconomicHeading('xx', 'economicContext')).toBe('Economic Context');
    });

    it('should fallback to English for null language', () => {
      expect(getEconomicHeading(null as unknown as string, 'economicContext')).toBe('Economic Context');
    });

    it('should handle all 14 languages', () => {
      const languages: Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      languages.forEach((lang) => {
        const heading = getEconomicHeading(lang, 'economicContext');
        expect(typeof heading).toBe('string');
        expect(heading.length).toBeGreaterThan(0);
      });
    });
  });

  describe('findRelevantIndicators', () => {
    it('should find GDP for fiscal policy queries', () => {
      const results = findRelevantIndicators('fiscal policy');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((i) => i.indicatorId === 'NY.GDP.MKTP.KD.ZG')).toBe(true);
    });

    it('should find unemployment for labor market queries', () => {
      const results = findRelevantIndicators('labor market');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((i) => i.indicatorId === 'SL.UEM.TOTL.ZS')).toBe(true);
    });

    it('should find indicators by committee abbreviation', () => {
      const fiuResults = findRelevantIndicators('FiU');
      expect(fiuResults.length).toBeGreaterThan(0);

      const auResults = findRelevantIndicators('AU');
      expect(auResults.length).toBeGreaterThan(0);
    });

    it('should find defense indicators for NATO queries', () => {
      const results = findRelevantIndicators('nato');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((i) => i.name === 'Military Expenditure')).toBe(true);
    });

    it('should find climate indicators', () => {
      const results = findRelevantIndicators('climate');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty for unrelated queries', () => {
      const results = findRelevantIndicators('xyznonexistent');
      expect(results).toHaveLength(0);
    });

    it('should be case-insensitive', () => {
      const upper = findRelevantIndicators('FISCAL POLICY');
      const lower = findRelevantIndicators('fiscal policy');
      expect(upper.length).toBe(lower.length);
    });
  });

  describe('getSwedishIndicatorQueries', () => {
    it('should return queries for all configured indicators', () => {
      const queries = getSwedishIndicatorQueries();
      expect(queries.length).toBe(ECONOMIC_INDICATORS.length);
    });

    it('should use SWE country code for all queries', () => {
      const queries = getSwedishIndicatorQueries();
      queries.forEach((q) => {
        expect(q.countryCode).toBe('SWE');
      });
    });

    it('should include indicator name for reference', () => {
      const queries = getSwedishIndicatorQueries();
      queries.forEach((q) => {
        expect(q.name).toBeDefined();
        expect(q.name.length).toBeGreaterThan(0);
        expect(q.indicatorId).toBeDefined();
        expect(q.indicatorId.length).toBeGreaterThan(0);
      });
    });
  });

  describe('hasEconomicContext', () => {
    it('should detect GDP references', () => {
      expect(hasEconomicContext('Sweden GDP growth was 1.5% in 2023')).toBe(true);
    });

    it('should detect unemployment references', () => {
      expect(hasEconomicContext('The unemployment rate fell to 7.5%')).toBe(true);
    });

    it('should detect inflation references', () => {
      expect(hasEconomicContext('Inflation continues to rise above target')).toBe(true);
    });

    it('should detect economic context keywords', () => {
      expect(hasEconomicContext('The economic growth has stalled')).toBe(true);
    });

    it('should detect World Bank data source references', () => {
      expect(hasEconomicContext('Source: World Bank Open Data')).toBe(true);
    });

    it('should detect Swedish economic terms', () => {
      expect(hasEconomicContext('BNP-tillväxten var 1,5 procent')).toBe(true);
      expect(hasEconomicContext('Arbetslösheten minskade till 7,5%')).toBe(true);
    });

    it('should detect World Bank indicator IDs', () => {
      expect(hasEconomicContext('Indicator NY.GDP.MKTP.KD.ZG shows positive trend')).toBe(true);
      expect(hasEconomicContext('SL.UEM.TOTL.ZS data for Sweden')).toBe(true);
    });

    it('should return false for content without economic context', () => {
      expect(hasEconomicContext('The parliamentary vote was decisive')).toBe(false);
    });

    it('should return false for empty content', () => {
      expect(hasEconomicContext('')).toBe(false);
    });

    it('should detect ekonomi (Swedish)', () => {
      expect(hasEconomicContext('Sveriges ekonomiska läge')).toBe(true);
    });
  });
});
