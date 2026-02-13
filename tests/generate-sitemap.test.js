/**
 * Unit Tests for Sitemap Generation
 * Tests sitemap.xml generation and validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// We cannot directly import from generate-sitemap.js because it has top-level 
// side effects (console.log, process.exit). Instead, we test the exported functions
// by dynamically importing with mocked process.exit.

describe('Sitemap Generation', () => {
  let originalExit;
  let originalWriteFileSync;
  let module;

  beforeEach(async () => {
    originalExit = process.exit;
    originalWriteFileSync = fs.writeFileSync;
    
    // Prevent process.exit from terminating the test
    process.exit = vi.fn();
    // Prevent actual file writes
    fs.writeFileSync = vi.fn();
    
    // Dynamic import after mocking
    module = await import('../scripts/generate-sitemap.js');
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.exit = originalExit;
    fs.writeFileSync = originalWriteFileSync;
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
      expect(xml).toContain('sitemap.html');
      expect(xml).toContain('sitemap_sv.html');
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
