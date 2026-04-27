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
  // Demote inner headings by one level — the aggregator wraps each body
  // in its own `## <Section title>` so the artifact's own `##` becomes a
  // sibling, not a child. Cap at H6.
  body = demoteHeadings(body);
  // Collapse 3+ blank lines to 2 (post-strip cleanup).
  body = body.replace(/\n{3,}/g, '\n\n');
  return body.trim();
}
