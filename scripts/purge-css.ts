/**
 * Purge unused CSS from the production build.
 *
 * Scans every `dist/**\/*.html` page (which already includes the ~3 500
 * generated news articles, dashboards, sitemaps and political-intelligence
 * pages emitted by `vite-plugin-static-pages.js`) plus all first-party JS,
 * and rewrites each stylesheet shipped to S3 in-place — keeping only the
 * selectors that those pages or their runtime JS actually reference.
 *
 * Targets:
 *   - `dist/styles.css`           (legacy non-hashed root copy that
 *                                   `scripts/deploy-s3.sh` cache-busts on
 *                                   every push)
 *   - `dist/assets/styles-*.css`  (Vite-hashed bundle linked from every
 *                                   modern page; the static-pages plugin
 *                                   rewrites the `<link href>` to it)
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
async function walk(dir: string, exts: ReadonlySet<string>): Promise<string[]> {
  const out: string[] = [];
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
      out.push(...(await walk(full, exts)));
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
      /^aria-/,
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
    /* CSS custom properties (cyberpunk theme tokens) */
    variables: [/--/],
    /* @keyframes referenced only via JS animations */
    keyframes: [/.*/],
  };
}

async function purge(distDir: string): Promise<PurgeStat[]> {
  const htmlExts: ReadonlySet<string> = new Set(['.html']);
  const jsExts: ReadonlySet<string> = new Set(['.js', '.mjs']);
  const cssExts: ReadonlySet<string> = new Set(['.css']);

  /* Collect content sources from the built output (HTML + emitted JS).
   * Adding the source `js/` and `src/browser/` directories captures any
   * class strings that survive minification but were rewritten in the
   * built bundles. */
  const htmlFiles = await walk(distDir, htmlExts);
  const jsFiles = await walk(distDir, jsExts);
  const srcJs = await walk(path.join(projectRoot, 'js'), jsExts);
  const srcTs = await walk(path.join(projectRoot, 'src', 'browser'), new Set(['.ts']));

  if (htmlFiles.length === 0) {
    throw new Error(
      `[purge-css] No HTML files found under ${distDir}. ` +
        `Run \`npm run build\` first.`,
    );
  }

  /* Stylesheets to purge.  We only purge the two targets actually
   * shipped to S3: the legacy root `dist/styles.css` and the Vite-hashed
   * `dist/assets/styles-*.css`.  Component sub-stylesheets are inlined
   * into one of those by Vite's CSS bundler, so they don't need a
   * separate pass. */
  const cssCandidates = await walk(distDir, cssExts);
  const cssTargets = cssCandidates.filter((file) => {
    const rel = path.relative(distDir, file);
    return (
      rel === 'styles.css' ||
      /^assets[/\\]styles-[A-Za-z0-9_-]+\.css$/.test(rel)
    );
  });

  if (cssTargets.length === 0) {
    throw new Error(
      `[purge-css] No styles.css targets found under ${distDir}. ` +
        `Expected dist/styles.css or dist/assets/styles-*.css.`,
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
      content: [
        ...htmlFiles.map((f) => ({ raw: '', extension: 'html', filename: f })),
        ...jsFiles.map((f) => ({ raw: '', extension: 'js', filename: f })),
        ...srcJs.map((f) => ({ raw: '', extension: 'js', filename: f })),
        ...srcTs.map((f) => ({ raw: '', extension: 'ts', filename: f })),
      ].map(({ filename }) => filename),
      css: [cssPath],
      safelist,
      defaultExtractor: (content) =>
        content.match(/[A-Za-z0-9_-]+/g) ?? [],
      keyframes: false, // safelisted .* above
      fontFace: true, // remove unused @font-face
      variables: false, // safelisted -- above (preserve theme tokens)
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
