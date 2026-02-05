#!/usr/bin/env node

/**
 * CIA Schema Synchronization Script
 * 
 * Fetches all 19 JSON schemas from the CIA repository and stores them locally
 * for validation and type generation purposes.
 * 
 * CIA Repository: https://github.com/Hack23/cia
 * Schema Location: /json-export-specs/schemas/
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base URL for CIA schemas (raw GitHub content)
const CIA_SCHEMA_BASE_URL = 'https://raw.githubusercontent.com/Hack23/cia/master/json-export-specs/schemas/';

// All 19 CIA data products with their schema names
const CIA_SCHEMAS = [
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
  'ministry-performance'
];

class CIASchemaSync {
  constructor() {
    this.schemasDir = path.join(__dirname, '..', 'schemas', 'cia');
    this.metadataDir = path.join(__dirname, '..', 'schemas', 'metadata');
    this.results = {
      synced: [],
      failed: [],
      total: CIA_SCHEMAS.length
    };
  }

  /**
   * Fetch a single schema from CIA repository
   */
  async fetchSchema(schemaName) {
    const url = `${CIA_SCHEMA_BASE_URL}${schemaName}.schema.json`;
    
    console.log(`📥 Fetching: ${schemaName}...`);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const schema = await response.json();
      
      // Validate it's a valid JSON schema
      if (!schema.$schema && !schema.$id && !schema.type) {
        throw new Error('Invalid JSON schema format');
      }
      
      // Save schema to local file
      const schemaPath = path.join(this.schemasDir, `${schemaName}.schema.json`);
      await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2), 'utf8');
      
      console.log(`   ✅ Synced: ${schemaName}`);
      this.results.synced.push({
        name: schemaName,
        url: url,
        size: JSON.stringify(schema).length,
        timestamp: new Date().toISOString()
      });
      
      return schema;
    } catch (error) {
      console.error(`   ❌ Failed: ${schemaName} - ${error.message}`);
      this.results.failed.push({
        name: schemaName,
        url: url,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return null;
    }
  }

  /**
   * Sync all CIA schemas
   */
  async syncAllSchemas() {
    console.log('🔄 CIA Schema Synchronization');
    console.log('=' .repeat(50));
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
      await new Promise(resolve => setTimeout(resolve, 100));
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
  async saveMetadata() {
    const metadata = {
      lastSync: new Date().toISOString(),
      source: CIA_SCHEMA_BASE_URL,
      totalSchemas: this.results.total,
      syncedCount: this.results.synced.length,
      failedCount: this.results.failed.length,
      schemas: this.results.synced,
      failures: this.results.failed
    };

    const metadataPath = path.join(this.metadataDir, 'last-sync.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

    // Create schema versions file
    const versions = {};
    for (const result of this.results.synced) {
      const schemaPath = path.join(this.schemasDir, `${result.name}.schema.json`);
      const schema = JSON.parse(await fs.readFile(schemaPath, 'utf8'));
      versions[result.name] = {
        version: schema.version || '1.0.0',
        $schema: schema.$schema || 'http://json-schema.org/draft-07/schema#',
        lastUpdated: result.timestamp
      };
    }

    const versionsPath = path.join(this.metadataDir, 'schema-versions.json');
    await fs.writeFile(versionsPath, JSON.stringify(versions, null, 2), 'utf8');
  }

  /**
   * Print synchronization summary
   */
  printSummary() {
    console.log('');
    console.log('=' .repeat(50));
    console.log('📊 Synchronization Summary');
    console.log('=' .repeat(50));
    console.log(`✅ Successfully synced: ${this.results.synced.length}/${this.results.total}`);
    console.log(`❌ Failed: ${this.results.failed.length}/${this.results.total}`);
    
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
    console.log('=' .repeat(50));
  }
}

// Main execution
async function main() {
  try {
    const syncer = new CIASchemaSync();
    const exitCode = await syncer.syncAllSchemas();
    process.exit(exitCode);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default CIASchemaSync;
