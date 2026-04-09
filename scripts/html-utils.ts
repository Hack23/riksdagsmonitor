/**
 * @module Infrastructure/HTMLSanitization
 * @description XSS-safe HTML entity escaping and decoding utilities.
 * Bounded context: Infrastructure / Security
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

const HTML_ENTITY_MAP: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
} as const;

const HTML_ESCAPE_PATTERN = /[&<>"']/g;

/**
 * Escape HTML special characters for safe inclusion in HTML/JSON-LD.
 * Prevents XSS by converting &, <, >, ", ' to their HTML entity equivalents.
 *
 * @param text - Raw text to escape
 * @returns Escaped text safe for HTML insertion; empty string for falsy input
 */
export function escapeHtml(text: string | null | undefined | number): string {
  if (!text) return '';
  return String(text).replace(
    HTML_ESCAPE_PATTERN,
    (m: string): string => HTML_ENTITY_MAP[m] ?? m,
  );
}

/** Map of named HTML entities to their UTF-8 characters. */
const NAMED_ENTITY_MAP: Readonly<Record<string, string>> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': '\u00a0',
  '&mdash;': '—',
  '&ndash;': '–',
  '&lsquo;': '\u2018',
  '&rsquo;': '\u2019',
  '&ldquo;': '\u201c',
  '&rdquo;': '\u201d',
  '&bull;': '•',
} as const;

/**
 * Decode HTML numeric and named entities to their UTF-8 characters.
 * Converts `&#228;` → `ä`, `&#x00E4;` → `ä`, `&amp;` → `&`, etc.
 *
 * Use this to normalize text extracted from HTML before further processing,
 * preventing double-escaping when the text is later passed through escapeHtml().
 *
 * @param text - Text potentially containing HTML entities
 * @returns Text with entities decoded to UTF-8; empty string for falsy input
 */
export function decodeHtmlEntities(text: string | null | undefined): string {
  if (!text) return '';

  let result = String(text);

  // Decode numeric entities: &#228; → ä
  result = result.replace(/&#(\d+);/g, (_match: string, code: string): string => {
    const codePoint = parseInt(code, 10);
    try {
      return String.fromCodePoint(codePoint);
    } catch {
      return _match; // Keep invalid entities as-is
    }
  });

  // Decode hex entities: &#x00E4; → ä
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_match: string, hex: string): string => {
    const codePoint = parseInt(hex, 16);
    try {
      return String.fromCodePoint(codePoint);
    } catch {
      return _match;
    }
  });

  // Decode named entities
  result = result.replace(
    /&(?:amp|lt|gt|quot|apos|nbsp|mdash|ndash|lsquo|rsquo|ldquo|rdquo|bull);/g,
    (m: string): string => NAMED_ENTITY_MAP[m] ?? m,
  );

  return result;
}
