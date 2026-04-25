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
 * Translation of the markdown body to the remaining 12 languages is the
 * responsibility of the dedicated `news-translate` agentic workflow —
 * this renderer only produces chrome-wrapped HTML from whatever
 * `article.md` / `article.<lang>.md` it finds on disk.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { Language } from './types/language.js';
import {
  LANGUAGES,
  ROOT_DIR,
  renderArticleHtml,
  aggregateAnalysis,
  DAILY_DIR,
} from './render-lib/index.js';

const __filename = fileURLToPath(import.meta.url);
void __filename;

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
  return `news/${date}-${subfolder}-${lang}.html`;
}

function allCaseDates(): RenderCase[] {
  if (!fs.existsSync(DAILY_DIR)) return [];
  const out: RenderCase[] = [];
  const dateDirs = fs.readdirSync(DAILY_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
    .map((e) => e.name)
    .sort();
  for (const date of dateDirs) {
    const subs = fs.readdirSync(path.join(DAILY_DIR, date), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
    for (const subfolder of subs) {
      const subRepoRel = `analysis/daily/${date}/${subfolder}`;
      const md = locateArticleMd(date, subfolder);
      if (md) {
        out.push({ date, subfolder, articleMdPath: md, subfolderRepoRelPath: subRepoRel });
      }
    }
  }
  return out;
}

async function renderOne(
  rc: RenderCase,
  langs: readonly Language[],
  quiet: boolean,
): Promise<number> {
  const markdown = fs.readFileSync(rc.articleMdPath, 'utf8');
  // Populate hreflang alternates for EVERY supported language — not just
  // the ones being rendered in this invocation — so the language switcher
  // in the chrome always points at the sibling article
  // (`news/{date}-{subfolder}-{lang}.html`) instead of falling back to
  // the language homepage. Translation of missing languages is handled
  // by the dedicated `news-translate` agentic workflow; the alternates
  // URLs stay stable and predictable.
  const hreflangAlternates: Partial<Record<Language, string>> = {};
  for (const l of LANGUAGES) {
    hreflangAlternates[l] = canonicalPathFor(rc.date, rc.subfolder, l, rc.date);
  }

  // Parse the artifact list from the aggregator's generated markdown — fall
  // back to the analysis folder contents if the aggregator didn't store a list.
  const artifactsUsed = resolveArtifactList(rc);

  let count = 0;
  for (const lang of langs) {
    const langSpecific = path.join(
      path.dirname(rc.articleMdPath),
      `article.${lang}.md`,
    );
    const mdForLang = fs.existsSync(langSpecific)
      ? fs.readFileSync(langSpecific, 'utf8')
      : markdown;
    const canonicalPath = canonicalPathFor(rc.date, rc.subfolder, lang, rc.date);
    const html = await renderArticleHtml({
      markdown: mdForLang,
      lang,
      canonicalPath,
      hreflangAlternates,
      subfolderRepoRelPath: rc.subfolderRepoRelPath,
      artifactsUsed,
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
    let total = 0;
    for (const rc of cases) total += await renderOne(rc, args.langs, args.quiet);
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
    // Auto-aggregate if article.md is missing but analysis exists.
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

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
