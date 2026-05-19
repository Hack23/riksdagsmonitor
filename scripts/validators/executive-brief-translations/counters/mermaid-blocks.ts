/**
 * @module scripts/validators/executive-brief-translations/counters/mermaid-blocks
 * @description Count Mermaid fenced code blocks specifically.
 *
 *              Rule census: extracted from
 *              `scripts/validate-executive-brief-translations.ts` lines
 *              157–161. Logic is byte-identical to the original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/** Count Mermaid fenced code blocks specifically. */
export function countMermaidBlocks(md: string): number {
  const matches = md.match(/^```mermaid\b/gm);
  return matches ? matches.length : 0;
}
