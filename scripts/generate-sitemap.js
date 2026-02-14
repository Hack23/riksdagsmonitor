#!/usr/bin/env node

/**
 * Sitemap Generation Script
 * 
 * Automatically generates sitemap.xml from news articles and index pages
 * Includes proper hreflang tags and multi-language support
 * 
 * Usage: node generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🗺️ Sitemap Generation Script');

// Configuration
const BASE_URL = 'https://riksdagsmonitor.com';
const NEWS_DIR = path.join(__dirname, '..', 'news');
const ROOT_DIR = path.join(__dirname, '..');
const SITEMAP_FILE = path.join(ROOT_DIR, 'sitemap.xml');

// Language codes
const LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

/**
 * Get news articles with metadata
 */
function getNewsArticles() {
  console.log('📰 Scanning news directory...');
  
  if (!fs.existsSync(NEWS_DIR)) {
    console.warn('⚠️ News directory not found');
    return [];
  }
  
  const files = fs.readdirSync(NEWS_DIR)
    .filter(file => file.endsWith('.html') && file !== 'index.html' && !file.startsWith('index_'));
  
  console.log(`  Found ${files.length} news articles`);
  
  // Group articles by base slug (without language suffix)
  const articles = new Map();
  
  files.forEach(file => {
    // Extract base slug and language
    const match = file.match(/^(.+?)-(en|sv)\.html$/);
    if (match) {
      const [, baseSlug, lang] = match;
      const filePath = path.join(NEWS_DIR, file);
      const fileModTime = getFileModTime(filePath);
      
      if (!articles.has(baseSlug)) {
        articles.set(baseSlug, {
          baseSlug,
          languages: [],
          lastmod: fileModTime
        });
      } else {
        const article = articles.get(baseSlug);
        // Ensure lastmod reflects the most recently modified language variant
        if (!article.lastmod || new Date(fileModTime) > new Date(article.lastmod)) {
          article.lastmod = fileModTime;
        }
      }
      
      articles.get(baseSlug).languages.push(lang);
    }
  });
  
  return Array.from(articles.values());
}

/**
 * Get file modification time
 */
