/**
 * @module Tests/SitemapHtml/LeafModules
 * @description Unit tests for the bounded-context leaf modules of the
 * sitemap-HTML generator (Round-6 split).
 *
 * Covers the pure helpers and the language-meta data shape:
 *   - escapeHtml
 *   - LANGUAGE_META — coverage of all 14 languages and shape invariants
 *
 * The article scanner / page renderer are exercised by
 * `generate-sitemap-html.test.ts` via the CLI shim's barrel re-export;
 * this file pins the unit-level invariants of the new leaves.
 */
import { describe, it, expect } from 'vitest';

import { escapeHtml } from '../scripts/sitemap-html/escape.js';
import { LANGUAGE_META } from '../scripts/sitemap-html/i18n.js';
import type { Language } from '../scripts/types/language.js';

describe('sitemap-html/escape.ts — escapeHtml', () => {
  it('escapes the five HTML metacharacters', () => {
    expect(escapeHtml(`<a href="x" title='y'>a & b</a>`))
      .toBe('&lt;a href=&quot;x&quot; title=&#039;y&#039;&gt;a &amp; b&lt;/a&gt;');
  });

  it('preserves valid pre-encoded entities (named, numeric, hex)', () => {
    const input = '&amp; &#39; &#x27; &lt; &gt;';
    expect(escapeHtml(input)).toBe(input);
  });

  it('escapes a stray ampersand in slogans like "R&D"', () => {
    expect(escapeHtml('R&D')).toBe('R&amp;D');
  });

  it('uses HTML-canonical &#039; for apostrophes (NOT XML &apos;)', () => {
    expect(escapeHtml("don't")).toBe('don&#039;t');
  });
});

describe('sitemap-html/i18n.ts — LANGUAGE_META', () => {
  const ALL_LANGS: readonly Language[] = [
    'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh',
  ];

  it('has an entry for every supported language', () => {
    for (const lang of ALL_LANGS) {
      expect(LANGUAGE_META[lang]).toBeDefined();
    }
  });

  it.each(ALL_LANGS)('the %s entry has a non-empty native name and flag', (lang) => {
    const m = LANGUAGE_META[lang];
    expect(m.nativeName.length).toBeGreaterThan(0);
    expect(m.flag.length).toBeGreaterThan(0);
    expect(m.name.length).toBeGreaterThan(0);
  });

  it('uses BCP-47 hreflang `nb` for the `no` entry (Norwegian Bokmål)', () => {
    expect(LANGUAGE_META.no.hreflang).toBe('nb');
  });

  it('uses RTL direction for Arabic and Hebrew, LTR for everything else', () => {
    expect(LANGUAGE_META.ar.dir).toBe('rtl');
    expect(LANGUAGE_META.he.dir).toBe('rtl');
    for (const lang of ALL_LANGS.filter((l) => l !== 'ar' && l !== 'he')) {
      expect(LANGUAGE_META[lang].dir).toBe('ltr');
    }
  });

  it('every entry exposes the translations bundle used by the renderer', () => {
    for (const lang of ALL_LANGS) {
      const t = LANGUAGE_META[lang].translations;
      expect(typeof t.siteMap).toBe('string');
      expect(typeof t.completeNavigation).toBe('string');
      expect(typeof t.recentArticles).toBe('string');
      expect(typeof t.ciaDashboard).toBe('string');
      expect(typeof t.home).toBe('string');
    }
  });
});
