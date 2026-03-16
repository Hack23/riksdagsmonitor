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

    it('produces an analysis score between 0 and 100', () => {
      const pipeline = new AIAnalysisPipeline();
      const result = pipeline.analyze(ALL_DOCS, null, 'en');
      expect(result.analysisScore).toBeGreaterThanOrEqual(0);
      expect(result.analysisScore).toBeLessThanOrEqual(100);
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
      expect(result.analysisScore).toBeGreaterThanOrEqual(0);
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

    it('analysis score with 3 iterations >= score with 1 iteration on rich document set', () => {
      const pipeline1 = new AIAnalysisPipeline({ iterations: 1 });
      const pipeline3 = new AIAnalysisPipeline({ iterations: 3 });
      const r1 = pipeline1.analyze(ALL_DOCS, 'security', 'en');
      const r3 = pipeline3.analyze(ALL_DOCS, 'security', 'en');
      // With 3 iterations, analysis score should be at least as good
      expect(r3.analysisScore).toBeGreaterThanOrEqual(r1.analysisScore);
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

    it('enrichedCount uses contentFetched (consistent with codebase convention)', () => {
      // contentFetched=false → should NOT count as enriched
      const notFetched = makeDoc({
        dok_id: 'E1', doktyp: 'prop', contentFetched: false,
      });
      const notFetched2 = makeDoc({
        dok_id: 'E2', doktyp: 'bet',
      });
      const notFetched3 = makeDoc({
        dok_id: 'E3', doktyp: 'mot', contentFetched: false,
      });
      const pipeline = new AIAnalysisPipeline({ iterations: 3 });
      const result = pipeline.analyze([notFetched, notFetched2, notFetched3], null, 'en');
      // None have contentFetched=true, so enrichedCount=0 → no enriched takeaway
      const enrichedTakeaway = result.keyTakeaways.find(t => t.includes('enriched'));
      expect(enrichedTakeaway).toBeUndefined();

      // Now add docs WITH contentFetched=true — should produce enriched takeaway
      const enriched1 = makeDoc({
        dok_id: 'E4', doktyp: 'prop', contentFetched: true,
      });
      const enriched2 = makeDoc({
        dok_id: 'E5', doktyp: 'bet', contentFetched: true,
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
    const fakeResult = { iterations: 1, analysisScore: 80 } as Parameters<AnalysisCache['set']>[1];
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
 * Tests for the AI analysis pipeline (scripts/ai-analysis/pipeline.ts).
 *
 * Validates:
 * - analyzeDocuments (iteration 1): produces AnalysisResult with stakeholder SWOT,
 *   watch points, mindmap branches, dashboard data, and policy assessment.
 * - refineAnalysis (iteration 2): enriches SWOT entries when enriched documents exist.
 * - validateCompleteness (iteration 3): scoring and issue detection.
 * - runAnalysisPipeline: depth-controlled iteration dispatch.
 * - 14-language support: localised stakeholder names and labels.
 * - SWOT entry confidence: HIGH for enriched content, MEDIUM for metadata-only.
 */

import { describe, it, expect } from 'vitest';
import {
  aiAnalysisPipeline,
  runAnalysisPipeline,
} from '../scripts/ai-analysis/pipeline.js';
import type { AnalysisPipelineOptions } from '../scripts/ai-analysis/types.js';
import type { RawDocument } from '../scripts/data-transformers/types.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makePropDoc(overrides: Partial<RawDocument> = {}): RawDocument {
  return {
    dok_id: 'TEST001',
    doktyp: 'prop',
    titel: 'Proposition om statsbudget 2026',
    datum: '2026-01-15',
    organ: 'FiU',
    ...overrides,
  };
}

function makeMotDoc(overrides: Partial<RawDocument> = {}): RawDocument {
  return {
    dok_id: 'TEST002',
    doktyp: 'mot',
    titel: 'Motion om ökade försvarsanslag',
    datum: '2026-01-20',
    ...overrides,
  };
}

function makeBetDoc(overrides: Partial<RawDocument> = {}): RawDocument {
  return {
    dok_id: 'TEST003',
    doktyp: 'bet',
    titel: 'Betänkande om finanspolitiken',
    datum: '2026-02-01',
    organ: 'FiU',
    ...overrides,
  };
}

function makeEnrichedPropDoc(): RawDocument {
  return {
    dok_id: 'TEST004',
    doktyp: 'prop',
    titel: 'Proposition om cybersäkerhet',
    datum: '2026-02-15',
    organ: 'JuU',
    contentFetched: true,
    fullText: 'Propositionen föreslår att riksdagen antar nya regler om cybersäkerhet för kritisk infrastruktur. Regeringen bedömer att åtgärderna stärker det svenska försvaret mot cyberhot.',
  };
}

/** Metadata-enriched only (contentFetched but no fullText/fullContent).
 *  This mirrors what `enrichDocumentsWithContent()` typically produces for
 *  Riksdag docs (called with include_full_text=false). */
function makeMetadataEnrichedPropDoc(): RawDocument {
  return {
    dok_id: 'TEST005',
    doktyp: 'prop',
    titel: 'Proposition om klimatanpassning',
    datum: '2026-03-01',
    organ: 'MJU',
    contentFetched: true,
    summary: 'Regeringen föreslår nya regler för kommunernas klimatanpassningsarbete.',
    notis: 'Klimatanpassning — kommunala åtgärder',
  };
}

function makeOptions(overrides: Partial<AnalysisPipelineOptions> = {}): AnalysisPipelineOptions {
  return {
    depth: 'standard',
    lang: 'en',
    focusTopic: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// analyzeDocuments (Iteration 1)
// ---------------------------------------------------------------------------

describe('aiAnalysisPipeline.analyzeDocuments', () => {
  it('returns an AnalysisResult with expected shape', async () => {
    const docs = [makePropDoc(), makeMotDoc()];
    const result = await aiAnalysisPipeline.analyzeDocuments(docs, makeOptions());

    expect(result).toBeDefined();
    expect(result.stakeholderSwot).toBeInstanceOf(Array);
    expect(result.stakeholderSwot.length).toBe(3); // gov, parliament, private
    expect(result.policyAssessment).toBeDefined();
    expect(result.watchPoints).toBeInstanceOf(Array);
    expect(result.mindmapBranches).toBeInstanceOf(Array);
    expect(result.dashboardData).toBeDefined();
    expect(result.iterationsCompleted).toBe(1);
    expect(result.lang).toBe('en');
    expect(result.documentCount).toBe(2);
  });

  it('produces three stakeholder SWOT analyses (government, parliament, private)', async () => {
    const docs = [makePropDoc(), makeBetDoc(), makeMotDoc()];
    const result = await aiAnalysisPipeline.analyzeDocuments(docs, makeOptions());

    const roles = result.stakeholderSwot.map(sh => sh.role);
    expect(roles).toContain('government');
    expect(roles).toContain('parliament');
    expect(roles).toContain('private-sector');
  });

  it('each SWOT quadrant has at least one entry', async () => {
    const docs = [makePropDoc(), makeBetDoc(), makeMotDoc()];
    const result = await aiAnalysisPipeline.analyzeDocuments(docs, makeOptions());

    for (const sh of result.stakeholderSwot) {
      expect(sh.swot.strengths.length).toBeGreaterThanOrEqual(1);
      expect(sh.swot.weaknesses.length).toBeGreaterThanOrEqual(1);
      expect(sh.swot.opportunities.length).toBeGreaterThanOrEqual(1);
      expect(sh.swot.threats.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('SWOT entries contain text (not empty strings)', async () => {
    const docs = [makePropDoc(), makeMotDoc()];
    const result = await aiAnalysisPipeline.analyzeDocuments(docs, makeOptions());

    for (const sh of result.stakeholderSwot) {
      const allEntries = [
        ...sh.swot.strengths,
        ...sh.swot.weaknesses,
        ...sh.swot.opportunities,
        ...sh.swot.threats,
      ];
      for (const entry of allEntries) {
        expect(entry.text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('sets focusTopic in the result when provided', async () => {
    const docs = [makePropDoc()];
    const result = await aiAnalysisPipeline.analyzeDocuments(docs, makeOptions({ focusTopic: 'cybersecurity' }));
    expect(result.focusTopic).toBe('cybersecurity');
  });

  it('produces watch points for propositions', async () => {
    const docs = [makePropDoc()];
    const result = await aiAnalysisPipeline.analyzeDocuments(docs, makeOptions());
    const propWatchPoint = result.watchPoints.find(wp => wp.urgency === 'high');
    expect(propWatchPoint).toBeDefined();
  });

  it('produces watch points for enacted laws (SFS)', async () => {
    const sfsDoc: RawDocument = { dok_id: 'SFS2026:1', doktyp: 'sfs', titel: 'Ny lag om cybersäkerhet' };
    const result = await aiAnalysisPipeline.analyzeDocuments([sfsDoc], makeOptions());
    const criticalWatchPoint = result.watchPoints.find(wp => wp.urgency === 'critical');
    expect(criticalWatchPoint).toBeDefined();
  });

  it('produces dashboard data with type distribution', async () => {
    const docs = [makePropDoc(), makeMotDoc(), makeBetDoc()];
    const result = await aiAnalysisPipeline.analyzeDocuments(docs, makeOptions());
    expect(result.dashboardData.typeDistribution.length).toBeGreaterThan(0);
    expect(result.dashboardData.summary).toBeDefined();
  });

  it('produces mindmap branches with document types and stakeholders', async () => {
    const docs = [makePropDoc(), makeMotDoc()];
    const result = await aiAnalysisPipeline.analyzeDocuments(docs, makeOptions());
    expect(result.mindmapBranches.length).toBeGreaterThanOrEqual(2);
    const branchLabels = result.mindmapBranches.map(b => b.label);
    // Stakeholders branch should always be present
    expect(branchLabels.some(l => l.toLowerCase().includes('stakeholder') || l.toLowerCase().includes('intressenter'))).toBe(true);
  });

  it('calculates a confidence score between 0 and 100', async () => {
    const docs = [makePropDoc(), makeMotDoc()];
    const result = await aiAnalysisPipeline.analyzeDocuments(docs, makeOptions());
    expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.confidenceScore).toBeLessThanOrEqual(100);
  });

  it('handles empty document array gracefully', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([], makeOptions());
    expect(result.documentCount).toBe(0);
    expect(result.confidenceScore).toBe(0);
    // Should still produce 3 stakeholder SWOT analyses (placeholder entries)
    expect(result.stakeholderSwot.length).toBe(3);
  });

  it('includes policy domains for fiscal documents', async () => {
    const fiscalDoc: RawDocument = {
      dok_id: 'BUDGET001',
      doktyp: 'prop',
      titel: 'Proposition om statsbudgeten och skattelagstiftningen 2026',
    };
    const result = await aiAnalysisPipeline.analyzeDocuments([fiscalDoc], makeOptions({ lang: 'en' }));
    expect(result.policyAssessment.domains.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Language support
// ---------------------------------------------------------------------------

describe('aiAnalysisPipeline.analyzeDocuments — language support', () => {
  const testLanguages = ['en', 'sv', 'de', 'fr', 'es', 'ar', 'zh', 'ja', 'ko', 'he', 'fi', 'nl', 'da', 'no'] as const;
  const docs = [makePropDoc(), makeMotDoc()];

  for (const lang of testLanguages) {
    it(`produces localised stakeholder names for ${lang}`, async () => {
      const result = await aiAnalysisPipeline.analyzeDocuments(docs, makeOptions({ lang }));
      expect(result.lang).toBe(lang);
      expect(result.stakeholderSwot[0]?.name.trim().length).toBeGreaterThan(0);
      expect(result.stakeholderSwot[1]?.name.trim().length).toBeGreaterThan(0);
      expect(result.stakeholderSwot[2]?.name.trim().length).toBeGreaterThan(0);
    });
  }
});

// ---------------------------------------------------------------------------
// refineAnalysis (Iteration 2)
// ---------------------------------------------------------------------------

describe('aiAnalysisPipeline.refineAnalysis', () => {
  it('bumps iterationsCompleted to 2', async () => {
    const docs = [makePropDoc(), makeMotDoc()];
    const initial = await aiAnalysisPipeline.analyzeDocuments(docs, makeOptions());
    const refined = await aiAnalysisPipeline.refineAnalysis(initial, docs, makeOptions());
    expect(refined.iterationsCompleted).toBe(2);
  });

  it('preserves analysis content but updates metadata when no enriched docs', async () => {
    const docs = [makePropDoc(), makeMotDoc()]; // not enriched
    const initial = await aiAnalysisPipeline.analyzeDocuments(docs, makeOptions());
    const refined = await aiAnalysisPipeline.refineAnalysis(initial, docs, makeOptions());
    expect(refined.iterationsCompleted).toBe(2);
    expect(refined.documentCount).toBe(initial.documentCount);
  });

  it('updates enrichedCount for metadata-enriched docs without full text', async () => {
    // Simulate the typical MCP enrichment: contentFetched=true but no fullText
    const docs = [makeMetadataEnrichedPropDoc(), makePropDoc()];
    const options = makeOptions();
    const initial = await aiAnalysisPipeline.analyzeDocuments(docs, options);
    // enrichedCount should reflect metadata enrichment from iteration 1
    expect(initial.enrichedCount).toBe(1);
    const refined = await aiAnalysisPipeline.refineAnalysis(initial, docs, options);
    // enrichedCount should still be 1 after refinement (metadata-enriched count preserved)
    expect(refined.enrichedCount).toBe(1);
  });

  it('produces higher confidence score with enriched documents', async () => {
    const docs = [makeEnrichedPropDoc(), makePropDoc(), makeMotDoc()];
    const options = makeOptions();
    const initial = await aiAnalysisPipeline.analyzeDocuments(docs, options);
    const refined = await aiAnalysisPipeline.refineAnalysis(initial, docs, options);
    // Confidence should be >= initial since enriched docs add evidence
    expect(refined.confidenceScore).toBeGreaterThanOrEqual(initial.confidenceScore);
  });

  it('includes enriched document content in SWOT entry text', async () => {
    const enrichedDoc = makeEnrichedPropDoc();
    const docs = [enrichedDoc];
    const options = makeOptions({ lang: 'en' });
    const initial = await aiAnalysisPipeline.analyzeDocuments(docs, options);
    const refined = await aiAnalysisPipeline.refineAnalysis(initial, docs, options);

    // Find government stakeholder
    const govSh = refined.stakeholderSwot.find(sh => sh.role === 'government');
    expect(govSh).toBeDefined();

    // At least one HIGH confidence entry should exist (from enriched full text)
    const allEntries = [
      ...(govSh?.swot.strengths ?? []),
      ...(govSh?.swot.weaknesses ?? []),
      ...(govSh?.swot.opportunities ?? []),
      ...(govSh?.swot.threats ?? []),
    ];
    const highConfidenceEntries = allEntries.filter(e => e.confidence === 'HIGH');
    expect(highConfidenceEntries.length).toBeGreaterThan(0);
  });

  it('sets enrichedCount to the number of metadata-enriched documents', async () => {
    // makeEnrichedPropDoc has contentFetched:true + fullText
    // makeMetadataEnrichedPropDoc has contentFetched:true but no fullText
    // makePropDoc has neither
    const docs = [makeEnrichedPropDoc(), makeMetadataEnrichedPropDoc(), makePropDoc()];
    const options = makeOptions();
    const initial = await aiAnalysisPipeline.analyzeDocuments(docs, options);
    const refined = await aiAnalysisPipeline.refineAnalysis(initial, docs, options);
    // enrichedCount reflects metadata enrichment (contentFetched), not just full-text
    expect(refined.enrichedCount).toBe(2);
  });

  it('sets completedAt to a valid ISO timestamp', async () => {
    const docs = [makePropDoc()];
    const initial = await aiAnalysisPipeline.analyzeDocuments(docs, makeOptions());
    const refined = await aiAnalysisPipeline.refineAnalysis(initial, docs, makeOptions());
    expect(() => new Date(refined.completedAt)).not.toThrow();
    expect(new Date(refined.completedAt).getTime()).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// validateCompleteness (Iteration 3)
// ---------------------------------------------------------------------------

describe('aiAnalysisPipeline.validateCompleteness', () => {
  it('returns a ValidationResult with score and issues', async () => {
    const docs = [makePropDoc(), makeBetDoc(), makeMotDoc()];
    const options = makeOptions();
    const initial = await aiAnalysisPipeline.analyzeDocuments(docs, options);
    const refined = await aiAnalysisPipeline.refineAnalysis(initial, docs, options);
    const validation = await aiAnalysisPipeline.validateCompleteness(refined, docs);

    expect(validation.score).toBeGreaterThanOrEqual(0);
    expect(validation.score).toBeLessThanOrEqual(100);
    expect(validation.passed).toBeDefined();
    expect(validation.issues).toBeInstanceOf(Array);
    expect(validation.suggestions).toBeInstanceOf(Array);
  });

  it('passes for a well-populated analysis', async () => {
    const docs = [makePropDoc(), makeBetDoc(), makeMotDoc(), makeEnrichedPropDoc()];
    const options = makeOptions();
    const initial = await aiAnalysisPipeline.analyzeDocuments(docs, options);
    const refined = await aiAnalysisPipeline.refineAnalysis(initial, docs, options);
    const validation = await aiAnalysisPipeline.validateCompleteness(refined, docs);

    expect(validation.passed).toBe(true);
    expect(validation.score).toBeGreaterThanOrEqual(60);
  });

  it('reports issue when no documents are enriched', async () => {
    const docs = [makePropDoc()]; // not enriched
    const options = makeOptions();
    let analysis = await aiAnalysisPipeline.analyzeDocuments(docs, options);
    analysis = await aiAnalysisPipeline.refineAnalysis(analysis, docs, options);
    const validation = await aiAnalysisPipeline.validateCompleteness(analysis, docs);

    const hasEnrichmentIssue = validation.issues.some(i => i.toLowerCase().includes('enriched') || i.toLowerCase().includes('full text'));
    expect(hasEnrichmentIssue).toBe(true);
  });

  it('suggests full text when only metadata-enriched', async () => {
    const docs = [makeMetadataEnrichedPropDoc()]; // contentFetched but no fullText
    const options = makeOptions();
    let analysis = await aiAnalysisPipeline.analyzeDocuments(docs, options);
    analysis = await aiAnalysisPipeline.refineAnalysis(analysis, docs, options);
    const validation = await aiAnalysisPipeline.validateCompleteness(analysis, docs);

    // enrichedCount should be 1 (metadata-enriched), but suggestions should
    // mention full text since no fullText/fullContent is available.
    expect(analysis.enrichedCount).toBe(1);
    const hasSuggestion = validation.suggestions.some(s => s.toLowerCase().includes('full text'));
    expect(hasSuggestion).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// runAnalysisPipeline — depth-controlled dispatch
// ---------------------------------------------------------------------------

describe('runAnalysisPipeline', () => {
  it('quick depth: runs 1 iteration, no validation', async () => {
    const docs = [makePropDoc()];
    const { analysis, validation, iterationDurationsMs } = await runAnalysisPipeline(docs, makeOptions({ depth: 'quick' }));
    expect(analysis.iterationsCompleted).toBe(1);
    expect(validation).toBeNull();
    expect(iterationDurationsMs).toHaveLength(1);
  });

  it('standard depth: runs 2 iterations, no validation', async () => {
    const docs = [makePropDoc(), makeMotDoc()];
    const { analysis, validation, iterationDurationsMs } = await runAnalysisPipeline(docs, makeOptions({ depth: 'standard' }));
    expect(analysis.iterationsCompleted).toBe(2);
    expect(validation).toBeNull();
    expect(iterationDurationsMs).toHaveLength(2);
  });

  it('deep depth: runs 3 iterations (incl. validation)', async () => {
    const docs = [makePropDoc(), makeBetDoc()];
    const { analysis, validation, iterationDurationsMs } = await runAnalysisPipeline(docs, makeOptions({ depth: 'deep' }));
    expect(analysis.iterationsCompleted).toBe(3);
    expect(validation).not.toBeNull();
    expect(validation?.score).toBeDefined();
    expect(iterationDurationsMs).toHaveLength(3);
  });

  it('deep depth with enriched docs: validation passes', async () => {
    const docs = [makeEnrichedPropDoc(), makeBetDoc(), makeMotDoc()];
    const { validation } = await runAnalysisPipeline(docs, makeOptions({ depth: 'deep' }));
    expect(validation?.passed).toBe(true);
  });

  it('returns analysis in correct language', async () => {
    const docs = [makePropDoc()];
    const { analysis } = await runAnalysisPipeline(docs, makeOptions({ lang: 'sv', depth: 'quick' }));
    expect(analysis.lang).toBe('sv');
  });

  it('includes focusTopic in analysis result', async () => {
    const docs = [makePropDoc()];
    const { analysis } = await runAnalysisPipeline(docs, makeOptions({ focusTopic: 'defence policy', depth: 'quick' }));
    expect(analysis.focusTopic).toBe('defence policy');
  });

  it('handles empty document array gracefully', async () => {
    const { analysis, validation } = await runAnalysisPipeline([], makeOptions({ depth: 'deep' }));
    expect(analysis.documentCount).toBe(0);
    expect(validation).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// SWOT entry content quality
// ---------------------------------------------------------------------------

describe('SWOT entry content quality', () => {
  it('entries from propositions have document title content', async () => {
    const docs = [makePropDoc()];
    const result = await aiAnalysisPipeline.analyzeDocuments(docs, makeOptions());
    const govSh = result.stakeholderSwot.find(sh => sh.role === 'government');
    // Government strength should reference the proposition
    const allText = govSh?.swot.strengths.map(e => e.text).join(' ') ?? '';
    // The text should contain meaningful content about the proposition
    expect(allText.trim().length).toBeGreaterThan(10);
  });

  it('entries from enriched docs have HIGH confidence', async () => {
    const docs = [makeEnrichedPropDoc()];
    const options = makeOptions({ depth: 'standard' });
    const initial = await aiAnalysisPipeline.analyzeDocuments(docs, options);
    const refined = await aiAnalysisPipeline.refineAnalysis(initial, docs, options);

    const allEntries = refined.stakeholderSwot.flatMap(sh => [
      ...sh.swot.strengths,
      ...sh.swot.weaknesses,
      ...sh.swot.opportunities,
      ...sh.swot.threats,
    ]);
    const highConfidence = allEntries.filter(e => e.confidence === 'HIGH');
    expect(highConfidence.length).toBeGreaterThan(0);
  });

  it('placeholder entries have LOW confidence', async () => {
    // Only provide documents that don't match any SWOT quadrant mappings
    const euDoc: RawDocument = { dok_id: 'EU001', doktyp: 'fpm', titel: 'EU faktapromemoria om dataskyddsförordning' };
    const result = await aiAnalysisPipeline.analyzeDocuments([euDoc], makeOptions());

    // Government weaknesses would be empty without bet docs → placeholder
    const govSh = result.stakeholderSwot.find(sh => sh.role === 'government');
    const weakPlaceholders = govSh?.swot.weaknesses.filter(e => e.confidence === 'LOW') ?? [];
    // With no bet docs, government weakness is a placeholder
    expect(weakPlaceholders.length).toBeGreaterThanOrEqual(1);
  });

  it('XSS: pipeline returns plain text; escaping deferred to render site', async () => {
    const xssDoc: RawDocument = {
      dok_id: 'XSS001',
      doktyp: 'prop',
      titel: '<script>alert("xss")</script>',
    };
    const result = await aiAnalysisPipeline.analyzeDocuments([xssDoc], makeOptions());
    const titleEntries = result.stakeholderSwot
      .flatMap(sh => sh.swot.strengths)
      .filter(e => e.sourceDocIds.includes('XSS001'));

    // Pipeline returns plain text for ALL outputs — SWOT entries, mindmap items,
    // dashboard labels, and watch points.  HTML-escaping is the responsibility
    // of downstream renderers (generateStakeholderSwotSection, generateMindmapSection,
    // generateDashboardSection) which call escapeHtml() on all interpolated text.
    // For watch points, the deep-inspection call site in generators.ts escapes
    // AI-derived watch points before passing them to generateWatchSection(),
    // which renders pre-escaped HTML (to stay compatible with extractWatchPoints()
    // which already escapes and injects svSpan() HTML markers).
    for (const entry of titleEntries) {
      expect(entry.text).toContain('<script>');
    }

    // Watch points also return plain text — raw angle brackets are preserved.
    // generators.ts escapes AI watch points at the call site before passing
    // to generateWatchSection().
    const wpDescs = result.watchPoints.map(wp => wp.description);
    const hasRawTitle = wpDescs.some(d => d.includes('<script>'));
    expect(hasRawTitle).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Focus topic behaviour
// ---------------------------------------------------------------------------

describe('focus topic analysis', () => {
  it('topic appears in policy assessment narrative', async () => {
    const docs = [makePropDoc()];
    const result = await aiAnalysisPipeline.analyzeDocuments(docs, makeOptions({ focusTopic: 'cybersecurity' }));
    expect(result.policyAssessment.narrative).toContain('cybersecurity');
  });

  it('topic suffix appears in watch point titles', async () => {
    const docs = [makePropDoc(), makeMotDoc()];
    const result = await aiAnalysisPipeline.analyzeDocuments(docs, makeOptions({ focusTopic: 'defence' }));
    const watchTitlesWithTopic = result.watchPoints.filter(wp => wp.title.includes('defence'));
    expect(watchTitlesWithTopic.length).toBeGreaterThan(0);
  });
});
