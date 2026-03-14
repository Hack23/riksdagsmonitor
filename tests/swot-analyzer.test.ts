/**
 * Tests for buildMultiStakeholderSwot and STAKEHOLDER_NAMES in swot-analyzer.ts
 *
 * Validates:
 * - Minimum 4 stakeholder perspectives are generated (the four core categories)
 * - All 9 stakeholder categories produce valid SWOT data
 * - Evidence references (dok_ids) are linked to source documents
 * - Dynamic stakeholder selection based on document type mix
 * - All 14 languages produce localised stakeholder names
 * - Each SWOT quadrant has at least one entry
 * - Impact levels are set on entries
 * - Confidence levels are assigned based on evidence count
 */

import { describe, it, expect } from 'vitest';
import {
  buildMultiStakeholderSwot,
  STAKEHOLDER_NAMES,
} from '../scripts/generate-news-enhanced/swot-analyzer.js';
import type { RawDocument } from '../scripts/data-transformers/types.js';
import type { Language } from '../scripts/types/language.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deterministic counter for test document IDs */
let docCounter = 0;

function makeDoc(overrides: Partial<RawDocument> = {}): RawDocument {
  return {
    dok_id: `doc-test-${++docCounter}`,
    titel: 'Test dokument titel',
    ...overrides,
  } as RawDocument;
}

/** Typical deep-inspection document mix: props + bets + mots + sfs */
function makeTypicalDocs(): RawDocument[] {
  return [
    makeDoc({ dok_id: 'prop-1', doktyp: 'prop', titel: 'Proposition om hälso- och sjukvård' }),
    makeDoc({ dok_id: 'prop-2', doktyp: 'prop', titel: 'Statens budget för 2025' }),
    makeDoc({ dok_id: 'bet-1',  doktyp: 'bet',  titel: 'Betänkande om skattepolitik' }),
    makeDoc({ dok_id: 'bet-2',  doktyp: 'bet',  titel: 'Betänkande om migrationspolitik' }),
    makeDoc({ dok_id: 'mot-1',  doktyp: 'mot',  titel: 'Motion om miljöpolitik' }),
    makeDoc({ dok_id: 'mot-2',  doktyp: 'mot',  titel: 'Motion om arbetsmarknadspolitik' }),
    makeDoc({ dok_id: 'sfs-1',  doktyp: 'sfs',  titel: 'SFS 2024:123 Socialförsäkringsbalk' }),
  ];
}

/** EU-heavy doc mix triggers international stakeholder */
function makeEuDocs(): RawDocument[] {
  return [
    ...makeTypicalDocs(),
    makeDoc({ dok_id: 'fpm-1', doktyp: 'fpm', titel: 'EU-faktapromemoria om digital marknad' }),
    makeDoc({ dok_id: 'fpm-2', doktyp: 'fpm', titel: 'EU-faktapromemoria om klimatpolitik' }),
  ];
}

/** Press release mix triggers media stakeholder */
function makeMediaDocs(): RawDocument[] {
  return [
    ...makeTypicalDocs(),
    makeDoc({ dok_id: 'pressm-1', doktyp: 'pressm', titel: 'Pressmeddelande om ny regeringspolitik' }),
  ];
}

/** Labour-domain mix triggers labour stakeholder */
function makeLaborDocs(): RawDocument[] {
  return [
    makeDoc({ dok_id: 'prop-1', doktyp: 'prop', titel: 'Proposition om arbetsmarknadsreform' }),
    makeDoc({ dok_id: 'mot-1',  doktyp: 'mot',  titel: 'Motion om facklig rätt' }),
  ];
}

