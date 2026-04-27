/**
 * @module Infrastructure/SitemapXml/Scanners/Api
 * @category Intelligence Operations / Supporting Infrastructure
 * @name TypeDoc API documentation scanner
 *
 * @description
 * Walks the TypeDoc-generated `api/` directory recursively (skipping the
 * `assets/` bundle) and collects every `*.html` file. Each entry carries
 * the path relative to `api/` plus its git/fs timestamp so the sitemap
 * can emit one `<url>` per documentation page.
 *
 * Round-6 split: extracted from `scripts/generate-sitemap.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getFileModTime } from '../git-timestamps.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_DIR = path.join(__dirname, '..', '..', '..', 'api');

/** Single TypeDoc page with its repo-absolute path and lastmod. */
export interface ApiDoc {
  file: string;
  path: string;
  lastmod: string;
}

/**
 * Get API documentation files (supports TypeDoc nested directory structure).
 */
export function getApiDocs(): ApiDoc[] {
  console.log('📚 Scanning API documentation directory...');

  if (!fs.existsSync(API_DIR)) {
    console.warn('⚠️ API directory not found');
    return [];
  }

  const results: ApiDoc[] = [];

  function scanDir(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'assets') {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        const relativePath = path.relative(API_DIR, fullPath).replace(/\\/g, '/');
        results.push({
          file: relativePath,
          path: fullPath,
          lastmod: getFileModTime(fullPath),
        });
      }
    }
  }

  scanDir(API_DIR);

  console.log(`  Found ${results.length} API documentation files`);

  return results;
}
