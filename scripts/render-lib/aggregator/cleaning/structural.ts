/**
 * @module Infrastructure/RenderLib/Aggregator/Cleaning/Structural
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Structural body cleaning + heading demotion + link rewriting
 *
 * @description
 * Last stage of the artifact-body cleaning pipeline. Depends on the three
 * leaf strippers ({@link ./admin-bylines.js | admin-bylines},
 * {@link ./process-meta.js | process-meta}, {@link ./pass-two.js | pass-two})
 * plus three reader-facing HTML-quality projections that are local to
 * this module:
 *
 * 1. **Heading demotion** ({@link demoteHeadings}) — every artifact body
 *    is wrapped under an aggregator-injected `## <Section title>`, so the
 *    *inner* `##`, `###`, … headings are demoted by one level (`##` →
 *    `###`, `###` → `####`, …, capped at `######`). Without this the
 *    rendered article ends up with ~170 H2s and a flat outline that
 *    violates WCAG 2.4.6 ("Headings and Labels") and the SEO
 *    heading-hierarchy contract documented in `Article-Generation.md`.
 * 2. **`_Source: file.md_` preamble removal** ({@link stripSourcePreamble})
 *    — the legacy aggregator used to inject this italic line under every
 *    section heading; it now lives in the Reader Intelligence Guide and
 *    the `## Article Sources` appendix.
 * 3. **Empty-paragraph collapse** — admin-byline removal can leave 3+
 *    consecutive blank lines and rendered HTML emits a stray `<p></p>`
 *    for each pair. Collapse 3+ blank lines to 2.
 *
 * {@link rewriteRelativeLinks} rewrites every relative `](file.md)` link
 * to an absolute GitHub blob URL so the rendered HTML — which lives at a
 * different path than the source artifacts — still has auditable
 * back-links to GitHub.
 *
 * {@link cleanArtifactBody} is the orchestrator that calls every stripper
 * in the canonical order and is the single entry point used by
 * {@link ../aggregate.js | aggregate.ts}.
 *
 * Round-5 split: extracted from the 1205-LOC `render-lib/aggregator.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import matter from 'gray-matter';

import { stripPassTwoSection } from './pass-two.js';
import { stripLeadingAdminBylines } from './admin-bylines.js';
import { stripProcessMetaLines } from './process-meta.js';
import { demoteHeadings } from './heading-demotion.js';
import { rewriteRelativeLinks } from './link-rewriting.js';
import { dedupeAdjacentDuplicateLines, collapseRepeatedFooterBlocks } from './deduplication.js';

/**
 * Remove `_Source: \`file.md\`_` (and `_Source: [\`file.md\`](url)_`)
 * italic preamble lines. Only strips lines that **start** with the
 * source marker — never inline mentions. Bracket-link variant is
 * matched explicitly to allow for the markdown link payload.
 */
