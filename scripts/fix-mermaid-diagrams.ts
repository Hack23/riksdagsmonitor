#!/usr/bin/env tsx
/**
 * @module scripts/fix-mermaid-diagrams
 * @description CLI that walks Markdown files (default scope:
 *              `analysis/**\/*.md`) and applies the deterministic
 *              repair pipeline defined in
 *              `scripts/validators/mermaid-diagrams/repair.ts` to
 *              every ` ```mermaid ` block that fails `mermaid.parse()`.
 *
 *              Default is **dry-run**: scans, reports what would
 *              change, and exits 0. Pass `--write` to apply the fixes
 *              in place.
 *
 *                npm run fix:mermaid -- --write
 *                npm run fix:mermaid -- analysis/templates/**\/*.md --write
 *
 *              Output: one line per fixed block (`file:line`), then a
 *              summary, then any residual violations that the
 *              deterministic rules could not handle (these need
 *              manual review).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readdirSync, statSync, type Dirent } from 'node:fs';
import { join, sep } from 'node:path';

import { repairMermaidFile } from './validators/mermaid-diagrams/index.js';

interface Args {
  readonly patterns: readonly string[];
  readonly write: boolean;
}

function parseArgs(argv: readonly string[]): Args {
  const patterns: string[] = [];
  let write = false;
  for (const a of argv) {
    if (a === '--write') {
      write = true;
      continue;
    }
    if (a.startsWith('--')) {
      process.stderr.write(`Unknown flag: ${a}\n`);
      process.exit(2);
    }
    patterns.push(a);
  }
  return {
    patterns: patterns.length > 0 ? patterns : ['analysis/**/*.md'],
    write,
  };
}

/**
 * Minimal glob substitute for the only pattern shape these CLIs ever
 * use: `<dir>/**\/*.<ext>` or a literal file path. Walks `<dir>`
 * recursively (synchronously) and returns every file whose extension
 * matches `<ext>`. Avoids pulling in the `glob` package which isn't a
 * declared production dependency (only an `overrides` entry).
 */
function expandPattern(pattern: string): readonly string[] {
  const match = /^(.*?)\/\*\*\/\*\.([A-Za-z0-9]+)$/.exec(pattern);
  if (!match) {
    // Literal file path — only include if it exists as a file.
    try {
      if (statSync(pattern).isFile()) return [pattern];
    } catch {
      return [];
    }
    return [];
  }
  const root = match[1] ?? '.';
  const ext = `.${match[2]!.toLowerCase()}`;
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries: Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true }) as Dirent[];
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(ext)) {
        // Normalise to forward slashes for cross-platform CLI output.
        out.push(full.split(sep).join('/'));
      }
    }
  };
  walk(root);
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const files = args.patterns.flatMap(expandPattern);
  const unique = Array.from(new Set(files)).sort();

  let filesChanged = 0;
  let blocksRepaired = 0;
  const allUnrepaired: { file: string; line: number; category: string; message: string }[] = [];
  // Multi-pass: closing an unclosed fence can reveal previously-absorbed
  // mermaid blocks. Iterate per file until convergence (max 5 passes).
  const MAX_PASSES = 5;

  for (const file of unique) {
    const changedFile = { value: false };
    let finalUnrepaired: ReadonlyArray<{
      readonly blockStartLineNumber: number;
      readonly errorLineNumber: number | null;
      readonly category: string;
      readonly message: string;
    }> = [];
    for (let pass = 0; pass < MAX_PASSES; pass += 1) {
      const result = await repairMermaidFile(file, { write: args.write });
      finalUnrepaired = result.unrepairedViolations;
      if (result.changed) {
        changedFile.value = true;
        blocksRepaired += result.repairedBlocks.length;
        for (const line of result.repairedBlocks) {
          process.stdout.write(`${args.write ? 'fixed' : 'would-fix'} ${file}:${line}\n`);
        }
        // In dry-run mode, the file is never mutated, so a second pass
        // would report the same blocks again. Break to avoid duplicates.
        if (!args.write) break;
        continue;
      }
      break;
    }
    if (changedFile.value) filesChanged += 1;
    for (const v of finalUnrepaired) {
      allUnrepaired.push({
        file,
        line: v.errorLineNumber ?? v.blockStartLineNumber,
        category: v.category,
        message: v.message,
      });
    }
  }

  process.stdout.write(
    `\n${args.write ? 'fix' : 'dry-run'}: ${blocksRepaired} blocks repaired across ${filesChanged} files; ${allUnrepaired.length} blocks still broken (manual review)\n`,
  );

  if (allUnrepaired.length > 0) {
    process.stdout.write('\nResidual (manual review needed):\n');
    for (const v of allUnrepaired) {
      process.stdout.write(`  ${v.file}:${v.line}: ${v.category}: ${v.message}\n`);
    }
  }
}

main().catch((err) => {
  process.stderr.write(`fix-mermaid: fatal: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
  process.exit(2);
});
