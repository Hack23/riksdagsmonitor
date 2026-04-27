/**
 * @module Infrastructure/RenderLib/Aggregator/SourcesAppendix
 * @category Intelligence Operations / Supporting Infrastructure
 * @name `## Article Sources` markdown appendix builder
 *
 * @description
 * Builds the canonical `## Article Sources` block at the end of every
 * aggregated article. Replaces the legacy per-section
 * `_Source: file.md_` italics that used to read like a folder listing
 * under every heading; each entry now links to the raw artifact on
 * GitHub for full audit traceability.
 *
 * Pure string builder, no filesystem access.
 *
 * Round-5 split: extracted from the 1205-LOC `render-lib/aggregator.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import { buildGithubBlobUrl } from '../url-helpers.js';

/**
 * Build the `## Article Sources` markdown appendix listing every
 * artifact consumed by the aggregator. Returns `null` when `used` is
 * empty so the caller can omit the section entirely.
 *
 * Each entry is an unordered-list item linking the artifact filename
 * (rendered as inline code) to its absolute GitHub blob URL.
 */
export function buildSourcesAppendix(
  used: readonly string[],
  subfolderRepoRelPath: string,
): string | null {
  if (used.length === 0) return null;
  const sourceLines = used.map((file) => {
    const url = buildGithubBlobUrl(`${subfolderRepoRelPath}/${file}`);
    return `- [\`${file}\`](${url})`;
  });
  return [
    '## Article Sources',
    '',
    'Each section above projects one analysis artifact. The full audited markdown is available on GitHub:',
    '',
    ...sourceLines,
  ].join('\n');
}
