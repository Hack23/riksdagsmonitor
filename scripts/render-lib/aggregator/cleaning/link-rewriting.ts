/**
 * @module Infrastructure/RenderLib/Aggregator/Cleaning/LinkRewriting
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Relative link → absolute GitHub blob URL rewriting
 *
 * @description
 * Rewrites every relative `[label](path.md)` link in aggregated markdown
 * to an absolute GitHub blob URL. The rendered HTML lives at a different
 * path than the source artifacts, so every link must be auditable back to
 * GitHub. Leaves absolute `http(s)://…` links, fragment-only links and
 * `mailto:` links untouched.
 *
 * Extracted from `structural.ts` to maintain the ≤200 LOC single-
 * responsibility constraint.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import path from 'path';

import { GITHUB_BLOB } from '../../constants.js';

/**
 * Rewrite relative `[label](path.md)` links in the aggregated markdown to
 * absolute GitHub blob URLs — the rendered HTML lives at a different path
 * than the source artifacts, so every link must be auditable back to
 * GitHub. Leaves absolute `http(s)://…` links, fragment-only links and
 * `mailto:` links untouched.
 */
export function rewriteRelativeLinks(body: string, subfolderRepoRelPath: string): string {
  return body.replace(
    /\]\((?!https?:\/\/|#|mailto:)([^)]+)\)/g,
    (_match, target: string) => {
      const [pathPart, anchor] = target.split('#', 2) as [string, string | undefined];
      if (!pathPart) return `](${target})`;
      const resolved = path.posix.normalize(
        path.posix.join(subfolderRepoRelPath, pathPart),
      );
      const href = `${GITHUB_BLOB}/${resolved}` + (anchor ? `#${anchor}` : '');
      return `](${href})`;
    },
  );
}
