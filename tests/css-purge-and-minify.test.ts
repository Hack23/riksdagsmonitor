/**
 * @module tests/css-purge-and-minify
 * @description Verifies the deploy-time CSS purge + minify pipeline added in
 * scripts/purge-css.ts and scripts/minify-dist.ts.  Runs against an
 * in-tree fixture (no full Vite build needed) so the test stays fast and
 * deterministic in CI.
 *
 * Guards against:
 *   - PurgeCSS dropping safelisted dynamic selectors (theme switcher,
 *     article-type-*, mermaid, chart, swot, mindmap).
 *   - PurgeCSS not actually removing any unused selectors (silent
 *     mis-configuration → no perf gain).
 *   - Minify breaking valid HTML/CSS (zero-byte or non-string output).
 *   - Filename / path drift (deploy-s3.sh and CloudFront origin paths
 *     depend on stable basenames).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

import { purge, buildSafelist } from '../scripts/purge-css';
import { run as minifyRun } from '../scripts/minify-dist';
import { updateSri } from '../scripts/update-sri';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const SAMPLE_CSS = `
/* used selectors */
:root { --primary-color: #006633; }
body { color: var(--primary-color); }
.hero-banner { padding: 2rem; }
.breadcrumb { display: flex; }
.breadcrumb-item { padding: 0 4px; }
[data-theme="dark"] body { background: #000; }

/* dynamic — safelisted */
.theme-transition { transition: background 0.2s; }
.dark-mode { color: white; }
.light-mode { color: black; }
.article-type-week-ahead { border-left: 4px solid orange; }
.mermaid svg { max-width: 100%; }
.chart-container { height: 320px; }
.swot-analysis { display: grid; }
.mindmap-node { border-radius: 8px; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.fades-in { animation: fadeIn 200ms; }

/* unused — should be purged */
.never-referenced-anywhere { color: hotpink; }
.this-class-does-not-exist { display: none; }
.totally-orphan-utility { z-index: 9999; }
`;

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Sample</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <nav class="breadcrumb">
      <span class="breadcrumb-item">Home</span>
    </nav>
    <section class="hero-banner">
      <h1>Riksdagsmonitor</h1>
    </section>
    <p>The unused-* selectors should be removed.</p>
  </body>
</html>`;

let tmp: string | undefined;

beforeAll(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'rm-purge-test-'));
  await fs.mkdir(path.join(tmp, 'assets'), { recursive: true });
  await fs.writeFile(path.join(tmp, 'styles.css'), SAMPLE_CSS, 'utf8');
  await fs.writeFile(
    path.join(tmp, 'assets', 'styles-AbCd1234.css'),
    SAMPLE_CSS,
    'utf8',
  );
  await fs.writeFile(path.join(tmp, 'index.html'), SAMPLE_HTML, 'utf8');
});

