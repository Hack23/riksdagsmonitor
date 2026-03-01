/**
 * @module Infrastructure/SEO
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Sitemap Generation - Multi-Language SEO Infrastructure
 *
 * @description
 * Automated XML sitemap generation system producing search engine-optimized sitemaps
 * for all 14 language variants of the Riksdagsmonitor political intelligence platform.
 *
 * @author Hack23 AB (Infrastructure Team)
 * @license Apache-2.0
 * @version 2.1.0
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import type { Language } from './types/language.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🗺️ Sitemap Generation Script');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = 'https://riksdagsmonitor.com';
const NEWS_DIR = path.join(__dirname, '..', 'news');
const API_DIR = path.join(__dirname, '..', 'api');
const ROOT_DIR = path.join(__dirname, '..');
const SITEMAP_FILE = path.join(ROOT_DIR, 'sitemap.xml');

// Language codes
const LANGUAGES: readonly Language[] = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ArticleGroup {
  baseSlug: string;
  languages: string[];
  lastmod: string;
}

interface ApiDoc {
  file: string;
  path: string;
  lastmod: string;
}

interface HreflangAlternate {
  lang: string;
  href: string;
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Cache of git commit timestamps keyed by relative file path.
 * Populated once via loadGitTimestamps() to avoid per-file git calls.
 */
const gitTimestampCache = new Map<string, string>();
let gitTimestampsLoaded = false;

/**
 * Preload git commit timestamps for all tracked files in a single git call.
 * Parses `git log --name-only` output to map each file to its most recent commit timestamp.
 */
function loadGitTimestamps(): void {
  if (gitTimestampsLoaded) return;
  gitTimestampsLoaded = true;
  try {
    const output = execSync('git log --format="COMMIT %cI" --name-only --diff-filter=ACMR', {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024,
    });
    let currentTimestamp = '';
    for (const line of output.split('\n')) {
      if (line.startsWith('COMMIT ')) {
        currentTimestamp = new Date(line.substring(7)).toISOString();
      } else if (line.trim() && currentTimestamp) {
        // Only keep the first (most recent) timestamp per file
        if (!gitTimestampCache.has(line)) {
          gitTimestampCache.set(line, currentTimestamp);
        }
      }
    }
  } catch (_error: unknown) {
    // git not available — getFileModTime will fall back to fs.statSync
    console.warn('⚠️ Git timestamps unavailable — falling back to filesystem mtime');
  }
}

/**
 * Get file modification time from git history for deterministic timestamps.
 * Falls back to filesystem mtime only when git history is unavailable.
 */
function getFileModTime(filePath: string): string {
  loadGitTimestamps();
  const relativePath = path.relative(ROOT_DIR, filePath).split(path.sep).join('/');
  const cached = gitTimestampCache.get(relativePath);
  if (cached) return cached;
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString();
  } catch (_error: unknown) {
    return new Date().toISOString();
  }
}

/**
 * Get news articles with metadata.
 * Supports date-based subdirectory structure: news/{year}/{month}/article.html
 */
function getNewsArticles(): ArticleGroup[] {
  console.log('📰 Scanning news directory...');

  if (!fs.existsSync(NEWS_DIR)) {
    console.warn('⚠️ News directory not found');
    return [];
  }

  // Group articles by base slug (without language suffix)
  const articles = new Map<string, ArticleGroup>();

  function scanDir(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        scanDir(path.join(dir, entry.name));
      } else if (entry.isFile() && entry.name !== 'index.html' && !entry.name.startsWith('index_') && entry.name.endsWith('.html')) {
        const file = entry.name;
        const match = file.match(/^(.+?)-(en|sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/);
        if (match) {
          const baseSlug = match[1]!;
          const lang = match[2]!;
          const filePath = path.join(dir, file);
          const fileModTime = getFileModTime(filePath);

          // Include subdirectory prefix in baseSlug (e.g., "2026/02/2026-02-13-article")
          const relDir = path.relative(NEWS_DIR, dir).split(path.sep).join('/');
          const fullBaseSlug = relDir ? `${relDir}/${baseSlug}` : baseSlug;

          if (!articles.has(fullBaseSlug)) {
            articles.set(fullBaseSlug, {
              baseSlug: fullBaseSlug,
              languages: [],
              lastmod: fileModTime,
            });
          } else {
            const article = articles.get(fullBaseSlug)!;
            if (!article.lastmod || new Date(fileModTime) > new Date(article.lastmod)) {
              article.lastmod = fileModTime;
            }
          }

          articles.get(fullBaseSlug)!.languages.push(lang);
        }
      }
    }
  }

  scanDir(NEWS_DIR);

  console.log(`  Found ${articles.size} news articles`);

  return Array.from(articles.values());
}

