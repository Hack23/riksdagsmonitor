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
  stripBlufLabel,
} from './description.js';
import { prettifyFallbackTitle } from './../order.js';
import { stripBriefPrefix } from './brief-prefixes.js';
import type { Language } from '../../../types/language.js';

/**
 * Read the first top-level H1 from a markdown body. Returns the trimmed
 * heading text without the leading `# ` token, or `null` if none found.
 *
 * Supports both markdown `# heading` and HTML `<h1>content</h1>` forms
 * (some executive briefs use `<h1 align="center">` for formatting).
 */
export function readFirstHeading(markdown: string): string | null {
  // Try markdown H1 first.
  const mdMatch = markdown.match(/^\s*#\s+(.+?)\s*$/m);
  if (mdMatch) return mdMatch[1].trim();
  // Fallback: HTML <h1> tag (single-line or multiline with attributes).
  const htmlMatch = markdown.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (htmlMatch) {
    // Strip nested HTML tags (e.g. <img>, <a>, <em>) and leading emoji.
    // Loop to prevent incomplete sanitization when tags are nested/overlapping.
    let text = htmlMatch[1];
    let prev: string;
    do {
      prev = text;
      text = text.replace(/<[^>]+>/g, '');
    } while (text !== prev);
    text = text.replace(/^\s*[\p{Emoji_Presentation}\p{Extended_Pictographic}]+\s*/u, '').trim();
    return text.length > 0 ? text : null;
  }
  return null;
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
 * - when `lang` is provided, also strip the *translated* boilerplate
 *   prefix in that language (`Exekutiv sammanfattning — ` in SV,
 *   `Zusammenfassung — ` in DE, `Synthèse exécutive — ` in FR, etc.).
 *   See `./brief-prefixes.ts` for the per-language dictionary.
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
export function cleanArticleTitle(
  raw: string | null,
  subfolder?: string,
  lang?: Language,
): string | null {
  if (!raw) return null;
  const minLength = lang && ['ja', 'ko', 'zh'].includes(lang) ? 10 : 20;
  let t = raw.trim();
  // NOTE: `\p{Emoji}` is intentionally excluded here — Unicode marks ASCII
  // digits as emoji-capable because of keycap sequences (`1️⃣`, `2️⃣`, …).
  // Including `\p{Emoji}` therefore strips legitimate year-led CJK titles
  // like `2026年5月展望…`, silently degrading them to `年5月展望…`.
  t = t.replace(/^[\s\p{Emoji_Presentation}\p{Extended_Pictographic}\p{P}\p{S}]+/u, '').trim();
  t = t.replace(/^(?:Executive\s+Brief|Intelligence\s+Brief|Intelligence\s+Assessment|Realtime\s+Monitor|Riksdag\s+Realtime\s+Monitor|Daily\s+Brief|BLUF|TL;DR|Top\s+Line|Bottom\s+Line)\s*[—–\-:]\s*/i, '');
  // Per-language Executive-Brief prefix strip — catches translated
  // boilerplate (`Exekutiv sammanfattning — `, `Zusammenfassung — `,
  // `Synthèse exécutive — `, `执行摘要：`, …) that the EN-only regex
  // above leaves untouched. See `./brief-prefixes.ts` for the
  // dictionary. When `lang` is unset / unknown, this is a no-op so
  // unilingual callers / legacy tests stay unaffected.
  if (lang) {
    t = stripBriefPrefix(t, lang).trim();
  }
  t = t.replace(/\s*[—–\-:]?\s*\d{4}[-/]\d{2}[-/]\d{2}(?:\s+\d{1,2}[:\-.]\d{2}(?:\s*UTC)?)?\s*$/i, '');
  t = t.replace(/\s*\d{4}[-/]\d{2}[-/]\d{2}(?:\s+\d{1,2}[:\-.]\d{2}(?:\s*UTC)?)?\s*/g, ' ');
  // Trailing-connector strip — split into two regexes so the case-
  // insensitive `i` flag does NOT extend to single-letter connectors
  // `a` / `à`. With a unified case-insensitive list, real titles ending
  // in a bare uppercase initial — `Tax Class A`, `Group À`, `Plan A`,
  // `Section A` — were silently truncated to `Tax Class` / `Group` /
  // `Plan` / `Section`, dropping the most informative token. Multi-
  // letter connectors (`to` / `till` / `bis` / `إلى` / `から` / `til`)
  // are still case-insensitive (they legitimately appear as `To` or
  // `Till` at end of Title-Case headlines after mid-sentence cuts);
  // the single-letter `a` / `à` are restricted to lowercase only,
  // which is how Spanish / Catalan / French prepositions render.
  t = t.replace(/[\s,;:]*(?:to|till|bis|إلى|から|til|–|—|-|:)\s*$/iu, '').trim();
  t = t.replace(/[\s,;:]*(?:à|a)\s*$/u, '').trim();
  // Strip a bare trailing comma / semicolon / colon left after editor
  // truncation (live cases: `Sweden Evening Analysis,`, `Week Ahead: Aid
  // Accountability,`, `Swedish Parliamentary Pulse,`). The connector
  // strip above only fires when a recognised word follows, so this is
  // the catch-all for dangling punctuation alone.
  t = t.replace(/[,;:]+\s*$/u, '').trim();
  t = t.replace(/\s+/g, ' ').trim();
  if (t.length < minLength) return null;

  if (subfolder) {
    const cleaned = normaliseTitleForCompare(t);
    const fallback = normaliseTitleForCompare(prettifyFallbackTitle(subfolder));
    if (fallback && cleaned === fallback) return null;
    const slugStems = subfolder
      .toLowerCase()
      .split(/[-_/]+/)
      .filter((s) => s.length >= 4);
    if (slugStems.length > 0) {
      const titleWords = cleaned.split(/\s+/).filter(Boolean);
      const connectorSet = new Set([
        'the', 'a', 'an', 'and', 'or', 'of', 'for', 'in', 'on', 'at',
        'by', 'to', 'with', 'from', 'as', 'is', 'are',
        'riksdag', 'riksdagen', 'government', 'opposition', 'committee',
        'committees', 'reports', 'report', 'debates', 'debate',
        'realtime', 'pulse', 'monitor', 'analysis',
      ]);
      const isStem = (w: string): boolean => {
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
 * The patterns cover well-formed date leads in English, Swedish, German,
 * and French — the four primary content languages. Translated articles in
 * other languages get their own per-language dictionaries via the
 * `news-translate` workflow.
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
  // Swedish "Den <day> <månad> <year>" (e.g. `Den 13 maj 2026 antog …`).
  // Swedish month names: januari, februari, mars, april, maj, juni,
  // juli, augusti, september, oktober, november, december.
  /^Den\s+\d{1,2}\s+(?:januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)\s+\d{4}\s*[,—–-]?\s+/i,
  // German "Am <day>. <Monat> <year>" — January…December plus
  // Mai/Mär/Juni/Juli for native forms.
  /^Am\s+\d{1,2}\.?\s+(?:Januar|Februar|März|Marz|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+\d{4}\s*[,—–-]?\s+/i,
  // French "Le <day> <mois> <year>" (e.g. `Le 13 mai 2026, …`).
  /^Le\s+\d{1,2}\s+(?:janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+\d{4}\s*[,—–-]?\s+/i,
];

/**
 * Verb-leading tokens that, when found at the start of the post-strip
 * sentence, indicate a grammatical subject was lost during date-prefix
 * stripping (e.g. `Friday 8 May 2026 marks …` → `marks …`). When
 * detected, we skip the strip and accept the date in the title rather
 * than ship a subjectless verb. Better SEO-incorrect than grammatically
 * broken.
 *
 * Covers English, Swedish, and German — mirroring the multilingual scope
 * of {@link BLUF_DATE_PREFIX_PATTERNS}. Swedish and German use V2
 * (verb-second) word order after fronted time adverbials, so stripping
 * `Den 13 maj 2026` or `Am 13. Mai 2026` leaves the verb before the
 * subject (e.g. `antog riksdagen …`, `beschloss der Bundestag …`).
 *
 * Curation criteria (intentionally a high-precision subset, not
 * comprehensive coverage):
 * - Common 3rd-person-singular verbs in political/legislative BLUF
 *   leads: `marks`, `shows`, `submitted`, `tabled`, `antog`, …
 * - Modal/auxiliary verbs that always need a subject: `will`, `would`,
 *   `must`, `should`, `ska`, `wird`, …
 * Not included: rare or domain-narrow verbs (false-positive risk).
 * Add new entries when an audit shows a real BLUF starting with the
 * verb after date-prefix strip; do not pre-emptively expand.
 */
const VERB_LEADING_TOKENS = new Set([
  // ── English ─────────────────────────────────────────────────────────
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

  // ── Swedish (V2 — date-adverbial fronting inverts subject/verb) ──────
  // Past tense forms common in political/legislative BLUF
  'antog',          // adopted  (riksdagen antog / statsduman antog)
  'beslutade',      // decided
  'röstade',        // voted
  'godkände',       // approved
  'avslog',         // rejected
  'föreslog',       // proposed
  'presenterade',   // presented
  'tillkännagav',   // announced
  'fastställde',    // established / set
  'inledde',        // initiated
  'avslutade',      // concluded
  'avvisade',       // dismissed
  'bekräftade',     // confirmed
  'behandlade',     // processed
  'debatterade',    // debated
  'lade',           // submitted (lade fram)
  'passerade',      // passed
  // Swedish modal / future forms
  'ska',            // shall / will
  'vill',           // wants
  'måste',          // must
  'bör',            // should

  // ── German (V2 — fronted adverbials invert subject/verb) ─────────────
  // Past-tense (Präteritum) forms common in political/legislative BLUF
  'beschloss',      // decided / resolved
  'verabschiedete', // passed / enacted
  'stimmte',        // voted
  'lehnte',         // rejected
  'kündigte',       // announced
  'präsentierte',   // presented
  'veröffentlichte',// published
  'einigte',        // agreed
  'wählte',         // elected / chose
  'berief',         // convened
  'scheiterte',     // failed
  'bestätigte',     // confirmed
  'erklärte',       // declared / explained
  'stellte',        // presented (stellte vor)
  'trat',           // entered (trat in Kraft = came into force)
  'nahm',           // took (nahm an = adopted)
  // German modal / auxiliary forms
  'wird',           // will
  'soll',           // should / shall
  'muss',           // must
  'kann',           // can
]);

function startsWithVerb(text: string): boolean {
  // Use \p{L} (Unicode letter) so Swedish ä/å/ö and German ä/ö/ü are
  // captured correctly (e.g. `röstade`, `godkände`, `veröffentlichte`).
  const m = text.match(/^(\p{L}+)/u);
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
/**
 * Read the first paragraph from a `## Headline` (or equivalent) section in
 * an executive brief. Many briefs include a dedicated headline section with
 * a purpose-written summary sentence that outperforms the generic BLUF
 * paragraph for SERP titles.
 *
 * Recognised section headings (case-insensitive):
 *   - `## Headline` / `## Headlines`
 *   - `## Intelligence Summary`
 *   - `## BLUF` / `## 🎯 BLUF`
 *
 * Returns the first non-empty paragraph text (not bullets) from the matched
 * section, or `null` if no such section exists or contains no paragraph.
 */
export function readHeadlineParagraph(briefMarkdown: string | undefined): string | null {
  if (!briefMarkdown) return null;
  const lines = briefMarkdown.split(/\r?\n/);
  const HEADING_NAMES = [
    'headline', 'headlines',
    'intelligence summary',
    'bluf', '🎯 bluf',
  ];
  let inSection = false;
  let paragraphLines: string[] = [];

  for (const line of lines) {
    const isH2 = /^##\s/.test(line);
    const isH1OrHigher = /^#\s/.test(line);

    if (isH2) {
      if (inSection) break; // next H2 ends the section
      const headingText = line.replace(/^##\s+/, '').replace(/[*_`#]/g, '').trim().toLowerCase();
      if (HEADING_NAMES.some((n) => headingText === n || headingText.startsWith(n + ' '))) {
        inSection = true;
      }
      continue;
    }
    if (inSection && isH1OrHigher) break;
    if (!inSection) continue;

    // Skip thematic breaks, blank lines, bullets, metadata lines
    if (/^[-*_]{3,}\s*$/.test(line)) continue;
    if (/^[\s>]*[-*•·]\s+/u.test(line)) continue;
    if (/^\*\*[^*]+\*\*:?\s/.test(line) && line.length < 80) continue; // metadata like **Date:** ...
    if (/^</.test(line.trim())) continue; // HTML tags

    const trimmed = line.trim();
    if (trimmed.length === 0) {
      // Blank line: if we already collected paragraph text, we're done.
      if (paragraphLines.length > 0) break;
      continue;
    }
    paragraphLines.push(trimmed);
  }

  if (paragraphLines.length === 0) return null;
  return paragraphLines.join(' ').trim() || null;
}

export function titleFromBluf(bluf: string | null, maxLen: number = 70): string | null {
  if (!bluf) return null;
  const cleanRaw = markdownInlineToText(bluf);
  if (!cleanRaw) return null;
  const labelStripped = stripBlufLabel(cleanRaw);
  const stripped = stripLeadingDatePrefix(labelStripped).trim();
  const meaningful = stripped.replace(/^[\s.!?…。।,;:—–-]+/u, '').trim();
  if (meaningful.length < 5) return null;
  // Strip embedded date-appositive clauses that bloat the title without
  // adding editorial value. Pattern: "... of DD Month YYYY — <appositive> —"
  // e.g. "Sweden's Riksdag session of 26 May 2026 — approximately 100 days
  // before the election — delivered ..." → "Sweden's Riksdag session delivered ..."
  const dateAppositive = meaningful.replace(
    /\s+of\s+\d{1,2}\s+[A-Z][a-z]+\s+\d{4}\s*[—–-]\s*[^—–-]+[—–-]\s*/,
    ' ',
  );
  const effective = dateAppositive.length >= 20 ? dateAppositive : meaningful;
  const clean = capitaliseFirst(effective);
  SENTENCE_END_RE.lastIndex = 0;
  const m = SENTENCE_END_RE.exec(clean);
  const firstSentence = m ? clean.slice(0, m.index + m[0].length) : clean;
  if (firstSentence.length <= maxLen) {
    const trimmed = firstSentence.replace(/\s*[.!?…。।]+\s*$/, '').trim();
    return trimTrailingConnectors(trimmed) || null;
  }
  const sliced = firstSentence.slice(0, maxLen);
  const lastSpace = sliced.lastIndexOf(' ');
  let cut = (lastSpace > 30 ? sliced.slice(0, lastSpace) : sliced).trim();
  // Dangling-tail guard — if the cut ends on a ≤ 3-char word (`two`,
  // `the`, `on`, `of`, …) it reads as a truncated fragment. Step back
  // to the previous word boundary so the title ends on a substantive
  // word. Live cases: `… has advanced two` (committeeReports),
  // `… of` (interpellations), `… on the` (weekly-review).
  // Word lengths ≤ 3 are the empirical cutoff: 4+-char words like
  // `bill`, `cuts`, `vote`, `Tidö` are substantive enough to end a
  // title. Numeric tails (e.g. `12`, `7`) are also substantive even
  // when ≤ 3 chars, so they short-circuit the step-back loop.
  let safetyCounter = 0;
  while (safetyCounter < 5) {
    const tail = cut.match(/(\S+)$/);
    if (!tail) break;
    const tailWord = tail[1]!;
    // Length test uses the raw tail word — leading/trailing
    // sentence-end punctuation (`. ! ? …`) was already stripped from
    // `firstSentence` upstream, and `cut.trim()` removes leading
    // space, so `tailWord` is the bare word. Tails containing digits
    // (numbers like `12` or `7`) are substantive and allowed even at
    // ≤ 3 chars.
    if (tailWord.length > 3 || /\d/.test(tailWord)) break;
    // Step back to the previous word boundary.
    const previousSpace = cut.lastIndexOf(' ');
    if (previousSpace < 30) break;
    cut = cut.slice(0, previousSpace).trim();
    safetyCounter += 1;
  }
  const cleaned = trimTrailingConnectors(cut);
  return cleaned || null;
}
