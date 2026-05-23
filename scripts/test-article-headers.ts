#!/usr/bin/env node
/**
 * @module Operations/QA/TestArticleHeaders
 * @category Intelligence Operations / Quality Assurance
 * @name HTML `<head>` audit for the rendered news corpus
 *
 * @description
 * Walks every aggregated `analysis/daily/<YYYY-MM-DD>/<subfolder>/article.md`
 * and prints — for the English locale only — the **exact** `<head>`
 * metadata strings that the article renderer would embed:
 *
 *  - Branded `<title>` (post `chrome/head.ts` Riksdagsmonitor-suffix rule)
 *  - `<meta name="description">`
 *  - `<meta name="keywords">`
 *  - OpenGraph (og:title / og:description / og:locale / article:section)
 *  - Twitter card (twitter:title / twitter:description)
 *  - The raw front-matter title/description/keywords that fed the SEO
 *    composer (so the reader can see how much the SEO truncation /
 *    suffix logic mutated the executive-brief inputs).
 *
 * The values are produced by {@link ./render-lib/article-head-metadata.ts |
 * computeArticleHeadMetadata} — the **same** function the production
 * renderer calls. This guarantees the audit report can never drift from
 * what is actually shipped to riksdagsmonitor.com/news.
 *
 * @usage
 *   npx tsx scripts/test-article-headers.ts [--out <path>] [--limit <N>]
 *
 *   --out <path>   Write the report to a file (default: stdout)
 *   --limit <N>    Process only the first N articles (smoke testing)
 *
 * @output
 * Both a human-readable block-per-article report and a final summary
 * with corpus-wide statistics (avg/min/max title & description length,
 * count of articles exceeding the 70-char SERP title budget and the
 * 200-char meta-description budget).
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { LANGUAGE_META } from './sitemap-html/index.js';
import { computeArticleHeadMetadata } from './render-lib/article-head-metadata.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DAILY_DIR = path.join(ROOT_DIR, 'analysis', 'daily');

interface ArticleCase {
  readonly date: string;
  readonly subfolder: string;
  readonly articleMdPath: string;
  readonly canonicalPath: string;
}

function locateArticleMd(date: string, subfolder: string): string | null {
  const candidate = path.join(DAILY_DIR, date, subfolder, 'article.md');
  return fs.existsSync(candidate) ? candidate : null;
}

function canonicalPathFor(date: string, subfolder: string, lang: string): string {
  const flatSubfolder = subfolder.replace(/\//g, '-');
  return `news/${date}-${flatSubfolder}-${lang}.html`;
}

function discoverArticles(): ArticleCase[] {
  if (!fs.existsSync(DAILY_DIR)) return [];
  const out: ArticleCase[] = [];
  const dateDirs = fs
    .readdirSync(DAILY_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
    .map((e) => e.name)
    .sort();
  for (const date of dateDirs) {
    const dateDir = path.join(DAILY_DIR, date);
    const walk = (dir: string, prefix: string): void => {
      const entries = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory());
      for (const entry of entries) {
        const subfolder = prefix ? `${prefix}/${entry.name}` : entry.name;
        const md = locateArticleMd(date, subfolder);
        if (md) {
          out.push({
            date,
            subfolder,
            articleMdPath: md,
            canonicalPath: canonicalPathFor(date, subfolder, 'en'),
          });
        }
        walk(path.join(dir, entry.name), subfolder);
      }
    };
    walk(dateDir, '');
  }
  return out;
}

interface CliArgs {
  readonly out: string | null;
  readonly limit: number | null;
}

function parseArgs(argv: readonly string[]): CliArgs {
  let out: string | null = null;
  let limit: number | null = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out' && i + 1 < argv.length) {
      out = argv[++i];
    } else if (a === '--limit' && i + 1 < argv.length) {
      const n = Number.parseInt(argv[++i], 10);
      if (Number.isFinite(n) && n > 0) limit = n;
    } else if (a === '--help' || a === '-h') {
      console.log('Usage: test-article-headers.ts [--out <path>] [--limit <N>]');
      process.exit(0);
    }
  }
  return { out, limit };
}

interface Stats {
  count: number;
  titleLenSum: number;
  titleLenMin: number;
  titleLenMax: number;
  descLenSum: number;
  descLenMin: number;
  descLenMax: number;
  brandedTitleOver70: number;
  descriptionOver200: number;
  keywordsMissing: number;
  emptyDescription: number;
  brandSuffixMissing: number;
}

function newStats(): Stats {
  return {
    count: 0,
    titleLenSum: 0,
    titleLenMin: Number.POSITIVE_INFINITY,
    titleLenMax: 0,
    descLenSum: 0,
    descLenMin: Number.POSITIVE_INFINITY,
    descLenMax: 0,
    brandedTitleOver70: 0,
    descriptionOver200: 0,
    keywordsMissing: 0,
    emptyDescription: 0,
    brandSuffixMissing: 0,
  };
}

function formatBlock(index: number, total: number, ac: ArticleCase, lang: 'en'): string {
  const markdown = fs.readFileSync(ac.articleMdPath, 'utf8');
  const head = computeArticleHeadMetadata({
    markdown,
    lang,
    canonicalPath: ac.canonicalPath,
  });
  const langMeta = LANGUAGE_META[lang];

  // Derived `<head>` siblings that chrome/head.ts emits alongside the
  // primary title/description. These are pure projections of `seo.*`
  // and `LANGUAGE_META` — listed here so the reader sees the *full*
  // shipped surface without having to open chrome/head.ts.
  const ogTitle = head.brandedTitle;
  const ogDescription = head.seo.description;
  const ogLocale = langMeta.locale;
  const articleSection = head.articleTypeLabel;
  const twitterTitle = head.brandedTitle;
  const twitterDescription = head.seo.description;

  const lines: string[] = [];
  lines.push('═'.repeat(78));
  lines.push(`[${String(index + 1).padStart(4, ' ')}/${total}] ${ac.canonicalPath}`);
  lines.push('─'.repeat(78));
  lines.push(`  date              : ${head.date}`);
  lines.push(`  date subfolder    : ${ac.subfolder}`);
  lines.push(`  article type id   : ${head.articleTypeId}`);
  lines.push(`  article type label: ${head.articleTypeLabel}`);
  lines.push(`  article.md path   : ${path.relative(ROOT_DIR, ac.articleMdPath)}`);
  lines.push('');
  lines.push(`  ── front-matter (post executive-brief cascade) ─────────────────────────`);
  lines.push(`  raw title         (${head.rawTitle.length.toString().padStart(3, ' ')} chars) : ${head.rawTitle}`);
  lines.push(`  raw description   (${head.rawDescription.length.toString().padStart(3, ' ')} chars) : ${head.rawDescription}`);
  if (head.rawKeywords) {
    lines.push(`  raw keywords      (${head.rawKeywords.length.toString().padStart(3, ' ')} chars) : ${head.rawKeywords}`);
  } else {
    lines.push(`  raw keywords      : (none — composer will derive from title + type)`);
  }
  lines.push('');
  lines.push(`  ── computed SEO triple (buildArticleSeoMetadata) ──────────────────────`);
  lines.push(`  seo.title         (${head.seo.title.length.toString().padStart(3, ' ')} chars) : ${head.seo.title}`);
  lines.push(`  seo.description   (${head.seo.description.length.toString().padStart(3, ' ')} chars) : ${head.seo.description}`);
  lines.push(`  seo.keywords      (${head.seo.keywords.length.toString().padStart(3, ' ')} chars) : ${head.seo.keywords}`);
  lines.push('');
  lines.push(`  ── shipped <head> values (chrome/head.ts) ─────────────────────────────`);
  lines.push(`  <title>           (${head.brandedTitle.length.toString().padStart(3, ' ')} chars) : ${head.brandedTitle}`);
  lines.push(`  meta description  : ${head.seo.description}`);
  lines.push(`  meta keywords     : ${head.seo.keywords}`);
  lines.push(`  og:title          : ${ogTitle}`);
  lines.push(`  og:description    : ${ogDescription}`);
  lines.push(`  og:locale         : ${ogLocale}`);
  lines.push(`  article:section   : ${articleSection}`);
  lines.push(`  twitter:title     : ${twitterTitle}`);
  lines.push(`  twitter:description: ${twitterDescription}`);

  // Flag SERP/budget issues so the reader can spot bad entries quickly.
  const flags: string[] = [];
  if (head.brandedTitle.length > 70) flags.push(`TITLE>70 (${head.brandedTitle.length})`);
  if (head.seo.description.length > 200) flags.push(`DESC>200 (${head.seo.description.length})`);
  if (!head.seo.description.trim()) flags.push('EMPTY_DESC');
  if (!head.seo.keywords.trim()) flags.push('EMPTY_KEYWORDS');
  if (!/riksdagsmonitor/i.test(head.brandedTitle)) flags.push('NO_BRAND_SUFFIX');
  if (flags.length > 0) {
    lines.push('');
    lines.push(`  ⚠ flags           : ${flags.join('  ')}`);
  }
  lines.push('');
  return lines.join('\n');
}

function updateStats(stats: Stats, ac: ArticleCase): void {
  const markdown = fs.readFileSync(ac.articleMdPath, 'utf8');
  const head = computeArticleHeadMetadata({
    markdown,
    lang: 'en',
    canonicalPath: ac.canonicalPath,
  });
  stats.count += 1;
  stats.titleLenSum += head.brandedTitle.length;
  stats.titleLenMin = Math.min(stats.titleLenMin, head.brandedTitle.length);
  stats.titleLenMax = Math.max(stats.titleLenMax, head.brandedTitle.length);
  stats.descLenSum += head.seo.description.length;
  stats.descLenMin = Math.min(stats.descLenMin, head.seo.description.length);
  stats.descLenMax = Math.max(stats.descLenMax, head.seo.description.length);
  if (head.brandedTitle.length > 70) stats.brandedTitleOver70 += 1;
  if (head.seo.description.length > 200) stats.descriptionOver200 += 1;
  if (!head.seo.keywords.trim()) stats.keywordsMissing += 1;
  if (!head.seo.description.trim()) stats.emptyDescription += 1;
  if (!/riksdagsmonitor/i.test(head.brandedTitle)) stats.brandSuffixMissing += 1;
}

function formatSummary(stats: Stats): string {
  if (stats.count === 0) {
    return 'No articles processed.';
  }
  const avgTitle = (stats.titleLenSum / stats.count).toFixed(1);
  const avgDesc = (stats.descLenSum / stats.count).toFixed(1);
  const lines: string[] = [];
  lines.push('');
  lines.push('═'.repeat(78));
  lines.push('SUMMARY — riksdagsmonitor.com/news <head> audit (English locale)');
  lines.push('═'.repeat(78));
  lines.push(`Articles processed         : ${stats.count}`);
  lines.push('');
  lines.push(`Branded <title> length     : min=${stats.titleLenMin}  max=${stats.titleLenMax}  avg=${avgTitle}`);
  lines.push(`Meta description length    : min=${stats.descLenMin}  max=${stats.descLenMax}  avg=${avgDesc}`);
  lines.push('');
  lines.push('Budget violations (SERP):');
  lines.push(`  <title> > 70 chars       : ${stats.brandedTitleOver70}  (Google SERP truncation budget)`);
  lines.push(`  description > 200 chars  : ${stats.descriptionOver200}  (Google SERP truncation budget)`);
  lines.push('');
  lines.push('Content issues:');
  lines.push(`  empty description        : ${stats.emptyDescription}`);
  lines.push(`  empty keywords           : ${stats.keywordsMissing}`);
  lines.push(`  missing brand suffix     : ${stats.brandSuffixMissing}  (<title> does not contain "Riksdagsmonitor")`);
  lines.push('');
  lines.push(
    'NOTE: All values printed above come from `computeArticleHeadMetadata` ' +
      '— the same helper the real renderer calls. Any change to the renderer ' +
      'output automatically reflects here.',
  );
  return lines.join('\n');
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  let articles = discoverArticles();
  const total = articles.length;
  if (args.limit && args.limit < articles.length) {
    articles = articles.slice(0, args.limit);
  }

  const stats = newStats();
  const chunks: string[] = [];
  chunks.push('# Riksdagsmonitor news `<head>` audit (English locale)');
  chunks.push('');
  chunks.push(`Generated by: scripts/test-article-headers.ts`);
  chunks.push(`Articles discovered: ${total}`);
  chunks.push(`Articles processed : ${articles.length}${args.limit ? ` (--limit ${args.limit})` : ''}`);
  chunks.push('');
  chunks.push(
    'This report prints every `<head>` value that ships into a rendered ' +
      "news article HTML page, using the same `computeArticleHeadMetadata` " +
      'helper as the real article renderer. The goal is to expose the ' +
      "current state of titles, descriptions and keywords so they can be " +
      'improved.',
  );
  chunks.push('');

  for (let i = 0; i < articles.length; i++) {
    try {
      chunks.push(formatBlock(i, articles.length, articles[i], 'en'));
      updateStats(stats, articles[i]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      chunks.push(`!! ERROR processing ${articles[i].articleMdPath}: ${msg}`);
    }
  }

  chunks.push(formatSummary(stats));
  const report = chunks.join('\n');

  if (args.out) {
    const outAbs = path.isAbsolute(args.out) ? args.out : path.join(ROOT_DIR, args.out);
    fs.mkdirSync(path.dirname(outAbs), { recursive: true });
    fs.writeFileSync(outAbs, report, 'utf8');
    console.log(`✅ Wrote report (${stats.count} articles) to ${path.relative(ROOT_DIR, outAbs)}`);
  } else {
    process.stdout.write(report);
    process.stdout.write('\n');
  }
}

main();
