#!/usr/bin/env -S npx tsx
/**
 * @module Infrastructure/BackfillArticleMetadata
 * @category Intelligence Operations / Supporting Infrastructure
 * @name SEO metadata backfill CLI (PR 2 of the 5-PR SEO rescue plan)
 *
 * @description
 * Read-only scanner over every `news/*.html` article that produces a
 * reviewable CSV diff report classifying each file into one or more
 * backfill tiers (A / B / C) and annotating every contract violation
 * against `.github/prompts/seo-metadata-contract.md`.
 *
 * This PR (PR 2) does **not** mutate HTML — the `--apply` flag is
 * reserved for PRs 3 (Tier A regenerate), 4 (Tier B rewrite), and 5
 * (Tier C translation repair). Running with `--apply` in PR 2 fails
 * fast with a pointer to those follow-up PRs.
 *
 * ## Flags
 *
 * | Flag                | Purpose                                              |
 * | ------------------- | ---------------------------------------------------- |
 * | `--dry-run`         | Scan only; emit CSV; exit 0. Default behaviour.      |
 * | `--check`           | Scan only; emit CSV; exit non-zero on any violation. |
 * | `--apply`           | Reserved for PRs 3-5. Fails with a pointer.          |
 * | `--tier=A\|B\|C\|all` | Restrict classification to a tier subset.          |
 * | `--lang=sv,no`      | Restrict scan to comma-separated lang codes.         |
 * | `--date-from=YYYY-MM-DD` | Lower bound (inclusive) on article date.        |
 * | `--date-to=YYYY-MM-DD`   | Upper bound (inclusive) on article date.        |
 * | `--output=<path>`   | CSV output path (defaults to the committed diff report). |
 * | `--news-dir=<path>` | Override the `news/` directory (for tests).          |
 *
 * ## Exit codes
 *
 * - `0` — `--dry-run` ran to completion (default), or `--check` found
 *   no violations.
 * - `1` — `--check` found ≥ 1 violation, or an unexpected runtime
 *   error.
 * - `2` — CLI misuse (unknown flag, bad value, `--apply` in PR 2).
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { checkAgainstContract } from './backfill-lib/contract-checker.js';
import {
  classify,
  parseArticleFilename,
  isKnownLang,
} from './backfill-lib/classifier.js';
import type { Tier } from './backfill-lib/classifier.js';
import { inspectHtmlFile } from './backfill-lib/html-inspector.js';
import {
  rowsForArticle,
  writeReport,
} from './backfill-lib/report-writer.js';
import type { ReportRow } from './backfill-lib/report-writer.js';

const __filename = fileURLToPath(import.meta.url);
const ROOT_DIR = path.resolve(path.dirname(__filename), '..');
const DEFAULT_NEWS_DIR = path.join(ROOT_DIR, 'news');
const ANALYSIS_DIR = path.join(ROOT_DIR, 'analysis');
const DEFAULT_OUTPUT = path.join(
  ANALYSIS_DIR,
  'metadata-backfill',
  `diff-report-${isoToday()}.csv`,
);

type Mode = 'dry-run' | 'check' | 'apply';

export class CliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliUsageError';
  }
}

interface CliOptions {
  readonly mode: Mode;
  readonly tiers: readonly Tier[] | null; // null = all
  readonly langs: readonly string[] | null; // null = all
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly output: string;
  readonly newsDir: string;
  readonly quiet: boolean;
}

function isoToday(): string {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseFlags(argv: readonly string[]): CliOptions {
  let mode: Mode | null = null;
  let tiers: Tier[] | null = null;
  let langs: string[] | null = null;
  let dateFrom: string | null = null;
  let dateTo: string | null = null;
  let output: string | null = null;
  let newsDir: string | null = null;
  let quiet = false;

  for (const arg of argv) {
    if (arg === '--dry-run' || arg === '--check' || arg === '--apply') {
      const next: Mode = arg === '--dry-run' ? 'dry-run' : arg === '--check' ? 'check' : 'apply';
      if (mode !== null && mode !== next) {
        throw new CliUsageError(
          `Conflicting mode flags: --${mode} and ${arg} are mutually exclusive.`,
        );
      }
      mode = next;
    } else if (arg === '--quiet') quiet = true;
    else if (arg.startsWith('--tier=')) {
      const raw = arg.slice('--tier='.length).trim();
      if (raw === 'all' || raw === '') tiers = null;
      else {
        tiers = raw.split(',').map((t) => t.trim().toUpperCase() as Tier);
        for (const t of tiers) {
          if (t !== 'A' && t !== 'B' && t !== 'C') {
            fail(`Invalid --tier value: ${t}. Expected A | B | C | all.`);
          }
        }
      }
    } else if (arg.startsWith('--lang=')) {
      const raw = arg.slice('--lang='.length).trim();
      const parsed = raw
        .split(',')
        .map((l) => l.trim().toLowerCase())
        .filter(Boolean);
      // Treat `--lang=` (no value) as "all languages" — same semantics
      // as omitting the flag — rather than silently filtering away every
      // file (which produces a bewildering empty CSV).
      if (parsed.length === 0) {
        langs = null;
      } else {
        for (const l of parsed) {
          if (!isKnownLang(l)) {
            fail(`Unknown --lang value: ${l}.`);
          }
        }
        langs = parsed;
      }
    } else if (arg.startsWith('--date-from=')) {
      dateFrom = arg.slice('--date-from='.length).trim();
      assertIsoDate('--date-from', dateFrom);
    } else if (arg.startsWith('--date-to=')) {
      dateTo = arg.slice('--date-to='.length).trim();
      assertIsoDate('--date-to', dateTo);
    } else if (arg.startsWith('--output=')) {
      output = arg.slice('--output='.length).trim();
    } else if (arg.startsWith('--news-dir=')) {
      newsDir = arg.slice('--news-dir='.length).trim();
    } else if (arg.startsWith('-')) {
      fail(`Unknown flag: ${arg}`);
    }
  }

  return {
    mode: mode ?? 'dry-run',
    tiers,
    langs,
    dateFrom,
    dateTo,
    output: output ?? DEFAULT_OUTPUT,
    newsDir: newsDir ?? DEFAULT_NEWS_DIR,
    quiet,
  };
}

function assertIsoDate(flag: string, value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(`${flag} expects YYYY-MM-DD, got: ${value}`);
  }
}

function fail(message: string): never {
  throw new CliUsageError(message);
}

/** List every `news/*.html` file (non-recursive, matches issue spec). */
function listArticleFiles(newsDir: string): readonly string[] {
  if (!fs.existsSync(newsDir)) return [];
  return fs
    .readdirSync(newsDir)
    .filter((f) => /\.html$/i.test(f))
    .filter((f) => f !== 'index.html' && !/^index_[a-z]{2}\.html$/i.test(f))
    .sort()
    .map((f) => path.join(newsDir, f));
}

