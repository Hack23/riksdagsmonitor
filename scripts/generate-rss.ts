/**
 * @module Infrastructure/SEO
 * @category Intelligence Operations / Supporting Infrastructure
 * @name RSS Feed Generation - Multi-Language RSS 2.0 Feed
 *
 * @description
 * Generates an RSS 2.0 feed (rss.xml) for the Riksdagsmonitor political intelligence platform.
 * The feed includes English articles as primary items and multi-language alternates
 * using the hreflang atom:link extension.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 * @version 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { Language } from './types/language.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📡 RSS Feed Generation Script');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = 'https://riksdagsmonitor.com';
const NEWS_DIR = path.join(__dirname, '..', 'news');
const ROOT_DIR = path.join(__dirname, '..');
const RSS_FILE = path.join(ROOT_DIR, 'rss.xml');
const MAX_ITEMS = 50; // Limit RSS to most recent 50 articles

const LANGUAGES: readonly Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RssArticle {
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

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Escape XML special characters.
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Extract metadata from a news article HTML file.
 */
/**
 * Derive a stable publication date from the filename date prefix (YYYY-MM-DD)
 * or fall back to the file's modification time. Never uses "now" so builds are
 * deterministic.
 */
function stablePubDate(filePath: string): string {
  const basename = path.basename(filePath);
  const dateMatch = basename.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    return new Date(`${dateMatch[1]}T12:00:00Z`).toISOString();
  }
  try {
    return fs.statSync(filePath).mtime.toISOString();
  } catch (_e: unknown) {
    return '2026-01-01T12:00:00.000Z';
  }
}

function extractArticleMeta(filePath: string): {
  title: string;
  description: string;
  pubDate: string;
  author: string;
  category: string;
} {
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

/**
 * Get news articles for RSS feed, primarily English with multi-language alternates.
 */
function getRssArticles(): RssArticle[] {
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

/**
 * Generate RSS 2.0 XML feed.
 */
function generateRss(): string {
  console.log('🔨 Generating RSS feed...');

  const articles = getRssArticles();
  const now = new Date().toUTCString();

  // Use most recent article date for lastBuildDate
  const lastBuildDate = articles.length > 0
    ? new Date(articles[0]!.pubDate).toUTCString()
    : now;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Riksdagsmonitor - Swedish Parliament Intelligence</title>
    <link>${BASE_URL}</link>
    <description>Real-time monitoring, analysis, and intelligence from the Swedish Parliament (Riksdag) and Government. Covering legislative activity, voting patterns, coalition dynamics, and election forecasts.</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <pubDate>${lastBuildDate}</pubDate>
    <ttl>60</ttl>
    <copyright>Copyright ${new Date().getFullYear()} Hack23 AB. Licensed under Apache-2.0.</copyright>
    <managingEditor>info@hack23.com (Hack23 AB)</managingEditor>
    <webMaster>info@hack23.com (Hack23 AB)</webMaster>
    <generator>Riksdagsmonitor RSS Generator v1.0</generator>
    <docs>https://www.rssboard.org/rss-specification</docs>
    <image>
      <url>https://hack23.com/cia-icon-140.webp</url>
      <title>Riksdagsmonitor</title>
      <link>${BASE_URL}</link>
      <width>140</width>
      <height>140</height>
      <description>Riksdagsmonitor - Swedish Parliament Intelligence Platform</description>
    </image>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>`;

  // Add category tags for the channel
  const channelCategories = [
    'Swedish Politics', 'Parliament', 'Riksdag', 'Political Intelligence',
    'Election Analysis', 'Legislative Monitoring',
  ];
  for (const cat of channelCategories) {
    xml += `
    <category>${escapeXml(cat)}</category>`;
  }

  // Add items
  for (const article of articles) {
    xml += `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(article.link)}</link>
      <description>${escapeXml(article.description)}</description>
      <pubDate>${new Date(article.pubDate).toUTCString()}</pubDate>
      <guid isPermaLink="true">${escapeXml(article.link)}</guid>
      <dc:creator>${escapeXml(article.author)}</dc:creator>
      <category>${escapeXml(article.category)}</category>
      <atom:link href="${escapeXml(article.link)}" rel="alternate" type="text/html" hreflang="en"/>`;

    // Add multi-language alternate links
    for (const alt of article.alternateLanguages) {
      xml += `
      <atom:link href="${escapeXml(alt.href)}" rel="alternate" type="text/html" hreflang="${alt.lang}"/>`;
    }

    xml += `
    </item>`;
  }

  xml += `
  </channel>
</rss>`;

  return xml;
}

/**
 * Validate RSS XML feed.
 */
function validateRss(xml: string): boolean {
  console.log('✅ Validating RSS feed...');

  if (!xml.includes('<?xml version="1.0"')) {
    throw new Error('Invalid XML declaration');
  }

  if (!xml.includes('<rss version="2.0"')) {
    throw new Error('Missing RSS 2.0 version');
  }

  if (!xml.includes('<channel>')) {
    throw new Error('Missing <channel> element');
  }

  if (!xml.includes('<title>')) {
    throw new Error('Missing <title> element');
  }

  if (!xml.includes('<link>')) {
    throw new Error('Missing <link> element');
  }

  if (!xml.includes('<description>')) {
    throw new Error('Missing <description> element');
  }

  const itemCount = (xml.match(/<item>/g) || []).length;
  console.log(`  Found ${itemCount} items in RSS feed`);

  if (itemCount === 0) {
    throw new Error('No items in RSS feed');
  }

  // Validate all items have required elements
  const titleCount = (xml.match(/<item>[\s\S]*?<title>/g) || []).length;
  const linkCount = (xml.match(/<item>[\s\S]*?<link>/g) || []).length;
  const guidCount = (xml.match(/<guid/g) || []).length;

  if (titleCount !== itemCount) {
    throw new Error(`Not all items have <title> tags (${titleCount}/${itemCount})`);
  }

  if (linkCount !== itemCount) {
    throw new Error(`Not all items have <link> tags (${linkCount}/${itemCount})`);
  }

  if (guidCount !== itemCount) {
    throw new Error(`Not all items have <guid> tags (${guidCount}/${itemCount})`);
  }

  console.log('  ✅ RSS feed validation passed');
  return true;
}

/**
 * Main function.
 */
function main(): number {
  try {
    console.log('🚀 Starting RSS feed generation...\n');

    const rss = generateRss();
    validateRss(rss);

    fs.writeFileSync(RSS_FILE, rss, 'utf8');
    console.log(`\n✅ RSS feed written to: ${RSS_FILE}`);

    const stats = fs.statSync(RSS_FILE);
    console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);

    return 0;
  } catch (error: unknown) {
    console.error('❌ Error generating RSS feed:', (error as Error).message);
    return 1;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = main();
  process.exit(exitCode);
}

export { generateRss, validateRss, getRssArticles, escapeXml };
