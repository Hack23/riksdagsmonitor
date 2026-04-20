/**
 * @module data-transformers/text-cleaner
 * @description Prose-hygiene filter for summary text passing through the
 *              article-generation pipeline. Strips the residual extraction
 *              artifacts that the existing {@link stripRiksdagRawDump} pass
 *              does not catch, namely:
 *
 *                - `&nbsp;` entity noise
 *                - `#page_\d+` and `#id_\d+` inline anchors
 *                - Repeated "Proposition Proposition …" stutters (and the
 *                  generic same-word-3-plus-times stutter pattern)
 *                - Leading numeric `<dok-id> HD<...> YYYY/YY NNN (prop|mot|bet) …`
 *                  metadata prefixes that survived upstream stripping
 *                - CSS rule fragments (belt-and-braces on top of
 *                  {@link stripRiksdagRawDump})
 *
 *              This is intentionally a narrow, easily auditable module. For
 *              broader document-text extraction, use
 *              {@link stripRiksdagRawDump} in `./helpers.ts` — this file is
 *              specifically the *final* hygiene pass applied to summary
 *              strings just before they are embedded in article HTML.
 *
 * @see analysis/agentic-workflow-quality-plan §P0-4
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Clean a summary/notis string for display in article HTML.
 *
 * Idempotent: running this twice is equivalent to running it once.
 *
 * @param text - Raw or partially-cleaned summary text
 * @returns Cleaned text safe to embed (after HTML-escaping) in article output
 */
export function cleanSummaryForDisplay(text: string | null | undefined): string {
  if (!text) return '';
  let s = String(text);

  // 1. Decode common HTML entities so downstream regexes see real whitespace.
  s = s.replace(/&nbsp;/gi, ' ');

  // 2. Strip Riksdag dok-id / metadata prefix that may still precede real prose.
  //    Shape: `5287561 HD03242 2025/26 242 prop prop prop Proposition 2025/26:242`
  //    We strip up to — but not including — the human-readable token that
  //    follows the metadata cluster.
  const DOK_PREFIX = /^\s*\d{6,}\s+HD\S+\s+\d{4}\/\d{2}\s+\d+\s+(?:[a-zäöå]{2,4}\s+){1,10}/i;
  if (DOK_PREFIX.test(s)) {
    s = s.replace(DOK_PREFIX, '');
  }

  // 3. Remove inline `#page_\d+` and `#id_\d+` anchors that the PDF→text
  //    extractor leaves embedded in prose.
  s = s.replace(/#(?:page|id)_\d+\b/gi, ' ');

  // 4. Strip CSS rule fragments on a best-effort basis. Bounded quantifier
  //    guarantees linear-time matching. Delegates the heavy CSS work to
  //    {@link stripRiksdagRawDump}, but catches residual single rules like
  //    `.p436{text-align:center}` that leak into summary fields directly.
  s = s.replace(/\.[a-z_][a-z0-9_-]{0,80}\{[^{}]{0,400}\}/gi, ' ');

  // 5. Collapse same-word stutters repeated ≥ 3 times ("Proposition Proposition
  //    Proposition Utr…" → "Proposition Utr…"). Guards against replacing
  //    legitimate prose — we only collapse when the word repeats back-to-back
  //    three or more times (Unicode letters only; punctuation not allowed
  //    inside the token to avoid crossing sentence boundaries).
  s = s.replace(
    /\b([\p{L}][\p{L}\p{M}]{1,40})(?:\s+\1\b){2,}/giu,
    '$1'
  );

  // 6. Collapse whitespace and trim.
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

/**
 * Convenience predicate: does the text still look like a raw Riksdag dump
 * after cleaning? Callers can use this to decide whether to fall back to a
 * metadata-generated summary instead of emitting the residue.
 */
export function looksLikeRawDump(text: string | null | undefined): boolean {
  if (!text) return false;
  const s = String(text);
  return (
    /^\s*\d{6,}\s+HD\S+\s+\d{4}\/\d{2}\s/.test(s) ||
    /\.[a-z_][a-z0-9_-]{0,80}\{[^{}]{0,400}\}/i.test(s) ||
    /#(?:page|id)_\d+\b/i.test(s)
  );
}
