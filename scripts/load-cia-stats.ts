/**
 * @module Intelligence Operations/CIA Statistical Intelligence
 * @category Intelligence Operations - CIA Statistical Intelligence
 *
 * @description
 * Statistical intelligence data loader providing comprehensive parliamentary and
 * government statistics from the CIA production database.
 *
 * @author Hack23 AB - Intelligence Operations Team
 * @license Apache-2.0
 * @version 2.0.0
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_URL =
  'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/extraction_summary_report.csv';
const CACHE_FILE = path.join(__dirname, '..', 'cia-data', 'production-stats.json');
const CACHE_MAX_AGE_HOURS = 24;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TableEntry {
  readonly name: string;
  readonly count: number;
}

interface StatsMetadata {
  source_url: string;
  last_updated: string | null;
  extraction_time: string | null;
  generated_at: string;
  version: string;
  error?: string;
}

interface StatsCounts {
  total_persons: number;
  total_votes: number;
  total_documents: number;
  total_committee_documents: number;
  total_rule_violations: number;
  total_against_proposals: number;
  total_committee_proposals: number;
  total_document_activities: number;
  total_political_parties: number;
  total_assignments: number;
  total_document_attachments: number;
  total_riksdag_parties: number;
  total_governments: number;
  total_government_proposals: number;
  total_government_roles: number;
  total_government_role_members: number;
  total_member_proposals: number;
  total_committee_decisions: number;
  total_committee_member_proposals: number;
  total_committee_role_members: number;
  total_committee_roles: number;
  total_party_members: number;
  total_party_role_members: number;
  total_party_summary: number;
  total_politician_documents: number;
  total_ballot_politician_summaries: number;
  total_document_content: number;
}

interface StatsData {
  metadata: StatsMetadata;
  counts: StatsCounts;
  tables: {
    success: TableEntry[];
    empty: string[];
  };
}

interface CSVRow {
  [header: string]: string;
}

// ---------------------------------------------------------------------------
// CSV Parsing
// ---------------------------------------------------------------------------

/**
 * Parse CSV text into array of objects.
 */
function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) {
    throw new Error('Empty CSV file');
  }

  const headerLine = lines[0];
  if (!headerLine) {
    throw new Error('Empty CSV header');
  }
  const headers = headerLine.split(',');
  const data: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const values = line.split(',');
    if (values.length === headers.length) {
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] ?? '';
      });
      data.push(row);
    }
  }

  return data;
}

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------

/**
 * Fetch CSV from URL via HTTPS.
 */
function fetchCSV(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'riksdagsmonitor-stats-loader/1.0',
          },
        },
        (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            return;
          }

          let data = '';
          res.on('data', (chunk: Buffer) => {
            data += chunk;
          });

          res.on('end', () => {
            resolve(data);
          });
        },
      )
      .on('error', (err: Error) => {
        reject(err);
      });
  });
}

// ---------------------------------------------------------------------------
// Statistics extraction
// ---------------------------------------------------------------------------

/**
 * Extract key statistics from parsed CSV data.
 */
