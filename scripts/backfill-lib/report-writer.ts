/**
 * @module Infrastructure/BackfillLib/ReportWriter
 * @category Intelligence Operations / Supporting Infrastructure
 * @name RFC 4180 CSV writer for the metadata backfill diff report
 *
 * @description
 * Emits the CSV contract documented in the PR 2 issue:
 *
 * ```
 * file_path,date,subfolder,lang,tier,field,violation_code,before,after,reason
 * ```
 *
 * Each row represents one (tier, violation) pair. An article with `T`
 * qualifying tiers and `V` violations emits `T * V` rows; an article
 * with `T` tiers and **zero** violations still emits `T` rows (one
 * tier-only row per tier, with `field` / `violation_code` / `before`
 * blank) so reviewers can audit the tier assignment for green
 * articles. `after` is intentionally blank in PR 2 — PRs 3/4/5 will
 * populate it with the planned post-backfill value when they run.
 *
 * Quoting follows RFC 4180 §2.6: fields containing `,`, `"`, CR or LF
 * are double-quoted, and embedded `"` is doubled to `""`. Line endings
 * are `\n` (not CRLF) to match the rest of the repo.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';

import type { ContractViolation } from './contract-checker.js';
import type {
  ArticleFingerprint,
  ClassificationResult,
  Tier,
} from './classifier.js';

/** CSV column order — keep in sync with the issue spec. */
export const CSV_COLUMNS = [
  'file_path',
  'date',
  'subfolder',
  'lang',
  'tier',
  'field',
  'violation_code',
  'before',
  'after',
  'reason',
] as const;

/** One logical report row — serialised to CSV by {@link writeReport}. */
export interface ReportRow {
  readonly filePath: string;
  readonly date: string;
  readonly subfolder: string;
  readonly lang: string;
  readonly tier: Tier | '';
  readonly field: string;
  readonly violationCode: string;
  readonly before: string;
  readonly after: string;
  readonly reason: string;
}

/** Quote a single CSV field per RFC 4180. */
export function quoteField(value: string | null | undefined): string {
  const s = value ?? '';
  const needsQuoting = /[",\r\n]/.test(s);
  if (!needsQuoting) return s;
  return `"${s.replace(/"/g, '""')}"`;
}

/** Serialise a row to its CSV line (no trailing newline). */
export function serialiseRow(row: ReportRow): string {
  return [
    quoteField(row.filePath),
    quoteField(row.date),
    quoteField(row.subfolder),
    quoteField(row.lang),
    quoteField(row.tier),
    quoteField(row.field),
    quoteField(row.violationCode),
    quoteField(row.before),
    quoteField(row.after),
    quoteField(row.reason),
  ].join(',');
}

/**
 * Build the set of rows emitted for one article. An article with
 * multiple tiers and multiple violations produces `tiers.length *
 * max(1, violations.length)` rows (one per (tier, violation) pair),
 * so the reviewer can trace every violation back to the tier that
 * will fix it.
 *
 * An article with zero violations still emits one row per tier so
 * reviewers can sanity-check the tier assignment even when everything
 * is green.
 */
export function rowsForArticle(
  fp: ArticleFingerprint,
  classification: ClassificationResult,
  violations: readonly ContractViolation[],
): readonly ReportRow[] {
  const rows: ReportRow[] = [];
  const tiers = classification.tiers.length > 0 ? classification.tiers : [''];
  for (const tier of tiers) {
    const tierReason = tier ? classification.reasons[tier as Tier] ?? '' : '';
    if (violations.length === 0) {
      rows.push({
        filePath: fp.relPath,
        date: fp.date ?? '',
        subfolder: fp.subfolder ?? '',
        lang: fp.lang,
        tier: tier as Tier | '',
        field: '',
        violationCode: '',
        before: '',
        after: '',
        reason: tierReason,
      });
      continue;
    }
    for (const v of violations) {
      rows.push({
        filePath: fp.relPath,
        date: fp.date ?? '',
        subfolder: fp.subfolder ?? '',
        lang: fp.lang,
        tier: tier as Tier | '',
        field: v.field,
        violationCode: v.code,
        before: v.value,
        after: '',
        reason: tierReason ? `${tierReason}; ${v.message}` : v.message,
      });
    }
  }
  return rows;
}

/**
 * Write the full report to `outputPath`. Creates any missing parent
 * directories. Returns the number of rows written (excluding the
 * header).
 *
 * Rows are streamed to disk one line at a time via a synchronous file
 * descriptor, so peak memory stays bounded even for thousands of files
 * × multiple tiers/violations. Output bytes are unchanged versus the
 * previous all-in-memory implementation: header + `\n` + serialised
 * rows joined by `\n`, with a trailing `\n` only when at least one row
 * is present.
 */
export function writeReport(
  outputPath: string,
  rows: readonly ReportRow[],
): number {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const fd = fs.openSync(outputPath, 'w');
  try {
    fs.writeSync(fd, CSV_COLUMNS.join(','));
    fs.writeSync(fd, '\n');
    for (const row of rows) {
      fs.writeSync(fd, serialiseRow(row));
      fs.writeSync(fd, '\n');
    }
  } finally {
    fs.closeSync(fd);
  }
  return rows.length;
}

export const __test__ = {
  CSV_COLUMNS,
};