/**
 * Get API documentation files (supports TypeDoc nested directory structure).
 */
function getApiDocs(): ApiDoc[] {
  console.log('📚 Scanning API documentation directory...');

  if (!fs.existsSync(API_DIR)) {
    console.warn('⚠️ API directory not found');
    return [];
  }

  const results: ApiDoc[] = [];

  function scanDir(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'assets') {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        const relativePath = path.relative(API_DIR, fullPath).replace(/\\/g, '/');
        results.push({
          file: relativePath,
          path: fullPath,
          lastmod: getFileModTime(fullPath),
        });
      }
    }
  }

  scanDir(API_DIR);

  console.log(`  Found ${results.length} API documentation files`);

  return results;
}

/**
 * Generate XML for a URL entry.
 */
function generateUrlEntry(
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: string,
  alternates: HreflangAlternate[] = [],
): string {
  let xml = `
<url>
  <loc>${BASE_URL}/${loc}</loc>
  <lastmod>${lastmod}</lastmod>
  <changefreq>${changefreq}</changefreq>
  <priority>${priority}</priority>`;

  alternates.forEach((alt) => {
    xml += `
  <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${BASE_URL}/${alt.href}"/>`;
  });

  xml += `
</url>`;

  return xml;
}

/**
 * Generate sitemap XML.
 */
