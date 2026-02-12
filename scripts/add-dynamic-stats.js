#!/usr/bin/env node
/**
 * Add Dynamic Statistics Support to Index Files
 * 
 * Adds data-stat-id attributes to hardcoded statistics in all 14 language index files.
 * This enables dynamic loading from production-stats.json via stats-loader.js
 * 
 * Only updates statistics in body content, not in meta tags or JSON-LD.
 * 
 * Usage: node scripts/add-dynamic-stats.js
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
 * Add or update data-stat-id attribute in HTML body content only
 * Avoids meta tags and JSON-LD structured data
 */
function addDynamicStats(content) {
  // Split content into head and body
  const bodyStart = content.indexOf('<body');
  if (bodyStart === -1) return content;
  
  const head = content.substring(0, bodyStart);
  let body = content.substring(bodyStart);
  
  // Pattern: "2,494 historical politicians" or "2494 historical" (variations)
  // Wrap 2,494 or 2494 with <span data-stat-id="stat-historical-persons">
  body = body.replace(
    /\b2,?494\b(?=\s+(historical|historiska|historische|historiques|históricos|historiallisia|storici|historische|历史|היסטוריים|تاريخي|역사적|歴史的))/gi,
    '<span data-stat-id="stat-historical-persons">2494</span>'
  );

  // Pattern: "3,529,786 votes" or "3529786 votes" (variations)
  // Wrap with <span data-stat-id="stat-total-votes">
  body = body.replace(
    /\b3,?529,?786\b(?=\s+(votes?|röster|stemmen|äänet|Stimmen|voix|votos|voti|票|קולות|أصوات|투표|票))/gi,
    '<span data-stat-id="stat-total-votes">3529786</span>'
  );

  // Pattern: "109,259 documents" or "109259 documents" (variations)
  // Wrap with <span data-stat-id="stat-total-documents">
  body = body.replace(
    /\b109,?259\b(?=\s+(documents?|dokument|asiakirjoja|Dokumente|documents|documentos|文書|מסמכים|وثيقة|문서|文書))/gi,
    '<span data-stat-id="stat-total-documents">109259</span>'
  );

  return head + body;
}

/**
 * Process a single index file
 */
function processFile(filename) {
  const filepath = path.join(__dirname, '..', filename);
  
  if (!fs.existsSync(filepath)) {
    console.log(`⏭️  Skip ${filename} (not found)`);
    return;
  }

  console.log(`📝 Processing ${filename}...`);
  
  let content = fs.readFileSync(filepath, 'utf8');
  const originalContent = content;
  
  // Add dynamic stat attributes
  content = addDynamicStats(content);
  
  // Only write if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`✅ Updated ${filename}`);
  } else {
    console.log(`ℹ️  No changes needed for ${filename}`);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Adding dynamic statistics support to index files...\n');
  
  INDEX_FILES.forEach(processFile);
  
  console.log('\n✨ Done! All index files processed.');
  console.log('📊 Statistics will now be loaded dynamically from production-stats.json');
}

main();