/**
 * Main scan. Returns `{ rows, totals }` so callers (tests, CLI) can
 * decide how to surface the result.
 */
export interface ScanResult {
  readonly rows: readonly ReportRow[];
  readonly totals: {
    /** Files present in the news/ directory (before any filter). */
    readonly filesScanned: number;
    /** Files that passed `--lang` / `--date-*` / `--tier` filters and
     *  contributed to the report. Equal to `filesScanned` when no
     *  filters are active. */
    readonly filesMatched: number;
    readonly filesWithViolations: number;
    readonly totalViolations: number;
    readonly tierCounts: Record<Tier, number>;
    readonly uncategorised: number;
  };
}

export function scan(options: CliOptions): ScanResult {
  const allFiles = listArticleFiles(options.newsDir);
  const rows: ReportRow[] = [];

  let filesMatched = 0;
  let filesWithViolations = 0;
  let totalViolations = 0;
  const tierCounts: Record<Tier, number> = { A: 0, B: 0, C: 0 };
  let uncategorised = 0;

  for (const abs of allFiles) {
    const relPath = path.relative(ROOT_DIR, abs);
    const fp = parseArticleFilename(relPath);

    // Apply CLI filters.
    if (options.langs && !options.langs.includes(fp.lang)) continue;
    if (options.dateFrom && (fp.date === null || fp.date < options.dateFrom)) continue;
    if (options.dateTo && (fp.date === null || fp.date > options.dateTo)) continue;

    const meta = inspectHtmlFile(abs);
    // Prefer the explicit `<html lang>` when present; fall back to the
    // filename suffix if the attribute is missing (the inspector returns
    // an empty string in that case so we can distinguish "missing" from
    // "explicitly en"). Final fallback to 'en' keeps windows resolvable.
    const lang = meta.lang || fp.lang || 'en';
    const contract = checkAgainstContract(
      { title: meta.title, description: meta.metaDescription },
      lang,
    );

    const classification = classify(ANALYSIS_DIR, fp, contract);

    // Apply tier filter after classification (classification is pure so
    // the CSV can still show *which* tiers the file qualified for).
    let tiersToEmit = classification.tiers;
    if (options.tiers) {
      tiersToEmit = classification.tiers.filter((t) => options.tiers!.includes(t));
      if (tiersToEmit.length === 0) continue;
    }

    filesMatched += 1;

    // Feed the filtered tier list into rowsForArticle by constructing a
    // shallow copy — keeps the classifier module pure and non-mutated.
    const articleRows = rowsForArticle(
      fp,
      {
        tiers: tiersToEmit,
        reasons: classification.reasons,
        analysisSource: classification.analysisSource,
      },
      contract.violations,
    );
    rows.push(...articleRows);

    if (contract.violations.length > 0) {
      filesWithViolations += 1;
      totalViolations += contract.violations.length;
    }
    if (tiersToEmit.length === 0) {
      uncategorised += 1;
    } else {
      for (const t of tiersToEmit) tierCounts[t] += 1;
    }
  }

  return {
    rows,
    totals: {
      filesScanned: allFiles.length,
      filesMatched,
      filesWithViolations,
      totalViolations,
      tierCounts,
      uncategorised,
    },
  };
}

