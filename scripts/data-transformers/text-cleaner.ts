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

  s = s.replace(/&nbsp;/gi, ' ');

  const DOK_PREFIX = /^\s*\d{6,}\s+HD\S+\s+\d{4}\/\d{2}\s+\d+\s+(?:[a-zäöå]{2,4}\s+){1,10}/i;
  if (DOK_PREFIX.test(s)) {
    s = s.replace(DOK_PREFIX, '');
  }

  s = s.replace(/#(?:page|id)_\d+\b/gi, ' ');

  s = s.replace(/\.[a-z_][a-z0-9_-]{0,80}\s*\{[^{}]{0,400}\}/gi, ' ');

  s = s.replace(
    /\b([\p{L}][\p{L}\p{M}]{1,40})(?:\s+\1\b){2,}/giu,
    '$1'
  );

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
    /\.[a-z_][a-z0-9_-]{0,80}\s*\{[^{}]{0,400}\}/i.test(s) ||
    /#(?:page|id)_\d+\b/i.test(s)
  );
}
