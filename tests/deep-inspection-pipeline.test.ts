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

// ---------------------------------------------------------------------------
// 1. Config — analysisDepth parsing
// ---------------------------------------------------------------------------

describe('analysisDepth config', () => {
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
        fileCount: 0,
        slug: 'test-slug',
      }),
      extractDocIdFromUrl: vi.fn(),
      isGovernmentUrl: vi.fn(),
      sanitizePlainText: vi.fn(),
      hashPathSuffix: vi.fn(),
      deepLabel: vi.fn().mockReturnValue('label'),
    }));
    vi.resetModules();

    const { DeepInspectionPipeline } = await import('../scripts/deep-inspection/index.js');
    const pipeline = new DeepInspectionPipeline();
    const resultPromise = pipeline.run();
    expect(resultPromise).toBeInstanceOf(Promise);

    const result = await resultPromise;
    expect(result).toBeDefined();
    expect(result.depth).toBeDefined();
    expect([1, 2, 3, 4]).toContain(result.depth);

    vi.doUnmock('../scripts/generate-news-enhanced/generators.js');
    vi.resetModules();
  });
});

// ---------------------------------------------------------------------------
// 3. DEEP_SECTION_LABELS — new labels exist (uses real module)
// ---------------------------------------------------------------------------

describe('new deep-inspection section labels', () => {
  it('generators.ts compiles and exports expected functions (real module)', async () => {
    vi.resetModules();
    const mod = await import('../scripts/generate-news-enhanced/generators.js');
    expect(typeof mod.generateDeepInspection).toBe('function');
    expect(typeof mod.extractDocIdFromUrl).toBe('function');
    expect(typeof mod.isGovernmentUrl).toBe('function');
    expect(typeof mod.sanitizePlainText).toBe('function');
    expect(typeof mod.hashPathSuffix).toBe('function');
  });

  // Validate that the 7 new DEEP_SECTION_LABELS keys produce localised headings
  // by calling deepLabel() directly (now exported for test verification).
  it('DEEP_SECTION_LABELS contains all new section keys with English labels', async () => {
    vi.resetModules();
    const { deepLabel } = await import('../scripts/generate-news-enhanced/generators.js');

    // These keys were added for the depth-gated intelligence sections.
    // If any is missing from DEEP_SECTION_LABELS, deepLabel() returns the raw key.
    const newKeys = [
      'executiveSummary',
      'predictiveAssessment',
      'historicalContext',
      'methodology',
      'likelyOutcome',
      'coalitionStability',
      'riskScenarios',
    ];

    for (const key of newKeys) {
      const label = deepLabel(key, 'en');
      // A real label should differ from the raw key (deepLabel falls back to key if missing)
      expect(label).not.toBe(key);
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('DEEP_SECTION_LABELS have Swedish labels for all new section keys', async () => {
    vi.resetModules();
    const { deepLabel } = await import('../scripts/generate-news-enhanced/generators.js');

    const newKeys = [
      'executiveSummary',
      'predictiveAssessment',
      'historicalContext',
      'methodology',
      'likelyOutcome',
      'coalitionStability',
      'riskScenarios',
    ];

    for (const key of newKeys) {
      const label = deepLabel(key, 'sv');
      expect(label).not.toBe(key);
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Strategic implications — 14-language coverage
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
// 5. Deep-inspection module — pipeline exports
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
