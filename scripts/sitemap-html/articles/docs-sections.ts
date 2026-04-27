/**
 * @module Infrastructure/SitemapHtml/Articles/DocsSections
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Docs sections probe
 *
 * @description
 * Cheap filesystem probe that records which `docs/` sections exist
 * (api / coverage / test-results / cypress / index). The sitemap render
 * uses this to conditionally show or hide the "Resources" section
 * entries and avoid emitting links to missing pages.
 *
 * Round-6 split: extracted from `scripts/generate-sitemap-html.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, '..', '..', '..', 'docs');

/** Boolean flags for each known documentation subsection. */
export interface DocsSections {
  readonly api: boolean;
  readonly coverage: boolean;
  readonly testResults: boolean;
  readonly cypress: boolean;
  readonly index: boolean;
}

/**
 * Probe the local `docs/` tree to determine which sections were built and
 * are therefore safe to link from the sitemap. Pure with respect to its
 * inputs (read-only filesystem checks).
 */
export function getDocsSections(): DocsSections {
  return {
    index: fs.existsSync(path.join(DOCS_DIR, 'index.html')),
    api: fs.existsSync(path.join(DOCS_DIR, 'api', 'index.html')),
    coverage: fs.existsSync(path.join(DOCS_DIR, 'coverage', 'index.html')),
    testResults: fs.existsSync(path.join(DOCS_DIR, 'test-results', 'index.html')),
    cypress: fs.existsSync(path.join(DOCS_DIR, 'cypress', 'index.html')),
  };
}
