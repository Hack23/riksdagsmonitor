#!/usr/bin/env node
/**
 * CIA Production Statistics Loader
 * 
 * Fetches and parses extraction_summary_report.csv from CIA production database
 * to provide accurate statistics for riksdagsmonitor website.
 * 
 * Data Source: https://github.com/Hack23/cia/master/service.data.impl/sample-data/extraction_summary_report.csv
 * Update Schedule: Daily at 02:57 CET (CIA extraction time)
 * 
 * ISMS Compliance:
 * - ISO 27001:2022 A.5.33 - Protection of records (source attribution, audit trails via Git)
 * - ISO 27001:2022 A.5.34 - Privacy and PII protection (public officials in official capacity only)
 * - ISO 27001:2022 A.8.10 - Information deletion (documented retention policies, no excessive storage)
 * - ISO 27001:2022 A.8.19 - Security in use (HTTPS-only, CSP headers)
 * - NIST CSF 2.0 PR.DS-5 - Protections against data leaks (HTTPS-only, public data only)
 * - NIST CSF 2.0 ID.AM-5 - Resources prioritized (data classified as PUBLIC)
 * - CIS Control 3.1 - Data inventory (documented public data sources)
 * - GDPR Article 6(1)(e) - Public interest processing (democratic transparency)
 * - GDPR Article 9(2)(e) - Political opinions manifestly made public (voting records, party affiliation)
 * - Swedish Offentlighetsprincipen - Public access to government information (Tryckfrihetsförordningen)
 *
 * Note: A.8.11 (Data Masking) NOT applicable - processes only public government data,
 * no sensitive data requiring masking. Journalist/OSINT platform covering public officials.
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_URL = 'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/extraction_summary_report.csv';
const CACHE_FILE = path.join(__dirname, '..', 'cia-data', 'production-stats.json');
const CACHE_MAX_AGE_HOURS = 24;

/**
 * Parse CSV text into array of objects
 * @param {string} csvText - Raw CSV text
 * @returns {Array<Object>} Parsed rows
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) {
    throw new Error('Empty CSV file');
  }

  const headers = lines[0].split(',');
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }

  return data;
}

/**
 * Fetch CSV from URL via HTTPS
 * @param {string} url - CSV URL
 * @returns {Promise<string>} CSV text
 */
function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'riksdagsmonitor-stats-loader/1.0'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Extract key statistics from parsed CSV data
 * @param {Array<Object>} data - Parsed CSV rows
 * @returns {Object} Statistics object
 */
function extractStatistics(data) {
  const stats = {
    metadata: {
      source_url: CSV_URL,
      last_updated: null,
      extraction_time: null,
      generated_at: new Date().toISOString(),
      version: '1.0.0'
    },
    counts: {
      total_persons: 0,
      total_votes: 0,
      total_documents: 0,
      total_committee_documents: 0,
      total_rule_violations: 0,
      total_against_proposals: 0,
      total_committee_proposals: 0,
      total_document_activities: 0
    },
    tables: {
      success: [],
      empty: []
    }
  };

  // Key tables mapping
  const keyTables = {
    'person_data': 'total_persons',
    'vote_data': 'total_votes',
    'document_data': 'total_documents',
    'committee_document_data': 'total_committee_documents',
    'rule_violation': 'total_rule_violations',
    'against_proposal_data': 'total_against_proposals',
    'committee_proposal_data': 'total_committee_proposals',
    'document_activity_data': 'total_document_activities'
  };

  // Process each row
  data.forEach((row) => {
    const { object_type, object_name, status, row_count, extraction_time } = row;

    // Track extraction time (use latest timestamp)
    if (extraction_time && (!stats.metadata.extraction_time || extraction_time > stats.metadata.extraction_time)) {
      stats.metadata.extraction_time = extraction_time;
      stats.metadata.last_updated = extraction_time;
    }

    // Only process table types
    if (object_type === 'table') {
      if (status === 'success') {
        const count = parseInt(row_count, 10) || 0;
        stats.tables.success.push({
          name: object_name,
          count: count
        });

        // Extract key statistics
        if (keyTables[object_name]) {
          stats.counts[keyTables[object_name]] = count;
        }
      } else if (status === 'empty') {
        stats.tables.empty.push(object_name);
      }
    }
  });

  return stats;
}

/**
 * Check if cached data is fresh
 * @param {string} cacheFile - Path to cache file
 * @param {number} maxAgeHours - Maximum cache age in hours
 * @returns {Object|null} Cached data if fresh, null otherwise
 */
