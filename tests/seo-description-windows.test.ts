/**
 * @module Tests/SeoDescriptionWindows
 * @category Intelligence Operations / Tests
 * @name Per-language `<meta description>` SERP window regression
 *
 * @description
 * Unit tests for `descriptionWindowForLanguage` +
 * `truncateToSentenceBoundary` per-language windows + the localized-brief
 * SEO cascade. Pre-2026-05 every locale hard-coded the EN 140-200
 * window, which forced Japanese / Korean / Chinese descriptions to
 * overshoot their visual SERP budget (Google routinely truncated CJK
 * descriptions mid-glyph) and let RTL descriptions ship 10-20 chars
 * below their floor. After the W2 fix every language uses its own
 * window per `.github/prompts/seo-metadata-contract.md` §4.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  LANG_DESCRIPTION_WINDOWS,
  descriptionWindowForLanguage,
  truncateToSentenceBoundary,
  isEntityRosterParagraph,
  readFirstParagraph,
} from '../scripts/render-lib/aggregator/seo/description.js';
import { extractLocalizedBriefSeo } from '../scripts/render-lib/aggregator/seo/localized-brief.js';

describe('LANG_DESCRIPTION_WINDOWS — contract parity (seo-metadata-contract.md §4)', () => {
  it('declares the 9 Latin LTR languages with 140-200 windows', () => {
    for (const code of ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl']) {
      expect(LANG_DESCRIPTION_WINDOWS[code]).toEqual({ softMin: 140, hardMax: 200 });
    }
  });

  it('declares the 2 RTL languages (ar, he) with 120-170 windows', () => {
    expect(LANG_DESCRIPTION_WINDOWS.ar).toEqual({ softMin: 120, hardMax: 170 });
    expect(LANG_DESCRIPTION_WINDOWS.he).toEqual({ softMin: 120, hardMax: 170 });
  });

  it('declares the 3 CJK languages (ja, ko, zh) with 70-120 windows', () => {
    expect(LANG_DESCRIPTION_WINDOWS.ja).toEqual({ softMin: 70, hardMax: 120 });
    expect(LANG_DESCRIPTION_WINDOWS.ko).toEqual({ softMin: 70, hardMax: 120 });
    expect(LANG_DESCRIPTION_WINDOWS.zh).toEqual({ softMin: 70, hardMax: 120 });
  });

  it('declares exactly 14 languages (the supported set)', () => {
    expect(Object.keys(LANG_DESCRIPTION_WINDOWS).length).toBe(14);
  });
});

describe('descriptionWindowForLanguage', () => {
  it('returns the canonical window for known languages', () => {
    expect(descriptionWindowForLanguage('de')).toEqual({ softMin: 140, hardMax: 200 });
    expect(descriptionWindowForLanguage('ar')).toEqual({ softMin: 120, hardMax: 170 });
    expect(descriptionWindowForLanguage('ja')).toEqual({ softMin: 70, hardMax: 120 });
  });

  it('falls back to the EN window for unknown languages', () => {
    expect(descriptionWindowForLanguage('xx')).toEqual({ softMin: 140, hardMax: 200 });
    expect(descriptionWindowForLanguage(null)).toEqual({ softMin: 140, hardMax: 200 });
    expect(descriptionWindowForLanguage(undefined)).toEqual({ softMin: 140, hardMax: 200 });
    expect(descriptionWindowForLanguage('')).toEqual({ softMin: 140, hardMax: 200 });
  });

  it('is case-insensitive — upper / mixed-case BCP-47 codes resolve to the canonical window', () => {
    // Browsers, RSS feeds and CMSes routinely emit `JA`, `ZH-CN`, `Ar`,
    // etc. Verify the lookup is robust to common casing variants and to
    // stray whitespace (the function trims/lowercases its input).
    expect(descriptionWindowForLanguage('JA')).toEqual({ softMin: 70, hardMax: 120 });
    expect(descriptionWindowForLanguage('Ar')).toEqual({ softMin: 120, hardMax: 170 });
    expect(descriptionWindowForLanguage('  de  ')).toEqual({ softMin: 140, hardMax: 200 });
    expect(descriptionWindowForLanguage('ZH')).toEqual({ softMin: 70, hardMax: 120 });
  });

  it('handles BCP-47 region subtags (zh-CN, zh-TW, nb-NO, …) by collapsing to the primary subtag', () => {
    // Static-pages and PI hub may pass full BCP-47 locale strings; the
    // description-window lookup should accept them by extracting the
    // primary language subtag.
    expect(descriptionWindowForLanguage('zh-CN')).toEqual({ softMin: 70, hardMax: 120 });
    expect(descriptionWindowForLanguage('zh-TW')).toEqual({ softMin: 70, hardMax: 120 });
    expect(descriptionWindowForLanguage('nb-NO')).toEqual({ softMin: 140, hardMax: 200 });
    expect(descriptionWindowForLanguage('ar-SA')).toEqual({ softMin: 120, hardMax: 170 });
  });
});

describe('Aggregator barrel — W2 description-window API is re-exported', () => {
  it('exposes LANG_DESCRIPTION_WINDOWS and descriptionWindowForLanguage from the aggregator barrel', async () => {
    // Architecture/bounded-context test: future consumers (static pages,
    // PI hub, dashboards) MUST be able to reach the W2 description
    // window helpers via the aggregator barrel without depending on the
    // deep `seo/description.js` path. This guards against an
    // accidental barrel deletion regressing the public API.
    const barrel = await import('../scripts/render-lib/aggregator/index.js');
    expect(typeof barrel.descriptionWindowForLanguage).toBe('function');
    expect(barrel.LANG_DESCRIPTION_WINDOWS).toBeDefined();
    expect(barrel.descriptionWindowForLanguage('ja')).toEqual({ softMin: 70, hardMax: 120 });
    expect(barrel.descriptionWindowForLanguage('ar')).toEqual({ softMin: 120, hardMax: 170 });
    expect(barrel.descriptionWindowForLanguage('en')).toEqual({ softMin: 140, hardMax: 200 });
    // Reference equality: the barrel re-export shares the same object
    // identity as the leaf module — no accidental copy-then-export.
    expect(barrel.LANG_DESCRIPTION_WINDOWS).toBe(LANG_DESCRIPTION_WINDOWS);
  });
});

describe('truncateToSentenceBoundary — per-language window propagation', () => {
  // ~200-char CJK string composed of two sentences. The Japanese full
  // stop `。` is the sentence terminator and the function should respect
  // it within the CJK 70-120 window.
  const JA_LONG = '日本のスウェーデン議会監視は政治情報の透明性を高める重要なプラットフォームです。'
    + '14言語で議会データを公開し、市民が国会議員の活動を追跡できるようにしています。'
    + '選挙予測も含まれます。';

  it('truncates a CJK description within the 70-120 char window', () => {
    const { softMin, hardMax } = descriptionWindowForLanguage('ja');
    const out = truncateToSentenceBoundary(JA_LONG, softMin, hardMax);
    expect(out.length).toBeLessThanOrEqual(120);
    // Must end on a `。` (no mid-glyph cut, no trailing ellipsis on a
    // clean sentence boundary).
    expect(out.endsWith('。')).toBe(true);
    expect(out).not.toMatch(/…$/);
  });

  it('truncates an RTL (Arabic) description within the 120-170 char window', () => {
    const ARABIC = 'مراقبة البرلمان السويدي هي منصة استخبارات سياسية مفتوحة. '
      + 'تنشر بيانات البرلمان بأربعة عشر لغة لتمكين المواطنين من تتبع نشاط النواب. '
      + 'وتشمل أيضًا توقعات الانتخابات والتحليل العميق.';
    const { softMin, hardMax } = descriptionWindowForLanguage('ar');
    const out = truncateToSentenceBoundary(ARABIC, softMin, hardMax);
    expect(out.length).toBeLessThanOrEqual(170);
  });

  it('truncates a Latin LTR description within the 140-200 char window (unchanged)', () => {
    // First sentence ~165 chars, second sentence pushes past 200 — the
    // truncator should snap to the first sentence boundary.
    const EN = 'Sweden\'s government tables 8 propositions covering electricity '
      + 'system overhaul, wind power, paid police education, and a new permitting authority. '
      + 'Coalition tensions and policy detail follow in the briefing.';
    const { softMin, hardMax } = descriptionWindowForLanguage('en');
    const out = truncateToSentenceBoundary(EN, softMin, hardMax);
    expect(out.length).toBeLessThanOrEqual(200);
    expect(out.endsWith('.')).toBe(true);
    // Must include the first sentence's terminal word.
    expect(out).toContain('permitting authority.');
  });
});

describe('extractLocalizedBriefSeo — per-language description window', () => {
  // Same long Japanese brief but threaded through the full SEO cascade.
  const JA_BRIEF = `---
title: テスト
---
# スウェーデン議会監視プラットフォーム

## 🎯 BLUF

日本のスウェーデン議会監視は政治情報の透明性を高める重要なプラットフォームです。14言語で議会データを公開し、市民が国会議員の活動を追跡できるようにしています。選挙予測も含まれます。

## 決定事項

詳細は省略。
`;

  it('honors the CJK 70-120 window when lang="ja"', () => {
    const seo = extractLocalizedBriefSeo({
      briefMarkdown: JA_BRIEF,
      subfolder: 'weekly-review',
      lang: 'ja',
    });
    expect(seo.description).not.toBeNull();
    expect(seo.description!.length).toBeLessThanOrEqual(120);
    // First Japanese sentence ends on `。` — should be preserved.
    expect(seo.description!.endsWith('。')).toBe(true);
  });

  it('falls back to the EN 140-200 window when lang is omitted (back-compat)', () => {
    const seo = extractLocalizedBriefSeo({
      briefMarkdown: JA_BRIEF,
      subfolder: 'weekly-review',
    });
    // Pre-fix path: with the wider 140-200 window the JA brief either
    // returns the whole BLUF (well below 200 chars) or sentence-truncates
    // to a longer prefix than the CJK-aware version. Either way the
    // length must remain ≤ 200.
    expect(seo.description).not.toBeNull();
    expect(seo.description!.length).toBeLessThanOrEqual(200);
  });

  it('honors the RTL 120-170 window when lang="ar"', () => {
    const AR_BRIEF = `# عنوان

## 🎯 BLUF

مراقبة البرلمان السويدي هي منصة استخبارات سياسية مفتوحة. تنشر بيانات البرلمان بأربعة عشر لغة لتمكين المواطنين من تتبع نشاط النواب. وتشمل أيضًا توقعات الانتخابات والتحليل العميق للأحزاب الثمانية.
`;
    const seo = extractLocalizedBriefSeo({
      briefMarkdown: AR_BRIEF,
      subfolder: 'weekly-review',
      lang: 'ar',
    });
    expect(seo.description).not.toBeNull();
    expect(seo.description!.length).toBeLessThanOrEqual(170);
  });

  it('honors the Latin LTR 140-200 window when lang="de" (unchanged behaviour)', () => {
    const DE_BRIEF = `# Titel

## 🎯 BLUF

Die schwedische Regierung legt acht Vorschläge vor, die das Stromsystem reformieren, Windkraft-Einnahmen aufteilen, bezahlte Polizeiausbildung einführen, digitalen Betrugsschutz stärken und eine neue Umweltgenehmigungsbehörde schaffen. Koalitionsspannungen folgen.
`;
    const seo = extractLocalizedBriefSeo({
      briefMarkdown: DE_BRIEF,
      subfolder: 'propositions',
      lang: 'de',
    });
    expect(seo.description).not.toBeNull();
    expect(seo.description!.length).toBeLessThanOrEqual(200);
  });
});

// ──────────────────────────────────────────────────────────────────
// Round 9 (2026-05-25) — entity-roster paragraph skip in
// readFirstParagraph. Live audit of news/index.html cards showed
// descriptions starting with bare MP-name comma-lists (e.g.
// 'Sigge Sigfridsson, Anna Andersson, Eva Pettersson, …'), which
// read as roster dumps in the SERP. The new isEntityRosterParagraph
// heuristic skips such paragraphs so the description falls through
// to a real prose paragraph.
// ──────────────────────────────────────────────────────────────────

describe('isEntityRosterParagraph — bare name-list detection', () => {
  it('flags a 5-name comma-separated MP roster', () => {
    expect(
      isEntityRosterParagraph(
        'Anna Andersson, Lars Larsson, Eva Pettersson, Karin Karlsson, Per Persson',
      ),
    ).toBe(true);
  });

  it('flags a roster with parenthetical party suffixes', () => {
    expect(
      isEntityRosterParagraph(
        'Anna Andersson (S), Lars Larsson (M), Eva Pettersson (KD), Karin Karlsson (V)',
      ),
    ).toBe(true);
  });

  it('does NOT flag a prose paragraph with a single comma', () => {
    expect(
      isEntityRosterParagraph(
        "Sweden's Riksdag approved three reforms on Thursday, marking the largest single-day output of the session.",
      ),
    ).toBe(false);
  });

  it('does NOT flag a list of 2 names (below threshold)', () => {
    expect(
      isEntityRosterParagraph('Anna Andersson and Lars Larsson'),
    ).toBe(false);
  });

  it('does NOT flag a list that contains a sentence terminator early', () => {
    expect(
      isEntityRosterParagraph(
        'Anna Andersson. Lars Larsson and Eva Pettersson formed a committee, Karin Karlsson chaired.',
      ),
    ).toBe(false);
  });

  it('readFirstParagraph skips an entity-roster lead in favour of the next prose paragraph', () => {
    const brief = [
      '# Some Heading',
      '',
      'Anna Andersson, Lars Larsson, Eva Pettersson, Karin Karlsson, Per Persson',
      '',
      "Sweden's Riksdag approved three reforms on Thursday, marking a substantial output.",
    ].join('\n');
    const out = readFirstParagraph(brief);
    expect(out).toContain('Sweden');
    expect(out).not.toMatch(/^Anna Andersson/);
  });
});

