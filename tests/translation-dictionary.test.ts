/**
 * Unit Tests for Translation Dictionary and translateSwedishContent
 *
 * Tests cover:
 * - translateTerm: exact match lookups
 * - translatePhrase: prefix matching for motion prefixes
 * - translateSwedishContent: HTML post-processing for all 14 languages
 */

import { describe, it, expect } from 'vitest';
import { translateTerm, translatePhrase } from '../scripts/translation-dictionary.js';
import { translateSwedishContent, extractTopicFromDocs } from '../scripts/generate-news-enhanced.js';

// ---------------------------------------------------------------------------
// translateTerm
// ---------------------------------------------------------------------------

describe('translateTerm', () => {
  it('returns Swedish text unchanged for sv language', () => {
    expect(translateTerm('utskott', 'sv')).toBe('utskott');
  });

  it('translates a known term to English', () => {
    expect(translateTerm('utskott', 'en')).toBe('committee');
  });

  it('translates a known term to German', () => {
    expect(translateTerm('riksdagen', 'de')).toBe('Riksdag');
  });

  it('translates a known term to French', () => {
    expect(translateTerm('debatt', 'fr')).toBe('débat');
  });

  it('translates a known term to Arabic', () => {
    expect(translateTerm('budget', 'ar')).toBe('الميزانية');
  });

  it('returns the original Swedish text when no translation exists', () => {
    const unknown = 'förordning om specifika tekniska krav';
    expect(translateTerm(unknown, 'en')).toBe(unknown);
  });

  it('is case-insensitive for known terms', () => {
    expect(translateTerm('Riksdagen', 'en')).toBe('the Riksdag');
    expect(translateTerm('UTSKOTT', 'en')).toBe('committee');
  });
});

// ---------------------------------------------------------------------------
// translatePhrase
// ---------------------------------------------------------------------------

describe('translatePhrase', () => {
  it('returns Swedish text unchanged for sv language', () => {
    const phrase = 'med anledning av prop. 2025/26:118 Tillståndsprövning';
    expect(translatePhrase(phrase, 'sv')).toBe(phrase);
  });

  it('translates full phrase with "med anledning av prop." prefix to English', () => {
    const phrase = 'med anledning av prop. 2025/26:118 Tillståndsprövning';
    const result = translatePhrase(phrase, 'en');
    expect(result).toContain('in response to prop.');
    expect(result).toContain('2025/26:118');
  });

  it('translates full phrase with "med anledning av prop." prefix to German', () => {
    const phrase = 'med anledning av prop. 2025/26:118 Tillståndsprövning';
    const result = translatePhrase(phrase, 'de');
    expect(result).toContain('als Reaktion auf Prop.');
  });

  it('translates exact committee name match to English', () => {
    expect(translatePhrase('finansutskottet', 'en')).toBe('Committee on Finance');
  });

  it('returns original text when no match found', () => {
    const phrase = 'En ny vapenlag';
    // Not in dictionary – should return as-is
    expect(translatePhrase(phrase, 'de')).toBe(phrase);
  });

  it('handles "regeringens proposition" prefix', () => {
    const phrase = 'regeringens proposition 2025/26:117 ett slopat krav';
    const result = translatePhrase(phrase, 'en');
    expect(result.toLowerCase()).toContain('government bill');
  });
});

// ---------------------------------------------------------------------------
// translateSwedishContent
// ---------------------------------------------------------------------------

