/**
 * @file Sitemap Generation Tests
 * @description Validates sitemap.xml generation includes all content types and languages
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

describe('Sitemap Generation', () => {
  let sitemapContent;
  let generateSitemap;

  beforeAll(async () => {
    // Prevent process.exit from terminating tests
    const originalExit = process.exit;
    process.exit = vi.fn();
    
    // Import and generate sitemap directly
    const module = await import('../scripts/generate-sitemap.js');
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
      const urlCount = (sitemapContent.match(/<url>/g) || []).length;
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
      const languages = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      languages.forEach(lang => {
        const url = lang === 'en' 
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
      const languages = ['sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      
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
      const dashboardUrls = sitemapContent.match(/<loc>https:\/\/riksdagsmonitor\.com\/dashboard\/index_\w+\.html<\/loc>/g) || [];
      console.log(`  ✓ Found ${dashboardUrls.length} non-English dashboard pages`);
      expect(dashboardUrls.length).toBe(languages.length);
    });
  });

  describe('News Articles Coverage', () => {
    it('should include news index page', () => {
      expect(sitemapContent).toContain('<loc>https://riksdagsmonitor.com/news/</loc>');
    });

    it('should include news articles', () => {
      const newsUrls = sitemapContent.match(/<loc>https:\/\/riksdagsmonitor\.com\/news\/\d{4}-\d{2}-\d{2}-.+?\.html<\/loc>/g) || [];
      console.log(`  ✓ Found ${newsUrls.length} news article URLs`);
      expect(newsUrls.length).toBeGreaterThan(50);
    });

    it('should include articles in multiple languages', () => {
      // Check for language-specific news articles (year-agnostic)
      const languages = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      const foundLanguages = new Set();

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
      const apiUrls = sitemapContent.match(/api\/.+?\.html/g) || [];
      console.log(`  ✓ Found ${apiUrls.length} API documentation URLs`);
      expect(apiUrls.length).toBeGreaterThan(50);
    });

    it('should include module documentation', () => {
      const moduleUrls = sitemapContent.match(/api\/module-.+?\.html/g) || [];
      console.log(`  ✓ Found ${moduleUrls.length} module documentation pages`);
      expect(moduleUrls.length).toBeGreaterThan(10);
    });

    it('should include script documentation', () => {
      const scriptUrls = sitemapContent.match(/api\/scripts_.+?\.html/g) || [];
      console.log(`  ✓ Found ${scriptUrls.length} script documentation pages`);
      expect(scriptUrls.length).toBeGreaterThan(10);
    });
  });

  describe('Sitemap HTML Pages Coverage', () => {
    it('should include sitemap HTML pages', () => {
      expect(sitemapContent).toContain('<loc>https://riksdagsmonitor.com/sitemap.html</loc>');
    });

    it('should include sitemap pages for multiple languages', () => {
      const sitemapUrls = sitemapContent.match(/sitemap_\w+\.html/g) || [];
      console.log(`  ✓ Found ${sitemapUrls.length} language-specific sitemap HTML pages`);
      expect(sitemapUrls.length).toBeGreaterThan(5);
    });
  });

  describe('URL Quality', () => {
    it('should have proper lastmod dates', () => {
      const lastmodCount = (sitemapContent.match(/<lastmod>[\d\-T:.Z]+<\/lastmod>/g) || []).length;
      const urlCount = (sitemapContent.match(/<url>/g) || []).length;
      expect(lastmodCount).toBe(urlCount);
    });

    it('should have changefreq values', () => {
      const changefreqCount = (sitemapContent.match(/<changefreq>(daily|weekly|monthly)<\/changefreq>/g) || []).length;
      const urlCount = (sitemapContent.match(/<url>/g) || []).length;
      expect(changefreqCount).toBe(urlCount);
    });

    it('should have priority values', () => {
      const priorityCount = (sitemapContent.match(/<priority>[\d.]+<\/priority>/g) || []).length;
      const urlCount = (sitemapContent.match(/<url>/g) || []).length;
      expect(priorityCount).toBe(urlCount);
    });

    it('should use proper base URL', () => {
      const urls = sitemapContent.match(/<loc>(.+?)<\/loc>/g) || [];
      urls.forEach(url => {
        expect(url, 'All URLs should use https://riksdagsmonitor.com base').toContain('https://riksdagsmonitor.com/');
      });
    });

    it('should not have duplicate URLs', () => {
      const urls = sitemapContent.match(/<loc>(.+?)<\/loc>/g) || [];
      const uniqueUrls = new Set(urls);
      expect(urls.length, 'Sitemap should not have duplicate URLs').toBe(uniqueUrls.size);
    });
  });

  describe('File Size and Performance', () => {
    it('should be under 50MB (sitemap limit)', () => {
      const sizeBytes = Buffer.byteLength(sitemapContent, 'utf8');
      const sizeMB = sizeBytes / (1024 * 1024);
      console.log(`  ✓ Sitemap size: ${sizeMB.toFixed(2)} MB`);
      expect(sizeMB).toBeLessThan(50);
    });

    it('should have less than 50,000 URLs (sitemap limit)', () => {
      const urlCount = (sitemapContent.match(/<url>/g) || []).length;
      console.log(`  ✓ URL count: ${urlCount}`);
      expect(urlCount).toBeLessThan(50000);
    });
  });
});
