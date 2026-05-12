/**
 * Re-compute SRI integrity hashes for hashed CSS and JS bundles after the
 * deploy-time purge + minify passes have rewritten their content.
 *
 * Background
 * ----------
 * `scripts/vite-plugin-static-pages.js` computes `sha384-<base64>` of
 * `dist/assets/styles-*.css` at build time and injects it as
 *   `integrity="sha384-<HASH>"  crossorigin="anonymous"`
 * into every `<link rel="stylesheet" …>` emitted by the static-pages
 * plugin.
 *
 * In parallel, `vite-plugin-sri-gen` injects integrity attributes on the
 * `<link rel="modulepreload" …>` tags Vite emits for hashed JS chunks
 * under `dist/assets/js/` (chunks like `dashboards/anomaly-detection-*.js`
 * pulled in by the homepage and dashboard pages).
 *
 * After `scripts/purge-css.ts` and `scripts/minify-dist.ts` rewrite both
 * the stylesheet and the JS chunks, every stored hash is stale.  Browsers
 * enforce SRI by blocking the resource when the hash doesn't match — so
 * pages would silently lose styling AND the homepage would block ~12
 * dashboard module preloads (see issue: "Browser errors were logged to
 * the console").
 *
 * This script:
 *   1. Finds `dist/assets/styles-*.css` (exactly one file expected) and
 *      every hashed JS chunk under `dist/assets/js/`.
 *   2. Computes fresh `sha384` digests for each.
 *   3. Walks every `dist/**\/*.html` file.
 *   4. Replaces every stale `integrity="sha384-<OLD>"` whose adjacent
 *      `href`/`src` attribute references one of the known hashed assets.
 *      Tags referencing other assets are left untouched.
 *
 * Filenames and paths are NOT changed, so CloudFront origin paths and the
 * S3 cache-control rules in `scripts/deploy-s3.sh` keep working.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

interface SriResult {
  cssFile: string;
  /** Full integrity attribute value (e.g. `sha384-…`) found in HTML. */
  oldIntegrity: string;
  /** Full integrity attribute value (e.g. `sha384-…`) written to HTML. */
  newIntegrity: string;
  updatedHtml: number;
  skippedHtml: number;
  /** Number of hashed JS chunks discovered under `dist/assets/js/`. */
  jsBundles: number;
  /** Number of `<link rel="modulepreload">` / `<script src=…>` integrity attrs rewritten. */
  jsIntegrityRewrites: number;
}

/**
 * Compute the base64-encoded SHA-384 digest of `buf`.
 * Mirrors the `sha384Base64` function in `vite-plugin-static-pages.js`.
 */
function sha384Base64(buf: Buffer): string {
  return createHash('sha384').update(buf).digest('base64');
}

/**
 * Walk `dir` recursively, collecting every `.html` file.
 */
async function collectHtml(dir: string, out: string[] = []): Promise<string[]> {
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
      )
        continue;
      await collectHtml(full, out);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Recursively collect every hashed JS bundle under `assetsJsDir`.
 * Returns paths relative to `assetsJsDir` (e.g. `anomaly-detection-BYmYhLL4.js`
 * or `nested/sub-XYZ.js`) so we can match them against `href="/assets/js/…"`.
 */
async function collectHashedJs(
  assetsJsDir: string,
  base = '',
  out: string[] = [],
): Promise<string[]> {
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(assetsJsDir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      await collectHashedJs(path.join(assetsJsDir, entry.name), rel, out);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.js')) {
      // Only keep files that look hashed: name-<hash>.js (Vite emits an 8-char
      // alphanumeric hash). This avoids touching unhashed assets (none expected
      // under assets/js/, but be defensive).
      if (/-[A-Za-z0-9_-]{6,}\.js$/i.test(entry.name)) {
        out.push(rel);
      }
    }
  }
  return out;
}

/**
 * Update the SRI `integrity` attribute for the given CSS basename in a
 * single HTML file.  Returns:
 *   - `'updated'`  when the file was rewritten with a new hash,
 *   - `'current'`  when the file already has the correct hash (no write needed),
 *   - `'absent'`   when the file has no reference to this stylesheet.
 *
 * Matches link tags of the form (produced by vite-plugin-static-pages.js):
 *   href="[optional ../]assets/styles-<hash>.css"
 *     integrity="sha384-<old-base64>"
 *     crossorigin="anonymous"
 *
 * Only the `integrity="…"` value is updated; every other attribute,
 * whitespace and quote style is left exactly as-is so the minifier
 * output is not disturbed.
 */
