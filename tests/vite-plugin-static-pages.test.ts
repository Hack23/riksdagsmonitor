/**
 * Unit tests for `scripts/vite-plugin-static-pages.js`.
 *
 * The plugin is the root-cause fix for the OOM during
 * `npm run build` (release run 25133177267): it removes the
 * ~3 540 static HTML pages from Rollup's module graph and emits
 * them itself with a single `styles.css` href rewrite + SHA-384
 * SRI integrity attribute. These tests pin down its public
 * contract so future refactors cannot regress that behaviour.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import staticPagesPlugin from '../scripts/vite-plugin-static-pages.js';

interface TestRig {
  projectRoot: string;
  distDir: string;
  cssBuf: Buffer;
  expectedIntegrity: string;
}

function setupRig(): TestRig {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'static-pages-'));
  const distDir = path.join(projectRoot, 'dist');
  fs.mkdirSync(path.join(distDir, 'assets'), { recursive: true });
  fs.mkdirSync(path.join(distDir, '.vite'), { recursive: true });

  // Synthetic bundled CSS the plugin will reference.
  const cssBuf = Buffer.from('body{background:#0a0e27;color:#e0e0e0}');
  const hashedCss = 'styles-AbCdEf12.css';
  fs.writeFileSync(path.join(distDir, 'assets', hashedCss), cssBuf);
  fs.writeFileSync(
    path.join(distDir, '.vite', 'manifest.json'),
    JSON.stringify({
      'styles.css': { file: `assets/${hashedCss}` },
    }),
  );

  const expectedIntegrity = `sha384-${crypto.createHash('sha384').update(cssBuf).digest('base64')}`;
  return { projectRoot, distDir, cssBuf, expectedIntegrity };
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

  it('rewrites root-level styles.css href to the hashed asset path with SRI', async () => {
    writePage(rig.projectRoot, 'sitemap.html', pageHtml('styles.css'));

    const plugin = staticPagesPlugin({
      projectRoot: rig.projectRoot,
      outDir: 'dist',
      pageSets: [{ label: 'sitemaps', sources: [{ path: 'sitemap.html' }] }],
    });

    await runCloseBundle(plugin);

    const out = fs.readFileSync(path.join(rig.distDir, 'sitemap.html'), 'utf8');
    expect(out).toContain('href="assets/styles-AbCdEf12.css"');
    expect(out).toContain(`integrity="${rig.expectedIntegrity}"`);
    expect(out).toContain('crossorigin="anonymous"');
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
    expect(article).toContain('href="../assets/styles-AbCdEf12.css"');
    expect(article).toContain(`integrity="${rig.expectedIntegrity}"`);

    const index = fs.readFileSync(path.join(rig.distDir, 'news/index.html'), 'utf8');
    expect(index).toContain('href="../assets/styles-AbCdEf12.css"');
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
    // CSS only under the entry HTML.
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
    fs.unlinkSync(path.join(rig.distDir, 'assets', 'styles-AbCdEf12.css'));
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
    expect(out).toContain('href="assets/styles-AbCdEf12.css"');
    expect(out).toContain(`integrity="${rig.expectedIntegrity}"`);
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
});
