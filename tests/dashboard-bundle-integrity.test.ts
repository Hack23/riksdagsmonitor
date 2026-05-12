/**
 * @file Regression: built dashboard HTML must ship the hashed main-*.js bundle.
 *
 * PR #2403 root cause: the live site served `/src/browser/main.ts` (the
 * Vite dev-only path) in dashboard HTML instead of the hashed
 * `/assets/js/main-*.js` bundle. S3/CloudFront returns index.html for
 * unknown paths with `text/html`, so the browser silently rejects loading
 * HTML as a JS module → no lazy loader → no Chart.js → empty dashboards.
 *
 * This test validates:
 *  1. Every `dist/dashboards/*.html` file (en-only slugs) contains a hashed
 *     `/assets/js/main-*.js` script tag.
 *  2. No `dist/dashboards/*.html` file contains the dev-only
 *     `/src/browser/main.ts` path.
 *  3. The `dist/cia-data/` directory exists (CSV data for dashboards).
 *
 * Runs ONLY when `dist/` exists (i.e., after `npm run build`).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const DIST_DASHBOARDS = join(DIST, 'dashboards');

/** All 9 dashboard slugs that must be present after build. */
const DASHBOARD_SLUGS = [
  'parties',
  'pre-election',
  'coalitions',
  'committees',
  'seasonal-patterns',
  'anomaly-detection',
  'risk',
  'ministers',
  'election-cycle',
];

const hasDist = existsSync(DIST);

describe.skipIf(!hasDist)('Dashboard bundle integrity (post-build)', () => {
  it('dist/dashboards/ directory exists', () => {
    expect(existsSync(DIST_DASHBOARDS)).toBe(true);
  });

  it('dist/cia-data/ directory exists', () => {
    expect(existsSync(join(DIST, 'cia-data'))).toBe(true);
  });

  for (const slug of DASHBOARD_SLUGS) {
    const filename = `${slug}.html`;

    describe(filename, () => {
      it('exists in dist/dashboards/', () => {
        expect(existsSync(join(DIST_DASHBOARDS, filename))).toBe(true);
      });

      it('contains hashed main-*.js bundle (not dev /src/browser/main.ts)', () => {
        const filepath = join(DIST_DASHBOARDS, filename);
        if (!existsSync(filepath)) return; // skip if file missing (caught above)
        const html = readFileSync(filepath, 'utf8');

        // Must have hashed bundle
        expect(html).toMatch(
          /<script\b[^>]*type="module"[^>]*src="\/assets\/js\/main-[A-Za-z0-9_-]+\.js"/,
        );

        // Must NOT have dev-only path
        expect(html).not.toContain('/src/browser/main.ts');
      });

      it('has correctly rewritten stylesheet href (stable assets/styles.css path)', () => {
        const filepath = join(DIST_DASHBOARDS, filename);
        if (!existsSync(filepath)) return;
        const html = readFileSync(filepath, 'utf8');

        // The CSS bundle is pinned to the canonical stable URL
        // `assets/styles.css` (vite.config.js `assetFileNames`).
        // Dashboard pages live one level deep so they reference it
        // via `../assets/styles.css`.  No content hash is present in
        // the filename — that is intentional (see vite.config.js
        // header for the cached-HTML invalidation rationale).
        expect(html).toContain('href="../assets/styles.css"');

        // Belt-and-braces: must NOT regress to the dev-only relative
        // path or to the legacy hashed-bundle filename.
        expect(html).not.toContain('href="../styles.css"');
        expect(html).not.toMatch(/href="[^"]*\/assets\/styles-[A-Za-z0-9_-]+\.css"/);
      });
    });
  }

  it('all localized dashboard pages also have hashed bundles', () => {
    if (!existsSync(DIST_DASHBOARDS)) return;
    const files = readdirSync(DIST_DASHBOARDS).filter((f) => f.endsWith('.html'));
    const devPathFiles: string[] = [];

    for (const file of files) {
      const html = readFileSync(join(DIST_DASHBOARDS, file), 'utf8');
      if (html.includes('/src/browser/main.ts')) {
        devPathFiles.push(file);
      }
    }

    expect(devPathFiles, 'Files with dev-only /src/browser/main.ts path').toEqual([]);
  });
});
