#!/usr/bin/env node

/**
 * @module Infrastructure/SchemaManagement
 * @category Intelligence Operations / Supporting Infrastructure
 * @name CIA Schema Synchronization - Upstream Schema Caching System
 *
 * @description
 * Automated schema synchronization system fetching and caching all 19 JSON schemas
 * from the CIA GitHub repository. Maintains local copies of data product schemas
 * for validation, type generation, and data consistency verification. Enables offline
 * operation and faster validation cycles compared to remote fetching.
 *
 * Usage:
 *   npx tsx scripts/sync-cia-schemas.ts
 *
 * @author Hack23 AB (Data Infrastructure Team)
 * @license Apache-2.0
 * @version 1.4.0
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

// Base URL for CIA schemas (raw GitHub content)
const CIA_SCHEMA_BASE_URL: string =
  'https://raw.githubusercontent.com/Hack23/cia/master/json-export-specs/schemas/';

// All 19 CIA data products with their schema names
const CIA_SCHEMAS: readonly string[] = [
  'overview-dashboard',
  'party-performance',
  'cabinet-scorecard',
  'election-analysis',
  'top10-influential-mps',
  'top10-productive-mps',
  'top10-controversial-mps',
  'top10-absent-mps',
  'top10-rebels',
  'top10-coalition-brokers',
  'top10-rising-stars',
  'top10-electoral-risk',
  'top10-ethics-concerns',
  'top10-media-presence',
  'committee-network',
  'politician-career',
  'party-longitudinal',
  'riksdag-overview',
  'ministry-performance',
] as const;

/** Result entry for a successfully synced schema. */
interface SyncedSchema {
  name: string;
  url: string;
  size: number;
  timestamp: string;
}

/** Result entry for a schema that failed to sync. */
interface FailedSchema {
  name: string;
  url: string;
  error: string;
  timestamp: string;
}

/** Aggregate results of a synchronization run. */
interface SyncResults {
  synced: SyncedSchema[];
  failed: FailedSchema[];
  total: number;
}

/** Persisted metadata written after a sync run. */
interface SyncMetadata {
  lastSync: string;
  source: string;
  totalSchemas: number;
  syncedCount: number;
  failedCount: number;
  schemas: SyncedSchema[];
  failures: FailedSchema[];
}

/** Version info tracked per schema. */
interface SchemaVersionEntry {
  version: string;
  $schema: string;
  lastUpdated: string;
}

/** Minimal shape of a JSON Schema file we fetch. */
interface JsonSchema {
  $schema?: string;
  $id?: string;
  type?: string;
  version?: string;
  properties?: Record<string, unknown>;
  [key: string]: unknown;
}

class CIASchemaSync {
  private readonly schemasDir: string;
  private readonly metadataDir: string;
  private readonly results: SyncResults;

  constructor() {
    this.schemasDir = path.join(__dirname, '..', 'schemas', 'cia');
    this.metadataDir = path.join(__dirname, '..', 'schemas', 'metadata');
    this.results = {
      synced: [],
      failed: [],
      total: CIA_SCHEMAS.length,
    };
  }

  /**
   * Fetch a single schema from CIA repository
   */
  async fetchSchema(schemaName: string): Promise<JsonSchema | null> {
    const url = `${CIA_SCHEMA_BASE_URL}${schemaName}.schema.json`;

    console.log(`📥 Fetching: ${schemaName}...`);

    try {
      const response: Response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const schema = (await response.json()) as JsonSchema;

      // Validate it's a valid JSON schema
      if (!schema.$schema && !schema.$id && !schema.type) {
        throw new Error('Invalid JSON schema format');
      }

      // Save schema to local file
      const schemaPath: string = path.join(
        this.schemasDir,
        `${schemaName}.schema.json`,
      );
      await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2), 'utf8');

      console.log(`   ✅ Synced: ${schemaName}`);
      this.results.synced.push({
        name: schemaName,
        url: url,
        size: JSON.stringify(schema).length,
        timestamp: new Date().toISOString(),
      });

      return schema;
    } catch (error: unknown) {
      console.error(
        `   ❌ Failed: ${schemaName} - ${(error as Error).message}`,
      );
      this.results.failed.push({
        name: schemaName,
        url: url,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
      return null;
    }
  }

  /**
   * Sync all CIA schemas
   */
  async syncAllSchemas(): Promise<number> {
    console.log('🔄 CIA Schema Synchronization');
    console.log('='.repeat(50));
    console.log(`📋 Total schemas: ${CIA_SCHEMAS.length}`);
    console.log(`🎯 Source: ${CIA_SCHEMA_BASE_URL}`);
    console.log('');

    // Ensure directories exist
    await fs.mkdir(this.schemasDir, { recursive: true });
    await fs.mkdir(this.metadataDir, { recursive: true });

    // Fetch all schemas
    for (const schemaName of CIA_SCHEMAS) {
      await this.fetchSchema(schemaName);
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
      source: CIA_SCHEMA_BASE_URL,
      totalSchemas: this.results.total,
      syncedCount: this.results.synced.length,
      failedCount: this.results.failed.length,
      schemas: this.results.synced,
      failures: this.results.failed,
    };

    const metadataPath: string = path.join(this.metadataDir, 'last-sync.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

    // Create schema versions file
    const versions: Record<string, SchemaVersionEntry> = {};
    for (const result of this.results.synced) {
      const schemaPath: string = path.join(
        this.schemasDir,
        `${result.name}.schema.json`,
      );
      const schema = JSON.parse(
        await fs.readFile(schemaPath, 'utf8'),
      ) as JsonSchema;
      versions[result.name] = {
        version: schema.version ?? '1.0.0',
        $schema: schema.$schema ?? 'http://json-schema.org/draft-07/schema#',
        lastUpdated: result.timestamp,
      };
    }

    const versionsPath: string = path.join(
      this.metadataDir,
      'schema-versions.json',
    );
    await fs.writeFile(
      versionsPath,
      JSON.stringify(versions, null, 2),
      'utf8',
    );
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
      console.log('⚠️  Failed schemas:');
      for (const failure of this.results.failed) {
        console.log(`   - ${failure.name}: ${failure.error}`);
      }
    }

    console.log('');
    console.log(`📁 Schemas saved to: ${this.schemasDir}`);
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
