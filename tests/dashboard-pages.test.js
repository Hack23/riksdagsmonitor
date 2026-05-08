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
