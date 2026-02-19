/**
 * CIA CSV Data Validation Tests
 * 
 * Validates CIA Platform CSV exports for:
 * - UTF-8/ASCII encoding (no � replacement characters)
 * - Proper CSV structure with headers
 * - Required columns per schema
 * - Valid data types (numbers not NaN)
 * - Minimum file sizes (>1KB for full exports, >0.05KB for small exports)
 * - Column count consistency
 * 
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve } from 'path';

/**
 * Parse CSV content to structured data
 * @param {string} csvContent - Raw CSV text
 * @returns {Array<Object>} Parsed rows
 */
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx]?.trim() || '';
      });
      rows.push(row);
    }
  }
  
  return rows;
}

/**
 * Required CIA CSV files for dashboard functionality
 * These files must exist and be valid for dashboards to work properly
 */
const REQUIRED_CSV_FILES = [
  // Risk Dashboard
  'distribution_politician_risk_levels.csv',
  'distribution_risk_by_party.csv',
  'distribution_risk_evolution_temporal.csv',
  'distribution_crisis_resilience.csv',
  'percentile_voting_anomaly_detection.csv',
  // Note: top10_ethics_concerns.csv and top10_electoral_risk.csv may not exist
  
  // Party Dashboard
  'distribution_party_effectiveness_trends.csv',
  'distribution_party_momentum.csv',
  
  // Committee Dashboard
  'distribution_annual_committee_documents.csv',
  'distribution_committee_productivity_matrix.csv',
  
  // Ministry Dashboard
  'distribution_ministry_effectiveness.csv',
  'distribution_ministry_decision_impact.csv',
  'distribution_ministry_productivity_matrix.csv',
  'distribution_ministry_risk_levels.csv',
  'distribution_ministry_risk_quarterly.csv',
  
  // Shared/Common
  'distribution_person_status.csv',
  'distribution_experience_levels.csv',
  'distribution_experience_by_party.csv',
  'extraction_summary_report.csv'
];

/**
 * Schema definitions for required columns per CSV file
 * Column names match actual CIA CSV exports
 */
const CSV_SCHEMAS = {
  'distribution_politician_risk_levels.csv': {
    requiredColumns: ['risk_level', 'politician_count'],
    numericColumns: ['politician_count', 'percentage']
  },
  'distribution_risk_by_party.csv': {
    requiredColumns: ['party', 'risk_level', 'politician_count'],
    numericColumns: ['politician_count', 'avg_risk_score']
  },
  'distribution_party_effectiveness_trends.csv': {
    requiredColumns: ['party', 'year', 'quarter'],
    numericColumns: ['year', 'quarter']
  },
  'distribution_ministry_effectiveness.csv': {
    requiredColumns: ['ministry_name', 'year', 'quarter'],
    numericColumns: ['year', 'quarter', 'documents_produced', 'government_bills', 'active_members']
  },
  'distribution_committee_productivity_matrix.csv': {
    requiredColumns: ['committee_code', 'committee_name', 'year'],
    numericColumns: ['year', 'quarter', 'total_documents', 'active_members']
  }
  // Add more schemas as needed
};

