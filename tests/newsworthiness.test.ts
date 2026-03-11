/**
 * Tests for scoreNewsworthiness — strategic content detection and scoring.
 * Validates multi-dimensional scoring, threshold detection, topic extraction,
 * and document type / committee importance weighting.
 */

import { describe, it, expect } from 'vitest';
import { scoreNewsworthiness } from '../scripts/data-transformers/content-generators/newsworthiness.js';
import type { RawDocument, CIAContext } from '../scripts/data-transformers/types.js';

/** Minimal document for tests */
function makeDoc(overrides: Partial<RawDocument> = {}): RawDocument {
  return {
    dok_id: 'H901FiU1',
    titel: 'Test document',
    doktyp: 'prop',
    organ: 'FiU',
    parti: 'S',
    datum: '2026-03-01',
    ...overrides,
  } as RawDocument;
}

/** Document with strategic content */
function makeStrategicDoc(): RawDocument {
  return makeDoc({
    titel: 'Budget proposition 2026 — statsbudget med försvarssatsning och NATO-anpassning',
    doktyp: 'prop',
    organ: 'FiU',
    summary: 'Regeringens budgetproposition innehåller ökade försvarsutgifter, skatteförändringar och reformer.',
  });
}

/** Low-importance document */
function makeLowDoc(): RawDocument {
  return makeDoc({
    titel: 'Svar på skriftlig fråga',
    doktyp: 'fr',
    organ: '',
    parti: '',
  });
}

/** CIA context with instability */
function makeUnstableCIA(): CIAContext {
  return {
    coalitionStability: {
      stabilityScore: 35,
      majorityMargin: 2,
    },
  } as CIAContext;
}

