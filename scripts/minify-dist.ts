/**
 * Minify every HTML / CSS / JS file under `dist/` in place.
 *
 * Replacement for the `dra1ex/minify-action` Docker action — same
 * underlying [`minify`](https://github.com/coderaiser/minify) package
 * (now v15.x) but executed directly on the runner host so deploy-s3
 * needs no Docker pull, no apt-get / moreutils install, and no
 * workspace staging.
 *
 * Filenames and paths are preserved (this script only rewrites file
 * contents), so all `<link href="…">` / `<script src="…">` references,
 * CloudFront origin paths and S3 cache headers continue to work
 * unchanged.
 *
 * **No SRI rewrite is needed** — `vite-plugin-sri-gen` was removed
 * from `vite.config.js` and `vite-plugin-static-pages.js` no longer
 * stamps `integrity` attributes onto first-party `<link>` tags
 * (per the platform "trust S3 / CloudFront" classification). This
 * script can therefore freely rewrite CSS/JS bytes without breaking
 * any cached HTML page.
 *
 * Skips:
 *   - whole directories matched by `SKIP_DIRS` (`node_modules`, `.git`,
 *     `.vite`, `cia-data`, `coverage`, `test-results`) — none of these
 *     ship runtime-minifiable text;
 *   - whole subtrees matched by `SKIP_SUBPATHS`:
 *       • the vendored Mermaid ESM bundle under `js/lib/mermaid/`.
 *         Mermaid ships pre-optimized chunks (`chunk-*.mjs` and the
 *         entry `mermaid.esm.min.mjs`); only the entry carries the
 *         `.min.` basename marker, so a path-based skip is required
 *         to also exclude the chunk graph. Re-running
 *         `coderaiser/minify` over those chunks risks corrupting
 *         `import.meta.url` semantics and the dynamic-import graph
 *         the Mermaid runtime depends on (regression observed after
 *         PR #2428).
 *       • every Vite/esbuild-bundled JS chunk under `assets/js/`.
 *         These are already esbuild-minified at build time
 *         (`vite.config.js → build.minify: 'esbuild'`), so re-running
 *         `coderaiser/minify` yields zero compression while actively
 *         CORRUPTING valid JS: `@putout/minify` strips outer parens
 *         around a comma-expression initializer in a `var` declarator
 *         (`var n=A, r=(B, this.method())` → `var n=A, r=B, this.method()`),
 *         which is no longer a valid var declaration. That regression
 *         broke `assets/js/papa-*.js` (PapaParse `Streamer.parseChunk`)
 *         and via the import chain ALL 9 CIA dashboards on every one
 *         of the 14 language hub pages.
 *   - any file whose extension is not in the target set (`.html`,
 *     `.css`, `.js`, `.mjs`) — so JSON, CSV, images, fonts, source
 *     maps and the like are simply never collected by `collect()`;
 *   - explicitly: source maps (`*.map`) and any file with `.min.` in
 *     the basename (e.g. `mermaid.esm.min.mjs`) — already minified.
 *
 * Files that fail to parse are left untouched (and a warning is
 * printed) so a single broken page never aborts the entire deploy.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { minify } from 'minify';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

interface MinifyStat {
  ext: string;
  files: number;
  before: number;
  after: number;
  failed: number;
}

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.vite',
  'cia-data',
  'coverage',
  'test-results',
]);

/**
 * POSIX-style relative subpaths under `distDir` whose contents must
 * never be re-minified. Stored as POSIX so the comparison works
 * identically on Linux runners and Windows dev machines after
 * normalising candidate paths via `split(path.sep).join('/')`.
 *
 * Currently:
 *   - `js/lib/mermaid` — vendored Mermaid ESM bundle. Mermaid ships
 *     pre-optimized chunks (`chunk-*.mjs`) that don't carry the
 *     `.min.` basename marker, so the per-file `.min.` skip alone
 *     leaves them in scope.  Re-running `coderaiser/minify` over
 *     those chunks risks corrupting the dynamic-import graph.
 *   - `assets/js` — Vite/esbuild-bundled application chunks
 *     (`assets/js/*.js`).  These are ALREADY esbuild-minified at
 *     build time (vite.config.js sets `build.minify: 'esbuild'`),
 *     so re-running `coderaiser/minify` (which uses
 *     `@putout/minify` under the hood) yields zero compression
 *     while actively CORRUPTING valid JS.  Specifically,
 *     `@putout/minify` strips the outer parentheses from a
 *     comma-expression initializer in a `var` declarator, so
 *     valid `var n=A, r=(B, C);` becomes invalid
 *     `var n=A, r=B, C;` — when `C` is a method call
 *     (`this._handle.parse(...)`), the browser refuses to parse
 *     the module with `SyntaxError: Unexpected token 'this'`.
 *     That bug broke every CIA dashboard chunk that imports
 *     `assets/js/papa-*.js` (PapaParse — the failing fragment is
 *     in `Streamer.parseChunk`).  Skipping the whole subtree is
 *     the only safe option: every file under `assets/js/` is a
 *     Vite-bundled output (esbuild minified, source-mapped,
 *     content-hashed), and no other tool ever needs to read or
 *     mutate those bytes after Vite has emitted them.
 *   - `docs/test-results` — Playwright HTML report. Its
 *         `html/assets/index-*.js` bundles are ALREADY esbuild-minified
 *         and, worse, contain a construct that sends `@putout/minify`
 *         into a pathological >2-minute-per-file stall (observed on all
 *         six ~760 KB bundles). With a 10-way worker pool that hung the
 *         entire "Minify HTML/CSS/JS" step long enough for the deploy-s3
 *         job to be cancelled (runs 1961–1971). The report is a static
 *         autogenerated artifact — re-minifying it buys nothing.
 *   - `docs/coverage` — lcov HTML coverage report. Also autogenerated,
 *         never hand-edited, and safe to skip for the same reason.
 */
