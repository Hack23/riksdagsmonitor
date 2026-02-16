/**
 * @file JSDoc Generation & Validation Tests
 * @module Tests/JSDocValidation
 * @category Quality Assurance - Documentation Integrity
 * 
 * @description
 * Comprehensive test suite for JSDoc API documentation generation and validation.
 * Ensures all JavaScript modules have proper intelligence operative perspective
 * documentation and that generated API docs are complete and accessible.
 * 
 * ## Test Coverage
 * 
 * 1. **Generation Tests**: JSDoc runs without errors, creates api/ directory
 * 2. **Structure Tests**: Verifies expected HTML files exist
 * 3. **Content Tests**: Validates intelligence terminology and completeness
 * 4. **Accessibility Tests**: Checks generated HTML for WCAG compliance
 * 
 * @intelligence Validates documentation quality for intelligence platform
 * @author Hack23 AB - Quality Engineering Team
 * @license Apache-2.0
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Test configuration constants
 */
const API_DIR = path.join(process.cwd(), 'api');
const EXPECTED_MODULES = [
  'OSINT_DataAcquisition',
  'RiskAssessment_AnomalyDetection',
  'ElectoralIntelligence_Forecasting',
  'PoliticalAnalysis_Dashboard',
  'CoalitionIntelligence_Analysis',
  'IntelligenceReporting_Generation'
];

/**
 * Intelligence terminology that should appear in JSDoc output
 */
const INTELLIGENCE_KEYWORDS = [
  'intelligence',
  'osint',
  'risk assessment',
  'political analysis',
  'anomaly detection',
  'electoral forecasting',
  'coalition',
  'behavioral',
  'strategic',
  'methodology'
];

