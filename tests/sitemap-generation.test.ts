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
      // The sitemap only advertises news/ when news/index.html exists on disk;
      // it is build-generated (gitignored) and absent in the no-prebuild job.
      if (fs.existsSync(path.join(rootDir, 'news', 'index.html'))) {
        expect(sitemapContent).toContain('<loc>https://riksdagsmonitor.com/news/</loc>');
      }
    });

    it('should include news articles', () => {
      const newsUrls: RegExpMatchArray | null = sitemapContent.match(/<loc>https:\/\/riksdagsmonitor\.com\/news\/(?:\d{4}\/\d{2}\/)?\d{4}-\d{2}-\d{2}-.+?\.html<\/loc>/g);
      const newsUrlCount: number = (newsUrls || []).length;
      console.log(`  ✓ Found ${newsUrlCount} news article URLs`);
      expect(newsUrlCount).toBeGreaterThan(50);
    });

    it('should include articles in multiple languages', () => {
      // Check for language-specific news articles (flat or date-based directory structure)
      const languages: readonly string[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      const foundLanguages = new Set<string>();

      languages.forEach(lang => {
        const pattern = new RegExp(`news/(?:\\d{4}/\\d{2}/)?\\d{4}-\\d{2}-\\d{2}-.+-${lang}\\.html`);
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
    const apiDirExists = fs.existsSync(path.join(rootDir, 'api'));
    const skipMsg = '  ⏭ Skipping: api/ directory not found (run typedoc first)';

    it('should include API index page if api directory exists', () => {
      if (!apiDirExists) {
        console.log(skipMsg);
        return;
      }
      expect(sitemapContent).toContain('<loc>https://riksdagsmonitor.com/api/index.html</loc>');
    });

    it('should include API documentation files if api directory exists', () => {
      if (!apiDirExists) {
        console.log(skipMsg);
        return;
      }
      const apiUrls: RegExpMatchArray | null = sitemapContent.match(/api\/.+?\.html/g);
      const apiUrlCount: number = (apiUrls || []).length;
      console.log(`  ✓ Found ${apiUrlCount} API documentation URLs`);
      expect(apiUrlCount).toBeGreaterThan(50);
    });

    it('should include module documentation if api directory exists', () => {
      if (!apiDirExists) {
        console.log(skipMsg);
        return;
      }
      const moduleUrls: RegExpMatchArray | null = sitemapContent.match(/api\/modules\/.+?\.html/g);
      const moduleUrlCount: number = (moduleUrls || []).length;
      console.log(`  ✓ Found ${moduleUrlCount} module documentation pages`);
      expect(moduleUrlCount).toBeGreaterThan(10);
    });

    it('should include script documentation if api directory exists', () => {
      if (!apiDirExists) {
        console.log(skipMsg);
        return;
      }
      const scriptUrls: RegExpMatchArray | null = sitemapContent.match(/api\/modules\/scripts_.+?\.html/g);
      const scriptUrlCount: number = (scriptUrls || []).length;
      console.log(`  ✓ Found ${scriptUrlCount} script documentation pages`);
      expect(scriptUrlCount).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Generated Documentation (docs/) Coverage', () => {
    const docsDirExists = fs.existsSync(path.join(rootDir, 'docs'));
    const skipMsg = '  ⏭ Skipping: docs/ directory not found';

    it('should include docs index page if docs directory exists', () => {
      if (!docsDirExists) {
        console.log(skipMsg);
        return;
      }
      expect(sitemapContent).toContain('docs/index.html');
    });

    it('should include docs documentation files if docs directory exists', () => {
      if (!docsDirExists) {
        console.log(skipMsg);
        return;
      }
      const docsUrls: RegExpMatchArray | null = sitemapContent.match(/<loc>https:\/\/riksdagsmonitor\.com\/docs\/.+?\.html<\/loc>/g);
      const docsUrlCount: number = (docsUrls || []).length;
      console.log(`  ✓ Found ${docsUrlCount} docs/ documentation URLs`);
      // docs/ content is generated and variable, just verify some exist
      expect(docsUrlCount).toBeGreaterThan(0);
    });
  });

  describe('Sitemap HTML Pages Coverage', () => {
    it('should include sitemap HTML pages', () => {
      expect(sitemapContent).toContain('<loc>https://riksdagsmonitor.com/sitemap.html</loc>');
    });

    it('should include sitemap pages for multiple languages', () => {
      // Localized HTML sitemaps are advertised only when their backing file
      // exists; they are build-generated (gitignored) and absent without prebuild.
      const nonEnLanguages: readonly string[] = ['sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      nonEnLanguages.forEach(lang => {
        if (fs.existsSync(path.join(rootDir, `sitemap_${lang}.html`))) {
          expect(sitemapContent, `Should include sitemap_${lang}.html`).toContain(`sitemap_${lang}.html`);
        }
      });
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
      const urls: string[] = sitemapContent.match(/<loc>(.+?)<\/loc>/g) || [];
      urls.forEach(url => {
        expect(url, 'All URLs should use https://riksdagsmonitor.com base').toContain('https://riksdagsmonitor.com/');
      });
    });

    it('should not have duplicate URLs', () => {
      const urls: string[] = sitemapContent.match(/<loc>(.+?)<\/loc>/g) || [];
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

  describe('Comprehensive Locale Validation', () => {
    const allLanguages: readonly string[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
    /** Map file-suffix language codes to BCP-47 hreflang codes (no → nb). */
    const hreflang = (lang: string): string => lang === 'no' ? 'nb' : lang;

    it('should have hreflang alternates for the main index page covering all 14 languages', () => {
      // Find the index.html URL entry which should have all hreflang alternates
      const indexEntry: RegExpMatchArray | null = sitemapContent.match(/<url>\s*<loc>https:\/\/riksdagsmonitor\.com\/index\.html<\/loc>[\s\S]*?<\/url>/);
      expect(indexEntry, 'Main index URL entry should exist').toBeTruthy();
      const entry: string = indexEntry![0];

      allLanguages.forEach(lang => {
        const expected: string = lang === 'en' ? 'index.html' : `index_${lang}.html`;
        expect(entry, `Main index should have hreflang alternate for ${lang}`).toContain(`hreflang="${hreflang(lang)}"`);
        expect(entry, `Main index should link to ${expected}`).toContain(expected);
      });
    });

    it('should have individual entries for all 14 language index pages', () => {
      allLanguages.forEach(lang => {
        const url: string = lang === 'en'
          ? 'https://riksdagsmonitor.com/index.html'
          : `https://riksdagsmonitor.com/index_${lang}.html`;
        expect(sitemapContent, `Should include index page for ${lang}`).toContain(`<loc>${url}</loc>`);
      });
    });

    it('should have entries for all 14 dashboard language pages', () => {
      allLanguages.forEach(lang => {
        const url: string = lang === 'en'
          ? 'https://riksdagsmonitor.com/dashboard/index.html'
          : `https://riksdagsmonitor.com/dashboard/index_${lang}.html`;
        const dashboardPath: string = path.join(rootDir, lang === 'en' ? 'dashboard/index.html' : `dashboard/index_${lang}.html`);
        if (fs.existsSync(dashboardPath)) {
          expect(sitemapContent, `Should include dashboard page for ${lang}`).toContain(`<loc>${url}</loc>`);
        }
      });
    });

    it('should have sitemap HTML pages for all 14 languages', () => {
      // sitemap.html and sitemap_<lang>.html are build-generated (gitignored);
      // the sitemap advertises each only when its backing file exists.
      if (fs.existsSync(path.join(rootDir, 'sitemap.html'))) {
        expect(sitemapContent).toContain('<loc>https://riksdagsmonitor.com/sitemap.html</loc>');
      }
      const nonEnLanguages: readonly string[] = ['sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];
      nonEnLanguages.forEach(lang => {
        if (fs.existsSync(path.join(rootDir, `sitemap_${lang}.html`))) {
          expect(sitemapContent, `Should include sitemap_${lang}.html`).toContain(`<loc>https://riksdagsmonitor.com/sitemap_${lang}.html</loc>`);
        }
      });
    });

    it('should have hreflang alternates on sitemap HTML pages', () => {
      // Skip when the English HTML sitemap is absent (no prebuild).
      if (!fs.existsSync(path.join(rootDir, 'sitemap.html'))) return;
      const sitemapEntry: RegExpMatchArray | null = sitemapContent.match(/<url>\s*<loc>https:\/\/riksdagsmonitor\.com\/sitemap\.html<\/loc>[\s\S]*?<\/url>/);
      expect(sitemapEntry, 'Sitemap.html URL entry should exist').toBeTruthy();
      const entry: string = sitemapEntry![0];
      expect(entry).toContain('hreflang="en"');
      if (fs.existsSync(path.join(rootDir, 'sitemap_sv.html'))) {
        expect(entry).toContain('hreflang="sv"');
      }
      expect(entry).toContain('hreflang="x-default"');
    });

    it('should have news articles with matching hreflang alternates for every language variant', () => {
      // For articles that exist in multiple languages, verify hreflang cross-references
      const newsDir: string = path.join(rootDir, 'news');
      if (!fs.existsSync(newsDir)) return;

      const files: string[] = fs
        .readdirSync(newsDir)
        .filter((f: string) => f.match(/^\d{4}-\d{2}-\d{2}-.+-(en|sv)\.html$/))
        .sort();
      // Just check a sample of 5 articles
      const sampleFiles: string[] = files.slice(0, 5);

      sampleFiles.forEach((file: string) => {
        const match: RegExpMatchArray | null = file.match(/^(.+?)-(en|sv)\.html$/);
        if (!match) return;
        const baseSlug: string = match[1]!;
        const lang: string = match[2]!;
        const otherLang: string = lang === 'en' ? 'sv' : 'en';

        // Only perform hreflang validation when both language variants exist
        const otherFilePath: string = path.join(newsDir, `${baseSlug}-${otherLang}.html`);
        if (!fs.existsSync(otherFilePath)) {
          return;
        }

        // Ensure the sitemap has a <url> entry for this article
        const urlBlockRegex: RegExp = new RegExp(
          `<url>\\s*<loc>https://riksdagsmonitor\\.com/news/${baseSlug}-${lang}\\.html</loc>[\\s\\S]*?</url>`
        );
        const urlEntryMatch: RegExpMatchArray | null = sitemapContent.match(urlBlockRegex);
        expect(urlEntryMatch, `Sitemap entry for ${file} should exist`).toBeTruthy();
        const urlEntry: string = urlEntryMatch![0];

        // Verify that the <url> block contains hreflang alternates for both language variants
        expect(urlEntry, `Sitemap entry for ${file} should include hreflang="${lang}"`).toContain(`hreflang="${lang}"`);
        expect(urlEntry, `Sitemap entry for ${file} should include hreflang="${otherLang}"`).toContain(`hreflang="${otherLang}"`);
      });
    });

    it('should have news index pages for available languages', () => {
      // news/ and news/index_<lang>.html are build-generated (gitignored); the
      // sitemap advertises each only when its backing file exists on disk.
      if (fs.existsSync(path.join(rootDir, 'news', 'index.html'))) {
        expect(sitemapContent).toContain('<loc>https://riksdagsmonitor.com/news/</loc>');
      }
      const newsIndexAlternates: readonly string[] = ['sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he'];
      newsIndexAlternates.forEach(lang => {
        if (fs.existsSync(path.join(rootDir, 'news', `index_${lang}.html`))) {
          expect(sitemapContent, `Should include news/index_${lang}.html`).toContain(`news/index_${lang}.html`);
        }
      });
    });

    it('should have hreflang alternates in news index entry', () => {
      // Skip when the news index is absent (no prebuild).
      if (!fs.existsSync(path.join(rootDir, 'news', 'index.html'))) return;
      const newsIndexEntry: RegExpMatchArray | null = sitemapContent.match(/<url>\s*<loc>https:\/\/riksdagsmonitor\.com\/news\/<\/loc>[\s\S]*?<\/url>/);
      expect(newsIndexEntry, 'News index URL entry should exist').toBeTruthy();
      const entry: string = newsIndexEntry![0];
      expect(entry).toContain('hreflang="en"');
      if (fs.existsSync(path.join(rootDir, 'news', 'index_sv.html'))) {
        expect(entry).toContain('hreflang="sv"');
      }
      expect(entry).toContain('hreflang="x-default"');
    });

    it('should include politician dashboard', () => {
      expect(sitemapContent).toContain('<loc>https://riksdagsmonitor.com/politician-dashboard.html</loc>');
    });

    it('should have x-default hreflang pointing to English for main pages', () => {
      // Main index entry should have x-default pointing to the English index.html
      const indexEntry: RegExpMatchArray | null = sitemapContent.match(/<url>\s*<loc>https:\/\/riksdagsmonitor\.com\/index\.html<\/loc>[\s\S]*?<\/url>/);
      if (indexEntry) {
        const entry: string = indexEntry[0];
        // Validate x-default hreflang exists and points to the English main page
        expect(entry).toContain('hreflang="x-default"');
        expect(entry).toContain('href="https://riksdagsmonitor.com/index.html"');
      }
    });
  });
});