function generateSitemap(): string {
  console.log('🔨 Generating sitemap...');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

  // Main index page with all language alternates
  const indexAlternates: HreflangAlternate[] = LANGUAGES.map((lang) => ({
    lang,
    href: lang === 'en' ? 'index.html' : `index_${lang}.html`,
  }));

  const indexMtime = getFileModTime(path.join(ROOT_DIR, 'index.html'));
  xml += generateUrlEntry('index.html', indexMtime, 'daily', '1.0', indexAlternates);

  // Individual language index pages (excluding English)
  LANGUAGES.filter((lang) => lang !== 'en').forEach((lang) => {
    const loc = `index_${lang}.html`;
    const lastmod = getFileModTime(path.join(ROOT_DIR, loc));
    const priority = lang === 'sv' ? '0.9' : '0.7';

    xml += generateUrlEntry(loc, lastmod, 'daily', priority);
  });

  // Politician dashboard page
  const politicianDashboardMtime = getFileModTime(path.join(ROOT_DIR, 'politician-dashboard.html'));
  xml += generateUrlEntry('politician-dashboard.html', politicianDashboardMtime, 'weekly', '0.8');

  // Dashboard pages with all language alternates (only for existing files)
  const dashboardAlternates: HreflangAlternate[] = LANGUAGES.map((lang) => ({
    lang,
    href: lang === 'en' ? 'dashboard/index.html' : `dashboard/index_${lang}.html`,
  })).filter((alt) => fs.existsSync(path.join(ROOT_DIR, alt.href)));

  const dashboardEnMtime = getFileModTime(path.join(ROOT_DIR, 'dashboard', 'index.html'));
  xml += generateUrlEntry('dashboard/index.html', dashboardEnMtime, 'weekly', '0.8', dashboardAlternates);

  // All other language dashboard pages
  LANGUAGES.filter((lang) => lang !== 'en').forEach((lang) => {
    const loc = `dashboard/index_${lang}.html`;
    const dashboardPath = path.join(ROOT_DIR, 'dashboard', `index_${lang}.html`);
    if (fs.existsSync(dashboardPath)) {
      const lastmod = getFileModTime(dashboardPath);
      const priority = lang === 'sv' ? '0.8' : '0.7';
      xml += generateUrlEntry(loc, lastmod, 'weekly', priority);
    }
  });

  // Sitemap HTML pages with language alternates
  const sitemapAlternates: HreflangAlternate[] = [
    { lang: 'en', href: 'sitemap.html' },
    { lang: 'sv', href: 'sitemap_sv.html' },
    { lang: 'da', href: 'sitemap_da.html' },
    { lang: 'no', href: 'sitemap_no.html' },
    { lang: 'fi', href: 'sitemap_fi.html' },
    { lang: 'de', href: 'sitemap_de.html' },
    { lang: 'fr', href: 'sitemap_fr.html' },
    { lang: 'es', href: 'sitemap_es.html' },
    { lang: 'nl', href: 'sitemap_nl.html' },
    { lang: 'ar', href: 'sitemap_ar.html' },
    { lang: 'he', href: 'sitemap_he.html' },
    { lang: 'ja', href: 'sitemap_ja.html' },
    { lang: 'ko', href: 'sitemap_ko.html' },
    { lang: 'zh', href: 'sitemap_zh.html' },
    { lang: 'x-default', href: 'sitemap.html' },
  ];

  const sitemapEnMtime = getFileModTime(path.join(ROOT_DIR, 'sitemap.html'));
  xml += generateUrlEntry('sitemap.html', sitemapEnMtime, 'monthly', '0.6', sitemapAlternates);

  // Individual sitemap language pages (excluding English)
  const sitemapLangPages: Array<{ file: string; priority: string }> = [
    { file: 'sitemap_sv.html', priority: '0.5' },
    { file: 'sitemap_da.html', priority: '0.4' },
    { file: 'sitemap_no.html', priority: '0.4' },
    { file: 'sitemap_fi.html', priority: '0.4' },
    { file: 'sitemap_de.html', priority: '0.4' },
    { file: 'sitemap_fr.html', priority: '0.4' },
    { file: 'sitemap_es.html', priority: '0.4' },
    { file: 'sitemap_nl.html', priority: '0.4' },
    { file: 'sitemap_ar.html', priority: '0.4' },
    { file: 'sitemap_he.html', priority: '0.4' },
    { file: 'sitemap_ja.html', priority: '0.4' },
    { file: 'sitemap_ko.html', priority: '0.4' },
    { file: 'sitemap_zh.html', priority: '0.4' },
  ];

  sitemapLangPages.forEach(({ file, priority }) => {
    const lastmod = getFileModTime(path.join(ROOT_DIR, file));
    xml += generateUrlEntry(file, lastmod, 'monthly', priority);
  });

  // News index pages
  const newsLangFiles = [
    'index.html', 'index_sv.html', 'index_da.html', 'index_no.html', 'index_fi.html',
    'index_de.html', 'index_fr.html', 'index_es.html', 'index_nl.html', 'index_ar.html', 'index_he.html',
  ];
  const newsIndexMtimes = newsLangFiles.map((file) => {
    try {
      return new Date(getFileModTime(path.join(NEWS_DIR, file)));
    } catch (_e: unknown) {
      return new Date(0);
    }
  });
  const newsIndexMaxMtime = new Date(Math.max(...newsIndexMtimes.map((d) => d.getTime()))).toISOString();

  // Build alternates for news index pages that actually exist
  const newsIndexAlternates: HreflangAlternate[] = [
    { lang: 'en', href: 'news/' },
    { lang: 'sv', href: 'news/index_sv.html' },
    { lang: 'da', href: 'news/index_da.html' },
    { lang: 'no', href: 'news/index_no.html' },
    { lang: 'fi', href: 'news/index_fi.html' },
    { lang: 'de', href: 'news/index_de.html' },
    { lang: 'fr', href: 'news/index_fr.html' },
    { lang: 'es', href: 'news/index_es.html' },
    { lang: 'nl', href: 'news/index_nl.html' },
    { lang: 'ar', href: 'news/index_ar.html' },
    { lang: 'he', href: 'news/index_he.html' },
    { lang: 'x-default', href: 'news/' },
  ];

  xml += generateUrlEntry('news/', newsIndexMaxMtime, 'daily', '0.9', newsIndexAlternates);

  // Add individual entries for each news language page (excluding EN)
  const newsLanguagePages: Array<{ file: string; priority: string }> = [
    { file: 'index_sv.html', priority: '0.9' },
    { file: 'index_da.html', priority: '0.7' },
    { file: 'index_no.html', priority: '0.7' },
    { file: 'index_fi.html', priority: '0.7' },
    { file: 'index_de.html', priority: '0.7' },
    { file: 'index_fr.html', priority: '0.7' },
    { file: 'index_es.html', priority: '0.7' },
    { file: 'index_nl.html', priority: '0.7' },
    { file: 'index_ar.html', priority: '0.7' },
    { file: 'index_he.html', priority: '0.7' },
  ];

  newsLanguagePages.forEach(({ file, priority }) => {
    try {
      const lastmod = getFileModTime(path.join(NEWS_DIR, file));
      xml += generateUrlEntry(`news/${file}`, lastmod, 'daily', priority);
    } catch (_e: unknown) {
      // File doesn't exist yet, skip
    }
  });

  // News articles
  const articles = getNewsArticles();
  console.log(`  Processing ${articles.length} article groups...`);

  articles.forEach((article) => {
    const sortedLanguages = [...article.languages].sort((a, b) => {
      if (a === 'en') return -1;
      if (b === 'en') return 1;
      return a.localeCompare(b);
    });

    const alternates: HreflangAlternate[] = sortedLanguages.map((altLang) => ({
      lang: altLang,
      href: `news/${article.baseSlug}-${altLang}.html`,
    }));

    alternates.push({
      lang: 'x-default',
      href: `news/${article.baseSlug}-${sortedLanguages[0]}.html`,
    });

    sortedLanguages.forEach((lang) => {
      const loc = `news/${article.baseSlug}-${lang}.html`;
      xml += generateUrlEntry(loc, article.lastmod, 'monthly', '0.8', alternates);
    });
  });

  // API Documentation (TypeDoc generated)
  const apiDocs = getApiDocs();
  if (apiDocs.length > 0) {
    console.log(`  Processing ${apiDocs.length} API documentation files...`);

    apiDocs.forEach((doc) => {
      const loc = `api/${doc.file}`;
      const priority = doc.file === 'index.html' ? '0.7' : '0.5';
      xml += generateUrlEntry(loc, doc.lastmod, 'weekly', priority);
    });
  }

  xml += `
  
</urlset>`;

  return xml;
}

