#!/usr/bin/env node

/**
 * @module Infrastructure/DataSync
 * @category Intelligence Operations / Supporting Infrastructure
 * @name CIA CSV Data Synchronization - Upstream Sample Data Caching System
 *
 * @description
 * Automated CSV synchronization system fetching and caching all CSV sample-data
 * files from the CIA GitHub repository (`service.data.impl/sample-data/`).
 * Maintains local copies of CIA data exports for visualization, analysis, and
 * data consistency verification. Enables offline operation and faster data
 * consumption compared to remote fetching.
 *
 * Usage:
 *   npx tsx scripts/sync-cia-schemas.ts
 *
 * @author Hack23 AB (Data Infrastructure Team)
 * @license Apache-2.0
 * @version 2.0.0
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

// Base URL for CIA sample-data CSV files (raw GitHub content)
const CIA_CSV_BASE_URL: string =
  'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/';

// All CSV files available in CIA's service.data.impl/sample-data/
const CIA_CSV_FILES: readonly string[] = [
  'distribution_party_members',
  'distribution_person_status',
  'distribution_table_sizes',
  'distribution_view_sizes',
  'extraction_statistics',
  'extraction_summary_report',
  'problematic_views',
  'report_empty_views',
  'report_timeout_views',
  'sample_data_manifest',
  'summary_analytical_views',
  'summary_extraction_types',
  'summary_temporal_coverage',
  'table_agency_sample',
  'table_data_element_sample',
  'table_portal_sample',
  'table_qrtz_locks_sample',
  'table_qrtz_triggers_sample',
  'table_topic_sample',
  'table_topics_sample',
  'table_user_account_sample',
  'trend_annual_documents',
  'trend_monthly_documents',
  'validate_risk_comparison',
  'validate_risk_distribution',
  'validate_risk_gini',
  'validate_risk_scores',
  'validate_risk_targets',
  'validation_summary',
  'view_column_mapping',
] as const;

/** Result entry for a successfully synced CSV file. */
interface SyncedFile {
  name: string;
  url: string;
  size: number;
  timestamp: string;
}

/** Result entry for a CSV file that failed to sync. */
interface FailedFile {
  name: string;
  url: string;
  error: string;
  timestamp: string;
}

/** Aggregate results of a synchronization run. */
interface SyncResults {
  synced: SyncedFile[];
  failed: FailedFile[];
  total: number;
}

/** Persisted metadata written after a sync run. */
interface SyncMetadata {
  lastSync: string;
  source: string;
  totalSchemas: number;
  syncedCount: number;
  failedCount: number;
  schemas: SyncedFile[];
  failures: FailedFile[];
}

class CIASchemaSync {
  private readonly dataDir: string;
  private readonly metadataDir: string;
  private readonly results: SyncResults;

  constructor() {
    this.dataDir = path.join(__dirname, '..', 'cia-data');
    this.metadataDir = path.join(__dirname, '..', 'schemas', 'metadata');
    this.results = {
      synced: [],
      failed: [],
      total: CIA_CSV_FILES.length,
    };
  }

  /**
   * Fetch a single CSV file from the CIA repository
   */
  async fetchCsvFile(fileName: string): Promise<string | null> {
    const url = `${CIA_CSV_BASE_URL}${fileName}.csv`;

    console.log(`📥 Fetching: ${fileName}...`);

    try {
      const response: Response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content: string = await response.text();

      // Validate it has at least a header line
      const lines = content.trim().split('\n');
      if (lines.length === 0 || lines[0].trim() === '') {
        throw new Error('Empty or invalid CSV file');
      }

      // Save CSV to local file
      const filePath: string = path.join(this.dataDir, `${fileName}.csv`);
      await fs.writeFile(filePath, content, 'utf8');

      console.log(`   ✅ Synced: ${fileName}`);
      this.results.synced.push({
        name: fileName,
        url: url,
        size: content.length,
        timestamp: new Date().toISOString(),
      });

      return content;
    } catch (error: unknown) {
      console.error(
        `   ❌ Failed: ${fileName} - ${(error as Error).message}`,
      );
      this.results.failed.push({
        name: fileName,
        url: url,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
      return null;
    }
  }

  /**
   * Sync all CIA CSV files
   */
  async syncAllSchemas(): Promise<number> {
    console.log('🔄 CIA CSV Data Synchronization');
    console.log('='.repeat(50));
    console.log(`📋 Total CSV files: ${CIA_CSV_FILES.length}`);
    console.log(`🎯 Source: ${CIA_CSV_BASE_URL}`);
    console.log('');

    // Ensure directories exist
    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.mkdir(this.metadataDir, { recursive: true });

    // Fetch all CSV files
    for (const fileName of CIA_CSV_FILES) {
      await this.fetchCsvFile(fileName);
      // Small delay to avoid rate limiting
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
    }

    // Save metadata
    await this.saveMetadata();

    // Print summary
    this.printSummary();

    // Return exit code
    return this.results.failed.length === 0 ? 0 : 1;
  }

  /**
   * Save synchronization metadata
   */
  async saveMetadata(): Promise<void> {
    const metadata: SyncMetadata = {
      lastSync: new Date().toISOString(),
      source: CIA_CSV_BASE_URL,
      totalSchemas: this.results.total,
      syncedCount: this.results.synced.length,
      failedCount: this.results.failed.length,
      schemas: this.results.synced,
      failures: this.results.failed,
    };

    const metadataPath: string = path.join(this.metadataDir, 'last-sync.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  }

  /**
   * Print synchronization summary
   */
  printSummary(): void {
    console.log('');
    console.log('='.repeat(50));
    console.log('📊 Synchronization Summary');
    console.log('='.repeat(50));
    console.log(
      `✅ Successfully synced: ${this.results.synced.length}/${this.results.total}`,
    );
    console.log(
      `❌ Failed: ${this.results.failed.length}/${this.results.total}`,
    );

    if (this.results.failed.length > 0) {
      console.log('');
      console.log('⚠️  Failed files:');
      for (const failure of this.results.failed) {
        console.log(`   - ${failure.name}: ${failure.error}`);
      }
    }

    console.log('');
    console.log(`📁 CSV files saved to: ${this.dataDir}`);
    console.log(`📋 Metadata saved to: ${this.metadataDir}`);
    console.log('='.repeat(50));
  }
}

// Main execution
async function main(): Promise<void> {
  try {
    const syncer = new CIASchemaSync();
    const exitCode: number = await syncer.syncAllSchemas();
    process.exit(exitCode);
  } catch (error: unknown) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default CIASchemaSync;
