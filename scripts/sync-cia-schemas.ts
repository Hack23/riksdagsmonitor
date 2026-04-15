#!/usr/bin/env node

/**
 * @module Infrastructure/DataSync
 * @category Intelligence Operations / Supporting Infrastructure
 * @name CIA CSV Data Synchronization - In-Place Update System
 *
 * @description
 * Discovers every `.csv` file under `cia-data/` and `data/cia/` in this
 * repository, looks up the matching filename in the CIA upstream repository
 * (`service.data.impl/sample-data/`), and overwrites the local copy with the
 * latest upstream content.  **No new files are created** — only files that
 * already exist in the repository are updated.
 *
 * Usage:
 *   npx tsx scripts/sync-cia-schemas.ts
 *
 * @author Hack23 AB (Data Infrastructure Team)
 * @license Apache-2.0
 * @version 3.0.0
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

// Base URL for CIA sample-data CSV files (raw GitHub content)
const CIA_CSV_BASE_URL: string =
  'https://raw.githubusercontent.com/Hack23/cia/master/service.data.impl/sample-data/';

// Directories to scan for existing CSV files
const SCAN_DIRS: readonly string[] = ['cia-data', 'data/cia'] as const;

/** Result entry for a successfully synced CSV file. */
interface SyncedFile {
  name: string;
  localPath: string;
  url: string;
  size: number;
  timestamp: string;
}

/** Result entry for a CSV file that failed to sync. */
interface FailedFile {
  name: string;
  localPath: string;
  url: string;
  error: string;
  timestamp: string;
}

/** A CSV file skipped because it has no upstream match. */
interface SkippedFile {
  name: string;
  localPath: string;
  reason: string;
}

/** Aggregate results of a synchronization run. */
interface SyncResults {
  synced: SyncedFile[];
  failed: FailedFile[];
  skipped: SkippedFile[];
  total: number;
}

/** Persisted metadata written after a sync run. */
interface SyncMetadata {
  lastSync: string;
  source: string;
  totalFiles: number;
  syncedCount: number;
  failedCount: number;
  skippedCount: number;
  schemas: SyncedFile[];
  failures: FailedFile[];
  skipped: SkippedFile[];
}

/**
 * Recursively find all `.csv` files under `dir`.
 */
async function findCsvFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    // Directory does not exist — nothing to scan
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findCsvFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith('.csv')) {
      results.push(full);
    }
  }
  return results;
}

class CIADataSync {
  private readonly repoRoot: string;
  private readonly metadataDir: string;
  private readonly results: SyncResults;
  /** Set of basenames available upstream (populated once). */
  private upstreamFiles: Set<string> = new Set();

  constructor() {
    this.repoRoot = path.join(__dirname, '..');
    this.metadataDir = path.join(this.repoRoot, 'schemas', 'metadata');
    this.results = { synced: [], failed: [], skipped: [], total: 0 };
  }

