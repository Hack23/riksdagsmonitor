/**
 * @module scripts/validators/article/rules/stale-provenance
 * @description Stale-provenance scanner — flag `economicProvenance`
 *              blocks whose `retrieved_at` vintage is older than 6
 *              months and lacks a `<!-- stale-vintage: reason -->`
 *              annotation.
 *
 *              Rule census: extracted from
 *              `scripts/validate-article.ts` lines 442–478
 *              (`scanStaleProvenance`). Logic is byte-identical to the
 *              original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * Scan `economicProvenance` blocks for stale vintage (>6 months without
 * annotation). Returns stale entries.
 *
 * Provenance blocks look like:
 * ```
 * economicProvenance:
 *   provider: imf
 *   ...
 *   retrieved_at: 2026-01-15
 * ```
 * or inline: `retrieved_at: 2026-01-15`
 */
export function scanStaleProvenance(
  text: string,
  referenceDate: Date = new Date(),
): Array<{ retrievedAt: string; ageMonths: number }> {
  const stale: Array<{ retrievedAt: string; ageMonths: number }> = [];
  const dateRe = /retrieved_at:\s*(\d{4}-\d{2}-\d{2})/g;
  let m: RegExpExecArray | null;
  while ((m = dateRe.exec(text)) !== null) {
    const dateStr = m[1]!;
    const retrieved = new Date(dateStr);
    const diffMs = referenceDate.getTime() - retrieved.getTime();
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
    if (diffMonths > 6) {
      const lineStart = text.lastIndexOf('\n', m.index) + 1;
      const prevLineEnd = lineStart > 0 ? lineStart - 1 : 0;
      const prevLineStart = text.lastIndexOf('\n', prevLineEnd - 1) + 1;
      const prevLine = text.slice(prevLineStart, prevLineEnd).trim();
      if (!prevLine.includes('<!-- stale-vintage')) {
        stale.push({ retrievedAt: dateStr, ageMonths: Math.round(diffMonths * 10) / 10 });
      }
    }
  }
  return stale;
}

import type { ArticleViolation } from '../types.js';

/** Stale-economic-provenance rule. */
export function checkStaleProvenance(rel: string, text: string): ArticleViolation[] {
  if (!text.includes('retrieved_at:')) return [];
  const stale = scanStaleProvenance(text);
  if (stale.length === 0) return [];
  const sample = stale.slice(0, 2).map((e) => `${e.retrievedAt} (${e.ageMonths}mo)`).join(', ');
  return [
    {
      file: rel,
      code: 'stale-economic-provenance',
      message: `${stale.length} economicProvenance block(s) have vintage >6 months without annotation: ${sample}. Wrap in <!-- stale-vintage: reason --> or refresh data per ECONOMIC_DATA_CONTRACT.md.`,
    },
  ];
}
