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

import { glob } from 'glob';

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

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const files = (
    await Promise.all(args.patterns.map((p) => glob(p, { nodir: true })))
  ).flat();
  const unique = Array.from(new Set(files)).sort();

  let filesChanged = 0;
  let blocksRepaired = 0;
  const allUnrepaired: { file: string; line: number; category: string; message: string }[] = [];

  for (const file of unique) {
    const result = await repairMermaidFile(file, { write: args.write });
    if (result.changed) {
      filesChanged += 1;
      blocksRepaired += result.repairedBlocks.length;
      for (const line of result.repairedBlocks) {
        process.stdout.write(`${args.write ? 'fixed' : 'would-fix'} ${file}:${line}\n`);
      }
    }
    for (const v of result.unrepairedViolations) {
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