function extractStatistics(data: CSVRow[]): StatsData {
  const stats: StatsData = {
    metadata: {
      source_url: CSV_URL,
      last_updated: null,
      extraction_time: null,
      generated_at: new Date().toISOString(),
      version: '1.2.0',
    },
    counts: {
      total_persons: 0,
      total_votes: 0,
      total_documents: 0,
      total_committee_documents: 0,
      total_rule_violations: 0,
      total_against_proposals: 0,
      total_committee_proposals: 0,
      total_document_activities: 0,
      total_political_parties: 0,
      total_assignments: 0,
      total_document_attachments: 0,
      total_riksdag_parties: 0,
      total_governments: 0,
      total_government_proposals: 0,
      total_government_roles: 0,
      total_government_role_members: 0,
      total_member_proposals: 0,
      total_committee_decisions: 0,
      total_committee_member_proposals: 0,
      total_committee_role_members: 0,
      total_committee_roles: 0,
      total_party_members: 0,
      total_party_role_members: 0,
      total_party_summary: 0,
      total_politician_documents: 0,
      total_ballot_politician_summaries: 0,
      total_document_content: 0,
    },
    tables: {
      success: [],
      empty: [],
    },
  };

  // Key tables mapping to stat counts
  const keyTables: Readonly<Record<string, keyof StatsCounts>> = {
    person_data: 'total_persons',
    vote_data: 'total_votes',
    document_data: 'total_documents',
    committee_document_data: 'total_committee_documents',
    rule_violation: 'total_rule_violations',
    against_proposal_data: 'total_against_proposals',
    committee_proposal_data: 'total_committee_proposals',
    document_activity_data: 'total_document_activities',
    sweden_political_party: 'total_political_parties',
    assignment_data: 'total_assignments',
    document_attachment: 'total_document_attachments',
    document_content_data: 'total_document_content',
  };

  // Key views mapping
  const keyViews: Readonly<Record<string, keyof StatsCounts>> = {
    view_riksdagen_party: 'total_riksdag_parties',
    view_riksdagen_goverment: 'total_governments',
    view_riksdagen_goverment_proposals: 'total_government_proposals',
    view_riksdagen_goverment_roles: 'total_government_roles',
    view_riksdagen_goverment_role_member: 'total_government_role_members',
    view_riksdagen_member_proposals: 'total_member_proposals',
    view_riksdagen_committee_decisions: 'total_committee_decisions',
    view_riksdagen_committee_parliament_member_proposal: 'total_committee_member_proposals',
    view_riksdagen_committee_role_member: 'total_committee_role_members',
    view_riksdagen_committee_roles: 'total_committee_roles',
    view_riksdagen_party_member: 'total_party_members',
    view_riksdagen_party_role_member: 'total_party_role_members',
    view_riksdagen_party_summary: 'total_party_summary',
    view_riksdagen_politician_document: 'total_politician_documents',
    view_riksdagen_vote_data_ballot_politician_summary: 'total_ballot_politician_summaries',
  };

  // Process each row
  data.forEach((row) => {
    const objectType = row['object_type'] ?? '';
    const objectName = row['object_name'] ?? '';
    const status = row['status'] ?? '';
    const rowCount = row['row_count'] ?? '0';
    const extractionTime = row['extraction_time'] ?? '';

    // Track extraction time (use latest timestamp)
    if (extractionTime && (!stats.metadata.extraction_time || extractionTime > stats.metadata.extraction_time)) {
      stats.metadata.extraction_time = extractionTime;
      stats.metadata.last_updated = extractionTime;
    }

    // Process tables and views with success status
    if (status === 'success') {
      const count = parseInt(rowCount, 10) || 0;

      if (objectType === 'table') {
        stats.tables.success.push({
          name: objectName,
          count,
        });

        const tableCountKey = keyTables[objectName];
        if (tableCountKey) {
          (stats.counts as unknown as Record<string, number>)[tableCountKey] = count;
        }
      } else if (objectType === 'view') {
        const viewCountKey = keyViews[objectName];
        if (viewCountKey) {
          (stats.counts as unknown as Record<string, number>)[viewCountKey] = count;
        }
      }
    } else if (status === 'empty' && objectType === 'table') {
      stats.tables.empty.push(objectName);
    }
  });

  return stats;
}

// ---------------------------------------------------------------------------
// Cache Management
// ---------------------------------------------------------------------------

/**
 * Check if cached data is fresh.
 */
function getCachedData(cacheFile: string, maxAgeHours: number): StatsData | null {
  try {
    if (!fs.existsSync(cacheFile)) {
      return null;
    }

    const fileStats = fs.statSync(cacheFile);
    const ageHours = (Date.now() - fileStats.mtimeMs) / (1000 * 60 * 60);

    if (ageHours > maxAgeHours) {
      console.log(`Cache expired (${ageHours.toFixed(1)} hours old, max ${maxAgeHours} hours)`);
      return null;
    }

    const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8')) as StatsData;
    console.log(`Using cached data (${ageHours.toFixed(1)} hours old)`);
    return data;
  } catch (err: unknown) {
    console.warn(`Failed to read cache: ${(err as Error).message}`);
    return null;
  }
}

/**
 * Save statistics to cache file.
 */
