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
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

import { purge, buildSafelist } from '../scripts/purge-css';
import { run as minifyRun } from '../scripts/minify-dist';

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
  // Three fixture stylesheets covering all three accepted purge targets:
  //   - dist/styles.css            (legacy root copy)
  //   - dist/assets/styles.css     (canonical stable bundle, current)
  //   - dist/assets/styles-*.css   (legacy hashed bundle, back-compat)
  await fs.writeFile(path.join(tmp, 'styles.css'), SAMPLE_CSS, 'utf8');
  await fs.writeFile(
    path.join(tmp, 'assets', 'styles.css'),
    SAMPLE_CSS,
    'utf8',
  );
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
    // All three stylesheet targets are processed (root, stable bundle,
    // legacy hashed bundle).
    expect(stats).toHaveLength(3);
    const root = stats.find(
      (s) => s.file.endsWith(path.sep + 'styles.css') && !s.file.includes('assets'),
    );
    const stable = stats.find(
      (s) => s.file.endsWith(path.join('assets', 'styles.css')),
    );
    const hashed = stats.find((s) => /styles-[A-Za-z0-9_-]+\.css$/.test(s.file));
    expect(root, 'legacy root styles.css').toBeDefined();
    expect(stable, 'canonical assets/styles.css').toBeDefined();
    expect(hashed, 'legacy hashed bundle').toBeDefined();
    // Filenames must not change — deploy-s3.sh and CloudFront cache
    // headers depend on stable basenames.
    expect(root!.file.endsWith('styles.css')).toBe(true);
    expect(stable!.file.endsWith(path.join('assets', 'styles.css'))).toBe(true);
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
    // Filenames preserved — deploy-s3 cache headers and the CloudFront
    // origin paths both depend on stable basenames.
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

  it('skips the vendored Mermaid bundle under js/lib/mermaid/', async () => {
    // Regression: PR #2428 had `coderaiser/minify` re-process every
    // file under dist/ including the Mermaid ESM chunk graph
    // (chunk-*.mjs, NOT carrying `.min.` in the basename), which
    // risks corrupting Mermaid's dynamic-import wiring. Path-based
    // skip in SKIP_SUBPATHS guarantees those chunks are never
    // re-minified.
    const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'rm-minify-mermaid-'));
    const mermaidDir = path.join(fixture, 'js', 'lib', 'mermaid');
    await fs.mkdir(mermaidDir, { recursive: true });

    const padding = '          '.repeat(50);
    const chunkBefore =
      `// mermaid chunk\n${padding}\nexport const x = 1;\n${padding}\n`;
    const chunkPath = path.join(mermaidDir, 'chunk-ABCD1234.mjs');
    await fs.writeFile(chunkPath, chunkBefore, 'utf8');

    // Sanity baseline: an arbitrary HTML file outside the skip subtree
    // must still be minified, proving the skip is targeted and doesn't
    // disable the pass.
    const goodHtml = path.join(fixture, 'index.html');
    await fs.writeFile(
      goodHtml,
      `<!DOCTYPE html>\n<html><body>${padding}</body></html>\n`,
      'utf8',
    );

    await minifyRun(fixture);

    // Mermaid chunk is byte-identical (skipped).
    expect(await fs.readFile(chunkPath, 'utf8')).toBe(chunkBefore);
    // Outside-the-skip-tree HTML still got minified.
    const htmlAfter = await fs.readFile(goodHtml, 'utf8');
    expect(htmlAfter.length).toBeLessThan(
      `<!DOCTYPE html>\n<html><body>${padding}</body></html>\n`.length,
    );

    await fs.rm(fixture, { recursive: true, force: true });
  });
});

describe('deploy-s3 wiring', () => {
  it('invokes purge → minify (no SRI step) between dist verification and AWS deploy', async () => {
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
    const awsIdx = indexOfStep((s) =>
      typeof s.uses === 'string' && s.uses.startsWith('aws-actions/configure-aws-credentials'),
    );

    expect(verifyIdx).toBeGreaterThanOrEqual(0);
    expect(purgeIdx).toBeGreaterThanOrEqual(0);
    expect(minifyIdx).toBeGreaterThanOrEqual(0);
    expect(awsIdx).toBeGreaterThanOrEqual(0);
    expect(verifyIdx).toBeLessThan(purgeIdx);
    expect(purgeIdx).toBeLessThan(minifyIdx);
    expect(minifyIdx).toBeLessThan(awsIdx);

    // SRI rewrite step MUST be gone — `vite-plugin-sri-gen` was
    // removed and the static-pages plugin no longer stamps integrity
    // attributes onto first-party `<link>` tags. Re-introducing
    // update-sri.ts here would re-introduce the cached-HTML
    // invalidation bug fixed by this PR.
    const usesUpdateSri = allSteps.some(
      (s) => !!s.run?.includes('scripts/update-sri.ts'),
    );
    expect(usesUpdateSri, 'scripts/update-sri.ts step must not exist').toBe(false);

    // No Docker action — the previous implementation used dra1ex/minify-action;
    // assert no `uses:` step references it (parser-level, not substring).
    const usesDra1ex = allSteps.some(
      (s) => typeof s.uses === 'string' && s.uses.includes('dra1ex/minify-action'),
    );
    expect(usesDra1ex).toBe(false);
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
