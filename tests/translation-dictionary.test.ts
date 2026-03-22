/**
 * Unit Tests for Translation Dictionary and translateSwedishContent
 *
 * Tests cover:
 * - translateTerm: exact match lookups
 * - translatePhrase: prefix matching for motion prefixes
 * - translateSwedishContent: HTML post-processing for all 14 languages
 */

import { describe, it, expect } from 'vitest';
import { translateTerm, translatePhrase, translateSwedishContent } from '../scripts/translation-dictionary.js';

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
    // span is preserved for accessibility, only data-translate marker removed
    expect(result).toContain('lang="sv"');
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

  it('translates to Danish (da)', () => {
    const html = `<p>${swSpan('riksdagen')}</p>`;
    const result = translateSwedishContent(html, 'da');
    expect(result).not.toContain('data-translate');
    expect(result).toContain('lang="sv"');
    expect(result).toContain('Riksdag');
  });

  it('translates to Norwegian (no)', () => {
    const html = `<p>${swSpan('utskott')}</p>`;
    const result = translateSwedishContent(html, 'no');
    expect(result).not.toContain('data-translate');
    expect(result).toContain('komité');
  });

  it('translates to Finnish (fi)', () => {
    const html = `<p>${swSpan('riksdagen')}</p>`;
    const result = translateSwedishContent(html, 'fi');
    expect(result).not.toContain('data-translate');
    expect(result).toContain('Riksdag');
  });

  it('translates to Spanish (es)', () => {
    const html = `<p>${swSpan('riksdagen')}</p>`;
    const result = translateSwedishContent(html, 'es');
    expect(result).not.toContain('data-translate');
    expect(result).toContain('Riksdag');
  });

  it('translates to Dutch (nl)', () => {
    const html = `<p>${swSpan('utskott')}</p>`;
    const result = translateSwedishContent(html, 'nl');
    expect(result).not.toContain('data-translate');
    expect(result).toContain('commissie');
  });

  it('translates to Hebrew (he)', () => {
    const html = `<p>${swSpan('riksdagen')}</p>`;
    const result = translateSwedishContent(html, 'he');
    expect(result).not.toContain('data-translate');
    expect(result).toContain('הריקסדאג');
  });

  it('translates to Korean (ko)', () => {
    const html = `<p>${swSpan('riksdagen')}</p>`;
    const result = translateSwedishContent(html, 'ko');
    expect(result).not.toContain('data-translate');
    expect(result).toContain('스웨덴 의회');
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
// New term category coverage tests
// ---------------------------------------------------------------------------

import { DICTIONARIES } from '../scripts/translation-dictionary.js';

const NON_SV_LANGUAGES = [
  'en', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
] as const;

describe('Term category coverage', () => {
  describe('ministry names (11 ministries)', () => {
    const ministries = [
      'finansdepartementet', 'justitiedepartementet', 'utrikesdepartementet',
      'försvarsdepartementet', 'socialdepartementet', 'utbildningsdepartementet',
      'miljödepartementet', 'näringsdepartementet', 'kulturdepartementet',
      'infrastrukturdepartementet', 'arbetsmarknadsdepartementet',
    ];

    it('should translate all 11 ministries to English', () => {
      for (const m of ministries) {
        expect(translateTerm(m, 'en')).not.toBe(m);
      }
    });

    it('should translate all 11 ministries to all non-SV languages', () => {
      for (const lang of NON_SV_LANGUAGES) {
        for (const m of ministries) {
          expect(translateTerm(m, lang)).not.toBe(m);
        }
      }
    });
  });

  describe('party group names (8 parties)', () => {
    const parties = [
      'socialdemokraterna', 'moderaterna', 'sverigedemokraterna', 'centerpartiet',
      'vänsterpartiet', 'kristdemokraterna', 'liberalerna', 'miljöpartiet',
    ];

    it('should translate all 8 party names to English', () => {
      for (const p of parties) {
        expect(translateTerm(p, 'en')).not.toBe(p);
      }
    });
  });

  describe('parliamentary procedure terms', () => {
    it('should translate key procedure terms', () => {
      expect(translateTerm('betänkande', 'en')).toBe('committee report');
      expect(translateTerm('remiss', 'en')).toBe('referral');
      expect(translateTerm('yttrande', 'en')).toBe('opinion');
      expect(translateTerm('bordläggning', 'en')).toBe('tabling');
      expect(translateTerm('anmälan', 'en')).toBe('notification');
    });
  });

  describe('budget and fiscal terms', () => {
    it('should translate budget terms', () => {
      expect(translateTerm('anslag', 'en')).toBe('appropriation');
      expect(translateTerm('utgiftsområde', 'en')).toBe('expenditure area');
      expect(translateTerm('utgiftstak', 'en')).toBe('expenditure ceiling');
      expect(translateTerm('budgetpropositionen', 'en')).toBe('the Budget Bill');
    });
  });

  describe('EU/international terms', () => {
    it('should translate EU terms', () => {
      expect(translateTerm('ordförandeskap', 'en')).toBe('presidency');
      expect(translateTerm('subsidiaritetsgranskning', 'en')).toBe('subsidiarity review');
      expect(translateTerm('europeiska unionen', 'en')).toBe('European Union');
    });
  });

  describe('geographic/regional terms', () => {
    it('should translate geographic terms', () => {
      expect(translateTerm('landsting', 'en')).toBe('county council');
      expect(translateTerm('kommunalförbund', 'en')).toBe('municipal federation');
      expect(translateTerm('kommun', 'en')).toBe('municipality');
    });
  });

  describe('dictionary breadth', () => {
    it('should have at least 200 terms for English', () => {
      const enDict = DICTIONARIES['en']!;
      expect(Object.keys(enDict).length).toBeGreaterThanOrEqual(200);
    });

    it('should have dictionaries for all 13 non-SV languages', () => {
      for (const lang of NON_SV_LANGUAGES) {
        expect(DICTIONARIES[lang]).toBeDefined();
        expect(Object.keys(DICTIONARIES[lang]!).length).toBeGreaterThan(100);
      }
    });
  });
});
