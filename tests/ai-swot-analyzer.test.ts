/**
 * Tests for ai-swot-analyzer — AI-driven 6-stakeholder SWOT analysis builder.
 * Validates stakeholder count, AISwotEntry shape, trend indicators, cross-references,
 * confidence scores, localization, and XSS safety.
 */

import { describe, it, expect } from 'vitest';
import {
  buildAISwotStakeholders,
} from '../scripts/data-transformers/content-generators/ai-swot-analyzer.js';
import type {
  StakeholderPerspective,
  TrendDirection,
  AISwotEntry,
} from '../scripts/data-transformers/content-generators/ai-swot-analyzer.js';
import type { RawDocument } from '../scripts/data-transformers/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDoc(overrides: Partial<RawDocument> = {}): RawDocument {
  return {
    dok_id: 'test-123',
    titel: 'Test document',
    doktyp: 'prop',
    ...overrides,
  };
}

function makePropDoc(titel: string): RawDocument {
  return makeDoc({ doktyp: 'prop', titel });
}

function makeBetDoc(titel: string): RawDocument {
  return makeDoc({ doktyp: 'bet', titel });
}

function makeMotDoc(titel: string): RawDocument {
  return makeDoc({ doktyp: 'mot', titel });
}

function makeEuDoc(titel: string): RawDocument {
  return makeDoc({ doktyp: 'fpm', titel });
}

function makeSfsDoc(titel: string): RawDocument {
  return makeDoc({ doktyp: 'sfs', titel });
}

function makeExtDoc(titel: string): RawDocument {
  return makeDoc({ doktyp: 'ext', titel });
}

// ---------------------------------------------------------------------------
// Tests: buildAISwotStakeholders
// ---------------------------------------------------------------------------