/**
 * Validate sitemap XML.
 */
function validateSitemap(xml: string): boolean {
  console.log('✅ Validating sitemap...');

  if (!xml.includes('<?xml version="1.0"')) {
    throw new Error('Invalid XML declaration');
  }

  if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
    throw new Error('Invalid sitemap namespace');
  }

  const urlCount = (xml.match(/<url>/g) || []).length;
  console.log(`  Found ${urlCount} URLs in sitemap`);

  if (urlCount === 0) {
    throw new Error('No URLs in sitemap');
  }

  if (!xml.includes('<loc>')) {
    throw new Error('Missing <loc> tags');
  }

  console.log('  ✅ Sitemap validation passed');
  return true;
}

/**
 * Main function.
 */
function main(): number {
  try {
    console.log('🚀 Starting sitemap generation...\n');

    const sitemap = generateSitemap();

    validateSitemap(sitemap);

    fs.writeFileSync(SITEMAP_FILE, sitemap, 'utf8');
    console.log(`\n✅ Sitemap written to: ${SITEMAP_FILE}`);

    const stats = fs.statSync(SITEMAP_FILE);
    console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);

    return 0;
  } catch (error: unknown) {
    console.error('❌ Error generating sitemap:', (error as Error).message);
    return 1;
  }
}

// Run if called directly
const exitCode = main();
process.exit(exitCode);

export { generateSitemap, validateSitemap };
