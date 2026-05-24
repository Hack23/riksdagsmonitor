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

import type { Language } from '../../../types/language.js';
import {
  ADMIN_FIELD_RE,
  ADMIN_FRAGMENT_SPLITTER,
} from '../cleaning/admin-bylines.js';
import { cleanArtifactBody } from '../cleaning/structural.js';
import { extractHeadlineSection } from './brief-extractor.js';

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
 * Per-language SERP `<meta description>` length windows, sourced from
 * `.github/prompts/seo-metadata-contract.md` §4 ("Per-language charset
 * budgets"). Character counts are *visual width in SERP* — not UTF-8
 * bytes — because CJK glyphs render roughly twice the width of Latin
 * letters and RTL glyphs render slightly narrower.
 *
 * - **Latin LTR** (`en sv da no fi de fr es nl`) → 140–200 chars
 * - **RTL** (`ar he`) → 120–170 chars
 * - **CJK** (`ja ko zh`) → 70–120 chars
 *
 * Pre-2026-05 every locale shared the hard-coded `140 / 200` window in
 * {@link truncateToSentenceBoundary}, which forced Japanese / Korean /
 * Chinese descriptions to overshoot their visual SERP budget (Google
 * routinely truncated CJK descriptions mid-glyph) and let RTL
 * descriptions ship 10–20 chars below their floor. This table is the
 * single source of truth — any future contract change must update
 * `seo-metadata-contract.md` §4 *and* this map (tests in
 * `tests/seo-description-windows.test.ts` enforce parity).
 */
export const LANG_DESCRIPTION_WINDOWS: Readonly<
  Record<string, { readonly softMin: number; readonly hardMax: number }>
> = {
  // Latin LTR — 9 languages, all 140-200
  en: { softMin: 140, hardMax: 200 },
  sv: { softMin: 140, hardMax: 200 },
  da: { softMin: 140, hardMax: 200 },
  no: { softMin: 140, hardMax: 200 },
  fi: { softMin: 140, hardMax: 200 },
  de: { softMin: 140, hardMax: 200 },
  fr: { softMin: 140, hardMax: 200 },
  es: { softMin: 140, hardMax: 200 },
  nl: { softMin: 140, hardMax: 200 },
  // RTL — 2 languages, 120-170
  ar: { softMin: 120, hardMax: 170 },
  he: { softMin: 120, hardMax: 170 },
  // CJK — 3 languages, 70-120 (count CJK glyphs, not bytes)
  ja: { softMin: 70, hardMax: 120 },
  ko: { softMin: 70, hardMax: 120 },
  zh: { softMin: 70, hardMax: 120 },
};

/**
 * Resolve `{ softMin, hardMax }` for a given language code. Returns the
 * canonical EN window `{ 140, 200 }` for unknown languages so callers
 * default to the contract's widest window when handed an unexpected
 * BCP-47 code — preserves the pre-2026-05 behaviour for non-supported
 * languages.
 */
export function descriptionWindowForLanguage(lang: string | null | undefined): {
  readonly softMin: number;
  readonly hardMax: number;
} {
  if (!lang) return LANG_DESCRIPTION_WINDOWS.en!;
  // Real-world callers pass BCP-47 strings from `<html lang>` attrs,
  // RSS feeds and CMSes (`zh-CN`, `JA`, `Ar`, `  de  `, `nb-NO`, …).
  // Normalise to the primary subtag (lower-case, stripped) before
  // lookup so every variant resolves to the canonical window. Falls
  // back to the EN window for unknown / malformed inputs.
  const primary = lang.toString().trim().toLowerCase().split(/[-_]/)[0];
  if (!primary) return LANG_DESCRIPTION_WINDOWS.en!;
  return LANG_DESCRIPTION_WINDOWS[primary] ?? LANG_DESCRIPTION_WINDOWS.en!;
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
 * Implements `seo-metadata-contract.md` §3.1 + §4: every language ships
 * within its own SERP-width window via {@link descriptionWindowForLanguage}.
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
    if (/^#+\s/.test(p)) break;
    if (/^<!--/.test(p)) continue;
    if (/^\|/.test(p)) continue;
    if (/^```/.test(p)) continue;
    if (/^[>*]\s/.test(p)) continue;
    if (/^[-*_]{3,}\s*$/.test(p)) continue;
    const fragments = p.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
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
    if (/^#+\s/.test(p)) continue;
    if (/^<!--/.test(p)) continue;
    if (/^\|/.test(p)) continue;
    if (/^```/.test(p)) continue;
    if (/^[>*]\s/.test(p)) continue;
    if (/^[-*_]{3,}\s*$/.test(p)) continue;
    const fragments = p.split(ADMIN_FRAGMENT_SPLITTER).filter(Boolean);
    if (fragments.length > 0 && fragments.every((f) => ADMIN_FIELD_RE.test(f.trim()))) continue;
    return stripBlufLabel(markdownInlineToText(p));
  }
  return null;
}

/**
 * Compose a rich `<meta description>` from the executive-brief markdown,
 * combining the BLUF lead sentence with the top 2-3 bullet items from the
 * brief's headline-summary section (`## 60-Second Read` in English, or
 * the localized equivalent — see
 * {@link ./brief-extractor.ts | extractHeadlineSection}).
 *
 * Editorial rationale: pre-2026-05 the description was the raw BLUF
 * paragraph — well-written prose but generic across articles ("Sweden's
 * Riksdag advances ... amid coalition tensions ..."). The brief's
 * headline section carries the *specific* signal (bill IDs HD03267 /
 * HD03262, committee codes JuU / SfU, DIW scores) that journalists and
 * search engines should see in the SERP snippet. This composer prepends
 * a single BLUF lead sentence (for prose context) and concatenates the
 * cleaned bullet IDs/topics that fit in the language's SERP window.
 *
 * Falls back to the plain BLUF paragraph when no headline section is
 * present (~75% of briefs use only the BLUF). Pure function — no I/O.
 *
 * @param briefMarkdown Full executive-brief.md contents (any language).
 * @param lang          Language code for both the headline-section name
 *                      lookup and the per-language SERP window.
 */
export function composeRichDescription(
  briefMarkdown: string,
  lang: Language,
): string {
  if (!briefMarkdown || briefMarkdown.trim().length === 0) return '';
  const { softMin, hardMax } = descriptionWindowForLanguage(lang);

  const blufParagraph = readBlufParagraph(briefMarkdown) ?? readFirstParagraph(briefMarkdown);
  const headlineSection = extractHeadlineSection(briefMarkdown, lang);

  // Pull the first sentence of the BLUF as the lede. Falls back to the
  // truncated whole paragraph when the BLUF has no sentence terminator
  // within the window.
  let lede = '';
  if (blufParagraph) {
    const normalised = blufParagraph.replace(/\s+/g, ' ').trim();
    SENTENCE_END_RE.lastIndex = 0;
    const firstEnd = SENTENCE_END_RE.exec(normalised);
    lede = firstEnd
      ? normalised.slice(0, firstEnd.index + firstEnd[0].length).trim()
      : normalised;
  }

  // When there's no headline section, ship the BLUF as-is (current
  // behaviour, preserved for ~75% of briefs).
  if (headlineSection.bullets.length === 0) {
    if (!blufParagraph) return '';
    return truncateToSentenceBoundary(blufParagraph, softMin, hardMax);
  }

  // Compose `<lede> <bullet-1>; <bullet-2>; …` adding bullets until the
  // next bullet would push us past the hard max. Each bullet is reduced
  // to its first clause (before the first `—`, `:`, or `.`) so we ship
  // the bill-ID + topic, not the entire DIW rationale.
  const bulletClauses: string[] = [];
  for (const bullet of headlineSection.bullets) {
    const clause = firstClauseOf(bullet);
    if (clause.length === 0) continue;
    bulletClauses.push(clause);
  }

  if (bulletClauses.length === 0) {
    if (!blufParagraph) return '';
    return truncateToSentenceBoundary(blufParagraph, softMin, hardMax);
  }

  // Sentence-style separator between lede and the bullet sequence.
  const SEP = ' — ';
  const BULLET_SEP = '; ';

  let composed = lede;
  for (const clause of bulletClauses) {
    const next = composed.length === 0
      ? clause
      : `${composed}${composed === lede ? SEP : BULLET_SEP}${clause}`;
    if (next.length > hardMax) break;
    composed = next;
  }

  // If we never fit a single bullet, fall through to BLUF truncation —
  // that's strictly better signal than nothing.
  if (composed === lede && lede.length > hardMax) {
    return truncateToSentenceBoundary(lede, softMin, hardMax);
  }
  if (composed.length === 0) {
    if (!blufParagraph) return '';
    return truncateToSentenceBoundary(blufParagraph, softMin, hardMax);
  }
  return truncateToSentenceBoundary(composed, softMin, hardMax);
}

/**
 * Return the first clause of a bullet — text up to the first em-dash,
 * en-dash, colon, or sentence-terminator. Drops trailing whitespace and
 * any dangling DIW-score parenthetical (`— 132 DIW`) so the composed
 * description carries the bill-ID + topic but not the editor-internal
 * scoring metadata.
 */
function firstClauseOf(bullet: string): string {
  // Strip trailing DIW-score / parenthetical scoring noise so the bullet
  // reads as journalistic prose rather than editor metadata.
  const withoutScore = bullet
    .replace(/\s*[—–-]\s*\d+(?:\.\d+)?\s*DIW\b[^—–-]*$/i, '')
    .replace(/\s*\([^()]*DIW[^()]*\)\s*$/i, '')
    .trim();

  // First clause boundary: em-dash, en-dash, colon, or sentence end.
  // Period is allowed since brief authors use it inside bill-ID prose
  // ("HD03267 (JuU): SÄPO-triggered fast-track deportation").
  const m = /[—–]|:\s/u.exec(withoutScore);
  if (!m) return withoutScore;
  const head = withoutScore.slice(0, m.index).trim();
  const tail = withoutScore.slice(m.index + m[0].length).trim();
  // Re-join with `: ` so the bill ID stays attached to its topic; this
  // gives "HD03267 (JuU): SÄPO-triggered fast-track deportation".
  if (head.length === 0) return tail;
  if (tail.length === 0) return head;
  return `${head}: ${tail}`;
}
