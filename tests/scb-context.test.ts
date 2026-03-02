/**
 * Unit tests for SCB Context Provider (scripts/scb-context.ts)
 *
 * Tests the SCB context mapping utilities:
 * - SCB_INDICATOR_CONTEXTS validation (12 domains, committee mappings)
 * - SCB_SECTION_HEADINGS localization (14 languages)
 * - getSCBHeading() function
 * - findRelevantSCBIndicators() search
 * - getSCBTablesForCommittee() lookups
 * - hasSCBContext() detection
 * - getSCBQueryParams() output
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  SCB_INDICATOR_CONTEXTS,
  SCB_SECTION_HEADINGS,
  getSCBHeading,
  findRelevantSCBIndicators,
  getSCBTablesForCommittee,
  hasSCBContext,
  getSCBQueryParams,
} from '../scripts/scb-context.js';

// ---------------------------------------------------------------------------
// SCB_INDICATOR_CONTEXTS
// ---------------------------------------------------------------------------

describe('SCB_INDICATOR_CONTEXTS', () => {
  it('should have 15 domain contexts', () => {
    expect(SCB_INDICATOR_CONTEXTS).toHaveLength(15);
  });

  it('should have unique domain names', () => {
    const names = SCB_INDICATOR_CONTEXTS.map((c) => c.domain);
    expect(new Set(names).size).toBe(names.length);
  });

  it('should have non-empty name and description for each context', () => {
    SCB_INDICATOR_CONTEXTS.forEach((ctx) => {
      expect(ctx.name.length).toBeGreaterThan(0);
      expect(ctx.description.length).toBeGreaterThan(0);
    });
  });

  it('should have at least one committee for each context', () => {
    SCB_INDICATOR_CONTEXTS.forEach((ctx) => {
      expect(ctx.committees.length).toBeGreaterThan(0);
    });
  });

  it('should have at least one indicator for each context', () => {
    SCB_INDICATOR_CONTEXTS.forEach((ctx) => {
      expect(ctx.indicators.length).toBeGreaterThan(0);
    });
  });

  it('labour domain should map to AU committee', () => {
    const labour = SCB_INDICATOR_CONTEXTS.find((c) => c.domain === 'labour');
    expect(labour).toBeDefined();
    expect(labour!.committees).toContain('AU');
  });

  it('fiscal domain should map to FiU committee', () => {
    const fiscal = SCB_INDICATOR_CONTEXTS.find((c) => c.domain === 'fiscal');
    expect(fiscal).toBeDefined();
    expect(fiscal!.committees).toContain('FiU');
  });

  it('justice domain should map to JuU committee', () => {
    const justice = SCB_INDICATOR_CONTEXTS.find((c) => c.domain === 'justice');
    expect(justice).toBeDefined();
    expect(justice!.committees).toContain('JuU');
  });

  it('taxation domain should map to SkU committee', () => {
    const taxation = SCB_INDICATOR_CONTEXTS.find((c) => c.domain === 'taxation');
    expect(taxation).toBeDefined();
    expect(taxation!.committees).toContain('SkU');
  });

  it('culture domain should map to KrU committee', () => {
    const culture = SCB_INDICATOR_CONTEXTS.find((c) => c.domain === 'culture');
    expect(culture).toBeDefined();
    expect(culture!.committees).toContain('KrU');
  });

  it('governance domain should map to KU committee', () => {
    const governance = SCB_INDICATOR_CONTEXTS.find((c) => c.domain === 'governance');
    expect(governance).toBeDefined();
    expect(governance!.committees).toContain('KU');
  });
});

// ---------------------------------------------------------------------------
// SCB_SECTION_HEADINGS
// ---------------------------------------------------------------------------

describe('SCB_SECTION_HEADINGS', () => {
  const ALL_LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'] as const;

  it('should have headings for all 14 languages', () => {
    ALL_LANGUAGES.forEach((lang) => {
      expect(SCB_SECTION_HEADINGS[lang]).toBeDefined();
    });
  });

  it('should have all three section keys for each language', () => {
    ALL_LANGUAGES.forEach((lang) => {
      const headings = SCB_SECTION_HEADINGS[lang];
      expect(headings.statisticalContext.length).toBeGreaterThan(0);
      expect(headings.officialStatistics.length).toBeGreaterThan(0);
      expect(headings.dataSource.length).toBeGreaterThan(0);
    });
  });

  it('English headings should be in English', () => {
    expect(SCB_SECTION_HEADINGS.en.statisticalContext).toBe('Statistical Context');
    expect(SCB_SECTION_HEADINGS.en.officialStatistics).toBe('Official Statistics');
  });

  it('Swedish headings should be in Swedish', () => {
    expect(SCB_SECTION_HEADINGS.sv.statisticalContext).toBe('Statistisk kontext');
    expect(SCB_SECTION_HEADINGS.sv.officialStatistics).toBe('Officiell statistik');
  });

  it('all data source headings should reference SCB', () => {
    ALL_LANGUAGES.forEach((lang) => {
      expect(SCB_SECTION_HEADINGS[lang].dataSource).toContain('SCB');
    });
  });
});

// ---------------------------------------------------------------------------
// getSCBHeading
// ---------------------------------------------------------------------------

describe('getSCBHeading', () => {
  it('should return English heading for known section', () => {
    expect(getSCBHeading('en', 'statisticalContext')).toBe('Statistical Context');
  });

  it('should return Swedish heading', () => {
    expect(getSCBHeading('sv', 'officialStatistics')).toBe('Officiell statistik');
  });

  it('should fallback to English for unknown language', () => {
    expect(getSCBHeading('xx', 'statisticalContext')).toBe('Statistical Context');
  });

  it('should return data source heading', () => {
    expect(getSCBHeading('en', 'dataSource')).toContain('SCB');
  });
});

// ---------------------------------------------------------------------------
// findRelevantSCBIndicators
// ---------------------------------------------------------------------------

describe('findRelevantSCBIndicators', () => {
  it('should return empty array for empty query', () => {
    expect(findRelevantSCBIndicators('')).toEqual([]);
  });

  it('should return empty array for whitespace-only query', () => {
    expect(findRelevantSCBIndicators('   ')).toEqual([]);
  });

  it('should find labour domain by domain name', () => {
    const results = findRelevantSCBIndicators('labour');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].domain).toBe('labour');
  });

  it('should find by committee abbreviation (case-insensitive)', () => {
    const results = findRelevantSCBIndicators('au');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.committees.includes('AU'))).toBe(true);
  });

  it('should find by indicator name', () => {
    const results = findRelevantSCBIndicators('unemployment');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.indicators.includes('Unemployment rate'))).toBe(true);
  });

  it('should find fiscal domain by partial name', () => {
    const results = findRelevantSCBIndicators('fiscal');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].domain).toBe('fiscal');
  });

  it('should return empty for non-matching query', () => {
    expect(findRelevantSCBIndicators('zzzzzzz')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getSCBTablesForCommittee
// ---------------------------------------------------------------------------

describe('getSCBTablesForCommittee', () => {
  it('should find tables for FiU committee', () => {
    const tables = getSCBTablesForCommittee('FiU');
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach((t) => {
      expect(t.tables.length).toBeGreaterThan(0);
    });
  });

  it('should find tables for AU committee', () => {
    const tables = getSCBTablesForCommittee('AU');
    expect(tables.length).toBeGreaterThan(0);
  });

  it('should find tables for SkU (taxation) committee', () => {
    const tables = getSCBTablesForCommittee('SkU');
    expect(tables.length).toBeGreaterThan(0);
  });

  it('should find tables for KrU (cultural affairs) committee', () => {
    const tables = getSCBTablesForCommittee('KrU');
    expect(tables.length).toBeGreaterThan(0);
  });

  it('should be case-insensitive', () => {
    const upper = getSCBTablesForCommittee('FIU');
    const lower = getSCBTablesForCommittee('fiu');
    expect(upper.length).toBe(lower.length);
  });

  it('should return empty array for unknown committee', () => {
    expect(getSCBTablesForCommittee('ZZZ')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// hasSCBContext
// ---------------------------------------------------------------------------

describe('hasSCBContext', () => {
  it('should detect SCB acronym', () => {
    expect(hasSCBContext('According to SCB data, unemployment is 7.2%')).toBe(true);
  });

  it('should detect Statistiska centralbyrån', () => {
    expect(hasSCBContext('Enligt Statistiska centralbyrån har befolkningen ökat.')).toBe(true);
  });

  it('should detect Statistics Sweden', () => {
    expect(hasSCBContext('Data from Statistics Sweden shows...')).toBe(true);
  });

  it('should detect SCB table IDs', () => {
    expect(hasSCBContext('Source: TAB5765 labour force survey')).toBe(true);
  });

  it('should detect Swedish statistical terms', () => {
    expect(hasSCBContext('Arbetskraftsundersökningen visar att...')).toBe(true);
  });

  it('should detect officiell statistik', () => {
    expect(hasSCBContext('Enligt officiell statistik har exporten ökat.')).toBe(true);
  });

  it('should return false for unrelated content', () => {
    expect(hasSCBContext('The weather is nice today in Stockholm.')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(hasSCBContext('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getSCBQueryParams
// ---------------------------------------------------------------------------

describe('getSCBQueryParams', () => {
  it('should return only domains with table IDs', () => {
    const params = getSCBQueryParams();
    expect(params.length).toBeGreaterThan(0);
    params.forEach((p) => {
      expect(p.tableIds.length).toBeGreaterThan(0);
    });
  });

  it('should include domain and query for each result', () => {
    const params = getSCBQueryParams();
    params.forEach((p) => {
      expect(p.domain.length).toBeGreaterThan(0);
      expect(p.query.length).toBeGreaterThan(0);
    });
  });

  it('should include labour domain with TAB5765', () => {
    const params = getSCBQueryParams();
    const labour = params.find((p) => p.domain === 'labour');
    expect(labour).toBeDefined();
    expect(labour!.tableIds).toContain('TAB5765');
  });

  it('should not include domains without tables (defence, healthcare, transport, governance)', () => {
    const params = getSCBQueryParams();
    const domains = params.map((p) => p.domain);
    expect(domains).not.toContain('defence');
    expect(domains).not.toContain('healthcare');
    expect(domains).not.toContain('transport');
    expect(domains).not.toContain('governance');
  });
});
