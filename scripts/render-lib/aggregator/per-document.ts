/**
 * @module Infrastructure/RenderLib/Aggregator/PerDocument
 * @category Intelligence Operations / Supporting Infrastructure
 * @name `documents/*-analysis.md` expansion
 *
 * @description
 * Reads every `documents/*.md` analysis under an analysis subfolder and
 * emits them as a single `## Per-document intelligence` section with one
 * `### {dok_id}` subsection per file. Used by the aggregator orchestrator
 * to inject per-document evidence between the core analytical lenses and
 * the appendix artifacts.
 *
 * Pure with respect to the filesystem — given the same set of files on
 * disk, returns the same string.
 *
 * Round-5 split: extracted from the 1205-LOC `render-lib/aggregator.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';

import { buildGithubBlobUrl } from '../url-helpers.js';
import { cleanArtifactBody } from './cleaning/structural.js';
import { rewriteRelativeLinks } from './cleaning/structural.js';
import { escapeInlineMd } from './frontmatter.js';

/**
 * Result of a per-document expansion run. The aggregator appends the
 * `section` (when non-`null`) to its `sections[]` array and merges
 * `usedRelative` into its `used[]` artifact tracking list.
 */
export interface PerDocumentExpansion {
  /**
   * Rendered `## Per-document intelligence` markdown section with one
   * `### {dok_id}` subsection per file, or `null` if the subfolder has
   * no `documents/` directory or all documents cleaned to empty.
   */
  readonly section: string | null;
  /**
   * Subfolder-relative paths of every document successfully consumed
   * (e.g. `documents/H902FiU13-analysis.md`). Always present so the
   * caller can extend its artifact tracking.
   */
  readonly usedRelative: readonly string[];
}

/**
 * Expand a subfolder's `documents/` directory into a single
 * `## Per-document intelligence` section. Each `*.md` becomes a
 * `### {dok_id}` subsection with cleaned body + GitHub source comment.
 *
 * Files are sorted alphabetically so the output is stable across runs.
 * Empty / fully-stripped artifacts are silently skipped.
 */
export function expandPerDocumentAnalyses(
  subfolderAbsPath: string,
  subfolderRepoRelPath: string,
): PerDocumentExpansion {
  const docsDir = path.join(subfolderAbsPath, 'documents');
  if (!fs.existsSync(docsDir)) {
    return { section: null, usedRelative: [] };
  }
  const docFiles = fs.readdirSync(docsDir)
    .filter((f) => /\.md$/i.test(f))
    .sort();
  if (docFiles.length === 0) {
    return { section: null, usedRelative: [] };
  }

  const perDocSections: string[] = [];
  const usedRelative: string[] = [];
  for (const df of docFiles) {
    const abs = path.join(docsDir, df);
    const raw = fs.readFileSync(abs, 'utf8');
    const clean = rewriteRelativeLinks(
      cleanArtifactBody(raw),
      `${subfolderRepoRelPath}/documents`,
    );
    if (!clean) continue;
    const dokId = df.replace(/-analysis\.md$/i, '').replace(/\.md$/i, '');
    const sourceUrl = buildGithubBlobUrl(
      `${subfolderRepoRelPath}/documents/${df}`,
    );
    perDocSections.push(
      `### ${escapeInlineMd(dokId)}\n` +
      `<!-- source: documents/${df} :: ${sourceUrl} -->\n\n` +
      clean,
    );
    usedRelative.push(`documents/${df}`);
  }
  if (perDocSections.length === 0) {
    return { section: null, usedRelative: [] };
  }
  return {
    section: `## Per-document intelligence\n\n` + perDocSections.join('\n\n'),
    usedRelative,
  };
}

/**
 * Detect whether the subfolder has at least one `documents/*.md` file.
 * Used by the Reader Intelligence Guide to decide whether to emit its
 * "Per-document intelligence" pointer row before the actual section is
 * built (so the row appears in the right place in the table).
 */
export function hasPerDocumentAnalyses(subfolderAbsPath: string): boolean {
  const docsDir = path.join(subfolderAbsPath, 'documents');
  return (
    fs.existsSync(docsDir) &&
    fs.readdirSync(docsDir).some((f) => /\.md$/i.test(f))
  );
}
