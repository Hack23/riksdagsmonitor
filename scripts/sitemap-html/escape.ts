/**
 * @module Infrastructure/SitemapHtml/Escape
 * @category Intelligence Operations / Supporting Infrastructure
 * @name HTML escaper
 *
 * @description
 * Pure-string HTML escaper used by every sitemap_${lang}.html page.
 * Escapes `&` only when it is not already part of a valid HTML entity
 * so existing entities (`&amp;`, `&#39;`, `&lt;` etc.) are preserved.
 *
 * Round-6 split: extracted from `scripts/generate-sitemap-html.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

/**
 * Escape HTML special characters to prevent XSS while preserving valid
 * pre-encoded entities. Used for both attribute values and text content.
 */
export function escapeHtml(text: string): string {
  return text
    // Escape & only when it is NOT already part of a valid HTML entity
    .replace(/&(?!(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