const ALL_LANGUAGES: Language[] = [
  'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildMultiStakeholderSwot', () => {
  it('returns an empty array when no documents are provided', () => {
    const result = buildMultiStakeholderSwot([], 'en');
    expect(result).toHaveLength(0);
  });

  it('always returns at least 4 stakeholders (the four core perspectives)', () => {
    const result = buildMultiStakeholderSwot(makeTypicalDocs(), 'en');
    expect(result.length).toBeGreaterThanOrEqual(4);
  });

  it('returns at least 5 distinct stakeholders for a typical document mix', () => {
    const result = buildMultiStakeholderSwot(makeTypicalDocs(), 'en');
    expect(result.length).toBeGreaterThanOrEqual(5);
  });

  it('always includes the four core category perspectives', () => {
    const result = buildMultiStakeholderSwot(makeTypicalDocs(), 'en');
    const cats = result.map(s => s.category);
    expect(cats).toContain('government');
    expect(cats).toContain('opposition');
    expect(cats).toContain('private');
    expect(cats).toContain('civil-society');
  });

  it('adds municipal stakeholder when there are prop/sfs documents', () => {
    const result = buildMultiStakeholderSwot(makeTypicalDocs(), 'en');
    const cats = result.map(s => s.category);
    expect(cats).toContain('municipal');
  });

  it('does NOT add municipal stakeholder for skr-only documents (government communications)', () => {
    const docs = [
      makeDoc({ dok_id: 'skr-1', doktyp: 'skr', titel: 'Skrivelse om statlig verksamhet' }),
      makeDoc({ dok_id: 'mot-1', doktyp: 'mot', titel: 'Motion om skogsvård' }),
    ];
    const result = buildMultiStakeholderSwot(docs, 'en');
    const cats = result.map(s => s.category);
    expect(cats).not.toContain('municipal');
  });

  it('adds municipal stakeholder for SFS docs identified by dokumentnamn (missing doktyp)', () => {
    const docs = [
      makeDoc({ dok_id: 'sfs-x', dokumentnamn: 'SFS 2024:456', titel: 'Lag om kommunal verksamhet' }),
      makeDoc({ dok_id: 'mot-1', doktyp: 'mot', titel: 'Motion om skogsvård' }),
    ];
    const result = buildMultiStakeholderSwot(docs, 'en');
    const cats = result.map(s => s.category);
    expect(cats).toContain('municipal');
  });

  it('adds international stakeholder when EU position papers (fpm) are present', () => {
    const result = buildMultiStakeholderSwot(makeEuDocs(), 'en');
    const cats = result.map(s => s.category);
    expect(cats).toContain('international');
  });

  it('does NOT add international stakeholder when there are no EU documents', () => {
    const docs = [
      makeDoc({ dok_id: 'mot-1', doktyp: 'mot', titel: 'Lokal motion' }),
      makeDoc({ dok_id: 'bet-1', doktyp: 'bet', titel: 'Lokalt betänkande' }),
    ];
    const result = buildMultiStakeholderSwot(docs, 'en');
    const cats = result.map(s => s.category);
    expect(cats).not.toContain('international');
  });

  it('adds media stakeholder when press releases (pressm) are present', () => {
    const result = buildMultiStakeholderSwot(makeMediaDocs(), 'en');
    const cats = result.map(s => s.category);
    expect(cats).toContain('media');
  });

  it('adds labor stakeholder when labour-domain content is detected', () => {
    const result = buildMultiStakeholderSwot(makeLaborDocs(), 'en');
    const cats = result.map(s => s.category);
    expect(cats).toContain('labor');
  });

  it('every stakeholder has all four SWOT quadrants populated', () => {
    const result = buildMultiStakeholderSwot(makeTypicalDocs(), 'en');
    for (const stakeholder of result) {
      expect(stakeholder.swot.strengths.length).toBeGreaterThan(0);
      expect(stakeholder.swot.weaknesses.length).toBeGreaterThan(0);
      expect(stakeholder.swot.opportunities.length).toBeGreaterThan(0);
      expect(stakeholder.swot.threats.length).toBeGreaterThan(0);
    }
  });

  it('every SWOT entry has a non-empty text property', () => {
    const result = buildMultiStakeholderSwot(makeTypicalDocs(), 'en');
    for (const stakeholder of result) {
      const allEntries = [
        ...stakeholder.swot.strengths,
        ...stakeholder.swot.weaknesses,
        ...stakeholder.swot.opportunities,
        ...stakeholder.swot.threats,
      ];
      for (const entry of allEntries) {
        expect(entry.text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('every SWOT entry has an impact level set', () => {
    const result = buildMultiStakeholderSwot(makeTypicalDocs(), 'en');
    for (const stakeholder of result) {
      const allEntries = [
        ...stakeholder.swot.strengths,
        ...stakeholder.swot.weaknesses,
        ...stakeholder.swot.opportunities,
        ...stakeholder.swot.threats,
      ];
      for (const entry of allEntries) {
        expect(['high', 'medium', 'low']).toContain(entry.impact);
      }
    }
  });

  it('every stakeholder has a category field', () => {
    const result = buildMultiStakeholderSwot(makeTypicalDocs(), 'en');
    for (const stakeholder of result) {
      expect(stakeholder.category).toBeTruthy();
    }
  });

  it('every stakeholder has a role field', () => {
    const result = buildMultiStakeholderSwot(makeTypicalDocs(), 'en');
    for (const stakeholder of result) {
      expect(stakeholder.role).toBeTruthy();
    }
  });

  it('role strings are localised for non-English languages', () => {
    const enResult = buildMultiStakeholderSwot(makeTypicalDocs(), 'en');
    const svResult = buildMultiStakeholderSwot(makeTypicalDocs(), 'sv');

    const enGov = enResult.find(s => s.category === 'government');
    const svGov = svResult.find(s => s.category === 'government');

    // Swedish role should differ from English role
    expect(svGov!.role).not.toBe(enGov!.role);
    // Swedish role should contain Swedish text
    expect(svGov!.role).toContain('Tidöavtalet');
  });

  it('every stakeholder has a confidenceLevel field', () => {
    const result = buildMultiStakeholderSwot(makeTypicalDocs(), 'en');
    for (const stakeholder of result) {
      expect(['high', 'medium', 'low']).toContain(stakeholder.confidenceLevel);
    }
  });

  it('evidence refs link SWOT entries back to source document dok_ids', () => {
    const docs = makeTypicalDocs();
    const dokIds = docs.map(d => d.dok_id).filter(Boolean) as string[];
    const result = buildMultiStakeholderSwot(docs, 'en');

    // At least one stakeholder (government) should have evidence refs
    const govStakeholder = result.find(s => s.category === 'government');
    expect(govStakeholder?.evidenceRefs).toBeTruthy();
    expect(govStakeholder!.evidenceRefs!.length).toBeGreaterThan(0);

    // All evidence refs should come from the source docs
    for (const stakeholder of result) {
      if (stakeholder.evidenceRefs) {
        for (const ref of stakeholder.evidenceRefs) {
          expect(dokIds).toContain(ref);
        }
      }
    }
  });

  it('government SWOT strength entries use actual document titles as text', () => {
    const docs = [
      makeDoc({ dok_id: 'prop-X', doktyp: 'prop', titel: 'Unik propositionstitel för test' }),
    ];
    const result = buildMultiStakeholderSwot(docs, 'en');
    const gov = result.find(s => s.category === 'government');
    const titles = gov!.swot.strengths.map(e => e.text);
    expect(titles.some(t => t.includes('Unik propositionstitel'))).toBe(true);
  });

  it('opposition SWOT strength entries use actual committee report titles', () => {
    const docs = [
      makeDoc({ dok_id: 'bet-X', doktyp: 'bet', titel: 'Unikt betänkande för test' }),
    ];
    const result = buildMultiStakeholderSwot(docs, 'en');
    const opp = result.find(s => s.category === 'opposition');
    const titles = opp!.swot.strengths.map(e => e.text);
    expect(titles.some(t => t.includes('Unikt betänkande'))).toBe(true);
  });

  it('returns localised stakeholder names for Swedish', () => {
    const result = buildMultiStakeholderSwot(makeTypicalDocs(), 'sv');
    const names = result.map(s => s.name);
    expect(names).toContain('Regeringskoalitionen');
    expect(names).toContain('Oppositionspartierna');
  });

  it('returns localised stakeholder names for German', () => {
    const result = buildMultiStakeholderSwot(makeTypicalDocs(), 'de');
    const names = result.map(s => s.name);
    expect(names).toContain('Regierungskoalition');
  });

  it('returns stakeholder names for all 14 supported languages', () => {
    for (const lang of ALL_LANGUAGES) {
      const result = buildMultiStakeholderSwot(makeTypicalDocs(), lang);
      expect(result.length).toBeGreaterThanOrEqual(4);
      for (const stakeholder of result) {
        expect(stakeholder.name.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('SWOT entries are non-empty strings for all 14 languages', () => {
    for (const lang of ALL_LANGUAGES) {
      const result = buildMultiStakeholderSwot(makeTypicalDocs(), lang);
      for (const stakeholder of result) {
        const allEntries = [
          ...stakeholder.swot.strengths,
          ...stakeholder.swot.weaknesses,
          ...stakeholder.swot.opportunities,
          ...stakeholder.swot.threats,
        ];
        for (const entry of allEntries) {
          expect(entry.text.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('government stakeholder has high-impact strengths for propositions', () => {
    const docs = [
      makeDoc({ dok_id: 'prop-1', doktyp: 'prop', titel: 'Viktig proposition' }),
    ];
    const result = buildMultiStakeholderSwot(docs, 'en');
    const gov = result.find(s => s.category === 'government');
    const highImpactStrengths = gov!.swot.strengths.filter(e => e.impact === 'high');
    expect(highImpactStrengths.length).toBeGreaterThan(0);
  });

  it('stakeholders are returned in a consistent order (government first)', () => {
    const result = buildMultiStakeholderSwot(makeTypicalDocs(), 'en');
    expect(result[0].category).toBe('government');
    expect(result[1].category).toBe('opposition');
  });

  it('stakeholders with no supporting docs still receive fallback SWOT entries', () => {
    // Provide only mot documents (no prop/bet/sfs) to test fallbacks
    const docs = [
      makeDoc({ dok_id: 'mot-1', doktyp: 'mot', titel: 'Motion om djurskydd' }),
    ];
    const result = buildMultiStakeholderSwot(docs, 'en');
    for (const stakeholder of result) {
      expect(stakeholder.swot.strengths.length).toBeGreaterThan(0);
      expect(stakeholder.swot.weaknesses.length).toBeGreaterThan(0);
      expect(stakeholder.swot.opportunities.length).toBeGreaterThan(0);
      expect(stakeholder.swot.threats.length).toBeGreaterThan(0);
    }
  });

  it('fallback strings are NOT generic template placeholders (%t)', () => {
    const docs = [makeDoc({ dok_id: 'mot-1', doktyp: 'mot', titel: 'Enda motion' })];
    const result = buildMultiStakeholderSwot(docs, 'en');
    for (const stakeholder of result) {
      const allEntries = [
        ...stakeholder.swot.strengths,
        ...stakeholder.swot.weaknesses,
        ...stakeholder.swot.opportunities,
        ...stakeholder.swot.threats,
      ];
      for (const entry of allEntries) {
        expect(entry.text).not.toContain('%t');
      }
    }
  });

  it('does not return duplicate stakeholder categories', () => {
    const result = buildMultiStakeholderSwot(makeEuDocs(), 'en');
    const cats = result.map(s => s.category);
    const uniqueCats = new Set(cats);
    expect(uniqueCats.size).toBe(cats.length);
  });

  it('returns at most 9 stakeholders', () => {
    // Mix all document types to maximise stakeholder selection
    const docs: RawDocument[] = [
      makeDoc({ dok_id: 'prop-1', doktyp: 'prop', titel: 'Proposition' }),
      makeDoc({ dok_id: 'bet-1',  doktyp: 'bet',  titel: 'Betänkande' }),
      makeDoc({ dok_id: 'mot-1',  doktyp: 'mot',  titel: 'Motion om arbetsmarknad' }),
      makeDoc({ dok_id: 'fpm-1',  doktyp: 'fpm',  titel: 'EU-faktapromemoria' }),
      makeDoc({ dok_id: 'pressm-1', doktyp: 'pressm', titel: 'Pressmeddelande' }),
      makeDoc({ dok_id: 'sfs-1', doktyp: 'sfs', titel: 'SFS lag' }),
      makeDoc({ dok_id: 'sou-1', doktyp: 'sou', titel: 'SOU rapport forskning' }),
    ];
    const result = buildMultiStakeholderSwot(docs, 'en');
    expect(result.length).toBeLessThanOrEqual(9);
  });
});

// ---------------------------------------------------------------------------
// STAKEHOLDER_NAMES tests
// ---------------------------------------------------------------------------

describe('STAKEHOLDER_NAMES', () => {
  const categories = [
    'government', 'opposition', 'private', 'civil-society',
    'municipal', 'international', 'media', 'academia', 'labor',
  ] as const;

  it('defines names for all 9 stakeholder categories', () => {
    for (const cat of categories) {
      expect(STAKEHOLDER_NAMES[cat]).toBeDefined();
    }
  });

  it('provides English names for all 9 categories', () => {
    for (const cat of categories) {
      expect(STAKEHOLDER_NAMES[cat].en).toBeTruthy();
    }
  });

  it('provides Swedish names for all 9 categories', () => {
    for (const cat of categories) {
      expect(STAKEHOLDER_NAMES[cat].sv).toBeTruthy();
    }
  });

  it('provides names for all 14 supported languages for all categories', () => {
    for (const cat of categories) {
      for (const lang of ALL_LANGUAGES) {
        const name = STAKEHOLDER_NAMES[cat][lang];
        expect(name, `missing ${lang} translation for ${cat}`).toBeDefined();
        expect(name!.trim().length, `empty ${lang} translation for ${cat}`).toBeGreaterThan(0);
      }
    }
  });
});
