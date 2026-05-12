/**
 * vite-plugin-static-pages
 *
 * Emits the (very large) set of pre-rendered "static" HTML pages —
 * news articles, news/index_*.html, sitemap_*.html, dashboards, and
 * political-intelligence_*.html — into `dist/` *outside* Rollup's
 * module graph.
 *
 * ## Why this exists
 *
 * These pages are produced by the prebuild scripts (render-articles,
 * generate-news-indexes, generate-sitemap-html, generate-political-
 * intelligence). They are **pure static HTML**: they reference
 * `styles.css` via a relative path (`styles.css` from the project
 * root, `../styles.css` from the `news/` subfolder), inline a tiny
 * theme-init `<script>`, and embed JSON-LD — but they have **no
 * `<script type="module">`**, no Vite-resolvable imports, and no
 * other bundle-able assets.
 *
 * Listing them as `rollupOptions.input` previously forced Rollup to
 * add ~3 540 entries (3 497 news articles + 14 PI pages + 14
 * sitemaps + 14 news index pages) into the module graph just to
 * rewrite a single `styles.css` `<link>` tag in each. At ~4 250
 * modules the `rendering chunks` phase exhausted Node's default
 * ~4 GB heap, causing
 *   `FATAL ERROR: Ineffective mark-compacts near heap limit
 *    Allocation failed - JavaScript heap out of memory`
 * (release run 25133177267, build log line "rendering chunks…").
 *
 * Bumping `--max-old-space-size` to 8 GB (PR #2117) only delayed
 * the failure — every additional day of news content brings the
 * limit back. The root cause is that Rollup is the wrong tool for
 * static page emission.
 *
 * ## What this plugin does
 *
 * Runs in `closeBundle` (after Vite/Rollup have finished writing
 * the real bundled outputs):
 *
 * 1. Reads `dist/.vite/manifest.json` to find the bundled CSS path
 *    for `styles.css` (always `assets/styles.css` — vite.config.js
 *    pins the main CSS bundle to a stable, non-hashed URL).
 * 2. Reads each static HTML page from the project root, performs
 *    a single regex rewrite of the `styles.css` `<link>` tag, and
 *    a regex rewrite of any `<script type="module" src="
 *    /src/browser/<name>.ts">` tag to its hashed `/assets/js/
 *    <name>-<hash>.js` production bundle, and writes the result
 *    into the matching `dist/` location. Without the script
 *    rewrite, dashboard pages emitted here would ship the dev-only
 *    `/src/browser/main.ts` path, which S3/CloudFront serves as
 *    `index.html` (text/html) — silently breaking the lazy
 *    dashboard loader and leaving every dashboard page empty. No
 *    DOM parsing, no full corpus held in memory at once.
 *
 * Memory profile: O(largest single HTML file) ≈ 2 MB worst case
 * (political-intelligence_*.html). Time profile: O(n) on the
 * number of static pages, with synchronous fs writes pipelined by
 * the OS page cache. Both dimensions are dwarfed by Vite's normal
 * cost.
 *
 * ## Trust boundary
 *
 * The pages this plugin emits are entirely produced by the
 * repository's own prebuild scripts (no third-party templates) and
 * served from the same S3 bucket / CloudFront distribution as the
 * bundled CSS. Per the platform "trust S3 / CloudFront"
 * classification (see `vite.config.js` plugin block), no SRI
 * `integrity` attribute is added — TLS + bucket policy + WAF are
 * the controlling integrity boundary, and any post-build content
 * mutation (purge-css / minify-dist) would otherwise invalidate
 * cached HTML's stale integrity hash and block the stylesheet.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * @typedef {Object} StaticPageSource
 * @property {string} path  Path relative to the project root.
 * @property {boolean} [recurse]  When `path` is a directory, also
 *                                walk subdirectories. Defaults to false.
 */

/**
 * @typedef {Object} StaticPageSet
 * @property {string} label  Human-readable label for the build summary.
 * @property {ReadonlyArray<StaticPageSource>} sources
 */

