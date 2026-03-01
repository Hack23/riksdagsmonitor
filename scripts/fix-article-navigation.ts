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

// ── Language configuration ────────────────────────────────────────────────

const LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'] as const;
type Lang = typeof LANGUAGES[number];

const LANG_DISPLAY: Readonly<Record<Lang, [string, string]>> = {
  en: ['🇬🇧', 'English'],
  sv: ['🇸🇪', 'Svenska'],
  da: ['🇩🇰', 'Dansk'],
  no: ['🇳🇴', 'Norsk'],
  fi: ['🇫🇮', 'Suomi'],
  de: ['🇩🇪', 'Deutsch'],
  fr: ['🇫🇷', 'Français'],
  es: ['🇪🇸', 'Español'],
  nl: ['🇳🇱', 'Nederlands'],
  ar: ['🇸🇦', 'العربية'],
  he: ['🇮🇱', 'עברית'],
  ja: ['🇯🇵', '日本語'],
  ko: ['🇰🇷', '한국어'],
  zh: ['🇨🇳', '中文'],
} as const;

const LANG_SWITCHER_ARIA: Readonly<Record<Lang, string>> = {
  en: 'Language', sv: 'Språk', da: 'Sprog', no: 'Språk',
  fi: 'Kieli', de: 'Sprache', fr: 'Langue', es: 'Idioma',
  nl: 'Taal', ar: 'اللغة', he: 'שפה', ja: '言語',
  ko: '언어', zh: '语言',
} as const;

const BACK_TO_NEWS: Readonly<Record<Lang, string>> = {
  en: 'Back to News', sv: 'Tillbaka till nyheter',
  da: 'Tilbage til nyheder', no: 'Tilbake til nyheter',
  fi: 'Takaisin uutisiin', de: 'Zurück zu Nachrichten',
  fr: 'Retour aux actualités', es: 'Volver a noticias',
  nl: 'Terug naar nieuws', ar: 'العودة إلى الأخبار',
  he: 'חזרה לחדשות', ja: 'ニュースに戻る',
  ko: '뉴스로 돌아가기', zh: '返回新闻',
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────

function extractLang(filename: string): Lang | null {
  const name = filename.replace(/\.html$/, '');
  for (const lang of LANGUAGES) {
    if (name.endsWith(`-${lang}`)) return lang;
  }
  return null;
}

function extractBase(filename: string): string | null {
  const name = filename.replace(/\.html$/, '');
  for (const lang of LANGUAGES) {
    if (name.endsWith(`-${lang}`)) return name.slice(0, -(lang.length + 1));
  }
  return null;
}

function newsIndexFor(lang: Lang): string {
  return lang === 'en' ? 'index.html' : `index_${lang}.html`;
}

function generateLanguageSwitcher(baseSlug: string, currentLang: Lang): string {
  const aria = LANG_SWITCHER_ARIA[currentLang];
  const lines: string[] = [`  <nav class="language-switcher" role="navigation" aria-label="${aria}">`];
  for (const lang of LANGUAGES) {
    const [flag, name] = LANG_DISPLAY[lang];
    const activeClass = lang === currentLang ? ' active' : '';
    const ariaCurrent = lang === currentLang ? ' aria-current="page"' : '';
    lines.push(
      `    <a href="${baseSlug}-${lang}.html" class="lang-link${activeClass}" hreflang="${lang}"${ariaCurrent}>${flag} ${name}</a>`,
    );
  }
  lines.push('  </nav>');
  return lines.join('\n');
}

function generateTopNav(lang: Lang): string {
  const label = BACK_TO_NEWS[lang];
  const index = newsIndexFor(lang);
  return `\n<div class="article-top-nav">\n  <a href="${index}" class="back-to-news">\n    ← ${label}\n  </a>\n</div>\n`;
}

// ── Processing ────────────────────────────────────────────────────────────

interface ProcessResult {
  addedSwitcher: boolean;
  addedTopnav: boolean;
}

function processArticle(filepath: string, baseSlug: string, lang: Lang, dryRun: boolean): ProcessResult {
  const original = fs.readFileSync(filepath, 'utf-8');
  let content = original;
  let addedSwitcher = false;
  let addedTopnav = false;

  // ── 1. Language switcher ──────────────────────────────────────────
  const hasSwitcher = content.includes('language-switcher');
  if (!hasSwitcher) {
    const switcherHtml = generateLanguageSwitcher(baseSlug, lang);
    content = content.replace(/(<body>)/, `$1\n${switcherHtml}`);
    addedSwitcher = true;
  } else {
    // Update existing switcher to have all 14 languages
    const newSwitcher = generateLanguageSwitcher(baseSlug, lang);
    content = content.replace(/<nav class="language-switcher"[^>]*>[\s\S]*?<\/nav>/, newSwitcher);
  }

  // ── 2. article-top-nav ────────────────────────────────────────────
  const hasTopnav = content.includes('article-top-nav');
  if (!hasTopnav) {
    const topNavHtml = generateTopNav(lang);
    let inserted = false;

    // Pattern A: insert after closing </nav> of language-switcher, before article/div.news-article
    if (content.includes('</nav>')) {
      // Capture groups: (1)=full outer match, (2)=</nav>, (3)=whitespace, (4)=article/div opening tag
      const navPattern = /((<\/nav>)([\s]*)(<(?:article|div)\s+class="(?:news-article|container)"))/s;
      const match = navPattern.exec(content);
      if (match) {
        const endOfNav = match.index + match[2].length; // position right after </nav>
        const whitespace = match[3];
        const articleTag = match[4];
        const afterFull = content.slice(match.index + match[0].length);
        content = content.slice(0, endOfNav) + topNavHtml + whitespace + articleTag + afterFull;
        inserted = true;
      }
    }

    // Pattern B: insert directly before <article class="news-article"> or <article class="container">
    if (!inserted) {
      const articlePattern = /(<(?:article|div)\s+class="(?:news-article|container)")/;
      const match = articlePattern.exec(content);
      if (match) {
        content = content.slice(0, match.index) + topNavHtml + '\n' + content.slice(match.index);
        inserted = true;
      }
    }

    if (inserted) addedTopnav = true;
  }

  // ── Write if changed ──────────────────────────────────────────────
  if (content !== original && !dryRun) {
    fs.writeFileSync(filepath, content, 'utf-8');
  }

  return { addedSwitcher, addedTopnav };
}

interface ArticleMap {
  [baseSlug: string]: Partial<Record<Lang, string>>;
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

  for (const baseSlug of slugs) {
    const langFiles = articles[baseSlug];
    for (const lang of LANGUAGES) {
      const filepath = langFiles[lang];
      if (!filepath) continue;
      total++;
      const { addedSwitcher, addedTopnav } = processArticle(filepath, baseSlug, lang, dryRun);
      if (addedSwitcher) switchersAdded++;
      if (addedTopnav) topnavsAdded++;
    }
  }

  console.log('=== Summary ===');
  console.log(`Total files processed: ${total}`);
  console.log(`Language switchers added: ${switchersAdded}`);
  console.log(`Top nav (article-top-nav) added: ${topnavsAdded}`);
  if (dryRun) {
    console.log('\n(Dry run — no files were modified)');
  }
  console.log('\n✓ Done!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
