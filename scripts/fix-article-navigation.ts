#!/usr/bin/env -S npx tsx
/**
 * Fix Article Navigation: Language Switcher + Back-to-News Top Nav
 *
 * This script ensures ALL news articles have:
 * 1. A language switcher nav (14 languages) after <body>
 * 2. An article-top-nav div with a localized back-to-news link before the article
 *
 * It auto-discovers all articles in the news/ directory and processes them
 * idempotently — safe to run multiple times.
 *
 * Usage:
 *   npx tsx scripts/fix-article-navigation.ts
 *   npx tsx scripts/fix-article-navigation.ts --dry-run
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Language } from './types/language.js';
import { ALL_LANG_CODES, FOOTER_LABELS } from './article-template/constants.js';
import { getNewsIndexFilename, generateArticleLanguageSwitcher } from './article-template/helpers.js';

// ── Helpers ───────────────────────────────────────────────────────────────

function extractLang(filename: string): Language | null {
  const name = filename.replace(/\.html$/, '');
  for (const lang of ALL_LANG_CODES) {
    if (name.endsWith(`-${lang}`)) return lang;
  }
  return null;
}

function extractBase(filename: string): string | null {
  const name = filename.replace(/\.html$/, '');
  for (const lang of ALL_LANG_CODES) {
    if (name.endsWith(`-${lang}`)) return name.slice(0, -(lang.length + 1));
  }
  return null;
}

function generateTopNav(lang: Language): string {
  const label = FOOTER_LABELS[lang].backToNews;
  const index = getNewsIndexFilename(lang);
  return `\n<div class="article-top-nav">\n  <a href="${index}" class="back-to-news">\n    ← ${label}\n  </a>\n</div>\n`;
}

// ── Processing ────────────────────────────────────────────────────────────

export interface ProcessResult {
  addedSwitcher: boolean;
  addedTopnav: boolean;
  fixedTopnav: boolean;
}

/**
 * Transform article HTML string: ensures language-switcher and article-top-nav
 * with a back-to-news link are present. Idempotent — safe to call multiple times.
 *
 * @param content   Original HTML string
 * @param baseSlug  Article base slug without directory prefix (e.g. "2026-01-01-article")
 * @param lang      Language code for this variant
 * @returns Updated HTML string and flags indicating what changed
 */
export function transformContent(
  content: string,
  baseSlug: string,
  lang: Language,
): { content: string } & ProcessResult {
  let result = content;
  let addedSwitcher = false;
  let addedTopnav = false;
  let fixedTopnav = false;

  // ── 1. Language switcher ──────────────────────────────────────────
  const hasSwitcher = result.includes('language-switcher');
  if (!hasSwitcher) {
    const switcherHtml = generateArticleLanguageSwitcher(baseSlug, lang);
    // Prefer inserting AFTER the skip-link so it remains the first focusable element.
    const skipLinkPattern = /(<a[^>]*class="skip-link"[^>]*>[\s\S]*?<\/a>)/;
    if (skipLinkPattern.test(result)) {
      result = result.replace(skipLinkPattern, `$1\n${switcherHtml}`);
    } else {
      result = result.replace(/(<body[^>]*>)/, `$1\n${switcherHtml}`);
    }
    addedSwitcher = true;
  } else {
    // Update existing switcher to have all 14 languages.
    // Use [^\S\n]* (spaces/tabs, not newlines) to consume any indentation before <nav>,
    // so the replacement string's own leading spaces don't accumulate on repeated runs.
    const newSwitcher = generateArticleLanguageSwitcher(baseSlug, lang);
    result = result.replace(/[^\S\n]*<nav class="language-switcher"[^>]*>[\s\S]*?<\/nav>/, newSwitcher);
  }

  // ── 2. article-top-nav ────────────────────────────────────────────
  const hasTopnav = result.includes('article-top-nav');

  // If top-nav exists but is missing back-to-news link, replace it
  if (hasTopnav) {
    const topNavHasBackLink =
      /<div class="article-top-nav">[\s\S]*?class="back-to-news"[\s\S]*?<\/div>/.test(result);
    if (!topNavHasBackLink) {
      result = result.replace(
        /<div class="article-top-nav">[\s\S]*?<\/div>/,
        generateTopNav(lang).trim(),
      );
      fixedTopnav = true;
    }
  }

  if (!hasTopnav) {
    const topNavHtml = generateTopNav(lang);
    let inserted = false;

    // Pattern A: insert after closing </nav> of language-switcher, before article/div.news-article
    if (result.includes('</nav>')) {
      const navPattern = /((<\/nav>)([\s]*)(<(?:article|div)\s+class="(?:news-article|container)"))/s;
      const match = navPattern.exec(result);
      if (match) {
        const endOfNav = match.index + match[2].length;
        const whitespace = match[3];
        const articleTag = match[4];
        const afterFull = result.slice(match.index + match[0].length);
        result = result.slice(0, endOfNav) + topNavHtml + whitespace + articleTag + afterFull;
        inserted = true;
      }
    }

    // Pattern B: insert directly before <article class="news-article"> or <div class="container">
    if (!inserted) {
      const articlePattern = /(<(?:article|div)\s+class="(?:news-article|container)")/;
      const match = articlePattern.exec(result);
      if (match) {
        result = result.slice(0, match.index) + topNavHtml + '\n' + result.slice(match.index);
        inserted = true;
      }
    }

    if (inserted) addedTopnav = true;
  }

  return { content: result, addedSwitcher, addedTopnav, fixedTopnav };
}