const SKIP_SUBPATHS = new Set([
  'js/lib/mermaid',
  'assets/js',
  'docs/test-results',
  'docs/coverage',
]);

/**
 * Walk `dir` (rooted at `distDir`) and return true when the
 * directory's relative POSIX path under `distDir` matches a
 * `SKIP_SUBPATHS` entry exactly.
 */
function isSkippedSubpath(distDir: string, dir: string): boolean {
  if (dir === distDir) return false;
  const rel = path.relative(distDir, dir).split(path.sep).join('/');
  return SKIP_SUBPATHS.has(rel);
}

/**
 * Recursively collect every minifiable file under `dir`.  Skips
 * already-minified `*.min.*` files, source maps, and any directory
 * whose path is in `SKIP_SUBPATHS` (relative to `distRoot`).
 */
async function collect(
  dir: string,
  exts: ReadonlySet<string>,
  out: string[],
  distRoot: string = dir,
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
      if (SKIP_DIRS.has(entry.name)) continue;
      if (isSkippedSubpath(distRoot, full)) continue;
      await collect(full, exts, out, distRoot);
    } else if (entry.isFile()) {
      const lower = entry.name.toLowerCase();
      if (lower.endsWith('.map')) continue;
      // Treat *.min.* files as already minified (covers .min.css,
      // .min.js, .min.mjs, .min.html — e.g. mermaid.esm.min.mjs).
      if (lower.includes('.min.')) continue;
      const ext = path.extname(lower);
      if (exts.has(ext)) out.push(full);
    }
  }
  return out;
}

function fmtKb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

async function run(distDir: string): Promise<void> {
  if (!(await fs.stat(distDir).catch(() => null))?.isDirectory()) {
    throw new Error(`[minify-dist] ${distDir} is not a directory`);
  }
  const exts = new Set(['.html', '.css', '.js', '.mjs']);
  const files = await collect(distDir, exts, []);
  console.log(
    `🗜️  Minifying ${files.length} files under ${path.relative(projectRoot, distDir) || '.'}…`,
  );

  /** Aggregate per-extension stats for the summary line. */
  const stats = new Map<string, MinifyStat>();
  const bumpStat = (
    ext: string,
    before: number,
    after: number,
    failed = false,
  ): void => {
    const cur = stats.get(ext) ?? {
      ext,
      files: 0,
      before: 0,
      after: 0,
      failed: 0,
    };
    cur.files += 1;
    cur.before += before;
    cur.after += after;
    if (failed) cur.failed += 1;
    stats.set(ext, cur);
  };

  /* Process sequentially in batches to keep peak memory bounded — the
   * homepage corpus is ~5 000 HTML files, each up to 200 KiB.  10
   * concurrent minifies cap memory at well under the runner's 7 GB. */
  const concurrency = 10;
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < files.length) {
      const file = files[cursor++];
      if (file === undefined) return;
      const ext = path.extname(file).toLowerCase();
      let before = 0;
      try {
        before = (await fs.stat(file)).size;
        const minified = await minify(file);
        if (typeof minified !== 'string') {
          bumpStat(ext, before, before, true);
          console.warn(
            `  ⚠ ${path.relative(projectRoot, file)}: minify returned non-string output`,
          );
          continue;
        }
        await fs.writeFile(file, minified, 'utf8');
        bumpStat(ext, before, Buffer.byteLength(minified, 'utf8'));
      } catch (err) {
        bumpStat(ext, before, before, true);
        console.warn(
          `  ⚠ ${path.relative(projectRoot, file)}: ${(err as Error).message}`,
        );
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  let totalBefore = 0;
  let totalAfter = 0;
  let totalFailed = 0;
  for (const s of stats.values()) {
    totalBefore += s.before;
    totalAfter += s.after;
    totalFailed += s.failed;
    const saved = s.before - s.after;
    const pct = s.before > 0 ? ((saved / s.before) * 100).toFixed(1) : '0.0';
    console.log(
      `  • ${s.ext}: ${s.files} files, ${fmtKb(s.before)} → ${fmtKb(s.after)} ` +
        `(saved ${fmtKb(saved)}, ${pct}%, ${s.failed} failed)`,
    );
  }
  const totalSaved = totalBefore - totalAfter;
  const totalPct =
    totalBefore > 0 ? ((totalSaved / totalBefore) * 100).toFixed(1) : '0.0';
  console.log(
    `✅ Minify complete: ${fmtKb(totalBefore)} → ${fmtKb(totalAfter)} ` +
      `(saved ${fmtKb(totalSaved)}, ${totalPct}%, ${totalFailed} failed)`,
  );
}

async function main(): Promise<void> {
  const distArg = process.argv[2] ?? path.join(projectRoot, 'dist');
  const distDir = path.resolve(distArg);
  await run(distDir);
}

const isMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error('[minify-dist]', err);
    process.exit(1);
  });
}

export { run };
