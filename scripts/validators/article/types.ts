/**
 * @module scripts/validators/article/types
 * @description Shared types + repo-root constant for the article
 *              validator subtree.
 *
 *              Rule census: extracted from
 *              `scripts/validate-article.ts` lines 45–56
 *              (`REPO_ROOT`, `ArticleViolation`). Logic is byte-identical
 *              to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { resolve } from 'node:path';
import process from 'node:process';

export const REPO_ROOT = resolve(process.cwd());

/**
 * A single rule failure on a single article. `code` is a stable
 * machine-readable identifier suitable for grep, dashboards, and
 * suppression workflows.
 */
export interface ArticleViolation {
  readonly file: string;
  readonly code: string;
  readonly message: string;
}
