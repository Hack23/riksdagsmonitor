#!/usr/bin/env node

/**
 * CIA Schema Type Generation Script
 * 
 * Generates TypeScript type definitions from CIA JSON schemas.
 * Optional feature for projects that want type safety.
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { compile } from 'json-schema-to-typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CIATypeGenerator {
  constructor() {
    this.schemasDir = path.join(__dirname, '..', 'schemas', 'cia');
    this.typesDir = path.join(__dirname, '..', 'types');
    this.results = {
      generated: [],
      failed: []
    };
  }

  /**
   * Generate TypeScript types from a single schema
   */
  async generateTypesForSchema(schemaFile) {
    const schemaName = schemaFile.replace('.schema.json', '');
    console.log(`📝 Generating types for: ${schemaName}...`);
    
    try {
      const schemaPath = path.join(this.schemasDir, schemaFile);
      const schemaContent = await fs.readFile(schemaPath, 'utf8');
      const schema = JSON.parse(schemaContent);
      
      // Generate TypeScript types
      const types = await compile(schema, schemaName, {
        bannerComment: `/**
 * Auto-generated TypeScript types from CIA JSON Schema
 * Schema: ${schemaFile}
 * Generated: ${new Date().toISOString()}
 * 
 * DO NOT EDIT MANUALLY - This file is auto-generated
 * Run 'npm run generate-types' to regenerate
 */`,
        style: {
          semi: true,
          singleQuote: true,
          tabWidth: 2
        }
      });
      
      // Save types to file
      const typesPath = path.join(this.typesDir, `${schemaName}.d.ts`);
      await fs.writeFile(typesPath, types, 'utf8');
      
      console.log(`   ✅ Generated: ${schemaName}.d.ts`);
      this.results.generated.push(schemaName);
      
      return true;
    } catch (error) {
      console.error(`   ❌ Failed: ${schemaName} - ${error.message}`);
      this.results.failed.push({
        schema: schemaName,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Generate types for all CIA schemas
   */
  async generateAllTypes() {
    console.log('📝 CIA Type Generation');
    console.log('=' .repeat(50));
    console.log(`📁 Schemas directory: ${this.schemasDir}`);
    console.log(`📁 Types directory: ${this.typesDir}`);
    console.log('');

    // Ensure types directory exists
    await fs.mkdir(this.typesDir, { recursive: true });

    // Get all schema files
    let schemaFiles;
    try {
      const files = await fs.readdir(this.schemasDir);
      schemaFiles = files.filter(f => f.endsWith('.schema.json'));
    } catch (error) {
      console.error('❌ Could not read schemas directory');
      console.error('   Run "npm run sync-schemas" first to download schemas');
      return 1;
    }

    if (schemaFiles.length === 0) {
      console.log('⚠️  No schema files found');
      console.log('   Run "npm run sync-schemas" first to download schemas');
      return 1;
    }

    console.log(`📊 Found ${schemaFiles.length} schema file(s)`);
    console.log('');

    // Generate types for each schema
    for (const schemaFile of schemaFiles) {
      await this.generateTypesForSchema(schemaFile);
    }

    // Create index file
    await this.createIndexFile();

    // Print summary
    this.printSummary();

    // Return exit code
    return this.results.failed.length === 0 ? 0 : 1;
  }

  /**
   * Create index.d.ts that exports all types
   */
  async createIndexFile() {
    const imports = this.results.generated
      .map(name => `export * from './${name}';`)
      .join('\n');

    const indexContent = `/**
 * CIA Data Types - Index
 * Auto-generated from CIA JSON Schemas
 * Generated: ${new Date().toISOString()}
 * 
 * DO NOT EDIT MANUALLY
 */

${imports}
`;

    const indexPath = path.join(this.typesDir, 'index.d.ts');
    await fs.writeFile(indexPath, indexContent, 'utf8');
    
    console.log('');
    console.log('📦 Created index.d.ts');
  }

  /**
   * Print generation summary
   */
  printSummary() {
    console.log('');
    console.log('=' .repeat(50));
    console.log('📊 Type Generation Summary');
    console.log('=' .repeat(50));
    console.log(`✅ Generated: ${this.results.generated.length}`);
    console.log(`❌ Failed: ${this.results.failed.length}`);
    
    if (this.results.failed.length > 0) {
      console.log('');
      console.log('⚠️  Failed generations:');
      for (const failure of this.results.failed) {
        console.log(`   - ${failure.schema}: ${failure.error}`);
      }
    }
    
    console.log('');
    console.log(`📁 Types saved to: ${this.typesDir}`);
    console.log('=' .repeat(50));
    console.log('');
    console.log('💡 Usage:');
    console.log('   import type { OverviewDashboard } from "./types/overview-dashboard";');
    console.log('   import type * as CIATypes from "./types";');
  }
}

// Main execution
async function main() {
  try {
    const generator = new CIATypeGenerator();
    const exitCode = await generator.generateAllTypes();
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

export default CIATypeGenerator;
