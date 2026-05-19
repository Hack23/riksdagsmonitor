/**
 * @module parliamentary-data/persistence/shared/sanitize
 * @description Filename / path-segment sanitisation shared across all
 * persistence helpers. Extracted from the original `data-persistence.ts`
 * monolith as part of the >600-line refactor (issue #2579).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Sanitize a Riksdag document identifier for safe use as a filename.
 * Lowercases, replaces non-alphanumeric characters (preserving Swedish chars
 * and hyphens), collapses runs of hyphens, trims leading/trailing hyphens,
 * and caps at 100 characters.
 */
export function sanitizeDokId(dokId: string): string {
  return dokId
    .toLowerCase()
    .replace(/[^a-z0-9åäö-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

/**
 * Sanitize a path segment to prevent path traversal.
 * Preserves underscores (common in MCP tool names like get_voting_group)
 * but removes slashes, null bytes, and dots-only sequences.
 */
export function sanitizePathSegment(segment: string): string {
  let safe = segment.replace(/[/\\:\0]/g, '_');
  if (/^\.+$/.test(safe)) safe = '_dots_';
  safe = safe.replace(/[^a-zA-Z0-9_\-åäöÅÄÖ]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 100);
  return safe || 'unknown';
}
