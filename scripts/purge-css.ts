/**
 * Purge unused CSS from the production build.
 *
 * Scans every `dist/**\/*.html` page (which already includes the ~3 500
 * generated news articles, dashboards, sitemaps and political-intelligence
 * pages emitted by `vite-plugin-static-pages.js`), all first-party JS
 * bundled into `dist/` **and** the source trees `js/` + `src/browser/`,
 * then rewrites each stylesheet shipped to S3 in-place — keeping only the
 * selectors that those pages or their runtime JS reference.
 *
 * The source-tree scan is intentional: Vite tree-shakes / mangles class
 * strings during bundling, so a class that only appears in `src/browser`
 * source might not survive in the emitted JS even though the runtime
 * still toggles it (e.g. via `classList.add('hidden')`). Including the
 * unminified sources is a safety net against accidentally purging those
 * runtime-toggled classes; it is the right trade-off for a static-site
 * pipeline where the source corpus is small relative to the dist tree.
 *
 * Targets:
 *   - `dist/styles.css`           (legacy non-hashed root copy, only
 *                                   present in older builds — still
 *                                   processed if found so a stale
 *                                   build artefact never ships unpurged)
 *   - `dist/assets/styles.css`    (canonical Vite bundle linked from
 *                                   every modern page; the static-pages
 *                                   plugin rewrites the `<link href>`
 *                                   to it.  Stable, non-hashed URL —
 *                                   see `vite.config.js` rationale.)
 *   - `dist/assets/styles-*.css`  (legacy hashed bundle layout, only
 *                                   present in older build outputs;
 *                                   tolerated for back-compat)
 *
 * Filenames are preserved (PurgeCSS only mutates contents) so all
 * existing `<link>` hrefs and CloudFront URLs continue to work.
 *
 * The safelist captures classes/attributes that are added at runtime by
 * the theme switcher (`data-theme="dark"` / `light`), the lazy-loaded
 * dashboard / chart code, Mermaid diagrams (which inject `mermaid-*`
 * SVGs only after JS executes), and the article-type selectors that may
 * not appear in every sampled HTML file but are used by news articles
 * not yet in the corpus when this script runs locally.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { PurgeCSS } from 'purgecss';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

interface PurgeStat {
  /** Stylesheet path relative to projectRoot. */
  file: string;
  /** Original byte size of the stylesheet on disk. */
  before: number;
  /** Byte size after PurgeCSS rewrite. */
  after: number;
}

/**
 * Recursively collect every file under `dir` whose basename matches one
 * of the supplied extensions. Skips `node_modules`, `.git` and
 * `.vite` directories so we never accidentally feed the purger huge
 * vendor blobs.
 */
