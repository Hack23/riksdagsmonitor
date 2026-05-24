#!/usr/bin/env tsx
/**
 * @module scripts/validate-mermaid-diagrams
 * @description CLI that walks Markdown files (default scope:
 *              `analysis/**\/*.md`) and runs the real Mermaid v11
 *              parser on every ` ```mermaid ` block. Exits non-zero
 *              when any block fails to parse — wire-up:
 *
 *                npm run validate:mermaid
 *                npm run validate:mermaid -- analysis/templates/**\/*.md
 *                npm run validate:mermaid -- --json
 *
 *              Output formats:
 *
 *              - default (human) — `file:line: <category> <message>`
 *              - `--json`        — JSON array of {@link MermaidFileReport}
 *              - `--summary`     — totals only (used by CI badge)
 *
 *              Companion script: `scripts/fix-mermaid-diagrams.ts`
 *              applies the deterministic repair pipeline in place.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

import { validateMermaidFiles } from './validators/mermaid-diagrams/index.js';

interface Args {
  readonly patterns: readonly string[];
  readonly json: boolean;
  readonly summary: boolean;
  readonly maxFailures: number;
}

function parseArgs(argv: readonly string[]): Args {
  const patterns: string[] = [];
  let json = false;
  let summary = false;
  let maxFailures = Number.POSITIVE_INFINITY;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]!;
    if (a === '--json') {
      json = true;
      continue;
    }
    if (a === '--summary') {
      summary = true;
      continue;
    }
    if (a === '--max-failures') {
      maxFailures = Number(argv[i + 1] ?? Number.POSITIVE_INFINITY);
      i += 1;
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
    json,
    summary,
    maxFailures,
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
    let entries: ReturnType<typeof readdirSync>;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(ext)) {
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
  // De-dupe + stable order so output is reproducible across runs.
  const unique = Array.from(new Set(files)).sort();
  const reports = await validateMermaidFiles(unique);

  const allViolations = reports.flatMap((r) => r.violations);
  const filesWithViolations = reports.filter((r) => r.violations.length > 0);
  const blocksTotal = reports.reduce((acc, r) => acc + r.blocksTotal, 0);

  if (args.json) {
    process.stdout.write(JSON.stringify(reports, null, 2) + '\n');
  } else if (args.summary) {
    process.stdout.write(
      `mermaid-validator: ${blocksTotal} blocks in ${reports.length} files; ${allViolations.length} violations in ${filesWithViolations.length} files\n`,
    );
  } else {
    for (const v of allViolations) {
      process.stdout.write(
        `${v.file}:${v.errorLineNumber ?? v.blockStartLineNumber}: ${v.category}: ${v.message}\n`,
      );
    }
    process.stdout.write(
      `\nmermaid-validator: ${blocksTotal} blocks in ${reports.length} files; ${allViolations.length} violations in ${filesWithViolations.length} files\n`,
    );
  }

  if (allViolations.length > 0 && allViolations.length > args.maxFailures) {
    process.exit(1);
  }
  if (allViolations.length > 0) process.exit(1);
}

main().catch((err) => {
  process.stderr.write(`mermaid-validator: fatal: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
  process.exit(2);
});
