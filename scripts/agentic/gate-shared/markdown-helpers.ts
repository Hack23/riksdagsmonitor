/**
 * @module scripts/agentic/gate-shared/markdown-helpers
 * @description Shared markdown parsing primitives used by multiple gate
 *              checks (SWOT evidence, significance scoring, executive-brief
 *              H1 extraction, methodology-reflection section walker).
 *
 * Keeping these in one file (instead of duplicating the regexes across
 * five check modules) ensures the bash gate / TS gate parity rules stay
 * consistent — any change here propagates to every consumer.
 *
 * @see .github/prompts/05-analysis-gate.md — bash gate parity reference
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Bullet lines (`-` or `*` style). */
export const BULLET_RE = /^\s*[-*]\s+/;

/** Table row (starts with `|`). */
export const TABLE_ROW_RE = /^\s*\|/;

/** Table separator row (only `|`, `:`, `-`, whitespace). */
export const TABLE_SEP_RE = /^\s*[|:\-\s]+$/;

/** Any ATX heading H1-H6 (resets the active section context). */
export const ANY_HEADING_RE = /^#{1,6}\s+/;

/**
 * Strip HTML tags and common HTML entities from a heading value, then
 * collapse all whitespace. Used by the executive-brief H1 extractor to
 * normalise both Markdown `# …` headings and centered `<h1>…</h1>`
 * template blocks.
 */
export function stripHeadingMarkup(value: string): string {
  let text = '';
  let insideTag = false;

  for (const char of value) {
    if (char === '<') {
      insideTag = true;
      continue;
    }
    if (insideTag) {
      if (char === '>') {
        insideTag = false;
      }
      continue;
    }
    text += char;
  }

  return text.replace(/&nbsp;|&#160;/gi, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Test whether a markdown document contains an H2-H4 heading whose visible
 * text (after stripping a single optional leading emoji + whitespace)
 * matches the given pattern. Anchoring to a real heading prevents the
 * loose "anywhere in the file" matches that earlier versions of the
 * methodology-reflection gate allowed.
 */
export function hasHeading(content: string, pattern: RegExp): boolean {
  for (const rawLine of content.split('\n')) {
    const headingMatch = rawLine.match(/^#{2,4}\s+(.*?)\s*#*\s*$/);
    if (!headingMatch) continue;
    // Strip a single leading emoji (any non-ASCII glyph or symbol) plus optional whitespace.
    const text = headingMatch[1]!.replace(/^[^\p{L}\p{N}]+\s*/u, '').trim();
    if (pattern.test(text)) return true;
  }
  return false;
}

/**
 * Return the body of the section starting at the H2 heading that matches
 * `headingPattern`, up to (but not including) the next H2 heading. Returns
 * an empty string when the section is not present.
 */
export function extractSection(content: string, headingPattern: RegExp): string {
  const lines = content.split('\n');
  let inSection = false;
  const collected: string[] = [];
  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.*?)\s*#*\s*$/);
    if (headingMatch) {
      const text = headingMatch[1]!.replace(/^[^\p{L}\p{N}]+\s*/u, '').trim();
      if (inSection) break;
      if (headingPattern.test(text)) {
        inSection = true;
        continue;
      }
    }
    if (inSection) collected.push(line);
  }
  return collected.join('\n');
}