async function walk(
  dir: string,
  exts: ReadonlySet<string>,
  out: string[] = [],
): Promise<string[]> {
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === '.vite'
      ) {
        continue;
      }
      await walk(full, exts, out);
    } else if (exts.has(path.extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Build the PurgeCSS safelist. Anything that is added to the DOM only
 * after JavaScript runs (theme switcher, Mermaid SVG IDs, Chart.js
 * tooltip nodes, lazy-loaded dashboard cards) MUST live here, otherwise
 * the purger will drop the matching CSS rules and the live site will
 * regress visually.
 */
function buildSafelist() {
  return {
    /* Selectors kept verbatim regardless of HTML scan */
    standard: [
      /^html$/,
      /^body$/,
      /:root/,
      /^dark-mode$/,
      /^light-mode$/,
      /^theme-transition$/,
      /^visible$/,
      /^hidden$/,
      /^loading$/,
      /^error$/,
      /^block$/,
      /^none$/,
      /aria-/,
    ],
    /* Pattern-matched selectors (and any descendants) preserved */
    deep: [
      /^mermaid/i,
      /^chartjs/i,
      /^chart-/i,
      /^hljs/i, // syntax highlighting on news articles
      /article-type-/,
      /data-theme/,
      /^dashboard-/,
      /^cia-/,
      /^cyberpunk/,
      /^swot/,
      /^mindmap/,
      /^reader-guide/,
    ],
    /* Greedy: keep entire selector chain if any token matches */
    greedy: [/article-type-/, /data-theme/],
    /* CSS custom properties — `variables: false` below disables PurgeCSS
     * variable removal entirely; this entry is a defensive safety net in
     * case that flag is ever flipped on. */
    variables: [/--/],
    /* @keyframes — `keyframes: false` below disables removal entirely;
     * this entry is a defensive safety net for the same reason. */
    keyframes: [/.*/],
  };
}

/**
 * Options for {@link purge}.
 */
interface PurgeOptions {
  /**
   * When `true` (default, production behaviour), also scan the
   * `js/` and `src/browser/` source trees in addition to the `dist/`
   * output. This is the safety net described in the module header
   * against tree-shaking eliminating runtime-toggled class strings.
   *
   * Tests against in-tree fixtures should pass `false` so the test
   * stays decoupled from the main repo source corpus and remains
   * deterministic if unrelated source files change.
   */
  scanSourceTree?: boolean;
}

async function purge(
  distDir: string,
  options: PurgeOptions = {},
): Promise<PurgeStat[]> {
  const { scanSourceTree = true } = options;
  const htmlExts: ReadonlySet<string> = new Set(['.html']);
  const jsExts: ReadonlySet<string> = new Set(['.js', '.mjs']);
  const cssExts: ReadonlySet<string> = new Set(['.css']);

  /* Collect content sources from the built output (HTML + emitted JS).
   * Adding the source `js/` and `src/browser/` directories captures any
   * class strings that survive minification but were rewritten in the
   * built bundles. Tests opt out via `scanSourceTree: false` so the
   * fixture is the only content corpus considered. */
  const htmlFiles = await walk(distDir, htmlExts);
  const jsFiles = await walk(distDir, jsExts);
  const srcJs = scanSourceTree
    ? await walk(path.join(projectRoot, 'js'), jsExts)
    : [];
  const srcTs = scanSourceTree
    ? await walk(path.join(projectRoot, 'src', 'browser'), new Set(['.ts']))
    : [];

  if (htmlFiles.length === 0) {
    throw new Error(
      `[purge-css] No HTML files found under ${distDir}. ` +
        `Run \`npm run build\` first.`,
    );
  }

  /* Stylesheets to purge.  We only purge the targets actually shipped
   * to S3:
   *   - the legacy root `dist/styles.css` (older builds);
   *   - the canonical `dist/assets/styles.css` (current builds — the
   *     static-pages plugin rewrites `<link href>` to this stable path);
   *   - any legacy hashed `dist/assets/styles-*.css` (back-compat).
   * Component sub-stylesheets are inlined into one of those by Vite's
   * CSS bundler, so they don't need a separate pass. */
  const cssCandidates = await walk(distDir, cssExts);
  const cssTargets = cssCandidates.filter((file) => {
    const rel = path.relative(distDir, file);
    return (
      rel === 'styles.css' ||
      rel === path.join('assets', 'styles.css') ||
      /^assets[/\\]styles-[A-Za-z0-9_-]+\.css$/.test(rel)
    );
  });

  if (cssTargets.length === 0) {
    throw new Error(
      `[purge-css] No styles.css targets found under ${distDir}. ` +
        `Expected dist/assets/styles.css (or legacy dist/styles.css / ` +
        `dist/assets/styles-*.css).`,
    );
  }

  const safelist = buildSafelist();
  const stats: PurgeStat[] = [];

  /* PurgeCSS returns one result per `css` entry, in order, so we run
   * one pass per stylesheet to get accurate per-file size deltas and
   * to avoid cross-contamination if Vite ever emits more than one. */
  for (const cssPath of cssTargets) {
    const before = (await fs.stat(cssPath)).size;
    const result = await new PurgeCSS().purge({
      content: [...htmlFiles, ...jsFiles, ...srcJs, ...srcTs],
      css: [cssPath],
      safelist,
      defaultExtractor: (content) =>
        content.match(/[A-Za-z0-9_-]+/g) ?? [],
      keyframes: false, // do not attempt to remove unused @keyframes (Chart.js / Mermaid inject animation names at runtime)
      fontFace: true, // remove unused @font-face
      variables: false, // do not attempt to remove unused CSS variables (theme tokens are referenced from JS-set inline styles)
    });
    const purged = result[0]?.css ?? '';
    await fs.writeFile(cssPath, purged, 'utf8');
    const after = Buffer.byteLength(purged, 'utf8');
    stats.push({
      file: path.relative(projectRoot, cssPath),
      before,
      after,
    });
  }

  return stats;
}

function fmtKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

async function main(): Promise<void> {
  const distArg = process.argv[2] ?? path.join(projectRoot, 'dist');
  const distDir = path.resolve(distArg);
  console.log(`🧹 Purging unused CSS in ${distDir}…`);

  const stats = await purge(distDir);
  for (const s of stats) {
    const saved = s.before - s.after;
    const pct = s.before > 0 ? ((saved / s.before) * 100).toFixed(1) : '0.0';
    console.log(
      `  • ${s.file}: ${fmtKb(s.before)} → ${fmtKb(s.after)} ` +
        `(saved ${fmtKb(saved)}, ${pct}%)`,
    );
  }
  const totalBefore = stats.reduce((acc, s) => acc + s.before, 0);
  const totalAfter = stats.reduce((acc, s) => acc + s.after, 0);
  const totalSaved = totalBefore - totalAfter;
  const totalPct =
    totalBefore > 0 ? ((totalSaved / totalBefore) * 100).toFixed(1) : '0.0';
  console.log(
    `✅ Purge complete: ${fmtKb(totalBefore)} → ${fmtKb(totalAfter)} ` +
      `(saved ${fmtKb(totalSaved)}, ${totalPct}%)`,
  );
}

/* Allow `import { purge }` from tests without triggering the CLI. */
const isMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error('[purge-css]', err);
    process.exit(1);
  });
}

export { purge, buildSafelist };
