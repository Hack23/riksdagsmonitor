/**
 * @module copy-vendor-mermaid
 * @description Copies the Mermaid distribution from `node_modules/mermaid/dist/`
 *              into `js/lib/mermaid/` so the site can serve Mermaid from its own
 *              S3/CloudFront origin instead of an external CDN
 *              (`cdn.jsdelivr.net`).
 *
 *              This script is invoked as part of `prebuild` in `package.json`.
 *              The `js/` directory is merged into `dist/js/` by
 *              `.github/workflows/deploy-s3.yml`, and `scripts/deploy-s3.sh`
 *              uploads `.mjs` files with `Content-Type: application/javascript`
 *              and `Cache-Control: public, max-age=31536000, immutable`.
 *
 *              Generated files under `js/lib/mermaid/` are gitignored — they
 *              are reproducible from the pinned `mermaid` devDependency in
 *              `package.json` (Open_Source_Policy.md §3 / supply-chain rule:
 *              vendored copies must trace back to a pinned npm SBOM entry).
 *
 *              ISMS rationale: removing the runtime dependency on
 *              `cdn.jsdelivr.net` shrinks the trust boundary documented in
 *              `THREAT_MODEL.md` (no third-party script-src), simplifies the
 *              CSP (no `cdn.jsdelivr.net` allowlist entry needed for JS),
 *              and aligns with the `Cryptography_Policy.md` SRI requirement
 *              by allowing `vite-plugin-sri-gen` to hash every Mermaid asset.
 *
 * @example
 *   npx tsx scripts/copy-vendor-mermaid.ts
 *
 * @see js/lib/mermaid-init.mjs
 * @see .github/workflows/deploy-s3.yml
 * @see scripts/deploy-s3.sh
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const SOURCE = resolve(REPO_ROOT, 'node_modules', 'mermaid', 'dist');
const TARGET = resolve(REPO_ROOT, 'js', 'lib', 'mermaid');

const QUIET = process.argv.includes('--quiet');
function log(msg: string): void {
  if (!QUIET) console.log(msg);
}

/**
 * Recursively copy `.mjs` runtime files from a directory tree, preserving
 * structure but excluding sourcemaps, type declarations, test mocks, and any
 * non-runtime artefacts.
 *
 * Uses synchronous APIs because the script runs at the start of `prebuild`
 * and must complete before Vite begins processing assets.
 */
function copyTree(src: string, dst: string): number {
  if (!existsSync(dst)) mkdirSync(dst, { recursive: true });
  let count = 0;
  for (const entry of readdirSync(src)) {
    // Skip non-runtime artefacts: source maps, type declarations, test mocks.
    if (entry.endsWith('.map')) continue;
    if (entry.endsWith('.d.ts')) continue;
    if (entry === '__mocks__') continue;
    if (entry.endsWith('.spec.d.ts')) continue;
    const s = join(src, entry);
    const d = join(dst, entry);
    const st = statSync(s);
    if (st.isDirectory()) {
      count += copyTree(s, d);
    } else if (st.isFile()) {
      // Only copy ESM runtime files actually loaded by the browser.
      if (!entry.endsWith('.mjs')) continue;
      copyFileSync(s, d);
      count += 1;
    }
  }
  return count;
}

/**
 * Copy only the production ESM bundle (`mermaid.esm.min.mjs` + its chunks)
 * — the unminified ESM bundle, CommonJS bundle, and `mermaid.core` variant
 * are all unused by the article renderer's loader and would unnecessarily
 * inflate the S3 footprint.
 */
function copyMermaidRuntime(): number {
  let count = 0;
  // 1. Top-level entry point.
  if (!existsSync(TARGET)) mkdirSync(TARGET, { recursive: true });
  copyFileSync(join(SOURCE, 'mermaid.esm.min.mjs'), join(TARGET, 'mermaid.esm.min.mjs'));
  count += 1;
  // 2. Chunks the entry dynamically imports.
  const chunksSrc = join(SOURCE, 'chunks', 'mermaid.esm.min');
  const chunksDst = join(TARGET, 'chunks', 'mermaid.esm.min');
  if (existsSync(chunksSrc)) {
    count += copyTree(chunksSrc, chunksDst);
  } else {
    console.error(
      `❌ copy-vendor-mermaid: missing chunks directory ${relative(REPO_ROOT, chunksSrc)}.`,
    );
    process.exit(1);
  }
  return count;
}

function main(): void {
  if (!existsSync(SOURCE)) {
    console.error(
      `❌ copy-vendor-mermaid: source not found: ${relative(REPO_ROOT, SOURCE)}\n` +
        `   Run \`npm ci\` so the pinned mermaid devDependency is installed.`,
    );
    process.exit(1);
  }
  const required = join(SOURCE, 'mermaid.esm.min.mjs');
  if (!existsSync(required)) {
    console.error(
      `❌ copy-vendor-mermaid: missing required entry point ${relative(REPO_ROOT, required)}.\n` +
        `   This usually means the installed mermaid version no longer ships an ESM build.\n` +
        `   Re-pin mermaid in package.json or update this copy script.`,
    );
    process.exit(1);
  }
  const copied = copyMermaidRuntime();
  log(`📦 copy-vendor-mermaid: copied ${copied} files → ${relative(REPO_ROOT, TARGET)}/`);
}

main();
