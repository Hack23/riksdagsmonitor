/**
 * @module Tests/RenderLib/ArticleHeadMetadata
 * @category Intelligence Operations / Tests
 * @name Article `<head>` metadata composer — shared between renderer and QA
 *
 * @description
 * Locks the contract of {@link ../scripts/render-lib/article-head-metadata.ts |
 * computeArticleHeadMetadata}, the helper that both the production
 * article renderer and the `test-article-headers` audit CLI call to
 * derive the shipped `<head>` metadata for a given `article.md`.
 *
 * If the audit CLI prints values that this test does not see, the two
 * call sites have drifted — which is exactly what the helper was
 * extracted to prevent.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  computeArticleHeadMetadata,
  inferArticleType,
  parseFrontMatterDate,
} from '../scripts/render-lib/article-head-metadata.js';
import { titleWindowForLanguage } from '../scripts/render-lib/aggregator/seo/serp-budgets.js';

const ARTICLE_MD = `---
title: Riksdag Sets Spring Vote on Constitutional Reform
description: The Konstitutionsutskottet referred the proposal to a committee hearing on 2026-05-22 ahead of the planned vote in week 24.
keywords: Riksdagsmonitor, Konstitutionsutskottet, constitutional reform, Swedish Parliament, committee reports
date: 2026-05-22
---

# Riksdag Sets Spring Vote on Constitutional Reform

Body content omitted.
`;

describe('computeArticleHeadMetadata', () => {
  it('returns the raw front-matter values verbatim', () => {
    const head = computeArticleHeadMetadata({
      markdown: ARTICLE_MD,
      lang: 'en',
      canonicalPath: 'news/2026-05-22-committeeReports-en.html',
    });
    expect(head.rawTitle).toBe('Riksdag Sets Spring Vote on Constitutional Reform');
    expect(head.rawDescription).toBe(
      'The Konstitutionsutskottet referred the proposal to a committee hearing on 2026-05-22 ahead of the planned vote in week 24.',
    );
    expect(head.rawKeywords).toBe(
      'Riksdagsmonitor, Konstitutionsutskottet, constitutional reform, Swedish Parliament, committee reports',
    );
  });

  it('parses the front-matter date into YYYY-MM-DD', () => {
    const head = computeArticleHeadMetadata({
      markdown: ARTICLE_MD,
      lang: 'en',
      canonicalPath: 'news/2026-05-22-committeeReports-en.html',
    });
    expect(head.date).toBe('2026-05-22');
  });

  it('infers the article type from the canonical path (committee-reports)', () => {
    const head = computeArticleHeadMetadata({
      markdown: ARTICLE_MD,
      lang: 'en',
      canonicalPath: 'news/2026-05-22-committeeReports-en.html',
    });
    expect(head.articleTypeId.toLowerCase()).toContain('committee');
    expect(head.articleTypeLabel.length).toBeGreaterThan(0);
  });

  it('produces a branded <title> with brand OR localized date prefix when seo.title omits the brand', () => {
    const head = computeArticleHeadMetadata({
      markdown: ARTICLE_MD,
      lang: 'en',
      canonicalPath: 'news/2026-05-22-committeeReports-en.html',
    });
    // Under the date-prefix contract, either the brand suffix or the
    // localized newsroom date prefix anchors the SERP title (whichever fits
    // the per-language SERP budget). Both are valid uniqueness signals.
    expect(
      /riksdagsmonitor/i.test(head.brandedTitle) || /May 22, 2026/.test(head.brandedTitle),
    ).toBe(true);
  });

  it('forwards keywords / description into the buildArticleSeoMetadata output', () => {
    const head = computeArticleHeadMetadata({
      markdown: ARTICLE_MD,
      lang: 'en',
      canonicalPath: 'news/2026-05-22-committeeReports-en.html',
    });
    expect(head.seo.title.length).toBeGreaterThan(0);
    expect(head.seo.description.length).toBeGreaterThan(0);
    expect(head.seo.keywords.length).toBeGreaterThan(0);
  });

  it('falls back to "today" when the front-matter date is missing', () => {
    const noDateMarkdown = `---
title: Sample
description: Sample description
keywords: Riksdagsmonitor
---

# Sample
`;
    const head = computeArticleHeadMetadata({
      markdown: noDateMarkdown,
      lang: 'en',
      canonicalPath: 'news/2026-05-22-realtime-en.html',
      now: new Date('2026-01-15T12:00:00Z'),
    });
    expect(head.date).toBe('2026-01-15');
  });

  it('exposes articleSection matching the value buildChrome passes to article:section', () => {
    const head = computeArticleHeadMetadata({
      markdown: ARTICLE_MD,
      lang: 'en',
      canonicalPath: 'news/2026-05-22-committeeReports-en.html',
    });
    // Must equal the hard-coded default in chrome/head.ts:
    //   opts.section ?? 'Political Intelligence'
    // renderArticleHtml passes head.articleSection as section, so both
    // the audit report and the rendered HTML will always agree.
    expect(head.articleSection).toBe('Political Intelligence');
  });
});

describe('parseFrontMatterDate (re-exported)', () => {
  it('accepts an ISO Date instance', () => {
    expect(parseFrontMatterDate(new Date('2026-04-17T00:00:00Z'))).toBe('2026-04-17');
  });

  it('accepts a YYYY-MM-DD string', () => {
    expect(parseFrontMatterDate('2026-04-17')).toBe('2026-04-17');
  });

  it('falls back to the injected "now" when the input is missing', () => {
    expect(parseFrontMatterDate(undefined, new Date('2026-01-15T12:00:00Z'))).toBe('2026-01-15');
  });
});

describe('inferArticleType (re-exported)', () => {
  it('recognises realtime-pulse canonical paths', () => {
    const t = inferArticleType('news/2026-04-17-realtime-1434-en.html', 'Some title');
    expect(t.type).toBe('realtime');
    expect(t.label.length).toBeGreaterThan(0);
  });

  it('falls back to political-intelligence for unknown paths', () => {
    const t = inferArticleType('news/2026-04-17-unknown-en.html', 'Some title');
    expect(t.type).toBe('political-intelligence');
  });
});

/**
 * Regression suite for the "branded `<title>` over-budget" defect
 * reported by `Test Article Headers` workflow run #26364730339
 * (audit: 145 of 202 EN titles shipped at > 70 chars, max=88, avg=73.7).
 *
 * The root cause was a two-step composition bug: `buildSeoTitle()`
 * correctly respected the per-language SERP `hardMax` and dropped the
 * ` — Riksdagsmonitor` suffix when story+brand overshot the budget, but
 * `brandTitle()` then unconditionally re-appended that same 18-char
 * suffix — re-introducing the overshoot the SEO composer had just
 * eliminated. After the fix `brandTitle()` is per-language budget aware:
 * it appends the brand suffix only when `title.length + 18 ≤
 * titleWindowForLanguage(lang).hardMax` AND the title does not already
 * end with `…` (which is `buildSeoTitle`'s explicit signal that it
 * already hit the truncation ceiling).
 */
