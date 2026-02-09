#!/usr/bin/env node

/**
 * CIA Schema Update Detection Script
 * 
 * Checks if CIA schemas have been updated in the upstream repository
 * by comparing remote schema checksums with local versions.
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base URL for CIA schemas
const CIA_SCHEMA_BASE_URL = 'https://raw.githubusercontent.com/Hack23/cia/master/json-export-specs/schemas/';

// All CIA schema names
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

class CIASchemaUpdateChecker {
  constructor() {
    this.schemasDir = path.join(__dirname, '..', 'schemas', 'cia');
    this.metadataDir = path.join(__dirname, '..', 'schemas', 'metadata');
    this.updates = [];
    this.errors = [];
  }

  /**
   * Calculate SHA256 hash of schema content
   */
  calculateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Fetch remote schema hash
   */
  async fetchRemoteSchemaHash(schemaName) {
    const url = `${CIA_SCHEMA_BASE_URL}${schemaName}.schema.json`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const content = await response.text();
      const hash = this.calculateHash(content);
      
      return { content, hash };
    } catch (error) {
      throw new Error(`Failed to fetch ${schemaName}: ${error.message}`);
    }
  }

  /**
   * Load local schema hash
   */
  async loadLocalSchemaHash(schemaName) {
    const schemaPath = path.join(this.schemasDir, `${schemaName}.schema.json`);
    
    try {
      const content = await fs.readFile(schemaPath, 'utf8');
      const hash = this.calculateHash(content);
      return { content, hash };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // Schema doesn't exist locally
      }
      throw error;
    }
  }

  /**
   * Check a single schema for updates
   */
  async checkSchemaUpdate(schemaName) {
    console.log(`🔍 Checking: ${schemaName}...`);
    
    try {
      // Fetch remote and local hashes
      const remote = await this.fetchRemoteSchemaHash(schemaName);
      const local = await this.loadLocalSchemaHash(schemaName);
      
      if (!local) {
        console.log(`   🆕 New schema: ${schemaName}`);
        this.updates.push({
          schema: schemaName,
          type: 'new',
          remoteHash: remote.hash
        });
        return;
      }
      
      if (remote.hash !== local.hash) {
        console.log(`   📝 Updated: ${schemaName}`);
        this.updates.push({
          schema: schemaName,
          type: 'updated',
          localHash: local.hash,
          remoteHash: remote.hash
        });
        return;
      }
      
      console.log(`   ✅ Up to date: ${schemaName}`);
    } catch (error) {
      console.error(`   ❌ Error: ${schemaName} - ${error.message}`);
      this.errors.push({
        schema: schemaName,
        error: error.message
      });
    }
  }

  /**
   * Check all schemas for updates
   */
  async checkAllSchemas() {
    console.log('🔄 CIA Schema Update Check');
    console.log('='.repeat(50));
    console.log(`📋 Checking ${CIA_SCHEMAS.length} schemas`);
    console.log('');

    for (const schemaName of CIA_SCHEMAS) {
      await this.checkSchemaUpdate(schemaName);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Save update report
    await this.saveUpdateReport();

    // Print summary
    this.printSummary();

    // Return exit code
    return this.updates.length > 0 ? 1 : 0; // Exit 1 if updates available
  }

  /**
   * Save update report
   */
  async saveUpdateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      updatesAvailable: this.updates.length > 0,
      updateCount: this.updates.length,
      errorCount: this.errors.length,
      updates: this.updates,
      errors: this.errors
    };

    const reportPath = path.join(this.metadataDir, 'update-check.json');
    await fs.mkdir(this.metadataDir, { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

    // Output for GitHub Actions
    if (process.env.GITHUB_OUTPUT) {
      const outputLine = `updates=${this.updates.length > 0 ? 'true' : 'false'}\n`;
      await fs.appendFile(process.env.GITHUB_OUTPUT, outputLine, 'utf8');
    }
  }

  /**
   * Print summary
   */
  printSummary() {
    console.log('');
    console.log('='.repeat(50));
    console.log('📊 Update Check Summary');
    console.log('='.repeat(50));
    
    const newSchemas = this.updates.filter(u => u.type === 'new');
    const updatedSchemas = this.updates.filter(u => u.type === 'updated');
    
    console.log(`🆕 New schemas: ${newSchemas.length}`);
    console.log(`📝 Updated schemas: ${updatedSchemas.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.updates.length > 0) {
      console.log('');
      console.log('📋 Schemas with updates:');
      for (const update of this.updates) {
        const icon = update.type === 'new' ? '🆕' : '📝';
        console.log(`   ${icon} ${update.schema}`);
      }
      console.log('');
      console.log('💡 Run "npm run sync-schemas" to update local schemas');
    } else {
      console.log('');
      console.log('✅ All schemas are up to date');
    }
    
    if (this.errors.length > 0) {
      console.log('');
      console.log('⚠️  Errors encountered:');
      for (const error of this.errors) {
        console.log(`   - ${error.schema}: ${error.error}`);
      }
    }
    
    console.log('');
    console.log(`📄 Report saved to: ${path.join(this.metadataDir, 'update-check.json')}`);
    console.log('='.repeat(50));
  }
}

// Main execution
async function main() {
  try {
    const checker = new CIASchemaUpdateChecker();
    const exitCode = await checker.checkAllSchemas();
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

export default CIASchemaUpdateChecker;
