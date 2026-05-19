/**
 * @module scripts/validators/article/rules/required-artifacts
 * @description Per-type `extraArtifacts` filesystem-presence rule.
 *
 *              Rule census: extracted from
 *              `scripts/validate-article.ts` lines 616–637
 *              (extraArtifacts presence block). Logic is byte-identical
 *              to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readdir } from 'node:fs/promises';
import { relative } from 'node:path';

import { getBySubfolder } from '../../../render-lib/article-types.js';
import { REPO_ROOT, type ArticleViolation } from '../types.js';

/** Verify every `extraArtifacts` entry registered for the article type exists on disk. */
export async function checkRequiredArtifacts(
  rel: string,
  parentDir: string,
  subfolderName: string,
): Promise<ArticleViolation[]> {
  const typeEntry = getBySubfolder(subfolderName);
  const extraArtifacts = typeEntry?.extraArtifacts ?? [];
  if (extraArtifacts.length === 0) return [];
  let filesOnDisk: Set<string>;
  try {
    filesOnDisk = new Set(await readdir(parentDir));
  } catch {
    filesOnDisk = new Set<string>();
  }
  const out: ArticleViolation[] = [];
  for (const required of extraArtifacts) {
    if (!filesOnDisk.has(required)) {
      out.push({
        file: rel,
        code: 'missing-required-artifact',
        message: `Article type "${typeEntry!.id}" requires artifact "${required}" but it is missing from ${relative(REPO_ROOT, parentDir)}/. Add the artifact or update the registry.`,
      });
    }
  }
  return out;
}
