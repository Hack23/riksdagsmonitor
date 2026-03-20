/**
 * Comprehensive tests for scripts/ai-analysis/pipeline.ts
 *
 * Pre-PR baseline: 5.35% coverage (29/542 stmts). Target: ≥80%.
 * Tests cover:
 * - aiAnalysisPipeline exported singleton (analyzeDocuments, refineAnalysis, validateCompleteness)
 * - runAnalysisPipeline orchestrator (quick, standard, deep depths)
 * - SWOT generation from document classification (prop, bet, mot, sfs, fpm, skr, pressm, ext)
 * - Policy assessment builder (domains, narrative, confidence)
 * - Watch point generation per document type
 * - Mindmap branch generation
 * - Dashboard data builder (type distribution, source labels)
 * - Confidence scoring based on enrichment levels
 * - Placeholder fallback entries (when no documents exist for a quadrant)
 * - Enrichment levels (metadata-only vs full-text)
 * - Multi-language support (14 languages)
 * - Focus topic integration
 * - Edge cases (empty docs, single doc, no enrichment)
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { aiAnalysisPipeline, runAnalysisPipeline } from '../scripts/ai-analysis/pipeline.js';
import type { RawDocument } from '../scripts/data-transformers/types.js';
import type { AnalysisDepth } from '../scripts/ai-analysis/types.js';

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

// Comprehensive document set representing all classified types
const PROP = makeDoc({ dok_id: 'PROP1', titel: 'Proposition om säkerhet', doktyp: 'prop' });
const PROP2 = makeDoc({ dok_id: 'PROP2', titel: 'Proposition om ekonomi', doktyp: 'prop' });
const BET = makeDoc({ dok_id: 'BET1', titel: 'Betänkande om budget', doktyp: 'bet' });
const BET2 = makeDoc({ dok_id: 'BET2', titel: 'Betänkande om utbildning', doktyp: 'bet' });
const MOT = makeDoc({ dok_id: 'MOT1', titel: 'Motion om klimat', doktyp: 'mot' });
const MOT2 = makeDoc({ dok_id: 'MOT2', titel: 'Motion om arbetslöshet', doktyp: 'mot' });
const FPM = makeDoc({ dok_id: 'FPM1', titel: 'EU-position om handel', doktyp: 'fpm' });
const SFS = makeDoc({ dok_id: 'SFS1', titel: 'SFS 2026:1 Lag om digitalisering', doktyp: 'sfs' });
const SKR = makeDoc({ dok_id: 'SKR1', titel: 'Skrivelse om resultat', doktyp: 'skr' });
const PRESSM = makeDoc({ dok_id: 'PR1', titel: 'Pressmeddelande om reform', doktyp: 'pressm' });
const EXT = makeDoc({ dok_id: 'EXT1', titel: 'External reference on Nordic cooperation', doktyp: 'ext' });
const EU_DOC = makeDoc({ dok_id: 'EU1', titel: 'EU Council position on AI regulation', doktyp: 'eu' });

const ALL_DOCS = [PROP, BET, MOT, FPM, SFS, SKR, PRESSM, EXT];
const RICH_SET = [PROP, PROP2, BET, BET2, MOT, MOT2, FPM, SFS, SKR, PRESSM, EXT, EU_DOC];

// Enriched documents (simulating metadata and full-text enrichment)
const ENRICHED_DOC = makeDoc({
  dok_id: 'ENR1',
  titel: 'Enriched proposition on climate',
  doktyp: 'prop',
  contentFetched: true,
  organ: 'MJU',
  notis: 'Climate change legislation',
});
const FULLTEXT_DOC = makeDoc({
  dok_id: 'FT1',
  titel: 'Full-text proposition on defense',
  doktyp: 'prop',
  contentFetched: true,
  fullText: 'The government proposes strengthening Sweden\'s defense capabilities through increased military spending and enhanced Nordic cooperation within NATO.',
});

// Languages for multi-language tests
const ALL_LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'] as const;

// ===========================================================================
// aiAnalysisPipeline.analyzeDocuments — Iteration 1
// ===========================================================================

describe('aiAnalysisPipeline.analyzeDocuments', () => {
  it('returns a well-formed AnalysisResult for a mixed document set', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments(ALL_DOCS, {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    expect(result).toBeDefined();
    expect(result.iterationsCompleted).toBe(1);
    expect(result.documentCount).toBe(ALL_DOCS.length);
    expect(result.completedAt).toBeTruthy();
    expect(result.lang).toBe('en');
  });

  it('generates three stakeholder SWOT perspectives', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments(ALL_DOCS, {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    expect(result.stakeholderSwot).toHaveLength(3);

    const roles = result.stakeholderSwot.map(s => s.role);
    expect(roles).toContain('government');
    expect(roles).toContain('parliament');
    expect(roles).toContain('private-sector');
  });

  it('produces non-empty SWOT entries for government when propositions exist', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([PROP, PROP2], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const gov = result.stakeholderSwot.find(s => s.role === 'government')!;
    expect(gov.swot.strengths.length).toBeGreaterThan(0);
    // Propositions should drive government strengths with source doc IDs
    expect(gov.swot.strengths.some(e => e.sourceDocIds.length > 0)).toBe(true);
  });

  it('produces non-empty SWOT entries for parliament when committee reports exist', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([BET, BET2, MOT], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const opp = result.stakeholderSwot.find(s => s.role === 'parliament')!;
    expect(opp.swot.strengths.length).toBeGreaterThan(0);
    expect(opp.swot.strengths.some(e => e.sourceDocIds.length > 0)).toBe(true);
  });

  it('generates placeholder entries when document types are missing', async () => {
    // Only propositions — parliament and private-sector need placeholders
    const result = await aiAnalysisPipeline.analyzeDocuments([PROP], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const parliament = result.stakeholderSwot.find(s => s.role === 'parliament')!;
    // Weaknesses and opportunities should be placeholder-filled (no bet/mot for them)
    const weakEntry = parliament.swot.weaknesses[0];
    expect(weakEntry).toBeDefined();
    // Placeholders have empty sourceDocIds
    expect(weakEntry!.sourceDocIds).toHaveLength(0);
    expect(weakEntry!.confidence).toBe('LOW');
  });

  it('integrates focus topic into SWOT entries', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([PROP], {
      depth: 'quick',
      lang: 'en',
      focusTopic: 'climate change',
    });

    expect(result.focusTopic).toBe('climate change');

    // At least one entry should reference the focus topic
    const allEntries = result.stakeholderSwot.flatMap(s => [
      ...s.swot.strengths,
      ...s.swot.weaknesses,
      ...s.swot.opportunities,
      ...s.swot.threats,
    ]);
    const hasTopicRef = allEntries.some(e =>
      e.text.includes('climate change') || e.text.includes('climate')
    );
    expect(hasTopicRef).toBe(true);
  });

  it('builds policy assessment with detected domains', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments(RICH_SET, {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    expect(result.policyAssessment).toBeDefined();
    expect(result.policyAssessment.narrative).toBeTruthy();
    expect(result.policyAssessment.confidence).toBeTruthy();
  });

  it('generates watch points for proposition documents', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([PROP, PROP2], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    expect(result.watchPoints.length).toBeGreaterThan(0);
    const propWatch = result.watchPoints.find(wp =>
      wp.title.toLowerCase().includes('proposition')
    );
    expect(propWatch).toBeDefined();
    expect(propWatch!.urgency).toBe('high');
  });

  it('generates watch points for committee report documents', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([BET, BET2], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const betWatch = result.watchPoints.find(wp =>
      wp.title.toLowerCase().includes('committee')
    );
    expect(betWatch).toBeDefined();
    expect(betWatch!.urgency).toBe('high');
  });

  it('generates watch points for SFS (enacted law) documents', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([SFS], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const sfsWatch = result.watchPoints.find(wp =>
      wp.title.toLowerCase().includes('enacted') || wp.title.toLowerCase().includes('law')
    );
    expect(sfsWatch).toBeDefined();
    expect(sfsWatch!.urgency).toBe('critical');
  });

  it('builds mindmap branches from document analysis', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments(ALL_DOCS, {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    expect(result.mindmapBranches.length).toBeGreaterThan(0);
    // Each branch should have a label, color, icon, and items
    for (const branch of result.mindmapBranches) {
      expect(branch.label).toBeTruthy();
      expect(branch.color).toBeTruthy();
      expect(branch.icon).toBeTruthy();
      expect(Array.isArray(branch.items)).toBe(true);
    }
  });

  it('builds dashboard data with type distribution', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments(ALL_DOCS, {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    expect(result.dashboardData).toBeDefined();
    expect(result.dashboardData.typeDistribution).toBeDefined();
    expect(result.dashboardData.typeDistribution.length).toBeGreaterThan(0);
    // Each type distribution entry should have label, value, and color
    for (const td of result.dashboardData.typeDistribution) {
      expect(td.label).toBeTruthy();
      expect(typeof td.value).toBe('number');
      expect(td.color).toBeTruthy();
    }
  });

  it('calculates a confidence score between 0 and 100', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments(ALL_DOCS, {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.confidenceScore).toBeLessThanOrEqual(100);
  });

  it('returns higher confidence for enriched documents', async () => {
    const plainResult = await aiAnalysisPipeline.analyzeDocuments([PROP], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const enrichedResult = await aiAnalysisPipeline.analyzeDocuments([ENRICHED_DOC], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    expect(enrichedResult.enrichedCount).toBeGreaterThan(plainResult.enrichedCount);
  });

  it('detects SFS documents by dokumentnamn when doktyp is absent', async () => {
    const sfsByName = makeDoc({
      dok_id: 'SFS-NAME1',
      titel: 'Lag om cybersäkerhet',
      doktyp: '', // Missing doktyp
      dokumentnamn: 'SFS 2026:42',
    });

    const result = await aiAnalysisPipeline.analyzeDocuments([sfsByName], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    // Should detect as SFS and generate a critical watch point
    const sfsWatch = result.watchPoints.find(wp =>
      wp.title.toLowerCase().includes('enacted') || wp.title.toLowerCase().includes('law')
    );
    expect(sfsWatch).toBeDefined();
  });

  it('handles EU-type documents normalized as FPM', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([EU_DOC], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    // EU docs should contribute to government opportunities
    const gov = result.stakeholderSwot.find(s => s.role === 'government')!;
    const hasEuBacked = gov.swot.opportunities.some(e =>
      e.sourceDocIds.includes('EU1')
    );
    expect(hasEuBacked).toBe(true);
  });
});

// ===========================================================================
// aiAnalysisPipeline.analyzeDocuments — Multi-language
// ===========================================================================

describe('aiAnalysisPipeline.analyzeDocuments — multi-language', () => {
  for (const lang of ALL_LANGUAGES) {
    it(`produces non-empty stakeholder names in ${lang}`, async () => {
      const result = await aiAnalysisPipeline.analyzeDocuments([PROP, BET], {
        depth: 'quick',
        lang,
        focusTopic: null,
      });

      for (const sh of result.stakeholderSwot) {
        expect(sh.name).toBeTruthy();
        expect(sh.name.length).toBeGreaterThan(2);
      }
    });
  }

  it('generates watch point titles in Swedish', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([PROP, BET, SFS], {
      depth: 'quick',
      lang: 'sv',
      focusTopic: null,
    });

    const propWatch = result.watchPoints.find(wp =>
      wp.title.includes('proposition')
    );
    expect(propWatch).toBeDefined();
  });

  it('generates policy assessment narrative in Japanese', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments(ALL_DOCS, {
      depth: 'quick',
      lang: 'ja',
      focusTopic: null,
    });

    expect(result.policyAssessment.narrative).toBeTruthy();
    // Should contain Japanese characters
    expect(/[\u3000-\u9FFF]/.test(result.policyAssessment.narrative)).toBe(true);
  });
});

// ===========================================================================
// aiAnalysisPipeline.refineAnalysis — Iteration 2
// ===========================================================================

describe('aiAnalysisPipeline.refineAnalysis', () => {
  it('refines initial analysis and bumps iteration count', async () => {
    const initial = await aiAnalysisPipeline.analyzeDocuments(ALL_DOCS, {
      depth: 'standard',
      lang: 'en',
      focusTopic: null,
    });

    const refined = await aiAnalysisPipeline.refineAnalysis(initial, ALL_DOCS, {
      depth: 'standard',
      lang: 'en',
      focusTopic: null,
    });

    expect(refined.iterationsCompleted).toBe(2);
  });

  it('enriches SWOT entries from full-text documents', async () => {
    const docsWithFullText = [FULLTEXT_DOC, BET, MOT];

    const initial = await aiAnalysisPipeline.analyzeDocuments(docsWithFullText, {
      depth: 'standard',
      lang: 'en',
      focusTopic: null,
    });

    const refined = await aiAnalysisPipeline.refineAnalysis(initial, docsWithFullText, {
      depth: 'standard',
      lang: 'en',
      focusTopic: null,
    });

    expect(refined.enrichedCount).toBeGreaterThanOrEqual(initial.enrichedCount);
  });

  it('handles no-fulltext gracefully (metadata-only refinement)', async () => {
    const initial = await aiAnalysisPipeline.analyzeDocuments(ALL_DOCS, {
      depth: 'standard',
      lang: 'en',
      focusTopic: null,
    });

    // No full-text docs — refinement should not crash
    const refined = await aiAnalysisPipeline.refineAnalysis(initial, ALL_DOCS, {
      depth: 'standard',
      lang: 'en',
      focusTopic: null,
    });

    expect(refined).toBeDefined();
    expect(refined.iterationsCompleted).toBe(2);
  });
});

// ===========================================================================
// aiAnalysisPipeline.validateCompleteness — Iteration 3
// ===========================================================================

describe('aiAnalysisPipeline.validateCompleteness', () => {
  it('returns a validation result with score', async () => {
    const analysis = await aiAnalysisPipeline.analyzeDocuments(ALL_DOCS, {
      depth: 'deep',
      lang: 'en',
      focusTopic: null,
    });

    const validation = await aiAnalysisPipeline.validateCompleteness(analysis, ALL_DOCS);

    expect(validation).toBeDefined();
    expect(typeof validation.score).toBe('number');
    expect(validation.score).toBeGreaterThanOrEqual(0);
    expect(validation.score).toBeLessThanOrEqual(100);
    expect(typeof validation.passed).toBe('boolean');
    expect(Array.isArray(validation.issues)).toBe(true);
    expect(Array.isArray(validation.suggestions)).toBe(true);
  });

  it('detects missing enrichment as an issue', async () => {
    const analysis = await aiAnalysisPipeline.analyzeDocuments([PROP], {
      depth: 'deep',
      lang: 'en',
      focusTopic: null,
    });

    const validation = await aiAnalysisPipeline.validateCompleteness(analysis, [PROP]);

    // Non-enriched docs should trigger an issue about limited quality
    expect(validation.issues.some(i => i.toLowerCase().includes('enrich'))).toBe(true);
  });

  it('gives higher score for enriched document set', async () => {
    const enrichedDocs = [ENRICHED_DOC, FULLTEXT_DOC, BET, MOT, SFS];

    const analysis = await aiAnalysisPipeline.analyzeDocuments(enrichedDocs, {
      depth: 'deep',
      lang: 'en',
      focusTopic: null,
    });

    const validation = await aiAnalysisPipeline.validateCompleteness(analysis, enrichedDocs);

    // Enriched set should score reasonably well
    expect(validation.score).toBeGreaterThan(50);
  });

  it('flags low confidence score', async () => {
    // Single doc with no enrichment → low confidence
    const analysis = await aiAnalysisPipeline.analyzeDocuments(
      [makeDoc({ dok_id: 'X1', titel: 'X', doktyp: 'other' })],
      { depth: 'deep', lang: 'en', focusTopic: null },
    );

    const validation = await aiAnalysisPipeline.validateCompleteness(
      analysis,
      [makeDoc({ dok_id: 'X1', titel: 'X', doktyp: 'other' })],
    );

    // Should flag issues or at least have a reduced score
    expect(validation.score).toBeLessThan(100);
  });
});

// ===========================================================================
// runAnalysisPipeline — full orchestrator
// ===========================================================================

describe('runAnalysisPipeline', () => {
  it('runs quick depth (1 iteration only)', async () => {
    const { analysis, validation, iterationDurationsMs } = await runAnalysisPipeline(ALL_DOCS, {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    expect(analysis.iterationsCompleted).toBe(1);
    expect(validation).toBeNull();
    expect(iterationDurationsMs).toHaveLength(1);
  });

  it('runs standard depth (2 iterations)', async () => {
    const { analysis, validation, iterationDurationsMs } = await runAnalysisPipeline(ALL_DOCS, {
      depth: 'standard',
      lang: 'en',
      focusTopic: null,
    });

    expect(analysis.iterationsCompleted).toBe(2);
    expect(validation).toBeNull();
    expect(iterationDurationsMs).toHaveLength(2);
  });

  it('runs deep depth (3 iterations with validation)', async () => {
    const { analysis, validation, iterationDurationsMs } = await runAnalysisPipeline(ALL_DOCS, {
      depth: 'deep',
      lang: 'en',
      focusTopic: null,
    });

    expect(analysis.iterationsCompleted).toBe(3);
    expect(validation).not.toBeNull();
    expect(validation!.score).toBeDefined();
    expect(iterationDurationsMs).toHaveLength(3);
  });

  it('includes timing data for each iteration', async () => {
    const { iterationDurationsMs } = await runAnalysisPipeline(ALL_DOCS, {
      depth: 'deep',
      lang: 'en',
      focusTopic: null,
    });

    for (const ms of iterationDurationsMs) {
      expect(typeof ms).toBe('number');
      expect(ms).toBeGreaterThanOrEqual(0);
    }
  });

  it('passes focus topic through all iterations', async () => {
    const { analysis } = await runAnalysisPipeline(ALL_DOCS, {
      depth: 'deep',
      lang: 'en',
      focusTopic: 'defense policy',
    });

    expect(analysis.focusTopic).toBe('defense policy');
  });
});

// ===========================================================================
// Edge cases
// ===========================================================================

describe('ai-analysis pipeline — edge cases', () => {
  it('handles empty document array', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    expect(result.documentCount).toBe(0);
    expect(result.stakeholderSwot).toHaveLength(3);
    // All entries should be placeholder-filled
    for (const sh of result.stakeholderSwot) {
      expect(sh.swot.strengths.length).toBeGreaterThan(0);
      expect(sh.swot.weaknesses.length).toBeGreaterThan(0);
    }
  });

  it('handles single document gracefully', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([PROP], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    expect(result.documentCount).toBe(1);
    expect(result.stakeholderSwot).toHaveLength(3);
  });

  it('handles documents with missing titles', async () => {
    const noTitle = makeDoc({ dok_id: 'NT1', titel: '', title: '', doktyp: 'prop' });

    const result = await aiAnalysisPipeline.analyzeDocuments([noTitle], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    expect(result).toBeDefined();
    expect(result.documentCount).toBe(1);
  });

  it('handles documents with unknown type', async () => {
    const unknown = makeDoc({ dok_id: 'UNK1', titel: 'Unknown type', doktyp: 'xyz' });

    const result = await aiAnalysisPipeline.analyzeDocuments([unknown], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    expect(result).toBeDefined();
    expect(result.stakeholderSwot).toHaveLength(3);
  });

  it('runAnalysisPipeline handles empty docs at all depths', async () => {
    for (const depth of ['quick', 'standard', 'deep'] as AnalysisDepth[]) {
      const { analysis } = await runAnalysisPipeline([], {
        depth,
        lang: 'en',
        focusTopic: null,
      });
      expect(analysis).toBeDefined();
      expect(analysis.documentCount).toBe(0);
    }
  });
});

// ===========================================================================
// Political intelligence quality assertions
// ===========================================================================

describe('political intelligence quality', () => {
  it('SWOT entries have proper impact ratings', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments(RICH_SET, {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    for (const sh of result.stakeholderSwot) {
      const allEntries = [
        ...sh.swot.strengths,
        ...sh.swot.weaknesses,
        ...sh.swot.opportunities,
        ...sh.swot.threats,
      ];
      for (const entry of allEntries) {
        expect(['high', 'medium', 'low']).toContain(entry.impact);
        expect(['HIGH', 'MEDIUM', 'LOW']).toContain(entry.confidence);
      }
    }
  });

  it('propositions receive high impact rating', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([PROP], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const gov = result.stakeholderSwot.find(s => s.role === 'government')!;
    const propEntry = gov.swot.strengths.find(e =>
      e.sourceDocIds.includes('PROP1')
    );
    expect(propEntry).toBeDefined();
    expect(propEntry!.impact).toBe('high');
  });

  it('motions receive medium impact rating', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([MOT], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const gov = result.stakeholderSwot.find(s => s.role === 'government')!;
    const motEntry = gov.swot.threats.find(e =>
      e.sourceDocIds.includes('MOT1')
    );
    expect(motEntry).toBeDefined();
    expect(motEntry!.impact).toBe('medium');
  });

  it('full-text documents receive HIGH confidence', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([FULLTEXT_DOC], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const gov = result.stakeholderSwot.find(s => s.role === 'government')!;
    const ftEntry = gov.swot.strengths.find(e =>
      e.sourceDocIds.includes('FT1')
    );
    expect(ftEntry).toBeDefined();
    expect(ftEntry!.confidence).toBe('HIGH');
  });

  it('metadata-enriched documents receive MEDIUM confidence', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([ENRICHED_DOC], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const gov = result.stakeholderSwot.find(s => s.role === 'government')!;
    const entry = gov.swot.strengths.find(e =>
      e.sourceDocIds.includes('ENR1')
    );
    expect(entry).toBeDefined();
    expect(entry!.confidence).toBe('MEDIUM');
  });

  it('watch points include source document IDs for traceability (type-based points)', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([PROP, BET, SFS], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    // Type-based watch points (propositions, committee reports, SFS) should have sourceDocIds
    const typeBasedPoints = result.watchPoints.filter(wp =>
      wp.title.toLowerCase().includes('proposition') ||
      wp.title.toLowerCase().includes('committee') ||
      wp.title.toLowerCase().includes('enacted')
    );
    expect(typeBasedPoints.length).toBeGreaterThan(0);
    for (const wp of typeBasedPoints) {
      expect(wp.sourceDocIds.length).toBeGreaterThan(0);
    }
  });

  it('dashboard data includes title and summary', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments(ALL_DOCS, {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    expect(result.dashboardData.title).toBeTruthy();
    expect(result.dashboardData.summary).toBeTruthy();
    expect(result.dashboardData.typeDistribution.length).toBeGreaterThan(0);
  });

  it('deep analysis provides richer output than quick', async () => {
    const { analysis: quickResult } = await runAnalysisPipeline(RICH_SET, {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const { analysis: deepResult, validation } = await runAnalysisPipeline(RICH_SET, {
      depth: 'deep',
      lang: 'en',
      focusTopic: null,
    });

    // Deep should have more iterations completed
    expect(deepResult.iterationsCompleted).toBeGreaterThan(quickResult.iterationsCompleted);
    // Deep should include validation
    expect(validation).not.toBeNull();
  });
});

// ===========================================================================
// SWOT classification correctness
// ===========================================================================

describe('SWOT document classification', () => {
  it('classifies propositions as government strengths', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([PROP], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const gov = result.stakeholderSwot.find(s => s.role === 'government')!;
    expect(gov.swot.strengths.some(e => e.sourceDocIds.includes('PROP1'))).toBe(true);
  });

  it('classifies committee reports as parliament strengths', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([BET], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const parl = result.stakeholderSwot.find(s => s.role === 'parliament')!;
    expect(parl.swot.strengths.some(e => e.sourceDocIds.includes('BET1'))).toBe(true);
  });

  it('classifies motions as both parliament strengths and government threats', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([MOT], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const gov = result.stakeholderSwot.find(s => s.role === 'government')!;
    const parl = result.stakeholderSwot.find(s => s.role === 'parliament')!;

    expect(gov.swot.threats.some(e => e.sourceDocIds.includes('MOT1'))).toBe(true);
    expect(parl.swot.strengths.some(e => e.sourceDocIds.includes('MOT1'))).toBe(true);
  });

  it('classifies SFS documents as government strengths', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([SFS], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const gov = result.stakeholderSwot.find(s => s.role === 'government')!;
    expect(gov.swot.strengths.some(e => e.sourceDocIds.includes('SFS1'))).toBe(true);
  });

  it('classifies EU/FPM as government opportunities and private-sector opportunities', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([FPM], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const gov = result.stakeholderSwot.find(s => s.role === 'government')!;
    const priv = result.stakeholderSwot.find(s => s.role === 'private-sector')!;

    expect(gov.swot.opportunities.some(e => e.sourceDocIds.includes('FPM1'))).toBe(true);
    expect(priv.swot.opportunities.some(e => e.sourceDocIds.includes('FPM1'))).toBe(true);
  });

  it('classifies government communications (skr) as government strengths', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([SKR], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const gov = result.stakeholderSwot.find(s => s.role === 'government')!;
    expect(gov.swot.strengths.some(e => e.sourceDocIds.includes('SKR1'))).toBe(true);
  });

  it('classifies press releases as government strengths', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([PRESSM], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const gov = result.stakeholderSwot.find(s => s.role === 'government')!;
    expect(gov.swot.strengths.some(e => e.sourceDocIds.includes('PR1'))).toBe(true);
  });

  it('classifies external references as private-sector strengths', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([EXT], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const priv = result.stakeholderSwot.find(s => s.role === 'private-sector')!;
    expect(priv.swot.strengths.some(e => e.sourceDocIds.includes('EXT1'))).toBe(true);
  });
});

// ===========================================================================
// Interpellation document classification tests
// ===========================================================================

describe('interpellation document classification', () => {
  const IP1 = makeDoc({ dok_id: 'IP1', titel: 'Interpellation om äldreomsorgen', doktyp: 'ip' });
  const IP2 = makeDoc({ dok_id: 'IP2', titel: 'Interpellation om försvaret', doktyp: 'ip' });
  const IP3 = makeDoc({ dok_id: 'IP3', titel: 'Interpellation om energipolitik', doktyp: 'ip' });

  it('classifies interpellations as government weaknesses', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([IP1, IP2], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const gov = result.stakeholderSwot.find(s => s.role === 'government')!;
    expect(gov.swot.weaknesses.some(e => e.sourceDocIds.includes('IP1'))).toBe(true);
  });

  it('classifies interpellations as parliament strengths', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([IP1, IP2], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const parl = result.stakeholderSwot.find(s => s.role === 'parliament')!;
    expect(parl.swot.strengths.some(e => e.sourceDocIds.includes('IP1'))).toBe(true);
  });

  it('generates interpellation watch points', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([IP1, IP2, IP3], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const ipWatch = result.watchPoints.find(wp =>
      wp.title.toLowerCase().includes('interpellation')
    );
    expect(ipWatch).toBeDefined();
    expect(ipWatch!.sourceDocIds.length).toBe(3);
  });

  it('marks interpellation watch point as high urgency when >= 5 interpellations', async () => {
    const manyIps = Array.from({ length: 6 }, (_, i) =>
      makeDoc({ dok_id: `IP${i}`, titel: `Interpellation ${i}`, doktyp: 'ip' })
    );

    const result = await aiAnalysisPipeline.analyzeDocuments(manyIps, {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const ipWatch = result.watchPoints.find(wp =>
      wp.title.toLowerCase().includes('interpellation')
    );
    expect(ipWatch).toBeDefined();
    expect(ipWatch!.urgency).toBe('high');
  });

  it('generates interpellation watch point labels in Swedish', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([IP1], {
      depth: 'quick',
      lang: 'sv',
      focusTopic: null,
    });

    const ipWatch = result.watchPoints.find(wp =>
      wp.title.includes('Interpellation')
    );
    expect(ipWatch).toBeDefined();
    expect(ipWatch!.title).toContain('Ministeransvar');
  });

  it('gives interpellations medium impact rating', async () => {
    const result = await aiAnalysisPipeline.analyzeDocuments([IP1], {
      depth: 'quick',
      lang: 'en',
      focusTopic: null,
    });

    const gov = result.stakeholderSwot.find(s => s.role === 'government')!;
    const ipEntry = gov.swot.weaknesses.find(e =>
      e.sourceDocIds.includes('IP1')
    );
    expect(ipEntry).toBeDefined();
    expect(ipEntry!.impact).toBe('medium');
  });
});
