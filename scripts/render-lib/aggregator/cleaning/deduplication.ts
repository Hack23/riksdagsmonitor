/**
 * @module Infrastructure/RenderLib/Aggregator/Cleaning/Deduplication
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Adjacent-line and footer-block deduplication
 *
 * @description
 * Defensive cleaning for AI-authored artifacts that paste classification
 * rows, ISMS footers or metadata sentinels more than once. Two functions:
 *
 * 1. {@link dedupeAdjacentDuplicateLines} — collapses identical adjacent
 *    non-blank lines (fence-aware, idempotent).
 * 2. {@link collapseRepeatedFooterBlocks} — collapses repeated ISMS /
 *    classification / provenance footer lines to their first occurrence.
 *
 * Extracted from `structural.ts` to maintain the ≤200 LOC single-
 * responsibility constraint.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

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
