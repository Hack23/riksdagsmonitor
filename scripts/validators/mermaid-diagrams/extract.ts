/**
 * @module scripts/validators/mermaid-diagrams/extract
 * @description Extract `\`\`\`mermaid` blocks from a Markdown body.
 *              Block boundary logic is **byte-identical** to
 *              {@link findUnclosedMermaidFences} in
 *              `scripts/validators/article/rules/mermaid-fences.ts`
 *              and to `preprocessMermaidFences` in
 *              `scripts/render-lib/markdown/mermaid-preprocess.ts`,
 *              so reported line numbers and parse-targets exactly
 *              match what the renderer feeds to Mermaid at runtime.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

/**
 * One ` ```mermaid ` block extracted from a Markdown source file.
 *
 * - `startLineNumber` is 1-indexed and points at the opening
 *   ` ```mermaid ` line.
 * - `bodyStartLineNumber` is 1-indexed and points at the first line
 *   *inside* the block (i.e. `startLineNumber + 1`). This is the
 *   anchor Mermaid uses for "Parse error on line N" diagnostics.
 * - `endLineNumber` is 1-indexed and points at the closing ` ``` `
 *   line; when the block is unclosed it points at the implied end
 *   (next opening fence line or end-of-input + 1).
 * - `body` is the raw text **between** the opening and the closing
 *   fences, exactly as fed to `mermaid.parse()`. No trailing newline.
 */
export interface MermaidBlock {
  readonly startLineNumber: number;
  readonly bodyStartLineNumber: number;
  readonly endLineNumber: number;
  readonly body: string;
  readonly closed: boolean;
}

/**
 * Walk `markdown` line-by-line and extract every ` ```mermaid ` block.
 *
 * Recognition rules (matching the renderer + article-validator):
 *   - Opening fence: `/^```mermaid[\t ]*$/`
 *   - Closing fence: `/^```[\t ]*$/`
 *   - Any other ` ``` ` line (e.g. another language tag) is treated
 *     as an implicit close and the current block is reported as
 *     **unclosed**.
 *
 * Pure function — never mutates `markdown` or any global state.
 */
export function extractMermaidBlocks(markdown: string): readonly MermaidBlock[] {
  const lines = markdown.split('\n');
  const out: MermaidBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    if (/^```mermaid[\t ]*$/.test(lines[i]!)) {
      const startLineNumber = i + 1;
      const bodyStartLineNumber = i + 2;
      const collected: string[] = [];
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
        collected.push(cur);
      }
      out.push({
        startLineNumber,
        bodyStartLineNumber,
        endLineNumber: j + 1,
        body: collected.join('\n'),
        closed,
      });
      i = stoppedAtNextOpening ? j : j + 1;
      continue;
    }
    i += 1;
  }
  return out;
}

/**
 * Detect the diagram-type keyword (e.g. `flowchart`, `quadrantChart`,
 * `xychart-beta`, `mindmap`, `sequenceDiagram`, `pie`, …) of a Mermaid
 * block body. Skips any `%%{init …}%%` directive and `%% …` comment
 * lines so that the prologue does not mask the real diagram type.
 *
 * Returns `''` if the block body is empty or contains nothing but
 * directives/comments.
 */
export function detectMermaidDiagramType(body: string): string {
  // Strip the leading `%%{init …}%%` block, which may span multiple
  // lines (mirrors the regex used by ensureMermaidTheme + the renderer).
  const withoutInit = body.replace(/^[\s\S]*?%%\{[\s\S]*?\}%%\s*/, (m) => {
    // Only strip if the directive starts at the very beginning of the
    // body — otherwise leave the body untouched so we still inspect
    // every line.
    return m.startsWith('%%{') || /^\s*%%\{/.test(m) ? '' : m;
  });
  for (const raw of withoutInit.split('\n')) {
    const line = raw.trim();
    if (line === '') continue;
    if (line.startsWith('%%')) continue;
    // Take the first whitespace-separated token, stripping a trailing colon
    // (e.g. `gantt:` is not standard but we are defensive).
    const first = line.split(/[\s:]+/)[0]!;
    return first;
  }
  return '';
}
