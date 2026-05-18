/**
 * @module scripts/agentic/gate-shared/file-walkers
 * @description Shared filesystem walkers used by multiple gate checks
 *              (currently the recursive stub scanner, but extracted here
 *              so any future check needing a recursive `.md` walk can
 *              reuse the same implementation rather than duplicating it).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Recursively collect all `.md` files under a directory, returning paths
 * relative to `baseDir`. Used by the stub scanner to mirror the canonical
 * gate's recursive grep over the entire analysis tree.
 */
export async function collectMdFilesRecursive(
  baseDir: string,
  prefix: string,
): Promise<string[]> {
  const results: string[] = [];
  const currentDir = prefix ? join(baseDir, prefix) : baseDir;
  if (!existsSync(currentDir)) return results;
  const entries = await readdir(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...(await collectMdFilesRecursive(baseDir, relPath)));
    } else if (entry.name.endsWith('.md')) {
      results.push(relPath);
    }
  }
  return results;
}
