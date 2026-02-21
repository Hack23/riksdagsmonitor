/**
 * @file Sitemap Generation Tests
 * @description Validates sitemap.xml generation includes all content types and languages
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);
const rootDir: string = path.join(__dirname, '..');

/** Shape of the generate-sitemap module */
interface GenerateSitemapModule {
  readonly generateSitemap: () => string;
}

describe('Sitemap Generation', () => {
  let sitemapContent: string;
  let generateSitemap: () => string;

  beforeAll(async () => {
    // Prevent process.exit from terminating tests
    const originalExit = process.exit;
    process.exit = vi.fn() as unknown as typeof process.exit;

    // Import and generate sitemap directly
    const module = await import('../scripts/generate-sitemap.js') as unknown as GenerateSitemapModule;
    generateSitemap = module.generateSitemap;
    sitemapContent = generateSitemap();

    // Restore process.exit
    process.exit = originalExit;
  });

  describe('Basic Structure', () => {
    it('should generate valid XML string', () => {
      expect(sitemapContent).toBeTruthy();
      expect(sitemapContent.length).toBeGreaterThan(1000);
    });

    it('should be valid XML', () => {
      expect(sitemapContent).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
      expect(sitemapContent).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
      expect(sitemapContent).toContain('</urlset>');
    });

    it('should have URL entries', () => {
      const urlCount: number = (sitemapContent.match(/<url>/g) || []).length;
      expect(urlCount).toBeGreaterThan(100);
      console.log(`  ✓ Found ${urlCount} URLs in sitemap`);
    });

    it('should have hreflang support', () => {
      expect(sitemapContent).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
      expect(sitemapContent).toContain('<xhtml:link rel="alternate"');
    });
  });

  describe('Main Pages Coverage', () => {
    it('should include main index page', () => {
      expect(sitemapContent).toContain('<loc>https://riksdagsmonitor.com/index.html</loc>');
    });

    it('should include all 14 language index pages', () => {
      const languages: readonly string[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      languages.forEach(lang => {
        const url: string = lang === 'en'
          ? 'https://riksdagsmonitor.com/index.html'
          : `https://riksdagsmonitor.com/index_${lang}.html`;
        expect(sitemapContent, `Missing index page for language: ${lang}`).toContain(url);
      });
    });

    it('should include politician dashboard', () => {
      expect(sitemapContent).toContain('<loc>https://riksdagsmonitor.com/politician-dashboard.html</loc>');
    });
  });

  describe('Dashboard Pages Coverage', () => {
    it('should include English dashboard', () => {
      expect(sitemapContent).toContain('<loc>https://riksdagsmonitor.com/dashboard/index.html</loc>');
    });

    it('should include dashboard pages for all languages', () => {
      const languages: readonly string[] = ['sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

      // Assert that each expected language-specific dashboard page is present
      languages.forEach((lang) => {
        const expectedLoc = `<loc>https://riksdagsmonitor.com/dashboard/index_${lang}.html</loc>`;
        expect(
          sitemapContent,
          `Missing dashboard page for language: ${lang}`
        ).toContain(expectedLoc);
      });

      // Additionally ensure the sitemap doesn't silently drop or add language dashboards
      // Match only <loc> tags, not xhtml:link alternates
      const dashboardUrls: RegExpMatchArray | null = sitemapContent.match(/<loc>https:\/\/riksdagsmonitor\.com\/dashboard\/index_\w+\.html<\/loc>/g);
      const dashboardUrlCount: number = (dashboardUrls || []).length;
      console.log(`  ✓ Found ${dashboardUrlCount} non-English dashboard pages`);
      expect(dashboardUrlCount).toBe(languages.length);
    });
  });

  describe('News Articles Coverage', () => {
    it('should include news index page', () => {
      expect(sitemapContent).toContain('<loc>https://riksdagsmonitor.com/news/</loc>');
    });

    it('should include news articles', () => {
      const newsUrls: RegExpMatchArray | null = sitemapContent.match(/<loc>https:\/\/riksdagsmonitor\.com\/news\/\d{4}-\d{2}-\d{2}-.+?\.html<\/loc>/g);
      const newsUrlCount: number = (newsUrls || []).length;
      console.log(`  ✓ Found ${newsUrlCount} news article URLs`);
      expect(newsUrlCount).toBeGreaterThan(50);
    });

    it('should include articles in multiple languages', () => {
      // Check for language-specific news articles (year-agnostic)
      const languages: readonly string[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      const foundLanguages = new Set<string>();

      languages.forEach(lang => {
        const pattern = new RegExp(`news/\\d{4}-\\d{2}-\\d{2}-.+-${lang}\\.html`);
        if (pattern.test(sitemapContent)) {
          foundLanguages.add(lang);
        }
      });

      console.log(`  ✓ Found articles in ${foundLanguages.size} languages: ${Array.from(foundLanguages).join(', ')}`);
      expect(foundLanguages.size).toBeGreaterThan(5);
    });

    it('should include hreflang alternates for news articles', () => {
      // Check that news articles have alternate language links
      const hasAlternates = /<xhtml:link rel="alternate" hreflang="\w+" href="https:\/\/riksdagsmonitor\.com\/news\/.+?\.html"\/>/;
      expect(sitemapContent).toMatch(hasAlternates);
    });
  });

  describe('API Documentation Coverage', () => {
    it('should include API index page', () => {
      expect(sitemapContent).toContain('<loc>https://riksdagsmonitor.com/api/index.html</loc>');
    });

    it('should include API documentation files', () => {
      const apiUrls: RegExpMatchArray | null = sitemapContent.match(/api\/.+?\.html/g);
      const apiUrlCount: number = (apiUrls || []).length;
      console.log(`  ✓ Found ${apiUrlCount} API documentation URLs`);
      expect(apiUrlCount).toBeGreaterThan(50);
    });

    it('should include module documentation', () => {
      const moduleUrls: RegExpMatchArray | null = sitemapContent.match(/api\/module-.+?\.html/g);
      const moduleUrlCount: number = (moduleUrls || []).length;
      console.log(`  ✓ Found ${moduleUrlCount} module documentation pages`);
      expect(moduleUrlCount).toBeGreaterThan(10);
    });

    it('should include script documentation', () => {
      const scriptUrls: RegExpMatchArray | null = sitemapContent.match(/api\/scripts_.+?\.html/g);
      const scriptUrlCount: number = (scriptUrls || []).length;
      console.log(`  ✓ Found ${scriptUrlCount} script documentation pages`);
      expect(scriptUrlCount).toBeGreaterThan(10);
    });
  });

  describe('Sitemap HTML Pages Coverage', () => {
    it('should include sitemap HTML pages', () => {
      expect(sitemapContent).toContain('<loc>https://riksdagsmonitor.com/sitemap.html</loc>');
    });

    it('should include sitemap pages for multiple languages', () => {
      const sitemapUrls: RegExpMatchArray | null = sitemapContent.match(/sitemap_\w+\.html/g);
      const sitemapUrlCount: number = (sitemapUrls || []).length;
      console.log(`  ✓ Found ${sitemapUrlCount} language-specific sitemap HTML pages`);
      expect(sitemapUrlCount).toBeGreaterThan(5);
    });
  });

  describe('URL Quality', () => {
    it('should have proper lastmod dates', () => {
      const lastmodCount: number = (sitemapContent.match(/<lastmod>[\d\-T:.Z]+<\/lastmod>/g) || []).length;
      const urlCount: number = (sitemapContent.match(/<url>/g) || []).length;
      expect(lastmodCount).toBe(urlCount);
    });

    it('should have changefreq values', () => {
      const changefreqCount: number = (sitemapContent.match(/<changefreq>(daily|weekly|monthly)<\/changefreq>/g) || []).length;
      const urlCount: number = (sitemapContent.match(/<url>/g) || []).length;
      expect(changefreqCount).toBe(urlCount);
    });

    it('should have priority values', () => {
      const priorityCount: number = (sitemapContent.match(/<priority>[\d.]+<\/priority>/g) || []).length;
      const urlCount: number = (sitemapContent.match(/<url>/g) || []).length;
      expect(priorityCount).toBe(urlCount);
    });

    it('should use proper base URL', () => {
      const urls: RegExpMatchArray = sitemapContent.match(/<loc>(.+?)<\/loc>/g) || [];
      urls.forEach(url => {
        expect(url, 'All URLs should use https://riksdagsmonitor.com base').toContain('https://riksdagsmonitor.com/');
      });
    });

    it('should not have duplicate URLs', () => {
      const urls: RegExpMatchArray = sitemapContent.match(/<loc>(.+?)<\/loc>/g) || [];
      const uniqueUrls = new Set<string>(urls);
      expect(urls.length, 'Sitemap should not have duplicate URLs').toBe(uniqueUrls.size);
    });
  });

  describe('File Size and Performance', () => {
    it('should be under 50MB (sitemap limit)', () => {
      const sizeBytes: number = Buffer.byteLength(sitemapContent, 'utf8');
      const sizeMB: number = sizeBytes / (1024 * 1024);
      console.log(`  ✓ Sitemap size: ${sizeMB.toFixed(2)} MB`);
      expect(sizeMB).toBeLessThan(50);
    });

    it('should have less than 50,000 URLs (sitemap limit)', () => {
      const urlCount: number = (sitemapContent.match(/<url>/g) || []).length;
      console.log(`  ✓ URL count: ${urlCount}`);
      expect(urlCount).toBeLessThan(50000);
    });
  });
});
