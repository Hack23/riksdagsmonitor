/**
 * Unit tests for Statistical Claims Detector (scripts/statistical-claims-detector.ts)
 *
 * Tests the fact-checking infrastructure for political statistical claims:
 * - detectStatisticalClaims() — claim extraction from speeches
 * - assessClaim() — verdict determination based on deviation
 * - generateExplanation() — human-readable fact-check text
 * - getFactCheckHeading() — localized headings
 * - hasStatisticalClaims() — quick pre-filter
 * - FACT_CHECK_HEADINGS — 14-language localization
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  detectStatisticalClaims,
  assessClaim,
  generateExplanation,
  getFactCheckHeading,
  hasStatisticalClaims,
  FACT_CHECK_HEADINGS,
} from '../scripts/statistical-claims-detector.js';
import type {
  StatisticalClaim,
  ClaimVerdict,
} from '../scripts/statistical-claims-detector.js';

// ---------------------------------------------------------------------------
// detectStatisticalClaims
// ---------------------------------------------------------------------------

describe('detectStatisticalClaims', () => {
  it('should return empty array for empty text', () => {
    expect(detectStatisticalClaims('')).toEqual([]);
  });

  it('should return empty array for text without statistical claims', () => {
    expect(detectStatisticalClaims('Riksdagen debatterade om demokrati och transparens.')).toEqual([]);
  });

  it('should detect Swedish unemployment claim', () => {
    const text = 'Arbetslösheten ligger på 7.2 procent enligt senaste mätningen.';
    const claims = detectStatisticalClaims(text, 'Test Speaker', 'S');
    expect(claims.length).toBeGreaterThan(0);
    expect(claims[0].topic).toBe('unemployment');
    expect(claims[0].claimedValue).toBeCloseTo(7.2);
    expect(claims[0].speaker).toBe('Test Speaker');
    expect(claims[0].party).toBe('S');
  });

  it('should detect English unemployment claim', () => {
    const text = 'The unemployment rate is 6.5 percent.';
    const claims = detectStatisticalClaims(text);
    expect(claims.length).toBeGreaterThan(0);
    expect(claims[0].topic).toBe('unemployment');
    expect(claims[0].claimedValue).toBeCloseTo(6.5);
  });

  it('should detect Swedish GDP growth claim', () => {
    const text = 'BNP växer med 2.3 procent under det senaste kvartalet.';
    const claims = detectStatisticalClaims(text);
    expect(claims.length).toBeGreaterThan(0);
    expect(claims[0].topic).toBe('gdp');
    expect(claims[0].claimedValue).toBeCloseTo(2.3);
  });

  it('should detect English GDP growth claim', () => {
    const text = 'GDP growth expanded by 1.8 percent last year.';
    const claims = detectStatisticalClaims(text);
    expect(claims.length).toBeGreaterThan(0);
    expect(claims[0].topic).toBe('gdp');
    expect(claims[0].claimedValue).toBeCloseTo(1.8);
  });

  it('should detect inflation claim in Swedish', () => {
    const text = 'Inflationen är 3.5 procent, långt över Riksbankens mål.';
    const claims = detectStatisticalClaims(text);
    expect(claims.length).toBeGreaterThan(0);
    expect(claims[0].topic).toBe('inflation');
    expect(claims[0].claimedValue).toBeCloseTo(3.5);
  });

  it('should detect defence spending claim', () => {
    const text = 'Försvarsutgifterna ligger på 2.1 procent av BNP.';
    const claims = detectStatisticalClaims(text);
    expect(claims.length).toBeGreaterThan(0);
    expect(claims[0].topic).toBe('defence');
    expect(claims[0].claimedValue).toBeCloseTo(2.1);
  });

  it('should detect crime statistics claim', () => {
    const text = 'Brottsligheten har ökat med 15 procent sedan förra året.';
    const claims = detectStatisticalClaims(text);
    expect(claims.length).toBeGreaterThan(0);
    expect(claims[0].topic).toBe('crime');
    expect(claims[0].claimedValue).toBeCloseTo(15);
  });

  it('should detect housing claim', () => {
    const text = 'Bostadsbyggandet har minskat med 25 procent under det senaste året.';
    const claims = detectStatisticalClaims(text);
    expect(claims.length).toBeGreaterThan(0);
    expect(claims[0].topic).toBe('housing');
    expect(claims[0].claimedValue).toBeCloseTo(25);
  });

  it('should detect GDP share claim', () => {
    const text = 'Statsutgifterna uppgår till 49.5 procent av BNP.';
    const claims = detectStatisticalClaims(text);
    expect(claims.length).toBeGreaterThan(0);
    expect(claims[0].topic).toBe('gdp-share');
    expect(claims[0].claimedValue).toBeCloseTo(49.5);
  });

  it('should include verification source in detected claims', () => {
    const text = 'Arbetslösheten ligger på 7.2 procent.';
    const claims = detectStatisticalClaims(text);
    expect(claims[0].verificationSource).toBe('both');
    expect(claims[0].worldBankIndicator).toBe('SL.UEM.TOTL.ZS');
    expect(claims[0].scbTableId).toBe('TAB5765');
  });

  it('should detect unit from context', () => {
    const text = 'Arbetslösheten ligger på 7.2 procent.';
    const claims = detectStatisticalClaims(text);
    expect(claims[0].claimedUnit).toBe('percent');
  });

  it('should detect multiple claims in same text', () => {
    const text = 'Arbetslösheten ligger på 7.2 procent och BNP växer med 2.1 procent.';
    const claims = detectStatisticalClaims(text);
    expect(claims.length).toBeGreaterThanOrEqual(2);
    const topics = claims.map((c) => c.topic);
    expect(topics).toContain('unemployment');
    expect(topics).toContain('gdp');
  });

  it('should deduplicate identical claims', () => {
    const text = 'Arbetslösheten ligger på 7.2 procent. Jag upprepar: arbetslösheten ligger på 7.2 procent.';
    const claims = detectStatisticalClaims(text);
    // Should not have duplicates of the same exact match
    const uniqueKeys = new Set(claims.map((c) => `${c.topic}:${c.sourceText}`));
    expect(uniqueKeys.size).toBe(claims.length);
  });

  it('should handle comma as decimal separator', () => {
    const text = 'Arbetslösheten ligger på 7,2 procent.';
    const claims = detectStatisticalClaims(text);
    expect(claims.length).toBeGreaterThan(0);
    expect(claims[0].claimedValue).toBeCloseTo(7.2);
  });
});

// ---------------------------------------------------------------------------
// assessClaim
// ---------------------------------------------------------------------------

describe('assessClaim', () => {
  it('should rate exact match as accurate', () => {
    const result = assessClaim(7.2, 7.2);
    expect(result.verdict).toBe('accurate');
    expect(result.deviationPercent).toBeCloseTo(0);
  });

  it('should rate small deviation (< 5%) as accurate', () => {
    const result = assessClaim(7.0, 7.2);
    expect(result.verdict).toBe('accurate');
    expect(result.deviationPercent).toBeLessThanOrEqual(5);
  });

  it('should rate 5-15% deviation as mostly-accurate', () => {
    const result = assessClaim(8.0, 7.0);
    expect(result.verdict).toBe('mostly-accurate');
    expect(result.deviationPercent).toBeGreaterThan(5);
    expect(result.deviationPercent).toBeLessThanOrEqual(15);
  });

  it('should rate 15-30% deviation as misleading', () => {
    const result = assessClaim(9.0, 7.0);
    expect(result.verdict).toBe('misleading');
    expect(result.deviationPercent).toBeGreaterThan(15);
    expect(result.deviationPercent).toBeLessThanOrEqual(30);
  });

  it('should rate > 30% deviation as inaccurate', () => {
    const result = assessClaim(15.0, 7.0);
    expect(result.verdict).toBe('inaccurate');
    expect(result.deviationPercent).toBeGreaterThan(30);
  });

  it('should handle zero official value with matching claim', () => {
    const result = assessClaim(0, 0);
    expect(result.verdict).toBe('accurate');
    expect(result.deviationPercent).toBe(0);
  });

  it('should handle zero official value with non-zero claim', () => {
    const result = assessClaim(5, 0);
    expect(result.verdict).toBe('unverifiable');
  });

  it('should handle negative values correctly', () => {
    const result = assessClaim(-1.5, -1.5);
    expect(result.verdict).toBe('accurate');
  });
});

// ---------------------------------------------------------------------------
// generateExplanation
// ---------------------------------------------------------------------------

describe('generateExplanation', () => {
  const baseClaim: StatisticalClaim = {
    sourceText: 'Arbetslösheten ligger på 7.2 procent',
    topic: 'unemployment',
    claimedValue: 7.2,
    claimedUnit: 'percent',
    verificationSource: 'both',
    worldBankIndicator: 'SL.UEM.TOTL.ZS',
    scbTableId: 'TAB5765',
  };

  it('should generate English explanation for accurate claim', () => {
    const explanation = generateExplanation(baseClaim, 7.1, '2025Q3', 'accurate', 'en');
    expect(explanation).toContain('Accurate');
    expect(explanation).toContain('7.2');
    expect(explanation).toContain('7.1');
    expect(explanation).toContain('SCB / World Bank');
  });

  it('should generate Swedish explanation for accurate claim', () => {
    const explanation = generateExplanation(baseClaim, 7.1, '2025Q3', 'accurate', 'sv');
    expect(explanation).toContain('Korrekt');
    expect(explanation).toContain('7.2');
    expect(explanation).toContain('7.1');
  });

  it('should handle unverifiable verdict', () => {
    const explanation = generateExplanation(baseClaim, undefined, undefined, 'unverifiable', 'en');
    expect(explanation).toContain('could not be verified');
  });

  it('should handle Swedish unverifiable verdict', () => {
    const explanation = generateExplanation(baseClaim, undefined, undefined, 'unverifiable', 'sv');
    expect(explanation).toContain('kunde inte verifieras');
  });

  it('should include period when provided', () => {
    const explanation = generateExplanation(baseClaim, 7.1, '2025Q3', 'accurate', 'en');
    expect(explanation).toContain('2025Q3');
  });

  it('should handle scb-only verification source', () => {
    const scbClaim: StatisticalClaim = { ...baseClaim, verificationSource: 'scb' };
    const explanation = generateExplanation(scbClaim, 7.1, '2025Q3', 'accurate', 'en');
    expect(explanation).toContain('SCB (Statistics Sweden)');
  });

  it('should handle world-bank-only verification source', () => {
    const wbClaim: StatisticalClaim = { ...baseClaim, verificationSource: 'world-bank' };
    const explanation = generateExplanation(wbClaim, 7.1, '2025Q3', 'accurate', 'en');
    expect(explanation).toContain('World Bank');
  });

  it('should handle missing claimed value', () => {
    const noValueClaim: StatisticalClaim = { ...baseClaim, claimedValue: undefined };
    const explanation = generateExplanation(noValueClaim, 7.1, '2025Q3', 'accurate', 'en');
    expect(explanation).toContain('lacks a verifiable value');
  });
});

// ---------------------------------------------------------------------------
// getFactCheckHeading
// ---------------------------------------------------------------------------

describe('getFactCheckHeading', () => {
  it('should return English heading for known section', () => {
    expect(getFactCheckHeading('en', 'factCheck')).toBe('Fact Check');
  });

  it('should return Swedish heading', () => {
    expect(getFactCheckHeading('sv', 'factCheck')).toBe('Faktakoll');
  });

  it('should return Japanese heading', () => {
    expect(getFactCheckHeading('ja', 'factCheck')).toBe('ファクトチェック');
  });

  it('should return Korean heading', () => {
    expect(getFactCheckHeading('ko', 'factCheck')).toBe('팩트체크');
  });

  it('should fallback to English for unknown language', () => {
    expect(getFactCheckHeading('xx', 'factCheck')).toBe('Fact Check');
  });

  it('should return verdict heading', () => {
    expect(getFactCheckHeading('en', 'verdict')).toBe('Verdict');
    expect(getFactCheckHeading('sv', 'verdict')).toBe('Bedömning');
  });

  it('should return claim vs reality heading', () => {
    expect(getFactCheckHeading('en', 'claimVsReality')).toBe('Claim vs. Reality');
    expect(getFactCheckHeading('sv', 'claimVsReality')).toBe('Påstående kontra verklighet');
  });
});

// ---------------------------------------------------------------------------
// hasStatisticalClaims
// ---------------------------------------------------------------------------

describe('hasStatisticalClaims', () => {
  it('should detect percentage claims', () => {
    expect(hasStatisticalClaims('Unemployment is at 7.2 percent.')).toBe(true);
  });

  it('should detect Swedish percentage claims', () => {
    expect(hasStatisticalClaims('Det ökade med 15 procent.')).toBe(true);
  });

  it('should detect Swedish verb patterns with numbers', () => {
    expect(hasStatisticalClaims('Exporten ökade med 3 miljarder.')).toBe(true);
  });

  it('should detect BNP reference', () => {
    expect(hasStatisticalClaims('BNP har vuxit kraftigt under kvartalet.')).toBe(true);
  });

  it('should detect GDP reference', () => {
    expect(hasStatisticalClaims('GDP grew by 2.3% last quarter.')).toBe(true);
  });

  it('should detect unemployment keyword', () => {
    expect(hasStatisticalClaims('Discussions about unemployment rates in Sweden.')).toBe(true);
  });

  it('should detect arbetslöshet', () => {
    expect(hasStatisticalClaims('Debatten om arbetslöshet fortsätter.')).toBe(true);
  });

  it('should detect inflation', () => {
    expect(hasStatisticalClaims('Inflation remains a concern for households.')).toBe(true);
  });

  it('should detect crime keyword', () => {
    expect(hasStatisticalClaims('Debatten handlade om brott och straff.')).toBe(true);
  });

  it('should detect immigration', () => {
    expect(hasStatisticalClaims('Immigration policy was debated at length.')).toBe(true);
  });

  it('should detect military spending', () => {
    expect(hasStatisticalClaims('The military spending debate focused on NATO targets.')).toBe(true);
  });

  it('should return false for unrelated content', () => {
    expect(hasStatisticalClaims('Riksdagen debatterade om demokrati.')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(hasStatisticalClaims('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// FACT_CHECK_HEADINGS
// ---------------------------------------------------------------------------

describe('FACT_CHECK_HEADINGS', () => {
  const ALL_LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'] as const;

  it('should have headings for all 14 languages', () => {
    ALL_LANGUAGES.forEach((lang) => {
      expect(FACT_CHECK_HEADINGS[lang]).toBeDefined();
    });
  });

  it('should have all four section keys for each language', () => {
    ALL_LANGUAGES.forEach((lang) => {
      const headings = FACT_CHECK_HEADINGS[lang];
      expect(headings.factCheck.length).toBeGreaterThan(0);
      expect(headings.claimVsReality.length).toBeGreaterThan(0);
      expect(headings.verdict.length).toBeGreaterThan(0);
      expect(headings.dataSource.length).toBeGreaterThan(0);
    });
  });

  it('should have unique headings per language (no duplicates across sections)', () => {
    ALL_LANGUAGES.forEach((lang) => {
      const headings = FACT_CHECK_HEADINGS[lang];
      const values = [headings.factCheck, headings.claimVsReality, headings.verdict, headings.dataSource];
      expect(new Set(values).size).toBe(values.length);
    });
  });
});