/**
 * Match a single `<link rel="stylesheet" … href="…styles.css">`
 * tag and capture the surrounding attributes so we can splice in
 * the rewritten href without disturbing the rest.
 *
 * The literal `styles.css` lives in three accepted forms:
 *   - `styles.css`        (root-level pages)
 *   - `../styles.css`     (one-level subfolders, e.g. news/)
 *   - `/styles.css`       (absolute, never used today but tolerated)
 */
const STYLESHEET_LINK_RE =
  /<link\b([^>]*?)\brel\s*=\s*"stylesheet"([^>]*?)\bhref\s*=\s*"((?:\.\.\/|\/)?styles\.css)"([^>]*)>/gi;

/**
 * Match a single `<script type="module" src="/src/browser/<name>.ts">` dev
 * tag (the one Vite expects in source) so we can rewrite it to the hashed
 * production bundle (`/assets/js/<name>-<hash>.js`) emitted by Rollup.
 *
 * Why this matters: dashboard pages (and any other static page emitted by
 * this plugin instead of Rollup) inherit `<script type="module" src="
 * /src/browser/main.ts">` from `index.html`. In dev that source path is
 * resolved by the Vite dev server, but in production S3/CloudFront serves
 * `/src/browser/main.ts` as the index.html fallback (text/html). The
 * browser silently rejects loading HTML as a JS module → the lazy
 * dashboard loader never runs → every dashboard page renders empty.
 *
 * We only match the canonical absolute `/src/browser/<name>.ts` form (the
 * only one used in this codebase) AND require `type="module"` so we never
 * rewrite a non-module `<script>` tag (which would silently break at
 * runtime — an ESM bundle loaded as a classic script throws "Cannot use
 * import statement outside a module"). Captures: 1=before-attrs,
 * 2=name, 3=after-attrs.
 */
const MODULE_SCRIPT_RE =
  /<script\b(?=[^>]*?\btype\s*=\s*"module")([^>]*?)\bsrc\s*=\s*"\/src\/browser\/([A-Za-z0-9_-]+)\.ts"([^>]*)>\s*<\/script>/gi;

/**
 * Read Vite's emitted manifest to map `styles.css` → its bundled
 * output path. The repo pins this bundle to the stable, non-hashed
 * `assets/styles.css` (see `assetFileNames` in vite.config.js), so
 * the manifest entry should always resolve to that exact file.
 *
 * Falls back to:
 *   1. `assets/styles.css` directly on disk (manifest absent / lacks
 *      the entry — e.g. when CSS is registered only under an HTML
 *      entry).
 *   2. A unique `assets/styles-*.css` (legacy hashed layout) — kept
 *      for backwards compatibility with any tooling that still
 *      seeds the old name.
 *
 * @param {string} distDir  Absolute path to the Vite output dir.
 * @returns {string} Bundled CSS path relative to `distDir`
 *                   (e.g. `assets/styles.css`).
 */
function readStylesAssetName(distDir) {
  const manifestPath = path.join(distDir, '.vite', 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    /** @type {Record<string, { file?: string }>} */
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const entry = manifest['styles.css'];
    if (entry && entry.file && entry.file.endsWith('.css')) return entry.file;
  }

  const assetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    // Stable, non-hashed bundle is the expected production layout.
    if (fs.existsSync(path.join(assetsDir, 'styles.css'))) {
      return 'assets/styles.css';
    }
    // Legacy hashed layout — tolerated for tests / older tooling.
    const hits = fs
      .readdirSync(assetsDir)
      .filter((f) => /^styles-[A-Za-z0-9_-]+\.css$/.test(f));
    if (hits.length === 1) return `assets/${hits[0]}`;
    if (hits.length > 1) {
      throw new Error(
        `[static-pages] Found multiple styles-*.css in dist/assets/ ` +
          `(${hits.join(', ')}). Cannot determine canonical bundle.`,
      );
    }
  }

  throw new Error(
    `[static-pages] Could not resolve styles.css filename. ` +
      `Set build.manifest = true in vite.config.js, or check that ` +
      `the main bundle build emitted assets/styles.css under dist/.`,
  );
}

