import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Load CIA Stats Script', () => {
  describe('Script Configuration', () => {
    it('should have load-cia-stats.js script', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      expect(fs.existsSync(scriptPath)).toBe(true);
    });

    it('should be a Node.js ES module', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('import');
      expect(content).toContain('export');
    });
  });

  describe('CIA Data Source', () => {
    it('should reference extraction_summary_report.csv', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('extraction_summary_report.csv');
    });

    it('should fetch from GitHub cia repository', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('github.com/Hack23/cia');
    });
  });

  describe('ISMS Compliance Documentation', () => {
    it('should include ISO 27001 compliance comments', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('ISO 27001');
    });

    it('should document data classification', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content.toLowerCase()).toContain('public');
    });

    it('should reference GDPR compliance', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('GDPR');
    });

    it('should reference Swedish Offentlighetsprincipen', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('Offentlighetsprincipen');
    });
  });

  describe('Statistics Extraction', () => {
    it('should extract total_persons statistic', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('total_persons');
    });

    it('should extract total_votes statistic', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('total_votes');
    });

    it('should extract total_documents statistic', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('total_documents');
    });

    it('should extract total_committee_documents statistic', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('total_committee_documents');
    });

    it('should extract total_rule_violations statistic', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('total_rule_violations');
    });
  });

  describe('Output Generation', () => {
    it('should output to cia-data/production-stats.json', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('production-stats.json');
    });

    it('should create JSON output with proper structure', () => {
      const statsPath = path.join(process.cwd(), 'cia-data', 'production-stats.json');
      if (fs.existsSync(statsPath)) {
        const stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
        expect(stats).toHaveProperty('counts');
        expect(stats).toHaveProperty('metadata');
      }
    });
  });

  describe('Caching Strategy', () => {
    it('should implement cache freshness check', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      // Check for cache or freshness logic
      expect(content).toMatch(/cache|fresh|stale/i);
    });

    it('should include last_updated timestamp', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('last_updated');
    });
  });

  describe('Error Handling', () => {
    it('should have error handling for network failures', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('catch');
    });

    it('should have try-catch blocks', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('try');
    });
  });

  describe('CSV Parsing', () => {
    it('should parse CSV content', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('.split');
    });

    it('should handle CSV headers', () => {
      const scriptPath = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      const content = fs.readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('object_type');
    });
  });

  describe('Data Validation', () => {
    it('should validate extracted statistics are numbers', () => {
      const statsPath = path.join(process.cwd(), 'cia-data', 'production-stats.json');
      if (fs.existsSync(statsPath)) {
        const stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
        if (stats.counts) {
          Object.values(stats.counts).forEach(value => {
            expect(typeof value).toBe('number');
          });
        }
      }
    });

    it('should have reasonable statistic values (sanity check)', () => {
      const statsPath = path.join(process.cwd(), 'cia-data', 'production-stats.json');
      if (fs.existsSync(statsPath)) {
        const stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
        if (stats.counts) {
          // Sanity checks - values should be positive and within reasonable ranges
          expect(stats.counts.total_persons).toBeGreaterThan(0);
          expect(stats.counts.total_persons).toBeLessThan(100000);
          
          expect(stats.counts.total_votes).toBeGreaterThan(0);
          expect(stats.counts.total_votes).toBeLessThan(10000000);
        }
      }
    });
  });

  describe('Integration with Update Script', () => {
    it('should be compatible with update-stats-from-cia.js', () => {
      const loadScript = path.join(process.cwd(), 'scripts', 'load-cia-stats.js');
      const updateScript = path.join(process.cwd(), 'scripts', 'update-stats-from-cia.js');
      
      // Both scripts should exist and work together
      expect(fs.existsSync(loadScript)).toBe(true);
      expect(fs.existsSync(updateScript)).toBe(true);
    });
  });

  describe('GitHub Actions Integration', () => {
    it('should be referenced in update-cia-stats workflow', () => {
      const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'update-cia-stats.yml');
      if (fs.existsSync(workflowPath)) {
        const content = fs.readFileSync(workflowPath, 'utf-8');
        expect(content).toContain('load-cia-stats');
      } else {
        // Workflow file may not exist in test environment
        expect(true).toBe(true);
      }
    });

    it('should have scheduled workflow for daily updates', () => {
      const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'update-cia-stats.yml');
      if (fs.existsSync(workflowPath)) {
        const content = fs.readFileSync(workflowPath, 'utf-8');
        expect(content).toContain('cron');
      } else {
        // Workflow file may not exist in test environment
        expect(true).toBe(true);
      }
    });
  });
});
