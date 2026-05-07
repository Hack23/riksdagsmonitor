/**
 * @module Infrastructure/RenderLib/Aggregator/Seo/Description
 * @category Intelligence Operations / Supporting Infrastructure
 * @name BLUF / first-paragraph readers + sentence-aware truncation
 *
 * @description
 * Pure functions used to derive the article's `<meta description>` from
 * the executive-brief markdown. Implements `seo-metadata-contract.md` §3:
 *
 * - {@link readBlufParagraph} prefers the editor-curated `## 🎯 BLUF`
 *   paragraph (the publishable lede)
 * - {@link readFirstParagraph} falls back to the first prose paragraph
 *   (skipping admin bylines, tables, code fences, blockquotes)
 * - {@link truncateToSentenceBoundary} truncates the result to the
 *   140-200 char window without ever cutting mid-word, supporting Latin,
 *   CJK and Devanagari sentence terminators
 *
 * Round-5 split: extracted from the 1205-LOC `render-lib/aggregator.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import {
  ADMIN_FIELD_RE,
  ADMIN_FRAGMENT_SPLITTER,
} from '../cleaning/admin-bylines.js';
import { cleanArtifactBody } from '../cleaning/structural.js';

/**
 * Sentence-terminator set used by {@link truncateToSentenceBoundary}.
 * Covers Latin (`.`, `!`, `?`), Chinese/Japanese full stop (`。`),
 * Devanagari danda (`।`), and the Unicode horizontal ellipsis (`…`).
 */
export const SENTENCE_END_RE = /(?:[.!?…](?=\s|$))|[。।]/g;

/**
 * Convert markdown inline syntax (links, images, emphasis) to plain
 * text suitable for the `<meta description>` value. Whitespace is
 * collapsed; trailing punctuation is preserved.
 */
export function markdownInlineToText(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Truncate a string to the longest sentence-terminated prefix whose
 * length is ≤ `hardMax`, preferring a break ≥ `softMin`. Never cuts
 * mid-word. Used for `<meta description>` so Google never renders a
 * truncated last token with a trailing ellipsis.
 *
 * Supports sentence terminators across multiple scripts:
 * - Latin: `.`, `!`, `?`, `…`
 * - CJK (Chinese/Japanese): `。`
 * - Devanagari (Hindi and related Indic scripts): `।`
 *
 * Implements `seo-metadata-contract.md` §3.1: EN target window
 * 140-200 chars; shorter languages use their own windows but go
 * through the same sentence-preserving logic.
 *
 * If the input contains no usable sentence boundary **and** no word
 * boundary within the window (e.g. a single run of non-space chars),
 * the result is guaranteed to be non-empty: it is at least `hardMax`
 * chars plus a trailing `…`, so the caller never receives a bare `…`.
 *
 * @param text    Input prose (markdown emphasis already stripped).
 * @param softMin Soft minimum — prefer truncating at or after this
 *                length (default 140).
 * @param hardMax Hard maximum — never return more than this many chars
 *                (default 200).
 */
export function truncateToSentenceBoundary(
  text: string,
  softMin: number = 140,
  hardMax: number = 200,
): string {
  const normalised = text.replace(/\s+/g, ' ').trim();
  if (normalised.length === 0) return '';
  if (normalised.length <= hardMax) return normalised;

  // Find every sentence-end position in the prefix within hardMax.
  const window = normalised.slice(0, hardMax + 1);
  SENTENCE_END_RE.lastIndex = 0;
  const ends: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = SENTENCE_END_RE.exec(window)) !== null) {
    ends.push(m.index + m[0].length);
  }

  // Prefer the last sentence end that is ≥ softMin and ≤ hardMax.
  for (let i = ends.length - 1; i >= 0; i -= 1) {
    const end = ends[i]!;
    if (end >= softMin && end <= hardMax) return normalised.slice(0, end).trim();
  }

  // No sentence end in window — fall back to last word boundary
  // before hardMax, appending a true Unicode ellipsis so the cut is
  // intentional rather than mid-word. The `trim()` on the sliced prefix
  // followed by the explicit `'…'` guarantees a non-empty result even
  // when the input is a pathological single-token string.
  const sliced = normalised.slice(0, hardMax);
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace >= softMin) return sliced.slice(0, lastSpace).trim() + '…';
  return sliced.trim() + '…';
}

/**
 * Return the first prose paragraph that immediately follows a `## 🎯 BLUF`
 * (or `## BLUF`, case-insensitive) heading in an executive-brief. This is
 * the paragraph editors already wrote as the article's lede, so it is
 * preferred over the first paragraph of the document (which is often the
 * admin-metadata block).
 *
 * Returns `null` if the brief has no BLUF heading.
 */
export function readBlufParagraph(markdown: string): string | null {
  const body = cleanArtifactBody(markdown);
  // Match `## BLUF`, `## 🎯 BLUF`, `### BLUF` — any heading containing
  // the token `BLUF` as a standalone word. Case-insensitive. Consume
  // the heading line and any immediately-following blank line.
  const blufMatch = body.match(/^#{2,6}\s+(?:[^\n]*?\s)?BLUF\b[^\n]*\n+/im);
  if (!blufMatch || blufMatch.index === undefined) return null;
  const after = body.slice(blufMatch.index + blufMatch[0].length);
  // Take paragraph-by-paragraph, skip non-prose, stop at first match.
  const paragraphs = after.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  for (const p of paragraphs) {
    if (/^#+\s/.test(p)) break;                   // hit next heading — give up
    if (/^<!--/.test(p)) continue;
    if (/^\|/.test(p)) continue;
    if (/^```/.test(p)) continue;
    if (/^[>*]\s/.test(p)) continue;
    if (/^[-*_]{3,}\s*$/.test(p)) continue;        // skip thematic breaks (---, ***, ___)
    const fragments = p.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    if (fragments.length > 0 && fragments.every((f) => ADMIN_FIELD_RE.test(f.trim()))) continue;
    return markdownInlineToText(p);
  }
  return null;
}

/**
 * Return the first prose paragraph in `markdown` after the artifact has
 * been cleaned. Skips headings, HTML comments, tables, code fences,
 * blockquotes / bullet-only lines and admin-byline paragraphs.
 */
export function readFirstParagraph(markdown: string): string | null {
  const body = cleanArtifactBody(markdown);
  const lines = body.split(/\n\n/).map((p) => p.trim()).filter(Boolean);
  for (const p of lines) {
    if (/^#+\s/.test(p)) continue;               // skip headings
    if (/^<!--/.test(p)) continue;               // skip HTML comments
    if (/^\|/.test(p)) continue;                 // skip tables
    if (/^```/.test(p)) continue;                // skip code fences
    if (/^[>*]\s/.test(p)) continue;             // skip blockquotes / bullet-only lines
    if (/^[-*_]{3,}\s*$/.test(p)) continue;      // skip thematic breaks (---, ***, ___)
    // Structural-only delimiter (see ADMIN_FRAGMENT_SPLITTER JSDoc).
    const fragments = p.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    if (fragments.length > 0 && fragments.every((f) => ADMIN_FIELD_RE.test(f.trim()))) continue;
    return markdownInlineToText(p);
  }
  return null;
}
