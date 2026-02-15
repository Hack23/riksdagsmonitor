#!/usr/bin/env node

/**
 * Enhanced Vocabulary Extraction Script
 * 
 * Analyzes translated news articles to extract political terminology patterns
 * across all 14 supported languages for vocabulary enhancement.
 * 
 * Features:
 * - Structure-based label extraction (language-agnostic)
 * - CLI-configurable date filter
 * - Comprehensive error reporting
 * - Support for all language scripts (Latin, CJK, RTL)
 */

import { readFileSync, readdirSync } from 'fs';
import { basename, join } from 'path';

const LANGUAGES = {
  en: 'English', sv: 'Swedish', da: 'Danish', no: 'Norwegian', fi: 'Finnish',
  de: 'German', fr: 'French', es: 'Spanish', nl: 'Dutch',
  ar: 'Arabic', he: 'Hebrew', ja: 'Japanese', ko: 'Korean', zh: 'Chinese'
};

// Track skipped files for warning summary
const skippedFiles = [];

/**
 * Extract political terms from HTML content using structure-based approach
 */
function extractTerms(content, lang) {
  const terms = {};
  
  // Extract titles (main political terminology)
  // Handle both plain text and <span> wrapped titles
  const h3Pattern = /<h3>(.*?)<\/h3>/g;
  const h3Matches = [];
  let h3Match;
  while ((h3Match = h3Pattern.exec(content)) !== null) {
    // Strip any inner tags (like <span>) to get clean text
    const cleanText = h3Match[1].replace(/<[^>]+>/g, '').trim();
    if (cleanText) h3Matches.push(cleanText);
  }
  terms.titles = h3Matches.slice(0, 10);
  
  // Extract "What to Watch" heading (any language) - structure-based
  const h2Pattern = /<h2[^>]*>([^<]+)<\/h2>/g;
  const h2Matches = [];
  let h2Match;
  while ((h2Match = h2Pattern.exec(content)) !== null) {
    const text = h2Match[1].trim();
    // Heuristic: "What to Watch" headings often contain these keywords
    if (text.length > 5 && text.length < 100) {
      h2Matches.push(text);
    }
  }
  if (h2Matches.length > 0) {
    // Assume first h2 is "What to Watch" if present
    terms.watchLabel = h2Matches[0];
  }
  
  // Extract structured labels from <strong>…:</strong> (language-agnostic)
  const strongLabelPattern = /<strong>\s*([^:<]+?)\s*:\s*<\/strong>/g;
  const strongLabels = [];
  let strongMatch;
  while ((strongMatch = strongLabelPattern.exec(content)) !== null) {
    const label = strongMatch[1].trim();
    if (label.length > 0 && label.length < 50) {
      strongLabels.push(label);
    }
  }
  
  // Convention: first label is often committee, second is document
  if (strongLabels[0]) terms.committeeLabel = strongLabels[0];
  if (strongLabels[1]) terms.documentLabel = strongLabels[1];
  
  // Extract article type from title
  const titleMatch = content.match(/<h1>([^<]+)<\/h1>/);
  if (titleMatch) terms.mainTitle = titleMatch[1].trim();
  
  return terms;
}

/**
 * Analyze all news articles
 */
function analyzeArticles(directory = 'news', datePrefix = null) {
  const results = {};
  
  for (const lang of Object.keys(LANGUAGES)) {
    results[lang] = {
      language: LANGUAGES[lang],
      code: lang,
      samples: []
    };
  }
  
  try {
    const files = readdirSync(directory).filter(f => {
      if (!f.endsWith('.html')) return false;
      if (datePrefix && !f.includes(datePrefix)) return false;
      return true;
    });
    
    console.log(`\nScanning ${files.length} HTML files in ${directory}/`);
    if (datePrefix) {
      console.log(`Filtering by date prefix: "${datePrefix}"\n`);
    }
    
    for (const file of files) {
      const match = file.match(/-([a-z]{2})\.html$/);
      if (!match) {
        skippedFiles.push({ file, reason: 'No language code in filename' });
        continue;
      }
      
      const lang = match[1];
      if (!results[lang]) {
        skippedFiles.push({ file, reason: `Unknown language code: ${lang}` });
        continue;
      }
      
      try {
        const content = readFileSync(join(directory, file), 'utf-8');
        const terms = extractTerms(content, lang);
        
        // Determine article type
        let articleType = 'general';
        if (file.includes('committee')) articleType = 'committee-reports';
        else if (file.includes('proposition')) articleType = 'propositions';
        else if (file.includes('motion')) articleType = 'motions';
        else if (file.includes('evening')) articleType = 'evening-analysis';
        else if (file.includes('week-ahead')) articleType = 'week-ahead';
        
        results[lang].samples.push({
          file: basename(file),
          type: articleType,
          terms
        });
      } catch (error) {
        skippedFiles.push({ file, reason: `Read error: ${error.message}` });
      }
    }
  } catch (error) {
    console.error(`Error reading directory: ${error.message}`);
    process.exit(1);
  }
  
  return results;
}

