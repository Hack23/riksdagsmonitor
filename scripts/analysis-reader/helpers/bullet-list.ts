/**
 * @module analysis-reader/helpers/bullet-list
 * @description Extract markdown bullet lists as plain string arrays.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Extract a bullet list from a markdown section as an array of strings.
 * Handles both `- item` and `* item` formats.
 */
export function extractBulletList(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.replace(/^[\s\-*]+/, '').trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));
}
