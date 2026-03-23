/**
 * Unit Tests for Political Significance Scorer
 * Tests deterministic scoring, urgency classification, and signal contributions.
 */

import { describe, it, expect } from 'vitest';
import {
  scoreDocuments,
  classifyUrgency,
  BREAKING_NEWS_THRESHOLD,
} from '../scripts/ai-analysis/political-significance.js';
import type {
  SignificanceScore,
  UrgencyLabel,
} from '../scripts/ai-analysis/political-significance.js';
import type { RawDocument } from '../scripts/data-transformers/types.js';

describe('Political Significance Scorer', () => {
  // -----------------------------------------------------------------------
  // Helper factories
  // -----------------------------------------------------------------------

  const makeDoc = (overrides: Partial<RawDocument> = {}): RawDocument => ({
    doktyp: 'mot',
    titel: 'Test motion',
    ...overrides,
  });

  // -----------------------------------------------------------------------
  // Basic contract
  // -----------------------------------------------------------------------

  describe('scoreDocuments()', () => {
    it('should return a SignificanceScore with score, urgency, and signals', () => {
      const result = scoreDocuments([makeDoc()]);
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('urgency');
      expect(result).toHaveProperty('signals');
      expect(Array.isArray(result.signals)).toBe(true);
    });

    it('should return score in range 0-100', () => {
      const result = scoreDocuments([makeDoc()]);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should be deterministic — same input → same output', () => {
      const docs = [
        makeDoc({ doktyp: 'prop', titel: 'Budget 2026', parti: 'S' }),
        makeDoc({ doktyp: 'ip', titel: 'Interpellation', parti: 'M', mottagare: 'Finansministern' }),
      ];
      const a = scoreDocuments(docs, ['some old topic']);
      const b = scoreDocuments(docs, ['some old topic']);
      expect(a.score).toBe(b.score);
      expect(a.urgency).toBe(b.urgency);
      expect(a.signals).toEqual(b.signals);
    });

    it('should return score 0 for empty document array', () => {
      const result = scoreDocuments([]);
      expect(result.score).toBe(0);
      expect(result.urgency).toBe('background');
    });

    it('should include exactly 4 signal contributions', () => {
      const result = scoreDocuments([makeDoc()]);
      expect(result.signals).toHaveLength(4);
      const names = result.signals.map(s => s.signal);
      expect(names).toContain('documentType');
      expect(names).toContain('volume');
      expect(names).toContain('oppositionPressure');
      expect(names).toContain('topicRarity');
    });
  });

  // -----------------------------------------------------------------------
  // Document type scoring
  // -----------------------------------------------------------------------

  describe('document type signal', () => {
    it('should score bet (committee report) highest among standard types', () => {
      const bet = scoreDocuments([makeDoc({ doktyp: 'bet' })]);
      const mot = scoreDocuments([makeDoc({ doktyp: 'mot' })]);
      expect(bet.score).toBeGreaterThan(mot.score);
    });

    it('should score prop (government bill) higher than ip (interpellation)', () => {
      const prop = scoreDocuments([makeDoc({ doktyp: 'prop' })]);
      const ip = scoreDocuments([makeDoc({ doktyp: 'ip' })]);
      expect(prop.score).toBeGreaterThan(ip.score);
    });

    it('should handle unknown document types with a default weight', () => {
      const result = scoreDocuments([makeDoc({ doktyp: 'unknown-type' })]);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should use the maximum type weight when multiple docs present', () => {
      const mixed = scoreDocuments([
        makeDoc({ doktyp: 'fr' }),   // low weight
        makeDoc({ doktyp: 'bet' }),  // high weight
      ]);
      const frOnly = scoreDocuments([makeDoc({ doktyp: 'fr' })]);
      expect(mixed.score).toBeGreaterThan(frOnly.score);
    });
  });

  // -----------------------------------------------------------------------
  // Volume / party breadth
  // -----------------------------------------------------------------------

  describe('volume signal', () => {
    it('should increase score with more documents', () => {
      const one = scoreDocuments([makeDoc()]);
      const three = scoreDocuments([makeDoc(), makeDoc(), makeDoc()]);
      expect(three.score).toBeGreaterThanOrEqual(one.score);
    });

    it('should increase score with more parties involved', () => {
      const oneParty = scoreDocuments([
        makeDoc({ parti: 'S' }),
        makeDoc({ parti: 'S' }),
      ]);
      const threeParties = scoreDocuments([
        makeDoc({ parti: 'S' }),
        makeDoc({ parti: 'M' }),
        makeDoc({ parti: 'SD' }),
      ]);
      expect(threeParties.score).toBeGreaterThanOrEqual(oneParty.score);
    });
  });

  // -----------------------------------------------------------------------
  // Opposition pressure
  // -----------------------------------------------------------------------

  describe('opposition pressure signal', () => {
    it('should score higher when multiple interpellations target same minister', () => {
      const lowPressure = scoreDocuments([
        makeDoc({ doktyp: 'ip', mottagare: 'FinansMin' }),
      ]);
      const highPressure = scoreDocuments([
        makeDoc({ doktyp: 'ip', mottagare: 'FinansMin' }),
        makeDoc({ doktyp: 'ip', mottagare: 'FinansMin' }),
        makeDoc({ doktyp: 'ip', mottagare: 'FinansMin' }),
      ]);
      expect(highPressure.score).toBeGreaterThan(lowPressure.score);
    });

    it('should return 0 opposition pressure when no interpellations exist', () => {
      const result = scoreDocuments([makeDoc({ doktyp: 'prop' })]);
      const pressureSignal = result.signals.find(s => s.signal === 'oppositionPressure');
      expect(pressureSignal?.value).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Topic rarity
  // -----------------------------------------------------------------------

  describe('topic rarity signal', () => {
    it('should score higher for novel topics not in recent history', () => {
      const novel = scoreDocuments(
        [makeDoc({ titel: 'Completely new topic about AI regulation' })],
        ['old budget debate'],
      );
      const repeated = scoreDocuments(
        [makeDoc({ titel: 'Budget debate summary' })],
        ['budget debate'],
      );
      expect(novel.score).toBeGreaterThanOrEqual(repeated.score);
    });

    it('should handle empty recent topics as all-novel', () => {
      const result = scoreDocuments([makeDoc({ titel: 'Some topic' })], []);
      const raritySignal = result.signals.find(s => s.signal === 'topicRarity');
      expect(raritySignal?.value).toBe(100);
    });
  });

  // -----------------------------------------------------------------------
  // Urgency classification
  // -----------------------------------------------------------------------

  describe('classifyUrgency()', () => {
    it('should return "breaking" for score >= 80', () => {
      expect(classifyUrgency(80)).toBe('breaking');
      expect(classifyUrgency(100)).toBe('breaking');
    });

    it('should return "major" for score 60-79', () => {
      expect(classifyUrgency(60)).toBe('major');
      expect(classifyUrgency(79)).toBe('major');
    });

    it('should return "standard" for score 40-59', () => {
      expect(classifyUrgency(40)).toBe('standard');
      expect(classifyUrgency(59)).toBe('standard');
    });

    it('should return "background" for score < 40', () => {
      expect(classifyUrgency(0)).toBe('background');
      expect(classifyUrgency(39)).toBe('background');
    });
  });

  // -----------------------------------------------------------------------
  // Threshold constant
  // -----------------------------------------------------------------------

  describe('BREAKING_NEWS_THRESHOLD', () => {
    it('should be 60', () => {
      expect(BREAKING_NEWS_THRESHOLD).toBe(60);
    });
  });

  // -----------------------------------------------------------------------
  // Composite scenario: high-significance event
  // -----------------------------------------------------------------------

  describe('composite scenarios', () => {
    it('should score a confidence vote (bet) with multi-party pressure as major or breaking', () => {
      const docs: RawDocument[] = [
        makeDoc({ doktyp: 'bet', titel: 'Confidence vote on government', parti: 'M', organ: 'KU' }),
        makeDoc({ doktyp: 'ip', titel: 'Interpellation on confidence', parti: 'SD', mottagare: 'Statsministern' }),
        makeDoc({ doktyp: 'ip', titel: 'Confidence crisis question', parti: 'V', mottagare: 'Statsministern' }),
        makeDoc({ doktyp: 'ip', titel: 'Government stability concern', parti: 'C', mottagare: 'Statsministern' }),
      ];
      const result = scoreDocuments(docs, []);
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(['major', 'breaking'] as UrgencyLabel[]).toContain(result.urgency);
    });

    it('should score a routine motion as standard or background', () => {
      const result = scoreDocuments(
        [makeDoc({ doktyp: 'mot', titel: 'Motion about school lunches', parti: 'KD' })],
        ['school lunches'],
      );
      expect(result.score).toBeLessThan(60);
      expect(['standard', 'background'] as UrgencyLabel[]).toContain(result.urgency);
    });
  });
});
