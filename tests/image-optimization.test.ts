import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { IMAGE_VARIANT_MANIFEST, variantName } from '../scripts/optimize-images.js';

const REPO_ROOT = path.resolve(__dirname, '..');
const IMAGE_DIR = path.join(REPO_ROOT, 'public', 'images');

describe('responsive image variants', () => {
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