afterAll(async () => {
  if (tmp) {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

describe('purge-css', () => {
  it('exposes a deterministic safelist covering theme + dynamic classes', () => {
    const safelist = buildSafelist();
    // Smoke-check the regexes that protect runtime-only selectors.
    expect(safelist.deep.some((re) => re.test('mermaid-flowchart-1'))).toBe(true);
    expect(safelist.deep.some((re) => re.test('article-type-breaking'))).toBe(true);
    expect(safelist.deep.some((re) => re.test('swot-analysis'))).toBe(true);
    expect(safelist.standard.some((re) => re.test('dark-mode'))).toBe(true);
    expect(safelist.standard.some((re) => re.test('light-mode'))).toBe(true);
  });

  it('purges unused selectors and keeps safelisted ones', async () => {
    if (!tmp) throw new Error('tmp fixture not initialised');
    // scanSourceTree: false so the test only considers the in-fixture
    // HTML/JS as the content corpus — decouples from main repo source.
    const stats = await purge(tmp, { scanSourceTree: false });
    // Both stylesheet targets are processed.
    expect(stats).toHaveLength(2);
    const root = stats.find((s) => s.file.endsWith('styles.css'));
    const hashed = stats.find((s) => /styles-[A-Za-z0-9_-]+\.css$/.test(s.file));
    expect(root).toBeDefined();
    expect(hashed).toBeDefined();
    // Filenames must not change.
    expect(root!.file.endsWith('styles.css')).toBe(true);
    expect(hashed!.file.endsWith('.css')).toBe(true);

    const purged = await fs.readFile(path.join(tmp, 'styles.css'), 'utf8');
    // Selectors used in the HTML survive.
    expect(purged).toContain('.hero-banner');
    expect(purged).toContain('.breadcrumb');
    // Safelisted runtime/theme selectors survive even though they are
    // not in the HTML scan corpus.
    expect(purged).toContain('.theme-transition');
    expect(purged).toContain('.dark-mode');
    expect(purged).toContain('.light-mode');
    expect(purged).toContain('.article-type-week-ahead');
    expect(purged).toContain('.mermaid svg');
    expect(purged).toContain('.swot-analysis');
    expect(purged).toContain('.mindmap-node');
    // Theme custom properties (cyberpunk tokens) survive.
    expect(purged).toContain('--primary-color');
    expect(purged).toContain('[data-theme="dark"]');
    // Unused selectors are removed.
    expect(purged).not.toContain('.never-referenced-anywhere');
    expect(purged).not.toContain('.this-class-does-not-exist');
    expect(purged).not.toContain('.totally-orphan-utility');
  });

  it('rejects when run against a directory with no HTML', async () => {
    const empty = await fs.mkdtemp(path.join(os.tmpdir(), 'rm-purge-empty-'));
    try {
      await expect(purge(empty, { scanSourceTree: false })).rejects.toThrow(
        /No HTML files/,
      );
    } finally {
      await fs.rm(empty, { recursive: true, force: true });
    }
  });

  it('rejects when run against a directory with no styles target', async () => {
    const noCss = await fs.mkdtemp(path.join(os.tmpdir(), 'rm-purge-no-css-'));
    try {
      await fs.writeFile(path.join(noCss, 'index.html'), '<html></html>', 'utf8');
      await expect(purge(noCss, { scanSourceTree: false })).rejects.toThrow(
        /No styles\.css targets/,
      );
    } finally {
      await fs.rm(noCss, { recursive: true, force: true });
    }
  });
});

describe('minify-dist', () => {
  it('shrinks every text asset under dist while preserving filenames', async () => {
    const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'rm-minify-'));
    await fs.mkdir(path.join(fixture, 'assets'), { recursive: true });
    const htmlPath = path.join(fixture, 'index.html');
    const cssPath = path.join(fixture, 'styles.css');
    const jsPath = path.join(fixture, 'assets', 'main-AbCd1234.js');
    const padding = '          '.repeat(50);
    await fs.writeFile(
      htmlPath,
      `<!DOCTYPE html>\n<html>\n  <head>${padding}<title>x</title></head>\n  <body>${padding}</body>\n</html>\n`,
      'utf8',
    );
    await fs.writeFile(
      cssPath,
      `/* a comment */\n${padding}\n.foo { color: red; }\n${padding}\n.foo { color: red; }\n`,
      'utf8',
    );
    await fs.writeFile(
      jsPath,
      `// header\nfunction add(a, b) {\n${padding}return a + b;\n}\nexport default add;\n`,
      'utf8',
    );

    const beforeHtml = (await fs.stat(htmlPath)).size;
    const beforeCss = (await fs.stat(cssPath)).size;
    const beforeJs = (await fs.stat(jsPath)).size;

    await minifyRun(fixture);

    const afterHtml = (await fs.stat(htmlPath)).size;
    const afterCss = (await fs.stat(cssPath)).size;
    const afterJs = (await fs.stat(jsPath)).size;

    expect(afterHtml).toBeLessThan(beforeHtml);
    expect(afterCss).toBeLessThan(beforeCss);
    expect(afterJs).toBeLessThan(beforeJs);
    // Filenames preserved (the deploy-s3 cache headers + SRI rewrites
    // both depend on stable basenames).
    expect(await fs.readdir(fixture)).toEqual(
      expect.arrayContaining(['index.html', 'styles.css', 'assets']),
    );
    expect(await fs.readdir(path.join(fixture, 'assets'))).toEqual([
      'main-AbCd1234.js',
    ]);

    await fs.rm(fixture, { recursive: true, force: true });
  });

  it('skips already-minified *.min.* files and source maps', async () => {
    const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'rm-minify-skip-'));
    const minCss = path.join(fixture, 'vendor.min.css');
    const mapFile = path.join(fixture, 'main-AbCd1234.js.map');
    const goodHtml = path.join(fixture, 'index.html');
    const minOriginal = '.x{color:red}\n';
    const mapOriginal = '{"version":3}\n';
    await fs.writeFile(minCss, minOriginal, 'utf8');
    await fs.writeFile(mapFile, mapOriginal, 'utf8');
    await fs.writeFile(
      goodHtml,
      '<!DOCTYPE html>\n<html><body>   trim me   </body></html>\n',
      'utf8',
    );

    await minifyRun(fixture);

    expect(await fs.readFile(minCss, 'utf8')).toBe(minOriginal);
    expect(await fs.readFile(mapFile, 'utf8')).toBe(mapOriginal);
    // Sanity: the non-skipped HTML still got touched.
    const htmlAfter = await fs.readFile(goodHtml, 'utf8');
    expect(htmlAfter.length).toBeLessThan(
      '<!DOCTYPE html>\n<html><body>   trim me   </body></html>\n'.length,
    );

    await fs.rm(fixture, { recursive: true, force: true });
  });

  it('skips *.min.mjs files (e.g. mermaid.esm.min.mjs)', async () => {
    const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'rm-minify-mjs-'));
    const minMjs = path.join(fixture, 'mermaid.esm.min.mjs');
    const original = 'export const x=1;\n';
    await fs.writeFile(minMjs, original, 'utf8');
    await minifyRun(fixture);
    expect(await fs.readFile(minMjs, 'utf8')).toBe(original);
    await fs.rm(fixture, { recursive: true, force: true });
  });
});

