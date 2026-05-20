/**
 * @module tests/backfill-article-metadata/orchestrator
 * @description CLI orchestration + CSV report writer for the SEO
 * metadata backfill scan. Split per Hack23/riksdagsmonitor#2624 from
 * `tests/backfill-article-metadata.test.ts` (725 lines).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  quoteField,
  serialiseRow,
  rowsForArticle,
  writeReport,
  CSV_COLUMNS,
  __test__ as writerTest,
} from '../../scripts/backfill-lib/report-writer.js';
import type { ContractResult } from '../../scripts/backfill-lib/contract-checker.js';
import { checkAgainstContract } from '../../scripts/backfill-lib/contract-checker.js';
import {
  parseArticleFilename,
  classify,
} from '../../scripts/backfill-lib/classifier.js';
import { __test__ as cliTest } from '../../scripts/backfill-article-metadata.js';

describe('report-writer: RFC 4180 quoting', () => {
  it('passes through a simple field', () => {
    expect(quoteField('simple')).toBe('simple');
  });
  it('quotes fields containing commas', () => {
    expect(quoteField('a,b')).toBe('"a,b"');
  });
  it('quotes fields containing double quotes and doubles them', () => {
    expect(quoteField('a"b')).toBe('"a""b"');
  });
  it('quotes fields containing CR or LF', () => {
    expect(quoteField('line1\nline2')).toBe('"line1\nline2"');
    expect(quoteField('line1\rline2')).toBe('"line1\rline2"');
  });
  it('treats null-ish input as empty string', () => {
    expect(quoteField(undefined)).toBe('');
    expect(quoteField(null)).toBe('');
  });

  it('serialiseRow emits columns in CSV_COLUMNS order', () => {
    const row = {
      filePath: 'news/x.html',
      date: '2026-04-15',
      subfolder: 'propositions',
      lang: 'en',
      tier: 'A' as Tier,
      field: 'title',
      violationCode: 'TITLE_TOO_LONG',
      before: 'A "very, long" title',
      after: '',
      reason: 'Title is 120 chars',
    };
    const line = serialiseRow(row);
    expect(line).toBe(
      'news/x.html,2026-04-15,propositions,en,A,title,TITLE_TOO_LONG,' +
      '"A ""very, long"" title",,Title is 120 chars',
    );
  });

  it('CSV_COLUMNS matches the issue spec', () => {
    expect([...CSV_COLUMNS]).toEqual([
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
    ]);
    expect(writerTest.CSV_COLUMNS).toBe(CSV_COLUMNS);
  });
});

describe('report-writer: rowsForArticle + writeReport', () => {
  it('emits one row per (tier, violation) pair', () => {
    const fp = parseArticleFilename('news/2026-02-14-committee-reports-sv.html');
    const classification: ClassificationResult = {
      tiers: ['B', 'C'],
      reasons: { A: null, B: 'no source', C: 'translation repair' },
      analysisSource: null,
    };
    const result = checkAgainstContract(
      { title: 'Short', description: 'too short.' },
      'sv',
    );
    const rows = rowsForArticle(fp, classification, result.violations);
    expect(rows.length).toBe(classification.tiers.length * result.violations.length);
    // Every row carries the same file_path and date.
    for (const row of rows) {
      expect(row.filePath).toBe(fp.relPath);
      expect(row.date).toBe('2026-02-14');
    }
  });

  it('emits one per-tier row with blank violation fields when contract is green', () => {
    const fp = parseArticleFilename('news/2026-04-15-propositions-en.html');
    const classification: ClassificationResult = {
      tiers: ['A'],
      reasons: { A: 'source exists', B: null, C: null },
      analysisSource: '/tmp/x',
    };
    const rows = rowsForArticle(fp, classification, []);
    expect(rows.length).toBe(1);
    expect(rows[0]!.field).toBe('');
    expect(rows[0]!.violationCode).toBe('');
    expect(rows[0]!.reason).toBe('source exists');
  });

  it('writeReport emits a header-only file when rows are empty', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'backfill-report-'));
    const out = path.join(tmp, 'sub', 'report.csv');
    const count = writeReport(out, []);
    expect(count).toBe(0);
    const contents = fs.readFileSync(out, 'utf8');
    expect(contents.trim()).toBe(CSV_COLUMNS.join(','));
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('writeReport creates missing parent directories', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'backfill-report-'));
    const out = path.join(tmp, 'a', 'b', 'c', 'report.csv');
    writeReport(out, []);
    expect(fs.existsSync(out)).toBe(true);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('writeReport round-trips a non-trivial row set', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'backfill-report-'));
    const out = path.join(tmp, 'r.csv');
    const rows = [
      {
        filePath: 'news/x.html',
        date: '2026-04-15',
        subfolder: 's',
        lang: 'en',
        tier: 'A' as Tier,
        field: 'title',
        violationCode: 'TITLE_TOO_LONG',
        before: 'commas, "quotes", and\nnewlines',
        after: '',
        reason: 'len=120',
      },
    ];
    writeReport(out, rows);
    const contents = fs.readFileSync(out, 'utf8');
    const lines = contents.split('\n');
    expect(lines[0]).toBe(CSV_COLUMNS.join(','));
    // The embedded newline means the logical row spans two physical lines.
    expect(contents).toContain('"commas, ""quotes"", and\nnewlines"');
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});

// ---------------------------------------------------------------------------
// CLI — parseFlags (flag surface contract)
// ---------------------------------------------------------------------------

describe('CLI: parseFlags', () => {
  const { parseFlags } = cliTest;

  it('defaults to --dry-run mode', () => {
    const opts = parseFlags([]);
    expect(opts.mode).toBe('dry-run');
  });

  it('recognises --check', () => {
    expect(parseFlags(['--check']).mode).toBe('check');
  });

  it('recognises --apply', () => {
    expect(parseFlags(['--apply']).mode).toBe('apply');
  });

  it('parses --tier=A', () => {
    expect(parseFlags(['--tier=A']).tiers).toEqual(['A']);
  });

  it('parses --tier=A,B,C as a list', () => {
    expect(parseFlags(['--tier=A,B,C']).tiers).toEqual(['A', 'B', 'C']);
  });

  it('treats --tier=all as null (all tiers)', () => {
    expect(parseFlags(['--tier=all']).tiers).toBeNull();
  });

  it('parses --lang=sv,no', () => {
    expect(parseFlags(['--lang=sv,no']).langs).toEqual(['sv', 'no']);
  });

  it('treats empty --lang= as "all languages" (langs=null)', () => {
    // Regression — previously parsed to `[]` which was truthy and
    // silently filtered every file out of the report.
    expect(parseFlags(['--lang=']).langs).toBeNull();
    expect(parseFlags(['--lang= ']).langs).toBeNull();
    expect(parseFlags(['--lang=,,']).langs).toBeNull();
  });

  it('parses --date-from / --date-to', () => {
    const opts = parseFlags(['--date-from=2026-02-01', '--date-to=2026-04-30']);
    expect(opts.dateFrom).toBe('2026-02-01');
    expect(opts.dateTo).toBe('2026-04-30');
  });

  it('parses --output', () => {
    expect(parseFlags(['--output=/tmp/r.csv']).output).toBe('/tmp/r.csv');
  });

  it('parses --news-dir', () => {
    expect(parseFlags(['--news-dir=/tmp/news']).newsDir).toBe('/tmp/news');
  });

  it('parses --quiet', () => {
    expect(parseFlags(['--quiet']).quiet).toBe(true);
  });

  it('throws a typed CLI usage error instead of exiting for bad flags', () => {
    expect(() => parseFlags(['--bad-flag'])).toThrow(cliTest.CliUsageError);
    expect(() => parseFlags(['--date-from=bad-date'])).toThrow(cliTest.CliUsageError);
  });

  it('throws for conflicting mode flags (--check + --dry-run, --apply + --check)', () => {
    expect(() => parseFlags(['--check', '--dry-run'])).toThrow(cliTest.CliUsageError);
    expect(() => parseFlags(['--apply', '--check'])).toThrow(cliTest.CliUsageError);
    // Repeating the same mode flag is fine.
    expect(() => parseFlags(['--check', '--check'])).not.toThrow();
  });

  it('main maps CLI usage errors to exit code 2', () => {
    expect(cliTest.main(['--bad-flag'])).toBe(2);
    expect(cliTest.main(['--date-to=bad-date'])).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// CLI — scan (end-to-end over a synthetic news/ dir)
// ---------------------------------------------------------------------------

describe('CLI: scan end-to-end', () => {
  let tmpRoot: string;
  let newsDir: string;
  let outCsv: string;

  const SV_HTML = `<!DOCTYPE html>
<html lang="sv">
<head>
  <title>Regeringen presenterar vårbudget — Riksdagsmonitor</title>
  <meta name="description" content="Kort beskrivning.">
</head><body><article><p>Kort text.</p></article></body></html>`;

  const EN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Sweden approves spring budget 2026-04-15 after coalition talks — Riksdagsmonitor</title>
  <meta name="description" content="Sweden's government approved the spring budget today after three months of negotiation between coalition partners and opposition parties in the Riksdag.">
</head><body><article><p>body.</p></article></body></html>`;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'backfill-cli-'));
    newsDir = path.join(tmpRoot, 'news');
    fs.mkdirSync(newsDir, { recursive: true });
    fs.writeFileSync(path.join(newsDir, '2026-02-10-test-article-sv.html'), SV_HTML);
    fs.writeFileSync(path.join(newsDir, '2026-02-10-test-article-en.html'), EN_HTML);
    outCsv = path.join(tmpRoot, 'report.csv');
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('listArticleFiles returns every .html file sorted', () => {
    const files = cliTest.listArticleFiles(newsDir);
    expect(files.length).toBe(2);
    expect(files[0]!.endsWith('-en.html')).toBe(true);
    expect(files[1]!.endsWith('-sv.html')).toBe(true);
  });

  it('listArticleFiles skips news/index*.html', () => {
    fs.writeFileSync(path.join(newsDir, 'index.html'), '');
    fs.writeFileSync(path.join(newsDir, 'index_sv.html'), '');
    const files = cliTest.listArticleFiles(newsDir);
    expect(files.map((f) => path.basename(f))).not.toContain('index.html');
    expect(files.map((f) => path.basename(f))).not.toContain('index_sv.html');
  });

  it('--dry-run writes a CSV and exits 0', () => {
    const code = cliTest.main([`--news-dir=${newsDir}`, `--output=${outCsv}`, '--quiet', '--dry-run']);
    expect(code).toBe(0);
    expect(fs.existsSync(outCsv)).toBe(true);
    const contents = fs.readFileSync(outCsv, 'utf8');
    expect(contents.split('\n')[0]).toBe(CSV_COLUMNS.join(','));
  });

  it('--check exits non-zero when the synthetic articles violate the contract', () => {
    const code = cliTest.main([`--news-dir=${newsDir}`, `--output=${outCsv}`, '--quiet', '--check']);
    expect(code).toBe(1);
  });

  it('--apply exits with CLI-misuse code 2', () => {
    const code = cliTest.main([`--news-dir=${newsDir}`, `--output=${outCsv}`, '--quiet', '--apply', '--tier=A']);
    expect(code).toBe(2);
  });

  it('--lang filter restricts scanned rows', () => {
    cliTest.main([`--news-dir=${newsDir}`, `--output=${outCsv}`, '--quiet', '--lang=sv', '--dry-run']);
    const contents = fs.readFileSync(outCsv, 'utf8');
    expect(contents).toContain('-sv.html');
    expect(contents).not.toContain('-en.html');
  });

  it('--tier=B filter restricts to Tier B only', () => {
    cliTest.main([`--news-dir=${newsDir}`, `--output=${outCsv}`, '--quiet', '--tier=B', '--dry-run']);
    const contents = fs.readFileSync(outCsv, 'utf8');
    const lines = contents.split('\n').slice(1).filter(Boolean);
    for (const line of lines) {
      const cols = line.split(',');
      // tier column is index 4
      expect(cols[4]).toBe('B');
    }
  });

  it('--tier=C summary counts reflect emitted tiers, not pre-filter classification', () => {
    const opts = cliTest.parseFlags([
      `--news-dir=${newsDir}`,
      `--output=${outCsv}`,
      '--quiet',
      '--tier=C',
      '--dry-run',
    ]);
    const result = cliTest.scan(opts);
    expect(result.totals.filesMatched).toBe(1);
    expect(result.totals.tierCounts).toEqual({ A: 0, B: 0, C: 1 });
    expect(result.rows.every((row) => row.tier === 'C')).toBe(true);
  });

  it('--date-from / --date-to restrict by ISO date', () => {
    fs.writeFileSync(path.join(newsDir, '2030-01-01-future-article-en.html'), EN_HTML);
    cliTest.main([`--news-dir=${newsDir}`, `--output=${outCsv}`, '--quiet', '--date-from=2030-01-01', '--dry-run']);
    const contents = fs.readFileSync(outCsv, 'utf8');
    expect(contents).toContain('2030-01-01');
    expect(contents).not.toContain('2026-02-10');
  });
});