/**
 * Generate vocabulary report
 */
function generateReport(results) {
  console.log('\n========================================');
  console.log('Political Vocabulary Analysis Report');
  console.log('========================================\n');
  
  for (const [code, data] of Object.entries(results)) {
    if (data.samples.length === 0) continue;
    
    console.log(`\n## ${data.language} (${code.toUpperCase()})`);
    console.log(`Samples analyzed: ${data.samples.length}`);
    
    // Collect unique labels
    const watchLabels = new Set();
    const committeeLabels = new Set();
    const documentLabels = new Set();
    const mainTitles = new Set();
    
    for (const sample of data.samples) {
      if (sample.terms.watchLabel) watchLabels.add(sample.terms.watchLabel);
      if (sample.terms.committeeLabel) committeeLabels.add(sample.terms.committeeLabel);
      if (sample.terms.documentLabel) documentLabels.add(sample.terms.documentLabel);
      if (sample.terms.mainTitle) mainTitles.add(sample.terms.mainTitle);
    }
    
    if (watchLabels.size > 0) console.log(`  "What to Watch": ${Array.from(watchLabels).join(', ')}`);
    if (committeeLabels.size > 0) console.log(`  "Committee": ${Array.from(committeeLabels).join(', ')}`);
    if (documentLabels.size > 0) console.log(`  "Document": ${Array.from(documentLabels).join(', ')}`);
    
    // Show sample titles from committee reports
    const committeeReports = data.samples.filter(s => s.type === 'committee-reports');
    if (committeeReports.length > 0 && committeeReports[0].terms.titles.length > 0) {
      console.log(`  Sample titles: ${committeeReports[0].terms.titles.slice(0, 3).join(', ')}`);
    }
  }
  
  // Warning summary
  if (skippedFiles.length > 0) {
    console.log('\n\n⚠️  WARNING: Skipped Files Summary');
    console.log('=====================================');
    console.log(`Total skipped: ${skippedFiles.length}\n`);
    
    // Group by reason
    const byReason = {};
    for (const { file, reason } of skippedFiles) {
      if (!byReason[reason]) byReason[reason] = [];
      byReason[reason].push(file);
    }
    
    for (const [reason, files] of Object.entries(byReason)) {
      console.log(`${reason}: ${files.length} file(s)`);
      if (files.length <= 5) {
        files.forEach(f => console.log(`  - ${f}`));
      } else {
        files.slice(0, 3).forEach(f => console.log(`  - ${f}`));
        console.log(`  ... and ${files.length - 3} more`);
      }
      console.log();
    }
  }
  
  console.log('\n========================================');
  console.log('Analysis complete!');
  console.log('========================================\n');
}

// Parse CLI arguments
const args = process.argv.slice(2);
let datePrefix = null;
let directory = 'news';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--date-prefix' && args[i + 1]) {
    datePrefix = args[i + 1];
    i++;
  } else if (args[i] === '--directory' && args[i + 1]) {
    directory = args[i + 1];
    i++;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
Usage: node scripts/extract-vocabulary.js [options]

Options:
  --date-prefix <prefix>   Filter files by date prefix (e.g., "2026-02-")
  --directory <path>       Directory to scan (default: "news")
  --help, -h              Show this help message

Examples:
  node scripts/extract-vocabulary.js
  node scripts/extract-vocabulary.js --date-prefix 2026-02-
  node scripts/extract-vocabulary.js --directory news --date-prefix 2026-03-
`);
    process.exit(0);
  }
}

// Run analysis
const results = analyzeArticles(directory, datePrefix);
generateReport(results);