function getFileModTime(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

/**
 * Generate XML for a URL entry
 */
function generateUrlEntry(loc, lastmod, changefreq, priority, alternates = []) {
  let xml = `
<url>
  <loc>${BASE_URL}/${loc}</loc>
  <lastmod>${lastmod}</lastmod>
  <changefreq>${changefreq}</changefreq>
  <priority>${priority}</priority>`;
  
  // Add hreflang alternates
  alternates.forEach(alt => {
    xml += `
  <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${BASE_URL}/${alt.href}"/>`;
  });
  
  xml += `
</url>`;
  
  return xml;
}

/**
 * Generate sitemap XML
 */
function generateSitemap() {
  console.log('🔨 Generating sitemap...');
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;
  
  // Main index page with all language alternates (canonical is index.html based on <link rel="canonical">)
  const indexAlternates = LANGUAGES.map(lang => ({
    lang,
    href: lang === 'en' ? 'index.html' : `index_${lang}.html`
  }));
  
  // Use actual file mtime for main index
  const indexMtime = getFileModTime(path.join(ROOT_DIR, 'index.html'));
  xml += generateUrlEntry('index.html', indexMtime, 'daily', '1.0', indexAlternates);
  
  // Individual language index pages (excluding English since it's the canonical above)
  LANGUAGES.filter(lang => lang !== 'en').forEach(lang => {
    const loc = `index_${lang}.html`;
    const lastmod = getFileModTime(path.join(ROOT_DIR, loc));
    const priority = lang === 'sv' ? '0.9' : '0.7';
    
    xml += generateUrlEntry(loc, lastmod, 'daily', priority);
  });
  
  // Politician dashboard page
  const politicianDashboardMtime = getFileModTime(path.join(ROOT_DIR, 'politician-dashboard.html'));
  xml += generateUrlEntry('politician-dashboard.html', politicianDashboardMtime, 'weekly', '0.8');
  
  // Dashboard pages with language alternates
  const dashboardAlternates = [
    { lang: 'en', href: 'dashboard/index.html' },
    { lang: 'sv', href: 'dashboard/index_sv.html' }
  ];
  
  const dashboardEnMtime = getFileModTime(path.join(ROOT_DIR, 'dashboard', 'index.html'));
  xml += generateUrlEntry('dashboard/index.html', dashboardEnMtime, 'weekly', '0.8', dashboardAlternates);
  
  const dashboardSvMtime = getFileModTime(path.join(ROOT_DIR, 'dashboard', 'index_sv.html'));
  xml += generateUrlEntry('dashboard/index_sv.html', dashboardSvMtime, 'weekly', '0.8');
  
  // Sitemap HTML pages with language alternates
  const sitemapAlternates = [
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
    { lang: 'x-default', href: 'sitemap.html' }
  ];
  
  const sitemapEnMtime = getFileModTime(path.join(ROOT_DIR, 'sitemap.html'));
  xml += generateUrlEntry('sitemap.html', sitemapEnMtime, 'monthly', '0.6', sitemapAlternates);
  
  // Individual sitemap language pages (excluding English)
  const sitemapLangPages = [
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
    { file: 'sitemap_zh.html', priority: '0.4' }
  ];
  
  sitemapLangPages.forEach(({ file, priority }) => {
    const lastmod = getFileModTime(path.join(ROOT_DIR, file));
    xml += generateUrlEntry(file, lastmod, 'monthly', priority);
  });
  
  // News index pages (canonical is news/ for English, based on <link rel="canonical">)
  // Calculate lastmod using all news language files
  const newsLangFiles = ['index.html', 'index_sv.html', 'index_da.html', 'index_no.html', 'index_fi.html', 'index_de.html', 'index_fr.html', 'index_es.html', 'index_nl.html', 'index_ar.html', 'index_he.html'];
  const newsIndexMtimes = newsLangFiles.map(file => {
    try {
      return new Date(getFileModTime(path.join(NEWS_DIR, file)));
    } catch (e) {
      return new Date(0); // File doesn't exist yet
    }
  });
  const newsIndexMaxMtime = new Date(Math.max(...newsIndexMtimes)).toISOString();
  
  // Build alternates for news index pages that actually exist
  const newsIndexAlternates = [
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
    { lang: 'x-default', href: 'news/' }
  ];
  
  xml += generateUrlEntry('news/', newsIndexMaxMtime, 'daily', '0.9', newsIndexAlternates);
  
  // Add individual entries for each news language page (excluding EN which is canonical news/)
  const newsLanguagePages = [
    { file: 'index_sv.html', priority: '0.9' },
    { file: 'index_da.html', priority: '0.7' },
    { file: 'index_no.html', priority: '0.7' },
    { file: 'index_fi.html', priority: '0.7' },
    { file: 'index_de.html', priority: '0.7' },
    { file: 'index_fr.html', priority: '0.7' },
    { file: 'index_es.html', priority: '0.7' },
    { file: 'index_nl.html', priority: '0.7' },
    { file: 'index_ar.html', priority: '0.7' },
    { file: 'index_he.html', priority: '0.7' }
  ];
  
  newsLanguagePages.forEach(({ file, priority }) => {
    try {
      const lastmod = getFileModTime(path.join(NEWS_DIR, file));
      xml += generateUrlEntry(`news/${file}`, lastmod, 'daily', priority);
    } catch (e) {
      // File doesn't exist yet, skip
    }
  });
  
  // News articles
  const articles = getNewsArticles();
  console.log(`  Processing ${articles.length} article groups...`);
  
  articles.forEach(article => {
    // Sort languages to ensure 'en' is first for stable x-default
    const sortedLanguages = [...article.languages].sort((a, b) => {
      if (a === 'en') return -1;
      if (b === 'en') return 1;
      return a.localeCompare(b);
    });
    
    // Build alternates list once for all language entries
    const alternates = sortedLanguages.map(altLang => ({
      lang: altLang,
      href: `news/${article.baseSlug}-${altLang}.html`
    }));
    
    // Add x-default pointing to English if available, otherwise first sorted language
    alternates.push({
      lang: 'x-default',
      href: `news/${article.baseSlug}-${sortedLanguages[0]}.html`
    });
    
    sortedLanguages.forEach(lang => {
      const loc = `news/${article.baseSlug}-${lang}.html`;
      xml += generateUrlEntry(loc, article.lastmod, 'monthly', '0.8', alternates);
    });
  });
  
  xml += `
  
</urlset>`;
  
  return xml;
}

/**
 * Validate sitemap XML
 */
function validateSitemap(xml) {
  console.log('✅ Validating sitemap...');
  
  // Basic validation
  if (!xml.includes('<?xml version="1.0"')) {
    throw new Error('Invalid XML declaration');
  }
  
  if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
    throw new Error('Invalid sitemap namespace');
  }
  
  // Count URLs
  const urlCount = (xml.match(/<url>/g) || []).length;
  console.log(`  Found ${urlCount} URLs in sitemap`);
  
  if (urlCount === 0) {
    throw new Error('No URLs in sitemap');
  }
  
  // Check for required tags
  if (!xml.includes('<loc>')) {
    throw new Error('Missing <loc> tags');
  }
  
  console.log('  ✅ Sitemap validation passed');
  return true;
}

/**
 * Main function
 */
function main() {
  try {
    console.log('🚀 Starting sitemap generation...\n');
    
    // Generate sitemap
    const sitemap = generateSitemap();
    
    // Validate
    validateSitemap(sitemap);
    
    // Write to file
    fs.writeFileSync(SITEMAP_FILE, sitemap, 'utf8');
    console.log(`\n✅ Sitemap written to: ${SITEMAP_FILE}`);
    
    // Show file size
    const stats = fs.statSync(SITEMAP_FILE);
    console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    return 0;
  } catch (error) {
    console.error('❌ Error generating sitemap:', error.message);
    return 1;
  }
}

// Run if called directly
const exitCode = main();
process.exit(exitCode);

export { generateSitemap, validateSitemap };
