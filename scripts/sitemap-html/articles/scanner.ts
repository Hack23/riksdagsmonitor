/**
 * @module Infrastructure/SitemapHtml/Articles/Scanner
 * @category Intelligence Operations / Supporting Infrastructure
 * @name News article scanner — recursive, language-grouped
 *
 * @description
 * Walks `news/` recursively, parses metadata from every
 * `<slug>-<lang>.html` file (skipping index pages and metadata folders),
 * and groups results by language. Articles are sorted newest-first by
 * filename date prefix with filename as deterministic tiebreaker.
 *
 * Round-6 split: extracted from `scripts/generate-sitemap-html.ts`.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { Language } from '../../types/language.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NEWS_DIR = path.join(__dirname, '..', '..', '..', 'news');

export interface ArticleInfo {
  file: string;
  title: string;
  description: string;
  lang: Language;
  baseSlug: string;
  /** Extracted publication date (YYYY-MM-DD) parsed from filename prefix, empty string if absent. */
  date: string;
}

/**
 * Extract a leading ISO date (YYYY-MM-DD) from a news article filename.
 * Returns an empty string when the filename does not start with a date,
 * which keeps those articles at the bottom of date-sorted lists.
 */
export function extractArticleDate(fileName: string): string {
  const match = fileName.match(/^(\d{4}-\d{2}-\d{2})-/);
  return match ? match[1]! : '';
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Extract title and description from an HTML file.
 *
 * Per `seo-metadata-contract.md` §3.h, prefers the richest available
 * description: `og:description` → `<meta name="description">` → JSON-LD
 * `description`, picking whichever is longest. The title is preferred
 * from `og:title` (with any trailing ` — Riksdagsmonitor` brand suffix
 * stripped) before falling back to `<title>`.
 */
export function extractArticleMeta(filePath: string): { title: string; description: string } {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const ogTitleMatch = content.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
    const ogDescMatch = content.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
    const descMatch = content.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    const jsonLdDesc = (() => {
      try {
        const m = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
        if (!m) return null;
        const parsed = JSON.parse(m[1]!.trim()) as { description?: string };
        return typeof parsed.description === 'string' && parsed.description.trim().length > 0
          ? parsed.description.trim()
          : null;
      } catch {
        return null;
      }
    })();

    const candidates = [ogDescMatch?.[1]?.trim(), descMatch?.[1]?.trim(), jsonLdDesc]
      .filter((s): s is string => !!s && s.length > 0)
      .sort((a, b) => b.length - a.length);
    const description = candidates[0] ?? '';

    const rawTitle = (ogTitleMatch?.[1] ?? titleMatch?.[1] ?? '').trim();
    const title = rawTitle.replace(/\s*[—\-|]\s*Riksdagsmonitor\s*$/i, '').trim();

    return {
      title: title.length > 0 ? title : path.basename(filePath, '.html'),
      description,
    };
  } catch (_error: unknown) {
    return { title: path.basename(filePath, '.html'), description: '' };
  }
}

/**
 * Scan news articles and group by language.
 *
 * Articles are sorted by their filename date prefix (YYYY-MM-DD) in descending
 * order so the most recent articles appear first on the sitemap. The news
 * directory is walked recursively so articles under date-partitioned
 * subdirectories (e.g. `news/2026/02/2026-02-13-article-en.html`) are
 * also included.
 */
export function getArticlesByLanguage(): Map<Language, ArticleInfo[]> {
  const articlesByLang = new Map<Language, ArticleInfo[]>();

  if (!fs.existsSync(NEWS_DIR)) return articlesByLang;

  function scanDir(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip lock/metadata directories that don't contain articles.
        if (entry.name === 'metadata' || entry.name.startsWith('.')) continue;
        scanDir(fullPath);
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.html') &&
        entry.name !== 'index.html' &&
        !entry.name.startsWith('index_')
      ) {
        const match = entry.name.match(/^(.+?)-(en|sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/);
        if (!match) continue;

        const baseSlug = match[1]!;
        const lang = match[2]! as Language;
        const meta = extractArticleMeta(fullPath);

        // Preserve subdirectory prefix (relative to NEWS_DIR) in the
        // emitted href so links like `news/2026/02/…` keep working.
        const relDir = path.relative(NEWS_DIR, dir).split(path.sep).join('/');
        const hrefFile = relDir ? `${relDir}/${entry.name}` : entry.name;

        if (!articlesByLang.has(lang)) {
          articlesByLang.set(lang, []);
        }
        articlesByLang.get(lang)!.push({
          file: hrefFile,
          title: meta.title,
          description: meta.description,
          lang,
          baseSlug,
          date: extractArticleDate(entry.name),
        });
      }
    }
  }

  scanDir(NEWS_DIR);

  // Sort each language's articles by publication date (desc), then by
  // filename (desc) as a deterministic tiebreaker when dates match or are
  // missing. This guarantees "newest articles on top" regardless of slug
  // alphabetisation.
  for (const [, list] of articlesByLang) {
    list.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.file.localeCompare(a.file);
    });
  }

  return articlesByLang;
}
