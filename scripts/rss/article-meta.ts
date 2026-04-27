/**
 * @module Infrastructure/Rss/ArticleMeta
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Article metadata extractor
 *
 * @description
 * Reads a single news article HTML file and extracts the RSS-relevant
 * fields — title, description, pub date, author, category — by parsing
 * `<title>`, `<meta name="description">`, `<meta property="article:…">`,
 * and `<meta name="author">` tags. Falls back to `stablePubDate` for the
 * pub date, "Riksdagsmonitor" for the author, and "Political Analysis"
 * for the category.
 *
 * Round-6 split: extracted from `scripts/generate-rss.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';

import { stablePubDate } from './pub-date.js';

/** Article-level metadata extracted from the page HTML. */
export interface ArticleMeta {
  title: string;
  description: string;
  pubDate: string;
  author: string;
  category: string;
}

export function extractArticleMeta(filePath: string): ArticleMeta {
  const fallbackDate = stablePubDate(filePath);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
    const descMatch = content.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    const pubDateMatch = content.match(/<meta\s+property="article:published_time"\s+content="([^"]+)"/i);
    const authorMatch = content.match(/<meta\s+name="author"\s+content="([^"]+)"/i);
    const sectionMatch = content.match(/<meta\s+property="article:section"\s+content="([^"]+)"/i);

    return {
      title: titleMatch ? titleMatch[1]!.trim() : path.basename(filePath, '.html'),
      description: descMatch ? descMatch[1]!.trim() : '',
      pubDate: pubDateMatch ? pubDateMatch[1]!.trim() : fallbackDate,
      author: authorMatch ? authorMatch[1]!.trim() : 'Riksdagsmonitor',
      category: sectionMatch ? sectionMatch[1]!.trim() : 'Political Analysis',
    };
  } catch (_error: unknown) {
    return {
      title: path.basename(filePath, '.html'),
      description: '',
      pubDate: fallbackDate,
      author: 'Riksdagsmonitor',
      category: 'Political Analysis',
    };
  }
}
