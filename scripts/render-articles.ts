#!/usr/bin/env -S npx tsx
/**
 * @module Infrastructure/ArticleRenderer
 * @name Markdown → HTML article renderer (CLI)
 *
 * Usage:
 *   npx tsx scripts/render-articles.ts --date 2026-04-23 --subfolder propositions --lang en
 *   npx tsx scripts/render-articles.ts --all --lang en,sv
 *   npx tsx scripts/render-articles.ts --all --core                 # en + sv
 *
 * Consumes aggregated `news/$YYYY/$MM/$DD/$SUB/article.md` files
 * produced by `aggregate-analysis.ts` and emits one HTML file per
 * requested language:
 *
 *   news/$YYYY/$MM/$DD/$SUB-en.html
 *   news/$YYYY/$MM/$DD/$SUB-sv.html
 *
 * Mermaid diagrams in the markdown survive as `<pre class="mermaid">`
 * blocks and are rendered on the client by `js/lib/mermaid-init.mjs`.
 *
 * Translation of the markdown body is the responsibility of the dedicated
 * `news-translate` agentic workflow (it produces
 * `executive-brief_<lang>.md`). This renderer composes the English
 * `article.md` body with the localized brief via
 * `mergeLocalizedWithEnglish` and emits chrome-wrapped HTML per language.
 * Historical `article.<lang>.md` files are forbidden and intentionally
 * ignored — see `scripts/validate-file-ownership.ts:isLocalizedArticleMd`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';

import type { Language } from './types/language.js';
import {
  LANGUAGES,
  ROOT_DIR,
  renderArticleHtml,
  aggregateAnalysis,
  DAILY_DIR,
  mergeLocalizedWithEnglish,
} from './render-lib/index.js';
// Registry is consumed inside render-lib/article.ts (called by renderArticleHtml)
// — no direct usage needed here but the import documents the dependency chain.

const __filename = fileURLToPath(import.meta.url);
const execFileAsync = promisify(execFile);

interface CliOptions {
  readonly date?: string;
  readonly subfolder?: string;
  readonly langs: readonly Language[];
  readonly all: boolean;
  readonly quiet: boolean;
}

function parseLangArg(raw: string | undefined, fallback: readonly Language[]): readonly Language[] {
  if (!raw) return fallback;
  if (raw === 'all') return LANGUAGES;
  if (raw === 'core') return ['en', 'sv'];
  const set = new Set<Language>();
  for (const token of raw.split(',').map((t) => t.trim()).filter(Boolean)) {
    if (!(LANGUAGES as readonly string[]).includes(token)) {
      throw new Error(`Unknown language: ${token}`);
    }
    set.add(token as Language);
  }
  return [...set];
}

function parseArgs(argv: readonly string[]): CliOptions {
  let date: string | undefined;
  let subfolder: string | undefined;
  let rawLangs: string | undefined;
  let all = false;
  let quiet = false;
  let coreOnly = false;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--date') date = argv[++i];
    else if (a === '--subfolder' || a === '--sub') subfolder = argv[++i];
    else if (a === '--lang' || a === '--langs') rawLangs = argv[++i];
    else if (a === '--core') coreOnly = true;
    else if (a === '--all') all = true;
    else if (a === '--quiet') quiet = true;
  }
  const langs = coreOnly ? (['en', 'sv'] as const) : parseLangArg(rawLangs, ['en', 'sv']);
  return { date, subfolder, langs, all, quiet };
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

interface RenderCase {
  readonly date: string;
  readonly subfolder: string;
  readonly articleMdPath: string;
  readonly subfolderRepoRelPath: string;
}

function locateArticleMd(date: string, subfolder: string): string | null {
  const base = path.join(ROOT_DIR, 'analysis', 'daily', date, subfolder);
  const primary = path.join(base, 'article.md');
  if (fs.existsSync(primary)) return primary;
  return null;
}

function canonicalPathFor(_date: string, subfolder: string, lang: Language, date: string): string {
  const flatSubfolder = subfolder.replace(/\//g, '-');
  return `news/${date}-${flatSubfolder}-${lang}.html`;
}

function allCaseDates(): RenderCase[] {
  if (!fs.existsSync(DAILY_DIR)) return [];
  const out: RenderCase[] = [];
  const dateDirs = fs.readdirSync(DAILY_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
    .map((e) => e.name)
    .sort();
  for (const date of dateDirs) {
    const dateDir = path.join(DAILY_DIR, date);
    const discoverSubfolders = (dir: string, prefix: string): void => {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory());
      for (const entry of entries) {
        const subfolder = prefix ? `${prefix}/${entry.name}` : entry.name;
        const subRepoRel = `analysis/daily/${date}/${subfolder}`;
        const md = locateArticleMd(date, subfolder);
        if (md) {
          out.push({ date, subfolder, articleMdPath: md, subfolderRepoRelPath: subRepoRel });
        }
        discoverSubfolders(path.join(dir, entry.name), subfolder);
      }
    };
    discoverSubfolders(dateDir, '');
  }
  return out;
}

async function renderOne(
  rc: RenderCase,
  langs: readonly Language[],
  quiet: boolean,
): Promise<number> {
  const markdown = fs.readFileSync(rc.articleMdPath, 'utf8');
  const hreflangAlternates: Partial<Record<Language, string>> = {};
  for (const l of LANGUAGES) {
    hreflangAlternates[l] = canonicalPathFor(rc.date, rc.subfolder, l, rc.date);
  }

  const artifactsUsed = resolveArtifactList(rc);

  // Cascade chain step #1 — load the English `executive-brief.md`
  // adjacent to `article.md`. The renderer derives `<title>` and
  // `<meta description>` **directly from the brief** (post-2026-05-24
  // SEO contract); `article.md` frontmatter `title:` / `description:`
  // lines are no longer emitted by the aggregator and only matter as
  // back-compat fallback for the 278 pre-`2026-03-26` legacy
  // `news/*-en.html` files whose source directories have been deleted.
  const articleDir = path.dirname(rc.articleMdPath);
  const briefPath = path.join(articleDir, 'executive-brief.md');
  const englishBriefMarkdown = fs.existsSync(briefPath)
    ? fs.readFileSync(briefPath, 'utf8')
    : undefined;

  let count = 0;
  for (const lang of langs) {
    // Cascade chain step #2 — `executive-brief_<lang>.md` provides the
    // localized SEO. The renderer reads it directly via
    // `localizedBriefMarkdown`; the merger is only needed when a body
    // overlay is required (now a no-op since `article.<lang>.md` is a
    // forbidden artifact — see `validate-file-ownership.ts`). The
    // merger no longer rewrites title/description from the brief; that
    // moved to the renderer in `deriveBriefSeoOverrides`.
    let mdForLang: string;
    let localizedBriefMarkdown: string | undefined;
    if (lang === 'en') {
      mdForLang = markdown;
    } else {
      const briefLangPath = path.join(articleDir, `executive-brief_${lang}.md`);
      localizedBriefMarkdown = fs.existsSync(briefLangPath)
        ? fs.readFileSync(briefLangPath, 'utf8')
        : undefined;
      // The merger still runs to force `language: <lang>` in the
      // front-matter (so JSON-LD `inLanguage` matches `<html lang>`)
      // and to apply the body overlay when a localized body exists.
      // Title/description/keywords frontmatter overlay has been removed
      // — the renderer now owns those via the brief inputs below.
      mdForLang = mergeLocalizedWithEnglish({
        englishMarkdown: markdown,
        localizedMarkdown: '',
        lang,
      });
    }
    const canonicalPath = canonicalPathFor(rc.date, rc.subfolder, lang, rc.date);
    const html = await renderArticleHtml({
      markdown: mdForLang,
      lang,
      canonicalPath,
      hreflangAlternates,
      subfolderRepoRelPath: rc.subfolderRepoRelPath,
      artifactsUsed,
      englishBriefMarkdown,
      localizedBriefMarkdown,
      subfolderSlug: rc.subfolder,
    });
    const outPath = path.join(ROOT_DIR, canonicalPath);
    ensureDir(path.dirname(outPath));
    fs.writeFileSync(outPath, html, 'utf8');
    count += 1;
    if (!quiet) console.log(`✅ ${canonicalPath}`);
  }
  return count;
}

function resolveArtifactList(rc: RenderCase): readonly string[] {
  const analysisAbs = path.join(ROOT_DIR, rc.subfolderRepoRelPath);
  if (!fs.existsSync(analysisAbs)) return [];
  const out: string[] = [];
  const walk = (dir: string, prefix: string): void => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, e.name);
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (rel === 'pass1' || rel.startsWith('pass1/')) continue;
        walk(full, rel);
      } else if (/\.(md|json)$/i.test(e.name) && !/^article(?:\.[a-z-]+)?\.md$/i.test(e.name)) {
        // Skip localized executive-brief translation carriers
        // (`executive-brief_<lang>.md`). They are translations of the
        // English `executive-brief.md` — consumed by the SEO cascade and
        // the localized on-page lead — not independent analytical
        // artifacts, so they must not appear in the Reader Intelligence
        // Guide, the Article Sources provenance grid, or JSON-LD
        // `isBasedOn`.
        if (/^executive-brief_[a-z-]+\.md$/i.test(e.name)) continue;
        out.push(rel);
      }
    }
  };
  walk(analysisAbs, '');
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.all) {
    const cases = allCaseDates();
    const total = await renderAllParallel(cases, args.langs);
    console.log(`\n📝 Rendered ${total} article HTML file(s) across ${cases.length} subfolder(s).`);
    return;
  }

  if (!args.date || !args.subfolder) {
    console.error('Usage: render-articles.ts --date YYYY-MM-DD --subfolder <name> [--lang en,sv]');
    console.error('   or: render-articles.ts --all [--lang all|core|en,sv]');
    process.exitCode = 1;
    return;
  }

  let md = locateArticleMd(args.date, args.subfolder);
  if (!md) {
    const subAbs = path.join(DAILY_DIR, args.date, args.subfolder);
    if (fs.existsSync(subAbs)) {
      const result = aggregateAnalysis({
        subfolderAbsPath: subAbs,
        subfolderRepoRelPath: `analysis/daily/${args.date}/${args.subfolder}`,
        date: args.date,
        subfolder: args.subfolder,
      });
      md = path.join(subAbs, 'article.md');
      ensureDir(path.dirname(md));
      fs.writeFileSync(md, result.markdown, 'utf8');
      if (!args.quiet) console.log(`📦 Auto-aggregated missing article.md (${result.artifactsUsed.length} artifacts)`);
    } else {
      console.error(`❌ No analysis folder at ${subAbs} and no article.md found.`);
      process.exitCode = 1;
      return;
    }
  }

  const rc: RenderCase = {
    date: args.date,
    subfolder: args.subfolder,
    articleMdPath: md,
    subfolderRepoRelPath: `analysis/daily/${args.date}/${args.subfolder}`,
  };
  await renderOne(rc, args.langs, args.quiet);
}

/**
 * Render every discovered subfolder in parallel using a bounded pool of
 * child processes.
 *
 * The per-subfolder render (`renderOne`) is pure CPU work — the
 * remark/micromark markdown→HTML pipeline (`renderMarkdownToHtml`) runs
 * synchronously and never yields to the event loop, so in-process
 * `Promise.all` concurrency provides zero speedup. Real parallelism
 * requires separate processes.
 *
 * Each subfolder is independent (read-only `analysis/daily/**` inputs,
 * distinct `news/<date>-<sub>-<lang>.html` outputs), so we fan out by
 * re-invoking this same CLI in single-subfolder mode
 * (`--date <d> --subfolder <s> --lang <langs>`) through a pool capped at
 * the machine's core count. This reuses the exact, already-correct render
 * path — no duplicated logic and no worker-thread/tsx-loader coupling.
 */
async function renderAllParallel(
  cases: readonly RenderCase[],
  langs: readonly Language[],
): Promise<number> {
  const concurrency = Math.max(1, os.cpus().length);
  const langsArg = langs.join(',');
  let next = 0;
  let total = 0;

  const runOne = async (rc: RenderCase): Promise<number> => {
    const cliArgs = [
      __filename,
      '--date', rc.date,
      '--subfolder', rc.subfolder,
      '--lang', langsArg,
      '--quiet',
    ];
    try {
      await execFileAsync('npx', ['tsx', ...cliArgs], { cwd: ROOT_DIR, maxBuffer: 16 * 1024 * 1024 });
      return langs.length;
    } catch (err) {
      console.error(`❌ Failed to render ${rc.date}/${rc.subfolder}:`, err instanceof Error ? err.message : err);
      process.exitCode = 1;
      return 0;
    }
  };

  const worker = async (): Promise<void> => {
    while (next < cases.length) {
      const rc = cases[next++];
      total += await runOne(rc);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return total;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
