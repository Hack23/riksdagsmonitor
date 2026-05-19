/**
 * @module scripts/validators/executive-brief-translations/counters/code-fences
 * @description Count fenced code blocks (any info string).
 *
 *              Rule census: extracted from
 *              `scripts/validate-executive-brief-translations.ts` lines
 *              149–155. Logic is byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Count fenced code blocks (any info string). */
export function countCodeFences(md: string): number {
  const matches = md.match(/^```/gm) ?? [];
  if (matches.length % 2 !== 0) return Number.NaN;
  // Each fence is one of opening/closing; divide by 2.
  return matches.length / 2;
}
