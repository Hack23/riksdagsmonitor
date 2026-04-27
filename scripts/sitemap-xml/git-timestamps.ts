/**
 * @module Infrastructure/SitemapXml/GitTimestamps
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Git-history timestamp cache
 *
 * @description
 * Preloads `git log --name-only` output into an in-memory `Map<string,
 * string>` keyed by repo-relative file path. Provides `getFileModTime`
 * which prefers the cached git timestamp and falls back to filesystem
 * mtime when git is unavailable. This makes sitemap `<lastmod>` values
 * deterministic across CI runs as long as the commit graph is identical.
 *
 * Round-6 split: extracted from `scripts/generate-sitemap.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..', '..');

/**
 * Cache of git commit timestamps keyed by repo-relative file path.
 * Populated once on first access via `loadGitTimestamps()` to avoid
 * per-file `git log` invocations.
 */
const gitTimestampCache = new Map<string, string>();
let gitTimestampsLoaded = false;

/**
 * Preload git commit timestamps for every tracked file in a single
 * `git log --name-only` invocation. The cache stores only the most
 * recent commit timestamp per file. Idempotent — safe to call multiple
 * times. On failure (e.g. shallow clone, git unavailable) it logs a
 * warning and lets `getFileModTime` fall back to `fs.statSync`.
 */
export function loadGitTimestamps(): void {
  if (gitTimestampsLoaded) return;
  gitTimestampsLoaded = true;
  try {
    const output = execSync('git log --format="COMMIT %cI" --name-only --diff-filter=ACMR', {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024,
    });
    let currentTimestamp = '';
    for (const line of output.split('\n')) {
      if (line.startsWith('COMMIT ')) {
        currentTimestamp = new Date(line.substring(7)).toISOString();
      } else if (line.trim() && currentTimestamp) {
        if (!gitTimestampCache.has(line)) {
          gitTimestampCache.set(line, currentTimestamp);
        }
      }
    }
  } catch (_error: unknown) {
    console.warn('⚠️ Git timestamps unavailable — falling back to filesystem mtime');
  }
}

/**
 * Resolve the most recent modification time for a file. Prefers the git
 * commit timestamp (deterministic across machines / CI runners); falls
 * back to filesystem mtime, then to the current ISO timestamp as a last
 * resort. Always returns an ISO-8601 string.
 */
export function getFileModTime(filePath: string): string {
  loadGitTimestamps();
  const relativePath = path.relative(ROOT_DIR, filePath).split(path.sep).join('/');
  const cached = gitTimestampCache.get(relativePath);
  if (cached) return cached;
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString();
  } catch (_error: unknown) {
    return new Date().toISOString();
  }
}
