/**
 * Agentic Workflow Tests
 * 
 * Tests for GitHub Agentic Workflows configuration and best practices.
 * Validates workflow specifications, engine configuration, and output safety.
 */

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKFLOW_MD_PATH = path.join(__dirname, '..', '.github', 'workflows', 'news-article-generator.md');

// Helper to import js-yaml dynamically
let yaml = { load: () => ({}) };
try {
  const yamlModule = await import('js-yaml');
  yaml = yamlModule.default || yamlModule;
} catch (e) {
  console.warn('js-yaml not available, some tests may be skipped');
}

describe('Agentic Workflow Configuration', () => {
  let workflowContent;
  let frontmatter;

  beforeAll(() => {
    if (fs.existsSync(WORKFLOW_MD_PATH)) {
      workflowContent = fs.readFileSync(WORKFLOW_MD_PATH, 'utf-8');
      
      // Extract YAML frontmatter
      const frontmatterMatch = workflowContent.match(/^---\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        frontmatter = yaml.load(frontmatterMatch[1]);
      }
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Engine Configuration', () => {
    it('should have workflow markdown file', () => {
      expect(fs.existsSync(WORKFLOW_MD_PATH)).toBe(true);
    });

    it('should have engine configuration in frontmatter', () => {
      expect(frontmatter).toBeTruthy();
      expect(frontmatter.engine).toBeTruthy();
    });

    it('should use copilot engine with claude-opus-4.6 model', () => {
      expect(frontmatter.engine).toEqual({
        id: 'copilot',
        model: 'claude-opus-4.6'
      });
    });

    it('should have proper workflow name and description', () => {
      expect(frontmatter.name).toBeTruthy();
      expect(frontmatter.description).toBeTruthy();
      expect(frontmatter.name.length).toBeGreaterThan(0);
      expect(frontmatter.description.length).toBeGreaterThan(20);
    });
  });

  describe('Workflow Triggers', () => {
    it('should have on: section with triggers', () => {
      expect(frontmatter.on).toBeTruthy();
    });

    it('should support workflow_dispatch for manual triggers', () => {
      expect(frontmatter.on.workflow_dispatch).toBeTruthy();
    });

    it('should have schedule for automated runs', () => {
      expect(frontmatter.on.schedule).toBeTruthy();
    });

    it('should have workflow inputs defined', () => {
      expect(frontmatter.on.workflow_dispatch.inputs).toBeTruthy();
      expect(frontmatter.on.workflow_dispatch.inputs.article_types).toBeTruthy();
      expect(frontmatter.on.workflow_dispatch.inputs.force_generation).toBeTruthy();
    });
  });

  describe('Permissions (Security)', () => {
    it('should define explicit permissions', () => {
      expect(frontmatter.permissions).toBeTruthy();
    });

    it('should use least privilege permissions', () => {
      const perms = frontmatter.permissions;
      
      // Should be specific, not write-all
      if (typeof perms === 'object') {
        Object.entries(perms).forEach(([key, value]) => {
          expect(['read', 'write', 'none']).toContain(value);
        });
      }
    });

    it('should use least-privilege read permissions (writes via safe-outputs)', () => {
      // Agentic workflows use safe-outputs for write operations (PR creation, comments)
      // so the workflow itself only needs read permissions
      expect(frontmatter.permissions.contents).toBe('read');
    });
  });

  describe('Safe Outputs Configuration', () => {
    it('should define safe-outputs for automated actions', () => {
      expect(frontmatter['safe-outputs']).toBeTruthy();
    });

    it('should allow create-pull-request output', () => {
      expect(frontmatter['safe-outputs']['create-pull-request']).toBeDefined();
    });

    it('should allow add-comment output', () => {
      expect(frontmatter['safe-outputs']['add-comment']).toBeDefined();
    });
  });

  describe('MCP Server Configuration', () => {
    it('should define mcp-servers', () => {
      expect(frontmatter['mcp-servers']).toBeTruthy();
    });

    it('should have riksdag-regering MCP server', () => {
      expect(frontmatter['mcp-servers']['riksdag-regering']).toBeTruthy();
    });

    it('should use HTTP endpoint for riksdag-regering', () => {
      const mcpServer = frontmatter['mcp-servers']['riksdag-regering'];
      expect(mcpServer.url).toBeTruthy();
      expect(mcpServer.url).toContain('https://');
    });
  });

  describe('Tools Configuration', () => {
    it('should define available tools', () => {
      expect(frontmatter.tools).toBeTruthy();
    });

    it('should enable github tools', () => {
      expect(frontmatter.tools.github).toBeTruthy();
    });

    it('should enable bash tool', () => {
      expect(frontmatter.tools.bash).toBe(true);
    });
  });

  describe('Setup Steps', () => {
    it('should have setup steps defined', () => {
      expect(frontmatter.steps).toBeTruthy();
      expect(Array.isArray(frontmatter.steps)).toBe(true);
      expect(frontmatter.steps.length).toBeGreaterThan(0);
    });

    it('should setup Node.js with specific version', () => {
      const nodeSetup = frontmatter.steps.find(s => s.name.includes('Node'));
      expect(nodeSetup).toBeTruthy();
      expect(nodeSetup.uses).toContain('actions/setup-node');
      expect(nodeSetup.with['node-version']).toBeTruthy();
    });

    it('should install dependencies', () => {
      const installStep = frontmatter.steps.find(s => s.name.includes('dependencies'));
      expect(installStep).toBeTruthy();
      expect(installStep.run).toContain('npm ci');
    });
  });

  describe('Workflow Instructions', () => {
    it('should have comprehensive agent instructions', () => {
      // Check for instructions after frontmatter
      const instructionsStart = workflowContent.indexOf('---', 4) + 3;
      const instructions = workflowContent.substring(instructionsStart);
      
      expect(instructions.length).toBeGreaterThan(500);
      expect(instructions).toContain('News');
      expect(instructions).toContain('MCP');
    });

    it('should describe available MCP tools', () => {
      expect(workflowContent).toContain('riksdag-regering');
      expect(workflowContent).toContain('MCP');
    });

    it('should include article type specifications', () => {
      expect(workflowContent).toContain('week-ahead');
      expect(workflowContent).toContain('committee-reports');
      expect(workflowContent).toContain('propositions');
      expect(workflowContent).toContain('motions');
    });
  });

  describe('Timeout Configuration', () => {
    it('should have reasonable timeout defined', () => {
      expect(frontmatter['timeout-minutes']).toBeTruthy();
      expect(frontmatter['timeout-minutes']).toBeGreaterThan(0);
      expect(frontmatter['timeout-minutes']).toBeLessThan(120);
    });
  });
});

describe('Generated Articles Quality', () => {
  describe('Article File Structure', () => {
    it('should generate articles with proper naming', () => {
      const newsDir = path.join(__dirname, '..', 'news');
      
      if (!fs.existsSync(newsDir)) {
        console.warn('News directory not found, skipping test');
        return;
      }
      
      const files = fs.readdirSync(newsDir);
      const articleFiles = files.filter(f => f.endsWith('.html') && !f.startsWith('index'));
      
      // Should have article files
      expect(articleFiles.length).toBeGreaterThan(0);
      
      // Articles should follow naming convention: YYYY-MM-DD-slug-lang.html or YYYY-MM-slug-lang.html
      // Supports all 14 languages: en, sv, da, no, fi, de, fr, es, nl, ar, he, ja, ko, zh
      articleFiles.forEach(file => {
        expect(file).toMatch(/^\d{4}-\d{2}(-\d{2})?-.+-(en|sv|da|no|fi|de|fr|es|nl|ar|he|ja|ko|zh)\.html$/);
      });
    });

    it('should have both English and Swedish versions', () => {
      const newsDir = path.join(__dirname, '..', 'news');
      
      if (!fs.existsSync(newsDir)) {
        console.warn('News directory not found, skipping test');
        return;
      }
      
      const files = fs.readdirSync(newsDir);
      const enArticles = files.filter(f => f.endsWith('-en.html'));
      const svArticles = files.filter(f => f.endsWith('-sv.html'));
      
      expect(enArticles.length).toBeGreaterThan(0);
      expect(svArticles.length).toBeGreaterThan(0);
    });
  });

  describe('Generated Article Content', () => {
    it('should have valid HTML structure', () => {
      const newsDir = path.join(__dirname, '..', 'news');
      
      if (!fs.existsSync(newsDir)) {
        console.warn('News directory not found, skipping test');
        return;
      }
      
      const files = fs.readdirSync(newsDir);
      const articleFile = files.find(f => f.endsWith('-en.html') && !f.startsWith('index'));
      
      if (!articleFile) {
        console.warn('No English articles found, skipping test');
        return;
      }
      
      const html = fs.readFileSync(path.join(newsDir, articleFile), 'utf-8');
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('<head>');
      expect(html).toContain('<body>');
      expect(html).toContain('</html>');
    });

    it('should have Schema.org structured data', () => {
      const newsDir = path.join(__dirname, '..', 'news');
      
      if (!fs.existsSync(newsDir)) return;
      
      const files = fs.readdirSync(newsDir);
      const articleFile = files.find(f => f.endsWith('-en.html') && !f.startsWith('index'));
      
      if (!articleFile) return;
      
      const html = fs.readFileSync(path.join(newsDir, articleFile), 'utf-8');
      
      expect(html).toContain('application/ld+json');
      expect(html).toContain('@type');
      expect(html).toContain('NewsArticle');
    });
  });
});