function saveCache(cacheFile: string, data: StatsData): void {
  try {
    const dir = path.dirname(cacheFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Cache saved: ${cacheFile}`);
  } catch (err: unknown) {
    console.error(`Failed to save cache: ${(err as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Main execution.
 */
async function main(): Promise<StatsData> {
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
    console.log(`  Governments: ${(cachedData.counts.total_governments || 0).toLocaleString()}`);
    console.log(`  Government Proposals: ${(cachedData.counts.total_government_proposals || 0).toLocaleString()}`);
    console.log(`  Committee Decisions: ${(cachedData.counts.total_committee_decisions || 0).toLocaleString()}`);
    console.log(`  Member Proposals: ${(cachedData.counts.total_member_proposals || 0).toLocaleString()}`);
    console.log();
    console.log(`Last Updated: ${cachedData.metadata.last_updated}`);
    console.log();
    return cachedData;
  }

  console.log(`Fetching: ${CSV_URL}`);
  console.log();

  try {
    const csvText = await fetchCSV(CSV_URL);
    console.log(`✅ Downloaded: ${csvText.length.toLocaleString()} bytes`);

    const parsedData = parseCSV(csvText);
    console.log(`✅ Parsed: ${parsedData.length} rows`);

    const stats = extractStatistics(parsedData);
    console.log('✅ Statistics extracted');
    console.log();

    console.log('Key Statistics (Tables):');
    console.log(`  Total Persons: ${stats.counts.total_persons.toLocaleString()}`);
    console.log(`  Total Votes: ${stats.counts.total_votes.toLocaleString()}`);
    console.log(`  Total Documents: ${stats.counts.total_documents.toLocaleString()}`);
    console.log(`  Total Committee Documents: ${stats.counts.total_committee_documents.toLocaleString()}`);
    console.log(`  Total Rule Violations: ${stats.counts.total_rule_violations.toLocaleString()}`);
    console.log(`  Total Against Proposals: ${stats.counts.total_against_proposals.toLocaleString()}`);
    console.log(`  Total Committee Proposals: ${stats.counts.total_committee_proposals.toLocaleString()}`);
    console.log(`  Total Document Activities: ${stats.counts.total_document_activities.toLocaleString()}`);
    console.log();
    console.log('Key Statistics (Views):');
    console.log(`  Riksdag Parties: ${stats.counts.total_riksdag_parties.toLocaleString()}`);
    console.log(`  Governments: ${stats.counts.total_governments.toLocaleString()}`);
    console.log(`  Government Proposals: ${stats.counts.total_government_proposals.toLocaleString()}`);
    console.log(`  Government Roles: ${stats.counts.total_government_roles.toLocaleString()}`);
    console.log(`  Government Role Members: ${stats.counts.total_government_role_members.toLocaleString()}`);
    console.log(`  Member Proposals: ${stats.counts.total_member_proposals.toLocaleString()}`);
    console.log(`  Committee Decisions: ${stats.counts.total_committee_decisions.toLocaleString()}`);
    console.log(`  Committee Role Members: ${stats.counts.total_committee_role_members.toLocaleString()}`);
    console.log(`  Party Members: ${stats.counts.total_party_members.toLocaleString()}`);
    console.log(`  Party Summary: ${stats.counts.total_party_summary.toLocaleString()}`);
    console.log(`  Politician Documents: ${stats.counts.total_politician_documents.toLocaleString()}`);
    console.log(`  Ballot Politician Summaries: ${stats.counts.total_ballot_politician_summaries.toLocaleString()}`);
    console.log();
    console.log(`Successful Tables: ${stats.tables.success.length}`);
    console.log(`Empty Tables: ${stats.tables.empty.length}`);
    console.log();
    console.log(`Last Extraction: ${stats.metadata.extraction_time}`);
    console.log();

    saveCache(CACHE_FILE, stats);
    console.log('✅ Statistics saved');
    console.log();

    return stats;
  } catch (err: unknown) {
    console.error('❌ Error:', (err as Error).message);
    console.log();

    // Try to use stale cache as fallback
    try {
      const staleCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) as StatsData;
      console.log('⚠️  Using stale cached data as fallback');
      console.log(
        `   Cache age: ${((Date.now() - new Date(staleCache.metadata.generated_at).getTime()) / (1000 * 60 * 60)).toFixed(1)} hours`,
      );
      console.log();
      return staleCache;
    } catch (_cacheErr: unknown) {
      console.error('❌ No cache available, using default values');
      console.log();

      return {
        metadata: {
          source_url: CSV_URL,
          last_updated: null,
          extraction_time: null,
          generated_at: new Date().toISOString(),
          version: '1.0.0',
          error: (err as Error).message,
        },
        counts: {
          total_persons: 349,
          total_votes: 0,
          total_documents: 0,
          total_committee_documents: 0,
          total_rule_violations: 0,
          total_against_proposals: 0,
          total_committee_proposals: 0,
          total_document_activities: 0,
          total_political_parties: 0,
          total_assignments: 0,
          total_document_attachments: 0,
          total_riksdag_parties: 0,
          total_governments: 0,
          total_government_proposals: 0,
          total_government_roles: 0,
          total_government_role_members: 0,
          total_member_proposals: 0,
          total_committee_decisions: 0,
          total_committee_member_proposals: 0,
          total_committee_role_members: 0,
          total_committee_roles: 0,
          total_party_members: 0,
          total_party_role_members: 0,
          total_party_summary: 0,
          total_politician_documents: 0,
          total_ballot_politician_summaries: 0,
          total_document_content: 0,
        },
        tables: {
          success: [],
          empty: [],
        },
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
    .catch((err: unknown) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

export { main as loadCIAStats, extractStatistics, parseCSV, fetchCSV };
export type { StatsData, StatsCounts, StatsMetadata, CSVRow };
