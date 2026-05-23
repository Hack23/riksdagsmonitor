import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { IMAGE_VARIANT_MANIFEST, variantName } from '../scripts/optimize-images.js';

const REPO_ROOT = path.resolve(__dirname, '..');
const IMAGE_DIR = path.join(REPO_ROOT, 'public', 'images');
const SKIP_HTML_DIRS = new Set(['node_modules', 'dist', 'docs', 'builds', 'scripts', '.git', 'news']);

async function collectHtmlFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (SKIP_HTML_DIRS.has(entry.name)) {
      continue;
    }
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectHtmlFiles(absolutePath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(absolutePath);
    }
  }
  return files;
}

function isInsidePicture(html: string, index: number): boolean {
  return html.lastIndexOf('<picture', index) > html.lastIndexOf('</picture>', index);
}

describe('responsive image variants', () => {
  it('runs image optimization before page generation in the build pipeline', async () => {
    const pkg = JSON.parse(await fs.readFile(path.join(REPO_ROOT, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts.prebuild).toMatch(/^npx tsx scripts\/optimize-images\.ts && /u);
  });

  it('keeps every generated variant present with the expected dimensions', async () => {
    for (const set of IMAGE_VARIANT_MANIFEST) {
      if (set.kind === 'width') {
        for (const width of set.widths) {
          for (const format of set.formats) {
            const file = path.join(IMAGE_DIR, variantName(set.source, width, format));
            const metadata = await sharp(file).metadata();
            expect(metadata.width, file).toBe(width);
            expect(metadata.format, file).toBe(format === 'avif' ? 'heif' : format);
          }
        }
      } else {
        for (const size of set.sizes) {
          for (const format of set.formats) {
            const file = path.join(IMAGE_DIR, variantName(set.source, size, format));
            const metadata = await sharp(file).metadata();
            expect(metadata.width, file).toBe(size);
            expect(metadata.height, file).toBe(size);
            expect(metadata.format, file).toBe(format === 'avif' ? 'heif' : format);
          }
        }
      }
    }
  });

  it('serves every local HTML image through srcset or a picture fallback', async () => {
    const failures: string[] = [];
    for (const htmlFile of await collectHtmlFiles(REPO_ROOT)) {
      const html = await fs.readFile(htmlFile, 'utf8');
      for (const match of html.matchAll(/<img\b[^>]*\bsrc="(?<src>(?:\.\.\/)?images\/[^"]+)"[^>]*>/gu)) {
        const tag = match[0];
        if (!tag.includes('srcset=') && !isInsidePicture(html, match.index)) {
          failures.push(`${path.relative(REPO_ROOT, htmlFile)}: ${tag}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('keeps all local HTML srcset image URLs backed by generated files', async () => {
    const missing: string[] = [];
    for (const htmlFile of await collectHtmlFiles(REPO_ROOT)) {
      const html = await fs.readFile(htmlFile, 'utf8');
      for (const match of html.matchAll(/\bsrcset="(?<srcset>[^"]+)"/gu)) {
        const srcset = match.groups?.srcset ?? '';
        for (const candidate of srcset.split(',')) {
          const url = candidate.trim().split(/\s+/u)[0];
          if (!url.startsWith('images/') && !url.startsWith('../images/')) {
            continue;
          }
          const relativeToPublic = url.replace(/^\.\.\//u, '');
          const absolutePath = path.join(REPO_ROOT, 'public', relativeToPublic);
          try {
            await fs.access(absolutePath);
          } catch {
            missing.push(`${path.relative(REPO_ROOT, htmlFile)} -> ${url}`);
          }
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('S3 image content types', () => {
  it('deploys each supported image format with explicit MIME metadata', async () => {
    const deployScript = await fs.readFile(path.join(REPO_ROOT, 'scripts', 'deploy-s3.sh'), 'utf8');
    for (const contentType of [
      'image/webp',
      'image/avif',
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/svg+xml',
      'image/x-icon',
    ]) {
      expect(deployScript).toContain(`--content-type '${contentType}'`);
    }
  });

  it('can repair AVIF MIME metadata on existing bucket objects', async () => {
    const fixScript = await fs.readFile(path.join(REPO_ROOT, 'scripts', 'fix-s3-mimetypes.sh'), 'utf8');
    expect(fixScript).toContain("fix_type 'image/avif'");
    expect(fixScript).toContain("--include '*.avif'");
  });
});
