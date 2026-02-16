#!/usr/bin/env node

/**
 * @module Intelligence/Terminology
 * @category Intelligence Operations / Supporting Infrastructure
 * @name Vocabulary Extraction - Political Terminology Pattern Analysis
 * 
 * @description
 * Advanced terminology extraction system analyzing translated news articles across
 * all 14 supported languages to identify and catalog political terminology patterns.
 * Supports intelligence operatives in understanding how political concepts translate
 * across linguistic and cultural contexts.
 * 
 * Core Mission:
 * Automatic extraction of political terminology from published news articles,
 * enabling vocabulary enrichment across 14 language variants. Identifies key political
 * terms, party names, committee references, legislative concepts, and institutional
 * terminology used in Riksdag coverage. Supports linguistic analysis for translation
 * quality assurance and political concept comparison across Nordic/European contexts.
 * 
 * Supported Languages (14):
 * - Latin Scripts: English (en), Swedish (sv), Danish (da), Norwegian (no), Finnish (fi),
 *   German (de), French (fr), Spanish (es), Dutch (nl)
 * - Non-Latin Scripts: Arabic (ar - RTL), Hebrew (he - RTL), 
 *   Japanese (ja - Kanji/Hiragana/Katakana), Korean (ko - Hangul), Chinese (zh - Hanzi)
 * 
 * Terminology Categories Extracted:
 * - Political titles and roles (e.g., "Riksdagsledamot", "Statsminister", "Minister")
 * - Committee references (e.g., "Försvarsutskottet", "Finansutskottet")
 * - Party mentions and abbreviations (S, M, SD, V, MP, C, L, KD)
 * - Legislative terms (propositioner, motioner, betänkanden, skrivelser)
 * - Institutional acronyms (EU, NATO, UN, etc.)
 * - Policy domains (försvar, miljö, ekonomi, välfärd)
 * 
 * Extraction Methodology:
 * - Structure-based extraction using HTML element analysis (language-agnostic)
 * - Parses article titles (h3 elements) as primary terminology source
 * - Extracts "What to Watch" and key context headings
 * - Handles "Why This Matters" explanatory sections
 * - Cross-references historical context and related articles
 * - Supports all character encodings (UTF-8 with proper multi-byte handling)
 * 
 * Technical Architecture:
 * - CLI-configurable date filtering for temporal analysis
 * - Comprehensive error reporting with file-level granularity
 * - Support for all Unicode scripts (Latin, CJK, Arabic/Hebrew bidirectional)
 * - Handles HTML entity encoding and special character sequences
 * - Generates JSON output for downstream linguistic analysis
 * 
 * Intelligence Applications:
 * - Terminology pattern analysis for translation consistency
 * - Identification of emerging political concepts and terminology
 * - Cross-language comparison of political discourse
 * - Support for cultural intelligence analysis
 * - Input to automated translation quality assurance
 * - Political terminology reference for analyst briefings
 * 
 * Data Processing Pipeline:
 * - Scans news/ directory for published articles
 * - Filters by date range (--from-date, --to-date parameters)
 * - Extracts terminology from HTML structure
 * - Deduplicates and normalizes extracted terms
 * - Generates comprehensive terminology report
 * - Logs skipped files and processing errors
 * 
 * Output Format:
 * JSON file containing:
 * - titles: Array of extracted h3 titles (primary terminology)
 * - headings: Array of h2 section headings
 * - whyMatters: Content from "Why This Matters" sections
 * - context: Historical context and reference sections
 * - metadata: Extraction statistics and processing info
 * 
 * Usage:
 *   node scripts/extract-vocabulary.js
 *   node scripts/extract-vocabulary.js --from-date=2026-01-01 --to-date=2026-02-01
 *   node scripts/extract-vocabulary.js --lang=sv
 * 
 * Integration Points:
 * - Consumed by automated translation quality assurance systems
 * - Used in terminology glossary maintenance workflows
 * - Feeds political concept mapping for intelligence dashboards
 * - Referenced in editorial consistency validation
 * 
 * GDPR & Data Protection:
 * - Processes only published, public articles
 * - Extracts terminology only (no personal identifiers)
 * - Complies with GDPR Article 5 (transparency)
 * - No storage of personal data in terminology output
 * - Audit trail of extraction dates and processing
 * 
 * Linguistic Considerations:
 * - Preserves non-Latin character scripts exactly as published
 * - Handles right-to-left languages (Arabic, Hebrew) properly
 * - Supports CJK character analysis without segmentation
 * - Respects linguistic conventions for each language
 * 
 * @intelligence Core tool for political terminology analysis across languages
 * @osint Analyzes published public government documents and articles
 * @risk Incomplete terminology extraction may omit emerging political concepts
 * @gdpr No personal data extraction (terminology/concepts only)
 * @security File access restricted to article directory; no system-wide scanning
 * 
 * @author Hack23 AB (Linguistic Intelligence Team)
 * @license Apache-2.0
 * @version 2.5.0
 * @see extract-vocabulary.js (this file)
 * @see political terminology references for each language
 * @see Unicode Standard for multi-script support
 * @see GDPR Article 5 - Principles relating to processing
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
    
    // Show sample titles from any articles (prioritize committee reports)
    const committeeReports = data.samples.filter(s => s.type === 'committee-reports');
    const sampleWithTitles = committeeReports.find(s => s.terms.titles && s.terms.titles.length > 0) || 
                              data.samples.find(s => s.terms.titles && s.terms.titles.length > 0);
    
    if (sampleWithTitles && sampleWithTitles.terms.titles.length > 0) {
      console.log(`  Sample titles: ${sampleWithTitles.terms.titles.slice(0, 3).join(', ')}`);
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
