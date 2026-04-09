/**
 * Tests for generateDeepAnalysisSection (5W framework)
 * Validates rendering logic, threshold behavior, and localized label output.
 */

import { describe, it, expect } from 'vitest';
import { generateDeepAnalysisSection, detectBannedPatterns } from '../scripts/data-transformers/content-generators/shared.js';
import type { RawDocument } from '../scripts/data-transformers/types.js';

/** Helper to create minimal RawDocument stubs */
function makeDoc(overrides: Partial<RawDocument> = {}): RawDocument {
  return {
    titel: 'Test document',
    doktyp: 'mot',
    organ: 'FiU',
    parti: 'S',
    ...overrides,
  };
}

describe('generateDeepAnalysisSection', () => {
  it('returns empty string when fewer than 2 documents are provided for non-deep-inspection', () => {
    expect(generateDeepAnalysisSection({ documents: [], lang: 'en', articleType: 'committee' })).toBe('');
    expect(generateDeepAnalysisSection({ documents: [makeDoc()], lang: 'en', articleType: 'committee' })).toBe('');
  });

  it('returns a non-empty section when 1 document is provided for deep-inspection', () => {
    const result = generateDeepAnalysisSection({
      documents: [makeDoc()],
      lang: 'en',
      articleType: 'deep-inspection',
    });
    expect(result).not.toBe('');
    expect(result).toContain('<section class="deep-analysis"');
    expect(result).toContain('</section>');
  });

  it('still returns empty for deep-inspection with 0 documents', () => {
    expect(generateDeepAnalysisSection({ documents: [], lang: 'en', articleType: 'deep-inspection' })).toBe('');
  });

  it('returns a non-empty section when 2+ documents are provided', () => {
    const result = generateDeepAnalysisSection({
      documents: [makeDoc(), makeDoc({ parti: 'M', organ: 'UU' })],
      lang: 'en',
      articleType: 'committee',
    });
    expect(result).not.toBe('');
    expect(result).toContain('<section class="deep-analysis"');
    expect(result).toContain('</section>');
  });

  it('renders expected 5W heading labels in English', () => {
    const docs = [makeDoc(), makeDoc({ parti: 'M' }), makeDoc({ parti: 'SD' })];
    const result = generateDeepAnalysisSection({ documents: docs, lang: 'en', articleType: 'propositions' });

    expect(result).toContain('Deep Analysis');
    expect(result).toContain('Key Actors');
    expect(result).toContain('What Happened');
    expect(result).toContain('Timeline &amp; Context');
    expect(result).toContain('Why This Matters');
    expect(result).toContain('Winners &amp; Losers');
  });

  it('renders localized labels in Swedish', () => {
    const docs = [makeDoc(), makeDoc({ parti: 'M' })];
    const result = generateDeepAnalysisSection({ documents: docs, lang: 'sv', articleType: 'motions' });

    // Swedish deep analysis heading
    expect(result).toContain('Djupanalys');
  });

  it('escapes whyContext to prevent XSS', () => {
    const docs = [makeDoc(), makeDoc({ parti: 'M' })];
    const malicious = '<script>alert("xss")</script>';
    const result = generateDeepAnalysisSection({
      documents: docs,
      lang: 'en',
      articleType: 'committee',
      whyContext: malicious,
    });

    // The raw script tag should NOT appear unescaped
    expect(result).not.toContain('<script>');
    // Escaped version should be present
    expect(result).toContain('&lt;script&gt;');
  });

  it('includes party names from documents in the Who section', () => {
    const docs = [
      makeDoc({ parti: 'S' }),
      makeDoc({ parti: 'M' }),
    ];
    const result = generateDeepAnalysisSection({ documents: docs, lang: 'en', articleType: 'generic' });

    expect(result).toContain('S');
    expect(result).toContain('M');
  });

  it('does not produce any banned boilerplate patterns', () => {
    const docs = [makeDoc(), makeDoc({ parti: 'M' }), makeDoc({ parti: 'SD', doktyp: 'prop' })];
    const result = generateDeepAnalysisSection({ documents: docs, lang: 'en', articleType: 'propositions' });
    const banned = detectBannedPatterns(result);
    expect(banned).toEqual([]);
  });

  it('uses the winners/losers AI replacement marker for fallback', () => {
    // All motions (no gov docs) and no CIA context → should hit the fallback branch
    const docs = [makeDoc({ doktyp: 'mot' }), makeDoc({ doktyp: 'mot', parti: 'M' })];
    const result = generateDeepAnalysisSection({ documents: docs, lang: 'en', articleType: 'motions' });
    expect(result).toContain('<!-- AI_MUST_REPLACE: winners_losers_analysis —');
  });

  it('emits AI_MUST_REPLACE markers in Deep Analysis subsections', () => {
    const docs = [makeDoc({ doktyp: 'prop' }), makeDoc({ doktyp: 'mot', parti: 'M' })];
    const result = generateDeepAnalysisSection({ documents: docs, lang: 'en', articleType: 'propositions' });

    // Timeline, why-matters, impact, consequences, and critical subsections should all contain markers
    expect(result).toContain('AI_MUST_REPLACE: timeline_context');
    expect(result).toContain('AI_MUST_REPLACE: political_impact');
    expect(result).toContain('AI_MUST_REPLACE: consequences');
    expect(result).toContain('AI_MUST_REPLACE: critical_assessment');
  });

  it('all AI_MUST_REPLACE markers include language requirement', () => {
    const docs = [makeDoc({ doktyp: 'prop' }), makeDoc({ doktyp: 'mot', parti: 'M' })];
    const result = generateDeepAnalysisSection({ documents: docs, lang: 'en', articleType: 'propositions' });

    // Extract all AI_MUST_REPLACE markers from the output
    const markers = result.match(/<!-- AI_MUST_REPLACE:.*?-->/g) || [];
    expect(markers.length).toBeGreaterThan(0);
    for (const marker of markers) {
      expect(marker).toContain("Output MUST be in the article's language");
    }
  });

  it('does not emit deprecated generic template prose in Deep Analysis output', () => {
    const docs = [
      makeDoc({ doktyp: 'prop' }),
      makeDoc({ doktyp: 'mot', parti: 'M' }),
      makeDoc({ doktyp: 'bet', parti: 'SD' }),
    ];
    const result = generateDeepAnalysisSection({ documents: docs, lang: 'en', articleType: 'propositions' });

    // None of the old generic template text should appear
    expect(result).not.toContain('The pace of activity signals the political urgency');
    expect(result).not.toContain('broad legislative push that will shape multiple aspects');
    expect(result).not.toContain('culmination of legislative review');
    expect(result).not.toContain('cascade through committee deliberations');
    expect(result).not.toContain('Standard parliamentary procedures are being followed');
  });
});
