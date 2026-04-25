/**
 * Unit tests for the SEO metadata backfill CLI
 * (`scripts/backfill-article-metadata.ts`) and its supporting modules
 * (`classifier.ts`, `html-inspector.ts`, `report-writer.ts`).
 *
 * Scope per the PR 2 acceptance criteria: ≥ 40 cases covering every
 * contract rule, every tier, every language family. Contract rules
 * themselves are exhaustively exercised in `contract-checker.test.ts`;
 * this file focuses on the glue (filename parsing, HTML parsing,
 * tier assignment, CSV quoting) and the CLI flag surface.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  parseArticleFilename,
  classify,
  findAnalysisSource,
  isKnownLang,
  __test__ as classifierTest,
} from '../scripts/backfill-lib/classifier.js';
import type {
  Tier,
  ClassificationResult,
} from '../scripts/backfill-lib/classifier.js';
import {
  inspectHtmlContent,
  __test__ as inspectorTest,
} from '../scripts/backfill-lib/html-inspector.js';
import {
  quoteField,
  serialiseRow,
  rowsForArticle,
  writeReport,
  CSV_COLUMNS,
  __test__ as writerTest,
} from '../scripts/backfill-lib/report-writer.js';
import { checkAgainstContract } from '../scripts/backfill-lib/contract-checker.js';
import type { ContractResult } from '../scripts/backfill-lib/contract-checker.js';
import { __test__ as cliTest } from '../scripts/backfill-article-metadata.js';

// ---------------------------------------------------------------------------
// parseArticleFilename
// ---------------------------------------------------------------------------

describe('classifier: parseArticleFilename', () => {
  it('parses a canonical date-slug-lang filename', () => {
    const fp = parseArticleFilename('news/2026-02-13-evening-analysis-en.html');
    expect(fp.date).toBe('2026-02-13');
    expect(fp.subfolder).toBe('evening-analysis');
    expect(fp.lang).toBe('en');
  });

  it('parses a legacy multi-segment slug', () => {
    const fp = parseArticleFilename('news/2026-02-14-committee-reports-fiscal-welfare-sv.html');
    expect(fp.date).toBe('2026-02-14');
    expect(fp.subfolder).toBe('committee-reports-fiscal-welfare');
    expect(fp.lang).toBe('sv');
  });

  it('handles absolute and relative paths equivalently', () => {
    const a = parseArticleFilename('/abs/path/news/2026-03-12-week-ahead-zh.html');
    const b = parseArticleFilename('news/2026-03-12-week-ahead-zh.html');
    expect(a.date).toBe(b.date);
    expect(a.subfolder).toBe(b.subfolder);
    expect(a.lang).toBe(b.lang);
  });

  it('returns nulls for unparseable filenames', () => {
    const fp = parseArticleFilename('news/index.html');
    expect(fp.date).toBeNull();
    expect(fp.subfolder).toBeNull();
  });

  it('lower-cases the language tag', () => {
    const fp = parseArticleFilename('news/2026-02-13-evening-analysis-JA.html');
    expect(fp.lang).toBe('ja');
  });
});

// ---------------------------------------------------------------------------
// findAnalysisSource / classify (tier assignment)
// ---------------------------------------------------------------------------

describe('classifier: tier assignment', () => {
  let tmpRoot: string;
  let analysisRoot: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'backfill-classifier-'));
    analysisRoot = path.join(tmpRoot, 'analysis');
    fs.mkdirSync(path.join(analysisRoot, 'daily', '2026-04-15', 'propositions'), { recursive: true });
    fs.writeFileSync(
      path.join(analysisRoot, 'daily', '2026-04-15', 'propositions', 'executive-brief.md'),
      '# Sample brief\n\n## BLUF\n\nSweden approves the spring budget with cross-party support.',
    );
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  function cleanContract(): ContractResult {
    return {
      ok: true,
      violations: [],
      window: {
        titleMin: 55,
        titleMax: 70,
        descriptionMin: 140,
        descriptionMax: 200,
      },
    };
  }

  it('findAnalysisSource finds an executive-brief on disk', () => {
    const fp = parseArticleFilename('news/2026-04-15-propositions-en.html');
    const src = findAnalysisSource(analysisRoot, fp);
    expect(src).toBeTruthy();
    expect(src!.endsWith('executive-brief.md')).toBe(true);
  });

  it('findAnalysisSource returns null for unknown date/slug', () => {
    const fp = parseArticleFilename('news/2099-12-31-nothing-here-en.html');
    expect(findAnalysisSource(analysisRoot, fp)).toBeNull();
  });

  it('Tier A — article with an analysis source', () => {
    const fp = parseArticleFilename('news/2026-04-15-propositions-en.html');
    const result = classify(analysisRoot, fp, cleanContract());
    expect(result.tiers).toContain('A');
    expect(result.tiers).not.toContain('B');
    expect(result.analysisSource).toBeTruthy();
  });

  it('Tier B — article without an analysis source', () => {
    const fp = parseArticleFilename('news/2026-02-10-biodiversity-citizenship-en.html');
    const result = classify(analysisRoot, fp, cleanContract());
    expect(result.tiers).toContain('B');
    expect(result.tiers).not.toContain('A');
  });

  it('Tier C — non-EN article with a below-floor description', () => {
    const fp = parseArticleFilename('news/2026-02-14-committee-reports-de.html');
    const contract = checkAgainstContract(
      {
        title: 'Analyse zum Sonderausschuss über den Finanzhaushalt der Regierung',
        description: 'Analyse von 10 Ausschussberichten.',
      },
      'de',
    );
    const result = classify(analysisRoot, fp, contract);
    expect(result.tiers).toContain('C');
  });

  it('Tier C — RTL article with above-ceiling title', () => {
    const fp = parseArticleFilename('news/2026-02-14-committee-reports-ar.html');
    const contract = checkAgainstContract(
      {
        title: 'الريكسداغ '.repeat(20),
        description: 'الريكسداغ '.repeat(15) + '.',
      },
      'ar',
    );
    const result = classify(analysisRoot, fp, contract);
    expect(result.tiers).toContain('C');
  });

  it('Tier C is not assigned to EN articles even with below-floor description', () => {
    const fp = parseArticleFilename('news/2026-02-14-committee-reports-en.html');
    const contract = checkAgainstContract(
      { title: 'Short', description: 'too short.' },
      'en',
    );
    const result = classify(analysisRoot, fp, contract);
    expect(result.tiers).not.toContain('C');
  });

  it('multi-tier — Tier A + Tier C for a non-EN article with source + short description', () => {
    // Source exists for 2026-04-15/propositions, so the Japanese article
    // qualifies for Tier A; its too-short description qualifies it for
    // Tier C as well.
    const fp = parseArticleFilename('news/2026-04-15-propositions-ja.html');
    const contract = checkAgainstContract(
      { title: '議'.repeat(35), description: '議会。' },
      'ja',
    );
    const result = classify(analysisRoot, fp, contract);
    expect(result.tiers).toContain('A');
    expect(result.tiers).toContain('C');
  });

  it('every reason is set when its tier is assigned', () => {
    const fp = parseArticleFilename('news/2026-04-15-propositions-sv.html');
    const contract = checkAgainstContract(
      { title: 'Short', description: 'too short.' },
      'sv',
    );
    const result: ClassificationResult = classify(analysisRoot, fp, contract);
    for (const t of result.tiers) {
      expect(result.reasons[t]).toBeTruthy();
    }
  });

  it('isKnownLang accepts all 14 contract languages and the BCP-47 `nb` alias', () => {
    for (const lang of ['en', 'sv', 'da', 'no', 'nb', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh']) {
      expect(isKnownLang(lang)).toBe(true);
    }
  });

  it('isKnownLang rejects an unknown language', () => {
    expect(isKnownLang('xx')).toBe(false);
  });

  it('classifier test exports parseArticleFilename / findAnalysisSource / isKnownLang', () => {
    expect(classifierTest.parseArticleFilename).toBe(parseArticleFilename);
    expect(classifierTest.findAnalysisSource).toBe(findAnalysisSource);
    expect(classifierTest.isKnownLang).toBe(isKnownLang);
  });
});

// ---------------------------------------------------------------------------
// html-inspector
// ---------------------------------------------------------------------------

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="sv">
<head>
  <title>Regeringen godkänner vårbudget — Riksdagsmonitor</title>
  <meta name="description" content="Sveriges regering godkände i dag vårbudgeten efter tre månaders förhandling.">
  <meta property="og:title" content="OG Title Example">
  <meta property="og:description" content="OG description example.">
  <meta name="twitter:title" content="Twitter Title Example">
  <meta name="twitter:description" content="Twitter description example.">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"NewsArticle","headline":"JSON-LD Headline","alternativeHeadline":"JSON-LD Alt Headline","description":"JSON-LD Description"}
  </script>
</head>
<body>
  <article>
    <h1>Regeringen godkänner vårbudget</h1>
    <p>Sveriges regering godkände i dag vårbudgeten efter tre månaders förhandling.</p>
  </article>
</body>
</html>`;

describe('html-inspector: inspectHtmlContent', () => {
  it('extracts every metadata surface', () => {
    const meta = inspectHtmlContent(SAMPLE_HTML, '/tmp/sample.html');
    expect(meta.lang).toBe('sv');
    expect(meta.title).toBe('Regeringen godkänner vårbudget — Riksdagsmonitor');
    expect(meta.metaDescription).toMatch(/^Sveriges regering/);
    expect(meta.ogTitle).toBe('OG Title Example');
    expect(meta.ogDescription).toBe('OG description example.');
    expect(meta.twitterTitle).toBe('Twitter Title Example');
    expect(meta.twitterDescription).toBe('Twitter description example.');
    expect(meta.jsonLdHeadline).toBe('JSON-LD Headline');
    expect(meta.jsonLdAlternativeHeadline).toBe('JSON-LD Alt Headline');
    expect(meta.jsonLdDescription).toBe('JSON-LD Description');
  });

  it('populates bodyPlainText from <article> contents', () => {
    const meta = inspectHtmlContent(SAMPLE_HTML);
    expect(meta.bodyPlainText).toContain('Sveriges regering godkände');
    expect(meta.bodyPlainText).not.toContain('<h1>');
  });

  it('decodes HTML entities in metadata', () => {
    const html = SAMPLE_HTML.replace(
      'Sveriges regering godkände i dag vårbudgeten efter tre månaders förhandling.',
      'Sweden&#39;s government approved today&#8217;s spring budget.',
    );
    const meta = inspectHtmlContent(html);
    expect(meta.metaDescription).toContain("Sweden's government approved today");
  });

  it('returns empty lang when <html lang="…"> is missing (CLI applies the fallback)', () => {
    const meta = inspectHtmlContent('<html><head><title>x</title></head></html>');
    expect(meta.lang).toBe('');
  });

  it('survives a malformed JSON-LD block without crashing', () => {
    const html = `<html lang="en"><head><title>t</title><script type="application/ld+json">{bad json</script></head></html>`;
    const meta = inspectHtmlContent(html);
    expect(meta.jsonLdHeadline).toBe('');
  });

  it('scans multiple JSON-LD blocks and picks the first with the field', () => {
    const html = `<html lang="en"><head><title>t</title>
<script type="application/ld+json">{"@type":"WebSite"}</script>
<script type="application/ld+json">{"@type":"NewsArticle","headline":"Found"}</script>
</head></html>`;
    const meta = inspectHtmlContent(html);
    expect(meta.jsonLdHeadline).toBe('Found');
  });

  it('handles JSON-LD @graph arrays', () => {
    const html = `<html lang="en"><head><title>t</title>
<script type="application/ld+json">{"@graph":[{"@type":"NewsArticle","headline":"From Graph"}]}</script>
</head></html>`;
    const meta = inspectHtmlContent(html);
    expect(meta.jsonLdHeadline).toBe('From Graph');
  });

  it('htmlDecode test helper decodes numeric references', () => {
    expect(inspectorTest.htmlDecode('&#8212;')).toBe('—');
    expect(inspectorTest.htmlDecode('&#x2014;')).toBe('—');
  });

  it('htmlDecode is single-pass (CodeQL js/double-escaping regression)', () => {
    // `&amp;quot;` must survive as the literal text `&quot;` rather
    // than being double-decoded to `"`.
    expect(inspectorTest.htmlDecode('&amp;quot;')).toBe('&quot;');
    expect(inspectorTest.htmlDecode('&amp;amp;')).toBe('&amp;');
    expect(inspectorTest.htmlDecode('&amp;#39;')).toBe('&#39;');
  });

  it('stripTags test helper removes inline tags and collapses whitespace', () => {
    expect(inspectorTest.stripTags('<p>hello <b>world</b></p>')).toBe('hello world');
  });

  it('stripTags handles script/style end tags with whitespace before `>`', () => {
    // Regression for CodeQL js/bad-tag-filter — `</script >` (space
    // before the bracket) is valid HTML5 syntax and must be stripped.
    expect(inspectorTest.stripTags('a<script>evil()</script >b')).toBe('a b');
    expect(inspectorTest.stripTags('a<style>x{}</style\t>b')).toBe('a b');
  });

  it('inspectHtmlContent strips a script block whose end tag has whitespace', () => {
    const html = `<html lang="en"><head><title>t</title></head>
<body><article><p>before <script>alert(1)</script\n>after</p></article></body></html>`;
    const meta = inspectHtmlContent(html);
    expect(meta.bodyPlainText).toContain('before');
    expect(meta.bodyPlainText).toContain('after');
    expect(meta.bodyPlainText).not.toContain('alert');
  });
});

// ---------------------------------------------------------------------------
// report-writer (CSV quoting + serialisation)
// ---------------------------------------------------------------------------

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
    expect(quoteField(undefined as unknown as string)).toBe('');
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

  it('--date-from / --date-to restrict by ISO date', () => {
    fs.writeFileSync(path.join(newsDir, '2030-01-01-future-article-en.html'), EN_HTML);
    cliTest.main([`--news-dir=${newsDir}`, `--output=${outCsv}`, '--quiet', '--date-from=2030-01-01', '--dry-run']);
    const contents = fs.readFileSync(outCsv, 'utf8');
    expect(contents).toContain('2030-01-01');
    expect(contents).not.toContain('2026-02-10');
  });
});
