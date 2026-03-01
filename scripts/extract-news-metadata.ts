/**
 * Extract News Article Metadata to JSON Database
 *
 * Parses all news article HTML files and extracts Schema.org JSON-LD
 * metadata into a single data/news-articles.json file.
 *
 * Usage: node --experimental-strip-types scripts/extract-news-metadata.ts
 *
 * @module scripts/extract-news-metadata
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname, relative, sep } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

interface ArticleMetadata {
  slug: string;
  file: string;
  lang: string;
  headline: string;
  description: string;
  datePublished: string;
  dateModified: string;
  articleSection: string;
  wordCount: number;
  inLanguage: string;
  keywords: string;
  image: string;
  url: string;
}

interface NewsDatabase {
  version: string;
  generatedAt: string;
  totalArticles: number;
  uniqueSlugs: number;
  languages: string[];
  articles: ArticleMetadata[];
}

interface JsonLdArticle {
  '@type'?: string;
  headline?: string;
  description?: string;
  datePublished?: string;
  dateModified?: string;
  articleSection?: string;
  wordCount?: number;
  inLanguage?: string;
  keywords?: string;
  mainEntityOfPage?: { '@id'?: string };
  url?: string;
}

function collectNewsFiles(dir: string): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      result.push(...collectNewsFiles(join(dir, entry.name)));
    } else if (entry.name.endsWith('.html') && !entry.name.startsWith('index')) {
      result.push(join(dir, entry.name));
    }
  }
  return result;
}

function extractMetadata(): void {
  const newsDir = join(ROOT, 'news');
  const allFilePaths = collectNewsFiles(newsDir);
  const files = allFilePaths.map((fp) => relative(newsDir, fp).split(sep).join('/'));

  const articles: ArticleMetadata[] = [];

  for (const file of files) {
    const content = readFileSync(join(newsDir, file), 'utf-8');

    // Extract JSON-LD blocks
    const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
    let match: RegExpExecArray | null;
    let articleData: JsonLdArticle | null = null;

    while ((match = jsonLdRegex.exec(content)) !== null) {
      try {
        const parsed = JSON.parse(match[1]!) as JsonLdArticle;
        if (parsed['@type'] === 'NewsArticle') {
          articleData = parsed;
          break;
        }
      } catch {
        // Skip malformed JSON-LD
      }
    }

    if (!articleData) {
      console.warn(`WARN: No NewsArticle JSON-LD in ${file}`);
      continue;
    }

    // Extract Open Graph image
    const ogImageMatch = content.match(/property="og:image" content="([^"]+)"/);
    const ogImage: string = ogImageMatch?.[1] ?? '';

    // Extract language from filename
    const langMatch = file.match(/-([a-z]{2})\.html$/);
    const lang: string = langMatch?.[1] ?? 'en';

    // Extract slug (filename without language suffix)
    const slug = file.replace(/-[a-z]{2}\.html$/, '');

    articles.push({
      slug,
      file,
      lang,
      headline: articleData.headline ?? '',
      description: articleData.description ?? '',
      datePublished: articleData.datePublished ?? '',
      dateModified: articleData.dateModified ?? '',
      articleSection: articleData.articleSection ?? '',
      wordCount: articleData.wordCount || (() => {
        const stripped = content.replace(/<[^>]+>/g, ' ');
        return stripped.split(/\s+/).filter((w: string) => w.length > 0).length;
      })(),
      inLanguage: articleData.inLanguage ?? lang as string,
      keywords: articleData.keywords ?? '',
      image: ogImage as string,
      url: articleData.mainEntityOfPage?.['@id'] ?? '',
    });
  }

  // Sort by date descending, then by language
  articles.sort((a, b) => {
    const dateCompare = b.datePublished.localeCompare(a.datePublished);
    if (dateCompare !== 0) return dateCompare;
    return a.lang.localeCompare(b.lang);
  });

  const db: NewsDatabase = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalArticles: articles.length,
    uniqueSlugs: [...new Set(articles.map((a) => a.slug))].length,
    languages: [...new Set(articles.map((a) => a.lang))].sort(),
    articles,
  };

  mkdirSync(join(ROOT, 'data'), { recursive: true });
  writeFileSync(join(ROOT, 'data', 'news-articles.json'), JSON.stringify(db, null, 2));

  console.log('Generated data/news-articles.json:');
  console.log('  Total articles:', db.totalArticles);
  console.log('  Unique slugs:', db.uniqueSlugs);
  console.log('  Languages:', db.languages.join(', '));
  console.log('  File size:', (JSON.stringify(db).length / 1024).toFixed(1), 'KB');
}

extractMetadata();
