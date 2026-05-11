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
 * Characters that may appear inside an abbreviation token when walking
 * backwards from a candidate sentence-end `.`. Letters plus internal dots
 * allow multi-dot abbreviations like `e.g.`, `bl.a.`, `d.v.s.` to be
 * captured as a single token by {@link isAbbreviationDot}.
 * Defined outside the function to avoid allocating a new regex object on
 * every iteration of the walk-back loop.
 */
const ABBREV_TOKEN_CHAR_RE = /[A-Za-z.]/;

/**
 * Common abbreviations that end with `.` followed by a space — these
 * must NOT be treated as sentence boundaries by {@link truncateToSentenceBoundary},
 * otherwise the description gets cut mid-sentence at e.g.
 * `… two propositions: the forestry deregulation (prop.` (audit
 * 2026-05-09 of `news/2026-05-08-motions-en.html`).
 *
 * Token comparison is **case-insensitive** — abbreviations like `prop.`
 * and `Prop.` are both treated as non-terminating. Matching is done by
 * looking at the last whitespace-delimited word ending at the candidate
 * sentence-end position; the word is lower-cased and looked up in
 * {@link SENTENCE_END_ABBREV_SET}.
 *
 * Note: case-insensitive matching means `Mr.` *will* also match an
 * (extremely unlikely) in-word `Imr.` ending, but the practical risk is
 * negligible because the word match is anchored to a whitespace
 * boundary on the left, not just any character.
 *
 * Keep the list short and high-signal — false-negatives (we miss an
 * abbreviation and cut early) only mean the description fragment is a
 * bit shorter; false-positives (we treat a real sentence end as an
 * abbreviation and overrun) would push the description past `hardMax`,
 * which is unrecoverable downstream.
 */
export const SENTENCE_END_ABBREVIATIONS: readonly string[] = [
  // Document references — the leak case
  'prop', 'props', 'mot', 'bet', 'skr', 'art', 'sec', 'ch', 'no', 'nr',
  'p', 'pp', 'ed', 'eds', 'vol', 'fig', 'cf',
  // Latin abbreviations
  'etc', 'vs', 'eg', 'ie', 'al',
  // Honorifics and titles (English + Swedish)
  'Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sr', 'Jr', 'St',
  // Swedish-specific common abbreviations
  'bl', 'dvs', 'fr', 't', 'ex', 'tex', 'kl',
];

/**
 * Set form of {@link SENTENCE_END_ABBREVIATIONS} for O(1) lookup.
 * Comparison is case-insensitive — abbreviations like `prop.` and
 * `Prop.` are both treated as non-terminating.
 */
const SENTENCE_END_ABBREV_SET = new Set(
  SENTENCE_END_ABBREVIATIONS.map((a) => a.toLowerCase()),
);

/**
 * Return `true` when the `.` at `text[dotIndex]` is the trailing dot of
 * a known abbreviation rather than a real sentence terminator.
 *
 * Looks back from the dot position to the first whitespace boundary,
 * collecting the **full** preceding token — including any internal dots.
 * This allows multi-dot abbreviations like `e.g.`, `i.e.`, `U.S.`,
 * `bl.a.`, `d.v.s.` to be detected in addition to simple ones like
 * `prop.` and `Mr.`
 *
 * Normalisation strategy (applied in order):
 * 1. Lower-case the full token and strip all internal dots; look up the
 *    dotless form (`e.g` → `eg`, `d.v.s` → `dvs`). This covers most
 *    multi-dot abbreviations whose canonical form is in the set.
 * 2. If the dotless form is not in the set but the token contains internal
 *    dots, check the **first** dot-split component (`bl.a.` → `bl`). Only
 *    the first component is checked to prevent a non-abbreviation prefix
 *    from accidentally matching a set member that appears later in the
 *    token (e.g. `example.al.` must not be treated as an abbreviation
 *    even though `al` is in the set).
 *
 * Pure function — exported only for testability.
 */
export function isAbbreviationDot(text: string, dotIndex: number): boolean {
  if (dotIndex < 0 || dotIndex >= text.length || text[dotIndex] !== '.') return false;
  let start = dotIndex - 1;
  while (start >= 0 && ABBREV_TOKEN_CHAR_RE.test(text[start]!)) start -= 1;
  const rawToken = text.slice(start + 1, dotIndex);
  if (!rawToken) return false;
  const normalised = rawToken.toLowerCase().replace(/\./g, '');
  if (SENTENCE_END_ABBREV_SET.has(normalised)) return true;
  if (rawToken.includes('.')) {
    const firstComponent = rawToken.toLowerCase().split('.')[0];
    if (firstComponent && SENTENCE_END_ABBREV_SET.has(firstComponent)) return true;
  }
  return false;
}

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

  const window = normalised.slice(0, hardMax + 1);
  SENTENCE_END_RE.lastIndex = 0;
  const ends: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = SENTENCE_END_RE.exec(window)) !== null) {
    if (m[0] === '.' && isAbbreviationDot(window, m.index)) continue;
    ends.push(m.index + m[0].length);
  }

  for (let i = ends.length - 1; i >= 0; i -= 1) {
    const end = ends[i]!;
    if (end >= softMin && end <= hardMax) return normalised.slice(0, end).trim();
  }

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
  const blufMatch = body.match(/^#{2,6}\s+(?:[^\n]*?\s)?BLUF\b[^\n]*\n+/im);
  if (!blufMatch || blufMatch.index === undefined) return null;
  const after = body.slice(blufMatch.index + blufMatch[0].length);
  const paragraphs = after.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  for (const p of paragraphs) {
    if (/^#+\s/.test(p)) break;                       if (/^<!--/.test(p)) continue;
    if (/^\|/.test(p)) continue;
    if (/^```/.test(p)) continue;
    if (/^[>*]\s/.test(p)) continue;
    if (/^[-*_]{3,}\s*$/.test(p)) continue;            const fragments = p.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    if (fragments.length > 0 && fragments.every((f) => ADMIN_FIELD_RE.test(f.trim()))) continue;
    return stripBlufLabel(markdownInlineToText(p));
  }
  return null;
}

/**
 * Strip a leading `BLUF:` / `TL;DR:` / `Bottom Line:` / `Top Line:`
 * label and any leading ordered/unordered list-item marker from a
 * paragraph. Some analysts write the label inline at the start of the
 * BLUF prose, on top of the `## 🎯 BLUF` heading; others use a
 * numbered/bulleted list as the BLUF itself. Without stripping these
 * markers, `<meta description>` reads `BLUF: …` or `1. SD fires …`
 * instead of just the prose. Pure function — exported for tests.
 */
export function stripBlufLabel(text: string): string {
  return text
    .replace(/^(?:BLUF|TL;DR|Bottom\s+Line|Top\s+Line)\s*[:—–-]\s*/i, '')
    .replace(/^\s*(?:\d+[.)]|[-*•])\s+/, '');
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
    if (/^#+\s/.test(p)) continue;                   if (/^<!--/.test(p)) continue;                   if (/^\|/.test(p)) continue;                     if (/^```/.test(p)) continue;                    if (/^[>*]\s/.test(p)) continue;                 if (/^[-*_]{3,}\s*$/.test(p)) continue;          const fragments = p.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    if (fragments.length > 0 && fragments.every((f) => ADMIN_FIELD_RE.test(f.trim()))) continue;
    return stripBlufLabel(markdownInlineToText(p));
  }
  return null;
}
