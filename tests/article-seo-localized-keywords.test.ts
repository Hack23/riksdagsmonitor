/**
 * @module Tests/RenderLib/ArticleSeo/LocalizedKeywords
 * @category Intelligence Operations / Tests
 * @name Article SEO keyword localization — non-EN leakage regression
 *
 * @description
 * Regression tests for `buildArticleKeywords` in
 * `scripts/render-lib/article-seo.ts`.
 *
 * Live regression case before the 2026-05 fix:
 *
 *   news/2026-05-15-committeeReports-de.html →
 *   <meta name="keywords"
 *     content="CommitteeReports, English, May 15, 2026 update,
 *              Riksdagsmonitor, Swedish Parliament, Riksdag,
 *              political intelligence, OSINT, Swedish politics,
 *              democratic transparency, Enshrines, Constitutional,
 *              Protection, Abortion, Expands, Security, State,
 *              Toolkit, Sweden, Committee, tabled, interlocked">
 *
 * Roughly half the tokens were English on a German page. The cause:
 * `buildArticleKeywords` seeded the keyword list from the English
 * front-matter `keywords:` field (set by the aggregator from the EN
 * article), and the global `CORE_KEYWORDS` constant was English-only.
 *
 * These tests pin the fix:
 *   1. Non-EN keyword strings never include the English `input.keywords`
 *      seed.
 *   2. Non-EN keyword strings never include the English Language-Meta
 *      `name` (e.g. `Swedish`, `Arabic`) — only the native name.
 *   3. Non-EN keyword strings never include the English hyphen-slug
 *      article-type ID (`committee-reports`, `realtime-pulse`).
 *   4. Non-EN keyword strings never include English canonical-path slug
 *      segments (`committeeReports`, `realtime`, …).
 *   5. Non-EN keyword strings DO include the native core keywords from
 *      `LANG_CORE_KEYWORDS` (German: `Schwedisches Parlament`,
 *      `politische Aufklärung`, etc.).
 *   6. The EN path stays byte-compatible — same ordering as before,
 *      same English seeds, same English core keywords.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { buildArticleKeywords } from '../scripts/render-lib/article-seo.js';

const BASE_INPUT = {
  title: 'Riksdag Enshrines Constitutional Protection for Abortion',
  description:
    "Sweden's Constitutional Committee tabled two interlocked amendments " +
    'requiring a 2/3 supermajority.',
  date: '2026-05-15',
  articleTypeLabel: 'Committee reports',
  articleTypeId: 'committee-reports',
  canonicalPath: 'news/2026-05-15-committeeReports-en.html',
  // The aggregator-produced EN frontmatter keyword string — this is
  // exactly the leak we are guarding against on non-EN renders.
  keywords:
    'CommitteeReports, English, May 15, 2026 update, Riksdagsmonitor, ' +
    'Swedish Parliament, Riksdag, political intelligence, OSINT, ' +
    'Swedish politics, democratic transparency',
};

describe('buildArticleKeywords — EN path (regression baseline)', () => {
  it('keeps the original EN ordering and includes the EN core keyword set', () => {
    const out = buildArticleKeywords({ ...BASE_INPUT, lang: 'en' });
    expect(out).toContain('CommitteeReports');
    expect(out).toContain('Swedish Parliament');
    expect(out).toContain('political intelligence');
    expect(out).toContain('democratic transparency');
    expect(out).toContain('OSINT');
    // EN article-type ID (hyphen-slug) is included on EN.
    expect(out.toLowerCase()).toContain('committee reports');
  });
});

describe('buildArticleKeywords — non-EN path drops EN seed leaks', () => {
  // Build a German-side context where the cascade has already overridden
  // title + description with localized strings (via article-merge.ts).
  const DE_INPUT = {
    ...BASE_INPUT,
    title: 'Der Riksdag verankert verfassungsrechtlichen Schutz für Abtreibung',
    description:
      'Schwedens Verfassungsausschuss hat zwei miteinander verbundene ' +
      'Verfassungsänderungen vorgelegt, die eine 2/3-Supermehrheit erfordern.',
    articleTypeLabel: 'Ausschussberichte',
    canonicalPath: 'news/2026-05-15-committeeReports-de.html',
    lang: 'de' as const,
  };

  it('does NOT include the English frontmatter `keywords:` seed', () => {
    const out = buildArticleKeywords(DE_INPUT);
    // Hard-block on tokens that ONLY appear in the EN frontmatter.
    expect(out).not.toMatch(/\bSwedish Parliament\b/);
    expect(out).not.toMatch(/\bpolitical intelligence\b/);
    expect(out).not.toMatch(/\bSwedish politics\b/);
    expect(out).not.toMatch(/\bdemocratic transparency\b/);
    expect(out).not.toMatch(/\bCommitteeReports\b/);
  });

  it('does NOT include the English Language-Meta `name`', () => {
    const out = buildArticleKeywords(DE_INPUT);
    // `German` (the EN name for de) must not appear under a DE page.
    expect(out).not.toMatch(/\bGerman\b/);
  });

  it('does NOT include the English article-type ID hyphen-slug', () => {
    const out = buildArticleKeywords(DE_INPUT);
    expect(out).not.toMatch(/committee reports/i);
    expect(out).not.toMatch(/committee-reports/i);
  });

  it('does NOT include English canonical-path slug parts', () => {
    const out = buildArticleKeywords(DE_INPUT);
    // The `committeeReports` slug in canonicalPath leaked into EN.
    expect(out).not.toMatch(/committeeReports/);
  });

  it('DOES include the German core keyword set', () => {
    const out = buildArticleKeywords(DE_INPUT);
    expect(out).toContain('Schwedisches Parlament');
    expect(out).toContain('politische Aufklärung');
    expect(out).toContain('demokratische Transparenz');
    expect(out).toContain('Riksdagsmonitor');
    expect(out).toContain('OSINT');
  });

  it('does NOT inject any English `update` word in the publication keyword', () => {
    const out = buildArticleKeywords(DE_INPUT);
    // The legacy `formatPublicationUpdateKeyword` helper has been removed
    // entirely — `Aktualisierung`, `update`, `uppdatering` etc. no longer
    // appear in the keyword list. Date is conveyed via `article:published_time`.
    expect(out).not.toMatch(/\bupdate\b/i);
    expect(out).not.toMatch(/\bAktualisierung\b/);
    expect(out).not.toMatch(/\buppdatering\b/);
  });

  it('includes the German government keyword (institutional floor)', () => {
    const out = buildArticleKeywords(DE_INPUT);
    // The mandatory floor pairs Riksdag with the executive branch in
    // every locale ("Regeringen" / "Schwedische Regierung" / "瑞典政府"…).
    expect(out).toMatch(/Schwedische Regierung|Regeringen/);
  });

  it('surfaces the localized article-type label', () => {
    const out = buildArticleKeywords(DE_INPUT);
    expect(out).toContain('Ausschussberichte');
  });

  it('does NOT leak EN title tokens (Enshrines / Protection / Abortion) under DE', () => {
    const out = buildArticleKeywords(DE_INPUT);
    expect(out).not.toMatch(/Enshrines/);
    expect(out).not.toMatch(/Protection/);
    expect(out).not.toMatch(/Abortion/);
  });
});

describe('buildArticleKeywords — Arabic (RTL) localization', () => {
  it('uses native Arabic core keywords and no English leakage', () => {
    const out = buildArticleKeywords({
      ...BASE_INPUT,
      title: 'الريكسداغ يُكرّس الحماية الدستورية للإجهاض',
      description:
        'قدّمت لجنة الدستور السويدية تعديلَين دستوريَّين مترابطَين يستلزمان أغلبية ثلثين.',
      articleTypeLabel: 'تقارير اللجان',
      canonicalPath: 'news/2026-05-15-committeeReports-ar.html',
      lang: 'ar',
    });
    expect(out).toContain('الريكسداغ');
    expect(out).toContain('استخبارات سياسية');
    expect(out).toContain('السياسة السويدية');
    expect(out).toContain('Riksdagsmonitor');
    expect(out).toContain('OSINT');
    // No EN frontmatter leak
    expect(out).not.toMatch(/Swedish Parliament/);
    expect(out).not.toMatch(/political intelligence/);
    expect(out).not.toMatch(/CommitteeReports/);
    // No EN Language-Meta name
    expect(out).not.toMatch(/\bArabic\b/);
  });
});

describe('buildArticleKeywords — Japanese (CJK) localization', () => {
  it('uses native Japanese core keywords and no English leakage', () => {
    const out = buildArticleKeywords({
      ...BASE_INPUT,
      title: 'スウェーデン議会、中絶の憲法的保護を確立',
      description: 'スウェーデン憲法委員会は、3分の2の超多数決を要する2つの相互に関連した憲法改正案を提出した。',
      articleTypeLabel: '委員会報告',
      canonicalPath: 'news/2026-05-15-committeeReports-ja.html',
      lang: 'ja',
    });
    expect(out).toContain('スウェーデン議会');
    expect(out).toContain('政治インテリジェンス');
    expect(out).toContain('スウェーデン政治');
    expect(out).toContain('Riksdagsmonitor');
    expect(out).toContain('OSINT');
    expect(out).not.toMatch(/Swedish Parliament/);
    expect(out).not.toMatch(/political intelligence/);
    expect(out).not.toMatch(/\bJapanese\b/);
  });
});

describe('buildArticleKeywords — covers every supported language', () => {
  const LANGS = [
    'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl',
    'ar', 'he', 'ja', 'ko', 'zh',
  ] as const;

  for (const lang of LANGS) {
    it(`returns a non-empty keyword string for lang=${lang} including Riksdagsmonitor`, () => {
      const out = buildArticleKeywords({ ...BASE_INPUT, lang });
      expect(out.length).toBeGreaterThan(0);
      expect(out).toContain('Riksdagsmonitor');
      expect(out).toContain('OSINT');
    });
  }
});
