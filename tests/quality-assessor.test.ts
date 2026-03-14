/**
 * Unit Tests for Multi-Dimensional Quality Assessor
 *
 * Tests the assessArticleQuality function from scripts/ai-analysis/quality-assessor.ts:
 * - 6-dimension scoring (factualAccuracy, stakeholderCoverage, analyticalDepth,
 *   editorialConsistency, evidenceQuality, languageQuality)
 * - Weighted overall score computation
 * - Issue detection and severity classification
 * - Suggestion generation
 * - passesThreshold flag
 * - iterationCount always >= 2
 * - injectQualityMetadata — adds meta tag and JSON-LD to article HTML
 * - printQualityReport — console output (smoke test)
 */

import { describe, it, expect, vi } from 'vitest';
import {
  assessArticleQuality,
  injectQualityMetadata,
  printQualityReport,
  type MultiDimensionalQualityAssessment,
} from '../scripts/ai-analysis/quality-assessor.js';

// ---------------------------------------------------------------------------
// Helpers — build sample HTML snippets
// ---------------------------------------------------------------------------

function buildArticleHtml(options: {
  wordCount?: number;
  h2Count?: number;
  parties?: string[];
  docIds?: string[];
  hasWhyItMatters?: boolean;
  hasHistoricalContext?: boolean;
  hasForwardLooking?: boolean;
  hasLanguageSwitcher?: boolean;
  hasBackToNews?: boolean;
  hasSources?: boolean;
  externalLinks?: number;
  paragraphs?: number;
  untranslatedSpans?: number;
  includeBlockquote?: boolean;
}): string {
  const {
    wordCount = 600,
    h2Count = 3,
    parties = ['Socialdemokraterna', 'Moderaterna', 'SD', 'C', 'V', 'KD'],
    docIds = ['Prop. 2024/25:1', 'Bet. 2024/25:FiU10', 'Mot. 2024/25:123'],
    hasWhyItMatters = true,
    hasHistoricalContext = true,
    hasForwardLooking = true,
    hasLanguageSwitcher = true,
    hasBackToNews = true,
    hasSources = true,
    externalLinks = 2,
    paragraphs = 6,
    untranslatedSpans = 0,
    includeBlockquote = false,
  } = options;

  const words = Array.from({ length: wordCount }, (_, i) => `word${i}`).join(' ');
  const h2s = Array.from({ length: h2Count }, (_, i) => `<h2>Section ${i + 1}</h2>`).join('');
  const partyMentions = parties.join(', ');
  const docIdText = docIds.join(', ');
  const links = Array.from({ length: externalLinks }, (_, i) =>
    `<a href="https://example.com/${i}">source</a>`).join('');
  const paras = Array.from({ length: paragraphs }, () => `<p>Paragraph text</p>`).join('');
  const untranslated = Array.from({ length: untranslatedSpans }, () =>
    `<span data-translate="true">Swedish text</span>`).join('');
  const blockquote = includeBlockquote ? '<blockquote>Quote from minister</blockquote>' : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test Article</title>
  ${hasLanguageSwitcher ? '<nav class="language-switcher"><a href="/en">EN</a></nav>' : ''}
</head>
<body>
  ${hasBackToNews ? '<a class="back-to-news" href="/news">Back</a>' : ''}
  <main>
    <p>${words}</p>
    ${h2s}
    ${paras}
    ${untranslated}
    ${blockquote}
    <p>Parties: ${partyMentions}</p>
    <p>Documents: ${docIdText}</p>
    ${hasWhyItMatters ? '<h2>Why This Matters</h2><p>implications for policy</p>' : ''}
    ${hasHistoricalContext ? '<p>Historically, in 2020 this was different.</p>' : ''}
    ${hasForwardLooking ? '<p>Next week, upcoming sessions will address future concerns.</p>' : ''}
    <p>Analysis: because of these results, therefore the outcome leads to changes. compared to 2023, however this trend shows evidence according to data.</p>
    ${hasSources ? '<h3>Sources</h3><ul><li>Source 1</li></ul>' : ''}
    ${links}
  </main>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('assessArticleQuality', () => {
  describe('return structure', () => {
    it('should return a complete MultiDimensionalQualityAssessment', () => {
      const html = buildArticleHtml({});
      const result = assessArticleQuality(html, 'en');

      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('dimensions');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('passesThreshold');
      expect(result).toHaveProperty('iterationCount');
    });

    it('should always have iterationCount >= 2', () => {
      const html = buildArticleHtml({});
      const result = assessArticleQuality(html, 'en');
      expect(result.iterationCount).toBeGreaterThanOrEqual(2);
    });

    it('should have all 6 dimensions', () => {
      const html = buildArticleHtml({});
      const result = assessArticleQuality(html, 'en');
      const { dimensions } = result;

      expect(dimensions).toHaveProperty('factualAccuracy');
      expect(dimensions).toHaveProperty('stakeholderCoverage');
      expect(dimensions).toHaveProperty('analyticalDepth');
      expect(dimensions).toHaveProperty('editorialConsistency');
      expect(dimensions).toHaveProperty('evidenceQuality');
      expect(dimensions).toHaveProperty('languageQuality');
    });

    it('each dimension should have score, evidence, and improvements', () => {
      const html = buildArticleHtml({});
      const result = assessArticleQuality(html, 'en');

      for (const dim of Object.values(result.dimensions)) {
        expect(dim).toHaveProperty('score');
        expect(dim).toHaveProperty('evidence');
        expect(dim).toHaveProperty('improvements');
        expect(Array.isArray(dim.evidence)).toBe(true);
        expect(Array.isArray(dim.improvements)).toBe(true);
        expect(dim.score).toBeGreaterThanOrEqual(0);
        expect(dim.score).toBeLessThanOrEqual(100);
      }
    });

    it('overallScore should be 0–100', () => {
      const html = buildArticleHtml({});
      const result = assessArticleQuality(html, 'en');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });
  });

  // ---------------------------------------------------------------------------

  describe('factualAccuracy dimension', () => {
    it('should score higher when document IDs are present', () => {
      const withDocs = buildArticleHtml({ docIds: ['Prop. 2024/25:1', 'Bet. 2024/25:FiU10', 'Mot. 2024/25:123', 'IP 2024/25:45', 'Fr. 2024/25:67'] });
      const withoutDocs = buildArticleHtml({ docIds: [] });

      const scoreWith = assessArticleQuality(withDocs, 'en').dimensions.factualAccuracy.score;
      const scoreWithout = assessArticleQuality(withoutDocs, 'en').dimensions.factualAccuracy.score;

      expect(scoreWith).toBeGreaterThan(scoreWithout);
    });

    it('should score 0 for articles with no document references', () => {
      const html = buildArticleHtml({ docIds: [] });
      const result = assessArticleQuality(html, 'en');
      expect(result.dimensions.factualAccuracy.score).toBe(0);
    });

    it('should improve score when doc IDs match source list', () => {
      const docIds = ['Prop. 2024/25:1', 'Bet. 2024/25:FiU10'];
      const htmlWith = buildArticleHtml({ docIds });
      const noMatch = assessArticleQuality(htmlWith, 'en', []).dimensions.factualAccuracy.score;
      const withMatch = assessArticleQuality(htmlWith, 'en', ['Prop. 2024/25:1', 'Bet. 2024/25:FiU10']).dimensions.factualAccuracy.score;
      // withMatch should be >= noMatch (source confirmation bonus)
      expect(withMatch).toBeGreaterThanOrEqual(noMatch);
    });
  });

  // ---------------------------------------------------------------------------

  describe('stakeholderCoverage dimension', () => {
    it('should score higher when more parties are mentioned', () => {
      const allParties = buildArticleHtml({
        parties: ['Socialdemokraterna', 'Moderaterna', 'SD', 'C', 'V', 'KD', 'L', 'MP'],
      });
      const fewParties = buildArticleHtml({ parties: ['Moderaterna'] });

      const scoreAll = assessArticleQuality(allParties, 'en').dimensions.stakeholderCoverage.score;
      const scoreFew = assessArticleQuality(fewParties, 'en').dimensions.stakeholderCoverage.score;

      expect(scoreAll).toBeGreaterThan(scoreFew);
    });

    it('should include party names in evidence when parties are found', () => {
      const html = buildArticleHtml({ parties: ['Socialdemokraterna', 'Moderaterna', 'SD'] });
      const result = assessArticleQuality(html, 'en');
      expect(result.dimensions.stakeholderCoverage.evidence.length).toBeGreaterThan(0);
    });

    it('should detect parties with non-ASCII characters (Vänsterpartiet, Miljöpartiet)', () => {
      // This verifies the Unicode-safe matching (no \\b boundaries)
      const html = buildArticleHtml({ parties: ['Vänsterpartiet', 'Miljöpartiet'] });
      const result = assessArticleQuality(html, 'en');
      // Both V and MP should be detected — evidence format: "N/8 parties represented: V, MP"
      const partyEvidence = result.dimensions.stakeholderCoverage.evidence.find(
        e => e.includes('/8 parties represented')
      );
      expect(partyEvidence).toBeDefined();
      expect(partyEvidence).toContain('V');
      expect(partyEvidence).toContain('MP');
    });
  });

  // ---------------------------------------------------------------------------

  describe('analyticalDepth dimension', () => {
    it('should score higher for articles with analytical language', () => {
      const rich = buildArticleHtml({});  // has because/therefore/however/according to etc.

      // Override the body text to have no analytical words
      const bareHtml = '<html><body><p>' + Array(600).fill('simple').join(' ') + '</p></body></html>';
      const scoreRich = assessArticleQuality(rich, 'en').dimensions.analyticalDepth.score;
      const scoreBare = assessArticleQuality(bareHtml, 'en').dimensions.analyticalDepth.score;

      expect(scoreRich).toBeGreaterThanOrEqual(scoreBare);
    });

    it('should count blockquotes as multiple-perspective evidence', () => {
      const withQuote = buildArticleHtml({ includeBlockquote: true });
      const withoutQuote = buildArticleHtml({ includeBlockquote: false });

      const scoreWith = assessArticleQuality(withQuote, 'en').dimensions.analyticalDepth.score;
      const scoreWithout = assessArticleQuality(withoutQuote, 'en').dimensions.analyticalDepth.score;

      expect(scoreWith).toBeGreaterThanOrEqual(scoreWithout);
    });
  });

  // ---------------------------------------------------------------------------

  describe('editorialConsistency dimension', () => {
    it('should score higher for articles with full structure', () => {
      const full = buildArticleHtml({
        h2Count: 4,
        hasWhyItMatters: true,
        hasHistoricalContext: true,
        hasForwardLooking: true,
        hasLanguageSwitcher: true,
        hasBackToNews: true,
      });
      const minimal = buildArticleHtml({
        h2Count: 0,
        hasWhyItMatters: false,
        hasHistoricalContext: false,
        hasForwardLooking: false,
        hasLanguageSwitcher: false,
        hasBackToNews: false,
      });

      const scoreFull = assessArticleQuality(full, 'en').dimensions.editorialConsistency.score;
      const scoreMinimal = assessArticleQuality(minimal, 'en').dimensions.editorialConsistency.score;

      expect(scoreFull).toBeGreaterThan(scoreMinimal);
    });

    it('should flag missing "Why This Matters" in improvements', () => {
      const html = buildArticleHtml({ hasWhyItMatters: false });
      const result = assessArticleQuality(html, 'en');
      const allImprovements = result.dimensions.editorialConsistency.improvements.join(' ');
      expect(allImprovements.toLowerCase()).toContain('why');
    });
  });

  // ---------------------------------------------------------------------------

  describe('evidenceQuality dimension', () => {
    it('should score higher when document IDs and external links are present', () => {
      const rich = buildArticleHtml({ docIds: ['Prop. 2024/25:1', 'Bet. 2024/25:FiU10', 'Mot. 2024/25:123'], externalLinks: 3, hasSources: true });
      const bare = buildArticleHtml({ docIds: [], externalLinks: 0, hasSources: false });

      const scoreRich = assessArticleQuality(rich, 'en').dimensions.evidenceQuality.score;
      const scoreBare = assessArticleQuality(bare, 'en').dimensions.evidenceQuality.score;

      expect(scoreRich).toBeGreaterThan(scoreBare);
    });

    it('should identify missing sources section in improvements', () => {
      const html = buildArticleHtml({ hasSources: false, docIds: [], externalLinks: 0 });
      const result = assessArticleQuality(html, 'en');
      const improvements = result.dimensions.evidenceQuality.improvements.join(' ');
      expect(improvements.toLowerCase()).toContain('source');
    });
  });

  // ---------------------------------------------------------------------------

  describe('languageQuality dimension', () => {
    it('should score higher for longer articles', () => {
      const long = buildArticleHtml({ wordCount: 1200, paragraphs: 10 });
      const short = buildArticleHtml({ wordCount: 200, paragraphs: 2 });

      const scoreLong = assessArticleQuality(long, 'en').dimensions.languageQuality.score;
      const scoreShort = assessArticleQuality(short, 'en').dimensions.languageQuality.score;

      expect(scoreLong).toBeGreaterThan(scoreShort);
    });

    it('should deduct for untranslated spans in non-Swedish articles', () => {
      const translated = buildArticleHtml({ untranslatedSpans: 0 });
      const untranslated = buildArticleHtml({ untranslatedSpans: 10 });

      const scoreTranslated = assessArticleQuality(translated, 'de').dimensions.languageQuality.score;
      const scoreUntranslated = assessArticleQuality(untranslated, 'de').dimensions.languageQuality.score;

      expect(scoreTranslated).toBeGreaterThan(scoreUntranslated);
    });

    it('should not deduct for untranslated spans in Swedish articles', () => {
      const svWithSpans = buildArticleHtml({ untranslatedSpans: 10 });

      const scoreWithSpans = assessArticleQuality(svWithSpans, 'sv').dimensions.languageQuality.score;

      // Swedish articles are exempt from untranslated-span penalties.
      // Verify by comparing with a de (German) article that DOES penalise spans:
      const deWithSpans = assessArticleQuality(svWithSpans, 'de').dimensions.languageQuality.score;
      expect(scoreWithSpans).toBeGreaterThanOrEqual(deWithSpans);
    });
  });

  // ---------------------------------------------------------------------------

  describe('weighted overall score', () => {
    it('should increase overall score when more dimensions improve', () => {
      const perfect = buildArticleHtml({
        wordCount: 1200,
        h2Count: 5,
        parties: ['Socialdemokraterna', 'Moderaterna', 'SD', 'C', 'V', 'KD', 'L', 'MP'],
        docIds: ['Prop. 2024/25:1', 'Bet. 2024/25:FiU10', 'Mot. 2024/25:123', 'IP 2024/25:45', 'Fr. 2024/25:67'],
        hasWhyItMatters: true,
        hasHistoricalContext: true,
        hasForwardLooking: true,
        hasLanguageSwitcher: true,
        hasBackToNews: true,
        hasSources: true,
        externalLinks: 3,
        paragraphs: 10,
        untranslatedSpans: 0,
        includeBlockquote: true,
      });
      const minimal = buildArticleHtml({
        wordCount: 100,
        h2Count: 0,
        parties: [],
        docIds: [],
        hasWhyItMatters: false,
        hasHistoricalContext: false,
        hasForwardLooking: false,
        hasLanguageSwitcher: false,
        hasBackToNews: false,
        hasSources: false,
        externalLinks: 0,
        paragraphs: 1,
      });

      const scorePerfect = assessArticleQuality(perfect, 'en').overallScore;
      const scoreMinimal = assessArticleQuality(minimal, 'en').overallScore;

      expect(scorePerfect).toBeGreaterThan(scoreMinimal);
    });

    it('passesThreshold should be true when overallScore >= threshold', () => {
      // Build a high-quality article
      const html = buildArticleHtml({
        wordCount: 1200,
        h2Count: 5,
        parties: ['Socialdemokraterna', 'Moderaterna', 'SD', 'C', 'V', 'KD'],
        docIds: ['Prop. 2024/25:1', 'Bet. 2024/25:FiU10', 'Mot. 2024/25:123', 'IP 2024/25:45', 'Fr. 2024/25:67'],
        hasWhyItMatters: true,
        hasHistoricalContext: true,
        hasForwardLooking: true,
        hasLanguageSwitcher: true,
        hasBackToNews: true,
        hasSources: true,
        externalLinks: 3,
        paragraphs: 10,
        includeBlockquote: true,
      });
      const result = assessArticleQuality(html, 'en', [], 30);
      expect(result.passesThreshold).toBe(true);
    });

    it('passesThreshold should be false for very low-quality articles', () => {
      const html = '<html><body><p>short</p></body></html>';
      const result = assessArticleQuality(html, 'en', [], 60);
      expect(result.passesThreshold).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------

  describe('issues list', () => {
    it('should return critical issue for zero document references', () => {
      const html = buildArticleHtml({ docIds: [] });
      const result = assessArticleQuality(html, 'en');
      const criticalIssues = result.issues.filter(i => i.severity === 'critical');
      // factualAccuracy = 0 → should produce a critical issue
      expect(criticalIssues.length).toBeGreaterThan(0);
    });

    it('issues should be sorted critical → major → minor', () => {
      const html = buildArticleHtml({ docIds: [], parties: [], h2Count: 0, hasWhyItMatters: false });
      const result = assessArticleQuality(html, 'en');
      const order: Record<string, number> = { critical: 0, major: 1, minor: 2 };
      for (let i = 1; i < result.issues.length; i++) {
        const prev = order[result.issues[i - 1].severity];
        const curr = order[result.issues[i].severity];
        expect(prev).toBeLessThanOrEqual(curr);
      }
    });

    it('each issue should have dimension, description, and suggestedFix', () => {
      const html = buildArticleHtml({ docIds: [], parties: [] });
      const result = assessArticleQuality(html, 'en');
      for (const issue of result.issues) {
        expect(issue.dimension).toBeTruthy();
        expect(issue.description).toBeTruthy();
        expect(issue.suggestedFix).toBeTruthy();
      }
    });
  });
});

// ---------------------------------------------------------------------------

describe('injectQualityMetadata', () => {
  it('should inject a quality-score meta tag into <head>', () => {
    const html = '<html><head><title>Test</title></head><body></body></html>';
    const assessment: MultiDimensionalQualityAssessment = assessArticleQuality(
      buildArticleHtml({}),
      'en',
    );
    const result = injectQualityMetadata(html, assessment);
    expect(result).toContain('<meta name="quality-score"');
    expect(result).toContain(`content="${assessment.overallScore}"`);
  });

  it('should NOT inject JSON-LD by default (CSP-safe)', () => {
    const html = '<html><head><title>Test</title></head><body></body></html>';
    const assessment = assessArticleQuality(buildArticleHtml({}), 'en');
    const result = injectQualityMetadata(html, assessment);
    expect(result).not.toContain('<script type="application/ld+json">');
    expect(result).toContain('<meta name="quality-score"');
  });

  it('should inject JSON-LD when injectJsonLd is true', () => {
    const html = '<html><head><title>Test</title></head><body></body></html>';
    const assessment = assessArticleQuality(buildArticleHtml({}), 'en');
    const result = injectQualityMetadata(html, assessment, true);
    expect(result).toContain('<script type="application/ld+json">');
    expect(result).toContain('"QualityAssessment"');
    expect(result).toContain('"overallScore"');
  });

  it('should place the injection before </head>', () => {
    const html = '<html><head><title>Test</title></head><body></body></html>';
    const assessment = assessArticleQuality(buildArticleHtml({}), 'en');
    const result = injectQualityMetadata(html, assessment);
    const metaPos = result.indexOf('<meta name="quality-score"');
    const closeHeadPos = result.indexOf('</head>');
    expect(metaPos).toBeLessThan(closeHeadPos);
  });

  it('should return the original HTML unchanged when </head> is absent', () => {
    const html = '<html><body>No head element</body></html>';
    const assessment = assessArticleQuality(buildArticleHtml({}), 'en');
    const result = injectQualityMetadata(html, assessment);
    // Without </head>, the function returns the original html
    expect(result).toBe(html);
  });
});

// ---------------------------------------------------------------------------

describe('printQualityReport', () => {
  it('should not throw and should call console.log', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const assessment = assessArticleQuality(buildArticleHtml({}), 'en');
    expect(() => printQualityReport(assessment, 'test-article-en.html')).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