describe('scoreNewsworthiness', () => {
  it('returns zero score for empty document array', () => {
    const score = scoreNewsworthiness([]);
    expect(score.overall).toBe(0);
    expect(score.dimensions).toEqual([]);
    expect(score.warrantsDeepInspection).toBe(false);
    expect(score.suggestedType).toBe('brief');
  });

  it('returns a score with all 6 dimensions', () => {
    const score = scoreNewsworthiness([makeDoc()]);
    expect(score.dimensions.length).toBe(6);
    expect(score.dimensions.map(d => d.name)).toEqual([
      'Strategic Keywords',
      'Document Type',
      'Committee Importance',
      'Multi-Party Involvement',
      'Coalition Context',
      'Content Richness',
    ]);
  });

  it('scores strategic content higher than routine content', () => {
    const strategicScore = scoreNewsworthiness([makeStrategicDoc()]);
    const lowScore = scoreNewsworthiness([makeLowDoc()]);
    expect(strategicScore.overall).toBeGreaterThan(lowScore.overall);
  });

  it('detects strategic keywords in document text', () => {
    const score = scoreNewsworthiness([makeStrategicDoc()]);
    const keywordDim = score.dimensions.find(d => d.name === 'Strategic Keywords');
    expect(keywordDim).toBeDefined();
    expect(keywordDim!.score).toBeGreaterThan(0);
    expect(keywordDim!.reason).toContain('strategic keyword');
  });

  it('scores proposition document type as high value', () => {
    const score = scoreNewsworthiness([makeDoc({ doktyp: 'prop' })]);
    const typeDim = score.dimensions.find(d => d.name === 'Document Type');
    expect(typeDim).toBeDefined();
    expect(typeDim!.score).toBe(80);
  });

  it('scores motion document type lower', () => {
    const score = scoreNewsworthiness([makeDoc({ doktyp: 'mot' })]);
    const typeDim = score.dimensions.find(d => d.name === 'Document Type');
    expect(typeDim).toBeDefined();
    expect(typeDim!.score).toBe(40);
  });

  it('scores strategic committees higher', () => {
    const fiuScore = scoreNewsworthiness([makeDoc({ organ: 'FiU' })]);
    const otherScore = scoreNewsworthiness([makeDoc({ organ: 'CU' })]);
    const fiuDim = fiuScore.dimensions.find(d => d.name === 'Committee Importance');
    const otherDim = otherScore.dimensions.find(d => d.name === 'Committee Importance');
    expect(fiuDim!.score).toBeGreaterThan(otherDim!.score);
  });

  it('scores multi-party involvement higher', () => {
    const multiParty = scoreNewsworthiness([
      makeDoc({ parti: 'S' }),
      makeDoc({ parti: 'M' }),
      makeDoc({ parti: 'SD' }),
      makeDoc({ parti: 'V' }),
      makeDoc({ parti: 'C' }),
      makeDoc({ parti: 'KD' }),
    ]);
    const singleParty = scoreNewsworthiness([makeDoc({ parti: 'S' })]);
    const multiDim = multiParty.dimensions.find(d => d.name === 'Multi-Party Involvement');
    const singleDim = singleParty.dimensions.find(d => d.name === 'Multi-Party Involvement');
    expect(multiDim!.score).toBeGreaterThan(singleDim!.score);
  });

  it('amplifies score with coalition instability context', () => {
    const withCIA = scoreNewsworthiness([makeStrategicDoc()], makeUnstableCIA());
    const withoutCIA = scoreNewsworthiness([makeStrategicDoc()]);
    expect(withCIA.overall).toBeGreaterThanOrEqual(withoutCIA.overall);
    const ciaDim = withCIA.dimensions.find(d => d.name === 'Coalition Context');
    expect(ciaDim!.score).toBeGreaterThan(30);
    expect(ciaDim!.reason).toContain('instability');
  });

  it('marks high-scoring content as warranting deep inspection', () => {
    const score = scoreNewsworthiness([
      makeStrategicDoc(),
      makeDoc({ parti: 'M', titel: 'NATO defence budget reform', doktyp: 'prop', organ: 'FöU' }),
      makeDoc({ parti: 'SD', titel: 'Migration policy reform' }),
      makeDoc({ parti: 'V', titel: 'Climate policy opposition' }),
    ], makeUnstableCIA());
    // Strategic keywords + propositions + multi-party + instability → deep inspection
    expect(score.overall).toBeGreaterThanOrEqual(65);
    expect(score.warrantsDeepInspection).toBe(true);
    expect(score.suggestedType).toBe('deep-inspection');
  });

  it('applies deep inspection threshold around 65 points', () => {
    const lowScore = scoreNewsworthiness([makeLowDoc()]);
    expect(lowScore.overall).toBeLessThan(65);
    expect(lowScore.warrantsDeepInspection).toBe(false);

    // Multiple strategic docs + multi-party + coalition instability → above threshold
    const highScore = scoreNewsworthiness([
      makeStrategicDoc(),
      makeDoc({ parti: 'M', titel: 'NATO defence budget reform', doktyp: 'prop', organ: 'FöU' }),
      makeDoc({ parti: 'SD', titel: 'Migration policy reform' }),
      makeDoc({ parti: 'V', titel: 'Climate policy opposition' }),
    ], makeUnstableCIA());
    expect(highScore.overall).toBeGreaterThanOrEqual(65);
    expect(highScore.warrantsDeepInspection).toBe(true);
    expect(highScore.suggestedType).toBe('deep-inspection');
  });

  it('extracts strategic topics from content', () => {
    const score = scoreNewsworthiness([makeStrategicDoc()]);
    expect(score.topics.length).toBeGreaterThan(0);
    // Budget proposition should contain budget-related topics
    const hasBudgetTopics = score.topics.some(t => {
      const lower = t.toLowerCase();
      return lower.includes('budget') || lower.includes('nato') || lower.includes('försvar');
    });
    expect(hasBudgetTopics).toBe(true);
  });

  it('returns brief suggestion for low-scoring content', () => {
    const score = scoreNewsworthiness([makeLowDoc()]);
    expect(score.suggestedType).not.toBe('deep-inspection');
  });

  it('overall score is between 0 and 100', () => {
    const scores = [
      scoreNewsworthiness([makeDoc()]),
      scoreNewsworthiness([makeStrategicDoc()]),
      scoreNewsworthiness([makeLowDoc()]),
    ];
    for (const s of scores) {
      expect(s.overall).toBeGreaterThanOrEqual(0);
      expect(s.overall).toBeLessThanOrEqual(100);
    }
  });

  it('each dimension score is between 0 and 100', () => {
    const score = scoreNewsworthiness([makeStrategicDoc()], makeUnstableCIA());
    for (const dim of score.dimensions) {
      expect(dim.score).toBeGreaterThanOrEqual(0);
      expect(dim.score).toBeLessThanOrEqual(100);
    }
  });

  it('each dimension has a non-empty reason', () => {
    const score = scoreNewsworthiness([makeDoc()]);
    for (const dim of score.dimensions) {
      expect(dim.reason).toBeTruthy();
      expect(dim.reason.length).toBeGreaterThan(0);
    }
  });

  it('scores document type and committee using best across all docs (order-independent)', () => {
    const propFirst = scoreNewsworthiness([
      makeDoc({ doktyp: 'prop', organ: 'FiU' }),
      makeDoc({ doktyp: 'fr', organ: '' }),
    ]);
    const propSecond = scoreNewsworthiness([
      makeDoc({ doktyp: 'fr', organ: '' }),
      makeDoc({ doktyp: 'prop', organ: 'FiU' }),
    ]);
    // Same docs in different order should produce the same overall score
    expect(propFirst.overall).toBe(propSecond.overall);

    // Document Type dimension should pick the best (prop = 80)
    const dtFirst = propFirst.dimensions.find(d => d.name === 'Document Type');
    const dtSecond = propSecond.dimensions.find(d => d.name === 'Document Type');
    expect(dtFirst?.score).toBe(80);
    expect(dtSecond?.score).toBe(80);

    // Committee Importance should pick the best (FiU = 75)
    const ciFirst = propFirst.dimensions.find(d => d.name === 'Committee Importance');
    const ciSecond = propSecond.dimensions.find(d => d.name === 'Committee Importance');
    expect(ciFirst?.score).toBe(75);
    expect(ciSecond?.score).toBe(75);
  });
});
