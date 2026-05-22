/**
 * @module Tests/StaticPagesSeoHead
 * @category Intelligence Operations / Tests
 * @name Static-page SEO `<head>` enhancer — politician/dashboard/home regression
 *
 * @description
 * Unit tests for `scripts/static-pages-seo-head.ts`.
 *
 * Live regression case before the 2026-05 fix:
 *
 *   politician-dashboard_de.html →
 *   <meta name="keywords"
 *     content="politician analytics, MP productivity, career trajectory,
 *              riksdag politicians, Swedish parliament, …">
 *   (no Twitter Card, no JSON-LD, og:locale="en_US")
 *
 * All 14 `politician-dashboard*` files shipped the same English-only
 * keyword string; the German page told search engines its target
 * audience was English-speaking. After this module: localized 7-token
 * keyword sets per language, full Twitter Card, og:locale matrix, and
 * JSON-LD with Speakable for voice assistants.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  buildStaticPageKeywords,
  buildStaticPageOgLocaleBlock,
  buildStaticPageTwitterCardBlock,
  buildStaticPageJsonLd,
  enhanceStaticPageHead,
  type StaticPageFamily,
} from '../scripts/static-pages-seo-head.js';
import type { Language } from '../scripts/types/language.js';

const ALL_LANGS: readonly Language[] = [
  'en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl',
  'ar', 'he', 'ja', 'ko', 'zh',
];
const FAMILIES: readonly StaticPageFamily[] = ['home', 'dashboard', 'politician'];

// Reproduction of the German politician-dashboard `<head>` shape (as
// shipped pre-fix) — just enough to drive the enhancer without spinning
// up the full file.
const SAMPLE_HTML_DE_POLITICIAN = `<!DOCTYPE html>
<html lang="de">
<head>
<title>Politikerkarriere- und Produktivitätsanalyse | Riksdagsmonitor</title>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="canonical" href="https://riksdagsmonitor.com/politician-dashboard_de.html">
<meta name="description" content="Umfassende Analyse der 349 schwedischen Parlamentsabgeordneten.">
<meta name="keywords" content="politician analytics, MP productivity, career trajectory, riksdag politicians, Swedish parliament, legislative output, committee activity">
<meta property="og:title" content="Politikerkarriere- und Produktivitätsanalyse">
<meta property="og:description" content="Umfassende Analyse der 349 schwedischen Parlamentsabgeordneten.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://riksdagsmonitor.com/politician-dashboard_de.html">
<meta property="og:image" content="https://riksdagsmonitor.com/images/og-image.webp">
</head>
<body><h1>Politikerkarriere- und Produktivitätsanalyse</h1></body>
</html>`;

describe('buildStaticPageKeywords — per family × language matrix', () => {
  it.each(FAMILIES)('returns a 7-token native keyword string for every language (family=%s)', (family) => {
    for (const lang of ALL_LANGS) {
      const out = buildStaticPageKeywords(family, lang);
      const tokens = out.split(',').map((s) => s.trim()).filter(Boolean);
      expect(tokens.length).toBe(7);
    }
  });

  it('returns DISTINCT keyword strings across languages for the same family', () => {
    for (const family of FAMILIES) {
      const strings = new Set(ALL_LANGS.map((lang) => buildStaticPageKeywords(family, lang)));
      // 14 languages → at least 13 unique strings (English may match
      // English, but Swedish must not match German, etc.).
      expect(strings.size).toBeGreaterThanOrEqual(13);
    }
  });

  it('keeps the platform brand "Riksdagsmonitor" in every home-family entry (proper noun)', () => {
    // Only the `home` family carries the brand in its keyword list —
    // dashboard / politician keyword lists are functional (analytics,
    // productivity, voting patterns) and reference the Swedish
    // parliament directly rather than the brand. The brand is still
    // present in the `<title>` of every dashboard/politician page.
    for (const lang of ALL_LANGS) {
      expect(buildStaticPageKeywords('home', lang)).toContain('Riksdagsmonitor');
    }
  });

  it('keeps the acronym "OSINT" in every home-family entry (international term)', () => {
    for (const lang of ALL_LANGS) {
      expect(buildStaticPageKeywords('home', lang)).toContain('OSINT');
    }
  });

  it('uses native vocabulary for German (no English leakage)', () => {
    const en = buildStaticPageKeywords('politician', 'en');
    const de = buildStaticPageKeywords('politician', 'de');
    expect(de).not.toBe(en);
    expect(de).toContain('Politikeranalyse');
    expect(de).toContain('schwedisches Parlament');
    expect(de).not.toContain('MP productivity');
    expect(de).not.toContain('career trajectory');
  });

  it('uses native vocabulary for Arabic (no English leakage; RTL script)', () => {
    const ar = buildStaticPageKeywords('politician', 'ar');
    expect(ar).toContain('تحليلات السياسيين');
    expect(ar).toContain('البرلمان السويدي');
    expect(ar).not.toContain('MP productivity');
  });

  it('uses native vocabulary for Japanese (CJK script)', () => {
    const ja = buildStaticPageKeywords('politician', 'ja');
    expect(ja).toContain('政治家分析');
    expect(ja).toContain('スウェーデン議会');
    expect(ja).not.toContain('MP productivity');
  });
});

describe('buildStaticPageOgLocaleBlock', () => {
  it('emits one og:locale for the page and 13 og:locale:alternate siblings', () => {
    const out = buildStaticPageOgLocaleBlock('de');
    const localeCount = (out.match(/og:locale"/g) ?? []).length;
    const alternateCount = (out.match(/og:locale:alternate/g) ?? []).length;
    expect(localeCount).toBe(1);
    expect(alternateCount).toBe(13);
  });

  it('uses the canonical territory code for each language', () => {
    expect(buildStaticPageOgLocaleBlock('de')).toContain('content="de_DE"');
    expect(buildStaticPageOgLocaleBlock('sv')).toContain('content="sv_SE"');
    expect(buildStaticPageOgLocaleBlock('ar')).toContain('content="ar_SA"');
    expect(buildStaticPageOgLocaleBlock('he')).toContain('content="he_IL"');
    expect(buildStaticPageOgLocaleBlock('ja')).toContain('content="ja_JP"');
    expect(buildStaticPageOgLocaleBlock('zh')).toContain('content="zh_CN"');
  });

  it('uses nb_NO for Norwegian (BCP-47 convention)', () => {
    expect(buildStaticPageOgLocaleBlock('no')).toContain('property="og:locale" content="nb_NO"');
  });
});

describe('buildStaticPageTwitterCardBlock', () => {
  it('emits a complete summary_large_image Twitter Card', () => {
    const out = buildStaticPageTwitterCardBlock({
      title: 'Politikerkarriere- und Produktivitätsanalyse',
      description: 'Umfassende Analyse.',
      canonicalUrl: 'https://riksdagsmonitor.com/politician-dashboard_de.html',
      imageUrl: 'https://riksdagsmonitor.com/images/og-image.webp',
    });
    expect(out).toContain('twitter:card" content="summary_large_image"');
    expect(out).toContain('twitter:title" content="Politikerkarriere- und Produktivitätsanalyse"');
    expect(out).toContain('twitter:description" content="Umfassende Analyse."');
    expect(out).toContain('twitter:image" content="https://riksdagsmonitor.com/images/og-image.webp"');
    expect(out).toContain('twitter:site" content="@riksdagsmonitor"');
    expect(out).toContain('twitter:creator" content="@jamessorling"');
  });

  it('HTML-escapes special characters in title / description', () => {
    const out = buildStaticPageTwitterCardBlock({
      title: 'Quote "inside" & angle <bracket>',
      description: "Apostrophe's matter",
      canonicalUrl: 'https://riksdagsmonitor.com/',
      imageUrl: 'https://riksdagsmonitor.com/x.webp',
    });
    expect(out).toContain('&quot;inside&quot;');
    expect(out).toContain('&amp;');
    expect(out).toContain('&lt;bracket&gt;');
    expect(out).toContain('Apostrophe&#39;s');
    expect(out).not.toContain('Apostrophe\'s');
  });
});

describe('buildStaticPageJsonLd', () => {
  it('emits a WebSite + Organization + WebPage graph with Speakable for h1', () => {
    const out = buildStaticPageJsonLd({
      title: 'Politikerkarriere- und Produktivitätsanalyse',
      description: 'Umfassende Analyse.',
      canonicalUrl: 'https://riksdagsmonitor.com/politician-dashboard_de.html',
      lang: 'de',
      family: 'politician',
    });
    expect(out).toContain('<script type="application/ld+json">');
    // Parse the JSON to verify shape
    const jsonText = out.replace(/^<script[^>]*>\s*/, '').replace(/\s*<\/script>$/, '');
    const parsed = JSON.parse(jsonText);
    expect(parsed['@context']).toBe('https://schema.org');
    const types = parsed['@graph'].map((node: { '@type': string }) => node['@type']);
    expect(types).toContain('WebSite');
    expect(types).toContain('Organization');
    expect(types).toContain('WebPage');
    const webPage = parsed['@graph'].find(
      (node: { '@type': string }) => node['@type'] === 'WebPage',
    );
    expect(webPage.inLanguage).toBe('de');
    expect(webPage.speakable.cssSelector).toEqual(['h1']);
    expect(webPage.about.name).toContain('Politiker');
  });

  it('uses `nb` for Norwegian inLanguage (BCP-47)', () => {
    const out = buildStaticPageJsonLd({
      title: 'X',
      description: 'Y',
      canonicalUrl: 'https://riksdagsmonitor.com/index_no.html',
      lang: 'no',
      family: 'home',
    });
    const jsonText = out.replace(/^<script[^>]*>\s*/, '').replace(/\s*<\/script>$/, '');
    const parsed = JSON.parse(jsonText);
    const webPage = parsed['@graph'].find(
      (node: { '@type': string }) => node['@type'] === 'WebPage',
    );
    expect(webPage.inLanguage).toBe('nb');
  });

  it('emits a BreadcrumbList node with two items for dashboard / politician families', () => {
    const out = buildStaticPageJsonLd({
      title: 'Politikerkarriere',
      description: 'Y',
      canonicalUrl: 'https://riksdagsmonitor.com/politician-dashboard_de.html',
      lang: 'de',
      family: 'politician',
    });
    const jsonText = out.replace(/^<script[^>]*>\s*/, '').replace(/\s*<\/script>$/, '');
    const parsed = JSON.parse(jsonText);
    const breadcrumb = parsed['@graph'].find(
      (node: { '@type': string }) => node['@type'] === 'BreadcrumbList',
    );
    expect(breadcrumb).toBeDefined();
    expect(breadcrumb['@id']).toBe(
      'https://riksdagsmonitor.com/politician-dashboard_de.html#breadcrumb',
    );
    expect(breadcrumb.itemListElement).toHaveLength(2);
    expect(breadcrumb.itemListElement[0].position).toBe(1);
    expect(breadcrumb.itemListElement[0].name).toBe('Startseite');
    expect(breadcrumb.itemListElement[0].item).toBe(
      'https://riksdagsmonitor.com/index_de.html',
    );
    expect(breadcrumb.itemListElement[1].position).toBe(2);
    expect(breadcrumb.itemListElement[1].name).toBe('Politiker-Dashboard');
    expect(breadcrumb.itemListElement[1].item).toBe(
      'https://riksdagsmonitor.com/politician-dashboard_de.html',
    );
    // The WebPage node must reference the BreadcrumbList by @id so the
    // graph is connected (Google rich-results pattern).
    const webPage = parsed['@graph'].find(
      (node: { '@type': string }) => node['@type'] === 'WebPage',
    );
    expect(webPage.breadcrumb).toEqual({
      '@id': 'https://riksdagsmonitor.com/politician-dashboard_de.html#breadcrumb',
    });
  });

  it('emits a single-item BreadcrumbList for the home family (EN home URL)', () => {
    const out = buildStaticPageJsonLd({
      title: 'Riksdagsmonitor',
      description: 'Z',
      canonicalUrl: 'https://riksdagsmonitor.com/',
      lang: 'en',
      family: 'home',
    });
    const jsonText = out.replace(/^<script[^>]*>\s*/, '').replace(/\s*<\/script>$/, '');
    const parsed = JSON.parse(jsonText);
    const breadcrumb = parsed['@graph'].find(
      (node: { '@type': string }) => node['@type'] === 'BreadcrumbList',
    );
    expect(breadcrumb.itemListElement).toHaveLength(1);
    expect(breadcrumb.itemListElement[0].name).toBe('Home');
    expect(breadcrumb.itemListElement[0].item).toBe('https://riksdagsmonitor.com/');
  });

  it('localises BreadcrumbList Home label per language (ar / ja / zh)', () => {
    const cases: ReadonlyArray<readonly [Language, string]> = [
      ['ar', 'الرئيسية'],
      ['ja', 'ホーム'],
      ['zh', '首页'],
    ];
    for (const [lang, expected] of cases) {
      const out = buildStaticPageJsonLd({
        title: 't', description: 'd',
        canonicalUrl: `https://riksdagsmonitor.com/dashboard/index_${lang}.html`,
        lang, family: 'dashboard',
      });
      const jsonText = out.replace(/^<script[^>]*>\s*/, '').replace(/\s*<\/script>$/, '');
      const parsed = JSON.parse(jsonText);
      const breadcrumb = parsed['@graph'].find(
        (n: { '@type': string }) => n['@type'] === 'BreadcrumbList',
      );
      expect(breadcrumb.itemListElement[0].name).toBe(expected);
    }
  });
});

