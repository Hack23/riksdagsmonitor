#!/usr/bin/env node

/**
 * Vocabulary Extraction Script
 * 
 * Analyzes translated news articles to extract political terminology patterns
 * across all 14 supported languages for vocabulary enhancement.
 */

import { readFileSync, readdirSync } from 'fs';
import { basename } from 'path';

const LANGUAGES = {
  en: 'English', sv: 'Swedish', da: 'Danish', no: 'Norwegian', fi: 'Finnish',
  de: 'German', fr: 'French', es: 'Spanish', nl: 'Dutch',
  ar: 'Arabic', he: 'Hebrew', ja: 'Japanese', ko: 'Korean', zh: 'Chinese'
};

/**
 * Extract political terms from HTML content
 */
function extractTerms(content, lang) {
  const terms = {};
  
  // Extract titles (main political terminology)
  const h3Matches = content.match(/<h3>([^<]+)<\/h3>/g) || [];
  terms.titles = h3Matches.map(m => m.replace(/<\/?h3>/g, '').trim()).slice(0, 10);
  
  // Extract "What to Watch" / "Vad man ska följa" etc.
  const watchPattern = /<h2>([^<]*(?:[Ww]atch|[Ff]ölja|[Bb]eobachten|[Ss]uivre|[Ss]eguir)[^<]*)<\/h2>/i;
  const watchMatch = content.match(watchPattern);
  if (watchMatch) terms.watchLabel = watchMatch[1].trim();
  
  // Extract "Committee" / "Kommitté" / "Ausschuss" etc.
  const committeePattern = /<strong>([^<]*(?:[Cc]ommittee|[Kk]ommitté|[Aa]usschuss|[Cc]ommission|[Uu]dvalg|[Vv]aliokunta)[^<]*):?<\/strong>/i;
  const committeeMatch = content.match(committeePattern);
  if (committeeMatch) terms.committeeLabel = committeeMatch[1].trim();
  
  // Extract "Document" / "Dokument" etc.
  const documentPattern = /<strong>([^<]*(?:[Dd]ocument|[Dd]okument)[^<]*):?<\/strong>/i;
  const documentMatch = content.match(documentPattern);
  if (documentMatch) terms.documentLabel = documentMatch[1].trim();
  
  // Extract article type from title
  const titleMatch = content.match(/<h1>([^<]+)<\/h1>/);
  if (titleMatch) terms.mainTitle = titleMatch[1].trim();
  
  return terms;
}

/**
 * Analyze all news articles
 */
function analyzeArticles(directory = 'news') {
  const results = {};
  
  for (const lang of Object.keys(LANGUAGES)) {
    results[lang] = {
      language: LANGUAGES[lang],
      code: lang,
      samples: []
    };
  }
  
  try {
    const files = readdirSync(directory).filter(f => f.endsWith('.html') && f.includes('2026-02-'));
    
    for (const file of files) {
      const match = file.match(/-([a-z]{2})\.html$/);
      if (!match) continue;
      
      const lang = match[1];
      if (!results[lang]) continue;
      
      try {
        const content = readFileSync(`${directory}/${file}`, 'utf-8');
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
        // Skip files that can't be read
      }
    }
  } catch (error) {
    console.error(`Error reading directory: ${error.message}`);
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
    if (committeeReports.length > 0 && committeeReports[0].terms.titles) {
      console.log(`\n  Sample titles (committee reports):`);
      committeeReports[0].terms.titles.slice(0, 3).forEach(title => {
        console.log(`    - ${title}`);
      });
    }
  }
  
  console.log('\n========================================\n');
}

/**
 * Generate vocabulary tables for documentation
 */
function generateVocabularyTables(results) {
  console.log('\n### Key Political Terms by Language\n');
  
  console.log('| Language | Committee | Document | What to Watch |');
  console.log('|----------|-----------|----------|---------------|');
  
  for (const [code, data] of Object.entries(results)) {
    if (data.samples.length === 0) continue;
    
    const committeeLabel = data.samples.find(s => s.terms.committeeLabel)?.terms.committeeLabel || '-';
    const documentLabel = data.samples.find(s => s.terms.documentLabel)?.terms.documentLabel || '-';
    const watchLabel = data.samples.find(s => s.terms.watchLabel)?.terms.watchLabel || '-';
    
    console.log(`| ${data.language} (${code}) | ${committeeLabel} | ${documentLabel} | ${watchLabel} |`);
  }
  
  console.log('');
}

// Run analysis
const results = analyzeArticles('news');
generateReport(results);
generateVocabularyTables(results);
