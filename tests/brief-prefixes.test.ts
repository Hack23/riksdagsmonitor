/**
 * Unit tests for `scripts/render-lib/aggregator/seo/brief-prefixes.ts`.
 *
 * Covers:
 *  - All 14 languages have at least one canonical prefix form.
 *  - The compiled regex is cached per-language (same `RegExp` instance
 *    returned on repeated calls — avoids per-article sort + recompile).
 *  - `stripBriefPrefix` removes the translated boilerplate for each
 *    language using a known live form from the corpus.
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  BRIEF_TITLE_PREFIXES,
  buildPrefixStripRegex,
  stripBriefPrefix,
  _resetPrefixRegexCacheForTests,
} from '../scripts/render-lib/aggregator/seo/brief-prefixes.js';
import type { Language } from '../scripts/types/language.js';

const ALL_LANGS: readonly Language[] = [
  'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl',
  'ar', 'he', 'ja', 'ko', 'zh',
];

describe('brief-prefixes — dictionary coverage', () => {
  it('contains entries for every supported language', () => {
    for (const lang of ALL_LANGS) {
      expect(BRIEF_TITLE_PREFIXES[lang]).toBeDefined();
      expect(BRIEF_TITLE_PREFIXES[lang].length).toBeGreaterThan(0);
    }
  });

  it('every entry is a non-empty literal string', () => {
    for (const lang of ALL_LANGS) {
      for (const entry of BRIEF_TITLE_PREFIXES[lang]) {
        expect(typeof entry).toBe('string');
        expect(entry.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('brief-prefixes — regex caching', () => {
  beforeEach(() => {
    _resetPrefixRegexCacheForTests();
  });

  it('returns the same RegExp instance across calls for the same language', () => {
    const r1 = buildPrefixStripRegex('sv');
    const r2 = buildPrefixStripRegex('sv');
    expect(r1).not.toBeNull();
    // Identity check — caching means the second call must return the
    // exact same object (no re-sort, no `new RegExp`).
    expect(r1).toBe(r2);
  });

  it('returns distinct compiled regexes for distinct languages', () => {
    const sv = buildPrefixStripRegex('sv');
    const de = buildPrefixStripRegex('de');
    const ar = buildPrefixStripRegex('ar');
    expect(sv).not.toBeNull();
    expect(de).not.toBeNull();
    expect(ar).not.toBeNull();
    expect(sv).not.toBe(de);
    expect(de).not.toBe(ar);
  });

  it('caches the result for every supported language', () => {
    // First pass populates the cache; second pass must return identity-equal instances.
    const first = new Map<Language, RegExp | null>();
    for (const lang of ALL_LANGS) first.set(lang, buildPrefixStripRegex(lang));
    for (const lang of ALL_LANGS) {
      const cached = buildPrefixStripRegex(lang);
      expect(cached).toBe(first.get(lang));
    }
  });

  it('reset cache helper clears prior compilations', () => {
    const before = buildPrefixStripRegex('fr');
    _resetPrefixRegexCacheForTests();
    const after = buildPrefixStripRegex('fr');
    // After reset, a fresh RegExp object is compiled.
    expect(after).not.toBeNull();
    expect(after).not.toBe(before);
  });
});

describe('brief-prefixes — stripBriefPrefix', () => {
  // One sample H1 per language using a canonical prefix form from the
  // dictionary, paired with the expected post-strip headline.
  const samples: ReadonlyArray<{
    lang: Language;
    h1: string;
    expected: string;
  }> = [
    { lang: 'en', h1: 'Executive Brief — Sweden Passes Migration Reform Bill', expected: 'Sweden Passes Migration Reform Bill' },
    { lang: 'sv', h1: 'Exekutiv sammanfattning — Riksdagen Antar Migrationsreform', expected: 'Riksdagen Antar Migrationsreform' },
    { lang: 'da', h1: 'Eksekutivt resumé — Folketinget Vedtager Reform', expected: 'Folketinget Vedtager Reform' },
    { lang: 'no', h1: 'Eksekutivt sammendrag — Stortinget Vedtar Reform', expected: 'Stortinget Vedtar Reform' },
    { lang: 'fi', h1: 'Tiivistelmä — Eduskunta Hyväksyy Reformin', expected: 'Eduskunta Hyväksyy Reformin' },
    { lang: 'de', h1: 'Zusammenfassung — Schwedisches Parlament Verabschiedet Reform', expected: 'Schwedisches Parlament Verabschiedet Reform' },
    { lang: 'fr', h1: 'Résumé exécutif — Le Parlement Suédois Adopte Une Réforme', expected: 'Le Parlement Suédois Adopte Une Réforme' },
    { lang: 'es', h1: 'Resumen ejecutivo — El Parlamento Sueco Aprueba Una Reforma', expected: 'El Parlamento Sueco Aprueba Una Reforma' },
    { lang: 'nl', h1: 'Samenvatting — Zweeds Parlement Neemt Hervorming Aan', expected: 'Zweeds Parlement Neemt Hervorming Aan' },
    { lang: 'ar', h1: 'ملخص تنفيذي — البرلمان السويدي يقر إصلاح قانون الهجرة', expected: 'البرلمان السويدي يقر إصلاح قانون الهجرة' },
    { lang: 'he', h1: 'תקציר מנהלים — הפרלמנט השוודי מאשר רפורמה', expected: 'הפרלמנט השוודי מאשר רפורמה' },
    { lang: 'ja', h1: 'エグゼクティブブリーフ — スウェーデン議会が移民改革法案を可決', expected: 'スウェーデン議会が移民改革法案を可決' },
    { lang: 'ko', h1: '경영진 브리프 — 스웨덴 의회가 이민 개혁 법안을 통과', expected: '스웨덴 의회가 이민 개혁 법안을 통과' },
    { lang: 'zh', h1: '执行摘要 — 瑞典议会通过历史性移民改革法案', expected: '瑞典议会通过历史性移民改革法案' },
  ];

  it.each(samples)('strips the boilerplate prefix for $lang', ({ lang, h1, expected }) => {
    expect(stripBriefPrefix(h1, lang)).toBe(expected);
  });

  it('returns the text unchanged when no prefix matches', () => {
    expect(stripBriefPrefix('Riksdagen Antar Reform Med Stor Majoritet', 'sv'))
      .toBe('Riksdagen Antar Reform Med Stor Majoritet');
  });

  it('matches case-insensitively (UPPERCASE prefix)', () => {
    expect(stripBriefPrefix('EXEKUTIV SAMMANFATTNING — Riksdagen Antar Reform', 'sv'))
      .toBe('Riksdagen Antar Reform');
  });

  it('longer compound prefix wins over its shorter substring', () => {
    // `Riksdag Realtime Monitor` and `Realtime Monitor` both live in the EN list;
    // the sort-by-length-desc tie-break must prevent the shorter form from
    // matching first and leaving `Riksdag — ` as a fragment.
    expect(stripBriefPrefix('Riksdag Realtime Monitor — Plenary Vote Passes Bill', 'en'))
      .toBe('Plenary Vote Passes Bill');
  });
});
