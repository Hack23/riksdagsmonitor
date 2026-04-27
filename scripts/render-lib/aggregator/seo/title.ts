/**
 * @module Infrastructure/RenderLib/Aggregator/Seo/Title
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Article title cleanup + BLUF-derived fallback
 *
 * @description
 * Pure functions implementing the title side of `seo-metadata-contract.md`
 * §2: scrub boilerplate prefixes from the executive-brief H1, fall back
 * to a BLUF-synthesised title when the H1 collapses to nothing useful.
 *
 * Round-5 split: extracted from the 1205-LOC `render-lib/aggregator.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import {
  SENTENCE_END_RE,
  markdownInlineToText,
} from './description.js';

/**
 * Read the first top-level H1 from a markdown body. Returns the trimmed
 * heading text without the leading `# ` token, or `null` if none found.
 */
export function readFirstHeading(markdown: string): string | null {
  const match = markdown.match(/^\s*#\s+(.+?)\s*$/m);
  return match ? match[1].trim() : null;
}

/**
 * Scrub boilerplate from the raw H1 of an executive-brief so it can be
 * used as the article `<title>`. Per `seo-metadata-contract.md` §2:
 *
 * - strip a leading `Executive Brief — ` / `Executive Brief - ` prefix
 *   (the template boilerplate that masks the story)
 * - strip a trailing ` — YYYY-MM-DD` / ` - YYYY-MM-DD` / ` YYYY-MM-DD`
 *   (dates belong in `article:published_time`, not the SERP title)
 * - if the cleaned title is < 20 chars — too short to be a real story
 *   headline — return `null` so the caller can fall back to a BLUF
 *   sentence or to the fallback subfolder-based title.
 */
export function cleanArticleTitle(raw: string | null): string | null {
  if (!raw) return null;
  let t = raw.trim();
  // Strip leading pictograph / emoji / punctuation that sometimes
  // prefixes boilerplate H1s (e.g. `📋 Executive Brief — …`). Match
  // any run of non-letter/number/Arabic/CJK characters at the start.
  t = t.replace(/^[\s\p{Emoji_Presentation}\p{Emoji}\p{Extended_Pictographic}\p{P}\p{S}]+/u, '').trim();
  // Strip boilerplate prefixes (en-dash, em-dash, hyphen) — keep the story.
  t = t.replace(/^(?:Executive\s+Brief|Intelligence\s+Brief|Intelligence\s+Assessment|Realtime\s+Monitor|Riksdag\s+Realtime\s+Monitor|Daily\s+Brief)\s*[—–\-:]\s*/i, '');
  // Strip trailing ISO date (with or without a separator).
  t = t.replace(/\s*[—–\-:]?\s*\d{4}[-/]\d{2}[-/]\d{2}(?:\s+\d{1,2}[:\-.]\d{2}(?:\s*UTC)?)?\s*$/i, '');
  // Strip any ISO date that remains embedded mid-title (e.g. "Week
  // Ahead: 2026-02-23 to" → "Week Ahead: to"). We normalise
  // collapsing whitespace after the strip. This is important for
  // translated titles where the date is often inlined between two
  // non-Latin fragments that the trailing-strip can't reach.
  t = t.replace(/\s*\d{4}[-/]\d{2}[-/]\d{2}(?:\s+\d{1,2}[:\-.]\d{2}(?:\s*UTC)?)?\s*/g, ' ');
  // Strip trailing connector words left behind when a date was mid-title,
  // like "… to" / "… – " / "… —" / "… :" / Swedish "… till" / German
  // "… bis" / French "… à" / Spanish "… a" / Arabic "… إلى" / Japanese
  // "… から" / Norwegian-Danish "… til" / Finnish "… –". This is a
  // best-effort clean-up — if the trailing token is not in the list we
  // leave it alone.
  t = t.replace(/[\s,;:]*(?:to|till|bis|à|a|إلى|から|til|–|—|-|:)\s*$/iu, '').trim();
  t = t.replace(/\s+/g, ' ').trim();
  if (t.length < 20) return null;
  return t;
}

/**
 * Synthesise a title from a BLUF sentence when the H1 is too boilerplate
 * to use directly. Takes the first sentence of `bluf` (or up to `maxLen`
 * chars at a word boundary), strips markdown emphasis, trims to a clean
 * ≤ `maxLen`-char fragment. Returns `null` if no usable sentence exists.
 */
export function titleFromBluf(bluf: string | null, maxLen: number = 70): string | null {
  if (!bluf) return null;
  const clean = markdownInlineToText(bluf);
  if (!clean) return null;
  // Take the first sentence (bounded by . ! ? 。) — but never exceed maxLen.
  SENTENCE_END_RE.lastIndex = 0;
  const m = SENTENCE_END_RE.exec(clean);
  const firstSentence = m ? clean.slice(0, m.index + m[0].length) : clean;
  if (firstSentence.length <= maxLen) return firstSentence.replace(/\s*[.!?…。।]+\s*$/, '').trim();
  // First sentence too long — take word-boundary prefix ≤ maxLen.
  const sliced = firstSentence.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(' ');
  return (lastSpace > 30 ? sliced.slice(0, lastSpace) : sliced).trim();
}
