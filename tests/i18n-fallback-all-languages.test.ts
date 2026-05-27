/**
 * @module Tests/I18n/FallbackAllLanguages
 * @category Intelligence Operations / Tests
 * @name Comprehensive i18n fallback strategy verification for all 14 languages
 *
 * @description
 * Ensures that the i18n system works correctly for all 14 supported
 * languages (EN, SV, DA, NO, FI, DE, FR, ES, NL, AR, HE, JA, KO, ZH).
 *
 * The fallback strategy contract:
 *   1. When a translation exists → use the translated value.
 *   2. When no translation exists → fall back to English.
 *   3. Every language MUST produce non-empty titles, descriptions, keywords.
 *   4. Non-EN languages MUST NOT leak English-only tokens.
 *   5. RTL languages (AR, HE) must produce RTL-compatible content.
 *   6. CJK languages (JA, KO, ZH) must respect tighter SERP budgets.
 *
 * Tests sample:
 *   - Titles with translations (articleTypeLabel)
 *   - Titles without translations (unknown type fallback)
 *   - Descriptions for all languages
 *   - Keywords for all languages (checking both seeded and unseeded)
 *   - Chrome strings fallback
 *   - LANGUAGE_META translations completeness
 *   - News-index i18n strings completeness
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';

import type { Language } from '../scripts/types/language.js';
import { LANGUAGE_META } from '../scripts/sitemap-html/i18n.js';
import { CHROME_I18N, chromeStrings } from '../scripts/render-lib/chrome-i18n.js';
import { ARTICLE_TYPE_LABEL_I18N, articleTypeLabel, articleTypeIcon } from '../scripts/render-lib/article-type-i18n.js';
import { buildSeoTitle, buildSeoDescription, buildArticleKeywords } from '../scripts/render-lib/article-seo.js';
import { mergeLocalizedWithEnglish, buildEnglishCoverageBoundary } from '../scripts/render-lib/article-merge.js';
import { CLEAR_FILTERS_LABELS, RECENCY_LABELS, HERO_METRIC_LABELS, localizeClearFilters, buildRecencyLabels, heroMetricLabels, toBcp47 } from '../scripts/generate-news-indexes/template/i18n.js';

const ALL_LANGUAGES: readonly Language[] = [
  'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl',
  'ar', 'he', 'ja', 'ko', 'zh',
];

const RTL_LANGUAGES: readonly Language[] = ['ar', 'he'];
const CJK_LANGUAGES: readonly Language[] = ['ja', 'ko', 'zh'];
const LATIN_LTR_LANGUAGES: readonly Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl'];

// ─── Sample SEO inputs for testing ──────────────────────────────────────────

const SAMPLE_TITLES: Record<Language, string> = {
  en: 'Sweden Passes AI Facial Recognition Law',
  sv: 'Sverige antar lag om AI-ansiktsigenkänning',
  da: 'Sverige vedtager lov om AI-ansigtsgenkendelse',
  no: 'Sverige vedtar lov om AI-ansiktsgjenkjenning',
  fi: 'Ruotsi hyväksyy tekoälyn kasvojentunnistuslain',
  de: 'Schweden verabschiedet KI-Gesichtserkennungsgesetz',
  fr: 'La Suède adopte une loi sur la reconnaissance faciale par IA',
  es: 'Suecia aprueba ley de reconocimiento facial con IA',
  nl: 'Zweden neemt AI-gezichtsherkenwet aan',
  ar: 'السويد تقر قانون التعرف على الوجوه بالذكاء الاصطناعي',
  he: 'שוודיה מאשרת חוק זיהוי פנים מבוסס AI',
  ja: 'スウェーデンがAI顔認識法を可決',
  ko: '스웨덴, AI 안면 인식 법 통과',
  zh: '瑞典通过AI人脸识别法',
};

const SAMPLE_DESCRIPTIONS: Record<Language, string> = {
  en: 'The Swedish Parliament approved a comprehensive framework for AI-powered facial recognition technology in public spaces, setting strict boundaries for law enforcement use.',
  sv: 'Sveriges riksdag godkände ett omfattande ramverk för AI-driven ansiktsigenkänningsteknik i offentliga rum, med strikta gränser för brottsbekämpning.',
  da: 'Sveriges Rigsdag godkendte en omfattende ramme for AI-drevet ansigtsgenkendelsesteknologi i offentlige rum.',
  no: 'Sveriges riksdag godkjente et omfattende rammeverk for AI-drevet ansiktsgjenkjenningsteknologi i offentlige rom.',
  fi: 'Ruotsin valtiopäivät hyväksyi kattavan kehyksen tekoälypohjaiselle kasvojentunnistusteknologialle julkisissa tiloissa.',
  de: 'Das schwedische Parlament billigte einen umfassenden Rahmen für KI-gestützte Gesichtserkennungstechnologie im öffentlichen Raum.',
  fr: "Le Parlement suédois a approuvé un cadre complet pour la technologie de reconnaissance faciale par IA dans les espaces publics.",
  es: 'El Parlamento sueco aprobó un marco integral para la tecnología de reconocimiento facial con IA en espacios públicos.',
  nl: 'Het Zweedse parlement keurde een uitgebreid kader goed voor AI-gezichtsherkenningstechnologie in de openbare ruimte.',
  ar: 'وافق البرلمان السويدي على إطار شامل لتقنية التعرف على الوجوه بالذكاء الاصطناعي في الأماكن العامة.',
  he: 'הפרלמנט השוודי אישר מסגרת מקיפה לטכנולוגיית זיהוי פנים מבוססת AI במרחבים ציבוריים.',
  ja: 'スウェーデン議会は公共空間におけるAI顔認識技術の包括的な枠組みを承認した。',
  ko: '스웨덴 의회는 공공 장소에서의 AI 안면 인식 기술에 대한 포괄적 프레임워크를 승인했습니다.',
  zh: '瑞典议会批准了公共空间AI人脸识别技术的综合框架。',
};

// ─── 1. LANGUAGE_META completeness ──────────────────────────────────────────

describe('LANGUAGE_META — all 14 languages complete', () => {
  it('has an entry for every supported language', () => {
    for (const lang of ALL_LANGUAGES) {
      expect(LANGUAGE_META[lang], `missing LANGUAGE_META entry for ${lang}`).toBeDefined();
    }
  });

  it('every entry has non-empty nativeName, flag, locale, hreflang', () => {
    for (const lang of ALL_LANGUAGES) {
      const meta = LANGUAGE_META[lang];
      expect(meta.nativeName.length, `${lang} nativeName empty`).toBeGreaterThan(0);
      expect(meta.flag.length, `${lang} flag empty`).toBeGreaterThan(0);
      expect(meta.locale.length, `${lang} locale empty`).toBeGreaterThan(0);
      expect(meta.hreflang.length, `${lang} hreflang empty`).toBeGreaterThan(0);
    }
  });

  it('RTL languages have dir="rtl"', () => {
    for (const lang of RTL_LANGUAGES) {
      expect(LANGUAGE_META[lang].dir, `${lang} should be RTL`).toBe('rtl');
    }
  });

  it('LTR languages have dir="ltr"', () => {
    for (const lang of [...LATIN_LTR_LANGUAGES, ...CJK_LANGUAGES]) {
      expect(LANGUAGE_META[lang].dir, `${lang} should be LTR`).toBe('ltr');
    }
  });

  it('Norwegian uses BCP-47 "nb" for hreflang', () => {
    expect(LANGUAGE_META.no.hreflang).toBe('nb');
  });

  it('every language has complete translations object', () => {
    const requiredKeys = [
      'siteMap', 'completeNavigation', 'quickJumpTo', 'mainPlatform',
      'dashboards', 'newsAnalysis', 'multiLanguage', 'home', 'newsIndex',
      'newsDesc', 'articleEnglishCoverageHeading', 'articleEnglishCoverageNote',
      'articleTrustAriaLabel', 'articleTrustPublicSources', 'articleTrustAiFirst',
      'articleTrustTraceable', 'articleSourcesHeading', 'articleSourcesDesc',
      'articleReaderGuideHeading', 'articleReaderGuideDesc',
    ];
    for (const lang of ALL_LANGUAGES) {
      const t = LANGUAGE_META[lang].translations;
      for (const key of requiredKeys) {
        const value = (t as Record<string, string>)[key];
        expect(value, `${lang}.translations.${key} missing or empty`).toBeTruthy();
        expect(typeof value, `${lang}.translations.${key} not a string`).toBe('string');
      }
    }
  });

  it('non-EN articleEnglishCoverageHeading is translated (not EN copy-paste)', () => {
    const enHeading = LANGUAGE_META.en.translations.articleEnglishCoverageHeading;
    for (const lang of ALL_LANGUAGES.filter((l) => l !== 'en')) {
      const heading = LANGUAGE_META[lang].translations.articleEnglishCoverageHeading;
      expect(heading, `${lang} heading must differ from EN`).not.toBe(enHeading);
    }
  });
});

// ─── 2. Chrome i18n — all languages present, translated, fallback works ─────

describe('chromeStrings — fallback and completeness', () => {
  it('returns a non-null ChromeStrings for every language', () => {
    for (const lang of ALL_LANGUAGES) {
      const cs = chromeStrings(lang);
      expect(cs, `chromeStrings(${lang}) returned undefined`).toBeDefined();
    }
  });

  it('fallback to English for unknown language codes', () => {
    const cs = chromeStrings('xx' as Language);
    expect(cs).toBeDefined();
    expect(cs.headerTagline).toBe(CHROME_I18N.en.headerTagline);
  });

  const SAMPLE_KEYS = [
    'transparencyLabel', 'sponsorLabel', 'headerTagline', 'heroSubtitle',
    'footerAboutHeading', 'footerPoweredBy', 'news', 'dashboard',
  ] as const;

  it('every language has non-empty sample chrome strings', () => {
    for (const lang of ALL_LANGUAGES) {
      const cs = chromeStrings(lang);
      for (const key of SAMPLE_KEYS) {
        expect(
          (cs[key] as string).trim().length,
          `${lang}.${key} is empty`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('non-EN languages have translated headerTagline (no EN leak)', () => {
    const enTagline = CHROME_I18N.en.headerTagline;
    for (const lang of ALL_LANGUAGES.filter((l) => l !== 'en')) {
      expect(
        CHROME_I18N[lang].headerTagline,
        `${lang} headerTagline matches EN — not translated`,
      ).not.toBe(enTagline);
    }
  });

  it('non-EN languages have translated heroSubtitle (no EN leak)', () => {
    const enHero = CHROME_I18N.en.heroSubtitle;
    for (const lang of ALL_LANGUAGES.filter((l) => l !== 'en')) {
      expect(
        CHROME_I18N[lang].heroSubtitle,
        `${lang} heroSubtitle matches EN — not translated`,
      ).not.toBe(enHero);
    }
  });
});

// ─── 3. Article-type i18n fallback ─────────────────────────────────────────

describe('articleTypeLabel — per-language with EN fallback', () => {
  it('returns translated label for known types in every language', () => {
    for (const lang of ALL_LANGUAGES) {
      const label = articleTypeLabel('propositions', lang, 'Propositions');
      expect(label.length, `${lang} propositions label empty`).toBeGreaterThan(0);
      // Non-EN must differ from EN
      if (lang !== 'en') {
        expect(label, `${lang} propositions not translated`).not.toBe('Propositions');
      }
    }
  });

  it('falls back to English for unknown type IDs (all languages get same fallback)', () => {
    for (const lang of ALL_LANGUAGES) {
      expect(articleTypeLabel('unknown-type', lang, 'Fallback Label')).toBe('Fallback Label');
    }
  });

  it('every registered type has all 14 languages', () => {
    for (const [typeId, langMap] of Object.entries(ARTICLE_TYPE_LABEL_I18N)) {
      for (const lang of ALL_LANGUAGES) {
        expect(
          langMap[lang],
          `ARTICLE_TYPE_LABEL_I18N[${typeId}][${lang}] is missing`,
        ).toBeTruthy();
      }
    }
  });
});

// ─── 4. SEO title — per-language SERP budgets and fallback ──────────────────

describe('buildSeoTitle — all 14 languages respect budgets and fallback', () => {
  for (const lang of ALL_LANGUAGES) {
    it(`${lang}: produces non-empty title from localized input`, () => {
      const title = buildSeoTitle({
        title: SAMPLE_TITLES[lang],
        description: SAMPLE_DESCRIPTIONS[lang],
        lang,
        date: '2026-05-25',
        articleTypeLabel: articleTypeLabel('propositions', lang, 'Propositions'),
        articleTypeId: 'propositions',
      });
      expect(title.length).toBeGreaterThan(0);
    });

    it(`${lang}: falls back gracefully when title is empty`, () => {
      const title = buildSeoTitle({
        title: '',
        description: SAMPLE_DESCRIPTIONS[lang],
        lang,
        date: '2026-05-25',
        articleTypeLabel: articleTypeLabel('propositions', lang, 'Propositions'),
        articleTypeId: 'propositions',
      });
      expect(title.length).toBeGreaterThan(0);
      // Should contain the article type label as fallback
      expect(title).toContain(articleTypeLabel('propositions', lang, 'Propositions'));
    });
  }

  it('CJK titles respect 45-char budget', () => {
    for (const lang of CJK_LANGUAGES) {
      const title = buildSeoTitle({
        title: SAMPLE_TITLES[lang],
        description: SAMPLE_DESCRIPTIONS[lang],
        lang,
        date: '2026-05-25',
        articleTypeLabel: articleTypeLabel('propositions', lang, 'Propositions'),
        articleTypeId: 'propositions',
      });
      expect(title.length, `${lang} title exceeds CJK budget`).toBeLessThanOrEqual(45);
    }
  });

  it('RTL titles respect 60-char budget', () => {
    for (const lang of RTL_LANGUAGES) {
      const title = buildSeoTitle({
        title: SAMPLE_TITLES[lang],
        description: SAMPLE_DESCRIPTIONS[lang],
        lang,
        date: '2026-05-25',
        articleTypeLabel: articleTypeLabel('propositions', lang, 'Propositions'),
        articleTypeId: 'propositions',
      });
      expect(title.length, `${lang} title exceeds RTL budget`).toBeLessThanOrEqual(60);
    }
  });

  it('Latin LTR titles respect 70-char budget', () => {
    for (const lang of LATIN_LTR_LANGUAGES) {
      const title = buildSeoTitle({
        title: SAMPLE_TITLES[lang],
        description: SAMPLE_DESCRIPTIONS[lang],
        lang,
        date: '2026-05-25',
        articleTypeLabel: articleTypeLabel('propositions', lang, 'Propositions'),
        articleTypeId: 'propositions',
      });
      expect(title.length, `${lang} title exceeds Latin LTR budget`).toBeLessThanOrEqual(70);
    }
  });
});

// ─── 5. SEO description — per-language SERP budgets and fallback ────────────

describe('buildSeoDescription — all 14 languages respect budgets', () => {
  for (const lang of ALL_LANGUAGES) {
    it(`${lang}: produces non-empty description`, () => {
      const desc = buildSeoDescription({
        title: SAMPLE_TITLES[lang],
        description: SAMPLE_DESCRIPTIONS[lang],
        lang,
        date: '2026-05-25',
        articleTypeLabel: articleTypeLabel('propositions', lang, 'Propositions'),
        articleTypeId: 'propositions',
      });
      expect(desc.length, `${lang} description empty`).toBeGreaterThan(0);
    });

    it(`${lang}: returns empty string for empty description (fallback-safe)`, () => {
      const desc = buildSeoDescription({
        title: SAMPLE_TITLES[lang],
        description: '',
        lang,
        date: '2026-05-25',
        articleTypeLabel: articleTypeLabel('propositions', lang, 'Propositions'),
        articleTypeId: 'propositions',
      });
      expect(desc).toBe('');
    });
  }

  it('CJK descriptions respect 120-char budget', () => {
    for (const lang of CJK_LANGUAGES) {
      const desc = buildSeoDescription({
        title: SAMPLE_TITLES[lang],
        description: SAMPLE_DESCRIPTIONS[lang],
        lang,
        date: '2026-05-25',
        articleTypeLabel: articleTypeLabel('propositions', lang, 'Propositions'),
        articleTypeId: 'propositions',
      });
      expect(desc.length, `${lang} description exceeds CJK budget`).toBeLessThanOrEqual(120);
    }
  });

  it('RTL descriptions respect 170-char budget', () => {
    for (const lang of RTL_LANGUAGES) {
      const desc = buildSeoDescription({
        title: SAMPLE_TITLES[lang],
        description: SAMPLE_DESCRIPTIONS[lang],
        lang,
        date: '2026-05-25',
        articleTypeLabel: articleTypeLabel('propositions', lang, 'Propositions'),
        articleTypeId: 'propositions',
      });
      expect(desc.length, `${lang} description exceeds RTL budget`).toBeLessThanOrEqual(170);
    }
  });

  it('Latin LTR descriptions respect 200-char budget', () => {
    for (const lang of LATIN_LTR_LANGUAGES) {
      const desc = buildSeoDescription({
        title: SAMPLE_TITLES[lang],
        description: SAMPLE_DESCRIPTIONS[lang],
        lang,
        date: '2026-05-25',
        articleTypeLabel: articleTypeLabel('propositions', lang, 'Propositions'),
        articleTypeId: 'propositions',
      });
      expect(desc.length, `${lang} description exceeds Latin LTR budget`).toBeLessThanOrEqual(200);
    }
  });
});

// ─── 6. Keywords — per-language with EN fallback, no leakage ────────────────

describe('buildArticleKeywords — all 14 languages with fallback strategy', () => {
  for (const lang of ALL_LANGUAGES) {
    it(`${lang}: produces non-empty keywords containing Riksdagsmonitor and OSINT`, () => {
      const keywords = buildArticleKeywords({
        title: SAMPLE_TITLES[lang],
        description: SAMPLE_DESCRIPTIONS[lang],
        lang,
        date: '2026-05-25',
        articleTypeLabel: articleTypeLabel('propositions', lang, 'Propositions'),
        articleTypeId: 'propositions',
      });
      expect(keywords.length, `${lang} keywords empty`).toBeGreaterThan(0);
      expect(keywords).toContain('Riksdagsmonitor');
      expect(keywords).toContain('OSINT');
    });
  }

  it('non-EN keywords do NOT contain English-only tokens', () => {
    for (const lang of ALL_LANGUAGES.filter((l) => l !== 'en')) {
      const keywords = buildArticleKeywords({
        title: SAMPLE_TITLES[lang],
        description: SAMPLE_DESCRIPTIONS[lang],
        lang,
        date: '2026-05-25',
        articleTypeLabel: articleTypeLabel('propositions', lang, 'Propositions'),
        articleTypeId: 'propositions',
        keywords: 'English only seed, Swedish Parliament, political intelligence',
      });
      // English frontmatter seeds must NOT leak into non-EN keyword strings
      expect(keywords).not.toMatch(/\bSwedish Parliament\b/);
      expect(keywords).not.toMatch(/\bpolitical intelligence\b/);
    }
  });

  it('keywords with briefEntities seeded correctly for all languages', () => {
    const briefEntities = ['HD03267', 'JuU28', 'SÄPO', 'Migrationsverket'];
    for (const lang of ALL_LANGUAGES) {
      const keywords = buildArticleKeywords({
        title: SAMPLE_TITLES[lang],
        description: SAMPLE_DESCRIPTIONS[lang],
        lang,
        date: '2026-05-25',
        articleTypeLabel: articleTypeLabel('propositions', lang, 'Propositions'),
        articleTypeId: 'propositions',
        briefEntities,
      });
      // Brief entities are universal Swedish identifiers — appear in all languages
      expect(keywords, `${lang} missing HD03267`).toContain('HD03267');
      expect(keywords, `${lang} missing JuU28`).toContain('JuU28');
    }
  });
});

// ─── 7. Article merge — fallback boundary for all languages ─────────────────

describe('mergeLocalizedWithEnglish — fallback to English for all languages', () => {
  const ENGLISH_MD = `---
title: Sweden Passes AI Facial Recognition Law
description: The Swedish Parliament approved a comprehensive framework.
date: 2026-05-25
language: en
subfolder: propositions
---

## Analysis

Deep analysis content in English.
`;

  it('returns English unchanged for lang=en', () => {
    const result = mergeLocalizedWithEnglish({
      englishMarkdown: ENGLISH_MD,
      localizedMarkdown: '',
      lang: 'en',
    });
    expect(result).toBe(ENGLISH_MD);
  });

  for (const lang of ALL_LANGUAGES.filter((l) => l !== 'en')) {
    it(`${lang}: merges with empty localized markdown (pure EN fallback)`, () => {
      const result = mergeLocalizedWithEnglish({
        englishMarkdown: ENGLISH_MD,
        localizedMarkdown: '',
        lang,
      });
      // Must contain the English body
      expect(result).toContain('Deep analysis content in English.');
      // Must set language to target lang in front-matter
      // Note: gray-matter quotes 'no' because it's a YAML boolean-like value
      const langPattern = lang === 'no' ? /language: 'no'/ : new RegExp(`language: ${lang}`);
      expect(result).toMatch(langPattern);
    });

    it(`${lang}: merges localized body with English coverage boundary`, () => {
      const localizedMd = `---
title: ${SAMPLE_TITLES[lang]}
language: ${lang}
---

${lang === 'ja' ? '日本語の要約テキスト' : lang === 'ar' ? 'ملخص تنفيذي بالعربية' : `Localized summary for ${lang}`}
`;
      const result = mergeLocalizedWithEnglish({
        englishMarkdown: ENGLISH_MD,
        localizedMarkdown: localizedMd,
        lang,
      });
      // Must contain both localized and English content
      if (lang === 'ja') {
        expect(result).toContain('日本語の要約テキスト');
      } else if (lang === 'ar') {
        expect(result).toContain('ملخص تنفيذي بالعربية');
      } else {
        expect(result).toContain(`Localized summary for ${lang}`);
      }
      expect(result).toContain('Deep analysis content in English.');
      // Must contain the coverage boundary heading
      const heading = LANGUAGE_META[lang].translations.articleEnglishCoverageHeading;
      expect(result).toContain(heading);
    });
  }

  it('buildEnglishCoverageBoundary produces unique heading per language', () => {
    const boundaries = new Set<string>();
    for (const lang of ALL_LANGUAGES.filter((l) => l !== 'en')) {
      const boundary = buildEnglishCoverageBoundary(lang);
      expect(boundary.length).toBeGreaterThan(0);
      expect(boundary).toContain('##');
      expect(boundary).toContain('ℹ️');
      boundaries.add(boundary);
    }
    // Not all boundaries are the same — they're translated
    expect(boundaries.size).toBeGreaterThan(1);
  });
});

// ─── 8. News-index i18n — all labels present for all 14 languages ───────────

describe('news-index template i18n — all 14 languages', () => {
  it('CLEAR_FILTERS_LABELS has entry for every language', () => {
    for (const lang of ALL_LANGUAGES) {
      expect(CLEAR_FILTERS_LABELS[lang], `missing CLEAR_FILTERS_LABELS[${lang}]`).toBeTruthy();
    }
  });

  it('RECENCY_LABELS has entry for every language with all 3 keys', () => {
    for (const lang of ALL_LANGUAGES) {
      const labels = RECENCY_LABELS[lang];
      expect(labels, `missing RECENCY_LABELS[${lang}]`).toBeDefined();
      expect(labels!['today'], `${lang}.today missing`).toBeTruthy();
      expect(labels!['this-week'], `${lang}.this-week missing`).toBeTruthy();
      expect(labels!['this-month'], `${lang}.this-month missing`).toBeTruthy();
    }
  });

  it('HERO_METRIC_LABELS has entry for every language with all 4 keys', () => {
    for (const lang of ALL_LANGUAGES) {
      const labels = HERO_METRIC_LABELS[lang];
      expect(labels, `missing HERO_METRIC_LABELS[${lang}]`).toBeDefined();
      expect(labels!.articles, `${lang}.articles missing`).toBeTruthy();
      expect(labels!.languages, `${lang}.languages missing`).toBeTruthy();
      expect(labels!.latest, `${lang}.latest missing`).toBeTruthy();
      expect(labels!.pipeline, `${lang}.pipeline missing`).toBeTruthy();
    }
  });

  it('localizeClearFilters falls back to English for unknown language', () => {
    expect(localizeClearFilters('xx')).toBe('Clear filters');
  });

  it('buildRecencyLabels falls back to English for unknown language', () => {
    const labels = buildRecencyLabels('xx');
    expect(labels['today']).toBe('Today');
    expect(labels['this-week']).toBe('This week');
    expect(labels['this-month']).toBe('This month');
  });

  it('heroMetricLabels falls back to English for unknown language', () => {
    const labels = heroMetricLabels('xx');
    expect(labels.articles).toBe('Articles indexed');
    expect(labels.languages).toBe('Languages');
  });

  it('non-EN recency labels are translated (differ from EN)', () => {
    for (const lang of ALL_LANGUAGES.filter((l) => l !== 'en')) {
      const labels = RECENCY_LABELS[lang]!;
      const enLabels = RECENCY_LABELS.en!;
      // At least one of the three must differ from English
      const differs = labels['today'] !== enLabels['today'] ||
        labels['this-week'] !== enLabels['this-week'] ||
        labels['this-month'] !== enLabels['this-month'];
      expect(differs, `${lang} recency labels are same as EN — not translated`).toBe(true);
    }
  });

  it('non-EN hero metric labels are translated (differ from EN)', () => {
    for (const lang of ALL_LANGUAGES.filter((l) => l !== 'en')) {
      const labels = HERO_METRIC_LABELS[lang]!;
      const enLabels = HERO_METRIC_LABELS.en!;
      expect(labels.articles, `${lang}.articles same as EN`).not.toBe(enLabels.articles);
    }
  });
});

// ─── 9. BCP-47 normalization ────────────────────────────────────────────────

describe('toBcp47 — Norwegian normalization', () => {
  it('maps "no" to "nb"', () => {
    expect(toBcp47('no', 'en')).toBe('nb');
  });

  it('passes through other codes unchanged', () => {
    expect(toBcp47('sv', 'en')).toBe('sv');
    expect(toBcp47('ar', 'en')).toBe('ar');
    expect(toBcp47('zh', 'en')).toBe('zh');
  });

  it('uses fallback for undefined/empty input', () => {
    expect(toBcp47(undefined, 'en')).toBe('en');
    expect(toBcp47('', 'en')).toBe('en');
  });
});

// ─── 10. End-to-end SEO for a sample with and without translations ──────────

describe('end-to-end SEO — with translations vs. without (EN fallback)', () => {
  it('produces distinct translated keywords for DE vs. EN on same article', () => {
    const enKw = buildArticleKeywords({
      title: SAMPLE_TITLES.en,
      description: SAMPLE_DESCRIPTIONS.en,
      lang: 'en',
      date: '2026-05-25',
      articleTypeLabel: 'Propositions',
      articleTypeId: 'propositions',
    });
    const deKw = buildArticleKeywords({
      title: SAMPLE_TITLES.de,
      description: SAMPLE_DESCRIPTIONS.de,
      lang: 'de',
      date: '2026-05-25',
      articleTypeLabel: 'Regierungsvorlagen',
      articleTypeId: 'propositions',
    });
    // Both contain brand/OSINT
    expect(enKw).toContain('Riksdagsmonitor');
    expect(deKw).toContain('Riksdagsmonitor');
    // DE uses German institutional keywords
    expect(deKw).toContain('Schwedisches Parlament');
    expect(deKw).not.toContain('Swedish Parliament');
    // EN uses English institutional keywords
    expect(enKw).toContain('Swedish Parliament');
  });

  it('produces distinct translated keywords for JA vs. EN on same article', () => {
    const jaKw = buildArticleKeywords({
      title: SAMPLE_TITLES.ja,
      description: SAMPLE_DESCRIPTIONS.ja,
      lang: 'ja',
      date: '2026-05-25',
      articleTypeLabel: '政府法案',
      articleTypeId: 'propositions',
    });
    expect(jaKw).toContain('スウェーデン議会');
    expect(jaKw).toContain('政治インテリジェンス');
    expect(jaKw).not.toContain('Swedish Parliament');
    expect(jaKw).not.toContain('political intelligence');
  });

  it('produces distinct translated keywords for AR vs. EN on same article', () => {
    const arKw = buildArticleKeywords({
      title: SAMPLE_TITLES.ar,
      description: SAMPLE_DESCRIPTIONS.ar,
      lang: 'ar',
      date: '2026-05-25',
      articleTypeLabel: 'مشاريع القوانين',
      articleTypeId: 'propositions',
    });
    expect(arKw).toContain('الريكسداغ');
    expect(arKw).toContain('استخبارات سياسية');
    expect(arKw).not.toContain('Swedish Parliament');
    expect(arKw).not.toContain('political intelligence');
  });

  it('articleTypeIcon returns an icon for every known type (language-neutral)', () => {
    const knownTypes = Object.keys(ARTICLE_TYPE_LABEL_I18N);
    for (const typeId of knownTypes) {
      const icon = articleTypeIcon(typeId);
      expect(icon.length, `icon for ${typeId} is empty`).toBeGreaterThan(0);
      expect(icon).not.toBe('🔍'); // should have a specific icon, not the fallback
    }
  });
});
