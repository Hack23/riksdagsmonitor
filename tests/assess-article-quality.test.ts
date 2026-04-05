/**
 * Unit Tests for assessArticleQuality — multi-dimensional quality gate.
 *
 * Tests the real implementation of assessArticleQuality() in helpers.ts, which
 * replaced the previous stub (always returned 100/100). Validates all 6 quality
 * dimensions: factualAccuracy, stakeholderCoverage, analyticalDepth,
 * editorialConsistency, evidenceQuality, and languageQuality.
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import type { MultiDimensionalQualityAssessment } from '../scripts/types/article.js';
import type { MCPClientConfig } from '../scripts/types/mcp.js';

/** Mock MCP client interface */
interface MockMCPClientInstance {
  callTool: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  listTools: ReturnType<typeof vi.fn>;
}

/** Shape of the dynamically imported helpers module */
interface HelpersModule {
  assessArticleQuality: (
    html: string,
    lang: string,
    docIds: readonly string[],
    threshold: number,
  ) => MultiDimensionalQualityAssessment;
}

// Use vi.hoisted() so mocks are available before module import
const { mockClientInstance, MockMCPClient } = vi.hoisted(() => {
  const mockClientInstance: MockMCPClientInstance = {
    callTool: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: '{}' }] }),
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    listTools: vi.fn().mockResolvedValue({ tools: [] }),
  };
  const MockMCPClient = vi.fn().mockImplementation((_config: MCPClientConfig) => mockClientInstance);
  return { mockClientInstance, MockMCPClient };
});

vi.mock('../scripts/mcp-client.js', () => ({
  MCPClient: MockMCPClient,
  getDefaultClient: () => mockClientInstance,
}));

let helpers: HelpersModule | null = null;

beforeAll(async () => {
  vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined as unknown as string);
  vi.spyOn(fs, 'existsSync').mockReturnValue(false);

  try {
    helpers = (await import(
      '../scripts/generate-news-enhanced/helpers.js'
    )) as unknown as HelpersModule;
  } catch (e: unknown) {
    console.error('Import failed:', e instanceof Error ? e.message : String(e));
    helpers = null;
  }
});