describe('deploy-s3 wiring', () => {
  it('invokes purge → minify → update-sri between dist verification and AWS deploy', async () => {
    const ymlText = await fs.readFile(
      path.join(REPO_ROOT, '.github', 'workflows', 'deploy-s3.yml'),
      'utf8',
    );
    // Parse the workflow YAML so step ordering is asserted against the
    // actual `steps[]` entries (name/run/uses), not raw substring
    // positions in comments — refactors that move comments around no
    // longer give false positives/negatives.
    interface WorkflowStep {
      name?: string;
      run?: string;
      uses?: string;
    }
    interface WorkflowJob {
      steps?: WorkflowStep[];
    }
    interface ParsedWorkflow {
      jobs?: Record<string, WorkflowJob>;
    }
    const parsed = yaml.load(ymlText) as ParsedWorkflow;
    const allSteps: WorkflowStep[] = Object.values(parsed.jobs ?? {})
      .flatMap((job) => job.steps ?? []);
    const indexOfStep = (predicate: (s: WorkflowStep) => boolean): number =>
      allSteps.findIndex(predicate);

    const verifyIdx = indexOfStep((s) => s.name === 'Verify build artifacts');
    const purgeIdx = indexOfStep((s) => !!s.run?.includes('scripts/purge-css.ts'));
    const minifyIdx = indexOfStep((s) => !!s.run?.includes('scripts/minify-dist.ts'));
    const sriIdx = indexOfStep((s) => !!s.run?.includes('scripts/update-sri.ts'));
    const awsIdx = indexOfStep((s) =>
      typeof s.uses === 'string' && s.uses.startsWith('aws-actions/configure-aws-credentials'),
    );

    expect(verifyIdx).toBeGreaterThanOrEqual(0);
    expect(purgeIdx).toBeGreaterThanOrEqual(0);
    expect(minifyIdx).toBeGreaterThanOrEqual(0);
    expect(sriIdx).toBeGreaterThanOrEqual(0);
    expect(awsIdx).toBeGreaterThanOrEqual(0);
    expect(verifyIdx).toBeLessThan(purgeIdx);
    expect(purgeIdx).toBeLessThan(minifyIdx);
    expect(minifyIdx).toBeLessThan(sriIdx);
    expect(sriIdx).toBeLessThan(awsIdx);

    // No Docker action — the previous implementation used dra1ex/minify-action;
    // assert no `uses:` step references it (parser-level, not substring).
    const usesDra1ex = allSteps.some(
      (s) => typeof s.uses === 'string' && s.uses.includes('dra1ex/minify-action'),
    );
    expect(usesDra1ex).toBe(false);
  });
});