async function updateIntegrityInFile(
  htmlPath: string,
  cssBasename: string,
  newIntegrity: string,
  jsHashByBasename: ReadonlyMap<string, string>,
): Promise<{ status: 'updated' | 'current' | 'absent'; jsRewrites: number }> {
  const original = await fs.readFile(htmlPath, 'utf8');

  // ── CSS pass ────────────────────────────────────────────────────────────
  // Match href=["']?…<cssBasename>…["']? … integrity=["']?sha384-…["']?
  // inside a <link> tag.  The HTML minifier (coderaiser/minify) strips
  // quotes from attributes whose values contain no special characters,
  // so we must handle both quoted and unquoted forms.
  const escapedName = cssBasename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const linkTagRe = new RegExp(
    `(<link\\b[^>]*\\bhref\\s*=\\s*"?[^"\\s>]*${escapedName}[^"\\s>]*"?[^>]*)` +
      `(integrity\\s*=\\s*"?)sha384-[A-Za-z0-9+/=]+("?)`,
    'gi',
  );
  let next = original;
  const hasCssRef = linkTagRe.test(original);
  if (hasCssRef) {
    linkTagRe.lastIndex = 0;
    next = next.replace(
      linkTagRe,
      (_m: string, p1: string, p2: string, p3: string) =>
        `${p1}${p2}${newIntegrity}${p3}`,
    );
  }

  // ── JS pass ─────────────────────────────────────────────────────────────
  // Rewrite integrity for every <link rel="modulepreload" … integrity=…> or
  // <script src="…" … integrity=…> tag whose href/src basename matches a
  // hashed JS chunk under dist/assets/js/. Both quoted and unquoted forms
  // must be accepted (the minifier strips quotes).
  let jsRewrites = 0;
  if (jsHashByBasename.size > 0) {
    // One regex catches every <link>/<script> tag (with attrs in any order)
    // that carries an integrity attribute. We then inspect each match to
    // resolve its href/src basename and decide whether to substitute.
    const tagRe = /<(link|script)\b[^>]*\bintegrity\s*=\s*"?sha384-[A-Za-z0-9+/=]+"?[^>]*>/gi;
    next = next.replace(tagRe, (tag) => {
      const hrefMatch =
        /\bhref\s*=\s*"([^"]+)"/i.exec(tag) ??
        /\bhref\s*=\s*([^\s>]+)/i.exec(tag);
      const srcMatch =
        /\bsrc\s*=\s*"([^"]+)"/i.exec(tag) ??
        /\bsrc\s*=\s*([^\s>]+)/i.exec(tag);
      const url = hrefMatch?.[1] ?? srcMatch?.[1];
      if (!url) return tag;
      const basename = url.split('?')[0]!.split('#')[0]!.split('/').pop()!;
      const newHash = jsHashByBasename.get(basename);
      if (!newHash) return tag;
      const newAttr = `sha384-${newHash}`;
      const replaced = tag.replace(
        /(\bintegrity\s*=\s*)("?)sha384-[A-Za-z0-9+/=]+("?)/i,
        (_m, p1: string, q1: string, q2: string) => `${p1}${q1}${newAttr}${q2}`,
      );
      if (replaced !== tag) jsRewrites += 1;
      return replaced;
    });
  }

  if (next === original) {
    return {
      status: hasCssRef ? 'current' : 'absent',
      jsRewrites: 0,
    };
  }
  await fs.writeFile(htmlPath, next, 'utf8');
  return {
    status: hasCssRef ? 'updated' : 'absent',
    jsRewrites,
  };
}

