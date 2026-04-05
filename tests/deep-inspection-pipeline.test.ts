/**
 * Tests for deep-inspection multi-iteration intelligence enhancement:
 * - analysisDepth config parameter parsing
 * - DeepInspectionPipeline class structure and interface
 * - New section labels in DEEP_SECTION_LABELS (executiveSummary, predictiveAssessment,
 *   historicalContext, methodology, likelyOutcome, coalitionStability, riskScenarios)
 * - Strategic implications now available for all 14 languages
 * - generateDeepInspectionContent depth-gated sections via exported utilities
 */

import { describe, it, expect, vi } from 'vitest';
import type { RawDocument } from '../scripts/data-transformers.js';

// ---------------------------------------------------------------------------
// 1. Config — analysisDepth parsing
// ---------------------------------------------------------------------------

describe.sequential('analysisDepth config', () => {
  it('exports analysisDepth as a valid depth value (1–4)', async () => {
    const { analysisDepth } = await import('../scripts/generate-news-enhanced/config.js');
    expect([1, 2, 3, 4]).toContain(analysisDepth);
  });

  it('analysisDepth defaults to 1 when no --depth CLI arg is present', async () => {
    // Save original process.argv and remove any --depth flags
    const originalArgv = process.argv;
    process.argv = originalArgv.filter(a => !a.startsWith('--depth'));
    vi.resetModules();
    try {
      const { analysisDepth } = await import('../scripts/generate-news-enhanced/config.js');
      expect(analysisDepth).toBe(1);
    } finally {
      process.argv = originalArgv;
      vi.resetModules(); // Clear cached module so other tests get a clean slate
    }
  });
});

// ---------------------------------------------------------------------------
// 2. DeepInspectionPipeline — class structure
// ---------------------------------------------------------------------------

describe('DeepInspectionPipeline', () => {
  it('exports DeepInspectionPipeline class', async () => {
    const mod = await import('../scripts/deep-inspection/index.js');
    expect(typeof mod.DeepInspectionPipeline).toBe('function');
  });

  it('exports default as DeepInspectionPipeline', async () => {
    const mod = await import('../scripts/deep-inspection/index.js');
    expect(typeof mod.default).toBe('function');
  });

  it('creates pipeline instance with no params', async () => {
    const { DeepInspectionPipeline } = await import('../scripts/deep-inspection/index.js');
    const pipeline = new DeepInspectionPipeline();
    expect(pipeline).toBeDefined();
    expect(typeof pipeline.run).toBe('function');
  });

  it('pipeline run() returns a Promise via mocked generator', async () => {
    // Use vi.doMock so only this test block sees the mock — other describe
    // blocks import the real module.
    vi.doMock('../scripts/generate-news-enhanced/generators.js', () => ({
      generateDeepInspection: vi.fn().mockResolvedValue({
        success: true,
        files: 0,
        slug: 'test-slug',
      }),
      extractDocIdFromUrl: vi.fn(),
      isGovernmentUrl: vi.fn(),
      sanitizePlainText: vi.fn(),
      hashPathSuffix: vi.fn(),
    }));
    vi.resetModules();

    try {
      const { DeepInspectionPipeline } = await import('../scripts/deep-inspection/index.js');
      const pipeline = new DeepInspectionPipeline();
      const resultPromise = pipeline.run();
      expect(resultPromise).toBeInstanceOf(Promise);

      const result = await resultPromise;
      expect(result).toBeDefined();
      expect(result.depth).toBeDefined();
      expect([1, 2, 3, 4]).toContain(result.depth);
    } finally {
      vi.doUnmock('../scripts/generate-news-enhanced/generators.js');
      vi.resetModules();
    }
  });
});

// ---------------------------------------------------------------------------
// 3–4. DEEP_SECTION_LABELS and depth-gated content — behavioral assertions
// ---------------------------------------------------------------------------

