/**
 * Unit Tests for extract-vocabulary.js
 * Tests vocabulary extraction from news articles
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { execSync } from 'child_process';

describe('extract-vocabulary.js', () => {
  const testDir = 'tests/fixtures/vocabulary-test';
  
  beforeEach(() => {
    // Create test fixtures directory
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch (e) {
      // Directory doesn't exist, that's fine
    }
    mkdirSync(testDir, { recursive: true });
  });

  describe('Language code extraction', () => {
    it('should extract language code from filename', () => {
      // Create test file
      const content = `
        <!DOCTYPE html>
        <html lang="en">
        <head><title>Test</title></head>
        <body>
          <h1>Test Article</h1>
          <h2>What to Watch This Week</h2>
          <strong>Committee:</strong> Finance Committee
          <strong>Document:</strong> Report 2024:123
          <h3>Title 1</h3>
          <h3>Title 2</h3>
        </body>
        </html>
      `;
      
      writeFileSync(`${testDir}/2026-02-14-test-en.html`, content);
      
      const output = execSync(`node scripts/extract-vocabulary.js --directory ${testDir} --date-prefix 2026-02-14`, {
        encoding: 'utf-8'
      });
      
      expect(output).toContain('English (EN)');
      expect(output).toContain('Samples analyzed: 1');
    });

    it('should handle multiple language files', () => {
      const languages = ['en', 'sv', 'de', 'fr'];
      
      for (const lang of languages) {
        const content = `
          <!DOCTYPE html>
          <html lang="${lang}">
          <body><h1>Test</h1></body>
          </html>
        `;
        writeFileSync(`${testDir}/2026-02-14-test-${lang}.html`, content);
      }
      
      const output = execSync(`node scripts/extract-vocabulary.js --directory ${testDir}`, {
        encoding: 'utf-8'
      });
      
      expect(output).toContain('English (EN)');
      expect(output).toContain('Swedish (SV)');
      expect(output).toContain('German (DE)');
      expect(output).toContain('French (FR)');
    });
  });

  describe('Structure-based extraction', () => {
    it('should extract committee label from strong tag', () => {
      const content = `
        <!DOCTYPE html>
        <html><body>
          <strong>Committee:</strong> Finance Committee
          <strong>Document:</strong> Report 123
        </body></html>
      `;
      
      writeFileSync(`${testDir}/2026-02-14-test-en.html`, content);
      
      const output = execSync(`node scripts/extract-vocabulary.js --directory ${testDir}`, {
        encoding: 'utf-8'
      });
      
      expect(output).toContain('"Committee": Committee');
      expect(output).toContain('"Document": Document');
    });

    it('should extract labels in multiple languages', () => {
      // German
      writeFileSync(`${testDir}/test-de.html`, `
        <html><body>
          <strong>Ausschuss:</strong> Finanzausschuss
          <strong>Dokument:</strong> Bericht 123
        </body></html>
      `);
      
      // French
      writeFileSync(`${testDir}/test-fr.html`, `
        <html><body>
          <strong>Commission:</strong> Commission des finances
          <strong>Document:</strong> Rapport 123
        </body></html>
      `);
      
      const output = execSync(`node scripts/extract-vocabulary.js --directory ${testDir}`, {
        encoding: 'utf-8'
      });
      
      expect(output).toContain('German (DE)');
      expect(output).toContain('"Committee": Ausschuss');
      expect(output).toContain('French (FR)');
      expect(output).toContain('"Committee": Commission');
    });

    it('should extract What to Watch heading', () => {
      const content = `
        <html><body>
          <h2>What to Watch This Week</h2>
          <strong>Committee:</strong> Test
        </body></html>
      `;
      
      writeFileSync(`${testDir}/test-en.html`, content);
      
      const output = execSync(`node scripts/extract-vocabulary.js --directory ${testDir}`, {
        encoding: 'utf-8'
      });
      
      expect(output).toContain('"What to Watch": What to Watch This Week');
    });
  });

  describe('CLI arguments', () => {
    it('should filter by date prefix', () => {
      writeFileSync(`${testDir}/2026-02-14-test-en.html`, '<html><body><h1>Feb 14</h1></body></html>');
      writeFileSync(`${testDir}/2026-03-01-test-en.html`, '<html><body><h1>March 1</h1></body></html>');
      
      const output = execSync(`node scripts/extract-vocabulary.js --directory ${testDir} --date-prefix 2026-02-`, {
        encoding: 'utf-8'
      });
      
      expect(output).toContain('Filtering by date prefix: "2026-02-"');
      expect(output).toContain('Scanning 1 HTML files');
    });

    it('should show help message', () => {
      const output = execSync('node scripts/extract-vocabulary.js --help', {
        encoding: 'utf-8'
      });
      
      expect(output).toContain('Usage:');
      expect(output).toContain('--date-prefix');
      expect(output).toContain('--directory');
      expect(output).toContain('Examples:');
    });
  });

  describe('Error handling', () => {
    it('should report skipped files with reasons', () => {
      // File without language code
      writeFileSync(`${testDir}/invalid.html`, '<html><body>Test</body></html>');
      
      // File with invalid language code
      writeFileSync(`${testDir}/test-xx.html`, '<html><body>Test</body></html>');
      
      const output = execSync(`node scripts/extract-vocabulary.js --directory ${testDir}`, {
        encoding: 'utf-8'
      });
      
      expect(output).toContain('⚠️  WARNING: Skipped Files Summary');
      expect(output).toContain('No language code in filename');
      expect(output).toContain('Unknown language code: xx');
    });

    it('should handle read errors gracefully', () => {
      // Create a file then make it unreadable (chmod doesn't work well in CI, so skip this test in CI)
      if (process.env.CI) {
        return; // Skip in CI
      }
      
      writeFileSync(`${testDir}/test-en.html`, 'test');
      execSync(`chmod 000 ${testDir}/test-en.html`);
      
      const output = execSync(`node scripts/extract-vocabulary.js --directory ${testDir}`, {
        encoding: 'utf-8'
      });
      
      expect(output).toContain('⚠️  WARNING');
      
      // Restore permissions
      execSync(`chmod 644 ${testDir}/test-en.html`);
    });
  });

  describe('Article type detection', () => {
    it('should detect committee reports', () => {
      writeFileSync(`${testDir}/2026-02-14-committee-reports-en.html`, `
        <html><body>
          <h1>Committee Reports</h1>
          <h3>Report Title 1</h3>
        </body></html>
      `);
      
      const output = execSync(`node scripts/extract-vocabulary.js --directory ${testDir}`, {
        encoding: 'utf-8'
      });
      
      expect(output).toContain('Sample titles: Report Title 1');
    });

    it('should detect multiple article types', () => {
      writeFileSync(`${testDir}/committee-en.html`, '<html><body><h1>Committee Report</h1></body></html>');
      writeFileSync(`${testDir}/motion-en.html`, '<html><body><h1>Motion</h1></body></html>');
      writeFileSync(`${testDir}/proposition-en.html`, '<html><body><h1>Proposition</h1></body></html>');
      
      const output = execSync(`node scripts/extract-vocabulary.js --directory ${testDir}`, {
        encoding: 'utf-8'
      });
      
      expect(output).toContain('English (EN)');
      expect(output).toContain('Samples analyzed: 3');
    });
  });
});
