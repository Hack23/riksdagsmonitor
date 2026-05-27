/**
 * @module Tests/RenderLib/LocalizedBriefSeo
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Tests for `extractLocalizedBriefSeo` + `isBannedLocalizedBriefH1`
 *
 * @description
 * Pure-function tests for cascade chain step #2 of the per-language SEO
 * cascade documented in `Article-Generation.md`. These tests are
 * filesystem-free — they exercise the bounded context against in-memory
 * markdown strings — and serve as the executable contract for
 * `scripts/render-lib/aggregator/seo/localized-brief.ts`.
 *
 * The behaviour matrix (matches `analysis-gate.ts § checkExecutiveBrief`):
 *
 *  - Publishable H1 + BLUF → both fields resolved.
 *  - Banned H1 (`REPLACE THIS H1`, `Executive Brief Template`,
 *    `AI_MUST_REPLACE`, `AI-generated political intelligence`) → title
 *    `null`, description still resolves from BLUF.
 *  - Bare boilerplate H1 (`Executive Brief`, possibly with leading
 *    emoji) → title `null`, description still resolves.
 *  - Missing BLUF → description falls back to first prose paragraph.
 *  - Missing brief markdown / empty string → both fields `null`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { describe, expect, it } from 'vitest';

import {
  extractLocalizedBriefSeo,
  isBannedLocalizedBriefH1,
  LOCALIZED_BRIEF_H1_BANNED_PATTERNS,
} from '../scripts/render-lib/aggregator/seo/localized-brief.js';
import type { Language } from '../scripts/types/language.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const publishableBrief = [
  '# Tidö-regeringen lägger tre propositioner som omfördelar 12,4 mdr',
  '',
  '## 🎯 BLUF',
  '',
  'Den 7 maj 2026 lämnade Tidö-regeringen tre propositioner till riksdagen som tillsammans omfördelar 12,4 miljarder kronor från skogsbruksstöd till försvarsindustri inför 2026 års budget.',
  '',
  '## Decisions',
  '',
  '- Antagande av prop. 2025/26:101 (Försvarsutskottet 4–3).',
].join('\n');

const placeholderBrief = [
  '# 📰 Executive Brief Template — REPLACE THIS H1 (date)',
  '',
  '## 🎯 BLUF',
  '',
  'En kort sammanfattning som beskriver vad som hänt och varför det spelar roll.',
].join('\n');

const aiMustReplaceBrief = [
  '# AI_MUST_REPLACE: real story-oriented title',
  '',
  '## 🎯 BLUF',
  '',
  'Faktisk BLUF-mening med aktör, verb, instrument och tidpunkt på över åttio tecken.',
].join('\n');

const aiGeneratedPhraseBrief = [
  '# AI-generated political intelligence on motions',
  '',
  '## BLUF',
  '',
  'Riksdagen behandlade fyra motioner från Sverigedemokraterna om migrationsstopp 8 maj 2026.',
].join('\n');

const bareBoilerplateBrief = [
  '# 📰 Executive Brief',
  '',
  '## 🎯 BLUF',
  '',
  'Justitieutskottet röstade 11–6 mot regeringens förslag om utökade förvarstidpunkter måndag 5 maj 2026.',
].join('\n');

const noBlufBrief = [
  '# Statskontoret levererar fyra rapporter om myndighetsstyrning 2026-05-09',
  '',
  'Den första prosaparagrafen beskriver kontextuellt vad rapporterna gemensamt undersöker och varför det är politiskt relevant just nu — väl över åttio tecken så att den passerar truncate-gate.',
].join('\n');

const emptyBlufBrief = [
  '# Story-oriented title that is long enough to be publishable in SERP',
  '',
  '## BLUF',
  '',
].join('\n');

// ---------------------------------------------------------------------------
// isBannedLocalizedBriefH1
// ---------------------------------------------------------------------------

describe('isBannedLocalizedBriefH1', () => {
  it('rejects literal REPLACE THIS H1 placeholder', () => {
    expect(isBannedLocalizedBriefH1('Executive Brief Template — REPLACE THIS H1')).toBe(true);
  });

  it('rejects Executive Brief Template heading', () => {
    expect(isBannedLocalizedBriefH1('📰 Executive Brief Template — Government Propositions')).toBe(true);
  });

  it('rejects AI_MUST_REPLACE marker', () => {
    expect(isBannedLocalizedBriefH1('AI_MUST_REPLACE: real title')).toBe(true);
    expect(isBannedLocalizedBriefH1('AI MUST REPLACE — title')).toBe(true);
    expect(isBannedLocalizedBriefH1('ai-must-replace title')).toBe(true);
  });

  it('rejects the banned phrase "AI-generated political intelligence"', () => {
    expect(isBannedLocalizedBriefH1('AI-generated political intelligence on motions')).toBe(true);
  });

  it('rejects bare boilerplate "Executive Brief" (case- and emoji-tolerant)', () => {
    expect(isBannedLocalizedBriefH1('Executive Brief')).toBe(true);
    expect(isBannedLocalizedBriefH1('📰 Executive Brief')).toBe(true);
    expect(isBannedLocalizedBriefH1('EXECUTIVE BRIEF —')).toBe(true);
  });

  it('rejects empty / emoji-only headings', () => {
    expect(isBannedLocalizedBriefH1('')).toBe(true);
    expect(isBannedLocalizedBriefH1('📰')).toBe(true);
    expect(isBannedLocalizedBriefH1('— — —')).toBe(true);
  });

  it('accepts publishable story-oriented titles', () => {
    expect(isBannedLocalizedBriefH1('Tidö-regeringen lägger tre propositioner som omfördelar 12,4 mdr')).toBe(false);
    expect(isBannedLocalizedBriefH1('Riksdagen avslår förvarstidsförslag 11–6 efter koalitionssprick')).toBe(false);
  });

  it('exposes the banned-pattern list as a frozen contract', () => {
    expect(LOCALIZED_BRIEF_H1_BANNED_PATTERNS.length).toBeGreaterThanOrEqual(4);
    for (const re of LOCALIZED_BRIEF_H1_BANNED_PATTERNS) {
      expect(re).toBeInstanceOf(RegExp);
    }
  });
});

// ---------------------------------------------------------------------------
// extractLocalizedBriefSeo
// ---------------------------------------------------------------------------

describe('extractLocalizedBriefSeo', () => {
  it('returns both fields when the brief has publishable H1 + BLUF', () => {
    const out = extractLocalizedBriefSeo({
      briefMarkdown: publishableBrief,
      subfolder: 'propositions',
    });
    expect(out.title).toContain('Tidö-regeringen');
    expect(out.title).toContain('12,4 mdr');
    expect(out.description).toBeTruthy();
    expect(out.description!).toContain('Tidö-regeringen');
    expect(out.description!).toContain('12,4 miljarder');
  });

  it('falls back to BLUF-derived title when H1 is the REPLACE-THIS-H1 placeholder', () => {
    const out = extractLocalizedBriefSeo({
      briefMarkdown: placeholderBrief,
      subfolder: 'propositions',
    });
    // BLUF fallback synthesizes title from BLUF text
    expect(out.title).toBeTruthy();
    expect(out.title!.length).toBeLessThanOrEqual(70);
    expect(out.description).toBeTruthy();
    expect(out.description!).toContain('kort sammanfattning');
  });

  it('falls back to BLUF-derived title when H1 carries the AI_MUST_REPLACE marker', () => {
    const out = extractLocalizedBriefSeo({
      briefMarkdown: aiMustReplaceBrief,
      subfolder: 'motions',
    });
    // BLUF fallback synthesizes title from BLUF text
    expect(out.title).toBeTruthy();
    expect(out.title!.length).toBeLessThanOrEqual(70);
    expect(out.description).toBeTruthy();
    expect(out.description!).toContain('Faktisk BLUF-mening');
  });

  it('falls back to BLUF-derived title when H1 carries the banned phrase "AI-generated political intelligence"', () => {
    const out = extractLocalizedBriefSeo({
      briefMarkdown: aiGeneratedPhraseBrief,
      subfolder: 'motions',
    });
    // BLUF fallback synthesizes title from BLUF text
    expect(out.title).toBeTruthy();
    expect(out.title!.length).toBeLessThanOrEqual(70);
    expect(out.description).toBeTruthy();
    expect(out.description!).toContain('Sverigedemokraterna');
  });

  it('returns null title when H1 is bare boilerplate "Executive Brief"', () => {
    const out = extractLocalizedBriefSeo({
      briefMarkdown: bareBoilerplateBrief,
      subfolder: 'votes',
    });
    expect(out.title).toBe('Justitieutskottet röstade 11–6 mot regeringens förslag om utökade');
    expect(out.description).toBeTruthy();
    expect(out.description!).toContain('Justitieutskottet');
  });

  it('falls back to a localized BLUF-derived title when the translated H1 is boilerplate', () => {
    const out = extractLocalizedBriefSeo({
      briefMarkdown: [
        '# Executive Brief — Monthly Review 2026-04-26',
        '',
        '## 🎯 BLUF',
        '',
        'Das 30-Tages-Fenster 2026-03-27 → 2026-04-26 markiert die gesetzgeberische Abschlussphase des 2025/26-Portfolios der Tidö-Koalition.',
      ].join('\n'),
      subfolder: 'monthly-review',
      lang: 'de',
    });
    expect(out.title).toContain('Das 30-Tages-Fenster');
    expect(out.title).not.toContain('Executive Brief');
    expect(out.description).toContain('gesetzgeberische Abschlussphase');
  });

  it('preserves year-led Japanese titles instead of stripping leading digits as emoji', () => {
    const out = extractLocalizedBriefSeo({
      briefMarkdown: [
        '# 2026年5月先行予測：スウェーデンの選挙前立法クライマックス',
        '',
        '## 🎯 要点',
        '',
        'スウェーデンのリクスダーグは2026年5月を迎えるにあたり、クリステション政権の安全・秩序プログラムが立法のクライマックスに近づいている。',
      ].join('\n'),
      subfolder: 'month-ahead',
      lang: 'ja',
    });
    expect(out.title).toBe('2026年5月先行予測：スウェーデンの選挙前立法クライマックス');
  });

  it('accepts concise but valid Chinese headlines that are shorter than the Latin minimum', () => {
    const out = extractLocalizedBriefSeo({
      briefMarkdown: [
        '# 社会民主党挑战政府反腐过度立法',
        '',
        '## 🎯 核心结论',
        '',
        '社会民主党提交委员会动议 HD024099，挑战政府的反腐旗舰提案并将公务员刑事问责推向选前政治中心。',
      ].join('\n'),
      subfolder: 'motions',
      lang: 'zh',
    });
    expect(out.title).toBe('社会民主党挑战政府反腐过度立法');
    expect(out.description).toContain('HD024099');
  });

  it('falls back to first prose paragraph when no BLUF heading is present', () => {
    const out = extractLocalizedBriefSeo({
      briefMarkdown: noBlufBrief,
      subfolder: 'myndigheter',
    });
    expect(out.title).toContain('Statskontoret');
    expect(out.description).toBeTruthy();
    expect(out.description!).toContain('första prosaparagrafen');
  });

  it('returns null description when BLUF section is empty', () => {
    const out = extractLocalizedBriefSeo({
      briefMarkdown: emptyBlufBrief,
      subfolder: 'propositions',
    });
    expect(out.title).toContain('Story-oriented title');
    expect(out.description).toBeNull();
  });

  it('returns null title + null description + empty keywords when markdown is empty or absent', () => {
    expect(extractLocalizedBriefSeo({ briefMarkdown: '', subfolder: 'propositions' }))
      .toEqual({ title: null, description: null, keywords: [] });
    expect(extractLocalizedBriefSeo({ briefMarkdown: '   \n  ', subfolder: 'propositions' }))
      .toEqual({ title: null, description: null, keywords: [] });
    expect(extractLocalizedBriefSeo({ briefMarkdown: null, subfolder: 'propositions' }))
      .toEqual({ title: null, description: null, keywords: [] });
    expect(extractLocalizedBriefSeo({ briefMarkdown: undefined, subfolder: 'propositions' }))
      .toEqual({ title: null, description: null, keywords: [] });
  });

  it('truncates a very long BLUF to a sentence boundary', () => {
    const longBrief = [
      '# Riksdagen antar förvarsbudgeten med kvalificerad majoritet',
      '',
      '## BLUF',
      '',
      // Two short sentences; the truncator should land between them or after
      // the second depending on the soft-min window.
      'Riksdagen antog försvarsbudgeten på 132,4 miljarder kronor med 198 röster mot 142 efter en sex timmar lång debatt fredag 9 maj 2026. ' +
      'Sverigedemokraterna röstade enhälligt med Tidö-koalitionen efter att Magdalena Andersson (S) krävt utökad insyn i materielanskaffningen.',
    ].join('\n');
    const out = extractLocalizedBriefSeo({
      briefMarkdown: longBrief,
      subfolder: 'budget',
    });
    expect(out.description).toBeTruthy();
    expect(out.description!.length).toBeLessThanOrEqual(400);
    // Must end on a clean punctuation boundary (or the truncator's ellipsis).
    expect(out.description!).toMatch(/[.!?。।…]\s*$|…$/);
  });

  it('falls back to BLUF-derived title when H1 collapses to the subfolder label after cleaning', () => {
    // `cleanArticleTitle` checks the cleaned H1 against the prettified
    // subfolder label; a bare `# Propositions` H1 is banned, so BLUF fallback
    // synthesizes a title from the BLUF text.
    const briefWithSlugTitle = [
      '# Propositions',
      '',
      '## BLUF',
      '',
      'Tre propositioner från regeringen behandlas i riksdagen denna vecka kring försvar och migration.',
    ].join('\n');
    const out = extractLocalizedBriefSeo({
      briefMarkdown: briefWithSlugTitle,
      subfolder: 'propositions',
    });
    expect(out.title).toBeTruthy();
    expect(out.title!.length).toBeLessThanOrEqual(70);
    expect(out.description).toBeTruthy();
  });

  it('strips new decision-analysis prefix forms from H1 titles', () => {
    const prefixes = [
      { lang: 'sv', prefix: 'Beslutsunderlag', topic: 'försvarsutgifter' },
      { lang: 'de', prefix: 'Entscheidungsunterlage', topic: 'Verteidigungshaushalt' },
      { lang: 'fr', prefix: "Note d'analyse décisionnelle", topic: 'budget de la défense' },
      { lang: 'es', prefix: 'Nota de análisis decisional', topic: 'defensa' },
      { lang: 'ja', prefix: '意思決定分析', topic: '防衛予算の増額' },
      { lang: 'ko', prefix: '의사결정 분석', topic: '국방 예산 증액' },
      { lang: 'zh', prefix: '决策分析简报', topic: '国防预算增加' },
    ];
    for (const { lang, prefix, topic } of prefixes) {
      const brief = [
        `# ${prefix} — ${topic}`,
        '',
        '## BLUF',
        '',
        `Detaljtext om ${topic}.`,
      ].join('\n');
      const out = extractLocalizedBriefSeo({
        briefMarkdown: brief,
        subfolder: 'propositions',
        lang: lang as Language,
      });
      expect(out.title).toBeTruthy();
      // The prefix should have been stripped
      expect(out.title!).not.toContain(prefix);
      expect(out.title).toContain(topic);
    }
  });

  it('skips HTML block elements in readFirstParagraph fallback', () => {
    const briefWithHtml = [
      '# Verteidigungshaushalt steigt auf 132 Milliarden',
      '',
      '<p align="center"><img src="chart.png" /></p>',
      '',
      '<div class="metadata">Author: System</div>',
      '',
      'Tatsächlicher Absatz mit den wichtigsten Informationen zum Thema.',
    ].join('\n');
    const out = extractLocalizedBriefSeo({
      briefMarkdown: briefWithHtml,
      subfolder: 'propositions',
      lang: 'de',
    });
    expect(out.description).toBeTruthy();
    // Description should NOT contain HTML tags
    expect(out.description!).not.toMatch(/<[a-zA-Z]/);
    expect(out.description!).toContain('Tatsächlicher Absatz');
  });
});
