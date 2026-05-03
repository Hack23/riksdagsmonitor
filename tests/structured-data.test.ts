/**
 * @module Tests/StructuredData
 * @name JSON-LD structured-data validation tests
 *
 * @description
 * CI gate that asserts every article HTML produced by `renderArticleHtml`
 * carries the required JSON-LD blocks (NewsArticle, BreadcrumbList,
 * SpeakableSpecification) and the JSON-LD builders emit well-formed
 * Schema.org objects with all required fields.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  buildBreadcrumbListLd,
  buildNewsArticleLd,
  buildSpeakableWebPageLd,
  renderArticleHtml,
  BASE_URL,
} from '../scripts/render-lib/index.js';

// ---------------------------------------------------------------------------
// JSON-LD builder unit tests
// ---------------------------------------------------------------------------

describe('jsonld — buildBreadcrumbListLd', () => {
  it('produces a BreadcrumbList with correct positions and structure', () => {
    const ld = buildBreadcrumbListLd([
      { name: 'Home', item: 'https://riksdagsmonitor.com/' },
      { name: 'News', item: 'https://riksdagsmonitor.com/news/' },
      { name: 'Article Title' },
    ]);

    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('BreadcrumbList');

    const items = ld.itemListElement;
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://riksdagsmonitor.com/',
    });
    expect(items[1]).toMatchObject({
      '@type': 'ListItem',
      position: 2,
      name: 'News',
      item: 'https://riksdagsmonitor.com/news/',
    });
    expect(items[2]).toMatchObject({
      '@type': 'ListItem',
      position: 3,
      name: 'Article Title',
    });
    // Last item should NOT have `item` property (current page)
    expect(items[2]).not.toHaveProperty('item');
  });

  it('handles a single entry', () => {
    const ld = buildBreadcrumbListLd([{ name: 'Home' }]);
    expect(ld.itemListElement).toHaveLength(1);
    expect(ld.itemListElement[0].position).toBe(1);
  });

  it('throws when an intermediate entry is missing `item`', () => {
    expect(() =>
      buildBreadcrumbListLd([
        { name: 'Home' },  // missing item — not last
        { name: 'News', item: 'https://riksdagsmonitor.com/news/' },
        { name: 'Article' },
      ]),
    ).toThrow(/position 1 must have an `item` URL/);
  });
});

describe('jsonld — buildNewsArticleLd', () => {
  it('produces a NewsArticle with all required fields', () => {
    const ld = buildNewsArticleLd({
      headline: 'Test Headline',
      description: 'Test description.',
      datePublished: '2026-01-01T00:00:00Z',
      dateModified: '2026-01-02T00:00:00Z',
      inLanguage: 'en',
      url: `${BASE_URL}/news/test-en.html`,
      isBasedOn: [
        { url: 'https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-01-01/test/exec.md', name: 'exec.md' },
      ],
    });

    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('NewsArticle');
    expect(ld.headline).toBe('Test Headline');
    expect(ld.description).toBe('Test description.');
    expect(ld.datePublished).toBe('2026-01-01T00:00:00Z');
    expect(ld.dateModified).toBe('2026-01-02T00:00:00Z');
    expect(ld.inLanguage).toBe('en');
    expect(ld.url).toContain('/news/test-en.html');
    expect(ld.mainEntityOfPage).toBe(ld.url);
    expect(ld.isAccessibleForFree).toBe(true);

    // Publisher
    expect(ld.publisher['@type']).toBe('Organization');
    expect(ld.publisher.name).toBe('Hack23 AB');

    // Author
    expect(ld.author['@type']).toBe('Organization');

    // isBasedOn
    expect(ld.isBasedOn).toHaveLength(1);
    expect(ld.isBasedOn![0]['@type']).toBe('CreativeWork');
    expect(ld.isBasedOn![0].name).toBe('exec.md');
  });

  it('omits isBasedOn when no artifacts are provided', () => {
    const ld = buildNewsArticleLd({
      headline: 'Simple',
      description: 'd',
      datePublished: '2026-01-01T00:00:00Z',
      dateModified: '2026-01-01T00:00:00Z',
      inLanguage: 'sv',
      url: `${BASE_URL}/news/simple-sv.html`,
    });

    expect(ld).not.toHaveProperty('isBasedOn');
  });
});

describe('jsonld — buildSpeakableWebPageLd', () => {
  it('produces a WebPage with SpeakableSpecification', () => {
    const ld = buildSpeakableWebPageLd(
      `${BASE_URL}/news/test-en.html`,
      'en',
      ['.rm-article-header h1', '.rm-article-dek'],
    );

    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('WebPage');
    expect(ld.url).toContain('/news/test-en.html');
    expect(ld.inLanguage).toBe('en');
    expect(ld.speakable['@type']).toBe('SpeakableSpecification');
    expect(ld.speakable.cssSelector).toEqual(['.rm-article-header h1', '.rm-article-dek']);

    expect(ld.isPartOf).toMatchObject({
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
    });
  });
});

// ---------------------------------------------------------------------------
// Integration: renderArticleHtml emits all required JSON-LD blocks
// ---------------------------------------------------------------------------

describe('structured-data — renderArticleHtml integration', () => {
  const articleMd = [
    '---',
    'title: "Test Propositions Article"',
    'description: "A test article about Swedish government propositions."',
    'date: 2099-01-01',
    '---',
    '',
    '## Executive Brief',
    '',
    'The lede paragraph with key findings.',
  ].join('\n');

  it('emits NewsArticle JSON-LD', async () => {
    const html = await renderArticleHtml({
      markdown: articleMd,
      lang: 'en',
      canonicalPath: 'news/2099-01-01-propositions-en.html',
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/propositions',
      artifactsUsed: ['executive-brief.md'],
    });
    expect(html).toContain('"@type":"NewsArticle"');
    expect(html).toContain('"headline":"Test Propositions Article"');
    expect(html).toContain('"isBasedOn"');
  });

  it('emits BreadcrumbList JSON-LD', async () => {
    const html = await renderArticleHtml({
      markdown: articleMd,
      lang: 'en',
      canonicalPath: 'news/2099-01-01-propositions-en.html',
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/propositions',
      artifactsUsed: [],
    });
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain('"@type":"ListItem"');
    expect(html).toContain('"position":1');
    expect(html).toContain('"position":2');
    expect(html).toContain('"position":3');
  });

  it('emits SpeakableSpecification JSON-LD via WebPage', async () => {
    const html = await renderArticleHtml({
      markdown: articleMd,
      lang: 'en',
      canonicalPath: 'news/2099-01-01-propositions-en.html',
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/propositions',
      artifactsUsed: [],
    });
    expect(html).toContain('"@type":"WebPage"');
    expect(html).toContain('"@type":"SpeakableSpecification"');
    expect(html).toContain('.rm-article-header h1');
    expect(html).toContain('.rm-article-dek');
  });

  it('emits correct hreflang set including x-default', async () => {
    const alternates: Record<string, string> = {
      en: 'news/2099-01-01-propositions-en.html',
      sv: 'news/2099-01-01-propositions-sv.html',
    };
    const html = await renderArticleHtml({
      markdown: articleMd,
      lang: 'en',
      canonicalPath: 'news/2099-01-01-propositions-en.html',
      hreflangAlternates: alternates as Partial<Record<'en' | 'sv' | 'da' | 'no' | 'fi' | 'de' | 'fr' | 'es' | 'nl' | 'ar' | 'he' | 'ja' | 'ko' | 'zh', string>>,
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/propositions',
      artifactsUsed: [],
    });
    expect(html).toContain('hreflang="en"');
    expect(html).toContain('hreflang="sv"');
    expect(html).toContain('hreflang="x-default"');
  });

  it('emits Open Graph and Twitter Card meta tags', async () => {
    const html = await renderArticleHtml({
      markdown: articleMd,
      lang: 'en',
      canonicalPath: 'news/2099-01-01-propositions-en.html',
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/propositions',
      artifactsUsed: [],
    });
    expect(html).toContain('property="og:type" content="article"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
    expect(html).toContain('property="og:url"');
    expect(html).toContain('property="og:locale"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(html).toContain('name="twitter:title"');
  });

  it('emits correct lang attribute and dir for Arabic RTL', async () => {
    const html = await renderArticleHtml({
      markdown: articleMd,
      lang: 'ar',
      canonicalPath: 'news/2099-01-01-propositions-ar.html',
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/propositions',
      artifactsUsed: [],
    });
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain('"inLanguage":"ar"');
  });

  it('uses BCP-47 nb for Norwegian hreflang', async () => {
    const alternates: Record<string, string> = {
      en: 'news/2099-01-01-test-en.html',
      no: 'news/2099-01-01-test-no.html',
    };
    const html = await renderArticleHtml({
      markdown: articleMd,
      lang: 'no',
      canonicalPath: 'news/2099-01-01-test-no.html',
      hreflangAlternates: alternates as Partial<Record<'en' | 'sv' | 'da' | 'no' | 'fi' | 'de' | 'fr' | 'es' | 'nl' | 'ar' | 'he' | 'ja' | 'ko' | 'zh', string>>,
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/test',
      artifactsUsed: [],
    });
    // Norwegian uses 'nb' in hreflang (BCP-47) not 'no'
    expect(html).toContain('hreflang="nb"');
    expect(html).toContain('<html lang="nb"');
  });

  it('truncates BreadcrumbList title with ellipsis when longer than 50 characters', async () => {
    const longTitle = 'A Very Long Article Title That Exceeds Fifty Characters Limit Easily';
    const longMd = [
      '---',
      `title: "${longTitle}"`,
      'description: "Test description."',
      'date: 2099-01-01',
      '---',
      '',
      '## Brief',
      '',
      'Content.',
    ].join('\n');
    const html = await renderArticleHtml({
      markdown: longMd,
      lang: 'en',
      canonicalPath: 'news/2099-01-01-long-en.html',
      subfolderRepoRelPath: 'analysis/daily/2099-01-01/long',
      artifactsUsed: [],
    });
    // The breadcrumb should truncate at 47 chars + ellipsis
    const truncated = longTitle.substring(0, 47) + '…';
    expect(html).toContain(truncated);
    // Full title should NOT appear in the BreadcrumbList JSON-LD position-3 name
    // (but it DOES appear in the headline of the NewsArticle block and <h1>)
    const jsonLdBlocks = html.match(/<script type="application\/ld\+json">[^<]+<\/script>/g) ?? [];
    const breadcrumbBlock = jsonLdBlocks.find((b) => b.includes('"BreadcrumbList"'));
    expect(breadcrumbBlock).toBeDefined();
    expect(breadcrumbBlock).toContain(truncated);
    expect(breadcrumbBlock).not.toContain(longTitle);
  });
});