/**
 * Resolve the hashed JS bundle for a given `src/browser/<name>.ts` entry.
 *
 * Looks up `src/browser/<name>.ts` (the source-relative key Vite uses for
 * Rollup `input` entries authored as `<script type="module" src="
 * /src/browser/<name>.ts">` inside an HTML input). Falls back to scanning
 * `dist/assets/js/` for a unique `<name>-<hash>.js` if the manifest
 * doesn't contain that key (e.g. when the entry alias differs from the
 * file basename).
 *
 * Returns a path relative to `distDir`, e.g. `assets/js/main-Ab12.js`.
 * Returns `null` when no match exists — callers leave the script tag
 * untouched in that case so missing entries surface as clear runtime
 * 404s rather than silent rewrites to the wrong bundle.
 *
 * @param {string} distDir       Absolute path to the Vite output dir.
 * @param {string} entryName     Bare module name, e.g. `main`.
 * @returns {string | null}      Hashed asset path (relative) or null.
 */
function readModuleAssetName(distDir, entryName) {
  const manifestPath = path.join(distDir, '.vite', 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    /** @type {Record<string, { file?: string; isEntry?: boolean }>} */
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const key = `src/browser/${entryName}.ts`;
    const entry = manifest[key];
    if (entry && entry.file && entry.file.endsWith('.js')) return entry.file;
  }

  const jsDir = path.join(distDir, 'assets', 'js');
  if (fs.existsSync(jsDir)) {
    const re = new RegExp(`^${entryName}-[A-Za-z0-9_-]+\\.js$`);
    const hits = fs.readdirSync(jsDir).filter((f) => re.test(f));
    if (hits.length === 1) return `assets/js/${hits[0]}`;
    if (hits.length > 1) {
      throw new Error(
        `[static-pages] Found multiple ${entryName}-*.js in dist/assets/js/ ` +
          `(${hits.join(', ')}). Cannot determine canonical bundle.`,
      );
    }
  }

  return null;
}

/**
 * Walk a {@link StaticPageSet} and resolve absolute paths for
 * every HTML file it covers.
 *
 * @param {StaticPageSet} set
 * @param {string} projectRoot
 * @returns {string[]} absolute paths
 */
function resolvePageFiles(set, projectRoot) {
  const files = [];
  for (const src of set.sources) {
    const abs = path.join(projectRoot, src.path);
    if (!fs.existsSync(abs)) continue;
    const stat = fs.statSync(abs);
    if (stat.isFile() && abs.endsWith('.html')) {
      files.push(abs);
      continue;
    }
    if (stat.isDirectory()) {
      const entries = fs.readdirSync(abs, { withFileTypes: true });
      for (const e of entries) {
        if (e.isFile() && e.name.endsWith('.html')) {
          files.push(path.join(abs, e.name));
        }
      }
      if (src.recurse) {
        for (const e of entries) {
          if (!e.isDirectory()) continue;
          files.push(
            ...resolvePageFiles(
              { ...set, sources: [{ path: path.join(src.path, e.name), recurse: true }] },
              projectRoot,
            ),
          );
        }
      }
    }
  }
  return files;
}

/**
 * Resolve the rewritten `href` for a stylesheet link based on the
 * original relative form. The CSS bundle always lives at
 * `<dist>/<bundledAsset>` (typically `assets/styles.css`), so
 * root-level pages reference it via `<bundledAsset>` and one-level-
 * deep pages reference it via `../<bundledAsset>`.
 *
 * @param {string} originalHref  e.g. `styles.css`, `../styles.css`
 * @param {string} bundledAsset  e.g. `assets/styles.css`
 * @returns {string}
 */