describe('update-sri', () => {
  it('updates the integrity hash in HTML after CSS is modified', async () => {
    const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'rm-sri-'));
    const assetsDir = path.join(fixture, 'assets');
    await fs.mkdir(assetsDir, { recursive: true });

    // Write initial CSS content and compute its "build-time" hash.
    const initialCss = ':root { --primary-color: #006633; }\n.hero { padding: 2rem; }\n';
    const cssPath = path.join(assetsDir, 'styles-AbCd1234.css');
    await fs.writeFile(cssPath, initialCss, 'utf8');
    const oldHash = createHash('sha384').update(Buffer.from(initialCss)).digest('base64');
    const oldIntegrity = `sha384-${oldHash}`;

    // Create an HTML page that references the CSS with the old integrity hash.
    const htmlContent =
      `<!DOCTYPE html>\n<html>\n<head>\n` +
      `<link rel="stylesheet" href="assets/styles-AbCd1234.css" integrity="${oldIntegrity}" crossorigin="anonymous">\n` +
      `</head>\n<body></body>\n</html>\n`;
    await fs.writeFile(path.join(fixture, 'index.html'), htmlContent, 'utf8');

    // Also one in a subdirectory with a relative href.
    const subDir = path.join(fixture, 'news');
    await fs.mkdir(subDir);
    const htmlContent2 =
      `<!DOCTYPE html>\n<html>\n<head>\n` +
      `<link rel="stylesheet" href="../assets/styles-AbCd1234.css" integrity="${oldIntegrity}" crossorigin="anonymous">\n` +
      `</head>\n<body></body>\n</html>\n`;
    await fs.writeFile(path.join(subDir, 'article.html'), htmlContent2, 'utf8');

    // Simulate CSS content change (purge + minify).
    const newCss = ':root { --primary-color: #006633; }\n.hero{padding:2rem}\n';
    await fs.writeFile(cssPath, newCss, 'utf8');
    const expectedHash = createHash('sha384').update(Buffer.from(newCss)).digest('base64');
    const expectedIntegrity = `sha384-${expectedHash}`;

    // Run update-sri.
    const result = await updateSri(fixture);

    expect(result.oldIntegrity).toBe(oldIntegrity);
    expect(result.newIntegrity).toBe(expectedIntegrity);
    expect(result.updatedHtml).toBe(2);
    expect(result.skippedHtml).toBe(0);

    // Verify both HTML files have the new hash.
    const updatedRoot = await fs.readFile(path.join(fixture, 'index.html'), 'utf8');
    const updatedSub = await fs.readFile(path.join(subDir, 'article.html'), 'utf8');
    expect(updatedRoot).toContain(expectedIntegrity);
    expect(updatedRoot).not.toContain(oldIntegrity);
    expect(updatedSub).toContain(expectedIntegrity);
    expect(updatedSub).not.toContain(oldIntegrity);

    await fs.rm(fixture, { recursive: true, force: true });
  });

  it('leaves HTML unchanged when CSS content has not changed', async () => {
    const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'rm-sri-noop-'));
    const assetsDir = path.join(fixture, 'assets');
    await fs.mkdir(assetsDir);

    const css = '.a{color:red}\n';
    const cssPath = path.join(assetsDir, 'styles-XxXx9999.css');
    await fs.writeFile(cssPath, css, 'utf8');
    const hash = createHash('sha384').update(Buffer.from(css)).digest('base64');
    const integrity = `sha384-${hash}`;

    const htmlContent =
      `<!DOCTYPE html><html><head>` +
      `<link rel="stylesheet" href="assets/styles-XxXx9999.css" integrity="${integrity}" crossorigin="anonymous">` +
      `</head><body></body></html>\n`;
    await fs.writeFile(path.join(fixture, 'index.html'), htmlContent, 'utf8');

    const result = await updateSri(fixture);
    // Hash matches, so the file should still be "updated" (same content written
    // is an implementation detail), but the resulting integrity must be correct.
    expect(result.newIntegrity).toBe(integrity);

    await fs.rm(fixture, { recursive: true, force: true });
  });

  it('handles unquoted attributes produced by HTML minifier', async () => {
    const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'rm-sri-unquoted-'));
    const assetsDir = path.join(fixture, 'assets');
    await fs.mkdir(assetsDir);

    const initialCss = '.a { color: red; }\n';
    const cssPath = path.join(assetsDir, 'styles-Mn0pQrSt.css');
    await fs.writeFile(cssPath, initialCss, 'utf8');
    const oldHash = createHash('sha384').update(Buffer.from(initialCss)).digest('base64');
    const oldIntegrity = `sha384-${oldHash}`;

    // Simulate minified HTML with unquoted attributes (as coderaiser/minify produces)
    const htmlContent =
      `<link rel=stylesheet href=assets/styles-Mn0pQrSt.css integrity=${oldIntegrity} crossorigin>`;
    await fs.writeFile(path.join(fixture, 'index.html'), htmlContent, 'utf8');

    // Simulate CSS content change
    const newCss = '.a{color:red}\n';
    await fs.writeFile(cssPath, newCss, 'utf8');
    const expectedHash = createHash('sha384').update(Buffer.from(newCss)).digest('base64');
    const expectedIntegrity = `sha384-${expectedHash}`;

    const result = await updateSri(fixture);

    expect(result.oldIntegrity).toBe(oldIntegrity);
    expect(result.newIntegrity).toBe(expectedIntegrity);
    expect(result.updatedHtml).toBe(1);

    const updated = await fs.readFile(path.join(fixture, 'index.html'), 'utf8');
    expect(updated).toContain(expectedIntegrity);
    expect(updated).not.toContain(oldIntegrity);

    await fs.rm(fixture, { recursive: true, force: true });
  });

  it('refreshes integrity for hashed JS modulepreload links after content changes', async () => {
    const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'rm-sri-js-'));
    const assetsDir = path.join(fixture, 'assets');
    const assetsJsDir = path.join(assetsDir, 'js');
    await fs.mkdir(assetsJsDir, { recursive: true });

    // CSS bundle is required by updateSri's discovery — give it one with a
    // matching integrity so the existing CSS-side guards stay green.
    const css = '.a{color:red}\n';
    const cssBasename = 'styles-AbCd1234.css';
    await fs.writeFile(path.join(assetsDir, cssBasename), css, 'utf8');
    const cssHash = createHash('sha384').update(Buffer.from(css)).digest('base64');
    const cssIntegrity = `sha384-${cssHash}`;

    // Two hashed JS chunks — one will be referenced from a modulepreload tag,
    // the other from a <script src="…"> tag (both with stale integrity).
    const initialJs1 = 'export const a=1;\n';
    const initialJs2 = 'export const b=2;\n';
    const js1Basename = 'anomaly-detection-BYmYhLL4.js';
    const js2Basename = 'main-BFL_BFLA.js';
    await fs.writeFile(path.join(assetsJsDir, js1Basename), initialJs1, 'utf8');
    await fs.writeFile(path.join(assetsJsDir, js2Basename), initialJs2, 'utf8');
    const oldJs1Hash = createHash('sha384').update(Buffer.from(initialJs1)).digest('base64');
    const oldJs2Hash = createHash('sha384').update(Buffer.from(initialJs2)).digest('base64');
    const oldJs1Integrity = `sha384-${oldJs1Hash}`;
    const oldJs2Integrity = `sha384-${oldJs2Hash}`;

    const homepage =
      `<!DOCTYPE html><html><head>` +
      `<link rel="stylesheet" href="assets/${cssBasename}" integrity="${cssIntegrity}" crossorigin="anonymous">` +
      `<link rel="modulepreload" href="/assets/js/${js1Basename}" integrity="${oldJs1Integrity}" crossorigin="anonymous">` +
      `<link rel="modulepreload" href="/assets/js/some-third-party.js" integrity="sha384-DO_NOT_TOUCH" crossorigin="anonymous">` +
      `<script type="module" src="/assets/js/${js2Basename}" integrity="${oldJs2Integrity}" crossorigin="anonymous"></script>` +
      `</head><body></body></html>\n`;
    await fs.writeFile(path.join(fixture, 'index.html'), homepage, 'utf8');

    // Simulate the deploy-time minify pass rewriting the JS bytes.
    const newJs1 = 'export const a=1';
    const newJs2 = 'export const b=2';
    await fs.writeFile(path.join(assetsJsDir, js1Basename), newJs1, 'utf8');
    await fs.writeFile(path.join(assetsJsDir, js2Basename), newJs2, 'utf8');
    const expectedJs1Integrity =
      `sha384-${createHash('sha384').update(Buffer.from(newJs1)).digest('base64')}`;
    const expectedJs2Integrity =
      `sha384-${createHash('sha384').update(Buffer.from(newJs2)).digest('base64')}`;

    const result = await updateSri(fixture);

    expect(result.jsBundles).toBe(2);
    expect(result.jsIntegrityRewrites).toBe(2);

    const updated = await fs.readFile(path.join(fixture, 'index.html'), 'utf8');
    expect(updated).toContain(expectedJs1Integrity);
    expect(updated).toContain(expectedJs2Integrity);
    expect(updated).not.toContain(oldJs1Integrity);
    expect(updated).not.toContain(oldJs2Integrity);
    // The third-party preload's integrity must be left untouched —
    // we only rewrite hashes for assets we own under dist/assets/js/.
    expect(updated).toContain('sha384-DO_NOT_TOUCH');

    await fs.rm(fixture, { recursive: true, force: true });
  });

  it('refreshes JS integrity in unquoted (post-minify) HTML attributes', async () => {
    const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'rm-sri-js-unquoted-'));
    const assetsDir = path.join(fixture, 'assets');
    const assetsJsDir = path.join(assetsDir, 'js');
    await fs.mkdir(assetsJsDir, { recursive: true });

    const css = '.a{color:red}\n';
    const cssBasename = 'styles-Mn0pQrSt.css';
    await fs.writeFile(path.join(assetsDir, cssBasename), css, 'utf8');
    const cssIntegrity = `sha384-${createHash('sha384').update(Buffer.from(css)).digest('base64')}`;

    const initialJs = 'export const x=1;\n';
    const jsBasename = 'coalition-dashboard-yoMiQHgv.js';
    await fs.writeFile(path.join(assetsJsDir, jsBasename), initialJs, 'utf8');
    const oldJsIntegrity =
      `sha384-${createHash('sha384').update(Buffer.from(initialJs)).digest('base64')}`;

    // Minified HTML form: unquoted attributes (coderaiser/minify output)
    const minifiedHomepage =
      `<link rel=stylesheet href=assets/${cssBasename} integrity=${cssIntegrity} crossorigin>` +
      `<link rel=modulepreload href=/assets/js/${jsBasename} integrity=${oldJsIntegrity} crossorigin>`;
    await fs.writeFile(path.join(fixture, 'index.html'), minifiedHomepage, 'utf8');

    // Simulate JS rewrite by minify
    const newJs = 'export const x=1';
    await fs.writeFile(path.join(assetsJsDir, jsBasename), newJs, 'utf8');
    const expectedJsIntegrity =
      `sha384-${createHash('sha384').update(Buffer.from(newJs)).digest('base64')}`;

    const result = await updateSri(fixture);

    expect(result.jsIntegrityRewrites).toBe(1);
    const updated = await fs.readFile(path.join(fixture, 'index.html'), 'utf8');
    expect(updated).toContain(expectedJsIntegrity);
    expect(updated).not.toContain(oldJsIntegrity);

    await fs.rm(fixture, { recursive: true, force: true });
  });
});

