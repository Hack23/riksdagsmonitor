/**
 * @module generate-news-indexes/helpers/path-utils
 * @description Filesystem helpers for the news directory — root resolution
 * and recursive article-HTML collection.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { NewsArticleMetadata } from '../types.js';
import { LANGUAGES } from '../constants.js';
import { parseArticleMetadata } from './frontmatter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Root news directory */
export const NEWS_DIR: string = path.join(__dirname, '..', '..', '..', 'news');

/**
 * Collect all article HTML file paths recursively from a directory.
 * Supports date-based subdirectory structure: news/{year}/{month}/article.html
 */
function collectArticleFiles(dir: string): string[] {
  const result: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      result.push(...collectArticleFiles(path.join(dir, entry.name)));
    } else if (entry.isFile() && entry.name.endsWith('.html') && !entry.name.startsWith('index')) {
      result.push(path.join(dir, entry.name));
    }
  }
  return result;
}

/**
 * Scan news directory and group articles by language.
 * Supports date-based subdirectory structure: news/{year}/{month}/article.html
 */
export function scanNewsArticles(): Record<string, NewsArticleMetadata[]> {
  console.log('\n📰 Scanning for articles...');

  const filePaths: string[] = collectArticleFiles(NEWS_DIR);

  console.log(`  Found ${filePaths.length} article files`);

  const articlesByLang: Record<string, NewsArticleMetadata[]> = Object.fromEntries(
    Object.keys(LANGUAGES).map((lang) => [lang, []]),
  );

  filePaths.forEach((filePath) => {
    const metadata: NewsArticleMetadata | null = parseArticleMetadata(filePath);

    if (metadata) {
      metadata.slug = path.relative(NEWS_DIR, filePath).split(path.sep).join('/');

      if (articlesByLang[metadata.lang]) {
        articlesByLang[metadata.lang]!.push(metadata);
      }
    }
  });

  Object.keys(articlesByLang).forEach((lang) => {
    articlesByLang[lang]?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  const langCounts: string[] = Object.entries(articlesByLang)
    .filter(([, arr]) => arr.length > 0)
    .map(([lang, arr]) => `${lang.toUpperCase()} ${arr.length}`);
  console.log(`  📊 Articles by language: ${langCounts.length > 0 ? langCounts.join(', ') : 'none found'}`);

  return articlesByLang;
}
