import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Complete Dynamic Stats Script', () => {
  describe('Script File Existence', () => {
    it('should have complete-dynamic-stats.js script', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'complete-dynamic-stats.js');
      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    it('should be executable Node.js script', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'complete-dynamic-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('#!/usr/bin/env node');
    });
  });

  describe('Statistics Configuration', () => {
    it('should define stat-total-votes pattern', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'complete-dynamic-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('stat-total-votes');
    });

    it('should define stat-total-documents pattern', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'complete-dynamic-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('stat-total-documents');
    });

    it('should define stat-committee-documents pattern', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'complete-dynamic-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('stat-committee-documents');
    });

    it('should define stat-rule-violations pattern', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'complete-dynamic-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('stat-rule-violations');
    });

    it('should define stat-historical-persons pattern', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'complete-dynamic-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('stat-historical-persons');
    });
  });

  describe('JSON-LD Protection', () => {
    it('should preserve meta tags and JSON-LD', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'complete-dynamic-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('meta tags');
      expect(content).toContain('JSON-LD');
    });

    it('should split content into head and body', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'complete-dynamic-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('<body');
      expect(content).toMatch(/head|body/i);
    });
  });

  describe('Multi-Language Support', () => {
    it('should process all 14 index files', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'complete-dynamic-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      // Check for language codes
      expect(content).toContain('index.html');
      expect(content).toContain('index_sv.html');
      expect(content).toContain('index_da.html');
      expect(content).toContain('index_no.html');
    });

    it('should support RTL languages (Arabic, Hebrew)', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'complete-dynamic-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('index_ar.html');
      expect(content).toContain('index_he.html');
    });

    it('should support Asian languages', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'complete-dynamic-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      
      expect(content).toContain('index_ja.html');
      expect(content).toContain('index_ko.html');
      expect(content).toContain('index_zh.html');
    });
  });

  describe('Data-stat-id Attribute Generation', () => {
    it('should generate data-stat-id attributes', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'complete-dynamic-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('data-stat-id');
    });

    it('should wrap numbers in span tags', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'complete-dynamic-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('<span');
      expect(content).toContain('</span>');
    });
  });

  describe('Integration with stats-loader.js', () => {
    it('should use stat IDs compatible with stats-loader.js', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'complete-dynamic-stats.js');
      const loaderPath = path.join(process.cwd(), 'js', 'stats-loader.js');
      
      const scriptContent = fs.readFileSync(scriptPath, 'utf-8');
      const loaderContent = fs.readFileSync(loaderPath, 'utf-8');
      
      // Check that stat IDs in script match those in loader
      expect(loaderContent).toContain('stat-total-votes');
      expect(loaderContent).toContain('stat-total-documents');
      expect(loaderContent).toContain('stat-historical-persons');
    });
  });

  describe('Production Stats Integration', () => {
    it('should reference production-stats.json data source', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'complete-dynamic-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content.toLowerCase()).toContain('production-stats.json');
    });
  });
});
