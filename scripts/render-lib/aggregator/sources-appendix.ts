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
  supportingDataArtifacts: readonly string[] = [],
): string | null {
  if (used.length === 0 && supportingDataArtifacts.length === 0) return null;
  const sourceLines = used.map((file) => {
    const url = buildGithubBlobUrl(`${subfolderRepoRelPath}/${file}`);
    return `- [\`${file}\`](${url})`;
  });
  const lines = [
    '## Article Sources',
    '',
    'Each section above projects one analysis artifact. The full audited markdown is available on GitHub:',
    '',
    ...sourceLines,
  ];
  if (supportingDataArtifacts.length > 0) {
    lines.push(
      '',
      '### Supporting Data Artifacts',
      '',
      'These machine-readable artifacts are linked for auditability and are not expanded inline, preserving the reader-facing narrative order:',
      '',
      ...supportingDataArtifacts.map((file) => {
        const url = buildGithubBlobUrl(`${subfolderRepoRelPath}/${file}`);
        return `- [\`${file}\`](${url})`;
      }),
    );
  }
  return lines.join('\n');
}

export interface ArtifactCoverageReportInput {
  readonly emittedMarkdownArtifacts: readonly string[];
  readonly perDocumentArtifacts: readonly string[];
  readonly supportingDataArtifacts: readonly string[];
  readonly absentOrderedArtifacts: readonly string[];
}

export function buildArtifactCoverageReport(input: ArtifactCoverageReportInput): string {
  const emittedCount = input.emittedMarkdownArtifacts.length;
  const perDocCount = input.perDocumentArtifacts.length;
  const dataCount = input.supportingDataArtifacts.length;
  const absent =
    input.absentOrderedArtifacts.length > 0
      ? input.absentOrderedArtifacts.map((file) => `\`${file}\``).join(', ')
      : 'None from the canonical order.';
  return [
    '## Analysis Artifact Coverage Report',
    '',
    'This generated report reconciles the analysis folder with the article projection so reviewers can see what was included, what was linked as supporting data, and which canonical ordered artifacts were not present in this run.',
    '',
    '| Coverage area | Count | Reader-facing treatment |',
    '|---|---:|---|',
    `| Ordered/root markdown sections | ${emittedCount} | Expanded as article sections in the narrative order above |`,
    `| Per-document analyses | ${perDocCount} | Expanded under \`## Per-document intelligence\` immediately after significance scoring |`,
    `| Supporting data artifacts | ${dataCount} | Linked in Article Sources, not expanded inline |`,
    '',
    `**Absent canonical ordered artifacts**: ${absent}`,
  ].join('\n');
}
