/**
 * @module Infrastructure/Rss/Escape
 * @category Intelligence Operations / Supporting Infrastructure
 * @name XML escaper for RSS payloads
 *
 * @description
 * Pure-string XML escaper used by every `<item>` field in `rss.xml`.
 * Preserves valid pre-encoded entities (`&amp;`, `&#39;`, `&lt;`, etc.)
 * by only escaping `&` when it is not already part of an entity.
 *
 * Round-6 split: extracted from `scripts/generate-rss.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

/**
 * Escape XML special characters while preserving valid pre-encoded
 * entities. Used for both attribute values and text content.
 */
export function escapeXml(text: string): string {
  return text
    .replace(/&(?!(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
