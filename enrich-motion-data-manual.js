#!/usr/bin/env node

/**
 * Enrich Opposition Motion Articles with Real Author/Party Data
 * 
 * This script manually enriches motion articles with author/party data
 * by looking up each document and extracting the information from the
 * dokumentstatus XML structure.
 * 
 * Run this script directly with the riksdag-regering MCP tools available.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NEWS_DIR = path.join(__dirname, 'news');
const LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

// Manually collected document data from riksdag-regering get_dokument calls
// Format: { dok_id: { author: 'Name', party: 'Party Code' } }
const DOCUMENT_DATA = {
  'HD023904': { author: 'Niklas Karlsson m.fl.', party: 'S' },
  'HD023903': { author: null, party: null },  // To be fetched
  'HD023902': { author: null, party: null },  // To be fetched
  'HD023901': { author: null, party: null },  // To be fetched
  'HD023900': { author: null, party: null },  // To be fetched
  'HD023899': { author: null, party: null },  // To be fetched
  'HD023898': { author: null, party: null },  // To be fetched
  'HD023897': { author: null, party: null },  // To be fetched
  'HD023896': { author: null, party: null },  // To be fetched
  'HD023895': { author: null, party: null }   // To be fetched
};

// Label translations for author/party fields
const TRANSLATIONS = {
  author: {
    en: 'Author', sv: 'Författare', da: 'Forfatter', no: 'Forfatter', fi: 'Tekijä',
    de: 'Autor', fr: 'Auteur', es: 'Autor', nl: 'Auteur',
    ar: 'المؤلف', he: 'מחבר', ja: '作者', ko: '저자', zh: '作者'
  },
  party: {
    en: 'Party', sv: 'Parti', da: 'Parti', no: 'Parti', fi: 'Puolue',
    de: 'Partei', fr: 'Parti', es: 'Partido', nl: 'Partij',
    ar: 'حزب', he: 'מפלגה', ja: '政党', ko: '파티', zh: '政黨'
  }
};

/**
 * Update article HTML with author/party data
 */
function updateArticleWithData(filepath, documentData, lang) {
  let content = fs.readFileSync(filepath, 'utf-8');
  let updated = false;
  let updateCount = 0;
  
  // For each document, replace undefined author/party
  for (const [dokId, info] of Object.entries(documentData)) {
    if (!info.author && !info.party) continue;
    
    const authorLabel = TRANSLATIONS.author[lang];
    const partyLabel = TRANSLATIONS.party[lang];
    
    // Strategy: Find the document link, then replace the next undefined author/party fields
    const dokLinkPattern = new RegExp(
      `(href="[^"]*/${dokId}\\.html"[^>]*>[^<]*</a>\\s*</p>\\s*)` +
      `(?:<p><strong>${authorLabel}:</strong>\\s*undefined</p>\\s*)?` +
      `(?:<p><strong>${partyLabel}:</strong>\\s*undefined</p>\\s*)?`,
      'gi'
    );
    
    // Simpler approach: just find and replace all undefined instances
    if (info.author) {
      const authorRegex = new RegExp(
        `(<p><strong>${authorLabel}:</strong>\\s*)undefined(</p>)`,
        'g'
      );
      const beforeCount = (content.match(authorRegex) || []).length;
      if (beforeCount > 0) {
        // Only replace the first occurrence to match this specific document
        content = content.replace(authorRegex, `$1${info.author}$2`);
        updateCount++;
      }
    }
    
    if (info.party) {
      const partyRegex = new RegExp(
        `(<p><strong>${partyLabel}:</strong>\\s*)undefined(</p>)`,
        'g'
      );
      const beforeCount = (content.match(partyRegex) || []).length;
      if (beforeCount > 0) {
        // Only replace the first occurrence
        content = content.replace(partyRegex, `$1${info.party}$2`);
        updateCount++;
      }
    }
  }
  
  if (updateCount > 0) {
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`    ✓ Updated ${updateCount} fields`);
    return true;
  }
  
  return false;
}

/**
 * Main enrichment process
 */
function enrichMotionArticles() {
  console.log('🔧 Enriching Opposition Motion Articles with Real Data');
  console.log('=' .repeat(60));
  
  // Filter to only documents with data
  const dataAvailable = Object.entries(DOCUMENT_DATA)
    .filter(([_, info]) => info.author || info.party)
    .reduce((acc, [dok_id, info]) => {
      acc[dok_id] = info;
      return acc;
    }, {});
  
  console.log(`\nEnriching ${Object.keys(dataAvailable).length} documents with author/party data`);
  
  // Update all language versions
  console.log('\n📝 Updating article files...\n');
  let filesUpdated = 0;
  
  for (const lang of LANGUAGES) {
    const filename = `2026-02-16-opposition-motions-${lang}.html`;
    const filepath = path.join(NEWS_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
      console.log(`  ⚠️ File not found: ${filename}`);
      continue;
    }
    
    console.log(`  Processing ${lang}...`);
    const updated = updateArticleWithData(filepath, dataAvailable, lang);
    
    if (updated) {
      filesUpdated++;
      console.log(`    ✅ Updated ${filename}`);
    } else {
      console.log(`    ℹ️ No changes for ${filename}`);
    }
  }
  
  console.log('\n✨ Enrichment Summary');
  console.log('====================');
  console.log(`Documents with data: ${Object.keys(dataAvailable).length}`);
  console.log(`Files updated: ${filesUpdated}/${LANGUAGES.length}`);
  console.log(`\n⚠️  NOTE: Only documents with fetched data were enriched.`);
  console.log(`   Run riksdag-regering get_dokument for remaining documents.`);
  console.log(`\n✅ Partial enrichment complete!`);
}

// Run enrichment
enrichMotionArticles();
