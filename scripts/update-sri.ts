/**
 * Re-compute SRI integrity hashes for the hashed CSS bundle after the
 * deploy-time purge + minify passes have rewritten its content.
 *
 * Background
 * ----------
 * `scripts/vite-plugin-static-pages.js` computes `sha384-<base64>` of
 * `dist/assets/styles-*.css` at build time and injects it as
 *   `integrity="sha384-<HASH>"  crossorigin="anonymous"`
 * into every `<link rel="stylesheet" …>` emitted by the static-pages
 * plugin.  After `scripts/purge-css.ts` and `scripts/minify-dist.ts`
 * rewrite that stylesheet, the stored hash is stale.  Browsers enforce
 * SRI by blocking the resource when the hash doesn't match — so every
 * page would silently lose its stylesheet if this step were omitted.
 *
 * This script:
 *   1. Finds `dist/assets/styles-*.css` (exactly one file expected).
 *   2. Computes its fresh `sha384` digest.
 *   3. Walks every `dist/**\/*.html` file.
 *   4. Replaces every `integrity="sha384-<OLD>"` in a `<link>` tag whose
 *      `href` references the hashed stylesheet with the new digest.
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
): Promise<'updated' | 'current' | 'absent'> {
  const original = await fs.readFile(htmlPath, 'utf8');
  // Match href="…<cssBasename>…" … integrity="sha384-…" inside a <link> tag.
  const escapedName = cssBasename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const linkTagRe = new RegExp(
    `(<link\\b[^>]*\\bhref\\s*=\\s*"[^"]*${escapedName}[^"]*"[^>]*)` +
      `(integrity\\s*=\\s*")sha384-[A-Za-z0-9+/=]+(")`,
    'gi',
  );
  if (!linkTagRe.test(original)) return 'absent';
  // Reset lastIndex after the test()
  linkTagRe.lastIndex = 0;
  const updated = original.replace(
    linkTagRe,
    (_m: string, p1: string, p2: string, p3: string) =>
      `${p1}${p2}${newIntegrity}${p3}`,
  );
  if (updated === original) return 'current';
  await fs.writeFile(htmlPath, updated, 'utf8');
  return 'updated';
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
    `href="[^"]*${cssBasename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"]*"[^>]*integrity="sha384-([A-Za-z0-9+/=]+)"`,
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
  let updatedHtml = 0;  // files where integrity was replaced with a new hash
  let currentHtml = 0; // files that already had the correct hash (no write needed)
  let skippedHtml = 0; // files with no reference to this stylesheet
  const concurrency = 20;
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < htmlFiles.length) {
      const f = htmlFiles[cursor++];
      if (f === undefined) return;
      const status = await updateIntegrityInFile(f, cssBasename, newIntegrity);
      if (status === 'updated') updatedHtml++;
      else if (status === 'current') currentHtml++;
      else skippedHtml++;
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