function getCachedData(cacheFile, maxAgeHours) {
  try {
    if (!fs.existsSync(cacheFile)) {
      return null;
    }

    const stats = fs.statSync(cacheFile);
    const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);

    if (ageHours > maxAgeHours) {
      console.log(`Cache expired (${ageHours.toFixed(1)} hours old, max ${maxAgeHours} hours)`);
      return null;
    }

    const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    console.log(`Using cached data (${ageHours.toFixed(1)} hours old)`);
    return data;
  } catch (err) {
    console.warn(`Failed to read cache: ${err.message}`);
    return null;
  }
}

/**
 * Save statistics to cache file
 * @param {string} cacheFile - Path to cache file
 * @param {Object} data - Statistics data
 */
function saveCache(cacheFile, data) {
  try {
    const dir = path.dirname(cacheFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Cache saved: ${cacheFile}`);
  } catch (err) {
    console.error(`Failed to save cache: ${err.message}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(80));
  console.log('CIA Production Statistics Loader');
  console.log('='.repeat(80));
  console.log();

  // Check for fresh cache first
  const cachedData = getCachedData(CACHE_FILE, CACHE_MAX_AGE_HOURS);
  if (cachedData) {
    console.log('✅ Using cached statistics');
    console.log();
    console.log('Key Statistics:');
    console.log(`  Total Persons: ${cachedData.counts.total_persons.toLocaleString()}`);
    console.log(`  Total Votes: ${cachedData.counts.total_votes.toLocaleString()}`);
    console.log(`  Total Documents: ${cachedData.counts.total_documents.toLocaleString()}`);
    console.log(`  Total Rule Violations: ${cachedData.counts.total_rule_violations.toLocaleString()}`);
    console.log();
    console.log(`Last Updated: ${cachedData.metadata.last_updated}`);
    console.log();
    return cachedData;
  }

  console.log(`Fetching: ${CSV_URL}`);
  console.log();

  try {
    // Fetch CSV
    const csvText = await fetchCSV(CSV_URL);
    console.log(`✅ Downloaded: ${csvText.length.toLocaleString()} bytes`);

    // Parse CSV
    const parsedData = parseCSV(csvText);
    console.log(`✅ Parsed: ${parsedData.length} rows`);

    // Extract statistics
    const stats = extractStatistics(parsedData);
    console.log('✅ Statistics extracted');
    console.log();

    // Display key statistics
    console.log('Key Statistics:');
    console.log(`  Total Persons: ${stats.counts.total_persons.toLocaleString()}`);
    console.log(`  Total Votes: ${stats.counts.total_votes.toLocaleString()}`);
    console.log(`  Total Documents: ${stats.counts.total_documents.toLocaleString()}`);
    console.log(`  Total Committee Documents: ${stats.counts.total_committee_documents.toLocaleString()}`);
    console.log(`  Total Rule Violations: ${stats.counts.total_rule_violations.toLocaleString()}`);
    console.log(`  Total Against Proposals: ${stats.counts.total_against_proposals.toLocaleString()}`);
    console.log(`  Total Committee Proposals: ${stats.counts.total_committee_proposals.toLocaleString()}`);
    console.log(`  Total Document Activities: ${stats.counts.total_document_activities.toLocaleString()}`);
    console.log();
    console.log(`Successful Tables: ${stats.tables.success.length}`);
    console.log(`Empty Tables: ${stats.tables.empty.length}`);
    console.log();
    console.log(`Last Extraction: ${stats.metadata.extraction_time}`);
    console.log();

    // Save to cache
    saveCache(CACHE_FILE, stats);
    console.log('✅ Statistics saved');
    console.log();

    return stats;
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log();

    // Try to use stale cache as fallback
    try {
      const staleCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      console.log('⚠️  Using stale cached data as fallback');
      console.log(`   Cache age: ${((Date.now() - new Date(staleCache.metadata.generated_at).getTime()) / (1000 * 60 * 60)).toFixed(1)} hours`);
      console.log();
      return staleCache;
    } catch (cacheErr) {
      console.error('❌ No cache available, using default values');
      console.log();
      
      // Return default values
      return {
        metadata: {
          source_url: CSV_URL,
          last_updated: null,
          extraction_time: null,
          generated_at: new Date().toISOString(),
          version: '1.0.0',
          error: err.message
        },
        counts: {
          total_persons: 349, // Fallback to current website value
          total_votes: 0,
          total_documents: 0,
          total_committee_documents: 0,
          total_rule_violations: 0,
          total_against_proposals: 0,
          total_committee_proposals: 0,
          total_document_activities: 0
        },
        tables: {
          success: [],
          empty: []
        }
      };
    }
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

export { main as loadCIAStats, extractStatistics, parseCSV, fetchCSV };
