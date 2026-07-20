/**
 * @module Infrastructure/SitemapXml/Scanners/Docs
 * @category Intelligence Operations / Supporting Infrastructure
 * @name docs/ scanner — coverage / test-results / cypress / api index
 *
 * @description
 * Walks `docs/` recursively, collects every `*.html` file, and returns a
 * sorted list. Output is
 * sorted alphabetically by relative path so sitemap XML stays
 * deterministic across platforms.
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

const DOCS_DIR = path.join(__dirname, '..', '..', '..', 'docs');

/** Single docs page with its repo-absolute path and lastmod. */
export interface DocFile {
  file: string;
  path: string;
  lastmod: string;
}

/**
 * Get documentation files from the docs directory (api, coverage, test-results, cypress).
 */
export function getDocFiles(): DocFile[] {
  console.log('📖 Scanning docs directory...');

  if (!fs.existsSync(DOCS_DIR)) {
    console.warn('⚠️ Docs directory not found');
    return [];
  }

  const results: DocFile[] = [];

  function scanDir(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        const relativePath = path.relative(DOCS_DIR, fullPath).replace(/\\/g, '/');
        results.push({
          file: relativePath,
          path: fullPath,
          lastmod: getFileModTime(fullPath),
        });
      }

      /**
       * Get generated analysis pages from the `analysis/` directory.
       *
       * The S3 deployment copies this directory verbatim to `dist/analysis/`, so
       * every HTML page below it must also be represented in sitemap.xml.
       */
      export function getAnalysisFiles(): DocFile[] {
        const analysisDir = path.join(__dirname, '..', '..', '..', 'analysis');
        if (!fs.existsSync(analysisDir)) {
          console.warn('⚠️ Analysis directory not found');
          return [];
        }

        const results: DocFile[] = [];

        function scanDir(dir: string): void {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              scanDir(fullPath);
            } else if (entry.isFile() && entry.name.endsWith('.html')) {
              results.push({
                file: path.relative(analysisDir, fullPath).replace(/\\/g, '/'),
                path: fullPath,
                lastmod: getFileModTime(fullPath),
              });
            }
          }
        }

        scanDir(analysisDir);
        results.sort((a, b) => a.file.localeCompare(b.file));
        console.log(`  Found ${results.length} analysis HTML files in analysis/`);
        return results;
      }
    }
  }

  scanDir(DOCS_DIR);

  results.sort((a, b) => a.file.localeCompare(b.file));

  console.log(`  Found ${results.length} documentation files in docs/`);

  return results;
}
