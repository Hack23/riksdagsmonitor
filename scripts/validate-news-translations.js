#!/usr/bin/env node

/**
 * News Article Translation Validation Script
 * 
 * Validates that all news articles in non-Swedish languages have been fully translated.
 * Checks for Swedish content markers (data-translate="true") that indicate untranslated content.
 * 
 * Usage: node scripts/validate-news-translations.js [directory]
 * 
 * Examples:
 *   node scripts/validate-news-translations.js           # Check all news articles
 *   node scripts/validate-news-translations.js news/     # Check specific directory
 * 
 * Exit Codes:
 *   0 - All articles fully translated
 *   1 - Untranslated content found or errors occurred
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Language codes to check (exclude Swedish)
const NON_SWEDISH_LANGS = ['en', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

/**
 * Check if a file contains untranslated Swedish content markers
 */
function checkFileForUntranslatedContent(filepath) {
  try {
    const content = readFileSync(filepath, 'utf-8');
    const markers = content.match(/data-translate="true"/g);
    
    if (!markers) {
      return { passed: true };
    }
    
    // Extract samples of untranslated content
    const samples = [];
    const sampleRegex = /<span data-translate="true"[^>]*>([^<]{0,80})/g;
    let match;
    let count = 0;
    
    while ((match = sampleRegex.exec(content)) !== null && count < 3) {
      const text = match[1].length >= 80 ? match[1] + '...' : match[1];
      samples.push(text);
      count++;
    }
    
    return {
      passed: false,
      markerCount: markers.length,
      samples
    };
    
  } catch (error) {
    return {
      error: error.message
    };
  }
}

/**
 * Get all HTML files in a directory (recursive)
 */
function getAllHtmlFiles(dir) {
  const files = [];
  
  try {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Recursively check subdirectories
        files.push(...getAllHtmlFiles(fullPath));
      } else if (item.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error reading directory ${dir}: ${error.message}${colors.reset}`);
  }
  
  return files;
}

/**
 * Determine language code from filename
 */
function getLanguageCode(filename) {
  // Pattern: *-{lang}.html
  const match = filename.match(/-([a-z]{2})\.html$/);
  return match ? match[1] : null;
}

/**
 * Main validation function
 */
function validateNewsTranslations(directory = 'news') {
  console.log(`${colors.bold}${colors.cyan}===========================================`);
  console.log(`News Article Translation Validation`);
  console.log(`===========================================${colors.reset}\n`);
  console.log(`Checking directory: ${directory}\n`);
  
  const htmlFiles = getAllHtmlFiles(directory);
  const nonSwedishFiles = htmlFiles.filter(file => {
    const lang = getLanguageCode(basename(file));
    return lang && NON_SWEDISH_LANGS.includes(lang);
  });
  
  console.log(`Found ${nonSwedishFiles.length} non-Swedish article files to check\n`);
  
  let totalPassed = 0;
  let totalFailed = 0;
  let totalErrors = 0;
  const failedFiles = [];
  
  for (const filepath of nonSwedishFiles) {
    const filename = basename(filepath);
    const lang = getLanguageCode(filename);
    const result = checkFileForUntranslatedContent(filepath);
    
    if (result.error) {
      console.log(`${colors.red}ERROR: ${filename}${colors.reset}`);
      console.log(`  ${colors.red}${result.error}${colors.reset}\n`);
      totalErrors++;
    } else if (result.passed) {
      console.log(`${colors.green}✓ ${filename} (${lang.toUpperCase()})${colors.reset}`);
      totalPassed++;
    } else {
      console.log(`${colors.red}✗ ${filename} (${lang.toUpperCase()})${colors.reset}`);
      console.log(`  ${colors.red}Found ${result.markerCount} untranslated marker(s)${colors.reset}`);
      
      if (result.samples.length > 0) {
        console.log(`  ${colors.yellow}Samples:${colors.reset}`);
        result.samples.forEach((sample, i) => {
          console.log(`    ${i + 1}. "${sample}"`);
        });
      }
      console.log('');
      
      failedFiles.push({ filename, lang, count: result.markerCount, samples: result.samples });
      totalFailed++;
    }
  }
  
  // Summary
  console.log(`\n${colors.bold}${colors.cyan}===========================================`);
  console.log(`Summary`);
  console.log(`===========================================${colors.reset}\n`);
  console.log(`Total articles checked: ${nonSwedishFiles.length}`);
  console.log(`${colors.green}✓ Fully translated: ${totalPassed}${colors.reset}`);
  console.log(`${colors.red}✗ Contains untranslated content: ${totalFailed}${colors.reset}`);
  
  if (totalErrors > 0) {
    console.log(`${colors.red}✗ Errors: ${totalErrors}${colors.reset}`);
  }
  
  if (totalFailed > 0) {
    console.log(`\n${colors.bold}${colors.red}❌ VALIDATION FAILED${colors.reset}`);
    console.log(`\nFiles needing translation:\n`);
    
    failedFiles.forEach(({ filename, lang, count }) => {
      console.log(`  ${colors.red}✗${colors.reset} ${filename} - ${count} markers`);
    });
    
    console.log(`\n${colors.yellow}Action Required:${colors.reset}`);
    console.log(`1. Open each file listed above`);
    console.log(`2. Find all <span data-translate="true" lang="sv">Swedish text</span> elements`);
    console.log(`3. Translate the Swedish text to the article's target language`);
    console.log(`4. Replace the span with plain translated text`);
    console.log(`5. Consult TRANSLATION_GUIDE.md for terminology\n`);
    
    return 1;
  } else {
    console.log(`\n${colors.bold}${colors.green}✅ ALL ARTICLES FULLY TRANSLATED${colors.reset}\n`);
    return 0;
  }
}

// Run validation
const directory = process.argv[2] || 'news';
const exitCode = validateNewsTranslations(directory);

process.exit(exitCode);
