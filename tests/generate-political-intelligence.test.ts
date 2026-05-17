/**
 * Unit Tests for Political Intelligence HTML Generation
 *
 * Verifies that political-intelligence_{lang}.html files are generated for all
 * 14 languages with correct meta data, catalog content, daily-artifacts structure,
 * SEO tags, hreflang alternates, and structured data.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
const rootDir: string = path.join(__dirname, '..');

interface PiModule {
  readonly generatePoliticalIntelligenceHtml: (lang: string) => string;
  readonly collectCatalog: (
    dir: string,
    relativePrefix: string,
    metaMap: Record<string, { icon: string; description: string }>,
  ) => Array<{ file: string; title: string; icon: string; description: string; githubUrl: string }>;
  readonly collectDailyDays: () => Array<{ date: string; githubUrl: string; streams: Array<{ name: string; githubUrl: string; artifactCount: number }>; totalArtifacts: number }>;
  readonly METHODOLOGY_META: Record<string, { icon: string; description: string }>;
  readonly TEMPLATE_META: Record<string, { icon: string; description: string }>;
  readonly PI_TRANSLATIONS: Record<string, { title: string; subtitle: string; intro: string }>;
}

const LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'] as const;
const RTL_LANGUAGES = new Set(['ar', 'he']);

describe('Political Intelligence HTML Generation', () => {
  let mod: PiModule;

  beforeAll(async () => {
    mod = (await import('../scripts/generate-political-intelligence.js')) as unknown as PiModule;
  });

  describe('Data collection', () => {
    it('collects methodology catalog with all expected entries', () => {
      const entries = mod.collectCatalog(
        path.join(rootDir, 'analysis', 'methodologies'),
        'analysis/methodologies',
        mod.METHODOLOGY_META,
      );
      expect(entries.length).toBeGreaterThan(10);
      const files = entries.map((e) => e.file);
      expect(files).toContain('ai-driven-analysis-guide.md');
      expect(files).toContain('political-risk-methodology.md');
      // every entry must link to GitHub
      for (const e of entries) {
        expect(e.githubUrl).toMatch(/^https:\/\/github\.com\/Hack23\/riksdagsmonitor\/blob\/main\/analysis\/methodologies\//);
        expect(e.icon.length).toBeGreaterThan(0);
        expect(e.description.length).toBeGreaterThan(10);
      }
    });

    it('collects template catalog with all expected entries', () => {
      const entries = mod.collectCatalog(
        path.join(rootDir, 'analysis', 'templates'),
        'analysis/templates',
        mod.TEMPLATE_META,
      );
      expect(entries.length).toBeGreaterThan(10);
      const files = entries.map((e) => e.file);
      expect(files).toContain('synthesis-summary.md');
      expect(files).toContain('threat-analysis.md');
    });

    it('collects daily artifacts grouped by date (newest first)', () => {
      const days = mod.collectDailyDays();
      expect(days.length).toBeGreaterThan(0);
      // Newest first ordering
      for (let i = 1; i < days.length; i++) {
        expect(days[i - 1].date >= days[i].date).toBe(true);
      }
      // Every day has at least one stream and totalArtifacts consistent
      for (const d of days) {
        expect(/^\d{4}-\d{2}-\d{2}$/.test(d.date)).toBe(true);
        expect(d.githubUrl).toContain(`analysis/daily/${d.date}`);
        const sum = d.streams.reduce((a, s) => a + s.artifactCount, 0);
        expect(sum).toBe(d.totalArtifacts);
      }
    });
  });

  describe('HTML generation (per language)', () => {
    for (const lang of LANGUAGES) {
      describe(lang, () => {
        let html: string;
        beforeAll(() => {
          html = mod.generatePoliticalIntelligenceHtml(lang);
        });

        it('declares DOCTYPE and html lang/dir', () => {
          expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
          if (RTL_LANGUAGES.has(lang)) {
            expect(html).toContain('dir="rtl"');
          } else {
            expect(html).toContain('dir="ltr"');
          }
        });

        it('contains canonical and hreflang alternates for every language', () => {
          expect(html).toContain('<link rel="canonical"');
          // x-default alternate
          expect(html).toMatch(/hreflang="x-default"/);
          // all 14 hreflangs
          for (const l of LANGUAGES) {
            const expected = l === 'no' ? 'nb' : l;
            expect(html).toContain(`hreflang="${expected}"`);
          }
        });

        it('includes Open Graph, Twitter Card, and JSON-LD structured data', () => {
          expect(html).toContain('property="og:title"');
          expect(html).toContain('property="og:url"');
          expect(html).toContain('name="twitter:card"');
          // Unified chrome embeds JSON-LD via `JSON.stringify(blob)` (no
          // pretty-print), so `@type` keys have no space after the colon.
          expect(html).toContain('"@type":"CollectionPage"');
          expect(html).toContain('"@type":"BreadcrumbList"');
          // Parity with article + sitemap + news-index renderers.
          expect(html).toContain('"@type":"Organization"');
          expect(html).toContain('"@type":"WebSite"');
        });

        it('includes methodology, template, and daily sections', () => {
          expect(html).toContain('id="methodologies"');
          expect(html).toContain('id="templates"');
          expect(html).toContain('id="daily"');
        });

        it('links methodology and template entries to GitHub', () => {
          expect(html).toContain('github.com/Hack23/riksdagsmonitor/blob/main/analysis/methodologies/ai-driven-analysis-guide.md');
          expect(html).toContain('github.com/Hack23/riksdagsmonitor/tree/main/analysis/methodologies');
          expect(html).toContain('github.com/Hack23/riksdagsmonitor/tree/main/analysis/templates');
          expect(html).toContain('github.com/Hack23/riksdagsmonitor/tree/main/analysis/daily');
        });

        it('links back to home, sitemap, and other-language versions', () => {
          const indexFile = lang === 'en' ? 'index.html' : `index_${lang}.html`;
          const sitemapFile = lang === 'en' ? 'sitemap.html' : `sitemap_${lang}.html`;
          expect(html).toContain(`/${indexFile}`);
          expect(html).toContain(`/${sitemapFile}`);
          // Other-language anchor tags
          for (const l of LANGUAGES) {
            if (l === lang) continue;
            const href = l === 'en' ? 'political-intelligence.html' : `political-intelligence_${l}.html`;
            expect(html).toContain(`href="${href}"`);
          }
        });

        it('renders a skip-link, semantic main, and ARIA-labelled TOC', () => {
          expect(html).toContain('class="skip-link"');
          // Unified chrome (render-lib/chrome.ts) targets `#main`.
          expect(html).toContain('href="#main"');
          expect(html).toContain('id="main"');
          expect(html).toContain('aria-label=');
        });

        it('uses the unified `rm-site-header` chrome with theme toggle', () => {
          expect(html).toContain('class="rm-site-header"');
          expect(html).toContain('id="theme-toggle"');
          expect(html).toContain('class="rm-theme-toggle"');
        });

        it('uses the unified 3-column `rm-site-footer`', () => {
          expect(html).toContain('class="rm-site-footer"');
          expect(html).toContain('class="rm-footer-col rm-footer-brand"');
          expect(html).toContain('class="rm-footer-col rm-footer-navigate"');
          expect(html).toContain('class="rm-footer-col rm-footer-trust"');
        });

        it('uses localized title and subtitle from PI_TRANSLATIONS', () => {
          const t = mod.PI_TRANSLATIONS[lang];
          expect(html).toContain(t.title);
          expect(html).toContain(t.subtitle);
        });
      });
    }
  });

  describe('Generated files', () => {
    const outDir = rootDir;
    for (const lang of LANGUAGES) {
      const fileName = lang === 'en' ? 'political-intelligence.html' : `political-intelligence_${lang}.html`;
      it(`writes ${fileName} on disk`, () => {
        const p = path.join(outDir, fileName);
        expect(fs.existsSync(p)).toBe(true);
        const content = fs.readFileSync(p, 'utf8');
        expect(content.length).toBeGreaterThan(5000);
        expect(content).toContain('<!DOCTYPE html>');
      });
    }
  });

  describe('SEO uplift: keywords + FAQ', () => {
    let html: string;
    beforeAll(() => {
      html = mod.generatePoliticalIntelligenceHtml('en');
    });

    it('aggregates keywords from methodology + template titles (capped at 30)', () => {
      const match = html.match(/name="keywords" content="([^"]+)"/);
      expect(match).not.toBeNull();
      const keywords = match![1]!.split(',').map((k) => k.trim());
      expect(keywords.length).toBeLessThanOrEqual(30);
      expect(keywords.length).toBeGreaterThan(5);
    });

    it('deduplicates keyword entries', () => {
      const match = html.match(/name="keywords" content="([^"]+)"/);
      const keywords = match![1]!.split(',').map((k) => k.trim());
      const unique = new Set(keywords);
      expect(unique.size).toBe(keywords.length);
    });

    it('does NOT leak English methodology/template titles into non-EN keywords (W3 regression)', () => {
      // Pre-W3-fix, non-EN PI pages mixed methodology filenames such as
      // `Admiralty Rubric`, `Calibration Ledger`, `README` into the
      // localized `<meta keywords>` — a clear English leak in
      // CJK / RTL / Latin-non-EN pages. After the fix the seed only
      // contains the localized terms from `PI_TRANSLATIONS[lang].metaKeywords`.
      for (const lang of ['sv', 'da', 'no', 'fi', 'nl', 'es', 'de', 'fr', 'ja', 'ar', 'zh', 'ko', 'he'] as const) {
        const localizedHtml = mod.generatePoliticalIntelligenceHtml(lang);
        const match = localizedHtml.match(/name="keywords" content="([^"]+)"/);
        expect(match, `missing keywords for ${lang}`).not.toBeNull();
        const kw = match![1]!;
        // Sample of English-only methodology titles that used to leak.
        for (const enLeak of [
          'Admiralty Rubric',
          'Calibration Ledger',
          'Reference Quality Thresholds',
          'Worldbank Indicator Mapping',
          'README',
        ]) {
          expect(
            kw,
            `non-EN PI page ${lang} keywords still contain English methodology title "${enLeak}": ${kw}`,
          ).not.toContain(enLeak);
        }
      }
    });

    it('keeps the EN methodology titles in the EN PI page (sanity check — no over-correction)', () => {
      // Catch the inverse regression: the W3 fix must NOT also strip the
      // English methodology titles from the English page itself. EN is
      // the source-of-truth surface and benefits from the augmented
      // keyword set for SEO.
      const enHtml = mod.generatePoliticalIntelligenceHtml('en');
      const match = enHtml.match(/name="keywords" content="([^"]+)"/);
      expect(match, 'missing keywords for en').not.toBeNull();
      const kw = match![1]!;
      // At least ONE of the catalog English methodology titles must
      // appear in the EN keyword set (the catalog can rename entries
      // over time, so we accept any of the historically-stable ones).
      const expectedEn = [
        'Admiralty Rubric',
        'Calibration Ledger',
        'Reference Quality Thresholds',
        'Worldbank Indicator Mapping',
      ];
      const matched = expectedEn.some((needle) => kw.includes(needle));
      expect(
        matched,
        `EN PI keywords lost all English methodology titles (regression?): ${kw}`,
      ).toBe(true);
    });


    it('emits a FAQPage JSON-LD block', () => {
      expect(html).toContain('"@type":"FAQPage"');
    });

    it('emits a visible FAQ section with localised heading', () => {
      expect(html).toContain('id="pi-faq-heading"');
      expect(html).toContain('Frequently Asked Questions');
      expect(html).toContain('<details class="pi-faq-item">');
    });

    it('localises the FAQ heading for non-English pages', () => {
      const svHtml = mod.generatePoliticalIntelligenceHtml('sv');
      expect(svHtml).toContain('Vanliga frågor');
    });
  });
});
