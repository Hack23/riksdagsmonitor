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
import { prettifyFallbackTitle } from './../order.js';

/**
 * Read the first top-level H1 from a markdown body. Returns the trimmed
 * heading text without the leading `# ` token, or `null` if none found.
 */
export function readFirstHeading(markdown: string): string | null {
  const match = markdown.match(/^\s*#\s+(.+?)\s*$/m);
  return match ? match[1].trim() : null;
}

/**
 * Lower-cased comparison helper for {@link cleanArticleTitle}'s
 * subfolder-equality check. Strips non-letter/number characters and
 * collapses whitespace so `Government Propositions` and `Propositions`
 * compare against subfolder slugs `propositions` / `government-propositions`
 * deterministically.
 */
function normaliseTitleForCompare(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
 * - if the cleaned title equals (case-insensitive, punctuation-stripped)
 *   the prettified subfolder fallback (e.g. `Government Propositions`
 *   for the `propositions` subfolder), return `null` so the caller falls
 *   back to a BLUF-synthesised title with a real actor + verb. Without
 *   this guard, lazy template H1s like `# Executive Brief — Government
 *   Propositions 2026-05-08` ship as the bare category label.
 */
export function cleanArticleTitle(raw: string | null, subfolder?: string): string | null {
  if (!raw) return null;
  let t = raw.trim();
  // Strip leading pictograph / emoji / punctuation that sometimes
  // prefixes boilerplate H1s (e.g. `📋 Executive Brief — …`). Match
  // any run of non-letter/number/Arabic/CJK characters at the start.
  t = t.replace(/^[\s\p{Emoji_Presentation}\p{Emoji}\p{Extended_Pictographic}\p{P}\p{S}]+/u, '').trim();
  // Strip boilerplate prefixes (en-dash, em-dash, hyphen) — keep the story.
  t = t.replace(/^(?:Executive\s+Brief|Intelligence\s+Brief|Intelligence\s+Assessment|Realtime\s+Monitor|Riksdag\s+Realtime\s+Monitor|Daily\s+Brief|BLUF|TL;DR|Top\s+Line|Bottom\s+Line)\s*[—–\-:]\s*/i, '');
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

  // Subfolder-equality guard: when the cleaned title is just the
  // prettified subfolder name (e.g. `Government Propositions` for
  // `propositions`, `Interpellation Debates` for `interpellations`,
  // `Riksdag Realtime Pulse` for `realtime-pulse`), it's a generic
  // category label — exactly the boilerplate the SEO contract bans.
  // Returning null forces the aggregator to fall back to titleFromBluf.
  //
  // Heuristic: split the subfolder slug into stem tokens (≥4 chars) and
  // require ≥1 token to appear in the cleaned title. If the cleaned
  // title contains *only* such category tokens (no actor, no number, no
  // verb-bearing prose), reject it. We approximate "no real story" by
  // checking that every word in the cleaned title is either a category
  // stem token or a short connector (`and`, `the`, `for`, `of`, `in`,
  // `on`, …) — i.e. no novel content beyond the category label.
  if (subfolder) {
    const cleaned = normaliseTitleForCompare(t);
    const fallback = normaliseTitleForCompare(prettifyFallbackTitle(subfolder));
    if (fallback && cleaned === fallback) return null;
    // Token-overlap heuristic: pure-category titles dominated by
    // subfolder slug stems with no other content words.
    const slugStems = subfolder
      .toLowerCase()
      .split(/[-_/]+/)
      .filter((s) => s.length >= 4);
    if (slugStems.length > 0) {
      const titleWords = cleaned.split(/\s+/).filter(Boolean);
      const connectorSet = new Set([
        'the', 'a', 'an', 'and', 'or', 'of', 'for', 'in', 'on', 'at',
        'by', 'to', 'with', 'from', 'as', 'is', 'are',
        // Common category boilerplate amplifiers — these add no signal
        // beyond the subfolder label.
        'riksdag', 'riksdagen', 'government', 'opposition', 'committee',
        'committees', 'reports', 'report', 'debates', 'debate',
        'realtime', 'pulse', 'monitor', 'analysis',
      ]);
      const isStem = (w: string): boolean => {
        // Match against stem tokens with simple plural-equivalence
        // (`interpellation` ≡ `interpellations`, `motion` ≡ `motions`).
        // We deliberately do NOT use unrestricted substring matching
        // (which would over-match `motion` ⊂ `emotion`); instead we
        // require either an exact match or a 1-2 char tail difference
        // limited to plural suffixes (`s`, `es`).
        if (slugStems.includes(w)) return true;
        return slugStems.some((stem) => {
          const sw = stem.length - w.length;
          if (sw === 1 && stem === w + 's') return true;
          if (sw === 2 && stem === w + 'es') return true;
          if (sw === -1 && w === stem + 's') return true;
          if (sw === -2 && w === stem + 'es') return true;
          return false;
        });
      };
      const allBoilerplate = titleWords.every(
        (w) => connectorSet.has(w) || isStem(w),
      );
      if (allBoilerplate) return null;
    }
  }
  return t;
}

/**
 * Patterns matching common English date prefixes that frequently appear
 * at the start of BLUF / lead sentences (`On 7 May 2026, …`,
 * `Friday 8 May 2026 marks …`, `The week of 2–9 May 2026 produced …`).
 *
 * Per `seo-metadata-contract.md` §2.1 ("Never contains a literal date"),
 * the title must not echo the publication date — so when synthesising
 * a title from a BLUF sentence we strip these prefixes first. If the
 * remaining sentence starts with a lower-case word it is capitalised so
 * the SERP title reads as a clean sentence.
 *
 * The patterns are intentionally narrow: only well-formed English date
 * leads are stripped. Translated articles get their own per-language
 * dictionaries via the `news-translate` workflow.
 *
 * Exported only for testability.
 */
export const BLUF_DATE_PREFIX_PATTERNS: readonly RegExp[] = [
  // "On <day> <month> <year>, " (e.g. `On 7 May 2026, …`).
  /^On\s+\d{1,2}\s+[A-Z][a-z]+\s+\d{4}\s*[,—–-]?\s*/,
  // "On <month> <day>, <year>, " (US-style, e.g. `On May 7, 2026, …`).
  /^On\s+[A-Z][a-z]+\s+\d{1,2}(?:,\s*\d{4})?\s*[,—–-]?\s*/,
  // "[On ]<weekday>[,] [<day> <month> [<year>]] " — strip whether or
  // not the date follows. Handles `Friday 8 May 2026 marks …` and
  // `On Friday, 8 May 2026, the …`.
  /^(?:On\s+)?(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day(?:,?\s*\d{1,2}\s+[A-Z][a-z]+(?:\s+\d{4})?)?\s*[,—–-]?\s+/,
  // "The week of <day>[–<day>] <month> [<year>]" — common in
  // weekly-review BLUF.
  /^The\s+week\s+of\s+\d{1,2}(?:\s*[–—-]\s*\d{1,2})?\s+[A-Z][a-z]+(?:\s+\d{4})?\s+/,
  // Bare "<day> <month> <year>, "
  /^\d{1,2}\s+[A-Z][a-z]+\s+\d{4}\s*[,—–-]?\s+/,
  // ISO date prefix "2026-05-08, " or "2026-05-08 — "
  /^\d{4}-\d{2}-\d{2}\s*[,—–-]?\s+/,
];

/**
 * Verb-leading tokens that, when found at the start of the post-strip
 * sentence, indicate a grammatical subject was lost during date-prefix
 * stripping (e.g. `Friday 8 May 2026 marks …` → `marks …`). When
 * detected, we skip the strip and accept the date in the title rather
 * than ship a subjectless verb. Better SEO-incorrect than grammatically
 * broken.
 */
const VERB_LEADING_TOKENS = new Set([
  // Present tense (3rd person singular) — the most common in BLUF leads
  'marks', 'shows', 'reveals', 'signals', 'indicates', 'suggests',
  'faces', 'sees', 'brings', 'drives', 'highlights', 'represents',
  'demonstrates', 'reflects', 'underscores', 'confirms', 'opens',
  'closes', 'launches', 'produces', 'delivers', 'sets', 'forces',
  // Past tense
  'submitted', 'introduced', 'rejected', 'approved', 'voted', 'tabled',
  'announced', 'unveiled', 'reported', 'agreed', 'failed', 'collapsed',
  // Future / modal
  'will', 'would', 'could', 'may', 'might', 'should', 'must',
]);

function startsWithVerb(text: string): boolean {
  const m = text.match(/^([A-Za-z]+)/);
  if (!m) return false;
  return VERB_LEADING_TOKENS.has(m[1]!.toLowerCase());
}


/**
 * Strip a leading English date prefix from a BLUF sentence so the
 * synthesised title doesn't open with a literal date. Returns the input
 * unchanged when no pattern matches.
 *
 * Guard: if stripping would leave a sentence that starts with a verb
 * (e.g. `Friday 8 May 2026 marks …` → `marks …`), we keep the prefix
 * and let the downstream truncate handle it — a slightly date-leaky
 * title beats a grammatically broken one. Pure function — exported for
 * tests.
 */
export function stripLeadingDatePrefix(text: string): string {
  for (const re of BLUF_DATE_PREFIX_PATTERNS) {
    const next = text.replace(re, '');
    if (next !== text) {
      // Don't strip if the result begins with a verb — losing the
      // subject produces ungrammatical fragments like "Marks a heavy-
      // load day" (audit of news/2026-05-08-evening-analysis-en.html).
      if (startsWithVerb(next.trim())) return text;
      return next;
    }
  }
  return text;
}

/**
 * Capitalise the first letter of a string when it begins with a
 * lower-case ASCII letter and the second character is lower-case (i.e.
 * the word is plain prose, not an abbreviation like `eIDAS`).
 *
 * Used after `stripLeadingDatePrefix` so the SERP title reads as a
 * grammatical sentence even when the BLUF lead was `On 7 May, the
 * government …` (which becomes `the government …` after stripping
 * and would render as lower-case in the SERP without re-capping).
 */
function capitaliseFirst(text: string): string {
  if (text.length < 2) return text;
  const a = text[0]!;
  const b = text[1]!;
  if (a >= 'a' && a <= 'z' && b >= 'a' && b <= 'z') {
    return a.toUpperCase() + text.slice(1);
  }
  return text;
}

/**
 * Trailing connector punctuation / words left behind when the
 * word-boundary truncation in {@link titleFromBluf} cuts at a
 * comma, dash or coordinating connector (`and`, `or`, `with`, `as`,
 * `in`, `of`, `to`, `for`, `on`, `at`). Stripped so the title doesn't
 * end on a dangling fragment like `… in the Riksdag,` or `… have`.
 */
const TRAILING_CONNECTOR_RE =
  /[\s,;:—–-]+(?:and|or|but|with|as|in|of|to|for|on|at|by|from|that|which|who|when|where|while|after|before|the|a|an|have|has|had|is|are|was|were|will|would|can|may|might|should|must)$/i;

function trimTrailingConnectors(text: string): string {
  let prev = text;
  // Run until fixpoint so chains like `… have to` collapse cleanly.
  for (let i = 0; i < 5; i += 1) {
    const next = prev.replace(TRAILING_CONNECTOR_RE, '').replace(/[\s,;:—–-]+$/u, '').trim();
    if (next === prev) break;
    prev = next;
  }
  return prev;
}

/**
 * Synthesise a title from a BLUF sentence when the H1 is too boilerplate
 * to use directly. Takes the first sentence of `bluf` (or up to `maxLen`
 * chars at a word boundary), strips markdown emphasis, trims to a clean
 * ≤ `maxLen`-char fragment. Returns `null` if no usable sentence exists.
 *
 * Pre-processing per `seo-metadata-contract.md` §2.1 / §2.3:
 * - leading English date prefix is stripped (`On 7 May 2026, …`,
 *   `Friday 8 May 2026 …`, `The week of 2–9 May 2026 …`)
 * - first letter is recapped if the strip left a lower-case word
 * - trailing connector punctuation / coordinating words are removed so
 *   the title doesn't end on a dangling fragment
 */
export function titleFromBluf(bluf: string | null, maxLen: number = 70): string | null {
  if (!bluf) return null;
  const cleanRaw = markdownInlineToText(bluf);
  if (!cleanRaw) return null;
  // Strip a redundant inline `BLUF:` / `TL;DR:` prefix that some
  // analysts write at the start of the BLUF paragraph itself, on top of
  // the `## 🎯 BLUF` heading. Without this the synthesised title leads
  // with a label rather than the story (audit of
  // news/2026-05-08-interpellations-en.html).
  const labelStripped = cleanRaw.replace(/^(?:BLUF|TL;DR|Bottom\s+Line|Top\s+Line)\s*[:—–-]\s*/i, '');
  // Strip a leading list marker (`1. `, `2) `, `- `, `* `, `• `) so an
  // ordered/unordered list item used as the BLUF doesn't yield a title
  // like `1` from sentence-end at the digit's period (audit
  // 2026-05-09 of analysis/daily/2026-05-05/evening-analysis/).
  const listStripped = labelStripped.replace(/^\s*(?:\d+[.)]|[-*•])\s+/, '');
  const stripped = stripLeadingDatePrefix(listStripped).trim();
  // Reject sentences that collapse to nothing meaningful after the
  // date-prefix strip (e.g. `On 7 May 2026, .` → `.`).
  const meaningful = stripped.replace(/^[\s.!?…。।,;:—–-]+/u, '').trim();
  if (meaningful.length < 5) return null;
  const clean = capitaliseFirst(meaningful);
  // Take the first sentence (bounded by . ! ? 。) — but never exceed maxLen.
  SENTENCE_END_RE.lastIndex = 0;
  const m = SENTENCE_END_RE.exec(clean);
  const firstSentence = m ? clean.slice(0, m.index + m[0].length) : clean;
  if (firstSentence.length <= maxLen) {
    const trimmed = firstSentence.replace(/\s*[.!?…。।]+\s*$/, '').trim();
    return trimTrailingConnectors(trimmed) || null;
  }
  // First sentence too long — take word-boundary prefix ≤ maxLen.
  const sliced = firstSentence.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(' ');
  const cut = (lastSpace > 30 ? sliced.slice(0, lastSpace) : sliced).trim();
  const cleaned = trimTrailingConnectors(cut);
  return cleaned || null;
}
