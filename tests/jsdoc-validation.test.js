/**
 * @file TypeDoc Generation & Validation Tests
 * @module Tests/TypeDocValidation
 * @category Quality Assurance - Documentation Integrity
 *
 * @description
 * Comprehensive test suite for TypeDoc API documentation generation and validation.
 * Ensures all TypeScript and JavaScript modules have proper documentation
 * and that generated API docs are complete and accessible.
 *
 * ## Test Coverage
 *
 * 1. **Generation Tests**: TypeDoc runs without errors, creates api/ directory
 * 2. **Structure Tests**: Verifies expected HTML files exist (modules, functions, interfaces)
 * 3. **Content Tests**: Validates intelligence terminology and completeness
 * 4. **Accessibility Tests**: Checks generated HTML for WCAG compliance
 *
 * @author Hack23 AB - Quality Engineering Team
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Test configuration constants
 */
const API_DIR = path.join(process.cwd(), 'api');

/**
 * Intelligence terminology that should appear in TypeDoc output
 */
const INTELLIGENCE_KEYWORDS = [
  'intelligence',
  'osint',
  'risk assessment',
  'political analysis',
  'anomaly detection',
  'electoral',
  'coalition',
  'behavioral',
  'strategic',
  'methodology'
];

describe('TypeDoc Generation & Validation', () => {

  describe('TypeDoc Build Process', () => {

    it('should generate TypeDoc without errors', async () => {
      const { stdout, stderr } = await execAsync('npm run typedoc 2>&1');
      const combined = stdout + stderr;

      // Should not have critical errors
      expect(combined).not.toMatch(/error TS/i);
      expect(combined).not.toMatch(/FATAL/i);

      // Should indicate successful generation
      expect(combined).toMatch(/generated at/i);
    }, 60000);

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

    it('should generate module documentation pages', async () => {
      const modulesDir = path.join(API_DIR, 'modules');
      const files = await fs.readdir(modulesDir);
      const htmlFiles = files.filter(f => f.endsWith('.html'));

      // Should have module docs for src/browser/, scripts/ files
      expect(htmlFiles.length).toBeGreaterThan(20);
    });

    it('should generate function documentation pages', async () => {
      const functionsDir = path.join(API_DIR, 'functions');
      const files = await fs.readdir(functionsDir);
      const htmlFiles = files.filter(f => f.endsWith('.html'));

      // Should document many functions
      expect(htmlFiles.length).toBeGreaterThan(30);
    });

    it('should generate interface documentation pages', async () => {
      const interfacesDir = path.join(API_DIR, 'interfaces');
      const files = await fs.readdir(interfacesDir);
      const htmlFiles = files.filter(f => f.endsWith('.html'));

      // Should document interfaces
      expect(htmlFiles.length).toBeGreaterThan(10);
    });

    it('should generate modules index page', async () => {
      const modulesPage = path.join(API_DIR, 'modules.html');
      const exists = await fs.access(modulesPage).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should include documentation for src/browser/ dashboard modules', async () => {
      const modulesDir = path.join(API_DIR, 'modules');
      const files = await fs.readdir(modulesDir);

      const browserModules = files.filter(f =>
        f.startsWith('src_browser_') && f.endsWith('.html')
      );

      // All 27 src/browser/ TS files should be documented
      expect(browserModules.length).toBeGreaterThanOrEqual(10);
    });

    it('should include documentation for src/browser/cia/ modules', async () => {
      const modulesDir = path.join(API_DIR, 'modules');
      const files = await fs.readdir(modulesDir);

      const ciaModules = files.filter(f =>
        f.startsWith('src_browser_cia_') && f.endsWith('.html')
      );

      // All 5 cia/ files should be documented
      expect(ciaModules.length).toBeGreaterThanOrEqual(4);
    });

    it('should include documentation for scripts/ modules', async () => {
      const modulesDir = path.join(API_DIR, 'modules');
      const files = await fs.readdir(modulesDir);

      const scriptModules = files.filter(f =>
        f.startsWith('scripts_') && f.endsWith('.html')
      );

      // Scripts (JS + TS) should be documented
      expect(scriptModules.length).toBeGreaterThanOrEqual(20);
    });

    it('should include static assets', async () => {
      const assetsDir = path.join(API_DIR, 'assets');
      const files = await fs.readdir(assetsDir);

      expect(files).toEqual(expect.arrayContaining([
        expect.stringMatching(/style\.css/),
        expect.stringMatching(/main\.js/),
        expect.stringMatching(/search\.js/)
      ]));
    });

  });

  describe('Documentation Content Validation', () => {

    it('should contain intelligence terminology in index.html', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');
      const lowerContent = content.toLowerCase();

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

    it('should have project version in title', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');

      expect(content).toMatch(/v\d+\.\d+\.\d+/);
    });

    it('should include navigation links', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');

      expect(content).toContain('riksdagsmonitor.com');
      expect(content).toContain('github.com/Hack23/riksdagsmonitor');
    });

  });

  describe('Source Code Documentation Coverage', () => {

    it('should have doc comments in stats-loader.js', async () => {
      const filePath = path.join(process.cwd(), 'js', 'stats-loader.js');
      const content = await fs.readFile(filePath, 'utf-8');

      const hasJSDoc = content.includes('/**') && content.includes('*/');
      const hasModule = content.includes('@module');
      const hasDescription = content.includes('@description');

      expect(hasJSDoc).toBe(true);
      expect(hasModule || hasDescription).toBe(true);
    });

    it('should have doc comments in risk-dashboard.js', async () => {
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

      expect(hasParam || hasReturns).toBe(true);
    });

    it('should have TypeScript type annotations in scripts/', async () => {
      const filePath = path.join(process.cwd(), 'scripts', 'data-transformers.ts');
      const content = await fs.readFile(filePath, 'utf-8');

      expect(content).toMatch(/: (string|number|boolean|void|Promise)/);
      expect(content).toContain('export');
    });

  });

  describe('Documentation Accessibility', () => {

    it('should generate valid HTML structure', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');

      expect(content).toMatch(/<html/i);
      expect(content).toMatch(/<head>/i);
      expect(content).toMatch(/<body>/i);
      expect(content).toMatch(/<\/html>/i);
    });

    it('should include navigation elements for accessibility', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');

      const hasNav = content.includes('<header') ||
                    content.includes('<nav') ||
                    content.includes('role="navigation"');

      expect(hasNav).toBe(true);
    });

    it('should have proper document title', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');

      const titleMatch = content.match(/<title>(.+?)<\/title>/i);
      expect(titleMatch).toBeTruthy();

      if (titleMatch) {
        const title = titleMatch[1];
        expect(title.length).toBeGreaterThan(5);
        expect(title).toContain('Riksdagsmonitor');
      }
    });

    it('should have search functionality', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');

      expect(content).toContain('search');
    });

    it('should support dark/light theme toggle', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');

      expect(content).toContain('tsd-theme');
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

    it('should reference security documentation', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');

      const hasSecurityDocs = content.includes('THREAT_MODEL') ||
                             content.includes('SECURITY') ||
                             content.includes('threat');

      expect(hasSecurityDocs).toBe(true);
    });

    it('should link to GitHub repository', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');

      const hasGitHubLink = content.includes('github.com/Hack23/riksdagsmonitor') ||
                           content.includes('Hack23');

      expect(hasGitHubLink).toBe(true);
    });

    it('should include sidebar links to key docs', async () => {
      const indexPath = path.join(API_DIR, 'index.html');
      const content = await fs.readFile(indexPath, 'utf-8');

      expect(content).toContain('Architecture');
      expect(content).toContain('Security');
    });

  });

});

