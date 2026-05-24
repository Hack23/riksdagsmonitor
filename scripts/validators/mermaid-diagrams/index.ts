/**
 * @module scripts/validators/mermaid-diagrams/index
 * @description Orchestrator for the Mermaid corpus validator.
 *              Validates every ` ```mermaid ` block in a Markdown
 *              file and (optionally) applies the deterministic
 *              {@link repairMermaidBlock} pipeline. Returns
 *              structured results so callers (CLI, vitest, gate
 *              check) can decide how to surface failures.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readFile, writeFile } from 'node:fs/promises';

import { extractMermaidBlocks, type MermaidBlock } from './extract.js';
import { parseMermaidBlock, type MermaidParseViolation } from './parse.js';
import { repairMermaidBlock } from './repair.js';

/**
 * One validation failure annotated with absolute file coordinates so
 * editor-jump links (`<file>:<line>:<col>`) work out of the box.
 */
export interface MermaidFileViolation {
  readonly file: string;
  /** 1-indexed line of the opening ` ```mermaid ` fence. */
  readonly blockStartLineNumber: number;
  /** 1-indexed line in the file where the parser reported the error. */
  readonly errorLineNumber: number | null;
  readonly category: MermaidParseViolation['category'] | 'unclosed-fence';
  readonly message: string;
}

/**
 * Aggregate report for one file: every block that failed plus the
 * total parsed (so the caller can compute pass rates).
 */
export interface MermaidFileReport {
  readonly file: string;
  readonly blocksTotal: number;
  readonly violations: readonly MermaidFileViolation[];
}

/**
 * Validate every Mermaid block in `markdown` and return the per-block
 * violations. Does not touch the filesystem.
 *
 * @param markdown Raw Markdown body (typically `await readFile(file, 'utf8')`).
 * @param file     Display name used in violation reports (the on-disk
 *                 path; only used for output formatting).
 */
export async function validateMermaidMarkdown(
  markdown: string,
  file: string,
): Promise<MermaidFileReport> {
  const blocks = extractMermaidBlocks(markdown);
  const violations: MermaidFileViolation[] = [];

  for (const block of blocks) {
    if (!block.closed) {
      violations.push({
        file,
        blockStartLineNumber: block.startLineNumber,
        errorLineNumber: block.startLineNumber,
        category: 'unclosed-fence',
        message:
          'Unclosed ```mermaid fence — add a closing ``` line. The renderer recovers but offline tools (this validator, IDE preview, gh aw mcp inspect) fail.',
      });
      continue;
    }
    const parseResult = await parseMermaidBlock(block.body);
    if (parseResult === null) continue;
    violations.push({
      file,
      blockStartLineNumber: block.startLineNumber,
      errorLineNumber:
        parseResult.bodyLineNumber === null
          ? block.startLineNumber
          : block.bodyStartLineNumber + parseResult.bodyLineNumber - 1,
      category: parseResult.category,
      message: parseResult.message,
    });
  }

  return { file, blocksTotal: blocks.length, violations };
}

/**
 * Aggregate {@link MermaidFileReport}s across an iterable of files.
 * Errors during a single-file validation are recorded as a synthetic
 * violation so one bad file does not abort the whole run.
 */
