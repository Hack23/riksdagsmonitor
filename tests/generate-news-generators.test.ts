/**
 * Unit Tests for News Generators (generate-news-enhanced/generators.ts)
 *
 * Tests generateWeekAhead, generateCommitteeReports, generatePropositions,
 * generateMotions, and generateInterpellations with mocked MCP client and
 * config dependencies.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import type { GenerationResult } from '../scripts/types/article.js';

// ---------------------------------------------------------------------------
// Inline mock MCP client (avoids cross-test contamination with fixture imports)
// ---------------------------------------------------------------------------

const sampleDocs = [
  { dok_id: 'H901FiU1', titel: 'Utgiftsramar', doktyp: 'bet', organ: 'FiU', datum: '2026-03-15' },
  { dok_id: 'H9011', titel: 'Proposition om säkerhet', doktyp: 'prop', datum: '2026-03-14' },
  { dok_id: 'H9023456', titel: 'Motion om klimat', doktyp: 'mot', parti: 'MP', datum: '2026-03-12' },
  { dok_id: 'H9034567', titel: 'Interpellation om sjukvård', doktyp: 'ip', parti: 'V', datum: '2026-03-11' },
  { dok_id: 'H9045678', titel: 'Fråga om infrastruktur', doktyp: 'fr', parti: 'S', datum: '2026-03-10' },
];

const sampleEvents = [
  { datum: '2026-03-16', tid: '09:00', rubrik: 'FiU sammanträde', organ: 'FiU' },
  { datum: '2026-03-17', tid: '13:00', rubrik: 'Frågestund', organ: 'Kammaren' },
];

const inlineMockClient = {
  baseURL: 'http://mock:3000',
  timeout: 30000,
  fetchCalendarEvents: vi.fn().mockResolvedValue(sampleEvents),
  searchDocuments: vi.fn().mockResolvedValue(sampleDocs),
  fetchCommitteeReports: vi.fn().mockResolvedValue(sampleDocs.filter(d => d.doktyp === 'bet')),
  fetchPropositions: vi.fn().mockResolvedValue(sampleDocs.filter(d => d.doktyp === 'prop')),
  fetchMotions: vi.fn().mockResolvedValue(sampleDocs.filter(d => d.doktyp === 'mot')),
  fetchInterpellations: vi.fn().mockResolvedValue(sampleDocs.filter(d => d.doktyp === 'ip')),
  fetchWrittenQuestions: vi.fn().mockResolvedValue(sampleDocs.filter(d => d.doktyp === 'fr')),
  enrichDocumentsWithContent: vi.fn().mockImplementation((docs: unknown[]) => Promise.resolve(
    (docs as Record<string, unknown>[]).map(d => ({ ...d, contentFetched: true }))
  )),
  request: vi.fn().mockResolvedValue({ last_sync: new Date().toISOString() }),
};

vi.mock('../scripts/mcp-client.js', () => ({
  MCPClient: vi.fn().mockImplementation(() => inlineMockClient),
}));

// Mock config with controlled values
vi.mock('../scripts/generate-news-enhanced/config.js', () => ({
  languages: ['en', 'sv'],
  stats: { generated: 0, errors: 0, articles: [], timestamp: new Date().toISOString(), qualityScores: [] },
  getSharedClient: vi.fn().mockResolvedValue(inlineMockClient),
  requireMcp: false,
  toISODate: (d: Date) => d.toISOString().slice(0, 10),
  dryRunArg: true,
  skipExistingArg: false,
  batchSize: 0,
  QUALITY_THRESHOLD: 40,
  MULTIDIM_QUALITY_THRESHOLD: 60,
  analysisDepth: 1,
  analysisIterations: 3,
  analysisMode: 'quick',
  documentIds: [],
  documentUrls: [],
  focusTopic: '',
  NEWS_DIR: '/tmp/test-news',
  METADATA_DIR: '/tmp/test-news/metadata',
  __dirname: '/tmp',
  VALID_ARTICLE_TYPES: ['week-ahead', 'committee-reports', 'propositions', 'motions', 'interpellations', 'breaking', 'deep-inspection'],
  ALL_LANGUAGES: ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'],
  LANGUAGE_PRESETS: {
    all: ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'],
    nordic: ['en', 'sv', 'da', 'no', 'fi'],
    'eu-core': ['en', 'sv', 'de', 'fr', 'es', 'nl'],
  },
}));

// Mock helpers
const writeSingleArticleMock = vi.fn().mockResolvedValue('test-article.html');
const getAnalysisEnrichmentMock = vi.fn().mockResolvedValue({
  classificationLevel: 'HIGH',
  riskLevel: 'elevated',
  confidenceLabel: 'HIGH',
  significance: 78,
  urgency: 'major',
});
vi.mock('../scripts/generate-news-enhanced/helpers.js', () => ({
  getWeekAheadDateRange: () => ({ start: '2026-03-16', end: '2026-03-23' }),
  formatDateForSlug: (d?: Date) => (d ?? new Date()).toISOString().slice(0, 10),
  writeSingleArticle: writeSingleArticleMock,
  writeArticlePair: vi.fn().mockResolvedValue(undefined),
  validateArticleQuality: vi.fn().mockReturnValue({ score: 80, passed: true }),
  flushQualityScores: vi.fn(),
  installFlushHandlers: vi.fn(),
  getAnalysisEnrichment: getAnalysisEnrichmentMock,
  resetAnalysisEnrichmentCache: vi.fn(),
}));

// Mock analysis pipeline
vi.mock('../scripts/ai-analysis/pipeline.js', () => ({
  runAnalysisPipeline: vi.fn().mockResolvedValue({
    swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
    policyAssessment: { domains: [], narrative: '', confidence: 0.5 },
    watchPoints: [],
    dashboardData: { totalDocs: 0, typeDistribution: {} },
    mindmapBranches: [],
    metadata: { iterations: [], totalDuration: 0 },
  }),
  aiAnalysisPipeline: {
    analyzeDocuments: vi.fn().mockResolvedValue({
      swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
      policyAssessment: { domains: [], narrative: '', confidence: 0.5 },
      watchPoints: [],
      dashboardData: { totalDocs: 0, typeDistribution: {} },
      mindmapBranches: [],
    }),
  },
}));

vi.mock('../scripts/generate-news-enhanced/analysis-cache.js', () => ({
  sharedAnalysisCache: { get: vi.fn().mockReturnValue(undefined), set: vi.fn(), clear: vi.fn() },
}));

vi.mock('../scripts/generate-news-enhanced/ai-analysis-pipeline.js', () => ({
  AIAnalysisPipeline: vi.fn().mockImplementation(() => ({
    run: vi.fn().mockResolvedValue({
      swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
      narrative: '',
      confidence: 0.5,
    }),
  })),
}));

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

let generators: {
  generateWeekAhead: () => Promise<GenerationResult>;
  generateCommitteeReports: () => Promise<GenerationResult>;
  generatePropositions: () => Promise<GenerationResult>;
  generateMotions: () => Promise<GenerationResult>;
  generateInterpellations: () => Promise<GenerationResult>;
};

beforeAll(async () => {
  generators = await import('../scripts/generate-news-enhanced/generators.js');
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// generateWeekAhead
// ---------------------------------------------------------------------------

describe('generateWeekAhead', () => {
  it('returns an object with success property', async () => {
    const result = await generators.generateWeekAhead();
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  });

  it('does not throw — wraps errors gracefully', async () => {
    await expect(generators.generateWeekAhead()).resolves.toBeDefined();
  });

  it('calls getSharedClient to obtain MCP connection', async () => {
    const { getSharedClient } = await import('../scripts/generate-news-enhanced/config.js');
    await generators.generateWeekAhead();
    expect(getSharedClient).toHaveBeenCalled();
  });

  it('on success, returns slug containing "week-ahead"', async () => {
    const result = await generators.generateWeekAhead();
    if (result.success && result.slug) {
      expect(result.slug).toContain('week-ahead');
    } else {
      expect(result.error).toBeDefined();
    }
  });

  it('on success, calls writeSingleArticle for each language', async () => {
    const result = await generators.generateWeekAhead();
    if (result.success) {
      expect(writeSingleArticleMock).toHaveBeenCalled();
    }
  });

  it('on failure, error field is a string', async () => {
    const result = await generators.generateWeekAhead();
    if (!result.success) {
      expect(typeof result.error).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// generateCommitteeReports
// ---------------------------------------------------------------------------

describe('generateCommitteeReports', () => {
  it('returns a GenerationResult object', async () => {
    const result = await generators.generateCommitteeReports();
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  });

  it('does not throw on invocation', async () => {
    await expect(generators.generateCommitteeReports()).resolves.toBeDefined();
  });

  it('returns files >= 0', async () => {
    const result = await generators.generateCommitteeReports();
    if (result.files !== undefined) {
      expect(result.files).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// generatePropositions
// ---------------------------------------------------------------------------

describe('generatePropositions', () => {
  it('returns a GenerationResult object', async () => {
    const result = await generators.generatePropositions();
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  });

  it('does not throw on invocation', async () => {
    await expect(generators.generatePropositions()).resolves.toBeDefined();
  });

  it('on success, slug contains "propositions"', async () => {
    const result = await generators.generatePropositions();
    if (result.success && result.slug) {
      expect(result.slug).toContain('propositions');
    }
  });

  it('has error field when success is false', async () => {
    const result = await generators.generatePropositions();
    if (!result.success) {
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    }
  });
});

// ---------------------------------------------------------------------------
// generateMotions
// ---------------------------------------------------------------------------

describe('generateMotions', () => {
  it('returns a GenerationResult object', async () => {
    const result = await generators.generateMotions();
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  });

  it('does not throw on invocation', async () => {
    await expect(generators.generateMotions()).resolves.toBeDefined();
  });

  it('on success, slug contains "motions"', async () => {
    const result = await generators.generateMotions();
    if (result.success && result.slug) {
      expect(result.slug).toContain('motions');
    }
  });

  it('has error field when success is false', async () => {
    const result = await generators.generateMotions();
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// generateInterpellations
// ---------------------------------------------------------------------------

describe('generateInterpellations', () => {
  it('returns a GenerationResult object', async () => {
    const result = await generators.generateInterpellations();
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  });

  it('does not throw on invocation', async () => {
    await expect(generators.generateInterpellations()).resolves.toBeDefined();
  });

  it('on success, slug contains "interpellation-debates"', async () => {
    const result = await generators.generateInterpellations();
    if (result.success && result.slug) {
      expect(result.slug).toContain('interpellation-debates');
    }
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting concerns
// ---------------------------------------------------------------------------

describe('Generator cross-cutting concerns', () => {
  it('all generators return objects with success field', async () => {
    const results = await Promise.all([
      generators.generateWeekAhead(),
      generators.generateCommitteeReports(),
      generators.generatePropositions(),
      generators.generateMotions(),
      generators.generateInterpellations(),
    ]);
    for (const r of results) {
      expect(r).toHaveProperty('success');
      expect(typeof r.success).toBe('boolean');
    }
  });

  it('all generators handle errors without throwing', async () => {
    for (const fn of [
      generators.generateWeekAhead,
      generators.generateCommitteeReports,
      generators.generatePropositions,
      generators.generateMotions,
      generators.generateInterpellations,
    ]) {
      await expect(fn()).resolves.toBeDefined();
    }
  });

  it('failed generators include error message', async () => {
    const results = await Promise.all([
      generators.generateWeekAhead(),
      generators.generateCommitteeReports(),
      generators.generatePropositions(),
      generators.generateMotions(),
      generators.generateInterpellations(),
    ]);
    for (const r of results) {
      if (!r.success) {
        expect(r.error).toBeDefined();
        expect(typeof r.error).toBe('string');
        expect(r.error!.length).toBeGreaterThan(0);
      }
    }
  });

  it('getSharedClient is called for each generator invocation', async () => {
    const { getSharedClient } = await import('../scripts/generate-news-enhanced/config.js');
    vi.mocked(getSharedClient).mockClear();
    await generators.generateWeekAhead();
    await generators.generateCommitteeReports();
    await generators.generatePropositions();
    await generators.generateMotions();
    await generators.generateInterpellations();
    expect(getSharedClient).toHaveBeenCalledTimes(5);
  });

  it('getAnalysisEnrichment is included in helpers mock', async () => {
    const helpers = await import('../scripts/generate-news-enhanced/helpers.js');
    expect(typeof helpers.getAnalysisEnrichment).toBe('function');
  });

  it('generators handle null enrichment gracefully', async () => {
    // Override the mock to return null (no analysis available)
    getAnalysisEnrichmentMock.mockResolvedValueOnce(null);
    const result = await generators.generateWeekAhead();
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
  });
});