afterAll(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers to build sample HTML articles
// ---------------------------------------------------------------------------

function highQualityArticle(): string {
  const words = Array.from({ length: 500 }, (_, i) => `word${i}`).join(' ');
  return [
    '<html><body>',
    '<h2>Political Analysis</h2>',
    `<p>${words}</p>`,
    '<p>The S and M parties debated intensely. The SD opposition raised concerns.</p>',
    '<h2>Winners and Losers</h2>',
    '<p>Winners: S gained seats. Losers: M lost ground.</p>',
    '<h3>Coalition Dynamics</h3>',
    '<p>SWOT analysis of the coalition: strengths include broad support.</p>',
    '<div class="mermaid">graph TD; A-->B;</div>',
    '<h2>Evidence Base</h2>',
    '<p data-dok-id="H901AU10">Based on document H901AU10.</p>',
    '<p>dok_id reference: H901FiU1. HIGH confidence assessment.</p>',
    '<h2>What to Watch</h2>',
    '<h2>Why It Matters</h2>',
    '<p>Impact analysis shows significant changes.</p>',
    '</body></html>',
  ].join('\n');
}

function bannedPatternArticle(): string {
  return [
    '<html><body>',
    '<p>The political landscape remains fluid, with both government and opposition positioning for advantage.</p>',
    '<p>No chamber debate data is available for these items, limiting our ability to assess.</p>',
    '<p>Analysis of 5 documents covering Defence.</p>',
    '</body></html>',
  ].join('\n');
}

function noEvidenceArticle(): string {
  const words = Array.from({ length: 300 }, (_, i) => `word${i}`).join(' ');
  return [
    '<html><body>',
    '<h2>Overview</h2>',
    `<p>${words}</p>`,
    '</body></html>',
  ].join('\n');
}

function swedishLeakageArticle(): string {
  return [
    '<html><body>',
    '<h2>Analysis</h2>',
    '<p>The betänkande was discussed och the proposition har been reviewed.</p>',
    '<p>According to riksdagen, the utskott decided att vote.</p>',
    '<p>More content här and there samt other things.</p>',
    '</body></html>',
  ].join('\n');
}

function duplicateSectionsArticle(): string {
  return [
    '<html><body>',
    '<h2>Why It Matters</h2>',
    '<p>First instance of why it matters.</p>',
    '<h2>Analysis</h2>',
    '<p>Some analysis content.</p>',
    '<h2>Why It Matters</h2>',
    '<p>Duplicate why it matters section.</p>',
    '<h2>What to Watch</h2>',
    '<p>Watch this.</p>',
    '<h2>What to Watch</h2>',
    '<p>Duplicate watch section.</p>',
    '</body></html>',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('assessArticleQuality', () => {
  it('should be exported from helpers', () => {
    expect(helpers).not.toBeNull();
    expect(typeof helpers?.assessArticleQuality).toBe('function');
  });

  it('should not always return 100/100 (the stub behavior)', () => {
    if (!helpers) return;
    const result = helpers.assessArticleQuality('<p>minimal</p>', 'en', [], 60);
    expect(result.overallScore).toBeLessThan(100);
  });

  it('should return assessmentPasses = 2', () => {
    if (!helpers) return;
    const result = helpers.assessArticleQuality('<p>test</p>', 'en', [], 60);
    expect(result.assessmentPasses).toBe(2);
  });

  // ---------------------------------------------------------------------------
  // factualAccuracy dimension
  // ---------------------------------------------------------------------------
  describe('factualAccuracy', () => {
    it('scores 100 for clean content without banned patterns', () => {
      if (!helpers) return;
      const result = helpers.assessArticleQuality(
        '<p>Sweden held elections in September 2026.</p>',
        'en', [], 60,
      );
      expect(result.dimensions.factualAccuracy.score).toBe(100);
      expect(result.dimensions.factualAccuracy.improvements).toHaveLength(0);
    });

    it('deducts 20 points per banned pattern', () => {
      if (!helpers) return;
      const html = '<p>The political landscape remains fluid, with both government and opposition positioning for advantage.</p>';
      const result = helpers.assessArticleQuality(html, 'en', [], 60);
      expect(result.dimensions.factualAccuracy.score).toBe(80);
      expect(result.dimensions.factualAccuracy.improvements.length).toBeGreaterThan(0);
    });

    it('deducts for multiple banned patterns cumulatively', () => {
      if (!helpers) return;
      const result = helpers.assessArticleQuality(bannedPatternArticle(), 'en', [], 60);
      // 3 banned patterns → 60 point deduction → score 40
      expect(result.dimensions.factualAccuracy.score).toBe(40);
    });

    it('floors at 0 for 5+ banned patterns', () => {
      if (!helpers) return;
      const html = [
        '<p>The political landscape remains fluid, with both government and opposition positioning for advantage.</p>',
        '<p>No chamber debate data is available for these items, limiting our ability.</p>',
        '<p>Touches on education policy.</p>',
        '<p>Analysis of 5 documents covering Defence.</p>',
        '<p>Requires committee review and chamber debate.</p>',
      ].join('\n');
      const result = helpers.assessArticleQuality(html, 'en', [], 60);
      expect(result.dimensions.factualAccuracy.score).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // stakeholderCoverage dimension
  // ---------------------------------------------------------------------------
  describe('stakeholderCoverage', () => {
    it('scores high when 2+ parties and Winners & Losers section present', () => {
      if (!helpers) return;
      const html = '<p>S and M debated the budget. <h2>Winners and Losers</h2><p>S wins.</p>';
      const result = helpers.assessArticleQuality(html, 'en', [], 60);
      expect(result.dimensions.stakeholderCoverage.score).toBe(100);
    });

    it('deducts 30 when fewer than 2 parties mentioned', () => {
      if (!helpers) return;
      const html = '<p>The government presented a plan.</p>';
      const result = helpers.assessArticleQuality(html, 'en', [], 60);
      expect(result.dimensions.stakeholderCoverage.score).toBeLessThanOrEqual(70);
      expect(result.dimensions.stakeholderCoverage.improvements).toEqual(
        expect.arrayContaining([expect.stringContaining('parties')]),
      );
    });

    it('deducts 15 when no Winners & Losers section', () => {
      if (!helpers) return;
      const html = '<p>S and M debated the issue at length.</p>';
      const result = helpers.assessArticleQuality(html, 'en', [], 60);
      expect(result.dimensions.stakeholderCoverage.score).toBe(85);
    });
  });

  // ---------------------------------------------------------------------------
  // analyticalDepth dimension
  // ---------------------------------------------------------------------------
  describe('analyticalDepth', () => {
    it('scores high with Mermaid diagrams, frameworks, and h3 subsections', () => {
      if (!helpers) return;
      const html = [
        '<div class="mermaid">graph TD</div>',
        '<p>SWOT analysis of the situation.</p>',
        '<h3>Sub-analysis A</h3>',
        '<h3>Sub-analysis B</h3>',
      ].join('');
      const result = helpers.assessArticleQuality(html, 'en', [], 60);
      expect(result.dimensions.analyticalDepth.score).toBe(100);
    });

    it('deducts 20 when no Mermaid diagrams', () => {
      if (!helpers) return;
      const html = '<p>SWOT analysis.</p><h3>A</h3><h3>B</h3>';
      const result = helpers.assessArticleQuality(html, 'en', [], 60);
      expect(result.dimensions.analyticalDepth.score).toBeLessThanOrEqual(80);
    });

    it('deducts 15 when no analytical framework references', () => {
      if (!helpers) return;
      const html = '<div class="mermaid">graph</div><h3>A</h3><h3>B</h3>';
      const result = helpers.assessArticleQuality(html, 'en', [], 60);
      expect(result.dimensions.analyticalDepth.score).toBeLessThanOrEqual(85);
    });

    it('deducts 10 when fewer than 2 h3 subsections', () => {
      if (!helpers) return;
      const html = '<div class="mermaid">graph</div><p>SWOT analysis.</p>';
      const result = helpers.assessArticleQuality(html, 'en', [], 60);
      expect(result.dimensions.analyticalDepth.score).toBeLessThanOrEqual(90);
    });
  });

  // ---------------------------------------------------------------------------
  // editorialConsistency dimension
  // ---------------------------------------------------------------------------
  describe('editorialConsistency', () => {
    it('scores 100 when no duplicate sections exist', () => {
      if (!helpers) return;
      const html = '<h2>Why It Matters</h2><p>text</p><h2>What to Watch</h2><p>text</p>';
      const result = helpers.assessArticleQuality(html, 'en', [], 60);
      expect(result.dimensions.editorialConsistency.score).toBe(100);
    });

    it('deducts 15 per duplicate "Why It Matters" section', () => {
      if (!helpers) return;
      const result = helpers.assessArticleQuality(duplicateSectionsArticle(), 'en', [], 60);
      expect(result.dimensions.editorialConsistency.score).toBeLessThanOrEqual(70);
      expect(result.dimensions.editorialConsistency.improvements).toEqual(
        expect.arrayContaining([expect.stringContaining('Why It Matters')]),
      );
    });

    it('detects duplicate "What to Watch" sections', () => {
      if (!helpers) return;
      const result = helpers.assessArticleQuality(duplicateSectionsArticle(), 'en', [], 60);
      expect(result.dimensions.editorialConsistency.improvements).toEqual(
        expect.arrayContaining([expect.stringContaining('What to Watch')]),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // evidenceQuality dimension
  // ---------------------------------------------------------------------------
  describe('evidenceQuality', () => {
    it('scores high with sufficient dok_id citations and confidence labels', () => {
      if (!helpers) return;
      const html = '<p data-dok-id="H901AU10">dok_id ref: H901FiU1. HIGH confidence.</p>';
      const result = helpers.assessArticleQuality(html, 'en', ['H901AU10', 'H901FiU1'], 60);
      expect(result.dimensions.evidenceQuality.score).toBe(100);
    });

    it('deducts 20 when fewer than minimum dok_id citations', () => {
      if (!helpers) return;
      const result = helpers.assessArticleQuality(noEvidenceArticle(), 'en', [], 60);
      expect(result.dimensions.evidenceQuality.score).toBeLessThanOrEqual(80);
      expect(result.dimensions.evidenceQuality.improvements).toEqual(
        expect.arrayContaining([expect.stringContaining('document ID')]),
      );
    });

    it('deducts 15 when no confidence labels present', () => {
      if (!helpers) return;
      const html = '<p data-dok-id="X">dok_id reference here. More dok_id here.</p>';
      const result = helpers.assessArticleQuality(html, 'en', ['X', 'Y'], 60);
      expect(result.dimensions.evidenceQuality.score).toBeLessThanOrEqual(85);
      expect(result.dimensions.evidenceQuality.improvements).toEqual(
        expect.arrayContaining([expect.stringContaining('confidence')]),
      );
    });

    it('counts source docIds passed as parameter', () => {
      if (!helpers) return;
      const html = '<p>Some content with HIGH confidence.</p>';
      const result = helpers.assessArticleQuality(html, 'en', ['doc1', 'doc2'], 60);
      expect(result.dimensions.evidenceQuality.evidence[0]).toContain('2 source IDs');
    });
  });

  // ---------------------------------------------------------------------------
  // languageQuality dimension
  // ---------------------------------------------------------------------------
  describe('languageQuality', () => {
    it('scores 100 for Swedish articles (skip leakage check)', () => {
      if (!helpers) return;
      const html = '<p>Riksdagen beslutade att föreslå en ny proposition.</p>';
      const result = helpers.assessArticleQuality(html, 'sv', [], 60);
      expect(result.dimensions.languageQuality.score).toBe(100);
    });

    it('scores 100 for clean English articles without Swedish words', () => {
      if (!helpers) return;
      const html = '<p>The Swedish parliament decided on a new proposal for defence spending.</p>';
      const result = helpers.assessArticleQuality(html, 'en', [], 60);
      expect(result.dimensions.languageQuality.score).toBe(100);
    });

    it('deducts for Swedish leakage in English articles', () => {
      if (!helpers) return;
      const result = helpers.assessArticleQuality(swedishLeakageArticle(), 'en', [], 60);
      expect(result.dimensions.languageQuality.score).toBeLessThan(100);
      expect(result.dimensions.languageQuality.improvements.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Overall score and threshold
  // ---------------------------------------------------------------------------
  describe('overall score and threshold', () => {
    it('computes a weighted overall score between 0 and 100', () => {
      if (!helpers) return;
      const result = helpers.assessArticleQuality('<p>test</p>', 'en', [], 60);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('passes threshold for a high-quality article', () => {
      if (!helpers) return;
      const result = helpers.assessArticleQuality(highQualityArticle(), 'en', ['H901AU10', 'H901FiU1'], 60);
      expect(result.passesThreshold).toBe(true);
      expect(result.overallScore).toBeGreaterThanOrEqual(60);
    });

    it('fails threshold for article with multiple quality problems', () => {
      if (!helpers) return;
      // Article with banned patterns AND no evidence AND no stakeholder coverage → multiple dimension failures
      const html = [
        '<html><body>',
        '<p>The political landscape remains fluid, with both government and opposition positioning for advantage.</p>',
        '<p>No chamber debate data is available for these items, limiting our ability to assess.</p>',
        '<p>Analysis of 5 documents covering Defence.</p>',
        '<p>Requires committee review and chamber debate.</p>',
        '<p>Touches on education policy.</p>',
        '</body></html>',
      ].join('\n');
      const result = helpers.assessArticleQuality(html, 'en', [], 60);
      expect(result.passesThreshold).toBe(false);
      expect(result.overallScore).toBeLessThan(60);
    });

    it('banned pattern article has factualAccuracy below 50', () => {
      if (!helpers) return;
      const result = helpers.assessArticleQuality(bannedPatternArticle(), 'en', [], 60);
      expect(result.dimensions.factualAccuracy.score).toBeLessThan(50);
    });

    it('no-evidence article has evidenceQuality below 100', () => {
      if (!helpers) return;
      const result = helpers.assessArticleQuality(noEvidenceArticle(), 'en', [], 60);
      expect(result.dimensions.evidenceQuality.score).toBeLessThan(100);
    });
  });

  // ---------------------------------------------------------------------------
  // Issues and suggestions
  // ---------------------------------------------------------------------------
  describe('issues and suggestions', () => {
    it('generates critical issues for dimensions scoring below 50', () => {
      if (!helpers) return;
      const result = helpers.assessArticleQuality(bannedPatternArticle(), 'en', [], 60);
      const criticalIssues = result.issues.filter(i => i.severity === 'critical');
      expect(criticalIssues.length).toBeGreaterThan(0);
    });

    it('sorts issues by severity: critical → major → minor', () => {
      if (!helpers) return;
      const result = helpers.assessArticleQuality(bannedPatternArticle(), 'en', [], 60);
      if (result.issues.length >= 2) {
        const severityOrder: Record<string, number> = { critical: 0, major: 1, minor: 2 };
        for (let i = 1; i < result.issues.length; i++) {
          expect(severityOrder[result.issues[i].severity]).toBeGreaterThanOrEqual(
            severityOrder[result.issues[i - 1].severity],
          );
        }
      }
    });

    it('provides actionable suggestions for low-scoring dimensions', () => {
      if (!helpers) return;
      const result = helpers.assessArticleQuality(noEvidenceArticle(), 'en', [], 60);
      expect(result.suggestions.length).toBeGreaterThan(0);
      // Suggestions should contain specific, actionable text
      for (const suggestion of result.suggestions) {
        expect(suggestion.length).toBeGreaterThan(10);
      }
    });

    it('returns empty issues for a perfect article', () => {
      if (!helpers) return;
      const result = helpers.assessArticleQuality(highQualityArticle(), 'en', ['H901AU10', 'H901FiU1'], 60);
      // Perfect articles may still have minor issues but no critical ones
      const criticalIssues = result.issues.filter(i => i.severity === 'critical');
      expect(criticalIssues).toHaveLength(0);
    });

    it('issues include dimension name and suggestedFix', () => {
      if (!helpers) return;
      const result = helpers.assessArticleQuality(bannedPatternArticle(), 'en', [], 60);
      for (const issue of result.issues) {
        expect(issue.dimension).toBeTruthy();
        expect(issue.suggestedFix).toBeTruthy();
        expect(issue.description).toBeTruthy();
      }
    });
  });
});
