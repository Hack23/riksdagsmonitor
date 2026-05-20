/**
 * @module tests/backfill-article-metadata/rules/hreflang
 * @description Rule-level coverage for hreflang and `<html lang>`
 * extraction, sourced from the html-inspector tests. Split per
 * Hack23/riksdagsmonitor#2624 from
 * `tests/backfill-article-metadata.test.ts` (725 lines).
 */

import { describe, it, expect } from 'vitest';

import {
  inspectHtmlContent,
  __test__ as inspectorTest,
} from '../../../scripts/backfill-lib/html-inspector.js';

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="sv">
<head>
  <title>Regeringen godkänner vårbudget — Riksdagsmonitor</title>
  <meta name="description" content="Sveriges regering godkände i dag vårbudgeten efter tre månaders förhandling.">
  <meta property="og:title" content="OG Title Example">
  <meta property="og:description" content="OG description example.">
  <meta name="twitter:title" content="Twitter Title Example">
  <meta name="twitter:description" content="Twitter description example.">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"NewsArticle","headline":"JSON-LD Headline","alternativeHeadline":"JSON-LD Alt Headline","description":"JSON-LD Description"}
  </script>
</head>
<body>
  <article>
    <h1>Regeringen godkänner vårbudget</h1>
    <p>Sveriges regering godkände i dag vårbudgeten efter tre månaders förhandling.</p>
  </article>
</body>
</html>`;

describe('html-inspector: inspectHtmlContent', () => {
  it('extracts every metadata surface', () => {
    const meta = inspectHtmlContent(SAMPLE_HTML, '/tmp/sample.html');
    expect(meta.lang).toBe('sv');
    expect(meta.title).toBe('Regeringen godkänner vårbudget — Riksdagsmonitor');
    expect(meta.metaDescription).toMatch(/^Sveriges regering/);
    expect(meta.ogTitle).toBe('OG Title Example');
    expect(meta.ogDescription).toBe('OG description example.');
    expect(meta.twitterTitle).toBe('Twitter Title Example');
    expect(meta.twitterDescription).toBe('Twitter description example.');
    expect(meta.jsonLdHeadline).toBe('JSON-LD Headline');
    expect(meta.jsonLdAlternativeHeadline).toBe('JSON-LD Alt Headline');
    expect(meta.jsonLdDescription).toBe('JSON-LD Description');
  });

  it('extracts meta tag content regardless of attribute order', () => {
    const html = `<!DOCTYPE html><html lang="en"><head>
      <title>Attribute order example</title>
      <meta content="Description first." name="description">
      <meta content="OG title first" property="og:title">
      <meta content="OG description first." property="og:description">
      <meta content="Twitter title first" name="twitter:title">
      <meta content="Twitter description first." name="twitter:description">
    </head><body><article><p>Body.</p></article></body></html>`;
    const meta = inspectHtmlContent(html);
    expect(meta.metaDescription).toBe('Description first.');
    expect(meta.ogTitle).toBe('OG title first');
    expect(meta.ogDescription).toBe('OG description first.');
    expect(meta.twitterTitle).toBe('Twitter title first');
    expect(meta.twitterDescription).toBe('Twitter description first.');
  });

  it('decodes entity-bearing unquoted meta attribute values', () => {
    const html = `<!DOCTYPE html><html lang="en"><head>
      <title>Unquoted attribute example</title>
      <meta name=description content=Sweden&#39;s-budget>
    </head><body><article><p>Body.</p></article></body></html>`;
    const meta = inspectHtmlContent(html);
    expect(meta.metaDescription).toBe("Sweden's-budget");
  });

  it('populates bodyPlainText from <article> contents', () => {
    const meta = inspectHtmlContent(SAMPLE_HTML);
    expect(meta.bodyPlainText).toContain('Sveriges regering godkände');
    expect(meta.bodyPlainText).not.toContain('<h1>');
  });

  it('decodes HTML entities in metadata', () => {
    const html = SAMPLE_HTML.replace(
      'Sveriges regering godkände i dag vårbudgeten efter tre månaders förhandling.',
      'Sweden&#39;s government approved today&#8217;s spring budget.',
    );
    const meta = inspectHtmlContent(html);
    expect(meta.metaDescription).toContain("Sweden's government approved today");
  });

  it('returns empty lang when <html lang="…"> is missing (CLI applies the fallback)', () => {
    const meta = inspectHtmlContent('<html><head><title>x</title></head></html>');
    expect(meta.lang).toBe('');
  });

  it('extracts <html lang> from single-quoted, unquoted, and reordered attributes', () => {
    expect(inspectHtmlContent("<html lang='sv'><head><title>t</title></head></html>").lang).toBe('sv');
    expect(inspectHtmlContent('<html lang=de><head><title>t</title></head></html>').lang).toBe('de');
    expect(inspectHtmlContent('<html dir="ltr" lang="fr"><head><title>t</title></head></html>').lang).toBe('fr');
  });

  it('extracts JSON-LD with extra/reordered attributes and single quotes', () => {
    const html1 = `<html lang="en"><head><title>t</title>
