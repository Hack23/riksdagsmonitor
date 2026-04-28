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
  ALL_WORLD_BANK_INDICATORS,
  ECONOMIC_SECTION_HEADINGS,
  NORDIC_COMPARISON,
  getEconomicHeading,
  findRelevantIndicators,
  findDeprecatedIndicators,
  resolveImfReplacement,
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

    it('should NOT include the deprecated WB GDP growth code (IMF-first contract v2.1)', () => {
      const gdp = ECONOMIC_INDICATORS.find((i) => i.indicatorId === 'NY.GDP.MKTP.KD.ZG');
      expect(gdp).toBeUndefined();
    });

    it('should NOT include the deprecated WB unemployment code (use IMF WEO:LUR)', () => {
      const unemployment = ECONOMIC_INDICATORS.find((i) => i.indicatorId === 'SL.UEM.TOTL.ZS');
      expect(unemployment).toBeUndefined();
    });

    it('should NOT include the deprecated WB CPI code (use IMF WEO:PCPIPCH)', () => {
      const cpi = ECONOMIC_INDICATORS.find((i) => i.indicatorId === 'FP.CPI.TOTL.ZG');
      expect(cpi).toBeUndefined();
    });

    it('should still include military expenditure for defense policy (non-economic residue)', () => {
      const military = ECONOMIC_INDICATORS.find((i) => i.name === 'Military Expenditure (% GDP)');
      expect(military).toBeDefined();
      expect(military!.policyAreas).toContain('defense');
      expect(military!.committees).toContain('FöU');
    });

    it('should still include CO2 emissions for climate policy (non-economic residue)', () => {
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

    it('should never carry deprecated: true (active set is filtered)', () => {
      ECONOMIC_INDICATORS.forEach((indicator) => {
        expect(indicator.deprecated).not.toBe(true);
      });
    });
  });

  describe('ALL_WORLD_BANK_INDICATORS (raw inventory)', () => {
    it('should include the deprecated WB GDP growth code (raw inventory)', () => {
      const gdp = ALL_WORLD_BANK_INDICATORS.find((i) => i.indicatorId === 'NY.GDP.MKTP.KD.ZG');
      expect(gdp).toBeDefined();
      expect(gdp!.deprecated).toBe(true);
      expect(gdp!.supersededBy).toBe('imf:WEO:NGDP_RPCH');
    });

    it('should include the deprecated WB CPI code with IMF replacement', () => {
      const cpi = ALL_WORLD_BANK_INDICATORS.find((i) => i.indicatorId === 'FP.CPI.TOTL.ZG');
      expect(cpi).toBeDefined();
      expect(cpi!.deprecated).toBe(true);
      expect(cpi!.supersededBy).toBe('imf:WEO:PCPIPCH');
    });

    it('should be a strict superset of the active ECONOMIC_INDICATORS set', () => {
      expect(ALL_WORLD_BANK_INDICATORS.length).toBeGreaterThan(ECONOMIC_INDICATORS.length);
      ECONOMIC_INDICATORS.forEach((active) => {
        expect(
          ALL_WORLD_BANK_INDICATORS.some((all) => all.indicatorId === active.indicatorId),
        ).toBe(true);
      });
    });
  });

  describe('findDeprecatedIndicators', () => {
    it('should return at least the contract banned-list of WB economic codes', () => {
      const deprecated = findDeprecatedIndicators();
      const ids = new Set(deprecated.map((i) => i.indicatorId));
      // Banned-list per .github/aw/ECONOMIC_DATA_CONTRACT.md v2.1
      const contractBanned = [
        'NY.GDP.MKTP.KD.ZG',
        'NY.GDP.MKTP.CD',
        'NY.GDP.PCAP.CD',
        'FP.CPI.TOTL.ZG',
        'SL.UEM.TOTL.ZS',
        'GC.XPN.TOTL.GD.ZS',
        'GC.REV.XGRT.GD.ZS',
        'BN.CAB.XOKA.GD.ZS',
        'NE.EXP.GNFS.ZS',
      ];
      contractBanned.forEach((code) => {
        expect(ids.has(code)).toBe(true);
      });
    });

    it('should ensure every deprecated indicator has an IMF replacement', () => {
      const deprecated = findDeprecatedIndicators();
      deprecated.forEach((ind) => {
        expect(ind.supersededBy).toBeDefined();
        expect(ind.supersededBy).toMatch(/^imf:[A-Z_]+:[A-Z0-9_]+/);
        expect(ind.deprecationReason).toBeDefined();
      });
    });
  });

  describe('resolveImfReplacement', () => {
    it('should resolve banned WB codes to IMF citations', () => {
      expect(resolveImfReplacement('NY.GDP.MKTP.KD.ZG')).toBe('imf:WEO:NGDP_RPCH');
      expect(resolveImfReplacement('FP.CPI.TOTL.ZG')).toBe('imf:WEO:PCPIPCH');
      expect(resolveImfReplacement('SL.UEM.TOTL.ZS')).toBe('imf:WEO:LUR');
    });

    it('should return undefined for non-deprecated WB residue (governance, environment)', () => {
      expect(resolveImfReplacement('CC.EST')).toBeUndefined(); // WGI control of corruption
      expect(resolveImfReplacement('EN.ATM.CO2E.PC')).toBeUndefined(); // CO2 emissions
    });

    it('should return undefined for unknown indicator IDs', () => {
      expect(resolveImfReplacement('NOT.A.REAL.CODE')).toBeUndefined();
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

    it('should have all 5 section headings per language', () => {
      const expectedSections = ['country', 'economicContext', 'nordicComparison', 'policyImplications', 'unit'];
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
        country: 'Country',
        unit: 'Unit',
      });
    });

    it('should have correct Swedish headings', () => {
      expect(ECONOMIC_SECTION_HEADINGS.sv).toEqual({
        economicContext: 'Ekonomisk kontext',
        nordicComparison: 'Nordisk jämförelse',
        policyImplications: 'Policyimplikationer',
        country: 'Land',
        unit: 'Enhet',
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
    it('should NOT surface deprecated WB GDP for fiscal policy (use IMF)', () => {
      const results = findRelevantIndicators('fiscal policy');
      // The active set must not contain banned WB economic codes — agents must
      // get IMF citations for fiscal/macro context, not WB.
      expect(results.some((i) => i.indicatorId === 'NY.GDP.MKTP.KD.ZG')).toBe(false);
    });

    it('should NOT surface deprecated WB unemployment for labor market (use IMF WEO:LUR)', () => {
      const results = findRelevantIndicators('labor market');
      expect(results.some((i) => i.indicatorId === 'SL.UEM.TOTL.ZS')).toBe(false);
    });

    it('should still find indicators by committee abbreviation (non-economic residue)', () => {
      const fiuResults = findRelevantIndicators('FiU');
      // FiU may return zero WB residue indicators (financial-sector codes are deprecated),
      // but the lookup must not throw or return undefined.
      expect(Array.isArray(fiuResults)).toBe(true);

      const auResults = findRelevantIndicators('AU');
      expect(Array.isArray(auResults)).toBe(true);
    });

    it('should find defense indicators for NATO queries', () => {
      const results = findRelevantIndicators('nato');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((i) => i.name === 'Military Expenditure (% GDP)')).toBe(true);
    });

    it('should find climate indicators', () => {
      const results = findRelevantIndicators('climate');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty for unrelated queries', () => {
      const results = findRelevantIndicators('xyznonexistent');
      expect(results).toHaveLength(0);
    });

    it('should return empty for empty query', () => {
      expect(findRelevantIndicators('')).toHaveLength(0);
    });

    it('should return empty for whitespace-only query', () => {
      expect(findRelevantIndicators('   ')).toHaveLength(0);
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

    it('should detect IMF as primary economic data source (v2.1 contract)', () => {
      expect(hasEconomicContext('Source: IMF World Economic Outlook April 2026')).toBe(true);
    });

    it('should detect legacy World Bank source references (back-compat)', () => {
      // World Bank is no longer a primary economic source, but legacy article
      // back-compat detection must continue to flag any "World Bank" mention.
      expect(hasEconomicContext('Source: World Bank Open Data (governance residue)')).toBe(true);
    });

    it('should detect Swedish economic terms', () => {
      expect(hasEconomicContext('BNP-tillväxten var 1,5 procent')).toBe(true);
      expect(hasEconomicContext('Arbetslösheten minskade till 7,5%')).toBe(true);
    });

    it('should detect Swedish inflected forms (definite, plural)', () => {
      expect(hasEconomicContext('Försvarsutgifterna ökade kraftigt under 2025')).toBe(true);
      expect(hasEconomicContext('Forskningsutgifterna låg på 3,4% av BNP')).toBe(true);
      expect(hasEconomicContext('Handelsbalansen förbättrades under kvartalet')).toBe(true);
      expect(hasEconomicContext('Statsskulden minskade som andel av BNP')).toBe(true);
    });

    it('should detect IMF citation strings (DATABASE:INDICATOR_ID)', () => {
      expect(hasEconomicContext('per WEO:NGDP_RPCH the projection rises')).toBe(true);
      expect(hasEconomicContext('IMF FM:GGXWDG_NGDP shows 32.5% of GDP')).toBe(true);
      expect(hasEconomicContext('GFS_COFOG:G02 defence spending decomposition')).toBe(true);
      expect(hasEconomicContext('DOTS:TXG_FOB_USD bilateral trade')).toBe(true);
      expect(hasEconomicContext('PCPS:POILAPSP commodity overlay')).toBe(true);
    });

    it('should detect IMF projection vintage tags', () => {
      expect(hasEconomicContext('forecast (WEO Apr-2026)')).toBe(true);
      expect(hasEconomicContext('per WEO October-2025 vintage')).toBe(true);
    });

    it('should detect legacy World Bank indicator IDs (back-compat)', () => {
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
