/**
 * @module Infrastructure/RenderLib/Aggregator/Cleaning/HeadingDemotion
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Heading demotion inside aggregated artifact bodies
 *
 * @description
 * Demote ATX headings by one level inside an artifact body — `##` → `###`,
 * `###` → `####`, …, capped at `######`. The aggregator wraps each
 * artifact under its own injected `## <title>`, so without this the
 * rendered article outline ends up flat (every artifact's internal H2s
 * become siblings of the wrapper H2). Indentation, fenced code blocks
 * and table contents are not affected — only line-anchored ATX headings
 * are matched.
 *
 * Headings inside fenced code blocks are explicitly excluded by
 * tracking fence state line-by-line.
 *
 * Extracted from `structural.ts` to maintain the ≤200 LOC single-
 * responsibility constraint.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

/**
 * Demote ATX headings by one level inside an artifact body — `##` → `###`,
 * `###` → `####`, …, capped at `######`. The aggregator wraps each
 * artifact under its own injected `## <Section title>`, so without this the
 * rendered article outline ends up flat (every artifact's internal H2s
 * become siblings of the wrapper H2).
 *
 * Headings inside fenced code blocks are explicitly excluded by
 * tracking fence state line-by-line.
 */
export function demoteHeadings(body: string): string {
  const lines = body.split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (/^\s{0,3}(?:```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{1,6})(\s+\S)/);
    if (!m) continue;
    const current = m[1]!.length;
    if (current >= 6) continue;
    if (current === 1) continue;
    lines[i] = '#'.repeat(current + 1) + line.slice(current);
  }
  return lines.join('\n');
}