describe('translateSwedishContent', () => {
  const swSpan = (text: string) =>
    `<span data-translate="true" lang="sv">${text}</span>`;

  it('removes data-translate attribute but keeps Swedish text for sv language', () => {
    const html = `<p>${swSpan('riksdagen')}</p>`;
    const result = translateSwedishContent(html, 'sv');
    expect(result).not.toContain('data-translate');
    expect(result).toContain('riksdagen');
    expect(result).toContain('lang="sv"');
  });

  it('translates known term and removes data-translate marker for en language', () => {
    const html = `<p>${swSpan('utskott')}</p>`;
    const result = translateSwedishContent(html, 'en');
    expect(result).not.toContain('data-translate');
    expect(result).not.toContain('lang="sv"');
    expect(result).toContain('committee');
  });

  it('translates known term to German', () => {
    const html = `<p>${swSpan('finansutskottet')}</p>`;
    const result = translateSwedishContent(html, 'de');
    expect(result).toContain('Finanzausschuss');
    expect(result).not.toContain('data-translate');
  });

  it('translates "med anledning av prop." prefix to English leaving remainder intact', () => {
    const phrase = 'med anledning av prop. 2025/26:118 Tillståndsprövning';
    const html = `<h4>${swSpan(phrase)}</h4>`;
    const result = translateSwedishContent(html, 'en');
    expect(result).toContain('in response to prop.');
    expect(result).toContain('2025/26:118');
    expect(result).not.toContain('data-translate');
  });

  it('handles multiple data-translate spans in one HTML string', () => {
    const html = `<p>${swSpan('utskott')} ${swSpan('votering')}</p>`;
    const result = translateSwedishContent(html, 'en');
    expect(result).toContain('committee');
    expect(result).toContain('vote');
    expect(result).not.toContain('data-translate');
  });

  it('leaves non-translate content unchanged', () => {
    const html = '<p>This is <strong>English</strong> text.</p>';
    expect(translateSwedishContent(html, 'en')).toBe(html);
  });

  it('translates to Arabic', () => {
    const html = `<p>${swSpan('riksdagen')}</p>`;
    const result = translateSwedishContent(html, 'ar');
    expect(result).toContain('البرلمان السويدي');
  });

  it('translates to Japanese', () => {
    const html = `<p>${swSpan('utbildning')}</p>`;
    const result = translateSwedishContent(html, 'ja');
    expect(result).toContain('教育');
  });

  it('translates to Chinese', () => {
    const html = `<p>${swSpan('budget')}</p>`;
    const result = translateSwedishContent(html, 'zh');
    expect(result).toContain('预算');
  });

  it('keeps untranslated Swedish text (no match) but still removes data-translate marker', () => {
    const phrase = 'En ny vapenlag';
    const html = `<p>${swSpan(phrase)}</p>`;
    const result = translateSwedishContent(html, 'de');
    expect(result).not.toContain('data-translate');
    expect(result).toContain(phrase);
  });

  it('handles spans inside anchor tags', () => {
    const html = `<a href="https://example.com">${swSpan('motion')}</a>`;
    const result = translateSwedishContent(html, 'fr');
    expect(result).toContain('motion');
    expect(result).not.toContain('data-translate');
  });

  it('handles alternate attribute order (lang="sv" before data-translate)', () => {
    const html = '<p><span lang="sv" data-translate="true">utskott</span></p>';
    const result = translateSwedishContent(html, 'en');
    expect(result).toContain('committee');
    expect(result).not.toContain('data-translate');
  });
});

// ---------------------------------------------------------------------------
// extractTopicFromDocs (#456 content-based titles)
// ---------------------------------------------------------------------------

describe('extractTopicFromDocs', () => {
  it('returns empty string for empty docs array', () => {
    expect(extractTopicFromDocs([])).toBe('');
  });

  it('returns cleaned title from first document', () => {
    const docs = [{ titel: 'Tillståndsprövning enligt förnybartdirektivet' }];
    const result = extractTopicFromDocs(docs);
    expect(result).toBe('Tillståndsprövning enligt förnybartdirektivet');
  });

  it('strips "Regeringens proposition YYYY/YY:NNN" prefix', () => {
    const docs = [{ titel: 'Regeringens proposition 2025/26:118 Tillståndsprövning' }];
    const result = extractTopicFromDocs(docs);
    expect(result).toBe('Tillståndsprövning');
  });

  it('skips "med anledning av prop." entries in favour of a real title', () => {
    const docs = [
      { titel: 'med anledning av prop. 2025/26:118 X' },
      { titel: 'En tydlig proposition om bostäder' },
    ];
    const result = extractTopicFromDocs(docs);
    expect(result).toBe('En tydlig proposition om bostäder');
  });

  it('falls back to the only doc even if it is a "med anledning av" entry', () => {
    const docs = [{ titel: 'med anledning av prop. 2025/26:1 Y' }];
    const result = extractTopicFromDocs(docs);
    // Should still return something (not empty)
    expect(result.length).toBeGreaterThan(0);
  });

  it('truncates long titles at maxLength and ends with ellipsis', () => {
    const longTitle = 'A'.repeat(60);
    const result = extractTopicFromDocs([{ titel: longTitle }], 50);
    expect(result.length).toBeLessThanOrEqual(53); // "…" adds 1 char after trim
    expect(result).toContain('…');
  });

  it('uses "title" field when "titel" is absent', () => {
    const docs = [{ title: 'English title' }];
    const result = extractTopicFromDocs(docs);
    expect(result).toBe('English title');
  });

  it('prefers "titel" over "title" when both are present', () => {
    const docs = [{ titel: 'Swedish titel', title: 'English title' }];
    const result = extractTopicFromDocs(docs);
    expect(result).toBe('Swedish titel');
  });
});
