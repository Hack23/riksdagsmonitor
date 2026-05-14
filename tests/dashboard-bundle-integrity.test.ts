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


const MAIN_BUNDLE_SCRIPT_RE =
  /<script\b(?=[^>]*\btype=(?:"module"|module))(?=[^>]*\bsrc=(?:"\/assets\/js\/main-[A-Za-z0-9_-]+\.js"|\/assets\/js\/main-[A-Za-z0-9_-]+\.js))[^>]*>/;

const CIA_ENTRY_SCRIPT_RE =
  /<script\b(?=[^>]*\bsrc=(?:"[^"]*\/assets\/js\/cia-entry-[A-Za-z0-9_-]+\.js"|[^\s>]*\/assets\/js\/cia-entry-[A-Za-z0-9_-]+\.js))[^>]*>/;

const DASHBOARD_STYLESHEET_RE = /\bhref=(?:"\.\.\/assets\/styles\.css"|\.\.\/assets\/styles\.css)(?:\s|>)/;

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

        // Must have hashed bundle. Accept both raw Vite output
        // (`type="module" src="/assets/js/main-*.js"`) and deploy-minified
        // HTML (`type=module crossorigin src=/assets/js/main-*.js`).
        expect(html).toMatch(MAIN_BUNDLE_SCRIPT_RE);

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
        // Accept both raw Vite output and deploy-minified HTML where
        // coderaiser/minify removes quotes from simple attributes.
        expect(html).toMatch(DASHBOARD_STYLESHEET_RE);

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

  /**
   * Regression for 2026-05-13: the CIA dashboard hub (`/dashboard/index.html`)
   * was shipping a tree-shaken `cia-entry-*.js` that read
   * `var Chart = globalThis.Chart;` but never imported `chart.js/auto`,
   * so every chart on the hub silently failed. Root cause: the bare
   * side-effect import `import './shared/register-globals-bootstrap.js';`
   * in `cia-entry.ts` was eliminated because the bootstrap file was not
   * listed in `package.json#sideEffects`. The fix adds the bootstrap to
   * the sideEffects list; this test guards the resulting bundle.
   */
  describe('CIA dashboard hub bundle (dashboard/index.html)', () => {
    const DIST_CIA_HUB = join(DIST, 'dashboard', 'index.html');
    const DIST_ASSETS_JS = join(DIST, 'assets', 'js');

    it('dashboard/index.html exists and ships a hashed cia-entry bundle', () => {
      if (!existsSync(DIST_CIA_HUB)) return;
      const html = readFileSync(DIST_CIA_HUB, 'utf8');
      expect(html).toMatch(CIA_ENTRY_SCRIPT_RE);
    });

    it('cia-entry-*.js statically bundles Chart.js (registerables + auto)', () => {
      if (!existsSync(DIST_ASSETS_JS)) return;
      const ciaEntryFiles = readdirSync(DIST_ASSETS_JS).filter((f) =>
        /^cia-entry-[A-Za-z0-9_-]+\.js$/.test(f),
      );
      expect(ciaEntryFiles, 'exactly one cia-entry bundle').toHaveLength(1);

      const ciaEntry = readFileSync(join(DIST_ASSETS_JS, ciaEntryFiles[0]!), 'utf8');

      // cia-entry must import the register-globals chunk *and* invoke it
      // (vite splits register-globals into its own chunk under
      // `manualChunks`). Pattern: `import{t as B}from"./register-globals-…js";B();`.
      const registerImportMatch = ciaEntry.match(
        /import\s*\{[^}]*\bas\s+(\w+)\s*\}\s*from\s*["']\.\/(register-globals-[A-Za-z0-9_-]+\.js)["']\s*;\s*\1\s*\(\s*\)\s*;/,
      );
      expect(
        registerImportMatch,
        'cia-entry must import register-globals-*.js AND call the exported register fn at module init',
      ).not.toBeNull();

      // The register-globals chunk must (a) import the chart chunk, (b)
      // set `globalThis.Chart = …`, and (c) the chart chunk itself must
      // call `Chart.register(...registerables)`.
      const registerChunkName = registerImportMatch![2]!;
      const registerChunk = readFileSync(join(DIST_ASSETS_JS, registerChunkName), 'utf8');

      expect(
        /globalThis\.Chart\s*=\s*/.test(registerChunk),
        'register-globals chunk must set globalThis.Chart',
      ).toBe(true);
      expect(
        /globalThis\.d3\s*=\s*/.test(registerChunk),
        'register-globals chunk must set globalThis.d3',
      ).toBe(true);
      expect(
        /globalThis\.Papa\s*=\s*/.test(registerChunk),
        'register-globals chunk must set globalThis.Papa',
      ).toBe(true);

      const chartChunkMatch = registerChunk.match(
        /from\s*["']\.\/(chart-[A-Za-z0-9_-]+\.js)["']/,
      );
      expect(chartChunkMatch, 'register-globals chunk must import chart-*.js').not.toBeNull();
      const chartChunk = readFileSync(join(DIST_ASSETS_JS, chartChunkMatch![1]!), 'utf8');
      expect(
        /\.register\(\s*\.\.\.\w+\s*\)/.test(chartChunk),
        'chart chunk must call Chart.register(...registerables)',
      ).toBe(true);
    });

    it('cia-entry-*.js bundle graph statically references the d3 chunk', () => {
      if (!existsSync(DIST_ASSETS_JS)) return;
      const ciaEntryFiles = readdirSync(DIST_ASSETS_JS).filter((f) =>
        /^cia-entry-[A-Za-z0-9_-]+\.js$/.test(f),
      );
      if (ciaEntryFiles.length === 0) return;
      const ciaEntry = readFileSync(join(DIST_ASSETS_JS, ciaEntryFiles[0]!), 'utf8');

      const registerImportMatch = ciaEntry.match(
        /from\s*["']\.\/(register-globals-[A-Za-z0-9_-]+\.js)["']/,
      );
      expect(registerImportMatch).not.toBeNull();
      const registerChunk = readFileSync(
        join(DIST_ASSETS_JS, registerImportMatch![1]!),
        'utf8',
      );

      expect(
        /from\s*["']\.\/d3-[A-Za-z0-9_-]+\.js["']/.test(registerChunk),
        'register-globals chunk must statically import d3-*.js',
      ).toBe(true);
    });
  });
});