  /**
   * Fetch the directory listing of upstream sample-data once so we know
   * which basenames are actually available before attempting downloads.
   */
  async loadUpstreamIndex(): Promise<void> {
    const apiUrl =
      'https://api.github.com/repos/Hack23/cia/contents/service.data.impl/sample-data';
    console.log('🔎 Loading upstream file index...');
    const response: Response = await fetch(apiUrl, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (!response.ok) {
      throw new Error(
        `Failed to list upstream directory: ${response.status} ${response.statusText}`,
      );
    }
    const items = (await response.json()) as Array<{ name: string }>;
    for (const item of items) {
      if (item.name.endsWith('.csv')) {
        this.upstreamFiles.add(item.name);
      }
    }
    console.log(
      `   ✅ Found ${this.upstreamFiles.size} CSV files upstream`,
    );
  }

  /**
   * Download upstream CSV and overwrite the local file at `localPath`.
   */
  async updateFile(localPath: string): Promise<void> {
    const basename: string = path.basename(localPath);
    const relPath: string = path.relative(this.repoRoot, localPath);

    // Check if this basename exists upstream
    if (!this.upstreamFiles.has(basename)) {
      console.log(`   ⏭️  Skipped (no upstream match): ${relPath}`);
      this.results.skipped.push({
        name: basename,
        localPath: relPath,
        reason: 'No matching file in CIA sample-data',
      });
      return;
    }

    const url = `${CIA_CSV_BASE_URL}${basename}`;
    console.log(`📥 Updating: ${relPath}`);

    try {
      const response: Response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content: string = await response.text();

      // Basic validation
      const lines = content.trim().split('\n');
      if (lines.length === 0 || lines[0].trim() === '') {
        throw new Error('Empty or invalid CSV file');
      }

      await fs.writeFile(localPath, content, 'utf8');

      console.log(`   ✅ Updated: ${relPath} (${content.length} bytes)`);
      this.results.synced.push({
        name: basename,
        localPath: relPath,
        url,
        size: content.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      console.error(
        `   ❌ Failed: ${relPath} - ${(error as Error).message}`,
      );
      this.results.failed.push({
        name: basename,
        localPath: relPath,
        url,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Run the full synchronization: discover ➜ download ➜ report.
   */
  async syncAll(): Promise<number> {
    console.log('🔄 CIA CSV Data Synchronization (in-place update)');
    console.log('='.repeat(60));
    console.log(`🎯 Source: ${CIA_CSV_BASE_URL}`);
    console.log('');

    // 1. Load upstream index
    await this.loadUpstreamIndex();
    console.log('');

    // 2. Discover all existing CSV files in the repo
    const localFiles: string[] = [];
    for (const dir of SCAN_DIRS) {
      const absDir = path.join(this.repoRoot, dir);
      const found = await findCsvFiles(absDir);
      localFiles.push(...found);
    }
    // Deduplicate (same basename may appear in multiple dirs — update all copies)
    localFiles.sort();
    this.results.total = localFiles.length;

    console.log(`📋 Found ${localFiles.length} existing CSV files to update`);
    console.log('');

    // 3. Update each file from upstream
    for (const filePath of localFiles) {
      await this.updateFile(filePath);
      // Small delay to avoid rate limiting
      await new Promise<void>((resolve) => setTimeout(resolve, 50));
    }

    // 4. Save metadata & print summary
    await fs.mkdir(this.metadataDir, { recursive: true });
    await this.saveMetadata();
    this.printSummary();

    // Exit 0 if at least one file synced and no failures
    return this.results.failed.length === 0 ? 0 : 1;
  }

  /**
   * Save synchronization metadata to `schemas/metadata/last-sync.json`.
   */
  async saveMetadata(): Promise<void> {
    const metadata: SyncMetadata = {
      lastSync: new Date().toISOString(),
      source: CIA_CSV_BASE_URL,
      totalFiles: this.results.total,
      syncedCount: this.results.synced.length,
      failedCount: this.results.failed.length,
      skippedCount: this.results.skipped.length,
      schemas: this.results.synced,
      failures: this.results.failed,
      skipped: this.results.skipped,
    };

    const metadataPath: string = path.join(this.metadataDir, 'last-sync.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  }

  /**
   * Print synchronization summary to stdout.
   */
  printSummary(): void {
    console.log('');
    console.log('='.repeat(60));
    console.log('📊 Synchronization Summary');
    console.log('='.repeat(60));
    console.log(`📁 Total existing CSV files: ${this.results.total}`);
    console.log(`✅ Successfully updated:     ${this.results.synced.length}`);
    console.log(`❌ Failed:                   ${this.results.failed.length}`);
    console.log(`⏭️  Skipped (no upstream):    ${this.results.skipped.length}`);

    if (this.results.failed.length > 0) {
      console.log('');
      console.log('⚠️  Failed files:');
      for (const f of this.results.failed) {
        console.log(`   - ${f.localPath}: ${f.error}`);
      }
    }

    if (this.results.skipped.length > 0) {
      console.log('');
      console.log('⏭️  Skipped files (repo-local only):');
      for (const s of this.results.skipped) {
        console.log(`   - ${s.localPath}: ${s.reason}`);
      }
    }

    console.log('');
    console.log(`📋 Metadata saved to: ${this.metadataDir}`);
    console.log('='.repeat(60));
  }
}

// Main execution
async function main(): Promise<void> {
  try {
    const syncer = new CIADataSync();
    const exitCode: number = await syncer.syncAll();
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

export default CIADataSync;
