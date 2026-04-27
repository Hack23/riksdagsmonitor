/**
 * @module Infrastructure/Rss/Scanner
 * @category Intelligence Operations / Supporting Infrastructure
 * @name News article scanner — English-primary with hreflang alternates
 *
 * @description
 * Scans `news/` (top level only — does **not** recurse into date-partitioned
 * subdirectories, matching legacy behaviour), groups files by base slug,
 * keeps only those that have an English variant, builds the alternate-
 * language map for hreflang link tags, sorts by pub date descending, and
 * caps at `MAX_ITEMS` (50). Returns the list ready to be rendered into
 * RSS `<item>` blocks.
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
 * Get news articles for RSS feed, primarily English with multi-language alternates.
 */
export function getRssArticles(): RssArticle[] {
  console.log('📰 Scanning news directory for RSS articles...');

  if (!fs.existsSync(NEWS_DIR)) {
    console.warn('⚠️ News directory not found');
    return [];
  }

  const files = fs
    .readdirSync(NEWS_DIR)
    .filter((file) => file.endsWith('.html') && file !== 'index.html' && !file.startsWith('index_'));

  // Group files by base slug
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

  // Build RSS articles from English entries (with multi-language alternates)
  const articles: RssArticle[] = [];

  for (const [baseSlug, langMap] of articleGroups) {
    // Primary: use English if available, otherwise skip this group for RSS
    const enFile = langMap.get('en');
    if (!enFile) continue;

    const filePath = path.join(NEWS_DIR, enFile);
    const meta = extractArticleMeta(filePath);

    const alternates: Array<{ lang: Language; href: string }> = [];
    for (const [lang, altFile] of langMap) {
      if (lang !== 'en') {
        alternates.push({
          lang,
          href: `${BASE_URL}/news/${altFile}`,
        });
      }
    }

    articles.push({
      file: enFile,
      title: meta.title,
      description: meta.description,
      link: `${BASE_URL}/news/${enFile}`,
      pubDate: meta.pubDate,
      baseSlug,
      lang: 'en',
      author: meta.author,
      category: meta.category,
      alternateLanguages: alternates,
    });
  }

  // Sort by publication date descending (most recent first)
  articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  console.log(`  Found ${articles.length} English articles with multi-language alternates`);

  return articles.slice(0, MAX_ITEMS);
}
