/**
 * @module Tests/RenderLib/Aggregator/Seo/BriefExtractor
 * @category Intelligence Operations / Tests
 * @name Pure brief entity + headline-section extractor regression
 *
 * @description
 * Pin-the-contract tests for
 * `scripts/render-lib/aggregator/seo/brief-extractor.ts`.
 *
 * The extractor mines Riksdag-specific identifiers (bill IDs, committee
 * codes, party codes) and Latin-script named entities from an executive
 * brief markdown blob. These tokens become the *highest-priority*
 * keywords on every SERP-shipped page, so a regression here ships
 * the wrong keywords for hundreds of articles at once.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import {
  extractBriefEntities,
  extractHeadlineSection,
  flattenBriefEntities,
} from '../scripts/render-lib/aggregator/seo/brief-extractor.js';

// ---------------------------------------------------------------------------
// Fixtures — derived from the 2026-05-22 propositions executive brief,
// which the user cited as the canonical reference shape for the rewrite.
// ---------------------------------------------------------------------------

const propositionsBrief = [
  '# Sweden Abolishes Permanent Residence and Expands Security Deportation: A Pre-Election Legislative Reckoning',
  '',
  '## 🎯 Sharpened BLUF',
  '',
  'The Busch government has submitted ten propositions constituting Sweden\'s most far-reaching migration enforcement overhaul since 1989.',
  '',
  '## ⚡ 60-Second Read',
  '',
  '- 🔴 **HD03267 (JuU)**: SÄPO-triggered fast-track deportation — 136.5 DIW',
  '- 🔴 **HD03262 (SfU)**: Permanent residence permits abolished for non-EU nationals — 132 DIW',
  '- 🔴 **HD03265 (SfU)**: Electronic tagging and expanded pre-deportation detention — 124.5 DIW',
  '- 🔵 **HD03254 (FöU)**: Nordic-NATO joint operations pre-authorised on Swedish soil — 117 DIW',
  '- 🟠 **HD03261 (SkU)**: Skatteverket gains database cross-referencing powers — 118.5 DIW',
  '- 🟠 **HD03250 (TU)**: State e-identity alternative to BankID — 84 DIW',
  '- 🟡 **HD03258 (KU)**: Political party financing disclosure — 74 DIW',
  '- 🔴 **HD03263 (SfU)**: Dedicated deportation enforcement units — 108 DIW',
  '- 🔴 **HD03264 (SfU)**: Criminal history and conduct standards — 102 DIW',
  '- 🟢 **HD03251 (SoU)**: Integrated care for substance abuse and psychiatric disorders — 58 DIW',
  '',
  '## Decisions This Brief Supports',
  '',
  'See the migration-policy briefing for downstream voting predictions involving (M, KD, L, SD).',
].join('\n');

describe('extractBriefEntities — propositions fixture (English)', () => {
  const ent = extractBriefEntities(propositionsBrief, 'en');

  it('mines all ten HD-prefixed bill IDs from the brief', () => {
    expect(ent.billIds).toEqual(
      expect.arrayContaining([
        'HD03267', 'HD03262', 'HD03265', 'HD03254', 'HD03261',
        'HD03250', 'HD03258', 'HD03263', 'HD03264', 'HD03251',
      ]),
    );
  });

  it('mines committee codes only when they appear in parens or with report digits', () => {
    expect(ent.committeeCodes).toEqual(
      expect.arrayContaining(['JuU', 'SfU', 'FöU', 'SkU', 'TU', 'KU', 'SoU']),
    );
  });

  it('mines party codes only from parenthetical lists (gating against bare-word noise)', () => {
    expect(ent.partyCodes).toEqual(
      expect.arrayContaining(['M', 'KD', 'L', 'SD']),
    );
  });

  it('does NOT include section-header prose words as named entities', () => {
    // Pre-fix these leaked: 'Second Read', 'BLUF', 'Sharpened BLUF',
    // 'Decisions This Brief Supports' — all are section-heading text.
    expect(ent.namedEntities).not.toContain('Sharpened BLUF');
    expect(ent.namedEntities).not.toContain('Second Read');
    expect(ent.namedEntities).not.toContain('BLUF');
    expect(ent.namedEntities).not.toContain('Decisions This Brief Supports');
  });

  it('does NOT produce multiline-spanning named entities', () => {
    // Pre-fix the `\s+` separator allowed `BLUF\n\nThe Busch` matches.
    for (const e of ent.namedEntities) {
      expect(e).not.toMatch(/\n/);
    }
  });
});

describe('extractHeadlineSection — 60-Second Read', () => {
  it('finds the 60-Second Read section and returns its bullet lines', () => {
    const sec = extractHeadlineSection(propositionsBrief, 'en');
    expect(sec.heading).toContain('60-Second Read');
    expect(sec.bullets).toHaveLength(10);
    expect(sec.bullets[0]).toContain('HD03267');
    expect(sec.bullets[0]).toContain('JuU');
  });

  it('returns heading=null and empty bullets when no headline section is present', () => {
    const noSection = '# A Title\n\n## BLUF\n\nJust a BLUF.\n';
    const sec = extractHeadlineSection(noSection, 'en');
    expect(sec.heading).toBeNull();
    expect(sec.bullets).toEqual([]);
  });
});

describe('flattenBriefEntities — editorial priority ordering', () => {
  it('puts bill IDs ahead of committee codes ahead of party codes', () => {
    const flat = flattenBriefEntities(extractBriefEntities(propositionsBrief, 'en'));
    const billIdx = flat.indexOf('HD03267');
    const cmtIdx = flat.indexOf('JuU');
    const partyIdx = flat.indexOf('M');
    expect(billIdx).toBeGreaterThanOrEqual(0);
    expect(cmtIdx).toBeGreaterThan(billIdx);
    expect(partyIdx).toBeGreaterThan(cmtIdx);
  });
});

describe('extractBriefEntities — empty / null safety', () => {
  it('returns empty arrays for empty input', () => {
    const ent = extractBriefEntities('', 'en');
    expect(ent.billIds).toEqual([]);
    expect(ent.committeeCodes).toEqual([]);
    expect(ent.partyCodes).toEqual([]);
    expect(ent.namedEntities).toEqual([]);
  });

  it('CJK locales (no Latin capitals) mine universal IDs only, no named entities', () => {
    const ja = '# 日本語タイトル\n\n- **HD03267 (JuU)**: 説明 — 136.5 DIW';
    const ent = extractBriefEntities(ja, 'ja');
    expect(ent.billIds).toContain('HD03267');
    expect(ent.committeeCodes).toContain('JuU');
    expect(ent.namedEntities).toEqual([]); // Latin-script gated off for ja
  });
});

// ---------------------------------------------------------------------------
// 14-language headline-section dictionary coverage
//
// Each translated executive brief in production uses native-language H2
// heading text for both the BLUF section (`## 🎯 ملخص`, `## 🎯 Sammanfattning`,
// `## 🎯 核心摘要`, …) and the 60-second / key-findings section
// (`## ⚡ قراءة 60 ثانية`, `## ⚡ Lecture en 60 secondes`, `## ⚡ 60秒速读`, …).
//
// Without per-language matchers, the SEO cascade silently falls back to
// `readFirstParagraph` — which leaks the admin byline (`Author: …
// Classification: PUBLIC — GDPR Art.`) into the meta description.
//
// These tests pin the per-language dictionary entries that `extractHeadlineSection`
// must recognise. They were calibrated against the live corpus of 14×178
// translated briefs (see `/tmp/check-headline-coverage.mjs`); regressions
// here mean SEO descriptions across an entire language degrade silently.
// ---------------------------------------------------------------------------

const HEADLINE_FIXTURES: ReadonlyArray<{
  readonly lang: 'sv' | 'da' | 'no' | 'fi' | 'de' | 'fr' | 'es' | 'nl' | 'ar' | 'he' | 'ja' | 'ko' | 'zh';
  readonly headings: readonly string[];
}> = [
  { lang: 'sv', headings: ['## ⚡ 60 sekunders läsning', '## ⚡ 60-sekunders underrättelsepunkter'] },
  { lang: 'da', headings: ['## ⚡ 60 sekunders læsning', '## ⚡ 60 sekunders efterretningspunkter'] },
  { lang: 'no', headings: ['## ⚡ 60 sekunders lesning', '## ⚡ 60 sekunders etterretningspunkter'] },
  { lang: 'fi', headings: ['## ⚡ 60 sekunnin lukeminen', '## ⚡ 60 sekunnin tiedustelutiivistelmä'] },
  { lang: 'de', headings: ['## ⚡ 60 Sekunden-Lektüre', '## ⚡ 60-Sekunden nachrichtendienstliche Punkte'] },
  { lang: 'fr', headings: ['## ⚡ Lecture en 60 secondes', '## ⚡ Points de renseignement en 60 secondes'] },
  { lang: 'es', headings: ['## ⚡ Lectura de 60 segundos', '## ⚡ Puntos de inteligencia en 60 segundos'] },
  { lang: 'nl', headings: ['## ⚡ 60 seconden lezing', '## ⚡ 60 seconden inlichtingenpunten'] },
  { lang: 'ar', headings: ['## ⚡ قراءة 60 ثانية', '## ⚡ نقاط الاستخبارات في 60 ثانية'] },
  { lang: 'he', headings: ['## ⚡ קריאה של 60 שניות', '## ⚡ נקודות מודיעין ב-60 שניות'] },
  { lang: 'ja', headings: ['## ⚡ 60秒で読む', '## ⚡ 60秒インテリジェンスポイント'] },
  { lang: 'ko', headings: ['## ⚡ 60초 읽기', '## ⚡ 60초 인텔리전스 포인트'] },
  { lang: 'zh', headings: ['## ⚡ 60秒速读', '## ⚡ 60秒情报要点'] },
];

describe('extractHeadlineSection — 14-language headline dictionary (live corpus)', () => {
  for (const { lang, headings } of HEADLINE_FIXTURES) {
    for (const heading of headings) {
      it(`[${lang}] matches "${heading}"`, () => {
        const brief = [
          '# Test title',
          '',
          '**Author**: Tester',
          '',
          heading,
          '',
          '- **HD03267 (JuU)**: Topic clause — 136.5 DIW',
          '- **HD03262 (SfU)**: Other topic — 120.0 DIW',
          '',
          '## 🔮 Next section',
          '',
          'Prose continues.',
          '',
        ].join('\n');
        const result = extractHeadlineSection(brief, lang);
        expect(result.heading).not.toBeNull();
        expect(result.bullets.length).toBe(2);
        expect(result.bullets[0]).toContain('HD03267');
      });
    }
  }

  it('[en] EN dictionary still matches `60-Second Read` (regression guard)', () => {
    const brief = [
      '# Test',
      '',
      '## ⚡ 60-Second Read',
      '',
      '- **HD03267 (JuU)**: Topic — 136.5 DIW',
      '',
    ].join('\n');
    const result = extractHeadlineSection(brief, 'en');
    expect(result.heading).not.toBeNull();
    expect(result.bullets.length).toBe(1);
  });

  it('[es] numbered list bullets (1. 2. …) are collected from Lectura en 60 segundos', () => {
    const brief = [
      '# Spain test',
      '',
      '## 🎯 Síntesis de situación',
      '',
      'The BLUF paragraph.',
      '',
      '## ⚡ Lectura en 60 segundos (8 puntos)',
      '',
      '1. **HD03267 (JuU)**: SÄPO-triggered deportation — 136.5 DIW',
      '2. **HD03262 (SfU)**: Permanent residence abolished — 132 DIW',
      '3. **HD03258 (KU)**: Party financing disclosure — 74 DIW',
      '',
      '## 🔮 Next section',
      '',
    ].join('\n');
    const result = extractHeadlineSection(brief, 'es');
    expect(result.heading).not.toBeNull();
    expect(result.bullets.length).toBe(3);
    expect(result.bullets[0]).toContain('HD03267');
    expect(result.bullets[1]).toContain('HD03262');
  });

  it('[zh] numbered list bullets (1. 2. …) are collected from 60秒速读', () => {
    const brief = [
      '# ZH test',
      '',
      '## 🎯 态势简要评估',
      '',
      'The ZH BLUF paragraph.',
      '',
      '## ⚡ 60秒速读',
      '',
      '1. **最重要**：HD03262——废除永久居留许可标准路径',
      '2. **HD03267**：安全威胁驱逐程序',
      '',
      '## 下一节',
      '',
    ].join('\n');
    const result = extractHeadlineSection(brief, 'zh');
    expect(result.heading).not.toBeNull();
    expect(result.bullets.length).toBe(2);
    expect(result.bullets[0]).toContain('HD03262');
  });
});
