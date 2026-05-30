/**
 * @module Infrastructure/Rss/Scanner
 * @category Intelligence Operations / Supporting Infrastructure
 * @name News article scanner — language-aware with hreflang alternates
 *
 * @description
 * Scans `news/` (top level only — does **not** recurse into date-partitioned
 * subdirectories, matching legacy behaviour), groups files by base slug,
 * keeps only those that have a variant in the requested feed language
 * (defaulting to English), builds the alternate-language map for hreflang
 * link tags, sorts by pub date descending, and caps at `MAX_ITEMS` (50).
 * Title/description are read from the per-language article HTML so each
 * localized feed carries localized item metadata. Returns the list ready
 * to be rendered into RSS `<item>` blocks.
 *
 * Round-6 split: extracted from `scripts/generate-rss.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { Language } from '../types/language.js';

import { extractArticleMeta } from './article-meta.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://riksdagsmonitor.com';
const NEWS_DIR = path.join(__dirname, '..', '..', 'news');
const MAX_ITEMS = 50;

/** A single RSS feed item with its multi-language alternate links. */
export interface RssArticle {
  file: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  baseSlug: string;
  lang: Language;
  author: string;
  category: string;
  alternateLanguages: Array<{ lang: Language; href: string }>;
}

/**
 * Get news articles for an RSS feed in the requested `feedLang`.
 *
 * Each returned item is anchored on the article variant that actually
 * exists in `feedLang` (so the `<link>`/`<guid>` always point at a real
 * file) and carries the localized title/description extracted from that
 * variant's HTML. Article groups without a `feedLang` variant are
 * skipped. The other language variants present for the same base slug
 * become the `alternateLanguages` hreflang siblings.
 *
 * Defaults to English (`'en'`) so the legacy `rss.xml` output is
 * unchanged.
 */
export function getRssArticles(feedLang: Language = 'en'): RssArticle[] {
  console.log(`📰 Scanning news directory for RSS articles (${feedLang})...`);

  if (!fs.existsSync(NEWS_DIR)) {
    console.warn('⚠️ News directory not found');
    return [];
  }

  const files = fs
    .readdirSync(NEWS_DIR)
    .filter((file) => file.endsWith('.html') && file !== 'index.html' && !file.startsWith('index_'));

  const articleGroups = new Map<string, Map<Language, string>>();
  for (const file of files) {
    const match = file.match(/^(.+?)-(en|sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/);
    if (match) {
      const baseSlug = match[1]!;
      const lang = match[2]! as Language;
      if (!articleGroups.has(baseSlug)) {
        articleGroups.set(baseSlug, new Map());
      }
      articleGroups.get(baseSlug)!.set(lang, file);
    }
  }

  const articles: RssArticle[] = [];

  for (const [baseSlug, langMap] of articleGroups) {
    const primaryFile = langMap.get(feedLang);
    // Only emit an item when the requested language variant exists on
    // disk — guarantees the feed never links to a missing page.
    if (!primaryFile) continue;

    const filePath = path.join(NEWS_DIR, primaryFile);
    const meta = extractArticleMeta(filePath);

    const alternates: Array<{ lang: Language; href: string }> = [];
    for (const [lang, altFile] of langMap) {
      if (lang !== feedLang) {
        alternates.push({
          lang,
          href: `${BASE_URL}/news/${altFile}`,
        });
      }
    }

    articles.push({
      file: primaryFile,
      title: meta.title,
      description: meta.description,
      link: `${BASE_URL}/news/${primaryFile}`,
      pubDate: meta.pubDate,
      baseSlug,
      lang: feedLang,
      author: meta.author,
      category: meta.category,
      alternateLanguages: alternates,
    });
  }

  articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  console.log(`  Found ${articles.length} ${feedLang} articles with multi-language alternates`);

  return articles.slice(0, MAX_ITEMS);
}