<script defer type="application/ld+json">{"headline":"Reordered"}</script>
</head></html>`;
    expect(inspectHtmlContent(html1).jsonLdHeadline).toBe('Reordered');

    const html2 = `<html lang="en"><head><title>t</title>
<script type='application/ld+json'>{"headline":"Single quoted"}</script>
</head></html>`;
    expect(inspectHtmlContent(html2).jsonLdHeadline).toBe('Single quoted');
  });

  it('survives a malformed JSON-LD block without crashing', () => {
    const html = `<html lang="en"><head><title>t</title><script type="application/ld+json">{bad json</script></head></html>`;
    const meta = inspectHtmlContent(html);
    expect(meta.jsonLdHeadline).toBe('');
  });

  it('scans multiple JSON-LD blocks and picks the first with the field', () => {
    const html = `<html lang="en"><head><title>t</title>
<script type="application/ld+json">{"@type":"WebSite"}</script>
<script type="application/ld+json">{"@type":"NewsArticle","headline":"Found"}</script>
</head></html>`;
    const meta = inspectHtmlContent(html);
    expect(meta.jsonLdHeadline).toBe('Found');
  });

  it('handles JSON-LD @graph arrays', () => {
    const html = `<html lang="en"><head><title>t</title>
<script type="application/ld+json">{"@graph":[{"@type":"NewsArticle","headline":"From Graph"}]}</script>
</head></html>`;
    const meta = inspectHtmlContent(html);
    expect(meta.jsonLdHeadline).toBe('From Graph');
  });

  it('htmlDecode test helper decodes numeric references', () => {
    expect(inspectorTest.htmlDecode('&#8212;')).toBe('—');
    expect(inspectorTest.htmlDecode('&#x2014;')).toBe('—');
  });

  it('htmlDecode leaves invalid numeric references untouched', () => {
    expect(inspectorTest.htmlDecode('&#999999999999;')).toBe('&#999999999999;');
    expect(inspectorTest.htmlDecode('&#x110000;')).toBe('&#x110000;');
    expect(inspectorTest.htmlDecode('&#xD800;')).toBe('&#xD800;');
  });

  it('htmlDecode is single-pass (CodeQL js/double-escaping regression)', () => {
    // `&amp;quot;` must survive as the literal text `&quot;` rather
    // than being double-decoded to `"`.
    expect(inspectorTest.htmlDecode('&amp;quot;')).toBe('&quot;');
    expect(inspectorTest.htmlDecode('&amp;amp;')).toBe('&amp;');
    expect(inspectorTest.htmlDecode('&amp;#39;')).toBe('&#39;');
  });

  it('stripTags test helper removes inline tags and collapses whitespace', () => {
    expect(inspectorTest.stripTags('<p>hello <b>world</b></p>')).toBe('hello world');
  });

  it('stripTags handles script/style end tags with whitespace before `>`', () => {
    // Regression for CodeQL js/bad-tag-filter — `</script >` (space
    // before the bracket) is valid HTML5 syntax and must be stripped.
    expect(inspectorTest.stripTags('a<script>evil()</script >b')).toBe('a b');
    expect(inspectorTest.stripTags('a<style>x{}</style\t>b')).toBe('a b');
  });

  it('stripTags handles malformed script end tags with trailing tokens', () => {
    expect(inspectorTest.stripTags('a<script>evil()</script\t\n bar>b')).toBe('a b');
    expect(inspectorTest.stripTags('a<style>x{}</style bogus>b')).toBe('a b');
  });

  it('inspectHtmlContent strips a script block whose end tag has whitespace', () => {
    const html = `<html lang="en"><head><title>t</title></head>
<body><article><p>before <script>alert(1)</script\n>after</p></article></body></html>`;
    const meta = inspectHtmlContent(html);
    expect(meta.bodyPlainText).toContain('before');
    expect(meta.bodyPlainText).toContain('after');
    expect(meta.bodyPlainText).not.toContain('alert');
  });
});

// ---------------------------------------------------------------------------
// report-writer (CSV quoting + serialisation)
// ---------------------------------------------------------------------------

