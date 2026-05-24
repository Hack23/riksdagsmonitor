/**
 * Brief Narrative-Drift Classifier — exec-brief mermaid-only-diff pre-filter
 *
 * Reads two revisions of an `executive-brief.md` source (current working-tree
 * version vs the version at the PR base SHA) and exits:
 *   - `0` if the diff is non-empty AND contains changes outside ```` ```mermaid ````
 *         fenced code blocks  →  narrative drift detected, run parity validator.
 *   - `0` if the file is unchanged vs the base.
 *   - `3` if the diff is confined entirely to ```` ```mermaid ```` fenced blocks
 *         →  mermaid-only autofix; parity validator can be skipped.
 *
 * The workflow `exec-brief-translation-checks.yml` interprets exit code `3`
 * as "skip this source"; any non-zero non-3 exit aborts the workflow.
 *
 * Usage:
 *   npx tsx scripts/check-brief-narrative-drift.ts --base <sha> --file <path>
 *
 * @module scripts/check-brief-narrative-drift
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

import { isDiffMermaidOnly } from './validators/executive-brief-translations/narrative-drift.js';

const EXIT_NARRATIVE_DRIFT = 0;
const EXIT_USAGE = 2;
const EXIT_MERMAID_ONLY = 3;

interface Args {
  base: string;
  file: string;
}

function parseArgs(argv: string[]): Args {
  const args: Partial<Args> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--base') args.base = argv[++i];
    else if (a === '--file') args.file = argv[++i];
    else if (a === '--help' || a === '-h') {
      printUsage();
      process.exit(0);
    } else {
      console.error(`❌ brief-narrative-drift: unknown argument: ${a}`);
      printUsage();
      process.exit(EXIT_USAGE);
    }
  }
  if (!args.base || !args.file) {
    console.error('❌ brief-narrative-drift: --base and --file are required');
    printUsage();
    process.exit(EXIT_USAGE);
  }
  return args as Args;
}

function printUsage(): void {
  console.error('Usage: tsx scripts/check-brief-narrative-drift.ts --base <sha> --file <path>');
  console.error('Exit codes: 0 = narrative drift (or unchanged), 3 = mermaid-only diff, 2 = usage error.');
}

/** Read the `file` at revision `sha`, or `''` if it did not exist there. */
function readAtRevision(sha: string, file: string): string {
  try {
    return execFileSync('git', ['show', `${sha}:${file}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch {
    // File did not exist at base SHA (e.g. a brand-new brief). Treat as empty
    // → any non-empty content counts as narrative drift, never mermaid-only.
    return '';
  }
}

function main(): void {
  const { base, file } = parseArgs(process.argv.slice(2));

  if (!existsSync(file)) {
    // Source deleted in PR — treat as drift so the workflow's normal "missing source" branch runs.
    console.log(`brief-narrative-drift: ${file} missing in working tree → drift`);
    process.exit(EXIT_NARRATIVE_DRIFT);
  }

  const before = readAtRevision(base, file);
  const after = readFileSync(file, 'utf8');

  if (isDiffMermaidOnly(before, after)) {
    console.log(`brief-narrative-drift: ${file} — mermaid-only diff vs ${base.slice(0, 12)} (parity skipped)`);
    process.exit(EXIT_MERMAID_ONLY);
  }

  console.log(`brief-narrative-drift: ${file} — narrative drift vs ${base.slice(0, 12)} (parity enforced)`);
  process.exit(EXIT_NARRATIVE_DRIFT);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