export function stripSourcePreamble(body: string): string {
  return body
    .replace(/^_\s*Source:\s*\[?`[^\n]*?\n+/gim, '')
    .replace(/^_\s*Source:\s*[^\n]*_\s*$\n?/gim, '');
}

/**
 * Strip inline "Reader Intelligence Guide" blocks that may appear inside
 * individual artifact bodies. The canonical guide is emitted exactly once
 * by the aggregator immediately after the executive brief; any duplicates
 * baked into artifact markdown must be removed to guarantee the
 * single-occurrence invariant.
 *
 * Matches the **English** heading `## Reader Intelligence Guide` only.
 * Source artifacts are always authored in English; localised articles are
 * produced post-aggregation and never re-enter the cleaning pipeline, so
 * matching English alone is sufficient.
 *
 * Strips the heading, any preamble paragraph immediately below it, and the
 * contiguous markdown table that follows (header row + separator + data rows).
 * Content that appears after the table (e.g. subsequent paragraphs or
 * subheadings) is preserved.
 */
export function stripInlineReaderGuide(body: string): string {
  // Step 1: strip the `## Reader Intelligence Guide` heading line.
  // Step 2: strip the optional preamble paragraph (non-blank, non-table lines
  //         immediately after the heading, separated by optional blank lines).
  // Step 3: strip the contiguous markdown table block (lines that start with `|`
  //         or are the blank-line separators between the heading and the table).
  //
  // We do this in two passes for clarity:
  // Pass A – heading + preamble + table (all as one contiguous block).
  //   A table row starts with `|`; the separator row also starts with `|`.
  //   Blank lines between heading, preamble, and table header are included.
  return body.replace(
    /^##\s+Reader Intelligence Guide[^\n]*\n(?:\n|(?!\|)[^\n]*\n)*(?:\|[^\n]*\n)*/gim,
    '',
  );
}

// Re-exported from dedicated deduplication module (extracted for ≤200 LOC constraint).
export { dedupeAdjacentDuplicateLines, collapseRepeatedFooterBlocks } from './deduplication.js';

// Re-export from dedicated module (extracted for ≤200 LOC constraint).
export { demoteHeadings } from './heading-demotion.js';

// Re-export from dedicated module (extracted for ≤200 LOC constraint).
export { rewriteRelativeLinks } from './link-rewriting.js';

/**
 * Strip a leading YAML front-matter block, the first top-level H1 (it is
 * replaced by the injected `##` section heading), trailing template
 * boilerplate footers (`— End of template —`, `<!-- End of artifact -->`,
 * `Document control`, `Generated by …`), AI self-audit `## Pass 2 …`
 * sections (which carry process metadata, not article content), and
 * leading admin-byline paragraphs (`**Author**: … · **Run ID**: …`).
 *
 * Also performs three reader-facing HTML-quality projections — see the
 * module-level JSDoc above — applied after the structural strips so
 * they never remove signal.
 */
export function cleanArtifactBody(raw: string): string {
  const parsed = matter(raw);
  let body = parsed.content;
  // Strip first H1
  body = body.replace(/^\s*#\s+[^\n]*\n+/, '');
  // Strip repeated admin/footer blocks
  body = body.replace(/^#+\s*Document control[\s\S]*$/im, '');
  body = body.replace(/^#+\s*Audit trail[\s\S]*$/im, '');
  body = body.replace(/^—\s*End of (template|artifact)\s*—[\s\S]*$/im, '');
  body = body.replace(/<!--\s*End of (template|artifact)[\s\S]*?-->/gi, '');
  body = body.replace(/^Generated by .*$/gim, '');
  body = body.replace(/^Run ID: .*$/gim, '');
  // Strip AI self-audit "Pass 2 …" trailing section (any H1-H6, with or
  // without leading emoji), from the heading through end-of-artifact.
  body = stripPassTwoSection(body);
  // Strip leading admin-byline paragraphs (template preamble).
  body = stripLeadingAdminBylines(body.trimStart());
  // Strip individual process-metadata lines anywhere in the body. Runs
  // *after* paragraph-level stripping so per-document identification
  // cards (mixed fact + process metadata) keep their fact lines while
  // the workflow noise (Author, Date, Confidence, DIW Score, Admiralty,
  // Self-audit cycle, Standard, Framework, …) is scrubbed in place.
  body = stripProcessMetaLines(body);
  // Strip in-body `_Source: file.md_` italic preambles (legacy template
  // preamble — sources are now surfaced in the Reader Intelligence
  // Guide and the `## Article Sources` appendix instead).
  body = stripSourcePreamble(body);
  // Strip any inline Reader Intelligence Guide blocks from artifact
  // bodies — the canonical guide is emitted once by the aggregator.
  body = stripInlineReaderGuide(body);
  // Collapse repeated ISMS / classification / provenance footer lines
  // emitted twice by AI agents or by template merge. Runs *before*
  // demoteHeadings so the dedupe operates on author-level lines.
  body = collapseRepeatedFooterBlocks(body);
  // Dedupe adjacent identical lines (defensive against AI agents that
  // paste a classification row, BLUF marker or evidence line twice in
  // a row). Idempotent and fence-aware.
  body = dedupeAdjacentDuplicateLines(body);
  // Demote inner headings by one level — the aggregator wraps each body
  // in its own `## <Section title>` so the artifact's own `##` becomes a
  // sibling, not a child. Cap at H6.
  body = demoteHeadings(body);
  // Collapse 3+ blank lines to 2 (post-strip cleanup).
  body = body.replace(/\n{3,}/g, '\n\n');
  return body.trim();
}
