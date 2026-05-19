/**
 * Vitest unit tests — Specialised dashboard pages (PR #2349)
 *
 * Each of the 9 dashboards lives at /dashboards/<slug>{,_<lang>}.html for
 * 14 languages (126 pages total). This test suite asserts the structural,
 * SEO and accessibility contract of every generated page without requiring
 * a browser.
 *
 * What it covers, per page:
 *   - File exists and has plausible size (> 8 KB, < 80 KB)
 *   - <html lang> matches the language suffix (en/sv/da/nb/fi/de/fr/es/nl/ar/he/ja/ko/zh)
 *   - RTL pages (ar, he) carry dir="rtl"
 *   - Canonical URL points at the correct slug + language
 *   - hreflang chain has all 14 languages + x-default and uses "nb" for Norwegian
 *   - Open Graph + Twitter Card meta tags present
 *   - JSON-LD @graph parses and contains a BreadcrumbList
 *   - Dashboard container ID (e.g. #party-dashboard) is present
 *   - "Back to home" navigation present
 *   - Related-dashboards <aside> links to the other 8 dashboards (and
 *     never to itself)
 *   - No double-escaped HTML entities (&amp;amp;, &amp;lt; …) — regression
 *     guard for the build-script bug fixed in this commit
 *
 * Plus index.html / index_<lang>.html hub guards:
 *   - #political-intelligence-dashboards section exists
 *   - Hub links to every dashboard slug in the matching language
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const DASHBOARDS = [
  { slug: 'parties',            id: 'party-dashboard' },
  { slug: 'election-cycle',     id: 'election-cycle-dashboard' },
  { slug: 'committees',         id: 'committee-dashboard' },
  { slug: 'coalitions',         id: 'coalition-dashboard' },
  { slug: 'seasonal-patterns',  id: 'seasonal-patterns-dashboard' },
  { slug: 'pre-election',       id: 'pre-election-dashboard' },
  { slug: 'anomaly-detection',  id: 'anomaly-detection-dashboard' },
  { slug: 'ministers',          id: 'ministry-dashboard' },
  { slug: 'risk',               id: 'risk-dashboard' },
];

// langSuffix → BCP-47 hreflang code (Norwegian uses 'nb' per repo i18n convention)
const LANGUAGES = [
  { suffix: '',     hreflang: 'en', dir: 'ltr' },
  { suffix: '_sv',  hreflang: 'sv', dir: 'ltr' },
  { suffix: '_da',  hreflang: 'da', dir: 'ltr' },
  { suffix: '_no',  hreflang: 'nb', dir: 'ltr' },
  { suffix: '_fi',  hreflang: 'fi', dir: 'ltr' },
  { suffix: '_de',  hreflang: 'de', dir: 'ltr' },
  { suffix: '_fr',  hreflang: 'fr', dir: 'ltr' },
  { suffix: '_es',  hreflang: 'es', dir: 'ltr' },
  { suffix: '_nl',  hreflang: 'nl', dir: 'ltr' },
  { suffix: '_ar',  hreflang: 'ar', dir: 'rtl' },
  { suffix: '_he',  hreflang: 'he', dir: 'rtl' },
  { suffix: '_ja',  hreflang: 'ja', dir: 'ltr' },
  { suffix: '_ko',  hreflang: 'ko', dir: 'ltr' },
  { suffix: '_zh',  hreflang: 'zh', dir: 'ltr' },
];

const ROOT = process.cwd();
const readPage = (relPath) => readFileSync(resolve(ROOT, relPath), 'utf-8');

describe('Specialised dashboard pages — structural contract', () => {
  describe.each(DASHBOARDS)('$slug', ({ slug, id }) => {
    describe.each(LANGUAGES)('$hreflang variant', ({ suffix, hreflang, dir }) => {
      const filename = `dashboards/${slug}${suffix}.html`;
      let html;

      it('file exists', () => {
        expect(existsSync(resolve(ROOT, filename)), `Missing: ${filename}`).toBe(true);
        html = readPage(filename);
      });

      it('plausible size (8 KB – 80 KB)', () => {
        html ||= readPage(filename);
        expect(html.length).toBeGreaterThan(8 * 1024);
        expect(html.length).toBeLessThan(80 * 1024);
      });

      it(`<html lang> attribute matches BCP-47 ${hreflang}`, () => {
        html ||= readPage(filename);
        // Norwegian dashboard pages emit lang="nb" (BCP-47), matching hreflang
        expect(html).toMatch(new RegExp(`<html\\s+lang="${hreflang}"`));
      });

      it(`dir attribute is ${dir}`, () => {
        html ||= readPage(filename);
        if (dir === 'rtl') {
          expect(html).toMatch(/<html[^>]*\sdir="rtl"/);
        } else {
          expect(html).toMatch(/<html[^>]*\sdir="ltr"/);
        }
      });

      it('canonical link points at the correct slug + language', () => {
        html ||= readPage(filename);
        const expectedCanonical =
          `https://riksdagsmonitor.com/dashboards/${slug}${suffix}.html`;
        expect(html).toContain(`<link rel="canonical" href="${expectedCanonical}">`);
      });

      it('hreflang chain has all 14 langs + x-default with "nb" for Norwegian', () => {
        html ||= readPage(filename);
        for (const lang of LANGUAGES) {
          const expectedUrl =
            `https://riksdagsmonitor.com/dashboards/${slug}${lang.suffix}.html`;
          expect(html).toContain(
            `<link rel="alternate" hreflang="${lang.hreflang}" href="${expectedUrl}">`,
          );
        }
        expect(html).toContain(
          `<link rel="alternate" hreflang="x-default" href="https://riksdagsmonitor.com/dashboards/${slug}.html">`,
        );
        // Regression guard: never emit hreflang="no" — must be BCP-47 "nb"
        expect(html).not.toMatch(/hreflang="no"/);
      });

      it('Open Graph + Twitter Card meta present', () => {
        html ||= readPage(filename);
        expect(html).toMatch(/<meta property="og:type"\s+content="website">/);
        expect(html).toMatch(/<meta property="og:title"/);
        expect(html).toMatch(/<meta property="og:url"\s+content="https:\/\/riksdagsmonitor\.com\/dashboards\//);
        expect(html).toMatch(/<meta name="twitter:card"\s+content="summary_large_image">/);
      });

      it('JSON-LD @graph parses and contains a BreadcrumbList', () => {
        html ||= readPage(filename);
        const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
        expect(m, 'JSON-LD <script> block missing').toBeTruthy();
        let parsed;
        expect(() => { parsed = JSON.parse(m[1]); }).not.toThrow();
        const graph = parsed['@graph'] || [parsed];
        const breadcrumb = graph.find(node => node['@type'] === 'BreadcrumbList');
        expect(breadcrumb, 'BreadcrumbList missing from JSON-LD @graph').toBeTruthy();
        expect(Array.isArray(breadcrumb.itemListElement)).toBe(true);
        expect(breadcrumb.itemListElement.length).toBeGreaterThanOrEqual(2);
      });

      it(`exposes container #${id}`, () => {
        html ||= readPage(filename);
        expect(html).toContain(`id="${id}"`);
      });

      it('has back-to-home navigation', () => {
        html ||= readPage(filename);
        expect(html).toMatch(/<nav class="dashboard-page-back"[^>]*>[\s\S]*?<a[^>]+class="back-link"[^>]*>/);
      });

      it('related-dashboards <aside> links to the other 8 dashboards (and not itself)', () => {
        html ||= readPage(filename);
        const aside = html.match(/<aside class="dashboard-related"[\s\S]*?<\/aside>/);
        expect(aside, 'related-dashboards <aside> missing').toBeTruthy();
        const asideHtml = aside[0];

        for (const other of DASHBOARDS) {
          if (other.slug === slug) {
            // Self must NOT appear in related list
            expect(asideHtml).not.toContain(`data-rm-dashboard-slug="${other.slug}"`);
          } else {
            expect(asideHtml).toContain(`data-rm-dashboard-slug="${other.slug}"`);
            const expectedHref =
              suffix === '' ? `${other.slug}.html` : `${other.slug}${suffix}.html`;
            expect(asideHtml).toContain(`href="${expectedHref}"`);
          }
        }
      });

      it('no double-escaped HTML entities (&amp;amp; / &amp;lt; …)', () => {
        html ||= readPage(filename);
        // Regression guard for build-dashboard-pages.py first_h2_text/_html_safe bug
        expect(html, `double-escape detected in ${filename}`).not.toMatch(/&amp;(amp|lt|gt|quot|apos|#\d+);/);
      });

      // Regression guard: every dashboard page MUST carry the
      // theme-toggle + back-to-top + mermaid bootstrap inject block
      // that index.html ships. The toggle button is in the header on
      // every page, but without /js/theme-toggle.js the click handler
      // is never attached and dark/light mode switching is dead.
      // Previously these pages only had the main entry script, so
      // dark-mode switching silently failed.
      it('ships /js/theme-toggle.js + /js/back-to-top.js + /js/lib/mermaid-init.mjs bootstrap', () => {
        html ||= readPage(filename);
        expect(html, `${filename} missing /js/theme-toggle.js bootstrap`).toContain('/js/theme-toggle.js');
        expect(html, `${filename} missing /js/back-to-top.js bootstrap`).toContain('/js/back-to-top.js');
        expect(html, `${filename} missing /js/lib/mermaid-init.mjs bootstrap`).toContain('/js/lib/mermaid-init.mjs');
        // The bootstrap must be the documented imperative-inject IIFE
        // (so Vite's HTML transformer does not try to bundle the
        // referenced modules). Anchor on the IIFE entry-point and the
        // three inject() calls in that order.
        expect(html, `${filename} bootstrap is missing the inject() IIFE wrapper`).toMatch(
          /function inject\(src,\s*isModule\)/,
        );
        expect(html, `${filename} bootstrap inject() calls missing/reordered`).toMatch(
          /(?:if \(document\.querySelector\((["'])pre\.mermaid\1\)\) )?inject\((["'])\/js\/lib\/mermaid-init\.mjs\2,\s*true\);\s*inject\((["'])\/js\/back-to-top\.js\3,\s*true\);\s*inject\((["'])\/js\/theme-toggle\.js\4,\s*false\);/s,
        );
      });
    });
  });
});

// ---------------------------------------------------------------------------
// W5 regression — non-EN dashboard hubs must not include the English topic
// seed terms in <meta keywords> and JSON-LD Dataset.keywords.
//
// Pre-W5-fix, every dashboard's English `keywords_en` string (e.g.
// "election cycle, Swedish elections, performance timeline, decision
// effectiveness, risk forecasting" for the election-cycle dashboard) was
// concatenated onto every non-EN page's keyword set. That polluted CJK /
// RTL / Latin-non-EN dashboards with raw English seo terms.
//
// After the W5 fix the EN page keeps the topic seed (it is the
// source-of-truth keyword surface) but the 13 non-EN pages must not
// contain any of the EN topic seed terms. We pick the longest, most
// distinctive English fragments from each dashboard so a false negative
// is statistically impossible.
// ---------------------------------------------------------------------------
const W5_EN_TOPIC_LEAK_FRAGMENTS = [
  // election-cycle
  ['election-cycle', 'election cycle'],
  ['election-cycle', 'Swedish elections'],
  ['election-cycle', 'performance timeline'],
  // parties
  ['parties', 'party performance'],
  ['parties', 'coalition alignment'],
  ['parties', 'momentum indicators'],
  // committees
  ['committees', 'committee performance'],
  ['committees', 'productivity heatmap'],
  ['committees', 'decision effectiveness'],
  // coalitions
  ['coalitions', 'coalition analysis'],
  ['coalitions', 'voting patterns'],
  ['coalitions', 'Tidö agreement'],
  // seasonal-patterns
  ['seasonal-patterns', 'seasonal patterns'],
  ['seasonal-patterns', 'quarterly activity'],
  ['seasonal-patterns', 'parliamentary calendar'],
  // pre-election
  ['pre-election', 'pre-election monitoring'],
  ['pre-election', 'early warning'],
  ['pre-election', 'baseline deviation'],
  // anomaly-detection
  ['anomaly-detection', 'anomaly detection'],
  ['anomaly-detection', 'severity heatmap'],
  ['anomaly-detection', 'behavioral anomalies'],
  // ministers
  ['ministers', 'government ministers'],
  ['ministers', 'minister risk'],
  ['ministers', 'influence rankings'],
  // risk
  ['risk', '45 risk rules'],
  ['risk', 'MP risk scoring'],
  ['risk', 'parliamentary risk analytics'],
];

// Non-EN language suffixes only — EN keeps its topic seed intentionally.
const NON_EN_LANGUAGES = LANGUAGES.filter((l) => l.suffix !== '');

describe('W5 — dashboard hubs do not leak English topic keywords into non-EN pages', () => {
  describe.each(DASHBOARDS)('$slug', ({ slug }) => {
    describe.each(NON_EN_LANGUAGES)('$hreflang variant', ({ suffix }) => {
      const filename = `dashboards/${slug}${suffix}.html`;
      let html;

      it('loads', () => {
        html = readPage(filename);
        expect(html.length).toBeGreaterThan(8 * 1024);
      });

      it('<meta name="keywords"> contains no English topic seed fragments for this dashboard', () => {
        const match = html.match(/<meta\s+name="keywords"\s+content="([^"]+)"/i);
        expect(match, `${filename} missing <meta keywords>`).not.toBeNull();
        const kw = match[1];
        const expectedLeaks = W5_EN_TOPIC_LEAK_FRAGMENTS
          .filter(([dashSlug]) => dashSlug === slug)
          .map(([, fragment]) => fragment);
        for (const fragment of expectedLeaks) {
          expect(
            kw.toLowerCase(),
            `${filename} <meta keywords> still contains English topic seed "${fragment}": ${kw}`,
          ).not.toContain(fragment.toLowerCase());
        }
      });

      it('JSON-LD Dataset.keywords contains no English topic seed fragments for this dashboard', () => {
        // The dashboard JSON-LD graph embeds a Dataset node whose
        // `keywords` string is built from the same source as the
        // <meta keywords> tag; assert it is also free of the EN seed.
        const datasetKwMatch = html.match(/"@type"\s*:\s*"Dataset"[\s\S]*?"keywords"\s*:\s*"([^"]+)"/);
        // Some dashboards may not embed a Dataset node — skip gracefully
        // (the structural test above already enforced the @graph contract).
        if (!datasetKwMatch) return;
        const datasetKw = datasetKwMatch[1].toLowerCase();
        const expectedLeaks = W5_EN_TOPIC_LEAK_FRAGMENTS
          .filter(([dashSlug]) => dashSlug === slug)
          .map(([, fragment]) => fragment);
        for (const fragment of expectedLeaks) {
          expect(
            datasetKw,
            `${filename} Dataset.keywords still contains English topic seed "${fragment}": ${datasetKwMatch[1]}`,
          ).not.toContain(fragment.toLowerCase());
        }
      });
    });
  });
});

// ---------------------------------------------------------------------------
// W5 EN sanity guard — the English dashboard page MUST keep its topic
// seed (the W5 fix is non-EN-only; over-correction would regress EN SEO).
// ---------------------------------------------------------------------------
describe('W5 — EN dashboard pages preserve their English topic seed (no over-correction)', () => {
  describe.each(DASHBOARDS)('$slug', ({ slug }) => {
    const filename = `dashboards/${slug}.html`;
    let html;

    it('<meta name="keywords"> still contains at least one English topic seed fragment', () => {
      html = readPage(filename);
      const match = html.match(/<meta\s+name="keywords"\s+content="([^"]+)"/i);
      expect(match, `${filename} missing <meta keywords>`).not.toBeNull();
      const kw = match[1].toLowerCase();
      const expectedSeeds = W5_EN_TOPIC_LEAK_FRAGMENTS
        .filter(([dashSlug]) => dashSlug === slug)
        .map(([, fragment]) => fragment);
      const matched = expectedSeeds.some((fragment) => kw.includes(fragment.toLowerCase()));
      expect(
        matched,
        `${filename} EN page lost all topic seed fragments — keywords: ${match[1]}`,
      ).toBe(true);
    });
  });
});

describe('index*.html hub — political-intelligence-dashboards section', () => {
  describe.each(LANGUAGES)('$hreflang variant', ({ suffix }) => {
    const filename = suffix === '' ? 'index.html' : `index${suffix}.html`;
    let html;

    it('hub section exists', () => {
      html = readPage(filename);
      expect(html).toContain('id="political-intelligence-dashboards"');
    });

    it('hub links to every dashboard in the matching language', () => {
      html ||= readPage(filename);
      // Extract just the hub section to scope the assertion
      const hubMatch = html.match(/id="political-intelligence-dashboards"[\s\S]*?<\/section>/);
      expect(hubMatch, 'hub section markup missing').toBeTruthy();
      const hub = hubMatch[0];

      for (const { slug } of DASHBOARDS) {
        const expectedHref =
          suffix === '' ? `dashboards/${slug}.html` : `dashboards/${slug}${suffix}.html`;
        expect(hub, `hub missing link to ${expectedHref}`).toContain(`href="${expectedHref}"`);
        expect(hub).toContain(`data-rm-dashboard-slug="${slug}"`);
      }
    });
  });
});

describe('sitemap source — dashboard page registration', () => {
  // The sitemap.xml is generated dynamically at build time (not committed
  // to the tree). Instead we assert that the TypeScript source registers
  // every dashboard slug so the generator cannot regress silently.
  it('scripts/sitemap-xml/render/sitemap.ts registers all 9 dashboard slugs', () => {
    const source = readPage('scripts/sitemap-xml/render/sitemap.ts');
    for (const { slug } of DASHBOARDS) {
      expect(source, `sitemap.ts missing slug "${slug}"`).toContain(`'${slug}'`);
    }
    // Sanity: the registration block uses the dashboards/<slug>.html pattern
    expect(source).toMatch(/dashboards\/\$\{slug\}\.html/);
  });
});
