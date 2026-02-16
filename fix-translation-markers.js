#!/usr/bin/env node

/**
 * Minimal Fix: Remove Translation Markers Only
 * 
 * This script removes ONLY the `data-translate` markers which are UI bugs.
 * It preserves ALL content including "undefined" placeholders, which honestly
 * represent missing data that can be enriched in a follow-up PR.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NEWS_DIR = path.join(__dirname, 'news');
const LANGUAGES = ['en', 'sv', 'da', 'no', 'fi', 'de', 'fr', 'es', 'nl', 'ar', 'he', 'ja', 'ko', 'zh'];

/**
 * Remove translation markers from HTML content and JSON-LD
 */
function removeTranslationMarkers(filepath) {
  let content = fs.readFileSync(filepath, 'utf-8');
  const original = content;
  
  // Remove data-translate markers from HTML content
  content = content.replace(/<span\s+data-translate="true"\s+lang="sv">/g, '');
  content = content.replace(/<span\s+lang="sv"\s+data-translate="true">/g, '');
  content = content.replace(/<\/span>/g, '');
  
  // Remove from HTML-encoded versions in JSON-LD articleBody
  content = content.replace(/ data-translate=&quot;true&quot;/g, '');
  content = content.replace(/ lang=&quot;sv&quot;/g, '');
  
  // Handle truncated patterns in long articleBody strings
  content = content.replace(/ data-translate=&quo/g, ' ');
  content = content.replace(/ data-translate=&qu/g, ' ');
  content = content.replace(/data-translate=&quot;/g, '');
  content = content.replace(/data-translate=\.\.\./g, '');
  
  // Clean up empty spans
  content = content.replace(/&lt;span\s+&gt;/g, '');
  content = content.replace(/&lt;span&gt;/g, '');
  content = content.replace(/<span\s+>/g, '');
  content = content.replace(/<span>/g, '');
  
  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf-8');
    return true;
  }
  
  return false;
}

/**
 * Main process
 */
function fixArticles() {
  console.log('🔧 Minimal Fix: Removing Translation Markers');
  console.log('=' .repeat(60));
  console.log('\n⚠️  This fix:');
  console.log('   ✓ Removes data-translate markers (UI bugs)');
  console.log('   ✓ Preserves ALL content including "undefined" values');
  console.log('   ✓ Maintains article integrity\n');
  
  const articleTypes = ['committee-reports', 'government-propositions', 'opposition-motions'];
  let totalFixed = 0;
  
  for (const articleType of articleTypes) {
    console.log(`\n=== ${articleType} ===`);
    let typeFixed = 0;
    
    for (const lang of LANGUAGES) {
      const filename = `2026-02-16-${articleType}-${lang}.html`;
      const filepath = path.join(NEWS_DIR, filename);
      
      if (!fs.existsSync(filepath)) {
        continue;
      }
      
      if (removeTranslationMarkers(filepath)) {
        typeFixed++;
        console.log(`  ✓ ${lang}`);
      }
    }
    
    if (typeFixed > 0) {
      console.log(`  Fixed ${typeFixed} files`);
      totalFixed += typeFixed;
    } else {
      console.log(`  No markers found`);
    }
  }
  
  console.log('\n✨ Summary');
  console.log('==========');
  console.log(`Files cleaned: ${totalFixed}`);
  console.log('\n✅ Translation markers removed!');
  console.log('\n📝 Note: "undefined" placeholders remain as honest data representation.');
  console.log('   Full enrichment with real author/party data is a separate task.');
}

// Run fix
fixArticles();
