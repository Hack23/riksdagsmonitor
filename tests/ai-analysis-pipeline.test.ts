/**
 * Tests for the multi-iteration AI analysis pipeline and analysis cache.
 *
 * Coverage:
 * - AIAnalysisPipeline.analyze() produces well-formed output
 * - Dynamic SWOT entries are never empty
 * - Strategic implications and key takeaways vary by document mix
 * - All 14 languages produce non-empty output
 * - --iterations parameter controls pipeline depth (1, 2, 3)
 * - AnalysisCache stores and retrieves results correctly
 * - Cache expiry behaviour
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIAnalysisPipeline } from '../scripts/generate-news-enhanced/ai-analysis-pipeline.js';
import { AnalysisCache } from '../scripts/generate-news-enhanced/analysis-cache.js';
import type { RawDocument } from '../scripts/data-transformers.js';

// ---------------------------------------------------------------------------
// Helpers
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
const BET  = makeDoc({ dok_id: 'BET1',  titel: 'Betänkande om budget', doktyp: 'bet' });
const MOT  = makeDoc({ dok_id: 'MOT1',  titel: 'Motion om klimat', doktyp: 'mot' });
const FPM  = makeDoc({ dok_id: 'FPM1',  titel: 'EU-position om handel', doktyp: 'fpm' });
const SFS  = makeDoc({ dok_id: 'SFS1',  titel: 'SFS 2026:1 Lag om digitalisering', doktyp: 'sfs' });

const ALL_DOCS = [PROP, BET, MOT, FPM, SFS];

// ---------------------------------------------------------------------------
// AIAnalysisPipeline — core tests
// ---------------------------------------------------------------------------

describe('AIAnalysisPipeline', () => {
  describe('analyze() — basic structure', () => {
    it('returns a result with the correct iteration count', () => {
      const pipeline = new AIAnalysisPipeline({ iterations: 2 });
      const result = pipeline.analyze(ALL_DOCS, null, 'en');
      expect(result.iterations).toBe(2);
    });

    it('returns document analyses for each input document', () => {
      const pipeline = new AIAnalysisPipeline({ iterations: 1 });
      const result = pipeline.analyze(ALL_DOCS, null, 'en');
      expect(result.documentAnalyses).toHaveLength(ALL_DOCS.length);
    });

    it('produces a non-empty synthesis', () => {
      const pipeline = new AIAnalysisPipeline();
      const result = pipeline.analyze(ALL_DOCS, null, 'en');
      expect(result.synthesis.policyConvergence.length).toBeGreaterThan(0);
    });

    it('produces a quality score between 0 and 100', () => {
      const pipeline = new AIAnalysisPipeline();
      const result = pipeline.analyze(ALL_DOCS, null, 'en');
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore).toBeLessThanOrEqual(100);
    });

    it('returns at least one key takeaway for a mixed document set', () => {
      const pipeline = new AIAnalysisPipeline();
      const result = pipeline.analyze(ALL_DOCS, null, 'en');
      expect(result.keyTakeaways.length).toBeGreaterThan(0);
    });

    it('returns non-empty strategic implications HTML', () => {
      const pipeline = new AIAnalysisPipeline();
      const result = pipeline.analyze(ALL_DOCS, null, 'en');
      expect(result.strategicImplications).toContain('<p>');
    });
  });

  // ── SWOT entries ──────────────────────────────────────────────────────────

  describe('dynamicSwotEntries', () => {
    it('government strengths are non-empty when propositions are present', () => {
      const pipeline = new AIAnalysisPipeline();
      const result = pipeline.analyze([PROP, BET], null, 'en');
      expect(result.dynamicSwotEntries.government.strengths.length).toBeGreaterThan(0);
    });

    it('opposition strengths are non-empty when committee reports are present', () => {
      const pipeline = new AIAnalysisPipeline();
      const result = pipeline.analyze([BET, MOT], null, 'en');
      expect(result.dynamicSwotEntries.opposition.strengths.length).toBeGreaterThan(0);
    });

    it('private sector strengths always have at least one entry', () => {
      const pipeline = new AIAnalysisPipeline();
      const result = pipeline.analyze([PROP], null, 'en');
      expect(result.dynamicSwotEntries.privateSector.strengths.length).toBeGreaterThan(0);
    });

    it('all SWOT entries have non-empty text', () => {
      const pipeline = new AIAnalysisPipeline();
      const result = pipeline.analyze(ALL_DOCS, 'climate policy', 'en');
      const allEntries = [
        ...result.dynamicSwotEntries.government.strengths,
        ...result.dynamicSwotEntries.government.weaknesses,
        ...result.dynamicSwotEntries.government.opportunities,
        ...result.dynamicSwotEntries.government.threats,
        ...result.dynamicSwotEntries.opposition.strengths,
        ...result.dynamicSwotEntries.opposition.weaknesses,
        ...result.dynamicSwotEntries.opposition.opportunities,
        ...result.dynamicSwotEntries.opposition.threats,
        ...result.dynamicSwotEntries.privateSector.strengths,
        ...result.dynamicSwotEntries.privateSector.weaknesses,
        ...result.dynamicSwotEntries.privateSector.opportunities,
        ...result.dynamicSwotEntries.privateSector.threats,
      ];
      expect(allEntries.length).toBeGreaterThan(0);
      allEntries.forEach(e => expect(e.text.length).toBeGreaterThan(0));
    });

    it('SWOT entries are context-aware when a focus topic is provided', () => {
      const pipeline = new AIAnalysisPipeline();
      const withTopic = pipeline.analyze([PROP], 'defence policy', 'en');
      const withoutTopic = pipeline.analyze([PROP], null, 'en');
      // The topic should appear in at least one entry
      const topicEntries = [
        ...withTopic.dynamicSwotEntries.government.strengths,
        ...withTopic.dynamicSwotEntries.privateSector.strengths,
      ].filter(e => e.text.includes('defence policy'));
      expect(topicEntries.length).toBeGreaterThan(0);
      // Without topic, entries should not contain the specific topic string
      const noTopicEntries = [
        ...withoutTopic.dynamicSwotEntries.government.strengths,
      ].filter(e => e.text.includes('defence policy'));
      expect(noTopicEntries.length).toBe(0);
    });
  });

  // ── Key takeaways ─────────────────────────────────────────────────────────

  describe('keyTakeaways', () => {
    it('includes a proposition takeaway when propositions are present', () => {
      const pipeline = new AIAnalysisPipeline();
      const result = pipeline.analyze([PROP], 'security', 'en');
      const hasPropTakeaway = result.keyTakeaways.some(t => t.includes('legislative proposal'));
      expect(hasPropTakeaway).toBe(true);
    });

    it('includes a committee report takeaway when committee reports are present', () => {
      const pipeline = new AIAnalysisPipeline();
      const result = pipeline.analyze([BET], 'budget', 'en');
      const hasBetTakeaway = result.keyTakeaways.some(t => t.includes('committee report'));
      expect(hasBetTakeaway).toBe(true);
    });

    it('includes a motion takeaway when motions are present', () => {
      const pipeline = new AIAnalysisPipeline();
      const result = pipeline.analyze([MOT], 'climate', 'en');
      const hasMotTakeaway = result.keyTakeaways.some(t => t.includes('motion'));
      expect(hasMotTakeaway).toBe(true);
    });

    it('detects coalition stress when motions challenge propositions', () => {
      const stressDoc = makeDoc({
        dok_id: 'MOT2',
        titel: 'Avslag på proposition om migration',
        doktyp: 'mot',
      });
      const pipeline = new AIAnalysisPipeline();
      const result = pipeline.analyze([PROP, stressDoc], 'migration', 'en');
      const hasStress = result.keyTakeaways.some(t =>
        t.toLowerCase().includes('coalition') || t.toLowerCase().includes('opposition challenge'),
      );
      expect(hasStress).toBe(true);
    });
  });

  // ── Strategic implications ─────────────────────────────────────────────────

  describe('strategicImplications', () => {
    it('references document counts in the text', () => {
      const pipeline = new AIAnalysisPipeline();
      const docs = [PROP, BET, MOT];
      const result = pipeline.analyze(docs, null, 'en');
      expect(result.strategicImplications).toContain('3');
    });

    it('references the focus topic when provided', () => {
      const pipeline = new AIAnalysisPipeline();
      const result = pipeline.analyze([PROP], 'Nordic security', 'en');
      expect(result.strategicImplications).toContain('Nordic security');
    });

    it('returns a paragraph element', () => {
      const pipeline = new AIAnalysisPipeline();
      const result = pipeline.analyze([PROP], null, 'en');
      expect(result.strategicImplications.trim()).toMatch(/^<p>/);
      expect(result.strategicImplications).toContain('</p>');
    });

    it('escapes HTML-special characters in focus topic to prevent XSS', () => {
      const pipeline = new AIAnalysisPipeline();
      const result = pipeline.analyze([PROP], '<img onerror=alert(1)>', 'en');
      expect(result.strategicImplications).not.toContain('<img');
      expect(result.strategicImplications).toContain('&lt;img');
    });

    it('produces localized signal text for Swedish (not English)', () => {
      const pipeline = new AIAnalysisPipeline();
      const result = pipeline.analyze([PROP, BET, MOT], null, 'sv');
      // Swedish template should not contain "active government agenda-setting" (English)
      expect(result.strategicImplications).not.toContain('active government');
    });
  });

  // ── Multi-language support ─────────────────────────────────────────────────

  describe('multi-language support', () => {
    const LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'] as const;

    LANGUAGES.forEach(lang => {
      it(`produces non-empty strategic implications for ${lang}`, () => {
        const pipeline = new AIAnalysisPipeline({ iterations: 1 });
        const result = pipeline.analyze([PROP, BET], 'policy', lang);
        expect(result.strategicImplications.length).toBeGreaterThan(0);
      });

      it(`produces non-empty SWOT entries for ${lang}`, () => {
        const pipeline = new AIAnalysisPipeline({ iterations: 1 });
        const result = pipeline.analyze([PROP, MOT], 'security', lang);
        expect(result.dynamicSwotEntries.government.strengths.length).toBeGreaterThan(0);
      });
    });
  });

  // ── Iteration count ───────────────────────────────────────────────────────

  describe('--iterations parameter', () => {
    it('iteration=1 produces a valid result', () => {
      const pipeline = new AIAnalysisPipeline({ iterations: 1 });
      const result = pipeline.analyze([PROP], null, 'en');
      expect(result.iterations).toBe(1);
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
    });

    it('iteration=5 produces a valid result', () => {
      const pipeline = new AIAnalysisPipeline({ iterations: 5 });
      const result = pipeline.analyze(ALL_DOCS, 'climate', 'en');
      expect(result.iterations).toBe(5);
    });

    it('default iterations is 3', () => {
      const pipeline = new AIAnalysisPipeline();
      const result = pipeline.analyze([PROP], null, 'en');
      expect(result.iterations).toBe(3);
    });

    it('quality score with 3 iterations >= quality with 1 iteration on rich document set', () => {
      const pipeline1 = new AIAnalysisPipeline({ iterations: 1 });
      const pipeline3 = new AIAnalysisPipeline({ iterations: 3 });
      const r1 = pipeline1.analyze(ALL_DOCS, 'security', 'en');
      const r3 = pipeline3.analyze(ALL_DOCS, 'security', 'en');
      // With 3 iterations, quality should be at least as good
      expect(r3.qualityScore).toBeGreaterThanOrEqual(r1.qualityScore);
    });
  });

  // ── Empty / edge-case input ───────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles empty document array gracefully', () => {
      const pipeline = new AIAnalysisPipeline();
      const result = pipeline.analyze([], null, 'en');
      expect(result.documentAnalyses).toHaveLength(0);
      expect(result.keyTakeaways).toHaveLength(0);
    });

    it('handles single document gracefully', () => {
      const pipeline = new AIAnalysisPipeline();
      const result = pipeline.analyze([PROP], null, 'en');
      expect(result.documentAnalyses).toHaveLength(1);
    });

    it('handles documents with no title gracefully', () => {
      const emptyDoc = makeDoc({ dok_id: 'EMPTY', titel: undefined, title: undefined });
      const pipeline = new AIAnalysisPipeline();
      expect(() => pipeline.analyze([emptyDoc], null, 'en')).not.toThrow();
    });

    it('clamps negative iterations to 1', () => {
      const pipeline = new AIAnalysisPipeline({ iterations: -5 });
      const result = pipeline.analyze([PROP], null, 'en');
      expect(result.iterations).toBe(1);
    });

    it('clamps iterations > 10 to 10', () => {
      const pipeline = new AIAnalysisPipeline({ iterations: 15 });
      const result = pipeline.analyze([PROP], null, 'en');
      expect(result.iterations).toBe(10);
    });

    it('floors fractional iterations to integer', () => {
      const pipeline = new AIAnalysisPipeline({ iterations: 2.7 });
      const result = pipeline.analyze([PROP], null, 'en');
      expect(result.iterations).toBe(2);
      expect(Number.isInteger(result.iterations)).toBe(true);
    });

    it('enrichedCount uses fullText/fullContent, not just contentFetched', () => {
      // contentFetched=true but no fullText/fullContent → should NOT count as enriched
      const fetchedOnly = makeDoc({
        dok_id: 'E1', doktyp: 'prop', contentFetched: true,
      });
      const fetchedOnly2 = makeDoc({
        dok_id: 'E2', doktyp: 'bet', contentFetched: true,
      });
      const fetchedOnly3 = makeDoc({
        dok_id: 'E3', doktyp: 'mot', contentFetched: true,
      });
      const pipeline = new AIAnalysisPipeline({ iterations: 3 });
      const result = pipeline.analyze([fetchedOnly, fetchedOnly2, fetchedOnly3], null, 'en');
      // None have fullText/fullContent, so enrichedCount=0 → no enriched takeaway
      const enrichedTakeaway = result.keyTakeaways.find(t => t.includes('enriched'));
      expect(enrichedTakeaway).toBeUndefined();

      // Now add a doc WITH fullText — should produce enriched takeaway
      const enriched1 = makeDoc({
        dok_id: 'E4', doktyp: 'prop', contentFetched: true, fullText: 'Full text here',
      });
      const enriched2 = makeDoc({
        dok_id: 'E5', doktyp: 'bet', contentFetched: true, fullContent: 'Full content here',
      });
      const result2 = pipeline.analyze([enriched1, enriched2], null, 'en');
      const enrichedTakeaway2 = result2.keyTakeaways.find(t => t.includes('enriched'));
      expect(enrichedTakeaway2).toBeDefined();
      expect(enrichedTakeaway2).toContain('2 of 2');
    });

    it('SFS/SKR-only inputs use regulatory snapshot, not misleading press/ext text', () => {
      const sfsDoc = makeDoc({ dok_id: 'SFS1', doktyp: 'sfs', titel: 'SFS 2026:1' });
      const skrDoc = makeDoc({ dok_id: 'SKR1', doktyp: 'skr', titel: 'Skrivelse' });
      const pipeline = new AIAnalysisPipeline({ iterations: 3 });
      const result = pipeline.analyze([sfsDoc, skrDoc], null, 'en');
      // Should NOT contain "0 external references" or "0 press releases"
      expect(result.strategicImplications).not.toContain('0 external');
      expect(result.strategicImplications).not.toContain('0 press');
      // Should contain regulatory language
      expect(result.strategicImplications).toMatch(/regulatory|snapshot|parliamentary/i);
    });
  });
});

// ---------------------------------------------------------------------------
// AnalysisCache
// ---------------------------------------------------------------------------

describe('AnalysisCache', () => {
  let cache: AnalysisCache;

  beforeEach(() => {
    cache = new AnalysisCache();
  });

  it('returns undefined for a missing key', () => {
    expect(cache.get('nonexistent-key')).toBeUndefined();
  });

  it('stores and retrieves a result', () => {
    const fakeResult = { iterations: 1, qualityScore: 80 } as Parameters<AnalysisCache['set']>[1];
    cache.set('key-1', fakeResult);
    expect(cache.get('key-1')).toBe(fakeResult);
  });

  it('reflects stored entry in size', () => {
    const fakeResult = { iterations: 1 } as Parameters<AnalysisCache['set']>[1];
    cache.set('key-a', fakeResult);
    cache.set('key-b', fakeResult);
    expect(cache.size).toBe(2);
  });

  it('clear() empties the cache', () => {
    const fakeResult = { iterations: 1 } as Parameters<AnalysisCache['set']>[1];
    cache.set('key-x', fakeResult);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get('key-x')).toBeUndefined();
  });

  it('expires entries after TTL', () => {
    vi.useFakeTimers();
    try {
      const fakeResult = { iterations: 1 } as Parameters<AnalysisCache['set']>[1];
      // Store with 1 ms TTL (createdAt uses mocked Date.now)
      cache.set('key-ttl', fakeResult, 1);
      // Fast-forward time by 10 ms so TTL is exceeded
      vi.advanceTimersByTime(10);
      expect(cache.get('key-ttl')).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('generateKey returns a non-empty deterministic string', () => {
    const key1 = cache.generateKey([PROP, BET], 'security', 3, 'en');
    const key2 = cache.generateKey([PROP, BET], 'security', 3, 'en');
    expect(key1.length).toBeGreaterThan(0);
    expect(key1).toBe(key2);
  });

  it('generateKey differs when topic changes', () => {
    const k1 = cache.generateKey([PROP], 'security', 3, 'en');
    const k2 = cache.generateKey([PROP], 'healthcare', 3, 'en');
    expect(k1).not.toBe(k2);
  });

  it('generateKey differs when language changes', () => {
    const k1 = cache.generateKey([PROP], null, 3, 'en');
    const k2 = cache.generateKey([PROP], null, 3, 'sv');
    expect(k1).not.toBe(k2);
  });

  it('generateKey differs when iteration count changes', () => {
    const k1 = cache.generateKey([PROP], null, 1, 'en');
    const k2 = cache.generateKey([PROP], null, 3, 'en');
    expect(k1).not.toBe(k2);
  });
});
