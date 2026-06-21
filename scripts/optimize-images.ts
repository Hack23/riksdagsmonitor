import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import sharp, { type Color, type FitEnum, type Sharp } from 'sharp';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imageDir = path.join(repoRoot, 'public', 'images');

type VariantFormat = 'avif' | 'webp' | 'png';

interface WidthVariantSet {
  readonly kind: 'width';
  readonly source: string;
  readonly widths: readonly number[];
  readonly formats: readonly VariantFormat[];
  readonly fit?: keyof FitEnum;
}

interface SquareVariantSet {
  readonly kind: 'square';
  readonly source: string;
  readonly sizes: readonly number[];
  readonly formats: readonly VariantFormat[];
  readonly background?: Color;
}

type VariantSet = WidthVariantSet | SquareVariantSet;

export const IMAGE_VARIANT_MANIFEST: readonly VariantSet[] = [
  {
    kind: 'width',
    source: 'riksdagsmonitor-banner.webp',
    widths: [480, 768, 1024, 1536],
    formats: ['avif', 'webp'],
    fit: 'inside',
  },
  {
    kind: 'width',
    source: 'riksdagsmonitornews-banner.webp',
    widths: [480, 768, 1024, 1536],
    formats: ['avif', 'webp'],
    fit: 'inside',
  },
  {
    kind: 'width',
    source: 'og-image.png',
    widths: [600, 1200],
    formats: ['avif', 'webp'],
    fit: 'inside',
  },
  {
    kind: 'width',
    source: 'og-image-news.png',
    widths: [600, 1200],
    formats: ['avif', 'webp'],
    fit: 'inside',
  },
  {
    kind: 'square',
    source: 'riksdagsmonitor-logo.webp',
    sizes: [48, 96, 180, 192, 512],
    formats: ['png', 'webp'],
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
  {
    kind: 'square',
    source: 'riksdagsmonitornews-logo.webp',
    sizes: [48, 96, 180, 192, 512],
    formats: ['png', 'webp'],
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
];

export function variantName(source: string, size: number, format: VariantFormat): string {
  const { name } = path.parse(source);
  return `${name}-${size}w.${format}`;
}

async function encode(image: Sharp, format: VariantFormat): Promise<Sharp> {
  switch (format) {
    case 'avif':
      return image.avif({ quality: 62, effort: 6 });
    case 'webp':
      return image.webp({ quality: 78, effort: 6 });
    case 'png':
      return image.png({ compressionLevel: 9, adaptiveFiltering: true, palette: true });
  }
}

async function writeWidthVariant(set: WidthVariantSet, width: number, format: VariantFormat): Promise<void> {
  const input = path.join(imageDir, set.source);
  const output = path.join(imageDir, variantName(set.source, width, format));
  const pipeline = sharp(input)
    .resize({ width, fit: set.fit ?? 'inside', withoutEnlargement: true })
    .rotate();
  await (await encode(pipeline, format)).toFile(output);
}

async function writeSquareVariant(set: SquareVariantSet, size: number, format: VariantFormat): Promise<void> {
  const input = path.join(imageDir, set.source);
  const output = path.join(imageDir, variantName(set.source, size, format));
  const pipeline = sharp(input)
    .resize({
      width: size,
      height: size,
      fit: 'contain',
      background: set.background ?? { r: 0, g: 0, b: 0, alpha: 0 },
      withoutEnlargement: true,
    })
    .rotate();
  await (await encode(pipeline, format)).toFile(output);
}

export async function optimizeImages(): Promise<void> {
  await mkdir(imageDir, { recursive: true });
  for (const set of IMAGE_VARIANT_MANIFEST) {
    if (set.kind === 'width') {
      for (const width of set.widths) {
        for (const format of set.formats) {
          await writeWidthVariant(set, width, format);
        }
      }
    } else {
      for (const size of set.sizes) {
        for (const format of set.formats) {
          await writeSquareVariant(set, size, format);
        }
      }
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await optimizeImages();
  console.log('✅ Optimized responsive image variants generated in public/images/');
}
