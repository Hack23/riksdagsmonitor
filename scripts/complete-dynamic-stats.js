#!/usr/bin/env node
/**
 * Complete Dynamic Statistics Implementation
 * 
 * Adds data-stat-id attributes for all remaining statistics in all 14 language index files.
 * Replaces approximate values (10,000+, 20,000+) with exact production statistics.
 * 
 * Statistics to make dynamic:
 * 1. stat-total-votes: 3,529,786 (replace "10,000+ votes")
 * 2. stat-total-documents: 109,259 (replace "20,000+ documents")  
 * 3. stat-committee-documents: 8,740 (add new)
 * 4. stat-rule-violations: 2,308 (add new)
 * 
 * Only updates body content, preserving meta tags and JSON-LD for SEO.
 * 
 * Usage: node scripts/complete-dynamic-stats.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INDEX_FILES = [
  'index.html',
  'index_sv.html',
  'index_da.html',
  'index_no.html',
  'index_fi.html',
  'index_de.html',
  'index_fr.html',
  'index_es.html',
  'index_nl.html',
  'index_ar.html',
  'index_he.html',
  'index_ja.html',
  'index_ko.html',
  'index_zh.html'
];

/**
 * Add or update data-stat-id attributes for all statistics
 * Only modifies body content, not meta tags or JSON-LD
 */
