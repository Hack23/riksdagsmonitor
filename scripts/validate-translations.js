#!/usr/bin/env node

/**
 * Translation Validation Script
 * 
 * Validates all language files for completeness and consistency
 * 
 * Usage: node scripts/validate-translations.js
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Language configurations
const languages = [
  { code: 'en', file: 'index.html', name: 'English', rtl: false },
  { code: 'sv', file: 'index_sv.html', name: 'Swedish', rtl: false },
  { code: 'da', file: 'index_da.html', name: 'Danish', rtl: false },
  { code: 'no', file: 'index_no.html', name: 'Norwegian', rtl: false },
  { code: 'fi', file: 'index_fi.html', name: 'Finnish', rtl: false },
  { code: 'de', file: 'index_de.html', name: 'German', rtl: false },
  { code: 'fr', file: 'index_fr.html', name: 'French', rtl: false },
  { code: 'es', file: 'index_es.html', name: 'Spanish', rtl: false },
  { code: 'nl', file: 'index_nl.html', name: 'Dutch', rtl: false },
  { code: 'ar', file: 'index_ar.html', name: 'Arabic', rtl: true },
  { code: 'he', file: 'index_he.html', name: 'Hebrew', rtl: true },
  { code: 'ja', file: 'index_ja.html', name: 'Japanese', rtl: false },
  { code: 'ko', file: 'index_ko.html', name: 'Korean', rtl: false },
  { code: 'zh', file: 'index_zh.html', name: 'Chinese', rtl: false }
];

// Validation checks
const checks = {
  langAttribute: (content, lang) => {
    const regex = new RegExp(`<html\\s+lang="${lang.code}"`);
    return regex.test(content);
  },
  
  rtlAttribute: (content, lang) => {
    if (!lang.rtl) return true; // Not required for LTR languages
    return content.includes('dir="rtl"');
  },
  
  hasTitle: (content) => {
    return /<title>.*<\/title>/.test(content);
  },
  
  hasDescription: (content) => {
    return /<meta\s+name="description"\s+content="[^"]+">/.test(content);
  },
  
  hasCanonical: (content, lang) => {
    return content.includes(`<link rel="canonical" href="https://riksdagsmonitor.com/${lang.file}">`);
  },
  
  hasHreflang: (content) => {
    // Check for at least some hreflang tags
    const count = (content.match(/hreflang=/g) || []).length;
    return count >= 14; // Should have at least 14 (one for each language)
  },
  
  hasOgLocale: (content, lang) => {
    // Check for Open Graph locale
    return content.includes(`<meta property="og:locale" content="`);
  },
  
  hasSchemaOrg: (content) => {
    return content.includes('"@context": "https://schema.org"');
  }
};

// Main validation function
function validateLanguageFile(lang) {
  const filepath = join(process.cwd(), lang.file);
  
  try {
    const content = readFileSync(filepath, 'utf-8');
    const results = {
      lang: lang.name,
      code: lang.code,
      file: lang.file,
      passed: [],
      failed: []
    };
    
    // Run all checks
    if (checks.langAttribute(content, lang)) {
      results.passed.push('lang attribute');
    } else {
      results.failed.push('lang attribute missing or incorrect');
    }
    
    if (checks.rtlAttribute(content, lang)) {
      results.passed.push('RTL attribute (if needed)');
    } else {
      results.failed.push('dir="rtl" attribute missing (required for RTL languages)');
    }
    
    if (checks.hasTitle(content)) {
      results.passed.push('title tag');
    } else {
      results.failed.push('title tag missing');
    }
    
    if (checks.hasDescription(content)) {
      results.passed.push('meta description');
    } else {
      results.failed.push('meta description missing');
    }
    
    if (checks.hasCanonical(content, lang)) {
      results.passed.push('canonical URL');
    } else {
      results.failed.push('canonical URL missing or incorrect');
    }
    
    if (checks.hasHreflang(content)) {
      results.passed.push('hreflang tags');
    } else {
      results.failed.push('insufficient hreflang tags (need 14+)');
    }
    
    if (checks.hasOgLocale(content, lang)) {
      results.passed.push('Open Graph locale');
    } else {
      results.failed.push('Open Graph locale missing');
    }
    
    if (checks.hasSchemaOrg(content)) {
      results.passed.push('Schema.org structured data');
    } else {
      results.failed.push('Schema.org structured data missing');
    }
    
    return results;
    
  } catch (error) {
    return {
      lang: lang.name,
      code: lang.code,
      file: lang.file,
      error: error.message
    };
  }
}

// Print results
function printResults(results) {
  console.log(`\n${colors.bold}${colors.cyan}===========================================`);
  console.log(`Translation Validation Report`);
  console.log(`===========================================${colors.reset}\n`);
  
  let totalPassed = 0;
  let totalFailed = 0;
  let totalErrors = 0;
  
  results.forEach(result => {
    if (result.error) {
      console.log(`${colors.red}✗ ${result.lang} (${result.code})${colors.reset}`);
      console.log(`  ${colors.red}ERROR: ${result.error}${colors.reset}`);
      totalErrors++;
    } else {
      const allPassed = result.failed.length === 0;
      const status = allPassed 
        ? `${colors.green}✓ ${result.lang} (${result.code})${colors.reset}`
        : `${colors.yellow}⚠ ${result.lang} (${result.code})${colors.reset}`;
      
      console.log(status);
      console.log(`  File: ${result.file}`);
      console.log(`  ${colors.green}Passed: ${result.passed.length}${colors.reset}`);
      
      if (result.failed.length > 0) {
        console.log(`  ${colors.red}Failed: ${result.failed.length}${colors.reset}`);
        result.failed.forEach(failure => {
          console.log(`    ${colors.red}✗ ${failure}${colors.reset}`);
        });
      }
      
      totalPassed += result.passed.length;
      totalFailed += result.failed.length;
    }
    console.log('');
  });
  
  // Summary
  console.log(`${colors.bold}${colors.cyan}===========================================`);
  console.log(`Summary`);
  console.log(`===========================================${colors.reset}\n`);
  console.log(`Languages validated: ${results.length}`);
  console.log(`${colors.green}Total checks passed: ${totalPassed}${colors.reset}`);
  console.log(`${colors.red}Total checks failed: ${totalFailed}${colors.reset}`);
  if (totalErrors > 0) {
    console.log(`${colors.red}File errors: ${totalErrors}${colors.reset}`);
  }
  
  if (totalFailed === 0 && totalErrors === 0) {
    console.log(`\n${colors.bold}${colors.green}✓ All translations validated successfully!${colors.reset}\n`);
    return 0;
  } else {
    console.log(`\n${colors.bold}${colors.red}✗ Translation validation found issues${colors.reset}\n`);
    return 1;
  }
}

// Run validation
const results = languages.map(lang => validateLanguageFile(lang));
const exitCode = printResults(results);

process.exit(exitCode);