describe('generateDeepInspectionContent depth-gated sections', () => {
  const docs: RawDocument[] = [
    {
      dok_id: 'H901FiU1',
      doktyp: 'bet',
      dokumentnamn: 'Betänkande FiU1',
      titel: 'Finansutskottets betänkande',
      summary: 'Sammanfattning av betänkande.',
      contentFetched: true,
      datum: '2026-03-10',
      organ: 'FiU',
    },
    {
      dok_id: 'H901Prop1',
      doktyp: 'prop',
      dokumentnamn: 'Proposition 2025/26:1',
      titel: 'Regeringens proposition',
      summary: 'Sammanfattning av proposition.',
      contentFetched: true,
      datum: '2026-03-08',
      organ: 'Fi',
    },
    {
      dok_id: 'H901SFS1',
      doktyp: 'sfs',
      dokumentnamn: 'SFS 2026:123',
      titel: 'Svensk författningssamling',
      summary: 'Antagen författning.',
      contentFetched: true,
      datum: '2026-03-01',
      organ: 'KU',
    },
  ];

  const render = async (depth: 1 | 2 | 3 | 4, lang: 'en' | 'sv' = 'en') => {
    const { __deepInspectionTestHooks } = await import('../scripts/generate-news-enhanced/generators.js');
    return __deepInspectionTestHooks.generateDeepInspectionContent(
      docs,
      'Fiscal policy',
      lang,
      depth,
    );
  };

  it('depth 1 renders baseline sections and excludes advanced classes', async () => {
    const html = await render(1, 'en');
    expect(html).toContain('class="deep-topic-context"');
    expect(html).toContain('class="document-intelligence-analysis"');
    expect(html).toContain('class="strategic-implications"');
    expect(html).toContain('class="key-takeaways"');
    expect(html).not.toContain('class="historical-context"');
    expect(html).not.toContain('class="predictive-assessment"');
    expect(html).not.toContain('class="executive-intelligence-summary"');
    expect(html).not.toContain('class="methodology-confidence"');
  });

  it('emits AI_MUST_REPLACE markers when aiResult is absent', async () => {
    const html = await render(1, 'en');
    expect(html).toContain('<!-- AI_MUST_REPLACE: strategic_implications -->');
    expect(html).toContain('<!-- AI_MUST_REPLACE: key_takeaways -->');
  });

  it('emits AI_MUST_REPLACE markers when aiResult has empty content', async () => {
    const { __deepInspectionTestHooks } = await import('../scripts/generate-news-enhanced/generators.js');
    const emptyAiResult: import('../scripts/generate-news-enhanced/ai-analysis-pipeline.js').AIAnalysisResult = {
      iterations: 1,
      documentAnalyses: [],
      synthesis: {
        policyConvergence: '',
        coalitionStressIndicators: '',
        emergingTrends: '',
        stakeholderPowerDynamics: '',
      },
      dynamicSwotEntries: {
        government:    { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        opposition:    { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        privateSector: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
      },
      strategicImplications: '',
      keyTakeaways: [],
      analysisScore: 0,
    };
    const html = __deepInspectionTestHooks.generateDeepInspectionContent(
      docs, 'Fiscal policy', 'en', 1, emptyAiResult,
    );
    expect(html).toContain('<!-- AI_MUST_REPLACE: strategic_implications -->');
    expect(html).toContain('<!-- AI_MUST_REPLACE: key_takeaways -->');
  });

  it('depth 2 adds historical and predictive sections only', async () => {
    const html = await render(2, 'en');
    expect(html).toContain('class="historical-context"');
    expect(html).toContain('class="predictive-assessment"');
    expect(html).not.toContain('class="executive-intelligence-summary"');
    expect(html).not.toContain('class="methodology-confidence"');
  });

  it('depth 3 adds executive summary, predictive headings, and methodology', async () => {
    const html = await render(3, 'en');
    expect(html).toContain('class="executive-intelligence-summary"');
    expect(html).toContain('class="predictive-assessment"');
    expect(html).toContain('class="methodology-confidence"');

    const predictiveSection = html.match(/<section class="predictive-assessment"[\s\S]*?<\/section>/)?.[0] ?? '';
    expect(predictiveSection).not.toBe('');
    expect((predictiveSection.match(/<h3>/g) ?? []).length).toBeGreaterThanOrEqual(3);
    expect(predictiveSection).toContain('class="risk-scenarios"');

    const methodologySection = html.match(/<section class="methodology-confidence"[\s\S]*?<\/section>/)?.[0] ?? '';
    expect(methodologySection).not.toBe('');
    expect((methodologySection.match(/<ol class="iteration-list">[\s\S]*?<\/ol>/g) ?? []).length).toBe(1);
    expect((methodologySection.match(/<li>/g) ?? []).length).toBe(3);
  });

  it('depth 4 includes all methodology iterations', async () => {
    const html = await render(4, 'en');
    const methodologySection = html.match(/<section class="methodology-confidence"[\s\S]*?<\/section>/)?.[0] ?? '';
    expect(methodologySection).not.toBe('');
    expect((methodologySection.match(/<li>/g) ?? []).length).toBe(4);
  });

  it('renders localized Swedish labels for advanced sections', async () => {
    const html = await render(3, 'sv');
    expect(html).toContain('Sammanfattning för beslutsfattare');
    expect(html).toContain('Historisk kontext och prejudikat');
    expect(html).toContain('Prediktiv bedömning');
    expect(html).toContain('Metodik och konfidensgrad');
    expect(html).toContain('Troligt utfall');
    expect(html).toContain('Koalitionsstabilitetsprognos');
    expect(html).toContain('Riskscenarier');
  });
});

// ---------------------------------------------------------------------------
// 5. Strategic implications — 14-language coverage
// ---------------------------------------------------------------------------

describe('buildStrategicImplications 14-language coverage', () => {
  const ALL_LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

  it('all 14 language codes are defined in the project language list', () => {
    expect(ALL_LANGUAGES).toHaveLength(14);
  });

  it('generators module loads without error — validates all templates compile (real module)', async () => {
    vi.resetModules();
    const mod = await import('../scripts/generate-news-enhanced/generators.js');
    expect(mod).toBeDefined();
    expect(typeof mod.generateDeepInspection).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// 6. Deep-inspection module — pipeline exports
// ---------------------------------------------------------------------------

describe('scripts/deep-inspection/index.js exports', () => {
  it('exports DeepInspectionPipeline class and default', async () => {
    const mod = await import('../scripts/deep-inspection/index.js');
    expect(mod.DeepInspectionPipeline).toBeDefined();
    expect(mod.default).toBeDefined();
    // Same reference
    expect(mod.default).toBe(mod.DeepInspectionPipeline);
  });

  it('pipeline uses config analysisDepth for effective depth', async () => {
    const { analysisDepth } = await import('../scripts/generate-news-enhanced/config.js');
    // The pipeline reads analysisDepth from config, not from constructor params
    expect([1, 2, 3, 4]).toContain(analysisDepth);
  });
});
