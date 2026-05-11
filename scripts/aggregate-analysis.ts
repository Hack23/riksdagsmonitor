#!/usr/bin/env -S npx tsx
/**
 * @module Infrastructure/Aggregator
 * @name Analysis → article.md aggregator (CLI)
 *
 * Usage:
 *   npx tsx scripts/aggregate-analysis.ts --date 2026-04-23 --subfolder propositions
 *   npx tsx scripts/aggregate-analysis.ts --all            # every daily folder
 *
 * Writes `news/$YYYY/$MM/$DD/$SUB/article.md` — the single canonical
 * Markdown source for the rendered HTML article. 100% of the article
 * content comes from `analysis/daily/$DATE/$SUB/*.md`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  aggregateAnalysis,
  DAILY_DIR,
  ROOT_DIR,
} from './render-lib/index.js';
import { getBySubfolder } from './render-lib/article-types.js';

const __filename = fileURLToPath(import.meta.url);
void __filename;

interface CliOptions {
  readonly date?: string;
  readonly subfolder?: string;
  readonly all: boolean;
  readonly quiet: boolean;
}

function parseArgs(argv: readonly string[]): CliOptions {
  let date: string | undefined;
  let subfolder: string | undefined;
  let all = false;
  let quiet = false;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--date') date = argv[++i];
    else if (a === '--subfolder' || a === '--sub') subfolder = argv[++i];
    else if (a === '--all') all = true;
    else if (a === '--quiet') quiet = true;
  }
  return { date, subfolder, all, quiet };
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Persist the aggregated article markdown alongside the source artifacts so
 * the `analysis/daily/$DATE/$SUB/` tree remains self-contained and auditable.
 */
function newsOutputPath(date: string, subfolder: string): string {
  return path.join(ROOT_DIR, 'analysis', 'daily', date, subfolder, 'article.md');
}

function aggregateOne(date: string, subfolder: string, quiet: boolean): boolean {
  const subAbs = path.join(DAILY_DIR, date, subfolder);
  const subRepoRel = `analysis/daily/${date}/${subfolder}`;
  if (!fs.existsSync(subAbs)) {
    if (!quiet) console.log(`⏭  Skipped ${subRepoRel} — folder does not exist.`);
    return false;
  }
  if (!fs.existsSync(path.join(subAbs, 'executive-brief.md'))) {
    if (!quiet) console.log(`⏭  Skipped ${subRepoRel} — no executive-brief.md.`);
    return false;
  }
  try {
    const result = aggregateAnalysis({
      subfolderAbsPath: subAbs,
      subfolderRepoRelPath: subRepoRel,
      date,
      subfolder,
    });

    const typeEntry = getBySubfolder(subfolder);
    if (typeEntry) {
      const wordCount = result.markdown.split(/\s+/).filter(Boolean).length;
      if (wordCount < typeEntry.articleWordFloor) {
        if (!quiet) {
          console.warn(
            `⚠️  ${subRepoRel} — word count ${wordCount} below floor ${typeEntry.articleWordFloor} for type "${typeEntry.id}".`,
          );
        }
      }
    }

    const outPath = newsOutputPath(date, subfolder);
    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, result.markdown, 'utf8');
    if (!quiet) {
      console.log(
        `✅ ${subRepoRel} → ${path.relative(ROOT_DIR, outPath)} ` +
        `(${result.artifactsUsed.length} artifacts · "${result.title}")`,
      );
    }
    return true;
  } catch (err) {
    console.error(`❌ ${subRepoRel} — ${(err as Error).message}`);
    return false;
  }
}

function aggregateAllDays(quiet: boolean): number {
  if (!fs.existsSync(DAILY_DIR)) {
    console.error(`❌ analysis/daily/ missing at ${DAILY_DIR}`);
    return 0;
  }
  let count = 0;
  const dateDirs = fs.readdirSync(DAILY_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
    .map((e) => e.name)
    .sort();
  for (const date of dateDirs) {
    const discoverSubfolders = (dir: string, prefix: string): void => {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name));
      for (const entry of entries) {
        const subfolder = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (aggregateOne(date, subfolder, quiet)) count += 1;
        discoverSubfolders(path.join(dir, entry.name), subfolder);
      }
    };
    discoverSubfolders(path.join(DAILY_DIR, date), '');
  }
  return count;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  if (args.all) {
    const n = aggregateAllDays(args.quiet);
    console.log(`\n📦 Aggregated ${n} analysis subfolder(s) into news/*/article.md`);
    return;
  }
  if (!args.date || !args.subfolder) {
    console.error('Usage: aggregate-analysis.ts --date YYYY-MM-DD --subfolder <name>');
    console.error('   or: aggregate-analysis.ts --all');
    process.exitCode = 1;
    return;
  }
  const ok = aggregateOne(args.date, args.subfolder, args.quiet);
  if (!ok) process.exitCode = 1;
}

// Only execute when invoked as CLI, not when imported by tests.
if (import.meta.url === `file://${process.argv[1]}` ||
    import.meta.url === fileURLToPath(process.argv[1] ? `file://${process.argv[1]}` : import.meta.url)) {
  main();
}
