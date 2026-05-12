/**
 * Unit tests for `scripts/vite-plugin-static-pages.js`.
 *
 * The plugin is the root-cause fix for the OOM during
 * `npm run build` (release run 25133177267): it removes the
 * ~3 540 static HTML pages from Rollup's module graph and emits
 * them itself with a single `styles.css` href rewrite.
 *
 * **No SRI** — `vite-plugin-sri-gen` was removed and this plugin
 * no longer stamps `integrity` attributes onto first-party
 * `<link rel="stylesheet">` tags. All assets are served from the
 * Hack23-owned S3 → CloudFront pipeline; integrity is enforced by
 * TLS + bucket policy + WAF, not by browser-side SRI.
 *
 * The CSS bundle uses a STABLE, NON-HASHED filename
 * (`assets/styles.css` — see vite.config.js `assetFileNames`) so
 * external consumers and cached HTML pages can rely on a single
 * canonical URL forever.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import staticPagesPlugin from '../scripts/vite-plugin-static-pages.js';

interface TestRig {
  projectRoot: string;
  distDir: string;
  cssBuf: Buffer;
}

function setupRig(): TestRig {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'static-pages-'));
  const distDir = path.join(projectRoot, 'dist');
  fs.mkdirSync(path.join(distDir, 'assets'), { recursive: true });
  fs.mkdirSync(path.join(distDir, '.vite'), { recursive: true });

  // Synthetic bundled CSS the plugin will reference. Pinned to the
  // canonical, stable, non-hashed filename `assets/styles.css`.
  const cssBuf = Buffer.from('body{background:#0a0e27;color:#e0e0e0}');
  fs.writeFileSync(path.join(distDir, 'assets', 'styles.css'), cssBuf);
  fs.writeFileSync(
    path.join(distDir, '.vite', 'manifest.json'),
    JSON.stringify({
      'styles.css': { file: 'assets/styles.css' },
    }),
  );

  return { projectRoot, distDir, cssBuf };
}

function writePage(root: string, rel: string, html: string): void {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, html, 'utf8');
}

function pageHtml(href: string): string {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    `<link rel="stylesheet" type="text/css" href="${href}">`,
    '<title>Test</title>',
    '</head>',
    '<body>Body</body>',
    '</html>',
  ].join('\n');
}

async function runCloseBundle(plugin: ReturnType<typeof staticPagesPlugin>): Promise<void> {
  // The plugin's `closeBundle` is an object hook with a `handler`.
  const closeBundle = plugin.closeBundle as { handler: () => void | Promise<void> };
  await closeBundle.handler();
}

describe('vite-plugin-static-pages', () => {
  let rig: TestRig;

  beforeEach(() => {
    rig = setupRig();
  });

  afterEach(() => {
    fs.rmSync(rig.projectRoot, { recursive: true, force: true });
  });

  it('rewrites root-level styles.css href to the stable bundle path (no SRI)', async () => {
    writePage(rig.projectRoot, 'sitemap.html', pageHtml('styles.css'));

    const plugin = staticPagesPlugin({
      projectRoot: rig.projectRoot,
      outDir: 'dist',
      pageSets: [{ label: 'sitemaps', sources: [{ path: 'sitemap.html' }] }],
    });

    await runCloseBundle(plugin);

    const out = fs.readFileSync(path.join(rig.distDir, 'sitemap.html'), 'utf8');
    expect(out).toContain('href="assets/styles.css"');
    // No SRI / crossorigin on the stylesheet link — first-party assets
    // are trusted via the S3/CloudFront integrity boundary.
    expect(out).not.toContain('integrity=');
    expect(out).not.toMatch(/<link\b[^>]*\bcrossorigin=/i);
    // Must not double-rewrite or duplicate the link tag.
    expect(out.match(/<link\b[^>]*\bhref=/g)).toHaveLength(1);
  });

  it('rewrites ../styles.css references for one-level-deep pages', async () => {
    writePage(rig.projectRoot, 'news/2026-04-29-foo-en.html', pageHtml('../styles.css'));
    writePage(rig.projectRoot, 'news/index.html', pageHtml('../styles.css'));

    const plugin = staticPagesPlugin({
      projectRoot: rig.projectRoot,
      outDir: 'dist',
      pageSets: [{ label: 'news', sources: [{ path: 'news', recurse: true }] }],
    });

    await runCloseBundle(plugin);

    const article = fs.readFileSync(
      path.join(rig.distDir, 'news/2026-04-29-foo-en.html'),
      'utf8',
    );
    expect(article).toContain('href="../assets/styles.css"');
    expect(article).not.toContain('integrity=');

    const index = fs.readFileSync(path.join(rig.distDir, 'news/index.html'), 'utf8');
    expect(index).toContain('href="../assets/styles.css"');
  });

  it('emits every HTML file in a directory page set and creates parent directories', async () => {
    for (const lang of ['en', 'sv', 'ar', 'he']) {
      writePage(rig.projectRoot, `news/2026-04-29-${lang}.html`, pageHtml('../styles.css'));
    }
    writePage(rig.projectRoot, 'news/index_de.html', pageHtml('../styles.css'));

    const plugin = staticPagesPlugin({
      projectRoot: rig.projectRoot,
      outDir: 'dist',
      pageSets: [{ label: 'news', sources: [{ path: 'news' }] }],
    });

    await runCloseBundle(plugin);

    const files = fs.readdirSync(path.join(rig.distDir, 'news')).sort();
    expect(files).toEqual([
      '2026-04-29-ar.html',
      '2026-04-29-en.html',
      '2026-04-29-he.html',
      '2026-04-29-sv.html',
      'index_de.html',
    ]);
  });

  it('leaves pages without a styles.css link unchanged but still emits them', async () => {
    const html =
      '<!doctype html><html><head><title>No CSS</title></head><body>Hi</body></html>';
    writePage(rig.projectRoot, 'orphan.html', html);

    const plugin = staticPagesPlugin({
      projectRoot: rig.projectRoot,
      outDir: 'dist',
      pageSets: [{ label: 'orphans', sources: [{ path: 'orphan.html' }] }],
    });

    await runCloseBundle(plugin);

    const out = fs.readFileSync(path.join(rig.distDir, 'orphan.html'), 'utf8');
    expect(out).toBe(html);
  });

  it('falls back to scanning dist/assets/ when the manifest lacks a styles.css entry', async () => {
    // Strip the styles.css entry — simulates a Vite config that registers
    // CSS only under the entry HTML. The on-disk `assets/styles.css`
    // (stable name) should be discovered directly.
    fs.writeFileSync(path.join(rig.distDir, '.vite', 'manifest.json'), JSON.stringify({}));
    writePage(rig.projectRoot, 'sitemap.html', pageHtml('styles.css'));

    const plugin = staticPagesPlugin({
      projectRoot: rig.projectRoot,
      outDir: 'dist',
      pageSets: [{ label: 'sitemaps', sources: [{ path: 'sitemap.html' }] }],
    });

    await runCloseBundle(plugin);

    const out = fs.readFileSync(path.join(rig.distDir, 'sitemap.html'), 'utf8');
    expect(out).toContain('href="assets/styles.css"');
  });

  it('discovers a legacy hashed styles-*.css when the stable bundle is absent', async () => {
    // Back-compat: older builds (or test fixtures still using the old
    // layout) ship `assets/styles-<hash>.css` instead of the stable
    // `assets/styles.css`.  The plugin must still find it.
    fs.unlinkSync(path.join(rig.distDir, 'assets', 'styles.css'));
    fs.writeFileSync(
      path.join(rig.distDir, 'assets', 'styles-AbCdEf12.css'),
      rig.cssBuf,
    );
    fs.writeFileSync(path.join(rig.distDir, '.vite', 'manifest.json'), JSON.stringify({}));
    writePage(rig.projectRoot, 'sitemap.html', pageHtml('styles.css'));

    const plugin = staticPagesPlugin({
      projectRoot: rig.projectRoot,
      outDir: 'dist',
      pageSets: [{ label: 'sitemaps', sources: [{ path: 'sitemap.html' }] }],
    });

    await runCloseBundle(plugin);

    const out = fs.readFileSync(path.join(rig.distDir, 'sitemap.html'), 'utf8');
    expect(out).toContain('href="assets/styles-AbCdEf12.css"');
  });

  it('throws a descriptive error when the bundled styles.css cannot be located', async () => {
    fs.writeFileSync(path.join(rig.distDir, '.vite', 'manifest.json'), JSON.stringify({}));
    fs.unlinkSync(path.join(rig.distDir, 'assets', 'styles.css'));
    writePage(rig.projectRoot, 'sitemap.html', pageHtml('styles.css'));

    const plugin = staticPagesPlugin({
      projectRoot: rig.projectRoot,
      outDir: 'dist',
      pageSets: [{ label: 'sitemaps', sources: [{ path: 'sitemap.html' }] }],
    });

    await expect(runCloseBundle(plugin)).rejects.toThrow(/styles\.css/);
  });

  it('skips missing source entries silently rather than failing the build', async () => {
    // No file written at the expected path.
    const plugin = staticPagesPlugin({
      projectRoot: rig.projectRoot,
      outDir: 'dist',
      pageSets: [{ label: 'pi', sources: [{ path: 'political-intelligence_zz.html' }] }],
    });

    await expect(runCloseBundle(plugin)).resolves.toBeUndefined();
  });

  it('preserves pre-existing attributes on the <link rel="stylesheet"> tag', async () => {
    const customLink =
      '<link rel="stylesheet" type="text/css" media="all" href="styles.css" id="canonical-styles">';
    writePage(
      rig.projectRoot,
      'sitemap.html',
      `<!doctype html><html><head>${customLink}</head><body></body></html>`,
    );

    const plugin = staticPagesPlugin({
      projectRoot: rig.projectRoot,
      outDir: 'dist',
      pageSets: [{ label: 'sitemaps', sources: [{ path: 'sitemap.html' }] }],
    });

    await runCloseBundle(plugin);

    const out = fs.readFileSync(path.join(rig.distDir, 'sitemap.html'), 'utf8');
    // type="text/css", media="all" and id="canonical-styles" must survive
    // the rewrite. (`id` is part of the trailing attributes captured.)
    expect(out).toContain('type="text/css"');
    expect(out).toContain('media="all"');
    expect(out).toContain('id="canonical-styles"');
    expect(out).toContain('href="assets/styles.css"');
    // No integrity attribute is added.
    expect(out).not.toContain('integrity=');
  });

  it('exposes the Vite plugin contract (apply, enforce, name, closeBundle hook)', () => {
    const plugin = staticPagesPlugin({
      projectRoot: rig.projectRoot,
      outDir: 'dist',
      pageSets: [],
    });
    expect(plugin.name).toBe('static-pages-emit');
    expect(plugin.apply).toBe('build');
    expect(plugin.enforce).toBe('post');
    expect(plugin.closeBundle).toBeTypeOf('object');
    expect((plugin.closeBundle as { handler: unknown }).handler).toBeTypeOf('function');
  });

  // ──────────────────────────────────────────────────────────────────────
  // <script type="module" src="/src/browser/<name>.ts"> rewrite
  // (regression for the empty-dashboards bug: dashboard pages emitted by
  // staticPagesPlugin inherited the dev-only path from index.html, which
  // S3/CloudFront serves as text/html → no JS executed → no charts).
  // ──────────────────────────────────────────────────────────────────────

  function pageWithModuleScript(scriptSrc: string): string {
    return [
      '<!doctype html>',
      '<html lang="en"><head>',
      '<link rel="stylesheet" href="../styles.css">',
      '<title>Dashboard</title>',
      '</head><body>',
      '<section id="pre-election-dashboard"></section>',
      `<script type="module" src="${scriptSrc}"></script>`,
      '</body></html>',
    ].join('\n');
  }

  function seedHashedMainJs(rig: TestRig, fileName = 'main-Ab12C3.js'): void {
    const jsDir = path.join(rig.distDir, 'assets', 'js');
    fs.mkdirSync(jsDir, { recursive: true });
    fs.writeFileSync(path.join(jsDir, fileName), 'export {};');
    const manifestPath = path.join(rig.distDir, '.vite', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest['src/browser/main.ts'] = { file: `assets/js/${fileName}`, isEntry: true };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  }

  it('rewrites <script type="module" src="/src/browser/main.ts"> → hashed bundle from manifest', async () => {
    seedHashedMainJs(rig);
    writePage(
      rig.projectRoot,
      'dashboards/pre-election.html',
      pageWithModuleScript('/src/browser/main.ts'),
    );

    const plugin = staticPagesPlugin({
      projectRoot: rig.projectRoot,
      outDir: 'dist',
      pageSets: [{ label: 'dashboards', sources: [{ path: 'dashboards', recurse: false }] }],
    });

    await runCloseBundle(plugin);

    const out = fs.readFileSync(
      path.join(rig.distDir, 'dashboards/pre-election.html'),
      'utf8',
    );
    // Dev path must be gone; hashed production path must be present with
    // crossorigin attribute (matching what Vite emits in index.html).
    expect(out).not.toContain('/src/browser/main.ts');
    expect(out).toContain('src="/assets/js/main-Ab12C3.js"');
    expect(out).toContain('crossorigin=""');
    // Type=module attribute and surrounding tags must survive.
    expect(out).toMatch(/<script\b[^>]*type="module"[^>]*src="\/assets\/js\/main-Ab12C3\.js"[^>]*><\/script>/);
    // No double-rewrite: only one <script type="module"> per page.
    expect(out.match(/<script\b[^>]*type="module"[^>]*>/g)).toHaveLength(1);
  });

  it('falls back to scanning dist/assets/js/ when manifest lacks a src/browser/<name>.ts entry', async () => {
    // Seed a hashed bundle but DON'T register it in the manifest.
    const jsDir = path.join(rig.distDir, 'assets', 'js');
    fs.mkdirSync(jsDir, { recursive: true });
    fs.writeFileSync(path.join(jsDir, 'main-XyZ987.js'), 'export {};');
    writePage(
      rig.projectRoot,
      'dashboards/parties.html',
      pageWithModuleScript('/src/browser/main.ts'),
    );

    const plugin = staticPagesPlugin({
      projectRoot: rig.projectRoot,
      outDir: 'dist',
      pageSets: [{ label: 'dashboards', sources: [{ path: 'dashboards', recurse: false }] }],
    });

    await runCloseBundle(plugin);

    const out = fs.readFileSync(path.join(rig.distDir, 'dashboards/parties.html'), 'utf8');
    expect(out).toContain('src="/assets/js/main-XyZ987.js"');
    expect(out).not.toContain('/src/browser/main.ts');
  });

  it('leaves the dev script tag untouched when no hashed bundle can be resolved', async () => {
    // No JS bundle and no manifest entry — leave the tag alone so the
    // missing entry surfaces as a clear 404 rather than a silent
    // rewrite to a wrong path.
    writePage(
      rig.projectRoot,
      'dashboards/orphan.html',
      pageWithModuleScript('/src/browser/main.ts'),
    );

    const plugin = staticPagesPlugin({
      projectRoot: rig.projectRoot,
      outDir: 'dist',
      pageSets: [{ label: 'dashboards', sources: [{ path: 'dashboards', recurse: false }] }],
    });

    await runCloseBundle(plugin);

    const out = fs.readFileSync(path.join(rig.distDir, 'dashboards/orphan.html'), 'utf8');
    expect(out).toContain('src="/src/browser/main.ts"');
  });

  it('does not rewrite script tags whose src does not match /src/browser/<name>.ts', async () => {
    seedHashedMainJs(rig);
    const html = [
      '<!doctype html><html><head>',
      '<link rel="stylesheet" href="styles.css">',
      '</head><body>',
      '<script type="module" src="/assets/js/already-bundled.js"></script>',
      '<script src="/inline.js"></script>',
      '<script type="module" src="https://cdn.example.com/lib.mjs"></script>',
      '</body></html>',
    ].join('\n');
    writePage(rig.projectRoot, 'sitemap.html', html);

    const plugin = staticPagesPlugin({
      projectRoot: rig.projectRoot,
      outDir: 'dist',
      pageSets: [{ label: 'sitemaps', sources: [{ path: 'sitemap.html' }] }],
    });

    await runCloseBundle(plugin);

    const out = fs.readFileSync(path.join(rig.distDir, 'sitemap.html'), 'utf8');
    expect(out).toContain('src="/assets/js/already-bundled.js"');
    expect(out).toContain('src="/inline.js"');
    expect(out).toContain('src="https://cdn.example.com/lib.mjs"');
  });

  it('does not duplicate the crossorigin attribute when the source tag already has one', async () => {
    // Regression: previously the rewrite always injected `crossorigin=""`
    // even when the source tag carried its own `crossorigin` attribute,
    // producing a malformed `<script ... crossorigin="" ... crossorigin="">` tag.
    seedHashedMainJs(rig);
    const html = [
      '<!doctype html><html><head>',
      '<link rel="stylesheet" href="../styles.css">',
      '</head><body>',
      '<script type="module" crossorigin="anonymous" src="/src/browser/main.ts"></script>',
      '</body></html>',
    ].join('\n');
    writePage(rig.projectRoot, 'dashboards/parties.html', html);

    const plugin = staticPagesPlugin({
      projectRoot: rig.projectRoot,
      outDir: 'dist',
      pageSets: [{ label: 'dashboards', sources: [{ path: 'dashboards', recurse: false }] }],
    });

    await runCloseBundle(plugin);

    const out = fs.readFileSync(
      path.join(rig.distDir, 'dashboards/parties.html'),
      'utf8',
    );
    expect(out).toContain('src="/assets/js/main-Ab12C3.js"');
    // Exactly one crossorigin attribute on the rewritten <script>.
    const scriptTag = out.match(/<script\b[^>]*src="\/assets\/js\/main-Ab12C3\.js"[^>]*><\/script>/);
    expect(scriptTag, 'rewritten <script> tag').to.not.equal(null);
    const crossoriginCount = (scriptTag![0].match(/\bcrossorigin\b/g) || []).length;
    expect(crossoriginCount).toBe(1);
  });

  it('does not rewrite a non-module <script> tag whose src points at /src/browser/<name>.ts', async () => {
    // Regression: earlier MODULE_SCRIPT_RE did not require type="module" so
    // a classic `<script>` could have been rewritten to a hashed ESM bundle,
    // which throws "Cannot use import statement outside a module" at runtime.
    seedHashedMainJs(rig);
    const html = [
      '<!doctype html><html><head>',
      '<link rel="stylesheet" href="../styles.css">',
      '</head><body>',
      '<script src="/src/browser/main.ts"></script>',
      '</body></html>',
    ].join('\n');
    writePage(rig.projectRoot, 'dashboards/parties.html', html);

    const plugin = staticPagesPlugin({
      projectRoot: rig.projectRoot,
      outDir: 'dist',
      pageSets: [{ label: 'dashboards', sources: [{ path: 'dashboards', recurse: false }] }],
    });

    await runCloseBundle(plugin);

    const out = fs.readFileSync(
      path.join(rig.distDir, 'dashboards/parties.html'),
      'utf8',
    );
    // Classic <script> should be left untouched (the dev path will 404
    // visibly rather than being silently rewritten to a broken ESM load).
    expect(out).toContain('<script src="/src/browser/main.ts"></script>');
    expect(out).not.toContain('/assets/js/main-Ab12C3.js');
  });

  it('rewrites the dev script tag across many pages but resolves the manifest only once per entry', async () => {
    seedHashedMainJs(rig);
    for (const slug of ['parties', 'pre-election', 'coalitions', 'committees']) {
      writePage(
        rig.projectRoot,
        `dashboards/${slug}.html`,
        pageWithModuleScript('/src/browser/main.ts'),
      );
    }

    const plugin = staticPagesPlugin({
      projectRoot: rig.projectRoot,
      outDir: 'dist',
      pageSets: [{ label: 'dashboards', sources: [{ path: 'dashboards', recurse: false }] }],
    });

    await runCloseBundle(plugin);

    for (const slug of ['parties', 'pre-election', 'coalitions', 'committees']) {
      const out = fs.readFileSync(
        path.join(rig.distDir, 'dashboards', `${slug}.html`),
        'utf8',
      );
      expect(out).toContain('src="/assets/js/main-Ab12C3.js"');
      expect(out).not.toContain('/src/browser/main.ts');
    }
  });
});
