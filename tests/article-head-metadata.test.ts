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

const ARTICLE_MD = `---
title: Riksdag Schedules Spring Vote on Constitutional Reform
description: The Konstitutionsutskottet referred the proposal to a committee hearing on 2026-05-22 ahead of the planned vote in week 24.
keywords: Riksdagsmonitor, Konstitutionsutskottet, constitutional reform, Swedish Parliament, committee reports
date: 2026-05-22
---

# Riksdag Schedules Spring Vote on Constitutional Reform

Body content omitted.
`;

describe('computeArticleHeadMetadata', () => {
  it('returns the raw front-matter values verbatim', () => {
    const head = computeArticleHeadMetadata({
      markdown: ARTICLE_MD,
      lang: 'en',
      canonicalPath: 'news/2026-05-22-committeeReports-en.html',
    });
    expect(head.rawTitle).toBe('Riksdag Schedules Spring Vote on Constitutional Reform');
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

  it('produces a brand-suffixed branded <title> when seo.title omits the brand', () => {
    const head = computeArticleHeadMetadata({
      markdown: ARTICLE_MD,
      lang: 'en',
      canonicalPath: 'news/2026-05-22-committeeReports-en.html',
    });
    // Either the SEO composer or the chrome-suffix rule ensures the
    // branded `<title>` contains "Riksdagsmonitor".
    expect(/riksdagsmonitor/i.test(head.brandedTitle)).toBe(true);
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