function rewrittenHref(originalHref, bundledAsset) {
  if (originalHref.startsWith('../')) return `../${bundledAsset}`;
  if (originalHref.startsWith('/')) return `/${bundledAsset}`;
  return bundledAsset;
}

/**
 * Vite plugin factory.
 *
 * @param {{
 *   projectRoot: string,
 *   outDir: string,
 *   pageSets: ReadonlyArray<StaticPageSet>
 * }} options
 * @returns {import('vite').Plugin}
 */
export default function staticPagesPlugin(options) {
  const { projectRoot, outDir, pageSets } = options;

  return {
    name: 'static-pages-emit',
    apply: 'build',
    enforce: 'post',

    closeBundle: {
      order: 'post',
      sequential: true,
      handler() {
        const distDir = path.isAbsolute(outDir) ? outDir : path.join(projectRoot, outDir);
        const bundledAsset = readStylesAssetName(distDir);

        /** @type {Map<string, string | null>} */
        const moduleAssetCache = new Map();
        const resolveModule = (entryName) => {
          if (!moduleAssetCache.has(entryName)) {
            moduleAssetCache.set(entryName, readModuleAssetName(distDir, entryName));
          }
          return moduleAssetCache.get(entryName);
        };

        let totalEmitted = 0;
        let totalRewritten = 0;
        let totalScriptRewritten = 0;
        const setSummary = [];

        for (const set of pageSets) {
          const files = resolvePageFiles(set, projectRoot);
          let emitted = 0;
          let rewritten = 0;
          let scriptRewritten = 0;

          for (const absPath of files) {
            const rel = path.relative(projectRoot, absPath);
            const destAbs = path.join(distDir, rel);
            fs.mkdirSync(path.dirname(destAbs), { recursive: true });

            const html = fs.readFileSync(absPath, 'utf8');
            let didRewrite = false;
            let didScriptRewrite = false;
            // Rewrite the styles.css href to the bundled asset path.
            // No `integrity` / `crossorigin` is injected — see plugin
            // header "Trust boundary".
            let out = html.replace(
              STYLESHEET_LINK_RE,
              (_m, before, mid, href, after) => {
                didRewrite = true;
                const newHref = rewrittenHref(href, bundledAsset);
                return (
                  `<link${before}rel="stylesheet"${mid}` +
                  `href="${newHref}"${after}>`
                );
              },
            );

            out = out.replace(MODULE_SCRIPT_RE, (match, before, entryName, after) => {
              const hashedJs = resolveModule(entryName);
              if (!hashedJs) {
                return match;
              }
              didScriptRewrite = true;
              const stripAttrs = (s) =>
                s
                  .replace(/\bsrc\s*=\s*"[^"]*"/i, '')
                  .replace(/\bcrossorigin(?:\s*=\s*"[^"]*")?/i, '')
                  .trim();
              const attrsBefore = stripAttrs(before);
              const attrsAfter = stripAttrs(after);
              const beforeStr = attrsBefore ? ` ${attrsBefore}` : '';
              const afterStr = attrsAfter ? ` ${attrsAfter}` : '';
              return `<script${beforeStr} crossorigin="" src="/${hashedJs}"${afterStr}></script>`;
            });

            fs.writeFileSync(destAbs, out, 'utf8');
            emitted += 1;
            if (didRewrite) rewritten += 1;
            if (didScriptRewrite) scriptRewritten += 1;
          }

          setSummary.push({ label: set.label, count: emitted, rewritten, scriptRewritten });
          totalEmitted += emitted;
          totalRewritten += rewritten;
          totalScriptRewritten += scriptRewritten;
        }

        const summary = setSummary
          .map((s) => `${s.label}=${s.count}/${s.rewritten}/${s.scriptRewritten}`)
          .join(', ');
        console.log(
          `[static-pages] emitted ${totalEmitted} HTML page(s), ` +
            `rewrote styles.css href in ${totalRewritten}, ` +
            `rewrote module script src in ${totalScriptRewritten} ` +
            `(label=count/css/js: ${summary})`,
        );
      },
    },
  };
}