function main(argv: readonly string[]): number {
  let options: CliOptions;
  try {
    options = parseFlags(argv);
  } catch (error) {
    if (error instanceof CliUsageError) {
      process.stderr.write(`backfill-article-metadata: ${error.message}\n`);
      return 2;
    }
    throw error;
  }

  if (options.mode === 'apply') {
    process.stderr.write(
      'backfill-article-metadata: --apply is not implemented in PR 2.\n' +
      'Apply logic lives in follow-up PRs 3 (Tier A regenerate),\n' +
      '4 (Tier B rewrite), and 5 (Tier C translation repair + CI gate).\n' +
      'See .github/prompts/seo-metadata-contract.md and the 5-PR plan in\n' +
      'the original issue for the full sequence.\n',
    );
    return 2;
  }

  const result = scan(options);
  writeReport(options.output, result.rows);

  if (!options.quiet) {
    process.stderr.write(
      `backfill-article-metadata: scanned ${result.totals.filesScanned} file(s), ` +
        `matched ${result.totals.filesMatched} after filters; ` +
        `${result.totals.filesWithViolations} with violations ` +
        `(total ${result.totals.totalViolations}); ` +
        `tier A=${result.totals.tierCounts.A} ` +
        `B=${result.totals.tierCounts.B} ` +
        `C=${result.totals.tierCounts.C}; ` +
        `uncategorised=${result.totals.uncategorised}. ` +
        `Wrote ${result.rows.length} row(s) to ${options.output}\n`,
    );
  }

  if (options.mode === 'check') {
    return result.totals.totalViolations > 0 ? 1 : 0;
  }
  // dry-run always exits 0 on a successful scan.
  return 0;
}

const invokedDirectly =
  // true iff this file is the entry point — skipped when imported by tests.
  process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (invokedDirectly) {
  const code = main(process.argv.slice(2));
  process.exit(code);
}

export const __test__ = {
  CliUsageError,
  parseFlags,
  listArticleFiles,
  scan,
  main,
};
