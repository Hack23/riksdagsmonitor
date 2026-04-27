/**
 * @module Infrastructure/Rss/PubDate
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Stable publication-date derivation
 *
 * @description
 * Derives a deterministic publication date from the article filename's
 * `YYYY-MM-DD` prefix (parsed as 12:00 UTC), falling back to filesystem
 * mtime when the filename has no date prefix, then to a fixed sentinel
 * (`2026-01-01T12:00:00.000Z`) when stat fails. Never uses "now" so RSS
 * builds are reproducible across CI runners.
 *
 * Round-6 split: extracted from `scripts/generate-rss.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';

/**
 * Resolve a deterministic ISO publication date for an article file.
 * Prefers the `YYYY-MM-DD` filename prefix, then filesystem mtime,
 * finally a fixed sentinel — never `Date.now()`.
 */
export function stablePubDate(filePath: string): string {
  const basename = path.basename(filePath);
  const dateMatch = basename.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    return new Date(`${dateMatch[1]}T12:00:00Z`).toISOString();
  }
  try {
    return fs.statSync(filePath).mtime.toISOString();
  } catch (_e: unknown) {
    return '2026-01-01T12:00:00.000Z';
  }
}
