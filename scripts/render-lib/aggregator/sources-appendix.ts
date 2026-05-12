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
 * artifact consumed by the aggregator. Returns `null` only when both
 * `used` and `supportingDataArtifacts` are empty so the caller can
 * omit the section entirely.
 *
 * Body shape:
 *   • If `used` is non-empty, the canonical "Each section above
 *     projects one analysis artifact…" prose + bullet list is emitted.
 *   • If `used` is empty but `supportingDataArtifacts` is non-empty,
 *     the appendix opens with a supporting-data-only preamble (no
 *     misleading "sections above" claim) before the supporting-data
 *     sub-block.
 *   • When `supportingDataArtifacts` is non-empty, the dedicated
 *     `### Supporting Data Artifacts` sub-block is appended in either
 *     case.
 */
export function buildSourcesAppendix(
  used: readonly string[],
  subfolderRepoRelPath: string,
  supportingDataArtifacts: readonly string[] = [],
): string | null {
  if (used.length === 0 && supportingDataArtifacts.length === 0) return null;
  const lines: string[] = ['## Article Sources', ''];
  if (used.length > 0) {
    lines.push(
      'Each section above projects one analysis artifact. The full audited markdown is available on GitHub:',
      '',
      ...used.map((file) => {
        const url = buildGithubBlobUrl(`${subfolderRepoRelPath}/${file}`);
        return `- [\`${file}\`](${url})`;
      }),
    );
  } else {
    lines.push(
      'No analysis-artifact markdown sections were emitted in this run; only machine-readable supporting data is linked below for audit traceability.',
    );
  }
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
  /**
   * Number of supporting-data JSON artifacts that exist on disk but
   * were truncated from `supportingDataArtifacts` because the
   * collector hit its hard cap. Surfaced in the report as an explicit
   * `(and N more not shown)` annotation. Optional; defaults to 0.
   */
  readonly supportingDataTruncatedCount?: number;
  /** Canonical artifacts that never existed on disk. */
  readonly absentOrderedArtifacts: readonly string[];
  /**
   * Canonical artifacts present on disk but whose body was trimmed to
   * empty by `cleanArtifactBody()` — the file existed but contributed
   * nothing to the article projection. Does NOT include alias-de-duped
   * files (those are tracked in `aliasDedupedArtifacts`).
   * Optional; defaults to an empty list.
   */
  readonly presentButFilteredArtifacts?: readonly string[];
  /**
   * Canonical artifacts present on disk but suppressed because another
   * member of the same filename-alias group was already emitted first.
   * The canonical alias is visible in the article; the skipped variant
   * is surfaced here for audit completeness.
   * Optional; defaults to an empty list.
   */
  readonly aliasDedupedArtifacts?: readonly string[];
}

export function buildArtifactCoverageReport(input: ArtifactCoverageReportInput): string {
  const emittedCount = input.emittedMarkdownArtifacts.length;
  const perDocCount = input.perDocumentArtifacts.length;
  const dataCount = input.supportingDataArtifacts.length;
  const truncated = input.supportingDataTruncatedCount ?? 0;
  const dataCountCell = truncated > 0
    ? `${dataCount} (+${truncated} truncated)`
    : `${dataCount}`;
  const fmt = (files: readonly string[]): string =>
    files.length > 0 ? files.map((f) => `\`${f}\``).join(', ') : 'None.';
  return [
    '## Analysis Artifact Coverage Report',
    '',
    'This generated report reconciles the analysis folder with the article projection so reviewers can see what was included, what was linked as supporting data, and which canonical ordered artifacts are not visible in this run. Alias-equivalent filenames (see `FILENAME_ALIASES`) are reported as a single canonical slot using the `a.md / b.md` shorthand so a missing slot is not double-counted.',
    '',
    '| Coverage area | Count | Reader-facing treatment |',
    '|---|---:|---|',
    `| Ordered/root markdown sections | ${emittedCount} | Expanded as article sections in the narrative order above |`,
    `| Per-document analyses | ${perDocCount} | Expanded under \`## Per-document intelligence\` immediately after significance scoring |`,
    `| Supporting data artifacts | ${dataCountCell} | Linked in Article Sources, not expanded inline |`,
    '',
    `**Absent canonical ordered slots (no alias variant on disk)**: ${fmt(input.absentOrderedArtifacts)}`,
    '',
    `**Present-but-empty canonical slots (on disk but body empty after cleaning)**: ${fmt(input.presentButFilteredArtifacts ?? [])}`,
    '',
    `**Alias-de-duped canonical artifacts (on disk but suppressed because canonical alias was already emitted)**: ${fmt(input.aliasDedupedArtifacts ?? [])}`,
  ].join('\n');
}