function addDynamicStats(content, filename) {
  // Split content into head and body to preserve SEO meta tags
  const bodyStart = content.indexOf('<body');
  if (bodyStart === -1) {
    console.warn(`⚠️  No <body> tag found in ${filename}`);
    return { content, changeCount: 0 };
  }
  
  const head = content.substring(0, bodyStart);
  let body = content.substring(bodyStart);
  
  // Extract and preserve JSON-LD structured data (don't modify for SEO)
  const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  const jsonLdBlocks = [];
  let jsonLdMatch;
  while ((jsonLdMatch = jsonLdRegex.exec(body)) !== null) {
    jsonLdBlocks.push({
      full: jsonLdMatch[0],
      placeholder: `__JSON_LD_PLACEHOLDER_${jsonLdBlocks.length}__`
    });
  }
  
  // Replace JSON-LD with placeholders
  jsonLdBlocks.forEach((block, idx) => {
    body = body.replace(block.full, block.placeholder);
  });
  
  let changeCount = 0;

  // 1. Replace "10,000+ votes" with exact production count
  // Matches: "10,000+ votes analyzed", "10000+ votes", etc.
  const votesPattern = /10,?000\+\s+(votes?|röster|stemmen|äänet|Stimmen|voix|votos|voti|הצבעות|票|קולות|أصوات|투표)(\s+analyzed)?/gi;
  const votesMatches = body.match(votesPattern);
  if (votesMatches) {
    body = body.replace(votesPattern, (match) => {
      changeCount++;
      // Preserve the word and any following text
      const words = match.split(/\s+/);
      const voteWord = words.find(w => !w.match(/10,?000\+/));
      const rest = words.slice(words.indexOf(voteWord) + 1).join(' ');
      return `<span data-stat-id="stat-total-votes">3529786</span> ${voteWord}${rest ? ' ' + rest : ''}`;
    });
  }

  // 2. Replace "20,000+ documents" with exact production count
  // Matches: "20,000+ documents processed", "20000+ documents", etc.
  const docsPattern = /20,?000\+\s+(documents?|dokument|asiakirjoja|Dokumente|documents|documentos|documentos|文書|מסמכים|وثيقة|문서|文書)(\s+processed)?/gi;
  const docsMatches = body.match(docsPattern);
  if (docsMatches) {
    body = body.replace(docsPattern, (match) => {
      changeCount++;
      const words = match.split(/\s+/);
      const docWord = words.find(w => !w.match(/20,?000\+/));
      const rest = words.slice(words.indexOf(docWord) + 1).join(' ');
      return `<span data-stat-id="stat-total-documents">109259</span> ${docWord}${rest ? ' ' + rest : ''}`;
    });
  }

  // 3. Pattern for existing "2,494 historical" (keep and improve)
  // Wrap 2,494 or 2494 with <span data-stat-id="stat-historical-persons">
  // Only replace if not already wrapped in span
  if (!body.includes('data-stat-id="stat-historical-persons"')) {
    const historicalPattern = /\b2,?494\b(?=\s+(historical|historiska|historiske|historiallisia|historisch|historiques|históricos|historisch|历史|היסטוריים|تاريخي|역사적|歴史的))/gi;
    const historicalMatches = body.match(historicalPattern);
    if (historicalMatches) {
      body = body.replace(historicalPattern, '<span data-stat-id="stat-historical-persons">2494</span>');
      changeCount++;
    }
  }

  // 4. Add committee documents count if "committee work" is mentioned (multi-language)
  const committeePattern = /<li>([^<]*(Committee work quantified|Utskottsarbete|Udvalgsarbejde|Komitéarbeid|Valiokuntaty|Ausschussarbeit|Travail en comité|Trabajo de comité|Commissiewerk|委員会作業|위원회 작업|ועדה עבודה|عمل اللجنة)[ קמטעבותלד]*)<\/li>/i;
  if (committeePattern.test(body) && !body.includes('stat-committee-documents')) {
    body = body.replace(
      committeePattern,
      (match, localizedText) =>
        `<li>${localizedText} (<span data-stat-id="stat-committee-documents">8740</span>)</li>`
    );
    changeCount++;
  }

  // 5. Add rule violations count near "45 risk rules" (multi-language)
  const riskPattern = /(45 (?:risk rules|riskiregler|risikoregler|risikregeler|riskisääntö|Risikoregeln|règles de risque|reglas de riesgo|risicoregels|リスクルール|위험 규칙|כללי סיכון|قواعد المخاطرة))(?!\s*\(detecting)/i;
  if (riskPattern.test(body) && !body.includes('stat-rule-violations')) {
    body = body.replace(
      riskPattern,
      `$1 (detecting <span data-stat-id="stat-rule-violations">2308</span> violations)`
    );
    changeCount++;
  }

  // Restore JSON-LD blocks
  jsonLdBlocks.forEach((block) => {
    body = body.replace(block.placeholder, block.full);
  });

  return { content: head + body, changeCount };
}

/**
 * Process a single index file
 */
function processFile(filename) {
  const filepath = path.join(__dirname, '..', filename);
  
  if (!fs.existsSync(filepath)) {
    console.log(`⏭️  Skip ${filename} (not found)`);
    return 0;
  }

  console.log(`📝 Processing ${filename}...`);
  
  let content = fs.readFileSync(filepath, 'utf8');
  const originalContent = content;
  
  // Add dynamic stat attributes
  const result = addDynamicStats(content, filename);
  content = result.content;
  const changeCount = result.changeCount;
  
  // Only write if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`✅ Updated ${filename} (${changeCount} changes)`);
    return changeCount;
  } else {
    console.log(`ℹ️  No changes needed for ${filename}`);
    return 0;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Completing dynamic statistics for all index files...\n');
  console.log('📊 Statistics to implement:');
  console.log('   1. stat-total-votes: 3,529,786 votes');
  console.log('   2. stat-total-documents: 109,259 documents');
  console.log('   3. stat-committee-documents: 8,740 documents');
  console.log('   4. stat-rule-violations: 2,308 violations');
  console.log('   5. stat-historical-persons: 2,494 (improve existing)\n');
  
  let totalChanges = 0;
  INDEX_FILES.forEach(filename => {
    totalChanges += processFile(filename);
  });
  
  console.log(`\n✨ Done! Processed ${INDEX_FILES.length} files with ${totalChanges} total changes.`);
  console.log('📊 All statistics will now be loaded dynamically from production-stats.json');
  console.log('🔄 Daily updates at 03:00 CET via GitHub Actions workflow');
}

main();