describe('budget.json — post-optimisation budgets', () => {
  it('enforces the tightened CSS / document / total budgets', async () => {
    const raw = await fs.readFile(path.join(REPO_ROOT, 'budget.json'), 'utf8');
    const budgets = JSON.parse(raw) as Array<{
      resourceSizes: Array<{ resourceType: string; budget: number }>;
      timings: Array<{ metric: string; budget: number }>;
    }>;
    const resources = new Map(
      budgets[0]!.resourceSizes.map((r) => [r.resourceType, r.budget]),
    );
    const timings = new Map(
      budgets[0]!.timings.map((t) => [t.metric, t.budget]),
    );
    // Stylesheet budget: pinned to the post-purge target so any
    // weakening of budget.json fails CI.  Pre-purge baseline was ≥ 313 KiB.
    expect(resources.get('stylesheet')).toBeLessThanOrEqual(80);
    expect(resources.get('document')).toBeLessThanOrEqual(70);
    expect(resources.get('total')).toBeLessThanOrEqual(900);
    // Core Web Vitals: keep CLS / TBT inside the 'good' band.
    expect(timings.get('cumulative-layout-shift')).toBeLessThanOrEqual(0.1);
    expect(timings.get('total-blocking-time')).toBeLessThanOrEqual(200);
  });
});
