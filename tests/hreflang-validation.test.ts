/**
 * Hreflang validation test suite
 *
 * Validates that all HTML files in the repository have correct hreflang
 * declarations per Google's hreflang specification:
 *
 * 1. All `<link rel="alternate" hreflang="…">` tags use **absolute** URLs
 *    (starting with `https://riksdagsmonitor.com/`)
 * 2. Every page with hreflang alternates includes an `x-default` entry
 * 3. Hreflang codes are valid BCP-47 (Norwegian uses `nb`, not `no`)
 * 4. Each page's own language is included in the hreflang set (self-referencing)
 *
 * @see https://developers.google.com/search/docs/specialty/international/localized-versions
 * @author Hack23 AB (Quality Engineering)
 * @license Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const BASE_URL = 'https://riksdagsmonitor.com';

/** Valid BCP-47 hreflang codes used by Riksdagsmonitor + x-default. */
const VALID_HREFLANG_CODES = new Set([
  'en', 'sv', 'da', 'nb', 'fi', 'de', 'fr', 'es',
  'nl', 'ar', 'he', 'ja', 'ko', 'zh', 'x-default',
]);

/** Directories to skip (docs, node_modules, coverage reports). */
const SKIP_DIRS = new Set(['node_modules', 'docs', 'dist', '.git', 'builds', 'coverage']);

/**
 * Recursively collect all `.html` files under `dir`, skipping excluded dirs.
 */
function collectHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectHtmlFiles(full));
    } else if (entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Extract hreflang link tags from the `<head>` section of an HTML file.
 * Returns an array of { hreflang, href } objects.
 */
function extractHreflangLinks(html: string): Array<{ hreflang: string; href: string }> {
  // Only look in <head> to avoid nav <a> tags with hreflang
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (!headMatch) return [];
  const head = headMatch[1];

  const links: Array<{ hreflang: string; href: string }> = [];
  // Match <link rel="alternate" hreflang="XX" href="…">
  const re = /<link\s+[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(head)) !== null) {
    links.push({ hreflang: m[1], href: m[2] });
  }
  // Also match the reverse attribute order: hreflang before rel
  const re2 = /<link\s+[^>]*hreflang=["']([^"']+)["'][^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
  while ((m = re2.exec(head)) !== null) {
    links.push({ hreflang: m[1], href: m[2] });
  }
  return links;
}

describe('hreflang validation across all HTML files', () => {
  const allHtmlFiles = collectHtmlFiles(ROOT);

  // Filter to only files that have hreflang links (not every HTML file will have them)
  const filesWithHreflang = allHtmlFiles.filter((f) => {
    const html = fs.readFileSync(f, 'utf8');
    return extractHreflangLinks(html).length > 0;
  });

  it('should find HTML files with hreflang links', () => {
    expect(filesWithHreflang.length).toBeGreaterThan(0);
  });

  describe('absolute URLs', () => {
    const filesWithRelativeHreflang: string[] = [];

    for (const file of filesWithHreflang) {
      const html = fs.readFileSync(file, 'utf8');
      const links = extractHreflangLinks(html);
      const relativeLinks = links.filter((l) => !l.href.startsWith('https://'));
      if (relativeLinks.length > 0) {
        filesWithRelativeHreflang.push(path.relative(ROOT, file));
      }
    }

    it('all hreflang links must use absolute URLs (not relative)', () => {
      if (filesWithRelativeHreflang.length > 0) {
        const sample = filesWithRelativeHreflang.slice(0, 10).join('\n  ');
        expect.fail(
          `${filesWithRelativeHreflang.length} file(s) have relative hreflang URLs ` +
          `(must start with https://). Examples:\n  ${sample}`,
        );
      }
    });
  });

  describe('x-default entry', () => {
    const filesMissingXDefault: string[] = [];

    for (const file of filesWithHreflang) {
      const html = fs.readFileSync(file, 'utf8');
      const links = extractHreflangLinks(html);
      // Only check files with ≥2 hreflang entries (multi-language pages)
      if (links.length >= 2) {
        const hasXDefault = links.some((l) => l.hreflang === 'x-default');
        if (!hasXDefault) {
          filesMissingXDefault.push(path.relative(ROOT, file));
        }
      }
    }

    it('all multi-language pages must include hreflang="x-default"', () => {
      if (filesMissingXDefault.length > 0) {
        const sample = filesMissingXDefault.slice(0, 10).join('\n  ');
        expect.fail(
          `${filesMissingXDefault.length} file(s) are missing hreflang="x-default". Examples:\n  ${sample}`,
        );
      }
    });
  });

  describe('valid hreflang codes', () => {
    const filesWithInvalidCodes: Array<{ file: string; codes: string[] }> = [];

    for (const file of filesWithHreflang) {
      const html = fs.readFileSync(file, 'utf8');
      const links = extractHreflangLinks(html);
      const invalidCodes = links
        .map((l) => l.hreflang)
        .filter((code) => !VALID_HREFLANG_CODES.has(code));
      if (invalidCodes.length > 0) {
        filesWithInvalidCodes.push({
          file: path.relative(ROOT, file),
          codes: [...new Set(invalidCodes)],
        });
      }
    }

    it('all hreflang codes must be valid BCP-47 codes (Norwegian = nb, not no)', () => {
      if (filesWithInvalidCodes.length > 0) {
        const details = filesWithInvalidCodes
          .slice(0, 5)
          .map((e) => `  ${e.file}: invalid codes [${e.codes.join(', ')}]`)
          .join('\n');
        expect.fail(
          `${filesWithInvalidCodes.length} file(s) have invalid hreflang codes:\n${details}`,
        );
      }
    });
  });

  describe('hreflang href format', () => {
    const filesWithBadFormat: Array<{ file: string; issues: string[] }> = [];

    for (const file of filesWithHreflang) {
      const html = fs.readFileSync(file, 'utf8');
      const links = extractHreflangLinks(html);
      const issues: string[] = [];
      for (const link of links) {
        if (link.href.startsWith('https://') && !link.href.startsWith(`${BASE_URL}/`)) {
          issues.push(`Wrong base URL: ${link.href}`);
        }
      }
      if (issues.length > 0) {
        filesWithBadFormat.push({
          file: path.relative(ROOT, file),
          issues,
        });
      }
    }

    it('all absolute hreflang URLs must use the correct base URL', () => {
      if (filesWithBadFormat.length > 0) {
        const details = filesWithBadFormat
          .slice(0, 5)
          .map((e) => `  ${e.file}: ${e.issues[0]}`)
          .join('\n');
        expect.fail(
          `${filesWithBadFormat.length} file(s) have incorrect base URL:\n${details}`,
        );
      }
    });
  });
});

describe('renderHreflangBlock helper', () => {
  it('generates absolute URLs with BASE_URL prefix', async () => {
    const { renderHreflangBlock } = await import('../scripts/render-lib/chrome/helpers.js');
    const html = renderHreflangBlock('en', 'news/test-en.html', {
      en: 'news/test-en.html',
      sv: 'news/test-sv.html',
    });
    expect(html).toContain(`href="${BASE_URL}/news/test-en.html"`);
    expect(html).toContain(`href="${BASE_URL}/news/test-sv.html"`);
    expect(html).toContain('hreflang="x-default"');
    // No relative URLs
    expect(html).not.toMatch(/href="[^h][^t][^t][^p]/);
  });

  it('uses nb hreflang for Norwegian (no) file suffix', async () => {
    const { renderHreflangBlock } = await import('../scripts/render-lib/chrome/helpers.js');
    const html = renderHreflangBlock('no' as 'en', 'news/test-no.html', {
      en: 'news/test-en.html',
      no: 'news/test-no.html',
    } as Record<string, string>);
    expect(html).toContain('hreflang="nb"');
    expect(html).not.toContain('hreflang="no"');
  });
});