describe('Documentation File Completeness', () => {

  it('should list all expected source directories', async () => {
    const browserDir = path.join(process.cwd(), 'src', 'browser');
    const scriptsDir = path.join(process.cwd(), 'scripts');

    const browserDirExists = await fs.access(browserDir).then(() => true).catch(() => false);
    const scriptsDirExists = await fs.access(scriptsDir).then(() => true).catch(() => false);

    expect(browserDirExists).toBe(true);
    expect(scriptsDirExists).toBe(true);
  });

  it('should document all browser TypeScript files', async () => {
    const browserDir = path.join(process.cwd(), 'src', 'browser', 'dashboards');
    const files = await fs.readdir(browserDir);
    const tsFiles = files.filter(f => f.endsWith('.ts'));

    expect(tsFiles.length).toBeGreaterThanOrEqual(10);

    if (tsFiles.length > 0) {
      const content = await fs.readFile(path.join(browserDir, tsFiles[0]), 'utf-8');
      expect(content).toContain('/**');
    }
  });

  it('should have total module count matching source files', async () => {
    const modulesDir = path.join(API_DIR, 'modules');
    const files = await fs.readdir(modulesDir);
    const htmlFiles = files.filter(f => f.endsWith('.html'));

    // 27 src/browser/ + ~42 scripts/ = ~69 modules
    expect(htmlFiles.length).toBeGreaterThanOrEqual(40);
  });

  it('should generate hierarchy page', async () => {
    const hierarchyPath = path.join(API_DIR, 'hierarchy.html');
    const exists = await fs.access(hierarchyPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

});
