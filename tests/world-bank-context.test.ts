/**
 * Tests for World Bank Context — non-economic residue only.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  WORLD_BANK_INDICATORS,
  ECONOMIC_SECTION_HEADINGS,
  NORDIC_COMPARISON,
  getEconomicHeading,
  findRelevantIndicators,
  getSwedishIndicatorQueries,
  hasEconomicContext,
} from '../scripts/world-bank-context.js';
import type { Language } from '../scripts/types/language.js';

/**
 * Codes whose economic context routes through IMF rather than the
 * World Bank inventory. Riksdagsmonitor sources every economic context
 * (macro / fiscal / monetary / external-sector / trade / commodity / FX /
 * interest rates / labour-market headlines) from IMF.
 */
const IMF_ROUTED_ECONOMIC_CODES = [
  // National accounts / GDP
  'NY.GDP.MKTP.KD.ZG',
  'NY.GDP.MKTP.CD',
  'NY.GDP.PCAP.CD',
  'NY.GNP.MKTP.CD',
  'NY.GNP.PCAP.CD',
  // Inflation
  'FP.CPI.TOTL.ZG',
  'FP.CPI.TOTL',
  // Labour-market headline
  'SL.UEM.TOTL.ZS',
  'SL.TLF.CACT.ZS',
  // Government finance
  'GC.XPN.TOTL.GD.ZS',
  'GC.REV.XGRT.GD.ZS',
  'GC.DOD.TOTL.GD.ZS',
  // Balance of payments / external
  'BN.CAB.XOKA.GD.ZS',
  'BN.KLT.DINV.CD',
  // Trade
  'NE.EXP.GNFS.ZS',
  'NE.IMP.GNFS.ZS',
  'TX.VAL.MRCH.CD.WT',
  // Financial / monetary
  'FR.INR.RINR',
  'FR.INR.LEND',
] as const;

