/**
 * Unit Tests for Sitemap Generation
 * Tests sitemap.xml generation and validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';

// The module uses an import.meta.url guard so it won't auto-execute main() on import,
// but we still mock process.exit and fs.writeFileSync as a defensive backstop.

/** Shape of the dynamically imported module */
interface GenerateSitemapModule {
  readonly generateSitemap: () => string;
  readonly validateSitemap: (xml: string) => boolean;
}

describe('Sitemap Generation', () => {
  let originalExit: typeof process.exit;
  let originalWriteFileSync: typeof fs.writeFileSync;
  let module: GenerateSitemapModule;

  beforeEach(async () => {
    originalExit = process.exit;
    originalWriteFileSync = fs.writeFileSync;

    try {
      // Prevent process.exit and file writes as a defensive backstop
      process.exit = vi.fn() as unknown as typeof process.exit;
      fs.writeFileSync = vi.fn() as unknown as typeof fs.writeFileSync;

      // Dynamic import after mocking
      module = await import('../scripts/generate-sitemap.js') as unknown as GenerateSitemapModule;
    } finally {
      process.exit = originalExit;
      fs.writeFileSync = originalWriteFileSync;
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSitemap', () => {
    it('should return valid XML string', () => {
      const xml = module.generateSitemap();
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
      expect(xml).toContain('</urlset>');
    });

    it('should include main index page', () => {
      const xml = module.generateSitemap();
      expect(xml).toContain('<loc>https://riksdagsmonitor.com/index.html</loc>');
    });

    it('should include language index pages', () => {
      const xml = module.generateSitemap();
      expect(xml).toContain('index_sv.html');
      expect(xml).toContain('index_da.html');
      expect(xml).toContain('index_fi.html');
      expect(xml).toContain('index_de.html');
      expect(xml).toContain('index_fr.html');
    });

    it('should include politician dashboard page', () => {
      const xml = module.generateSitemap();
      expect(xml).toContain('politician-dashboard.html');
    });

    it('should include dashboard pages', () => {
      const xml = module.generateSitemap();
      expect(xml).toContain('dashboard/index.html');
    });

    it('should include sitemap HTML pages', () => {
      const xml = module.generateSitemap();
      // The English HTML sitemap is always advertised (legacy contract).
      expect(xml).toContain('sitemap.html');
      // Localized HTML sitemaps are advertised only when their file exists on
      // disk; in the unit-test job (no prebuild) they may be absent.
      for (const lang of ['sv', 'de', 'no']) {
        if (fs.existsSync(`sitemap_${lang}.html`)) {
          expect(xml).toContain(`sitemap_${lang}.html`);
        }
      }
    });

    it('should include xhtml namespace for hreflang', () => {
      const xml = module.generateSitemap();
      expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    });

    it('should include hreflang alternate links', () => {
      const xml = module.generateSitemap();
      expect(xml).toContain('xhtml:link rel="alternate"');
      expect(xml).toContain('hreflang=');
    });

    it('should include changefreq and priority tags', () => {
      const xml = module.generateSitemap();
      expect(xml).toContain('<changefreq>');
      expect(xml).toContain('<priority>');
    });

    it('should include lastmod tags', () => {
      const xml = module.generateSitemap();
      expect(xml).toContain('<lastmod>');
    });

    it('should include news index pages', () => {
      const xml = module.generateSitemap();
      expect(xml).toContain('news/');
    });

    it('should include all 14 news index languages when they exist', () => {
      const xml = module.generateSitemap();
      // ja/ko/zh were previously omitted from the hardcoded list.
      for (const lang of ['sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh']) {
        if (fs.existsSync(`news/index_${lang}.html`)) {
          expect(xml).toContain(`news/index_${lang}.html`);
        }
      }
    });

    it('should include localized rss feeds that exist on disk', () => {
      const xml = module.generateSitemap();
      // English rss.xml is gitignored and only present after prebuild, so the
      // existence-checked sitemap advertises it only when the file exists.
      if (fs.existsSync('rss.xml')) {
        expect(xml).toContain('https://riksdagsmonitor.com/rss.xml');
      }
      for (const lang of ['sv', 'de', 'no', 'ja', 'ko', 'zh']) {
        if (fs.existsSync(`rss_${lang}.xml`)) {
          expect(xml).toContain(`https://riksdagsmonitor.com/rss_${lang}.xml`);
        }
      }
    });

    it('should only reference URLs whose backing files exist', () => {
      const xml = module.generateSitemap();
      // Every localized rss feed URL in the sitemap must have a real file.
      const rssLocs = [...xml.matchAll(/<loc>https:\/\/riksdagsmonitor\.com\/(rss_[a-z-]+\.xml)<\/loc>/g)];
      for (const m of rssLocs) {
        expect(fs.existsSync(m[1]!)).toBe(true);
      }
      // Every localized news index URL must have a real file.
      const newsLocs = [...xml.matchAll(/<loc>https:\/\/riksdagsmonitor\.com\/news\/(index_[a-z-]+\.html)<\/loc>/g)];
      for (const m of newsLocs) {
        expect(fs.existsSync(`news/${m[1]!}`)).toBe(true);
      }
    });
  });

  describe('validateSitemap', () => {
    it('should pass for valid sitemap XML', () => {
      const xml = module.generateSitemap();
      expect(() => module.validateSitemap(xml)).not.toThrow();
    });

    it('should return true for valid sitemap', () => {
      const xml = module.generateSitemap();
      expect(module.validateSitemap(xml)).toBe(true);
    });

    it('should throw for missing XML declaration', () => {
      const badXml = '<urlset><url><loc>test</loc></url></urlset>';
      expect(() => module.validateSitemap(badXml)).toThrow('Invalid XML declaration');
    });

    it('should throw for missing sitemap namespace', () => {
      const badXml = '<?xml version="1.0"?><urlset><url><loc>test</loc></url></urlset>';
      expect(() => module.validateSitemap(badXml)).toThrow('Invalid sitemap namespace');
    });

    it('should throw for empty sitemap with no URLs', () => {
      const emptyXml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';
      expect(() => module.validateSitemap(emptyXml)).toThrow('No URLs in sitemap');
    });

    it('should throw for sitemap with no <loc> tags', () => {
      const badXml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url></url></urlset>';
      expect(() => module.validateSitemap(badXml)).toThrow('Missing <loc> tags');
    });
  });
});
