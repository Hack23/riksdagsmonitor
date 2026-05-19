/**
 * @module scripts/validators/article/rules/footer
 * @description Footer-marker duplicate detector.
 *
 *              Rule census: extracted from
 *              `scripts/validate-article.ts` lines 126–149
 *              (`FOOTER_MARKER_PATTERNS`). Logic is byte-identical to
 *              the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Footer-style markers that must not appear more than once in the
 * aggregated article. Catches the same family of repeated blocks the
 * cleaning pipeline guards against in
 * {@link scripts/render-lib/aggregator/cleaning/structural.ts}.
 *
 * Each pattern anchors to the start of a line (`^`) and matches the
 * **full line** content so that two distinct footer lines like
 * `**ISMS classification**: PUBLIC, no PII.` and
 * `**ISMS classification**: INTERNAL, restricted.` produce different
 * match strings and are therefore NOT flagged as duplicates. Only
 * truly identical footer lines (same text) are counted.
 *
 * Patterns are case-insensitive to catch `**isms …**` emitted by
 * some AI templates.
 */
export const FOOTER_MARKER_PATTERNS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
  { pattern: /^[^\S\n]*\*\*ISMS\b[^\n]*/gim, label: '**ISMS …**' },
  { pattern: /^[^\S\n]*\*\*Classified under\b[^\n]*/gim, label: '**Classified under …**' },
  { pattern: /^[^\S\n]*\*\*Hack23 ISMS\b[^\n]*/gim, label: '**Hack23 ISMS …**' },
  { pattern: /^[^\S\n]*\*\*Article-Generation contract\b[^\n]*/gim, label: '**Article-Generation contract …**' },
  { pattern: /^[^\S\n]*\*\*Provenance\b[^\n]*/gim, label: '**Provenance …**' },
  { pattern: /^[^\S\n]*\*\*GDPR\b[^\n]*/gim, label: '**GDPR …**' },
];

import type { ArticleViolation } from '../types.js';

/** Duplicate-footer-marker rule. */
export function checkFooterMarkers(rel: string, text: string): ArticleViolation[] {
  const out: ArticleViolation[] = [];
  for (const marker of FOOTER_MARKER_PATTERNS) {
    const matches = text.match(marker.pattern) ?? [];
    if (matches.length > 1) {
      const unique = new Set(matches);
      if (unique.size < matches.length) {
        out.push({
          file: rel,
          code: 'duplicate-footer-marker',
          message: `Footer marker ${marker.label} appears ${matches.length} times with ${matches.length - unique.size} duplicate(s) — collapse via the cleaning pipeline (scripts/render-lib/aggregator/cleaning/structural.ts → collapseRepeatedFooterBlocks).`,
        });
      }
    }
  }
  return out;
}
