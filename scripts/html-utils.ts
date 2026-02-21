/**
 * @module Infrastructure/HTMLSanitization
 * @description XSS-safe HTML entity escaping utility.
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