describe('buildAISwotStakeholders', () => {
  describe('stakeholder count', () => {
    it('returns exactly 6 stakeholders', () => {
      const result = buildAISwotStakeholders([], null, 'en');
      expect(result).toHaveLength(6);
    });

    it('returns 6 stakeholders regardless of document count', () => {
      const docs = [makePropDoc('Test prop'), makeBetDoc('Test bet')];
      const result = buildAISwotStakeholders(docs, 'Healthcare', 'en');
      expect(result).toHaveLength(6);
    });
  });

  describe('stakeholder names in English', () => {
    it('includes Government Coalition as first stakeholder', () => {
      const result = buildAISwotStakeholders([], null, 'en');
      expect(result[0].name).toBe('Government Coalition');
    });

    it('includes Social Democratic Opposition as second stakeholder', () => {
      const result = buildAISwotStakeholders([], null, 'en');
      expect(result[1].name).toBe('Social Democratic Opposition');
    });

    it('includes EU & International Actors as third stakeholder', () => {
      const result = buildAISwotStakeholders([], null, 'en');
      expect(result[2].name).toBe('EU & International Actors');
    });

    it('includes Private Sector & Business as fourth stakeholder', () => {
      const result = buildAISwotStakeholders([], null, 'en');
      expect(result[3].name).toBe('Private Sector & Business');
    });

    it('includes Civil Society & NGOs as fifth stakeholder', () => {
      const result = buildAISwotStakeholders([], null, 'en');
      expect(result[4].name).toBe('Civil Society & NGOs');
    });

    it('includes Swedish Citizens & Voters as sixth stakeholder', () => {
      const result = buildAISwotStakeholders([], null, 'en');
      expect(result[5].name).toBe('Swedish Citizens & Voters');
    });
  });

  describe('stakeholder roles', () => {
    it('each stakeholder has a non-empty role', () => {
      const result = buildAISwotStakeholders([], null, 'en');
      for (const s of result) {
        expect(s.role).toBeTruthy();
        expect(s.role!.length).toBeGreaterThan(5);
      }
    });

    it('Government Coalition role mentions Tidö parties', () => {
      const result = buildAISwotStakeholders([], null, 'en');
      expect(result[0].role).toContain('Tidö');
    });

    it('Opposition role mentions S, V, C, MP', () => {
      const result = buildAISwotStakeholders([], null, 'en');
      expect(result[1].role).toContain('S, V, C, MP');
    });
  });

  describe('SWOT quadrant completeness', () => {
    it('each stakeholder has all four SWOT quadrants', () => {
      const result = buildAISwotStakeholders([], null, 'en');
      for (const s of result) {
        expect(Array.isArray(s.swot.strengths)).toBe(true);
        expect(Array.isArray(s.swot.weaknesses)).toBe(true);
        expect(Array.isArray(s.swot.opportunities)).toBe(true);
        expect(Array.isArray(s.swot.threats)).toBe(true);
      }
    });

    it('each quadrant has at least one entry', () => {
      const result = buildAISwotStakeholders([], null, 'en');
      for (const s of result) {
        expect(s.swot.strengths.length).toBeGreaterThan(0);
        expect(s.swot.weaknesses.length).toBeGreaterThan(0);
        expect(s.swot.opportunities.length).toBeGreaterThan(0);
        expect(s.swot.threats.length).toBeGreaterThan(0);
      }
    });
  });

  describe('AISwotEntry shape (enhanced fields)', () => {
    it('entries have text and impact fields', () => {
      const result = buildAISwotStakeholders([makePropDoc('Budget proposal')], null, 'en');
      const firstEntry = result[0].swot.strengths[0] as AISwotEntry;
      expect(typeof firstEntry.text).toBe('string');
      expect(firstEntry.text.length).toBeGreaterThan(0);
      expect(['high', 'medium', 'low']).toContain(firstEntry.impact);
    });

    it('entries have a justification string', () => {
      const result = buildAISwotStakeholders([makePropDoc('Budget proposal')], 'Budget', 'en');
      const firstEntry = result[0].swot.strengths[0] as AISwotEntry;
      expect(typeof firstEntry.justification).toBe('string');
      expect(firstEntry.justification.length).toBeGreaterThan(5);
    });

    it('entries have a trendDirection field', () => {
      const validDirections: TrendDirection[] = ['improving', 'stable', 'deteriorating'];
      const result = buildAISwotStakeholders([makePropDoc('Test')], null, 'en');
      for (const s of result) {
        const allEntries = [
          ...s.swot.strengths,
          ...s.swot.weaknesses,
          ...s.swot.opportunities,
          ...s.swot.threats,
        ] as AISwotEntry[];
        for (const e of allEntries) {
          expect(validDirections).toContain(e.trendDirection);
        }
      }
    });

    it('entries have relatedDocuments array', () => {
      const docs = [makePropDoc('Healthcare proposition')];
      const result = buildAISwotStakeholders(docs, 'Healthcare', 'en');
      const govStrengths = result[0].swot.strengths as AISwotEntry[];
      for (const e of govStrengths) {
        expect(Array.isArray(e.relatedDocuments)).toBe(true);
      }
    });
  });

  describe('confidence scores', () => {
    it('each stakeholder has a context string with confidence percentage', () => {
      const result = buildAISwotStakeholders([], null, 'en');
      for (const s of result) {
        expect(s.swot.context).toContain('Confidence:');
        expect(s.swot.context).toMatch(/\d+%/);
      }
    });

    it('confidence is higher with more documents', () => {
      const fewDocs = [makePropDoc('A')];
      const manyDocs = Array.from({ length: 15 }, (_, i) => makePropDoc(`Doc ${i}`));
      const fewResult = buildAISwotStakeholders(fewDocs, null, 'en');
      const manyResult = buildAISwotStakeholders(manyDocs, null, 'en');

      const extractConfidence = (context: string) => {
        const m = context?.match(/Confidence: (\d+)%/);
        return m ? parseInt(m[1]) : 0;
      };

      expect(extractConfidence(manyResult[0].swot.context ?? '')).toBeGreaterThanOrEqual(
        extractConfidence(fewResult[0].swot.context ?? ''),
      );
    });
  });

  describe('topic integration', () => {
    it('when topic provided, entries reference the topic', () => {
      const result = buildAISwotStakeholders([makePropDoc('Migration policy')], 'Migration', 'en');
      const govStrengths = result[0].swot.strengths as AISwotEntry[];
      const firstEntry = govStrengths[0];
      // Either the text or justification should reference the topic
      const hasTopic = firstEntry.text.includes('Migration') || firstEntry.justification.includes('Migration');
      expect(hasTopic).toBe(true);
    });

    it('works without topic (null)', () => {
      const result = buildAISwotStakeholders([makePropDoc('Generic doc')], null, 'en');
      expect(result).toHaveLength(6);
      for (const s of result) {
        expect(s.swot.strengths.length).toBeGreaterThan(0);
      }
    });
  });

  describe('document type routing', () => {
    it('proposition docs appear in government coalition strengths', () => {
      const docs = [makePropDoc('Proposition 2025/26:100'), makePropDoc('Proposition 2025/26:101')];
      const result = buildAISwotStakeholders(docs, null, 'en');
      const govStrengths = result[0].swot.strengths as AISwotEntry[];
      const hasPropDoc = govStrengths.some(e => e.relatedDocuments.some(r => r.includes('Proposition')));
      expect(hasPropDoc).toBe(true);
    });

    it('committee reports appear in opposition strengths', () => {
      const docs = [makeBetDoc('Committee report SoU2025:1'), makeBetDoc('Committee report FiU2025:2')];
      const result = buildAISwotStakeholders(docs, null, 'en');
      const oppStrengths = result[1].swot.strengths as AISwotEntry[];
      const hasReport = oppStrengths.some(e => e.relatedDocuments.some(r => r.includes('Committee report')));
      expect(hasReport).toBe(true);
    });

    it('EU position papers appear in EU/International stakeholder strengths', () => {
      const docs = [makeEuDoc('EU fact sheet on carbon neutrality')];
      const result = buildAISwotStakeholders(docs, null, 'en');
      const euStrengths = result[2].swot.strengths as AISwotEntry[];
      const hasEuDoc = euStrengths.some(e => e.relatedDocuments.some(r => r.includes('EU fact sheet')));
      expect(hasEuDoc).toBe(true);
    });

    it('external docs appear in private sector strengths', () => {
      const docs = [makeExtDoc('Industry association response')];
      const result = buildAISwotStakeholders(docs, null, 'en');
      const privateStrengths = result[3].swot.strengths as AISwotEntry[];
      const hasExtDoc = privateStrengths.some(e => e.relatedDocuments.some(r => r.includes('Industry association')));
      expect(hasExtDoc).toBe(true);
    });

    it('opposition motions appear in civil society threats', () => {
      const docs = [makeMotDoc('Motion on press freedom restrictions')];
      const result = buildAISwotStakeholders(docs, null, 'en');
      const civilThreats = result[4].swot.threats as AISwotEntry[];
      // Civil society threats reference motion docs
      const hasMotDoc = civilThreats.some(e => e.relatedDocuments.some(r => r.includes('Motion')));
      expect(hasMotDoc).toBe(true);
    });

    it('enacted laws (SFS) appear in citizens strengths', () => {
      const docs = [makeSfsDoc('SFS 2025:100 Healthcare Act')];
      const result = buildAISwotStakeholders(docs, null, 'en');
      const citizenStrengths = result[5].swot.strengths as AISwotEntry[];
      const hasLaw = citizenStrengths.some(e => e.relatedDocuments.some(r => r.includes('SFS')));
      expect(hasLaw).toBe(true);
    });
  });

  describe('cross-reference metadata', () => {
    it('context includes cross-references count when proposition docs present', () => {
      const docs = [makePropDoc('Budget proposition')];
      const result = buildAISwotStakeholders(docs, null, 'en');
      // Government coalition (index 0) should have cross-reference listed
      const hasXRef = result.some(s => s.swot.context?.includes('Cross-references:'));
      expect(hasXRef).toBe(true);
    });
  });

  describe('localisation — 14 languages', () => {
    const langs = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'] as const;

    it('returns 6 stakeholders for every supported language', () => {
      for (const lang of langs) {
        const result = buildAISwotStakeholders([], null, lang);
        expect(result).toHaveLength(6);
      }
    });

    it('stakeholder names differ between English and Swedish', () => {
      const en = buildAISwotStakeholders([], null, 'en');
      const sv = buildAISwotStakeholders([], null, 'sv');
      expect(en[0].name).not.toBe(sv[0].name);
      expect(sv[0].name).toBe('Regeringskoalitionen');
    });

    it('stakeholder names differ between English and German', () => {
      const en = buildAISwotStakeholders([], null, 'en');
      const de = buildAISwotStakeholders([], null, 'de');
      expect(en[0].name).not.toBe(de[0].name);
      expect(de[0].name).toBe('Regierungskoalition');
    });

    it('Swedish government coalition name is correct', () => {
      const sv = buildAISwotStakeholders([], null, 'sv');
      expect(sv[0].name).toBe('Regeringskoalitionen');
    });

    it('French names are populated', () => {
      const fr = buildAISwotStakeholders([], null, 'fr');
      expect(fr[0].name).toBe('Coalition gouvernementale');
      expect(fr[1].name).toBe('Opposition sociale-démocrate');
    });

    it('Arabic names are populated', () => {
      const ar = buildAISwotStakeholders([], null, 'ar');
      for (const s of ar) {
        expect(s.name.length).toBeGreaterThan(0);
      }
    });

    it('Japanese names are populated', () => {
      const ja = buildAISwotStakeholders([], null, 'ja');
      expect(ja[0].name).toBe('政府連立');
    });

    it('each language has non-empty roles', () => {
      for (const lang of langs) {
        const result = buildAISwotStakeholders([], null, lang);
        for (const s of result) {
          expect(s.role?.length ?? 0).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('summary text content', () => {
    it('documents are summarised over title when summary is longer than 20 chars', () => {
      const docs = [makeDoc({
        doktyp: 'prop',
        titel: 'Short',
        summary: 'A very long and informative summary that should be preferred over the title',
      })];
      const result = buildAISwotStakeholders(docs, null, 'en');
      const govStrengths = result[0].swot.strengths as AISwotEntry[];
      // The text should come from the summary, not just "Short"
      const usedSummary = govStrengths.some(e => e.text.includes('informative summary'));
      expect(usedSummary).toBe(true);
    });

    it('falls back to title when summary is exactly 20 characters (threshold boundary)', () => {
      const docs = [makeDoc({
        doktyp: 'prop',
        titel: 'Proposition 2025/26:1',
        summary: '12345678901234567890', // exactly 20 chars — does NOT meet > 20 threshold
      })];
      const result = buildAISwotStakeholders(docs, null, 'en');
      const govStrengths = result[0].swot.strengths as AISwotEntry[];
      // Summary is exactly 20 chars → not > 20, so title is used instead
      const usedTitle = govStrengths.some(e => e.text.includes('Proposition'));
      const usedSummary = govStrengths.some(e => e.text === '12345678901234567890');
      expect(usedTitle || !usedSummary).toBe(true);
    });

    it('uses summary when it is 21 characters (just above threshold)', () => {
      const docs = [makeDoc({
        doktyp: 'prop',
        titel: 'Should not appear',
        summary: '123456789012345678901', // 21 chars — meets > 20 threshold
      })];
      const result = buildAISwotStakeholders(docs, null, 'en');
      const govStrengths = result[0].swot.strengths as AISwotEntry[];
      // Summary is 21 chars → used directly
      const usedSummary = govStrengths.some(e => e.text === '123456789012345678901');
      expect(usedSummary).toBe(true);
    });
  });
});