function processArticle(filepath: string, baseSlug: string, lang: Language, dryRun: boolean): ProcessResult {
  const original = fs.readFileSync(filepath, 'utf-8');
  const { content, addedSwitcher, addedTopnav, fixedTopnav } = transformContent(original, baseSlug, lang);

  // ── Write if changed ──────────────────────────────────────────────
  if (content !== original && !dryRun) {
    fs.writeFileSync(filepath, content, 'utf-8');
  }

  return { addedSwitcher, addedTopnav, fixedTopnav };
}

interface ArticleMap {
  [baseSlug: string]: Partial<Record<Language, string>>;
}

function discoverArticles(newsDir: string): ArticleMap {
  const articles: ArticleMap = {};
  const files = fs.readdirSync(newsDir).sort();
  for (const name of files) {
    if (!name.endsWith('.html') || name.startsWith('index')) continue;
    const lang = extractLang(name);
    const base = extractBase(name);
    if (lang && base) {
      if (!articles[base]) articles[base] = {};
      articles[base][lang] = path.join(newsDir, name);
    }
  }
  return articles;
}

function main(): void {
  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) {
    console.log('=== DRY RUN — no files will be modified ===\n');
  }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const newsDir = path.resolve(scriptDir, '..', 'news');

  if (!fs.existsSync(newsDir)) {
    console.error(`ERROR: news directory not found at ${newsDir}`);
    process.exit(1);
  }

  console.log('=== Fix Article Navigation ===');
  console.log(`News directory: ${newsDir}\n`);

  const articles = discoverArticles(newsDir);
  const slugs = Object.keys(articles).sort();
  console.log(`Discovered ${slugs.length} unique article slugs\n`);

  let total = 0;
  let switchersAdded = 0;
  let topnavsAdded = 0;
  let topnavsFixed = 0;

  for (const baseSlug of slugs) {
    const langFiles = articles[baseSlug];
    for (const lang of ALL_LANG_CODES) {
      const filepath = langFiles[lang];
      if (!filepath) continue;
      total++;
      const { addedSwitcher, addedTopnav, fixedTopnav } = processArticle(filepath, baseSlug, lang, dryRun);
      if (addedSwitcher) switchersAdded++;
      if (addedTopnav) topnavsAdded++;
      if (fixedTopnav) topnavsFixed++;
    }
  }

  console.log('=== Summary ===');
  console.log(`Total files processed: ${total}`);
  console.log(`Language switchers added: ${switchersAdded}`);
  console.log(`Top nav (article-top-nav) added: ${topnavsAdded}`);
  console.log(`Top nav fixed (missing back-to-news link): ${topnavsFixed}`);
  if (dryRun) {
    console.log('\n(Dry run — no files were modified)');
  }
  console.log('\n✓ Done!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
