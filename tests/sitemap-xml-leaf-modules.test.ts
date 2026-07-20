/**
 * @module Tests/SitemapXml/LeafModules
 * @description Unit tests for the bounded-context leaf modules of the
 * sitemap.xml generator (Round-6 split).
 *
 * Covers the pure helpers that have no filesystem dependency:
 *   - hreflangCode
 *   - generateUrlEntry
 *   - validateSitemap
 *
 * The scanner / git-timestamps / orchestrator modules are already
 * exercised by `generate-sitemap.test.ts` via the CLI shim's barrel
 * re-export; these tests pin the unit-level invariants of the new
 * leaves so future refactors stay safe.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';

import { hreflangCode } from '../scripts/sitemap-xml/hreflang.js';
import {
  generateUrlEntry,
  type HreflangAlternate,
} from '../scripts/sitemap-xml/render/url-entry.js';
import { validateSitemap } from '../scripts/sitemap-xml/validator.js';
import { getAnalysisFiles, getDocFiles } from '../scripts/sitemap-xml/scanners/docs.js';

describe('sitemap-xml/hreflang.ts — hreflangCode', () => {
  it('maps the legacy `no` file-suffix to BCP-47 `nb` (Norwegian Bokmål)', () => {
    expect(hreflangCode('no')).toBe('nb');
  });

  it.each(['en', 'sv', 'da', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'])(
    'passes %s through unchanged',
    (code) => {
      expect(hreflangCode(code)).toBe(code);
    },
  );

  it('passes unknown codes through unchanged (does not throw on unexpected input)', () => {
    expect(hreflangCode('xx-pirate')).toBe('xx-pirate');
    expect(hreflangCode('')).toBe('');
  });
});

describe('sitemap-xml/render/url-entry.ts — generateUrlEntry', () => {
  it('emits a minimal `<url>` block without alternates', () => {
    const xml = generateUrlEntry('news/index.html', '2026-04-01T00:00:00.000Z', 'daily', '0.9');
    expect(xml).toContain('<loc>https://riksdagsmonitor.com/news/index.html</loc>');
    expect(xml).toContain('<lastmod>2026-04-01T00:00:00.000Z</lastmod>');
    expect(xml).toContain('<changefreq>daily</changefreq>');
    expect(xml).toContain('<priority>0.9</priority>');
    expect(xml).not.toContain('xhtml:link');
  });

  it('emits one `<xhtml:link rel="alternate">` per alternate, normalising `no` → `nb`', () => {
    const alternates: HreflangAlternate[] = [
      { lang: 'en', href: 'index.html' },
      { lang: 'sv', href: 'index_sv.html' },
      { lang: 'no', href: 'index_no.html' },
      { lang: 'x-default', href: 'index.html' },
    ];
    const xml = generateUrlEntry('index.html', '2026-04-01', 'daily', '1.0', alternates);
    expect(xml).toContain('hreflang="en" href="https://riksdagsmonitor.com/index.html"');
    expect(xml).toContain('hreflang="sv" href="https://riksdagsmonitor.com/index_sv.html"');
    // Norwegian must be normalised to "nb" on the wire even though the
    // file suffix is "no".
    expect(xml).toContain('hreflang="nb" href="https://riksdagsmonitor.com/index_no.html"');
    expect(xml).toContain('hreflang="x-default" href="https://riksdagsmonitor.com/index.html"');
  });

  it('always prefixes the canonical absolute base URL', () => {
    const xml = generateUrlEntry('rss.xml', '2026-04-01', 'daily', '0.5');
    expect(xml).toContain('<loc>https://riksdagsmonitor.com/rss.xml</loc>');
  });
});

describe('sitemap-xml/scanners/api.ts — getApiDocs', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns an empty array when the API directory does not exist', async () => {
    const { getApiDocs } = await import('../scripts/sitemap-xml/scanners/api.js');
    // Explicitly mock existsSync so the test is deterministic regardless of
    // whether a real `api/` directory is present on the runner.
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    const docs = getApiDocs();
    expect(docs).toEqual([]);
  });

  it('scans a mocked directory tree and returns ApiDoc entries', async () => {
    const { getApiDocs } = await import('../scripts/sitemap-xml/scanners/api.js');

    // Spy on fs.existsSync to make API_DIR appear to exist
    const existsSpy = vi.spyOn(fs, 'existsSync').mockImplementation(() => true);

    // Mock readdirSync to return a fake directory structure:
    //   root/: [index.html, modules/, assets/]
    //   root/modules/: [foo.html]
    //   root/assets/: [style.css]
    const readdirSpy = vi.spyOn(fs, 'readdirSync').mockImplementation((dir: unknown) => {
      const dirStr = String(dir);
      if (dirStr.endsWith('assets')) {
        // assets/ contains only a CSS file (no .html)
        return [
          { name: 'style.css', isDirectory: () => false, isFile: () => true },
        ] as unknown as ReturnType<typeof fs.readdirSync>;
      }
      if (dirStr.endsWith('modules')) {
        return [
          { name: 'foo.html', isDirectory: () => false, isFile: () => true },
        ] as unknown as ReturnType<typeof fs.readdirSync>;
      }
      // Root api/ dir
      return [
        { name: 'index.html', isDirectory: () => false, isFile: () => true },
        { name: 'modules', isDirectory: () => true, isFile: () => false },
        { name: 'assets', isDirectory: () => true, isFile: () => false },
      ] as unknown as ReturnType<typeof fs.readdirSync>;
    });

    try {
      const docs = getApiDocs();
      // Should find index.html and modules/foo.html, but not assets/style.css
      expect(Array.isArray(docs)).toBe(true);
      expect(docs.length).toBe(2);
      const paths = docs.map((d) => d.file);
      expect(paths.some((p) => p.includes('index.html'))).toBe(true);
      expect(paths.some((p) => p.includes('foo.html'))).toBe(true);
    } finally {
      existsSpy.mockRestore();
      readdirSpy.mockRestore();
    }
  });

});

describe('sitemap-xml/validator.ts — validateSitemap', () => {
  const happyPath = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
<url><loc>https://riksdagsmonitor.com/index.html</loc></url>
</urlset>`;

  it('returns true on a valid sitemap', () => {
    expect(validateSitemap(happyPath)).toBe(true);
  });

  describe('sitemap-xml/scanners/docs.ts — deployed HTML coverage', () => {
    it('returns deterministic HTML file lists for docs and analysis', () => {
      const docs = getDocFiles();
      const analysis = getAnalysisFiles();

      expect(docs.map((file) => file.file)).toEqual(
        [...docs].map((file) => file.file).sort((a, b) => a.localeCompare(b)),
      );
      expect(analysis.map((file) => file.file)).toEqual(
        [...analysis].map((file) => file.file).sort((a, b) => a.localeCompare(b)),
      );
      expect(docs.every((file) => file.file.endsWith('.html'))).toBe(true);
      expect(analysis.every((file) => file.file.endsWith('.html'))).toBe(true);
    });
  });

  it('throws on missing XML declaration', () => {
    expect(() => validateSitemap('<urlset><url><loc>x</loc></url></urlset>')).toThrow(/XML declaration/);
  });

  it('throws on missing or wrong sitemap namespace', () => {
    const bad = `<?xml version="1.0"?><urlset><url><loc>x</loc></url></urlset>`;
    expect(() => validateSitemap(bad)).toThrow(/sitemap namespace/);
  });

  it('throws when there are zero URL entries', () => {
    const empty = `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
    expect(() => validateSitemap(empty)).toThrow(/No URLs/);
  });

  it('throws when `<url>` blocks lack `<loc>` tags', () => {
    const noLoc = `<?xml version="1.0"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><lastmod>x</lastmod></url></urlset>`;
    expect(() => validateSitemap(noLoc)).toThrow(/<loc>/);
  });
});