describe('CIA CSV Data Validation', () => {
  const ciaDataPath = resolve(process.cwd(), 'cia-data');
  
  describe('File Existence', () => {
    REQUIRED_CSV_FILES.forEach(filename => {
      it(`should have ${filename}`, () => {
        const filePath = resolve(ciaDataPath, filename);
        expect(existsSync(filePath), `Missing required file: ${filename}`).toBe(true);
      });
    });
  });
  
  describe('File Size Validation', () => {
    REQUIRED_CSV_FILES.forEach(filename => {
      it(`${filename} should not be empty or too small`, () => {
        const filePath = resolve(ciaDataPath, filename);
        if (!existsSync(filePath)) {
          // Skip if file doesn't exist (will fail in File Existence tests)
          return;
        }
        
        const stats = statSync(filePath);
        const fileSizeKB = stats.size / 1024;
        
        // Define per-file minimum size thresholds
        // Most distribution files should be substantial (>1KB) to catch truncated exports
        // Small summary/distribution files with aggregated data use lower thresholds
        const smallFileExceptions = [
          'politician_risk_summary_sample.csv',  // Small summary file
          'top10_politicians_by_risk.csv',        // Top 10 list
          // Distribution files with aggregated counts/percentages (naturally small)
          'distribution_politician_risk_levels.csv',  // Risk level counts (3-4 rows)
          'distribution_risk_by_party.csv',           // Party risk aggregates (~10 rows)
          'distribution_crisis_resilience.csv',       // Crisis level counts
          'distribution_ministry_risk_levels.csv',    // Ministry risk counts
          'distribution_ministry_risk_quarterly.csv', // Quarterly risk aggregates
          'distribution_experience_levels.csv',       // Experience level counts (4-5 rows)
          'percentile_voting_anomaly_detection.csv'   // Percentile data (naturally small)
        ];
        const isSmallFile = smallFileExceptions.includes(filename);
        const minSizeKB = isSmallFile ? 0.05 : 1;
        
        expect(fileSizeKB).toBeGreaterThan(minSizeKB);
      });
    });
  });
  
  describe('Encoding Validation', () => {
    REQUIRED_CSV_FILES.forEach(filename => {
      it(`${filename} should have valid UTF-8 encoding`, () => {
        const filePath = resolve(ciaDataPath, filename);
        if (!existsSync(filePath)) return;
        
        const content = readFileSync(filePath, 'utf-8');
        
        // Check for replacement character � (U+FFFD) which indicates encoding issues
        expect(content).not.toMatch(/�/);
        
        // Check for valid UTF-8 by attempting to encode/decode
        const encoded = Buffer.from(content, 'utf-8');
        const decoded = encoded.toString('utf-8');
        expect(decoded).toBe(content);
      });
    });
  });
  
  describe('CSV Structure Validation', () => {
    REQUIRED_CSV_FILES.forEach(filename => {
      it(`${filename} should have proper CSV structure`, () => {
        const filePath = resolve(ciaDataPath, filename);
        if (!existsSync(filePath)) return;
        
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n');
        
        // Should have at least header row
        expect(lines.length).toBeGreaterThan(0);
        
        // First line should be header (no empty first line)
        const headerLine = lines[0];
        expect(headerLine.length).toBeGreaterThan(0);
        expect(headerLine).toMatch(/^[a-zA-Z_]/); // Starts with letter/underscore
        
        // Should have comma delimiter
        expect(headerLine).toContain(',');
      });
      
      it(`${filename} should have data rows`, () => {
        const filePath = resolve(ciaDataPath, filename);
        if (!existsSync(filePath)) return;
        
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n');
        
        // Should have header + at least one data row
        expect(lines.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
  
  describe('Schema Validation', () => {
    Object.entries(CSV_SCHEMAS).forEach(([filename, schema]) => {
      describe(filename, () => {
        let data;
        
        it('should exist and be parseable', () => {
          const filePath = resolve(ciaDataPath, filename);
          if (!existsSync(filePath)) {
            // Skip schema tests if file doesn't exist
            return;
          }
          
          const content = readFileSync(filePath, 'utf-8');
          data = parseCSV(content);
          expect(data.length).toBeGreaterThan(0);
        });
        
        it('should have required columns', () => {
          const filePath = resolve(ciaDataPath, filename);
          if (!existsSync(filePath)) return;
          
          const content = readFileSync(filePath, 'utf-8');
          data = parseCSV(content);
          
          if (data.length === 0) return; // No data to validate
          
          const actualColumns = Object.keys(data[0]);
          
          schema.requiredColumns.forEach(requiredCol => {
            expect(actualColumns).toContain(requiredCol);
          });
        });
        
        it('should have valid numeric data types', () => {
          const filePath = resolve(ciaDataPath, filename);
          if (!existsSync(filePath)) return;
          
          const content = readFileSync(filePath, 'utf-8');
          data = parseCSV(content);
          
          if (data.length === 0) return;
          
          data.forEach((row, idx) => {
            schema.numericColumns?.forEach(col => {
              if (row[col] && row[col] !== '') {
                const value = parseFloat(row[col]);
                expect(isNaN(value), 
                  `Row ${idx + 1}: Column '${col}' has non-numeric value: '${row[col]}'`
                ).toBe(false);
              }
            });
          });
        });
      });
    });
  });
  
  describe('Column Consistency', () => {
    REQUIRED_CSV_FILES.forEach(filename => {
      it(`${filename} should have consistent column counts`, () => {
        const filePath = resolve(ciaDataPath, filename);
        if (!existsSync(filePath)) return;
        
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n');
        
        if (lines.length < 2) return; // Skip if no data rows
        
        const headerColumnCount = lines[0].split(',').length;
        
        // Check all data rows have same column count
        // Note: Some rows may have commas within quoted fields
        // This is a simple check - for production use Papa Parse or similar
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          
          // Skip rows that contain commas within quoted fields
          // (e.g., "Tidigare riksdagsledamot, Andre vice talman")
          if (line.includes('"')) {
            // Complex CSV with quoted fields - skip basic validation
            continue;
          }
          
          const rowColumnCount = line.split(',').length;
          expect(rowColumnCount).toBe(headerColumnCount);
        }
      });
    });
  });
  
  describe('Data Freshness', () => {
    it('CSV files should not be older than 90 days (warns at 30 days)', () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
      
      let oldestFile = null;
      let oldestMtime = now;
      
      REQUIRED_CSV_FILES.forEach(filename => {
        const filePath = resolve(ciaDataPath, filename);
        if (!existsSync(filePath)) return;
        
        const stats = statSync(filePath);
        if (stats.mtime < oldestMtime) {
          oldestMtime = stats.mtime;
          oldestFile = filename;
        }
      });
      
      if (oldestFile) {
        // Log warning if data is older than 30 days
        if (oldestMtime < thirtyDaysAgo) {
          console.warn(`⚠️  Data freshness warning: ${oldestFile} is older than 30 days (${oldestMtime.toISOString()})`);
          console.warn(`   Note: Filesystem mtime may not reflect actual data age in CI. Consider validating against a timestamp in the dataset/manifest.`);
        }
        
        // Only fail if data is extremely old (>90 days)
        expect(oldestMtime.getTime()).toBeGreaterThan(ninetyDaysAgo.getTime());
      }
    });
  });
});