describe('world-bank-context', () => {
  describe('WORLD_BANK_INDICATORS — non-economic residue only', () => {
    it('should define at least 8 indicators', () => {
      expect(WORLD_BANK_INDICATORS.length).toBeGreaterThanOrEqual(8);
    });

    it('should have required fields for each indicator', () => {
      WORLD_BANK_INDICATORS.forEach((indicator) => {
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

    it.each(IMF_ROUTED_ECONOMIC_CODES)(
      'inventory excludes economic indicator "%s" because economic context routes through IMF',
      (code) => {
        const found = WORLD_BANK_INDICATORS.find((i) => i.indicatorId === code);
        expect(found).toBeUndefined();
      },
    );

    it('must include military expenditure (defence historicals — non-economic residue)', () => {
      const military = WORLD_BANK_INDICATORS.find((i) => i.name === 'Military Expenditure (% GDP)');
      expect(military).toBeDefined();
      expect(military!.policyAreas).toContain('defense');
      expect(military!.committees).toContain('FöU');
    });

    it('must include CO₂ emissions (environment residue)', () => {
      const co2 = WORLD_BANK_INDICATORS.find((i) => i.name.includes('CO₂'));
      expect(co2).toBeDefined();
      expect(co2!.policyAreas).toContain('climate policy');
      expect(co2!.committees).toContain('MJU');
    });

    it('must include WGI governance indicators (residue)', () => {
      ['CC.EST', 'RL.EST', 'VA.EST', 'GE.EST', 'RQ.EST', 'PV.EST'].forEach((code) => {
        expect(
          WORLD_BANK_INDICATORS.some((i) => i.indicatorId === code),
          `missing WGI residue indicator ${code}`,
        ).toBe(true);
      });
    });

    it('must map every indicator to a valid Riksdag committee', () => {
      const validCommittees = [
        'FiU', 'AU', 'NU', 'UU', 'FöU', 'MJU', 'UbU', 'SoU',
        'JuU', 'CU', 'KU', 'SfU', 'TU', 'SkU',
      ];
      WORLD_BANK_INDICATORS.forEach((indicator) => {
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
    it.each(IMF_ROUTED_ECONOMIC_CODES)(
      'no policy-area query returns economic indicator "%s" (IMF-routed)',
      (code) => {
        const allQueries = ['fiscal policy', 'macro', 'inflation', 'labor market', 'trade', 'monetary', 'FiU', 'AU', 'NU'];
        allQueries.forEach((q) => {
          const results = findRelevantIndicators(q);
          expect(results.some((i) => i.indicatorId === code)).toBe(false);
        });
      },
    );

    it('must find defence indicators for NATO queries (defence historicals — non-economic residue)', () => {
      const results = findRelevantIndicators('nato');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((i) => i.name === 'Military Expenditure (% GDP)')).toBe(true);
    });

    it('must find climate indicators (environment residue)', () => {
      const results = findRelevantIndicators('climate');
      expect(results.length).toBeGreaterThan(0);
    });

    it('must return an array (never undefined) for any committee query', () => {
      ['FiU', 'AU', 'NU', 'FöU', 'MJU', 'KU'].forEach((c) => {
        expect(Array.isArray(findRelevantIndicators(c))).toBe(true);
      });
    });

    it('must return empty for unrelated queries', () => {
      expect(findRelevantIndicators('xyznonexistent')).toHaveLength(0);
    });

    it('must return empty for empty / whitespace queries', () => {
      expect(findRelevantIndicators('')).toHaveLength(0);
      expect(findRelevantIndicators('   ')).toHaveLength(0);
    });

    it('must be case-insensitive', () => {
      expect(findRelevantIndicators('CLIMATE').length).toBe(findRelevantIndicators('climate').length);
    });
  });

  describe('getSwedishIndicatorQueries', () => {
    it('must return queries for all configured indicators', () => {
      const queries = getSwedishIndicatorQueries();
      expect(queries.length).toBe(WORLD_BANK_INDICATORS.length);
    });

    it('must use SWE country code for all queries', () => {
      getSwedishIndicatorQueries().forEach((q) => {
        expect(q.countryCode).toBe('SWE');
      });
    });

    it.each(IMF_ROUTED_ECONOMIC_CODES)(
      'committee query does not request economic indicator "%s" (IMF-routed)',
      (code) => {
        const queries = getSwedishIndicatorQueries();
        expect(queries.some((q) => q.indicatorId === code)).toBe(false);
      },
    );
  });

  describe('hasEconomicContext', () => {
    it('must detect GDP / unemployment / inflation in English', () => {
      expect(hasEconomicContext('Sweden GDP growth was 1.5% in 2023')).toBe(true);
      expect(hasEconomicContext('The unemployment rate fell to 7.5%')).toBe(true);
      expect(hasEconomicContext('Inflation continues to rise above target')).toBe(true);
    });

    it('must detect IMF as the primary economic data source', () => {
      expect(hasEconomicContext('Source: IMF World Economic Outlook April 2026')).toBe(true);
      expect(hasEconomicContext('per the International Monetary Fund')).toBe(true);
    });

    it('must detect canonical IMF citation strings (DATABASE:INDICATOR_ID)', () => {
      expect(hasEconomicContext('per WEO:NGDP_RPCH the projection rises')).toBe(true);
      expect(hasEconomicContext('IMF FM:GGXWDG_NGDP shows 32.5% of GDP')).toBe(true);
      expect(hasEconomicContext('GFS_COFOG:G02 defence spending decomposition')).toBe(true);
      expect(hasEconomicContext('DOTS:TXG_FOB_USD bilateral trade')).toBe(true);
      expect(hasEconomicContext('PCPS:POILAPSP commodity overlay')).toBe(true);
      expect(hasEconomicContext('IFS:PCPI_IX monthly Swedish CPI')).toBe(true);
      expect(hasEconomicContext('BOP:BCA_BP6_USD current account')).toBe(true);
      expect(hasEconomicContext('MFS_IR:FPOLM policy rate')).toBe(true);
      expect(hasEconomicContext('ER:ENDA_XDC_USD_RATE bilateral FX')).toBe(true);
    });

    it('must detect IMF projection vintage tags', () => {
      expect(hasEconomicContext('forecast (WEO Apr-2026)')).toBe(true);
      expect(hasEconomicContext('per WEO October-2025 vintage')).toBe(true);
    });

    it('must detect Swedish economic terms', () => {
      expect(hasEconomicContext('BNP-tillväxten var 1,5 procent')).toBe(true);
      expect(hasEconomicContext('Arbetslösheten minskade till 7,5%')).toBe(true);
      expect(hasEconomicContext('Försvarsutgifterna ökade kraftigt under 2025')).toBe(true);
      expect(hasEconomicContext('Forskningsutgifterna låg på 3,4% av BNP')).toBe(true);
      expect(hasEconomicContext('Handelsbalansen förbättrades under kvartalet')).toBe(true);
      expect(hasEconomicContext('Statsskulden minskade som andel av BNP')).toBe(true);
      expect(hasEconomicContext('Sveriges ekonomiska läge')).toBe(true);
    });

    it('must detect non-economic WB residue indicator IDs (defence, environment, governance)', () => {
      expect(hasEconomicContext('MS.MIL.XPND.GD.ZS NATO benchmark')).toBe(true);
      expect(hasEconomicContext('EN.ATM.CO2E.PC emissions per capita')).toBe(true);
      expect(hasEconomicContext('SI.POV.GINI inequality measure')).toBe(true);
    });

    it('must return false for content without economic context', () => {
      expect(hasEconomicContext('The parliamentary vote was decisive')).toBe(false);
      expect(hasEconomicContext('')).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Helper function coverage — getSwedishIndicatorQueries / findRelevantIndicators
// / getEconomicHeading (additional branch coverage for utility functions)
// ---------------------------------------------------------------------------

describe('world-bank-context — utility function coverage', () => {
  it('WORLD_BANK_INDICATORS is a non-empty array (inventory loaded successfully)', () => {
    // Verifies that the happy-path load returns a real array (not a thrown error)
    expect(Array.isArray(WORLD_BANK_INDICATORS)).toBe(true);
  });

  it('getSwedishIndicatorQueries returns a non-empty array with countryCode and indicatorId', () => {
    const queries = getSwedishIndicatorQueries();
    expect(queries.length).toBeGreaterThan(0);
    for (const q of queries) {
      expect(q.countryCode).toBeDefined();
      expect(q.indicatorId).toBeDefined();
      expect(q.name).toBeDefined();
    }
  });

  it('findRelevantIndicators returns empty array for whitespace-only query', () => {
    expect(findRelevantIndicators('   ').length).toBe(0);
  });

  it('findRelevantIndicators matches by committee abbreviation (case-insensitive)', () => {
    // MJU is a known committee in the environment/energy domain
    const results = findRelevantIndicators('MJU');
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.committees.map((c) => c.toLowerCase())).toContain('mju');
    }
  });

  it('getEconomicHeading falls back to English when null is passed', () => {
    // null is not a valid Language but the function should not throw
    const heading = getEconomicHeading(null as unknown as string, 'economicContext');
    expect(typeof heading).toBe('string');
    expect(heading.length).toBeGreaterThan(0);
  });

  it('getEconomicHeading returns all 5 sections for every supported language', () => {
    const languages: Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
    const sections: Array<keyof typeof import('../scripts/world-bank-context.js').ECONOMIC_SECTION_HEADINGS['en']> =
      ['economicContext', 'nordicComparison', 'policyImplications', 'country', 'unit'];
    for (const lang of languages) {
      for (const section of sections) {
        const heading = getEconomicHeading(lang, section);
        expect(typeof heading).toBe('string');
        expect(heading.length).toBeGreaterThan(0);
      }
    }
  });
});
