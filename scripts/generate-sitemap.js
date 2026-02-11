#!/usr/bin/env node

/**
 * Sitemap Generation Script
 * 
 * Automatically generates sitemap.xml from news articles and index pages
 * Includes proper hreflang tags and multi-language support
 * 
 * Usage: node generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

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
      
      if (!articles.has(baseSlug)) {
        articles.set(baseSlug, {
          baseSlug,
          languages: [],
          lastmod: getFileModTime(path.join(NEWS_DIR, file))
        });
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
  
  const now = new Date().toISOString();
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;
  
  // Main index page with all language alternates
  const indexAlternates = LANGUAGES.map(lang => ({
    lang,
    href: lang === 'en' ? 'index.html' : `index_${lang}.html`
  }));
  
  xml += generateUrlEntry('', now, 'daily', '1.0', indexAlternates);
  
  // Individual language index pages
  LANGUAGES.forEach(lang => {
    const loc = lang === 'en' ? 'index.html' : `index_${lang}.html`;
    const lastmod = getFileModTime(path.join(ROOT_DIR, loc));
    const priority = lang === 'sv' ? '0.9' : '0.7';
    
    xml += generateUrlEntry(loc, lastmod, 'daily', priority);
  });
  
  // News index pages
  xml += generateUrlEntry('news/', now, 'daily', '0.9', [
    { lang: 'en', href: 'news/index.html' },
    { lang: 'sv', href: 'news/index_sv.html' }
  ]);
  
  // News articles
  const articles = getNewsArticles();
  console.log(`  Processing ${articles.length} article groups...`);
  
  articles.forEach(article => {
    article.languages.forEach(lang => {
      const loc = `news/${article.baseSlug}-${lang}.html`;
      const alternates = article.languages.map(altLang => ({
        lang: altLang,
        href: `news/${article.baseSlug}-${altLang}.html`
      }));
      
      // Add x-default to first language
      if (lang === article.languages[0]) {
        alternates.push({
          lang: 'x-default',
          href: `news/${article.baseSlug}-${article.languages[0]}.html`
        });
      }
      
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
if (require.main === module) {
  const exitCode = main();
  process.exit(exitCode);
}

module.exports = { generateSitemap, validateSitemap };
