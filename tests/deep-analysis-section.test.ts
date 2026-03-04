/**
 * Tests for generateDeepAnalysisSection (5W framework)
 * Validates rendering logic, threshold behavior, and localized label output.
 */

import { describe, it, expect } from 'vitest';
import { generateDeepAnalysisSection } from '../scripts/data-transformers/content-generators/shared.js';
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
  it('returns empty string when fewer than 2 documents are provided', () => {
    expect(generateDeepAnalysisSection({ documents: [], lang: 'en', articleType: 'committee' })).toBe('');
    expect(generateDeepAnalysisSection({ documents: [makeDoc()], lang: 'en', articleType: 'committee' })).toBe('');
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
});
