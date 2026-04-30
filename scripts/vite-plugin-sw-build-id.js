/**
 * vite-plugin-sw-build-id
 *
 * Substitutes the `__BUILD_ID__` placeholder in `public/sw.js` with a
 * short, per-build unique identifier when emitting `dist/sw.js`. The
 * substituted file body therefore differs on every push, which is the
 * trigger the browser uses to detect a service-worker update — without
 * this rotation, every PR-merge content deploy would ship the same
 * `sw.js` and the SW would never update, leaving the in-cache HTML
 * pinned to whatever build the user first installed.
 *
 * ## Why not use `package.json` `version`?
 *
 * `version` only changes on releases (occasional, manual, used to
 * publish updated API docs / test results / release notes). Content
 * (news articles, sitemaps, RSS, regenerated indexes, dashboards)
 * ships on every PR merge. A version-pinned cache name would stay
 * constant across dozens of content pushes between releases, and the
 * `activate`-purge eviction step in `public/sw.js` would never run.
 *
 * ## BUILD_ID resolution order
 *
 * 1. `process.env.GITHUB_SHA` (short form) — present on every
 *    GitHub Actions run; for `deploy-s3.yml` this is the merge-commit
 *    SHA of the PR that triggered the deploy. **Primary signal.**
 * 2. `git rev-parse --short=12 HEAD` — local builds, `release.yml`
 *    runs without `GITHUB_SHA`, and any environment where step 1
 *    is unavailable.
 * 3. `Date.now().toString(36)` — final fallback for sandboxed CI
 *    contexts without a git repo. Guarantees uniqueness; less
 *    debuggable but never collides.
 *
 * ## Where else to use `BUILD_ID`
 *
 * Only `dist/sw.js`. The chrome / footer / JSON-LD `softwareVersion`
 * markers in HTML pages keep using `process.env.npm_package_version`
 * because those values are user-facing release identifiers, not
 * cache-busting tokens.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Resolve the BUILD_ID for this build run.
 *
 * @returns {string}
 */
function resolveBuildId() {
  const shaEnv = process.env.GITHUB_SHA;
  if (shaEnv && /^[0-9a-f]+$/i.test(shaEnv)) {
    return shaEnv.slice(0, 12);
  }

  try {
    const out = execSync('git rev-parse --short=12 HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim();
    if (/^[0-9a-f]+$/i.test(out) && out.length >= 7) {
      return out;
    }
  } catch {
    /* git not available, fall through */
  }

  return `t${Date.now().toString(36)}`;
}

/**
 * Vite plugin factory.
 *
 * @param {{ projectRoot: string, outDir?: string }} options
 * @returns {import('vite').Plugin}
 */
export default function swBuildIdPlugin(options) {
  const { projectRoot, outDir = 'dist' } = options;

  return {
    name: 'sw-build-id',
    apply: 'build',
    enforce: 'post',

    closeBundle: {
      // After Vite/Rollup and `static-pages-emit` have finished, so the
      // `dist/sw.js` we write here is the canonical one shipped to S3.
      order: 'post',
      sequential: true,
      handler() {
        const buildId = resolveBuildId();
        const distDir = path.isAbsolute(outDir)
          ? outDir
          : path.join(projectRoot, outDir);

        const srcPath = path.join(projectRoot, 'public', 'sw.js');
        const destPath = path.join(distDir, 'sw.js');

        if (!fs.existsSync(srcPath)) {
          throw new Error(
            `[sw-build-id] Source service worker not found at ${srcPath}`,
          );
        }

        const src = fs.readFileSync(srcPath, 'utf8');
        if (!src.includes('__BUILD_ID__')) {
          throw new Error(
            `[sw-build-id] public/sw.js is missing the __BUILD_ID__ ` +
              `placeholder. Expected literal "__BUILD_ID__" so the build ` +
              `can substitute the per-build cache identifier.`,
          );
        }

        // Replace ALL occurrences (defensive — even though there's only
        // one today, future edits could add more without realising).
        const out = src.split('__BUILD_ID__').join(buildId);

        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.writeFileSync(destPath, out, 'utf8');

        console.log(
          `[sw-build-id] emitted dist/sw.js with BUILD_ID=${buildId}`,
        );
      },
    },
  };
}
