/**
 * @module rewrite-article-metadata/cli
 * @description Command-line driver. Top-level `main()` call is invoked
 * on import so the legacy shim entry point (`scripts/rewrite-article-metadata.ts`)
 * keeps behaving identically.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

import { NEWS_DIR, ROOT_DIR } from './budget.js';
import { type RewriteOutcome, rewriteOne } from './rewriter.js';

export function parseArgs(argv: readonly string[]): {
  dryRun: boolean;
  apply: boolean;
  singleFile: string | null;
  quiet: boolean;
} {
  let dryRun = false;
  let apply = false;
  let singleFile: string | null = null;
  let quiet = false;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') dryRun = true;
    else if (a === '--apply') apply = true;
    else if (a === '--file') singleFile = argv[++i] ?? null;
    else if (a === '--quiet') quiet = true;
  }
  if (!dryRun && !apply) dryRun = true;
  return { dryRun, apply, singleFile, quiet };
}

export function listNewsFiles(singleFile: string | null): string[] {
  if (singleFile) {
    const abs = path.isAbsolute(singleFile) ? singleFile : path.join(ROOT_DIR, singleFile);
    if (!fs.existsSync(abs)) {
      throw new Error(`File not found: ${abs}`);
    }
    return [abs];
  }
  if (!fs.existsSync(NEWS_DIR)) return [];
  return fs
    .readdirSync(NEWS_DIR)
    .filter((n) => n.endsWith('.html') && !n.startsWith('index') && !n.startsWith('sitemap'))
    .map((n) => path.join(NEWS_DIR, n));
}

export function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const files = listNewsFiles(args.singleFile);

  const started = Date.now();
  let changed = 0;
  let skipped = 0;
  let errors = 0;
  const changeLog: RewriteOutcome[] = [];

  for (const f of files) {
    try {
      const { outcome, nextHtml } = rewriteOne(f);
      if (!outcome.changed) {
        skipped += 1;
        continue;
      }
      changed += 1;
      changeLog.push(outcome);
      if (args.apply && nextHtml !== null) fs.writeFileSync(f, nextHtml, 'utf8');
      if (!args.quiet) {
        const suffix = args.apply ? '✏️  ' : '🔎 ';
        console.log(`${suffix}${path.basename(f)}  [${outcome.reasons.join(', ')}]`);
      }
    } catch (e) {
      errors += 1;
      console.error(`❌ ${path.basename(f)}: ${(e as Error).message}`);
    }
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  const mode = args.apply ? 'APPLIED' : 'DRY-RUN';
  console.log(`\n📊 ${mode}: ${files.length} files scanned, ${changed} changed, ${skipped} unchanged, ${errors} errors in ${elapsed}s`);

  const reportDir = path.join(ROOT_DIR, 'analysis', 'metadata-backfill');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `rewrite-report-${new Date().toISOString().slice(0, 10)}.csv`);
  const csvEscape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows: string[] = ['file,reasons,before_title,after_title,before_description,after_description'];
  for (const o of changeLog) {
    rows.push(
      [
        csvEscape(path.relative(ROOT_DIR, o.file)),
        csvEscape(o.reasons.join('|')),
        csvEscape(o.beforeTitle),
        csvEscape(o.afterTitle),
        csvEscape(o.beforeDescription),
        csvEscape(o.afterDescription),
      ].join(','),
    );
  }
  fs.writeFileSync(reportPath, rows.join('\n') + '\n', 'utf8');
  console.log(`📝 Report: ${path.relative(ROOT_DIR, reportPath)}`);

  if (errors > 0) process.exitCode = 1;
}

main();