describe('enhanceStaticPageHead — integration (DE politician-dashboard)', () => {
  const enhanced = enhanceStaticPageHead({
    html: SAMPLE_HTML_DE_POLITICIAN,
    lang: 'de',
    family: 'politician',
  });

  it('replaces the EN keyword string with native German keywords', () => {
    expect(enhanced).not.toContain('politician analytics, MP productivity');
    expect(enhanced).toContain('Politikeranalyse');
    expect(enhanced).toContain('schwedisches Parlament');
  });

  it('emits a full og:locale matrix (de_DE primary, 13 alternates)', () => {
    expect(enhanced).toContain('<meta property="og:locale" content="de_DE">');
    expect(enhanced).toContain('content="en_US"');
    expect(enhanced).toContain('content="sv_SE"');
    expect(enhanced).toContain('content="ar_SA"');
    expect(enhanced).toContain('content="ja_JP"');
  });

  it('adds the Twitter Card block (was missing on politician-dashboard*)', () => {
    expect(enhanced).toContain('twitter:card" content="summary_large_image"');
    expect(enhanced).toContain('twitter:title" content="Politikerkarriere- und Produktivitätsanalyse');
    expect(enhanced).toContain('twitter:description" content="Umfassende Analyse');
  });

  it('adds the JSON-LD WebSite + WebPage + Speakable block', () => {
    expect(enhanced).toContain('<script type="application/ld+json">');
    expect(enhanced).toContain('"@type": "WebSite"');
    expect(enhanced).toContain('"@type": "WebPage"');
    expect(enhanced).toContain('"speakable"');
    expect(enhanced).toContain('"inLanguage": "de"');
  });

  it('preserves the original <title> and <meta name="description"> verbatim', () => {
    expect(enhanced).toContain('<title>Politikerkarriere- und Produktivitätsanalyse | Riksdagsmonitor</title>');
    expect(enhanced).toContain('Umfassende Analyse der 349 schwedischen Parlamentsabgeordneten.');
  });

  it('is idempotent — running twice yields the same output as once', () => {
    const once = enhanceStaticPageHead({
      html: SAMPLE_HTML_DE_POLITICIAN,
      lang: 'de',
      family: 'politician',
    });
    const twice = enhanceStaticPageHead({
      html: once,
      lang: 'de',
      family: 'politician',
    });
    expect(twice).toBe(once);
  });

  it('emits exactly one <meta name="keywords"> tag (no duplication on re-run)', () => {
    const matches = enhanced.match(/<meta\s+name=["']keywords["'][^>]*>/gi) ?? [];
    expect(matches.length).toBe(1);
  });

  it('emits exactly one og:locale primary tag', () => {
    const primary = enhanced.match(/<meta\s+property=["']og:locale["'][^>]*>/gi) ?? [];
    expect(primary.length).toBe(1);
  });

  it('emits exactly 13 og:locale:alternate tags', () => {
    const alternates = enhanced.match(/<meta\s+property=["']og:locale:alternate["'][^>]*>/gi) ?? [];
    expect(alternates.length).toBe(13);
  });
});

describe('enhanceStaticPageHead — every family × every language smoke test', () => {
  it.each(FAMILIES)('rewrites keywords for every language (family=%s)', (family) => {
    for (const lang of ALL_LANGS) {
      const langAttr = lang === 'en' ? '' : ` lang="${lang}"`;
      const html = `<!DOCTYPE html>
<html${langAttr}>
<head>
<title>Test page</title>
<meta name="description" content="Test description">
<link rel="canonical" href="https://riksdagsmonitor.com/test.html">
<meta name="keywords" content="seed">
<meta property="og:image" content="https://riksdagsmonitor.com/x.webp">
</head>
<body><h1>Test</h1></body>
</html>`;
      const enhanced = enhanceStaticPageHead({ html, lang, family });
      // Localized keyword string must be present
      expect(enhanced).toContain(buildStaticPageKeywords(family, lang));
      // Original seed must be gone
      expect(enhanced).not.toContain('content="seed"');
      // Twitter Card present
      expect(enhanced).toMatch(/twitter:card"\s+content="summary_large_image"/);
      // JSON-LD present
      expect(enhanced).toContain('<script type="application/ld+json">');
    }
  });
});
