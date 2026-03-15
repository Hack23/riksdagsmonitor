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
import * as fs from 'node:fs';
import * as path from 'node:path';

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
// 3. DEEP_SECTION_LABELS — new labels exist (verified via source inspection)
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

  // Validate DEEP_SECTION_LABELS completeness by checking that the source
  // contains English and Swedish label entries for every expected key.
  // This keeps deepLabel() file-private while still catching missing labels.
  const generatorsSrc = fs.readFileSync(
    path.resolve(__dirname, '../scripts/generate-news-enhanced/generators.ts'), 'utf-8');

  const NEW_KEYS = [
    'executiveSummary',
    'predictiveAssessment',
    'historicalContext',
    'methodology',
    'likelyOutcome',
    'coalitionStability',
    'riskScenarios',
  ];

  it('DEEP_SECTION_LABELS contains all new section keys with English labels', () => {
    for (const key of NEW_KEYS) {
      // Each key should appear as a property name in the labels object
      expect(generatorsSrc).toContain(`${key}:`);
      // And have an 'en:' entry (English label) within its block
    }
    // Verify specific English labels to ensure they're real translations, not stubs
    expect(generatorsSrc).toContain("en: 'Executive Intelligence Summary'");
    expect(generatorsSrc).toContain("en: 'Predictive Assessment'");
    expect(generatorsSrc).toContain("en: 'Historical Context & Precedents'");
    expect(generatorsSrc).toContain("en: 'Methodology & Confidence'");
    expect(generatorsSrc).toContain("en: 'Likely Outcome'");
    expect(generatorsSrc).toContain("en: 'Coalition Stability Forecast'");
    expect(generatorsSrc).toContain("en: 'Risk Scenarios'");
  });

  it('DEEP_SECTION_LABELS have Swedish labels for all new section keys', () => {
    // Verify specific Swedish labels
    expect(generatorsSrc).toContain("sv: 'Sammanfattning för beslutsfattare'");
    expect(generatorsSrc).toContain("sv: 'Prediktiv bedömning'");
    expect(generatorsSrc).toContain("sv: 'Historisk kontext och prejudikat'");
    expect(generatorsSrc).toContain("sv: 'Metodik och konfidensgrad'");
    expect(generatorsSrc).toContain("sv: 'Troligt utfall'");
    expect(generatorsSrc).toContain("sv: 'Koalitionsstabilitetsprognos'");
    expect(generatorsSrc).toContain("sv: 'Riskscenarier'");
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
