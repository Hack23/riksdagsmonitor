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
 * **SRI is NOT preserved** — rewriting CSS/JS bytes invalidates any
 * `integrity="sha384-…"` attributes that `vite-plugin-sri-gen` injected
 * at build time. The `deploy-s3.yml` pipeline therefore runs
 * `scripts/update-sri.ts` immediately after this minify pass to
 * re-compute and rewrite those attributes; without that follow-up
 * step browsers would block the stylesheet on every page load.
 *
 * Skips:
 *   - any source map (`*.map`) — already minified JSON, and rewriting
 *     would break the `//# sourceMappingURL=…` lookup;
 *   - any file with `.min.` in the basename — already minified;
 *   - the `cia-data/`, `dashboards/.*\\.csv`, `docs/coverage/` and
 *     `docs/test-results/` payloads, which are not text the runtime
 *     minifier knows how to compress.
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
 * Recursively collect every minifiable file under `dir`.  Skips
 * already-minified `*.min.*` files and source maps.
 */
async function collect(
  dir: string,
  exts: ReadonlySet<string>,
  out: string[],
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
      await collect(full, exts, out);
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