describe('computeArticleHeadMetadata — branded <title> respects per-language SERP budget', () => {
  const LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'] as const;

  // 83-char H1 from analysis/daily/2026-05-22/committee-reports — the
  // canonical regression case from run #26364730339. Before the fix
  // this shipped as a 84-char `<title>` ending `…Five — Riksdagsmonitor`.
  const AUDIT_OVERSHOOT_H1 = 'Sweden Passes AI Facial Recognition Law as Riksdag Advances Five Committee Reports';

  it('audit regression: max=88 EN title no longer overshoots the 70-char hardMax', () => {
    const markdown = `---\ntitle: ${AUDIT_OVERSHOOT_H1}\ndescription: Sweden's Justice Committee endorsed the bill.\nkeywords: Riksdagsmonitor\ndate: 2026-05-22\n---\n\n# ${AUDIT_OVERSHOOT_H1}\n`;
    const head = computeArticleHeadMetadata({
      markdown,
      lang: 'en',
      canonicalPath: 'news/2026-05-22-committeeReports-en.html',
    });
    expect(head.brandedTitle.length).toBeLessThanOrEqual(70);
    // Truncated branded titles must NOT end with " — Riksdagsmonitor"
    // glued onto a dangling-ellipsis fragment — that's the exact
    // anti-pattern the audit caught.
    expect(head.brandedTitle).not.toMatch(/…\s*[—-]\s*Riksdagsmonitor\s*$/i);
  });

  it('short H1 keeps a brand-or-date anchor when it fits the budget', () => {
    // 41-char H1 + 15-char localized date prefix " · May 22, 2026" + 18-char
    // brand suffix = 74 chars > 70-char hardMax. Under the date-prefix
    // contract, the date prefix wins (uniqueness signal preferred) and the
    // brand drops — but the title still has an anchor (date OR brand).
    const shortH1 = 'Riksdag Sets Date for Constitutional Vote';
    const markdown = `---\ntitle: ${shortH1}\ndescription: x\nkeywords: x\ndate: 2026-05-22\n---\n\n# ${shortH1}\n`;
    const head = computeArticleHeadMetadata({
      markdown,
      lang: 'en',
      canonicalPath: 'news/2026-05-22-committeeReports-en.html',
    });
    expect(
      /riksdagsmonitor/i.test(head.brandedTitle) || /May 22, 2026/.test(head.brandedTitle),
    ).toBe(true);
    expect(head.brandedTitle.length).toBeLessThanOrEqual(70);
  });

  it.each(LANGUAGES)('over-budget H1 in lang=%s never overshoots titleWindowForLanguage(lang).hardMax', (lang) => {
    // Long Latin-only H1 well over every per-language hardMax (70/60/45).
    // The renderer must truncate to ≤ hardMax regardless of language.
    const longH1 = 'Sweden Passes AI Facial Recognition Law as Riksdag Advances Five Committee Reports and Three Migration Bills';
    const markdown = `---\ntitle: ${longH1}\ndescription: Body.\nkeywords: Riksdagsmonitor\ndate: 2026-05-22\nlanguage: ${lang}\n---\n\n# ${longH1}\n`;
    const head = computeArticleHeadMetadata({
      markdown,
      lang,
      canonicalPath: `news/2026-05-22-committeeReports-${lang}.html`,
    });
    const { hardMax } = titleWindowForLanguage(lang);
    expect(head.brandedTitle.length).toBeLessThanOrEqual(hardMax);
    // The over-budget path must NEVER carry the brand suffix because
    // suffix-with-overshoot is precisely the audit defect.
    expect(/riksdagsmonitor/i.test(head.brandedTitle)).toBe(false);
  });

  it('truncated branded title from the news/index card regression no longer reads "…Five… — Riksdagsmonitor"', () => {
    const markdown = `---\ntitle: ${AUDIT_OVERSHOOT_H1}\ndescription: Body.\nkeywords: Riksdagsmonitor\ndate: 2026-05-22\n---\n\n# ${AUDIT_OVERSHOOT_H1}\n`;
    const head = computeArticleHeadMetadata({
      markdown,
      lang: 'en',
      canonicalPath: 'news/2026-05-22-committeeReports-en.html',
    });
    // Dangling cardinal "Five" must have been stripped before the
    // ellipsis was glued on; the trailing word must be a content noun.
    expect(head.brandedTitle).not.toMatch(/\bfive…?$/i);
  });
});

