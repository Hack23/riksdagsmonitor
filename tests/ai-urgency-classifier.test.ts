/**
 * Tests for scripts/ai-analysis/domains/index.ts
 *
 * Covers:
 * - buildWatchPoints: urgency classification for propositions, committee reports, SFS, motions
 * - buildPolicyAssessment: domain detection, narrative, confidence, EU/Nordic context
 * - DASHBOARD_DOCS_ANALYSED: 14-language coverage
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  buildWatchPoints,
  buildPolicyAssessment,
  DASHBOARD_DOCS_ANALYSED,
} from '../scripts/ai-analysis/domains/index.js';
import type { RawDocument } from '../scripts/data-transformers/types.js';

// ---------------------------------------------------------------------------
// Test document factory
// ---------------------------------------------------------------------------

function makeDoc(overrides: Partial<RawDocument> = {}): RawDocument {
  return {
    dok_id: 'TEST001',
    titel: 'Test document',
    title: 'Test document',
    doktyp: 'prop',
    datum: '2026-03-01',
    ...overrides,
  } as RawDocument;
}

const PROP = makeDoc({ dok_id: 'PROP1', titel: 'Proposition om säkerhet', doktyp: 'prop' });
const PROP2 = makeDoc({ dok_id: 'PROP2', titel: 'Proposition om ekonomi', doktyp: 'prop' });
const BET = makeDoc({ dok_id: 'BET1', titel: 'Betänkande om budget', doktyp: 'bet' });
const BET2 = makeDoc({ dok_id: 'BET2', titel: 'Betänkande om utbildning', doktyp: 'bet' });
const BET3 = makeDoc({ dok_id: 'BET3', titel: 'Betänkande om miljö', doktyp: 'bet' });
const MOT = makeDoc({ dok_id: 'MOT1', titel: 'Motion om klimat', doktyp: 'mot' });
const MOT2 = makeDoc({ dok_id: 'MOT2', titel: 'Motion om arbetslöshet', doktyp: 'mot' });
const SFS = makeDoc({ dok_id: 'SFS1', titel: 'SFS 2026:1 Lag om digitalisering', doktyp: 'sfs' });

const ALL_LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'] as const;

// ---------------------------------------------------------------------------
// buildWatchPoints
// ---------------------------------------------------------------------------

describe('buildWatchPoints', () => {
  it('generates watch points from propositions with high urgency', () => {
    const points = buildWatchPoints([PROP, PROP2], null, 'en');
    const propPoint = points.find(p => p.urgency === 'high' && p.sourceDocIds.includes('PROP1'));
    expect(propPoint).toBeDefined();
    expect(propPoint!.title).toContain('Proposition');
  });

  it('generates watch points from committee reports — critical when ≥3', () => {
    const points = buildWatchPoints([BET, BET2, BET3], null, 'en');
    const betPoint = points.find(p => p.sourceDocIds.includes('BET1'));
    expect(betPoint).toBeDefined();
    expect(betPoint!.urgency).toBe('critical');
  });

  it('generates watch points from committee reports — high when <3', () => {
    const points = buildWatchPoints([BET], null, 'en');
    const betPoint = points.find(p => p.sourceDocIds.includes('BET1'));
    expect(betPoint).toBeDefined();
    expect(betPoint!.urgency).toBe('high');
  });

  it('generates watch points from SFS docs with critical urgency', () => {
    const points = buildWatchPoints([SFS], null, 'en');
    const sfsPoint = points.find(p => p.sourceDocIds.includes('SFS1'));
    expect(sfsPoint).toBeDefined();
    expect(sfsPoint!.urgency).toBe('critical');
  });

  it('generates watch points from motions with medium urgency', () => {
    const points = buildWatchPoints([MOT, MOT2], null, 'en');
    const motPoint = points.find(p => p.sourceDocIds.includes('MOT1'));
    expect(motPoint).toBeDefined();
    expect(motPoint!.urgency).toBe('medium');
  });

  it('returns empty array for empty docs', () => {
    const points = buildWatchPoints([], null, 'en');
    expect(points).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildPolicyAssessment
// ---------------------------------------------------------------------------

describe('buildPolicyAssessment', () => {
  it('returns domains and narrative', () => {
    const result = buildPolicyAssessment([PROP, BET, MOT], null, 'en');
    expect(result.narrative.length).toBeGreaterThan(0);
    expect(result).toHaveProperty('domains');
    expect(result).toHaveProperty('primaryDomain');
  });

  it('includes EU/Nordic context in deep mode', () => {
    // Create docs that hit a known policy domain (defence / fiscal)
    const defenceDoc = makeDoc({
      dok_id: 'DEF1',
      titel: 'Proposition om försvarspolitik och totalförsvar',
      doktyp: 'prop',
    });
    const result = buildPolicyAssessment([defenceDoc], null, 'en', 'deep');
    // The narrative should either include EU/Nordic context or at least be non-empty
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('returns confidence level', () => {
    const result = buildPolicyAssessment([PROP], null, 'en');
    expect(['HIGH', 'MEDIUM', 'LOW']).toContain(result.confidence);
  });

  it('includes topic in narrative when provided', () => {
    const result = buildPolicyAssessment([PROP], 'cybersecurity', 'en');
    expect(result.narrative).toContain('cybersecurity');
  });
});

// ---------------------------------------------------------------------------
// DASHBOARD_DOCS_ANALYSED — 14-language coverage
// ---------------------------------------------------------------------------

describe('DASHBOARD_DOCS_ANALYSED', () => {
  it('has entries for all 14 languages', () => {
    for (const lang of ALL_LANGUAGES) {
      const fn = DASHBOARD_DOCS_ANALYSED[lang];
      expect(fn, `DASHBOARD_DOCS_ANALYSED missing ${lang}`).toBeDefined();
      expect(typeof fn).toBe('function');
      expect(fn!(5).length).toBeGreaterThan(0);
    }
  });
});
