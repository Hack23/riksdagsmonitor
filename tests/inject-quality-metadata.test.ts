/**
 * Tests for injectQualityMetadata — quality meta tag injection.
 *
 * Verifies that quality meta tags are correctly injected, handles
 * idempotent re-injection (no duplicates), and works with case-insensitive
 * </head> matching.
 */

import { describe, it, expect } from 'vitest';
import { injectQualityMetadata } from '../scripts/generate-news-enhanced/helpers.js';

describe('injectQualityMetadata', () => {
  const baseHtml = '<html><head><title>Test</title></head><body></body></html>';

  it('injects quality meta tags before </head>', () => {
    const result = injectQualityMetadata(baseHtml);
    expect(result).toContain('<meta name="article:quality-score" content="0">');
    expect(result).toContain('<meta name="article:quality-version" content="v2">');
    expect(result).toContain('<meta name="article:quality-iterations" content="0">');
    expect(result).toContain('<meta name="article:quality-assessed" content="false">');
    expect(result).toContain('</head>');
  });

  it('injects assessment-aware tags when assessment provided', () => {
    const assessment = {
      overallScore: 85,
      assessmentPasses: 3,
      passesThreshold: true,
      dimensions: {
        factualAccuracy: { score: 90, maxScore: 100, label: 'good' },
        stakeholderCoverage: { score: 80, maxScore: 100, label: 'good' },
        analyticalDepth: { score: 85, maxScore: 100, label: 'good' },
        editorialConsistency: { score: 88, maxScore: 100, label: 'good' },
        evidenceQuality: { score: 82, maxScore: 100, label: 'good' },
        languageQuality: { score: 90, maxScore: 100, label: 'good' },
      },
      issues: [],
      suggestions: [],
    };
    const result = injectQualityMetadata(baseHtml, assessment);
    expect(result).toContain('content="85"');
    expect(result).toContain('content="3"');
    expect(result).toContain('<meta name="article:quality-assessed" content="true">');
  });

  it('is idempotent — no duplicate tags after multiple calls', () => {
    const first = injectQualityMetadata(baseHtml);
    const second = injectQualityMetadata(first);
    const scoreMatches = second.match(/article:quality-score/g) ?? [];
    expect(scoreMatches).toHaveLength(1);
    const versionMatches = second.match(/article:quality-version/g) ?? [];
    expect(versionMatches).toHaveLength(1);
    const iterMatches = second.match(/article:quality-iterations/g) ?? [];
    expect(iterMatches).toHaveLength(1);
    const assessedMatches = second.match(/article:quality-assessed/g) ?? [];
    expect(assessedMatches).toHaveLength(1);
  });

  it('handles case-insensitive </HEAD> tag', () => {
    const upperHtml = '<html><head><title>Test</title></HEAD><body></body></html>';
    const result = injectQualityMetadata(upperHtml);
    expect(result).toContain('<meta name="article:quality-score"');
    expect(result).toContain('</HEAD>');
  });

  it('handles mixed-case </Head> tag', () => {
    const mixedHtml = '<html><head><title>Test</title></Head><body></body></html>';
    const result = injectQualityMetadata(mixedHtml);
    expect(result).toContain('<meta name="article:quality-score"');
    expect(result).toContain('</Head>');
  });

  it('returns HTML unchanged when no </head> tag present', () => {
    const noHead = '<html><body>content</body></html>';
    const result = injectQualityMetadata(noHead);
    // Tags cannot be inserted without </head>, but existing ones are still stripped
    expect(result).not.toContain('article:quality-score');
  });
});
