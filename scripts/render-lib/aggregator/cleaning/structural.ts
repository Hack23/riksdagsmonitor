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

import path from 'path';

import matter from 'gray-matter';

import { GITHUB_BLOB } from '../../constants.js';
import { stripPassTwoSection } from './pass-two.js';
import { stripLeadingAdminBylines } from './admin-bylines.js';
import { stripProcessMetaLines } from './process-meta.js';

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

/**
 * Collapse identical adjacent non-blank lines that appear two-or-more
 * times in a row. Defensive cleaning for the common AI-authored failure
 * mode where a classification row, ISMS footer or metadata sentinel is
 * pasted twice into the same artifact body.
 *
 * Lines inside fenced code blocks are preserved verbatim — duplication
 * inside a code block may be intentional (e.g. config snippets). Blank
 * lines are not deduplicated; they participate as paragraph separators
 * and are handled later by the `\n{3,}` collapse step.
 *
 * Stable on already-deduped inputs: the function is idempotent —
 * applying it twice yields the same result.
 */
export function dedupeAdjacentDuplicateLines(body: string): string {
  const lines = body.split('\n');
  const out: string[] = [];
  let inFence = false;
  let prevNonBlank: string | null = null;
  for (const line of lines) {
    if (/^\s{0,3}(?:```|~~~)/.test(line)) {
      inFence = !inFence;
      out.push(line);
      prevNonBlank = null;
      continue;
    }
    if (inFence) {
      out.push(line);
      prevNonBlank = null;
      continue;
    }
    if (line.trim() === '') {
      out.push(line);
      // Blank lines reset the adjacency window — duplicates separated
      // by blank lines are a different concern (handled by
      // `collapseRepeatedFooterBlocks`).
      prevNonBlank = null;
      continue;
    }
    if (prevNonBlank !== null && line === prevNonBlank) {
      // Skip the duplicate.
      continue;
    }
    out.push(line);
    prevNonBlank = line;
  }
  return out.join('\n');
}

/**
 * Footer-block markers that templates and AI agents have historically
 * emitted at the end of every artifact (sometimes twice). The aggregator
 * already strips a curated set of trailing administrative blocks (see
 * {@link cleanArtifactBody}); this function catches the *intra-body*
 * duplicates — when an ISMS / classification / GDPR provenance line
 * appears two-or-more times in the same artifact body, only the first
 * occurrence is kept.
 *
 * A "footer block" is a single line (post-trim) that:
 *   - starts with the bold marker `**ISMS …`, `**Classified under …`,
 *     `**GDPR …`, `**Article-Generation contract**`, `**Hack23 ISMS**`,
 *     `**Provenance**`, or
 *   - starts with the italic marker `_Classified under …` or
 *     `*Classified under …`.
 *
 * Lines inside fenced code blocks are preserved verbatim. Subsequent
 * occurrences of the *exact same* footer line are removed (along with a
 * single trailing blank line so the surrounding paragraph spacing is
 * preserved).
 */
export function collapseRepeatedFooterBlocks(body: string): string {
  const FOOTER_LINE = /^\s*(?:\*\*|[*_])\s*(?:ISMS\b|Classified\s+under\b|GDPR\b|Hack23\s+ISMS\b|Article-Generation\s+contract\b|Provenance\b)/i;
  const lines = body.split('\n');
  const seen = new Set<string>();
  const out: string[] = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (/^\s{0,3}(?:```|~~~)/.test(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }
    const trimmed = line.trim();
    if (FOOTER_LINE.test(trimmed)) {
      if (seen.has(trimmed)) {
        // Skip this duplicated footer line. Also swallow a single
        // trailing blank line so we don't leave a stranded gap.
        if (i + 1 < lines.length && lines[i + 1]!.trim() === '') {
          i += 1;
        }
        continue;
      }
      seen.add(trimmed);
    }
    out.push(line);
  }
  return out.join('\n');
}

/**
 * Demote ATX headings by one level inside an artifact body — `##` → `###`,
 * `###` → `####`, …, capped at `######`. The aggregator wraps each
 * artifact under its own injected `## <title>`, so without this the
 * rendered article outline ends up flat (every artifact's internal H2s
 * become siblings of the wrapper H2). Indentation, fenced code blocks
 * and table contents are not affected — only line-anchored ATX headings
 * are matched.
 *
 * Headings inside fenced code blocks are explicitly excluded by
 * tracking fence state line-by-line.
 */
export function demoteHeadings(body: string): string {
  const lines = body.split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    // Track entry/exit of triple-backtick or triple-tilde fenced code.
    if (/^\s{0,3}(?:```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{1,6})(\s+\S)/);
    if (!m) continue;
    const current = m[1]!.length;
    if (current >= 6) continue;          // already at H6, can't demote further
    if (current === 1) continue;         // H1 already stripped by upstream regex; defensive
    lines[i] = '#'.repeat(current + 1) + line.slice(current);
  }
  return lines.join('\n');
}

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