export async function validateMermaidFiles(
  files: readonly string[],
): Promise<readonly MermaidFileReport[]> {
  const out: MermaidFileReport[] = [];
  for (const file of files) {
    try {
      const markdown = await readFile(file, 'utf8');
      out.push(await validateMermaidMarkdown(markdown, file));
    } catch (err) {
      out.push({
        file,
        blocksTotal: 0,
        violations: [
          {
            file,
            blockStartLineNumber: 0,
            errorLineNumber: null,
            category: 'unknown',
            message: `read/validate failed: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      });
    }
  }
  return out;
}

/**
 * Outcome of one file-level repair pass.
 *
 * - `changed`  – at least one block was rewritten by the repair
 *                pipeline (file content differs).
 * - `repairedBlocks` – list of block start-lines (1-indexed) that
 *                were rewritten.
 * - `unrepairedViolations` – violations that survived all repair
 *                rules; the caller should surface these for manual
 *                review.
 */
export interface MermaidRepairResult {
  readonly file: string;
  readonly changed: boolean;
  readonly repairedBlocks: readonly number[];
  readonly unrepairedViolations: readonly MermaidFileViolation[];
}

/**
 * Repair as many Mermaid blocks as the deterministic pipeline can
 * handle. The file is rewritten **in place** when `write` is `true`
 * and at least one block changed; otherwise the function only reports
 * what *would* have changed (dry-run).
 *
 * Block-level repair workflow per file:
 *   1. Extract every block.
 *   2. For each block: if it currently parses, leave it alone.
 *      Otherwise run {@link repairMermaidBlock} once and re-parse.
 *      If the repaired body parses, splice it back into the file body.
 *      If it still fails, record the residual violation.
 *   3. Unclosed-fence blocks are also repaired by appending a
 *      synthetic ` ``` ` line at the implied end-of-block.
 */
export async function repairMermaidFile(
  file: string,
  options: { readonly write: boolean },
): Promise<MermaidRepairResult> {
  const original = await readFile(file, 'utf8');
  const lines = original.split('\n');
  const blocks = extractMermaidBlocks(original);

  // Walk blocks in REVERSE order so splicing later blocks does not
  // shift the line numbers of earlier ones.
  const repairedBlocks: number[] = [];
  const unrepaired: MermaidFileViolation[] = [];
  let mutated = false;

  for (let bi = blocks.length - 1; bi >= 0; bi -= 1) {
    const block = blocks[bi]!;

    // Unclosed fences: insert ` ``` ` right after the last line that
    // still looks like Mermaid diagram content, rather than at the
    // implied end (which is just before the next ```mermaid opener).
    // This prevents narrative markdown (`## …`, tables, paragraphs)
    // from being absorbed into the block.
    if (!block.closed) {
      const bodyLines = block.body.split('\n');
      const stopOffset = findFirstNarrativeOffset(bodyLines);
      // `block.bodyStartLineNumber` is 1-indexed → 0-indexed start is
      // `block.bodyStartLineNumber - 1`. Insertion index is the absolute
      // line where the close fence should appear (0-indexed).
      const bodyStartIdx = block.bodyStartLineNumber - 1;
      const fallbackInsertAt = block.endLineNumber - 1;
      const insertAt = stopOffset === null ? fallbackInsertAt : bodyStartIdx + stopOffset;
      lines.splice(insertAt, 0, '```');
      mutated = true;
      repairedBlocks.push(block.startLineNumber);
      continue;
    }

    const parseResult = await parseMermaidBlock(block.body);
    if (parseResult === null) continue;

    const repaired = repairMermaidBlock(block.body);
    if (repaired === block.body) {
      unrepaired.push({
        file,
        blockStartLineNumber: block.startLineNumber,
        errorLineNumber:
          parseResult.bodyLineNumber === null
            ? block.startLineNumber
            : block.bodyStartLineNumber + parseResult.bodyLineNumber - 1,
        category: parseResult.category,
        message: parseResult.message,
      });
      continue;
    }

    const reparse = await parseMermaidBlock(repaired);
    if (reparse !== null) {
      unrepaired.push({
        file,
        blockStartLineNumber: block.startLineNumber,
        errorLineNumber:
          parseResult.bodyLineNumber === null
            ? block.startLineNumber
            : block.bodyStartLineNumber + parseResult.bodyLineNumber - 1,
        category: parseResult.category,
        message: `repair did not converge: ${parseResult.message} → ${reparse.message}`,
      });
      continue;
    }

    // Splice the repaired body back into `lines` between the opening
    // fence (block.startLineNumber, 1-indexed) and the closing fence
    // (block.endLineNumber, 1-indexed). Indices in `splice` are
    // 0-based; we replace lines [start, end-1] inclusive with the new
    // body lines.
    const bodyLines = repaired.split('\n');
    const startIdx = block.startLineNumber; // first body line in 0-indexed array
    const endIdx = block.endLineNumber - 1; // closing fence in 0-indexed array
    lines.splice(startIdx, endIdx - startIdx, ...bodyLines);
    mutated = true;
    repairedBlocks.push(block.startLineNumber);
  }

  if (mutated && options.write) {
    await writeFile(file, lines.join('\n'), 'utf8');
  }

  return {
    file,
    changed: mutated,
    repairedBlocks: repairedBlocks.reverse(), // restore forward order
    unrepairedViolations: unrepaired,
  };
}

export { extractMermaidBlocks } from './extract.js';
export { parseMermaidBlock, categoriseMermaidParseError } from './parse.js';
export { repairMermaidBlock } from './repair.js';

/**
 * Heuristic: given the body lines of an unclosed Mermaid block,
 * return the 0-indexed offset (into `bodyLines`) of the first line
 * that is clearly narrative Markdown rather than diagram content.
 *
 * Returns `null` when no narrative line is found and the caller
 * should fall back to inserting the close fence at the implied
 * end-of-block (just before the next ```mermaid opener).
 *
 * Signals (any of these on a non-blank line ⇒ narrative):
 *   - ATX heading: `^#{1,6} `
 *   - Setext heading underline candidates are intentionally ignored
 *     (too noisy with diagram `---` separators).
 *   - Markdown table row: `^\|`
 *   - Blockquote: `^> `
 *   - Bold-paragraph opener: `^\*\*` on otherwise plain text
 *
 * The first matching line returns its offset; the caller will splice
 * the close fence at that absolute file line, so the blank line
 * before it (if any) ends up immediately after the fence — clean
 * separation.
 */
function findFirstNarrativeOffset(bodyLines: readonly string[]): number | null {
  for (let i = 0; i < bodyLines.length; i += 1) {
    const line = bodyLines[i]!;
    if (/^#{1,6}\s/.test(line)) return i;
    if (/^\|/.test(line)) return i;
    if (/^>\s/.test(line)) return i;
    if (/^\*\*[A-Za-zÅÄÖåäö]/.test(line)) return i;
  }
  return null;
}
