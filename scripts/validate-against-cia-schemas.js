#!/usr/bin/env node

/**
 * CIA Schema Validation Script
 * 
 * Validates CIA data exports against their respective JSON schemas using Ajv.
 * Supports validation of individual exports or all exports in the data directory.
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CIASchemaValidator {
  constructor() {
    this.schemasDir = path.join(__dirname, '..', 'schemas', 'cia');
    this.dataDir = path.join(__dirname, '..', 'data', 'cia-exports', 'current');
    this.ajv = new Ajv({ 
      allErrors: true, 
      verbose: true,
      strict: false  // Allow additional properties not in schema
    });
    addFormats(this.ajv);
    this.results = [];
  }

  /**
   * Load a CIA schema by product name
   */
  async loadCIASchema(productName) {
    const schemaPath = path.join(this.schemasDir, `${productName}.schema.json`);
    
    try {
      const schemaContent = await fs.readFile(schemaPath, 'utf8');
      return JSON.parse(schemaContent);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Schema not found: ${productName}.schema.json (run npm run sync-schemas first)`);
      }
      throw error;
    }
  }

  /**
   * Validate a single export against its schema
   */
  async validateExport(productName, data) {
    console.log(`🔍 Validating: ${productName}...`);
    
    try {
      // Load schema
      const schema = await this.loadCIASchema(productName);
      
      // Compile schema
      const validate = this.ajv.compile(schema);
      
      // Validate data
      const valid = validate(data);
      
      if (!valid) {
        console.log(`   ❌ Validation failed for ${productName}`);
        console.log(`   Errors (${validate.errors.length}):`);
        
        // Show first 5 errors
        const displayErrors = validate.errors.slice(0, 5);
        for (const error of displayErrors) {
          console.log(`      - ${error.instancePath || '/'}: ${error.message}`);
          if (error.params && Object.keys(error.params).length > 0) {
            console.log(`        Params: ${JSON.stringify(error.params)}`);
          }
        }
        
        if (validate.errors.length > 5) {
          console.log(`      ... and ${validate.errors.length - 5} more errors`);
        }
        
        this.results.push({
          product: productName,
          valid: false,
          errorCount: validate.errors.length,
          errors: validate.errors
        });
        
        return false;
      }
      
      console.log(`   ✅ Valid: ${productName}`);
      this.results.push({
        product: productName,
        valid: true,
        errorCount: 0
      });
      
      return true;
    } catch (error) {
      console.log(`   ❌ Error: ${productName} - ${error.message}`);
      this.results.push({
        product: productName,
        valid: false,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Validate all CIA exports in the data directory
   */
  async validateAllExports() {
    console.log('🔍 CIA Data Validation');
    console.log('=' .repeat(50));
    console.log(`📁 Data directory: ${this.dataDir}`);
    console.log('');

    // Check if data directory exists
    try {
      await fs.access(this.dataDir);
    } catch (error) {
      console.log('⚠️  No data directory found - skipping validation');
      console.log('   Data will be validated when exports are available');
      return 0;
    }

    // Get all JSON files in data directory
    let exportFiles;
    try {
      const files = await fs.readdir(this.dataDir);
      exportFiles = files.filter(f => f.endsWith('.json'));
    } catch (error) {
      console.log('⚠️  Could not read data directory - skipping validation');
      return 0;
    }

    if (exportFiles.length === 0) {
      console.log('ℹ️  No export files found - nothing to validate');
      console.log('   Data will be validated when exports are available');
      return 0;
    }

    console.log(`📊 Found ${exportFiles.length} export file(s)`);
    console.log('');

    // Validate each export
    for (const exportFile of exportFiles) {
      const productName = exportFile.replace('.json', '');
      const dataPath = path.join(this.dataDir, exportFile);
      
      try {
        const dataContent = await fs.readFile(dataPath, 'utf8');
        const data = JSON.parse(dataContent);
        await this.validateExport(productName, data);
      } catch (error) {
        console.log(`   ❌ Error reading ${exportFile}: ${error.message}`);
        this.results.push({
          product: productName,
          valid: false,
          error: error.message
        });
      }
    }

    // Save validation report
    await this.saveReport();

    // Print summary
    this.printSummary();

    // Return exit code (0 if all valid, 1 if any failed)
    const failedCount = this.results.filter(r => !r.valid).length;
    return failedCount === 0 ? 0 : 1;
  }

  /**
   * Save validation report
   */
  async saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalValidated: this.results.length,
      validCount: this.results.filter(r => r.valid).length,
      invalidCount: this.results.filter(r => !r.valid).length,
      results: this.results
    };

    const reportPath = path.join(__dirname, '..', 'validation-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
  }

  /**
   * Print validation summary
   */
  printSummary() {
    console.log('');
    console.log('=' .repeat(50));
    console.log('📊 Validation Summary');
    console.log('=' .repeat(50));
    
    const validCount = this.results.filter(r => r.valid).length;
    const invalidCount = this.results.filter(r => !r.valid).length;
    
    console.log(`✅ Valid: ${validCount}/${this.results.length}`);
    console.log(`❌ Invalid: ${invalidCount}/${this.results.length}`);
    
    if (invalidCount > 0) {
      console.log('');
      console.log('⚠️  Failed validations:');
      const failed = this.results.filter(r => !r.valid);
      for (const result of failed) {
        const errorInfo = result.errorCount ? `${result.errorCount} errors` : result.error;
        console.log(`   - ${result.product}: ${errorInfo}`);
      }
    }
    
    console.log('');
    console.log('📄 Full report saved to: validation-report.json');
    console.log('=' .repeat(50));
  }
}

// Main execution
async function main() {
  try {
    const validator = new CIASchemaValidator();
    const exitCode = await validator.validateAllExports();
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

export default CIASchemaValidator;