export async function updateSri(distDir: string): Promise<SriResult> {
  /* 1. Find the hashed CSS bundle */
  const assetsDir = path.join(distDir, 'assets');
  let assetsEntries: string[];
  try {
    assetsEntries = await fs.readdir(assetsDir);
  } catch {
    throw new Error(
      `[update-sri] Cannot read ${assetsDir}. Run \`npm run build\` first.`,
    );
  }
  const styleFiles = assetsEntries.filter((f) =>
    /^styles-[A-Za-z0-9_-]+\.css$/.test(f),
  );
  if (styleFiles.length === 0) {
    throw new Error(
      `[update-sri] No styles-*.css found in ${assetsDir}. Build has not run or the plugin naming changed.`,
    );
  }
  if (styleFiles.length > 1) {
    throw new Error(
      `[update-sri] Multiple styles-*.css files found (${styleFiles.join(', ')}). Cannot determine canonical bundle.`,
    );
  }
  const cssBasename = styleFiles[0]!;
  const cssPath = path.join(assetsDir, cssBasename);

  /* 2. Compute fresh digest */
  const cssBuf = await fs.readFile(cssPath);
  const newHash = sha384Base64(cssBuf);
  const newIntegrity = `sha384-${newHash}`;

  /* 2b. Compute fresh digests for every hashed JS chunk under assets/js/.
   * Vite emits chunks like `assets/js/anomaly-detection-BYmYhLL4.js` and
   * `vite-plugin-sri-gen` injects an integrity attribute into the
   * `<link rel="modulepreload" …>` tag for each one. The minify pass
   * rewrites those JS bytes — every hash is therefore stale until we
   * recompute it here. */
  const assetsJsDir = path.join(assetsDir, 'js');
  const jsRelPaths = await collectHashedJs(assetsJsDir);
  const jsHashByBasename = new Map<string, string>();
  await Promise.all(
    jsRelPaths.map(async (rel) => {
      const buf = await fs.readFile(path.join(assetsJsDir, rel));
      jsHashByBasename.set(path.basename(rel), sha384Base64(buf));
    }),
  );

  /* 3. Scan HTML and count unique old hashes before rewriting */
  const htmlFiles = await collectHtml(distDir);
  if (htmlFiles.length === 0) {
    throw new Error(
      `[update-sri] No HTML files found under ${distDir}. Build has not run.`,
    );
  }

  /* Collect old integrity from the first file that has one (diagnostics) */
  let oldIntegrity = '(none found)';
  const HASH_SNIFF_RE = new RegExp(
    `href="?[^"\\s>]*${cssBasename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"\\s>]*"?[^>]*integrity="?sha384-([A-Za-z0-9+/=]+)"?`,
    'i',
  );
  for (const f of htmlFiles) {
    const sample = await fs.readFile(f, 'utf8');
    const m = HASH_SNIFF_RE.exec(sample);
    if (m) {
      oldIntegrity = `sha384-${m[1]}`;
      break;
    }
  }

  /* 4. Rewrite all HTML files in parallel (bounded by concurrency 20) */
  let updatedHtml = 0;  // files where CSS integrity was replaced with a new hash
  let currentHtml = 0; // files that already had the correct CSS hash (no write needed)
  let skippedHtml = 0; // files with no reference to this stylesheet
  let jsIntegrityRewrites = 0; // total number of JS modulepreload/script integrity attrs rewritten
  const concurrency = 20;
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < htmlFiles.length) {
      const f = htmlFiles[cursor++];
      if (f === undefined) return;
      const result = await updateIntegrityInFile(
        f,
        cssBasename,
        newIntegrity,
        jsHashByBasename,
      );
      if (result.status === 'updated') updatedHtml++;
      else if (result.status === 'current') currentHtml++;
      else skippedHtml++;
      jsIntegrityRewrites += result.jsRewrites;
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  /* Fail fast if no HTML references this stylesheet at all — this means either:
   *   a) No page links to the hashed stylesheet (corpus drift), or
   *   b) The HTML minifier changed quoting/attribute order and the regex
   *      no longer matches.
   * Either way, leaving stale integrity attributes in place would cause
   * every browser to block the stylesheet, so we must not silently succeed. */
  if (updatedHtml === 0 && currentHtml === 0) {
    throw new Error(
      `[update-sri] No HTML files reference ${cssBasename} with an integrity attribute. ` +
        `Integrity attributes may be stale. ` +
        `Check that at least one HTML page references this stylesheet ` +
        `with an integrity attribute.`,
    );
  }

  return {
    cssFile: path.relative(projectRoot, cssPath),
    oldIntegrity,
    newIntegrity,
    updatedHtml,
    skippedHtml,
    jsBundles: jsHashByBasename.size,
    jsIntegrityRewrites,
  };
}

async function main(): Promise<void> {
  const distArg = process.argv[2] ?? path.join(projectRoot, 'dist');
  const distDir = path.resolve(distArg);
  console.log(`🔐 Re-computing SRI hashes in ${distDir}…`);
  const result = await updateSri(distDir);
  console.log(`  CSS:           ${result.cssFile}`);
  console.log(`  Old integrity: ${result.oldIntegrity}`);
  console.log(`  New integrity: ${result.newIntegrity}`);
  console.log(`  HTML updated:  ${result.updatedHtml}`);
  console.log(`  HTML skipped (no ref): ${result.skippedHtml}`);
  console.log(`  JS bundles:    ${result.jsBundles}`);
  console.log(`  JS integrity rewrites: ${result.jsIntegrityRewrites}`);
  console.log('✅ SRI update complete');
}

const isMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error('[update-sri]', err);
    process.exit(1);
  });
}
