/**
 * @module scripts/validators/article/rules/mermaid-fences
 * @description Mermaid fence integrity helpers — detect unclosed
 *              ```mermaid fences and count opening fences for coverage
 *              checks.
 *
 *              Rule census: extracted from
 *              `scripts/validate-article.ts` lines 250–313
 *              (`UnclosedMermaidFence`, `findUnclosedMermaidFences`,
 *              `countMermaidOpenings`). Logic is byte-identical to the
 *              original.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * One unclosed `\`\`\`mermaid` fence found in the article body.
 *
 * `lineNumber` is 1-indexed and points at the opening `\`\`\`mermaid`
 * line so the editor can jump straight to the regression.
 */
export interface UnclosedMermaidFence {
  readonly lineNumber: number;
  /** Line number where the fence implicitly ended (next opening fence
   *  or end-of-input). Useful for diagnostics. */
  readonly impliedEndLineNumber: number;
}

/**
 * Detect every `\`\`\`mermaid` opening fence whose matching closing
 * `\`\`\`` is missing in the body. The aggregator concatenates raw
 * artifact bodies and AI agents occasionally drop the closing fence —
 * the renderer ({@link preprocessMermaidFences}) recovers gracefully
 * by treating the next fence opening as an implicit close, but the
 * source artifact still needs to be fixed so downstream tools (the
 * `gh aw mcp inspect`-style audits, IDE preview, source review) stop
 * silently mis-rendering.
 *
 * Pure string analysis — never mutates the input.
 *
 * @param body Aggregated `article.md` contents.
 * @returns Empty array when every `\`\`\`mermaid` has a matching close.
 */
export function findUnclosedMermaidFences(body: string): readonly UnclosedMermaidFence[] {
  const lines = body.split('\n');
  const out: UnclosedMermaidFence[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (/^```mermaid[\t ]*$/.test(line)) {
      const openLine = i + 1;
      let j = i + 1;
      let closed = false;
      let stoppedAtNextOpening = false;
      for (; j < lines.length; j += 1) {
        const cur = lines[j]!;
        if (/^```[\t ]*$/.test(cur)) {
          closed = true;
          break;
        }
        if (/^```/.test(cur)) {
          stoppedAtNextOpening = true;
          break;
        }
      }
      if (!closed) {
        out.push({ lineNumber: openLine, impliedEndLineNumber: j + 1 });
      }
      i = stoppedAtNextOpening ? j : j + 1;
      continue;
    }
    i += 1;
  }
  return out;
}

/**
 * Count `\`\`\`mermaid` opening fences in a body. Used by the
 * mermaid-coverage cross-check between `article.md` and the source
 * artifacts under the same `analysis/daily/$DATE/$SUBFOLDER` folder.
 */
export function countMermaidOpenings(body: string): number {
  const matches = body.match(/^```mermaid[\t ]*$/gm);
  return matches ? matches.length : 0;
}

import type { ArticleViolation } from '../types.js';

/** Unclosed-mermaid-fence rule (the cross-folder coverage check is in the orchestrator). */
export function checkUnclosedMermaidFences(rel: string, text: string): ArticleViolation[] {
  const unclosed = findUnclosedMermaidFences(text);
  if (unclosed.length === 0) return [];
  const sample = unclosed.slice(0, 3).map((f) => `line ${f.lineNumber}`).join(', ');
  return [
    {
      file: rel,
      code: 'unclosed-mermaid-fence',
      message: `${unclosed.length} unclosed \`\`\`mermaid fence(s) detected (${sample}${unclosed.length > 3 ? ', …' : ''}). Add a closing \`\`\` line. The renderer recovers gracefully but the source artifact must be fixed so the analysis-gate Check 5 and IDE preview render correctly.`,
    },
  ];
}