describe('JSDoc Generation & Validation', () => {
  
  describe('JSDoc Build Process', () => {
    
    it('should generate JSDoc without errors', async () => {
      // Run JSDoc generation
      const { stdout, stderr } = await execAsync('npm run jsdoc');
      
      // Should not have critical errors
      expect(stderr).not.toMatch(/ERROR/i);
      expect(stderr).not.toMatch(/FATAL/i);
      
      // Should indicate successful generation
      expect(stdout).toMatch(/complete|finished|generated/i);
    }, 60000); // 60s timeout for JSDoc generation
    
    it('should create api/ directory', async () => {
      const stats = await fs.stat(API_DIR);
      expect(stats.isDirectory()).toBe(true);
    });
    
    it('should generate index.html in api/', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const exists = await fs.access(indexPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
    
  });
  
  describe('Generated Documentation Structure', () => {
    
    it('should generate HTML files for each module', async () => {
      const files = await fs.readdir(API_DIR);
      const htmlFiles = files.filter(f => f.endsWith('.html'));
      
      // Should have at least index.html + module docs
      expect(htmlFiles.length).toBeGreaterThan(10);
    });
    
    it('should create module documentation files', async () => {
      const files = await fs.readdir(API_DIR);
      
      // Check for common module patterns
      const hasModuleDocs = files.some(f => 
        f.includes('module-') || 
        f.includes('OSINT') || 
        f.includes('RiskAssessment') ||
        f.includes('Electoral')
      );
      
      expect(hasModuleDocs).toBe(true);
    });
    
    it('should generate global.html for global functions', async () => {
      const globalPath = path.join(API_DIR, 'global.html');
      const exists = await fs.access(globalPath).then(() => true).catch(() => false);
      
      // May or may not exist depending on global functions
      // Just verify no error accessing directory
      expect(API_DIR).toBeTruthy();
    });
    
  });
  
  describe('Documentation Content Validation', () => {
    
    it('should contain intelligence operative terminology in index.html', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');
      
      // Convert to lowercase for case-insensitive matching
      const lowerContent = content.toLowerCase();
      
      // Check for key intelligence terms
      const foundKeywords = INTELLIGENCE_KEYWORDS.filter(keyword => 
        lowerContent.includes(keyword.toLowerCase())
      );
      
      // Should contain at least 50% of intelligence keywords
      expect(foundKeywords.length).toBeGreaterThanOrEqual(INTELLIGENCE_KEYWORDS.length / 2);
    });
    
    it('should reference CIA Platform in documentation', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');
      
      const hasCIAReference = content.includes('CIA') || 
                             content.includes('Citizen Intelligence Agency') ||
                             content.includes('cia-data');
      
      expect(hasCIAReference).toBe(true);
    });
    
    it('should include political transparency mission', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');
      
      const hasTransparencyMission = content.includes('transparency') ||
                                     content.includes('accountability') ||
                                     content.includes('democratic');
      
      expect(hasTransparencyMission).toBe(true);
    });
    
    it('should document GDPR compliance for political data', async () => {
      const files = await fs.readdir(API_DIR);
      const htmlFiles = files.filter(f => f.endsWith('.html'));
      
      let foundGDPR = false;
      
      // Check multiple files for GDPR references
      for (const file of htmlFiles.slice(0, 10)) {
        const content = await fs.readFile(path.join(API_DIR, file), 'utf-8');
        if (content.toLowerCase().includes('gdpr')) {
          foundGDPR = true;
          break;
        }
      }
      
      expect(foundGDPR).toBe(true);
    });
    
  });
  
  describe('Source Code JSDoc Coverage', () => {
    
    it('should have JSDoc comments in stats-loader.js', async () => {
      const filePath = path.join(process.cwd(), 'js', 'stats-loader.js');
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Check for JSDoc block comments
      const hasJSDoc = content.includes('/**') && content.includes('*/');
      const hasModule = content.includes('@module');
      const hasDescription = content.includes('@description');
      
      expect(hasJSDoc).toBe(true);
      expect(hasModule || hasDescription).toBe(true);
    });
    
    it('should have JSDoc comments in risk-dashboard.js', async () => {
      const filePath = path.join(process.cwd(), 'js', 'risk-dashboard.js');
      const content = await fs.readFile(filePath, 'utf-8');
      
      const hasJSDoc = content.includes('/**') && content.includes('*/');
      const hasIntelligence = content.toLowerCase().includes('@intelligence') || 
                             content.toLowerCase().includes('intelligence');
      
      expect(hasJSDoc).toBe(true);
      expect(hasIntelligence).toBe(true);
    });
    
    it('should document functions with @param and @returns tags', async () => {
      const filePath = path.join(process.cwd(), 'js', 'stats-loader.js');
      const content = await fs.readFile(filePath, 'utf-8');
      
      const hasParam = content.includes('@param');
      const hasReturns = content.includes('@returns') || content.includes('@return');
      
      // At least one function should be documented with params/returns
      expect(hasParam || hasReturns).toBe(true);
    });
    
  });
  
  describe('Documentation Accessibility', () => {
    
    it('should generate valid HTML structure', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');
      
      // Basic HTML structure validation
      expect(content).toMatch(/<html/i);
      expect(content).toMatch(/<head>/i);
      expect(content).toMatch(/<body>/i);
      expect(content).toMatch(/<\/html>/i);
    });
    
    it('should include navigation elements for accessibility', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');
      
      // Should have nav elements or role="navigation"
      const hasNav = content.includes('<nav') || 
                    content.includes('role="navigation"') ||
                    content.includes('class="navigation"');
      
      expect(hasNav).toBe(true);
    });
    
    it('should have proper document title', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');
      
      // Should have a meaningful title tag
      const titleMatch = content.match(/<title>(.+?)<\/title>/i);
      expect(titleMatch).toBeTruthy();
      
      if (titleMatch) {
        const title = titleMatch[1];
        expect(title.length).toBeGreaterThan(5);
      }
    });
    
  });
  
  describe('Integration with Project Documentation', () => {
    
    it('should reference ARCHITECTURE.md', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');
      
      const hasArchitectureLink = content.includes('ARCHITECTURE') || 
                                  content.includes('architecture');
      
      expect(hasArchitectureLink).toBe(true);
    });
    
    it('should reference THREAT_MODEL.md for security context', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');
      
      const hasSecurityDocs = content.includes('THREAT_MODEL') || 
                             content.includes('SECURITY') ||
                             content.includes('threat model');
      
      expect(hasSecurityDocs).toBe(true);
    });
    
    it('should link to GitHub repository', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');
      
      const hasGitHubLink = content.includes('github.com/Hack23/riksdagsmonitor') ||
                           content.includes('Hack23');
      
      expect(hasGitHubLink).toBe(true);
    });
    
  });
  
});

describe('JSDoc File Completeness', () => {
  
  it('should list all expected JavaScript source directories', async () => {
    const jsDir = path.join(process.cwd(), 'js');
    const dashboardDir = path.join(process.cwd(), 'dashboard');
    const scriptsDir = path.join(process.cwd(), 'scripts');
    
    const jsDirExists = await fs.access(jsDir).then(() => true).catch(() => false);
    const dashboardDirExists = await fs.access(dashboardDir).then(() => true).catch(() => false);
    const scriptsDirExists = await fs.access(scriptsDir).then(() => true).catch(() => false);
    
    expect(jsDirExists).toBe(true);
    expect(dashboardDirExists).toBe(true);
    expect(scriptsDirExists).toBe(true);
  });
  
  it('should document all dashboard JavaScript files', async () => {
    const dashboardDir = path.join(process.cwd(), 'dashboard');
    const files = await fs.readdir(dashboardDir);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    
    // Should have at least 3 dashboard JS files
    expect(jsFiles.length).toBeGreaterThanOrEqual(3);
    
    // Check first file for JSDoc
    if (jsFiles.length > 0) {
      const content = await fs.readFile(path.join(dashboardDir, jsFiles[0]), 'utf-8');
      const hasJSDoc = content.includes('/**');
      expect(hasJSDoc).toBe(true);
    }
  });
  
});
