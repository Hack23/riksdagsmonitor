/**
 * @module Infrastructure/RenderLib/UrlHelpers
 * @category Intelligence Operations / Supporting Infrastructure
 * @name GitHub URL builders for article provenance
 *
 * @description
 * Zero-dependency URL builders used by the aggregator and article
 * renderer to produce absolute `https://github.com/.../blob/main/...`
 * and `.../tree/main/...` links for every analysis artifact referenced
 * from a rendered article. Extracted from the former monolithic
 * `render-lib/index.ts` (Round-4 architecture split) so that the
 * aggregator and chrome modules can import these without pulling in
 * the full remark/rehype markdown pipeline.
 *
 * @see ../analysis-references.ts — consumer that uses these helpers to
 *      emit the "Analysis sources" footer block.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { GITHUB_BLOB, GITHUB_TREE } from './constants.js';

/**
 * Build an absolute GitHub `blob` URL for a repo-relative path. Leading
 * slashes in the input are stripped so either `foo/bar.md` or
 * `/foo/bar.md` produces the same canonical result.
 *
 * @example
 * ```ts
 * buildGithubBlobUrl('analysis/daily/2026-04-24/propositions/article.md');
 * // → 'https://github.com/Hack23/riksdagsmonitor/blob/main/analysis/daily/2026-04-24/propositions/article.md'
 * ```
 */
export function buildGithubBlobUrl(repoRelativePath: string): string {
  return `${GITHUB_BLOB}/${repoRelativePath.replace(/^\/+/, '')}`;
}

/**
 * Build an absolute GitHub `tree` URL for a repo-relative directory. Same
 * normalisation rules as {@link buildGithubBlobUrl}; use this for folders.
 *
 * @example
 * ```ts
 * buildGithubTreeUrl('analysis/daily/2026-04-24/propositions');
 * // → 'https://github.com/Hack23/riksdagsmonitor/tree/main/analysis/daily/2026-04-24/propositions'
 * ```
 */
export function buildGithubTreeUrl(repoRelativePath: string): string {
  return `${GITHUB_TREE}/${repoRelativePath.replace(/^\/+/, '')}`;
}
