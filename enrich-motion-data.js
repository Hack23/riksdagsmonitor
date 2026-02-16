#!/usr/bin/env node

/**
 * Enrich Opposition Motion Articles with Real Author/Party Data
 * 
 * Uses GitHub Copilot's riksdag-regering MCP tools to fetch document details
 * and populate undefined author/party fields with actual data from Riksdag API
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseStringPromise } from 'xml2js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NEWS_DIR = path.join(__dirname, 'news');
const LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

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
 * Extract document IDs from an article file
 */
function extractDocumentIds(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const matches = content.matchAll(/dokument\/(HD\d+)\.html/g);
  return [...new Set([...matches].map(m => m[1]))];
}

/**
 * Fetch document details using riksdag-regering-mcp
 */
async function fetchDocumentDetails(dokId, mcpClient) {
  try {
    console.log(`  Fetching details for ${dokId}...`);
    const response = await mcpClient.request('get_dokument', {
      dok_id: dokId,
      include_full_text: false
    });
    
    if (response && response.dokument) {
      return response.dokument;
    }
    return null;
  } catch (error) {
    console.error(`  ❌ Error fetching ${dokId}:`, error.message);
    return null;
  }
}

/**
 * Extract author name and party from document
 */
function extractAuthorInfo(document) {
  // The document should have intressent information
  const intressenter = document.dokintressent?.intressent;
  
  if (!intressenter) {
    return { author: null, party: null };
  }
  
  // Get first author (primary author)
  const authors = Array.isArray(intressenter) ? intressenter : [intressenter];
  const primaryAuthor = authors[0];
  
  if (!primaryAuthor) {
    return { author: null, party: null };
  }
  
  // Extract namn and parti
  const author = primaryAuthor.namn || primaryAuthor.tilltalsnamn || null;
  const party = primaryAuthor.partibet || primaryAuthor.parti || null;
  
  return { author, party };
}

/**
 * Update article HTML with author/party data
 */
function updateArticleWithData(filepath, documentData, lang) {
  let content = fs.readFileSync(filepath, 'utf-8');
  let updated = false;
  
  // For each document, replace undefined author/party
  for (const [dokId, info] of Object.entries(documentData)) {
    if (!info.author && !info.party) continue;
    
    const authorLabel = TRANSLATIONS.author[lang];
    const partyLabel = TRANSLATIONS.party[lang];
    
    // Find and replace undefined author
    if (info.author) {
      const authorRegex = new RegExp(
        `(<p><strong>${authorLabel}:</strong>\\s*)undefined(</p>)`,
        'gi'
      );
      const authorMatch = content.match(authorRegex);
      if (authorMatch) {
        content = content.replace(authorRegex, `$1${info.author}$2`);
        updated = true;
        console.log(`    ✓ Updated author for ${dokId}: ${info.author}`);
      }
    }
    
    // Find and replace undefined party
    if (info.party) {
      const partyRegex = new RegExp(
        `(<p><strong>${partyLabel}:</strong>\\s*)undefined(</p>)`,
        'gi'
      );
      const partyMatch = content.match(partyRegex);
      if (partyMatch) {
        content = content.replace(partyRegex, `$1${info.party}$2`);
        updated = true;
        console.log(`    ✓ Updated party for ${dokId}: ${info.party}`);
      }
    }
  }
  
  if (updated) {
    fs.writeFileSync(filepath, content, 'utf-8');
    return true;
  }
  
  return false;
}

/**
 * Main enrichment process
 */
async function enrichMotionArticles() {
  console.log('🔧 Enriching Opposition Motion Articles with Real Data');
  console.log('=' .repeat(60));
  
  // Initialize MCP client
  const mcpClient = new MCPClient();
  
  try {
    // Get all document IDs from English file (same for all languages)
    const enFile = path.join(NEWS_DIR, '2026-02-16-opposition-motions-en.html');
    const documentIds = extractDocumentIds(enFile);
    
    console.log(`\nFound ${documentIds.length} motion documents to enrich:`);
    console.log(documentIds.join(', '));
    
    // Fetch document details for each
    const documentData = {};
    for (const dokId of documentIds) {
      const doc = await fetchDocumentDetails(dokId, mcpClient);
      if (doc) {
        const info = extractAuthorInfo(doc);
        documentData[dokId] = info;
        if (info.author || info.party) {
          console.log(`  ✓ ${dokId}: ${info.author || 'N/A'} (${info.party || 'N/A'})`);
        } else {
          console.log(`  ⚠️ ${dokId}: No author/party data available`);
        }
      }
    }
    
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
      const updated = updateArticleWithData(filepath, documentData, lang);
      
      if (updated) {
        filesUpdated++;
        console.log(`    ✅ Updated ${filename}`);
      } else {
        console.log(`    ℹ️ No changes for ${filename}`);
      }
    }
    
    console.log('\n✨ Enrichment Summary');
    console.log('====================');
    console.log(`Documents processed: ${documentIds.length}`);
    console.log(`Files updated: ${filesUpdated}/${LANGUAGES.length}`);
    console.log(`\n✅ Enrichment complete!`);
    
  } catch (error) {
    console.error('\n❌ Enrichment error:', error);
    throw error;
  }
}

// Run enrichment
enrichMotionArticles().catch(error => {
  console.error('❌ Enrichment failed:', error);
  process.exit(1);
});
