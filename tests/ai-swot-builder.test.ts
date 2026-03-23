/**
 * Tests for scripts/ai-analysis/swot/index.ts
 *
 * Covers:
 * - buildStakeholderSwot: three-stakeholder SWOT matrix construction
 * - buildEnrichedEntry: passage extraction, impact rating, sourceDocIds
 * - placeholderEntry: structural placeholder generation
 * - calculateConfidenceScore: evidence depth + SWOT quality scoring
 * - refineStakeholderSwot: full-text refinement
 * - impactFromDocType: document type → impact mapping
 * - GOV_NAMES, OPP_NAMES, PRIVATE_NAMES: 14-language coverage
 * - Multi-language verification (en, sv, ja)
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  buildStakeholderSwot,
  buildEnrichedEntry,
  placeholderEntry,
  calculateConfidenceScore,
  refineStakeholderSwot,
  impactFromDocType,
  GOV_NAMES,
  OPP_NAMES,
  PRIVATE_NAMES,
} from '../scripts/ai-analysis/swot/index.js';
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
const MOT = makeDoc({ dok_id: 'MOT1', titel: 'Motion om klimat', doktyp: 'mot' });
const MOT2 = makeDoc({ dok_id: 'MOT2', titel: 'Motion om arbetslöshet', doktyp: 'mot' });
const SFS = makeDoc({ dok_id: 'SFS1', titel: 'SFS 2026:1 Lag om digitalisering', doktyp: 'sfs' });
const FPM = makeDoc({ dok_id: 'FPM1', titel: 'EU-position om handel', doktyp: 'fpm' });
const SKR = makeDoc({ dok_id: 'SKR1', titel: 'Skrivelse om resultat', doktyp: 'skr' });
const PRESSM = makeDoc({ dok_id: 'PR1', titel: 'Pressmeddelande om reform', doktyp: 'pressm' });
const EXT = makeDoc({ dok_id: 'EXT1', titel: 'External reference on Nordic cooperation', doktyp: 'ext' });
const IP = makeDoc({ dok_id: 'IP1', titel: 'Interpellation om sjukvård', doktyp: 'ip' });

const ALL_DOCS = [PROP, PROP2, BET, BET2, MOT, MOT2, SFS, FPM, SKR, PRESSM, EXT, IP];
const ALL_LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'] as const;

// ---------------------------------------------------------------------------
// buildStakeholderSwot
// ---------------------------------------------------------------------------

describe('buildStakeholderSwot', () => {
  it('returns exactly 3 stakeholders (government, parliament, private-sector)', () => {
    const result = buildStakeholderSwot(ALL_DOCS, null, 'en', []);
    expect(result).toHaveLength(3);
    expect(result.map(s => s.role)).toEqual(['government', 'parliament', 'private-sector']);
  });

  it('classifies propositions as government strengths', () => {
    const result = buildStakeholderSwot([PROP], null, 'en', []);
    const gov = result.find(s => s.role === 'government')!;
    expect(gov.swot.strengths.length).toBeGreaterThanOrEqual(1);
    expect(gov.swot.strengths[0]!.sourceDocIds).toContain('PROP1');
  });

  it('classifies committee reports as parliament strengths', () => {
    const result = buildStakeholderSwot([BET], null, 'en', []);
    const opp = result.find(s => s.role === 'parliament')!;
    expect(opp.swot.strengths.length).toBeGreaterThanOrEqual(1);
    expect(opp.swot.strengths[0]!.sourceDocIds).toContain('BET1');
  });

  it('uses placeholders when no documents match a quadrant', () => {
    const result = buildStakeholderSwot([], null, 'en', []);
    for (const sh of result) {
      for (const quadrant of ['strengths', 'weaknesses', 'opportunities', 'threats'] as const) {
        expect(sh.swot[quadrant].length).toBeGreaterThanOrEqual(1);
        expect(sh.swot[quadrant][0]!.sourceDocIds).toEqual([]);
        expect(sh.swot[quadrant][0]!.confidence).toBe('LOW');
      }
    }
  });

  it('returns localised names for sv', () => {
    const result = buildStakeholderSwot([PROP], null, 'sv', []);
    const gov = result.find(s => s.role === 'government')!;
    expect(gov.name).toBe(GOV_NAMES.sv);
  });

  it('returns localised names for ja', () => {
    const result = buildStakeholderSwot([PROP], null, 'ja', []);
    const gov = result.find(s => s.role === 'government')!;
    expect(gov.name).toBe(GOV_NAMES.ja);
  });
});

// ---------------------------------------------------------------------------
// buildEnrichedEntry
// ---------------------------------------------------------------------------

describe('buildEnrichedEntry', () => {
  it('returns entry with sourceDocIds', () => {
    const entry = buildEnrichedEntry(PROP, null, 'en', 200);
    expect(entry.sourceDocIds).toContain('PROP1');
    expect(entry.text.length).toBeGreaterThan(0);
  });

  it('assigns impact rating based on doc type — high for prop', () => {
    const entry = buildEnrichedEntry(PROP, null, 'en', 200);
    expect(entry.impact).toBe('high');
  });

  it('assigns impact rating — medium for mot', () => {
    const entry = buildEnrichedEntry(MOT, null, 'en', 200);
    expect(entry.impact).toBe('medium');
  });

  it('includes topic in text when provided', () => {
    const entry = buildEnrichedEntry(PROP, 'climate', 'en', 200);
    expect(entry.text).toContain('climate');
  });
});

// ---------------------------------------------------------------------------
// placeholderEntry
// ---------------------------------------------------------------------------

describe('placeholderEntry', () => {
  it('returns entry with empty sourceDocIds and LOW confidence', () => {
    const entry = placeholderEntry('government', 'strengths', null, 'en', []);
    expect(entry.sourceDocIds).toEqual([]);
    expect(entry.confidence).toBe('LOW');
    expect(entry.text.length).toBeGreaterThan(0);
  });

  it('assigns medium impact for strengths/opportunities quadrants', () => {
    expect(placeholderEntry('government', 'strengths', null, 'en', []).impact).toBe('medium');
    expect(placeholderEntry('government', 'opportunities', null, 'en', []).impact).toBe('medium');
  });

  it('assigns low impact for weaknesses/threats quadrants', () => {
    expect(placeholderEntry('government', 'weaknesses', null, 'en', []).impact).toBe('low');
    expect(placeholderEntry('government', 'threats', null, 'en', []).impact).toBe('low');
  });
});

// ---------------------------------------------------------------------------
// calculateConfidenceScore
// ---------------------------------------------------------------------------

describe('calculateConfidenceScore', () => {
  it('returns 0 for empty docs array', () => {
    expect(calculateConfidenceScore([])).toBe(0);
  });

  it('increases with more enriched docs', () => {
    const basic = calculateConfidenceScore([PROP]);
    const enriched = calculateConfidenceScore([
      makeDoc({ dok_id: 'E1', doktyp: 'prop', contentFetched: true, organ: 'MJU' }),
      makeDoc({ dok_id: 'E2', doktyp: 'bet', contentFetched: true, organ: 'FiU' }),
      makeDoc({ dok_id: 'E3', doktyp: 'mot', contentFetched: true, organ: 'UbU' }),
    ]);
    expect(enriched).toBeGreaterThan(basic);
  });

  it('uses midpoint default (15) for undefined stakeholderSwot', () => {
    const withUndef = calculateConfidenceScore([PROP], undefined);
    const withEmpty = calculateConfidenceScore([PROP], []);
    expect(withUndef).toBeGreaterThan(withEmpty);
  });
});

// ---------------------------------------------------------------------------
// refineStakeholderSwot
// ---------------------------------------------------------------------------

describe('refineStakeholderSwot', () => {
  it('returns refined entries from full-text docs', () => {
    const initial = buildStakeholderSwot([PROP], null, 'en', []);
    const fullTextProp = makeDoc({
      dok_id: 'FT1',
      titel: 'Full-text proposition on defense',
      doktyp: 'prop',
      contentFetched: true,
      fullText: 'The government proposes strengthening Sweden\'s defense capabilities.',
    });
    const refined = refineStakeholderSwot(initial, [fullTextProp], null, 'en');
    expect(refined).toHaveLength(3);
    const gov = refined.find(s => s.role === 'government')!;
    expect(gov.swot.strengths.length).toBeGreaterThanOrEqual(1);
    expect(gov.swot.strengths[0]!.sourceDocIds).toContain('FT1');
  });
});

// ---------------------------------------------------------------------------
// impactFromDocType
// ---------------------------------------------------------------------------

describe('impactFromDocType', () => {
  it('returns high for prop and sfs', () => {
    expect(impactFromDocType('prop')).toBe('high');
    expect(impactFromDocType('sfs')).toBe('high');
  });

  it('returns medium for mot and ip', () => {
    expect(impactFromDocType('mot')).toBe('medium');
    expect(impactFromDocType('ip')).toBe('medium');
  });

  it('returns low for unknown types', () => {
    expect(impactFromDocType('unknown')).toBe('low');
  });
});

// ---------------------------------------------------------------------------
// Localised name records — 14-language coverage
// ---------------------------------------------------------------------------

describe('localised name records', () => {
  it('GOV_NAMES has entries for all 14 languages', () => {
    for (const lang of ALL_LANGUAGES) {
      expect(GOV_NAMES[lang], `GOV_NAMES missing ${lang}`).toBeDefined();
    }
  });

  it('OPP_NAMES has entries for all 14 languages', () => {
    for (const lang of ALL_LANGUAGES) {
      expect(OPP_NAMES[lang], `OPP_NAMES missing ${lang}`).toBeDefined();
    }
  });

  it('PRIVATE_NAMES has entries for all 14 languages', () => {
    for (const lang of ALL_LANGUAGES) {
      expect(PRIVATE_NAMES[lang], `PRIVATE_NAMES missing ${lang}`).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Multi-language integration
// ---------------------------------------------------------------------------

describe('multi-language SWOT', () => {
  for (const lang of ['en', 'sv', 'ja'] as const) {
    it(`produces valid SWOT for lang=${lang}`, () => {
      const result = buildStakeholderSwot([PROP, BET, MOT], null, lang, []);
      expect(result).toHaveLength(3);
      for (const sh of result) {
        expect(sh.name.length).toBeGreaterThan(0);
        expect(sh.swot.strengths.length).toBeGreaterThanOrEqual(1);
      }
    });
  }
});
