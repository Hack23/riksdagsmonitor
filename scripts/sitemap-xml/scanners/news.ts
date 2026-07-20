/**
 * @module Infrastructure/SitemapXml/Scanners/News
 * @category Intelligence Operations / Supporting Infrastructure
 * @name News article scanner — base-slug grouped
 *
 * @description
 * Walks `news/` recursively and groups files by their base slug (without
 * the language suffix) so each article becomes a single `ArticleGroup`
 * with a list of available languages and a unified `lastmod`. The unified
 * `lastmod` is the **maximum** git timestamp across the article's
 * language variants. Sorted alphabetically by base slug for stable XML
 * output.
 *
 * Round-6 split: extracted from `scripts/generate-sitemap.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getFileModTime } from '../git-timestamps.js';
import { getBySubfolder } from '../../render-lib/article-types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NEWS_DIR = path.join(__dirname, '..', '..', '..', 'news');

/** Grouped article descriptor: one entry per base slug across all languages. */
export interface ArticleGroup {
  baseSlug: string;
  languages: string[];
  pages: ArticlePage[];
  lastmod: string;
}

export interface ArticlePage {
  lang: string;
  path: string;
}

/**
 * Get news articles with metadata.
 * Supports date-based subdirectory structure: news/{year}/{month}/article.html
 */
export function getNewsArticles(): ArticleGroup[] {
  console.log('📰 Scanning news directory...');

  if (!fs.existsSync(NEWS_DIR)) {
    console.warn('⚠️ News directory not found');
    return [];
  }

  const articles = new Map<string, ArticleGroup>();

  function scanDir(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.isDirectory()) {
        scanDir(path.join(dir, entry.name));
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        const file = entry.name;
        const relDir = path.relative(NEWS_DIR, dir).split(path.sep).join('/');
        const match = file.match(/^(.+?)-(en|sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/)
          ?? (relDir && file.match(/^index(?:_(en|sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh))?\.html$/)
            ? [file, relDir, file === 'index.html' ? 'en' : file.slice(6, -5)] as RegExpMatchArray
            : null);
        if (match) {
          const baseSlug = match[1]!;
          const lang = match[2]!;
          const filePath = path.join(dir, file);
          const fileModTime = getFileModTime(filePath);

          const fullBaseSlug = relDir ? `${relDir}/${baseSlug}` : baseSlug;
          const pagePath = relDir ? `${relDir}/${file}` : file;

          if (!articles.has(fullBaseSlug)) {
            articles.set(fullBaseSlug, {
              baseSlug: fullBaseSlug,
              languages: [],
              pages: [],
              lastmod: fileModTime,
            });
          } else {
            const article = articles.get(fullBaseSlug)!;
            if (!article.lastmod || new Date(fileModTime) > new Date(article.lastmod)) {
              article.lastmod = fileModTime;
            }
          }

          articles.get(fullBaseSlug)!.languages.push(lang);
          articles.get(fullBaseSlug)!.pages.push({ lang, path: pagePath });
        }
      }
    }
  }

  scanDir(NEWS_DIR);

  console.log(`  Found ${articles.size} news article groups`);

  return Array.from(articles.values()).sort((a, b) => {
    const dateCmp = b.lastmod.localeCompare(a.lastmod);
    if (dateCmp !== 0) return dateCmp;
    const subA = a.baseSlug.match(/\d{4}-\d{2}-\d{2}-(.+)/)?.[1] ?? '';
    const subB = b.baseSlug.match(/\d{4}-\d{2}-\d{2}-(.+)/)?.[1] ?? '';
    const entryA = getBySubfolder(subA);
    const entryB = getBySubfolder(subB);
    const horizonA = entryA?.horizonDays ?? 0;
    const horizonB = entryB?.horizonDays ?? 0;
    return horizonB - horizonA;
  });
}
