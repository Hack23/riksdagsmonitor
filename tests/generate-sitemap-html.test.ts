/**
 * Unit Tests for Sitemap HTML Generation
 * Tests the auto-generation of localized sitemap HTML pages.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
const rootDir: string = path.join(__dirname, '..');

/** Shape of the generate-sitemap-html module */
interface GenerateSitemapHtmlModule {
  readonly generateSitemapHtml: (lang: string, articlesByLang: Map<string, Array<{ file: string; title: string; description: string; lang: string; baseSlug: string }>>) => string;
  readonly getArticlesByLanguage: () => Map<string, Array<{ file: string; title: string; description: string; lang: string; baseSlug: string }>>;
  readonly escapeHtml: (text: string) => string;
  readonly LANGUAGE_META: Record<string, { name: string; nativeName: string; dir: string; hreflang: string }>;
}

describe('Sitemap HTML Generation', () => {
  let module: GenerateSitemapHtmlModule;

  beforeAll(async () => {
    const originalExit = process.exit;
    const originalWriteFileSync = fs.writeFileSync;
    process.exit = vi.fn() as unknown as typeof process.exit;
    fs.writeFileSync = vi.fn() as unknown as typeof fs.writeFileSync;

    module = await import('../scripts/generate-sitemap-html.js') as unknown as GenerateSitemapHtmlModule;

    process.exit = originalExit;
    fs.writeFileSync = originalWriteFileSync;
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(module.escapeHtml('<script>')).toBe('&lt;script&gt;');
      expect(module.escapeHtml('"quotes"')).toBe('&quot;quotes&quot;');
      expect(module.escapeHtml("it's")).toBe('it&#039;s');
      expect(module.escapeHtml('a & b')).toBe('a &amp; b');
    });

    it('should handle plain text without changes', () => {
      expect(module.escapeHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('LANGUAGE_META', () => {
    it('should have metadata for all 14 languages', () => {
      const languages = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      languages.forEach(lang => {
        expect(module.LANGUAGE_META[lang], `Missing metadata for ${lang}`).toBeDefined();
        expect(module.LANGUAGE_META[lang]!.name).toBeTruthy();
        expect(module.LANGUAGE_META[lang]!.nativeName).toBeTruthy();
      });
    });

    it('should have RTL direction for Arabic and Hebrew', () => {
      expect(module.LANGUAGE_META['ar']!.dir).toBe('rtl');
      expect(module.LANGUAGE_META['he']!.dir).toBe('rtl');
    });

    it('should have LTR direction for other languages', () => {
      const ltrLangs = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ja', 'ko', 'zh'];
      ltrLangs.forEach(lang => {
        expect(module.LANGUAGE_META[lang]!.dir).toBe('ltr');
      });
    });

    it('should use nb hreflang for Norwegian', () => {
      expect(module.LANGUAGE_META['no']!.hreflang).toBe('nb');
    });
  });

  describe('getArticlesByLanguage', () => {
    it('should return articles grouped by language', () => {
      const articlesByLang = module.getArticlesByLanguage();
      expect(articlesByLang.size).toBeGreaterThan(0);
    });

    it('should include English articles', () => {
      const articlesByLang = module.getArticlesByLanguage();
      const enArticles = articlesByLang.get('en') || [];
      expect(enArticles.length).toBeGreaterThan(10);
    });

    it('should include Swedish articles', () => {
      const articlesByLang = module.getArticlesByLanguage();
      const svArticles = articlesByLang.get('sv') || [];
      expect(svArticles.length).toBeGreaterThan(10);
    });

    it('should extract article titles', () => {
      const articlesByLang = module.getArticlesByLanguage();
      const enArticles = articlesByLang.get('en') || [];
      const firstArticle = enArticles[0];
      expect(firstArticle).toBeDefined();
      expect(firstArticle!.title).toBeTruthy();
      expect(firstArticle!.title.length).toBeGreaterThan(5);
    });
  });

  describe('generateSitemapHtml', () => {
    it('should generate valid HTML for English', () => {
      const articlesByLang = module.getArticlesByLanguage();
      const html = module.generateSitemapHtml('en', articlesByLang);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en" dir="ltr">');
      expect(html).toContain('</html>');
    });

    it('should generate RTL HTML for Arabic', () => {
      const articlesByLang = module.getArticlesByLanguage();
      const html = module.generateSitemapHtml('ar', articlesByLang);
      expect(html).toContain('<html lang="ar" dir="rtl">');
      expect(html).toContain('خريطة الموقع');
    });

    it('should generate RTL HTML for Hebrew', () => {
      const articlesByLang = module.getArticlesByLanguage();
      const html = module.generateSitemapHtml('he', articlesByLang);
      expect(html).toContain('<html lang="he" dir="rtl">');
      expect(html).toContain('מפת האתר');
    });

    it('should include hreflang tags', () => {
      const articlesByLang = module.getArticlesByLanguage();
      const html = module.generateSitemapHtml('en', articlesByLang);
      expect(html).toContain('hreflang="en"');
      expect(html).toContain('hreflang="sv"');
      expect(html).toContain('hreflang="nb"');
      expect(html).toContain('hreflang="x-default"');
    });

    it('should include article links for the target language', () => {
      const articlesByLang = module.getArticlesByLanguage();
      const html = module.generateSitemapHtml('sv', articlesByLang);
      expect(html).toMatch(/news\/\d{4}-\d{2}-\d{2}-.+-sv\.html/);
    });

    it('should include dashboard links', () => {
      const articlesByLang = module.getArticlesByLanguage();
      const html = module.generateSitemapHtml('en', articlesByLang);
      expect(html).toContain('dashboard/index.html');
      expect(html).toContain('politician-dashboard.html');
    });

    it('should include docs section when docs exist', () => {
      const docsDir = path.join(rootDir, 'docs');
      if (fs.existsSync(docsDir)) {
        const articlesByLang = module.getArticlesByLanguage();
        const html = module.generateSitemapHtml('en', articlesByLang);
        expect(html).toContain('id="documentation"');
        expect(html).toContain('docs/');
      }
    });

    it('should include proper meta tags', () => {
      const articlesByLang = module.getArticlesByLanguage();
      const html = module.generateSitemapHtml('en', articlesByLang);
      expect(html).toContain('<meta name="description"');
      expect(html).toContain('<meta property="og:title"');
      expect(html).toContain('<meta name="twitter:card"');
    });

    it('should include skip link for accessibility', () => {
      const articlesByLang = module.getArticlesByLanguage();
      const html = module.generateSitemapHtml('en', articlesByLang);
      expect(html).toContain('skip-link');
      expect(html).toContain('#main-content');
    });

    it('should include localized section headings', () => {
      const articlesByLang = module.getArticlesByLanguage();
      const svHtml = module.generateSitemapHtml('sv', articlesByLang);
      expect(svHtml).toContain('Webbplatskarta');
      expect(svHtml).toContain('Nyheter &amp; Analys');

      const jaHtml = module.generateSitemapHtml('ja', articlesByLang);
      expect(jaHtml).toContain('サイトマップ');
    });

    it('should include JSON-LD structured data', () => {
      const articlesByLang = module.getArticlesByLanguage();
      const html = module.generateSitemapHtml('en', articlesByLang);
      expect(html).toContain('application/ld+json');
      expect(html).toContain('"@type": "WebSite"');
      expect(html).toContain('"@type": "SiteNavigationElement"');
    });
  });

  describe('Generated Files Validation', () => {
    const sitemapFiles = [
      'sitemap.html', 'sitemap_sv.html', 'sitemap_da.html', 'sitemap_no.html',
      'sitemap_fi.html', 'sitemap_de.html', 'sitemap_fr.html', 'sitemap_es.html',
      'sitemap_nl.html', 'sitemap_ar.html', 'sitemap_he.html', 'sitemap_ja.html',
      'sitemap_ko.html', 'sitemap_zh.html',
    ];

    it('should have all 14 sitemap HTML files', () => {
      sitemapFiles.forEach(file => {
        const filePath = path.join(rootDir, file);
        expect(fs.existsSync(filePath), `Missing: ${file}`).toBe(true);
      });
    });

    it('should have valid HTML structure in all files', () => {
      sitemapFiles.forEach(file => {
        const filePath = path.join(rootDir, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          expect(content, `${file} should have DOCTYPE`).toContain('<!DOCTYPE html>');
          expect(content, `${file} should have closing html`).toContain('</html>');
          expect(content, `${file} should have charset`).toContain('charset="UTF-8"');
        }
      });
    });
  });
});
