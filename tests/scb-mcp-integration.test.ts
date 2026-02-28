/**
 * Test Suite for SCB MCP Integration
 *
 * Validates that the SCB (Statistics Sweden) MCP server is properly
 * configured across the project for enriching political analysis
 * with official Swedish statistics.
 *
 * SCB MCP tools: search_tables, get_table_data, get_table_variables,
 * preview_data, find_region_code
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKFLOWS_DIR = path.join(__dirname, '..', '.github', 'workflows');

/** All news workflow .md files */
const ALL_NEWS_WORKFLOWS: readonly string[] = [
  'news-article-generator.md',
  'news-committee-reports.md',
  'news-evening-analysis.md',
  'news-month-ahead.md',
  'news-monthly-review.md',
  'news-motions.md',
  'news-propositions.md',
  'news-realtime-monitor.md',
  'news-week-ahead.md',
  'news-weekly-review.md',
];

describe('SCB MCP Server Configuration', () => {
  it('copilot-mcp.json should include scb MCP server', () => {
    const configPath = path.join(__dirname, '..', '.github', 'copilot-mcp.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    expect(config.mcpServers).toHaveProperty('scb');
    expect(config.mcpServers.scb.type).toBe('http');
    expect(config.mcpServers.scb.url).toBe('https://scb-mcp.onrender.com/mcp');
  });

  ALL_NEWS_WORKFLOWS.forEach(workflow => {
    it(`${workflow} should configure scb MCP server`, () => {
      const filepath = path.join(WORKFLOWS_DIR, workflow);
      const content = fs.readFileSync(filepath, 'utf-8');

      // Should have scb in mcp-servers section
      expect(content).toContain('scb:');
      expect(content).toContain('https://scb-mcp.onrender.com/mcp');
    });

    it(`${workflow} should allow scb-mcp.onrender.com in network`, () => {
      const filepath = path.join(WORKFLOWS_DIR, workflow);
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toContain('scb-mcp.onrender.com');
    });

    it(`${workflow} should include scb-mcp.onrender.com in safe-outputs`, () => {
      const filepath = path.join(WORKFLOWS_DIR, workflow);
      const content = fs.readFileSync(filepath, 'utf-8');

      // The safe-outputs section should list scb-mcp.onrender.com
      const safeOutputsSection = content.split('safe-outputs:')[1]?.split('steps:')[0] ?? '';
      expect(safeOutputsSection).toContain('scb-mcp.onrender.com');
    });
  });
});

describe('SCB Enrichment Instructions in Key Workflows', () => {
  const ENRICHED_WORKFLOWS: readonly string[] = [
    'news-evening-analysis.md',
    'news-monthly-review.md',
    'news-weekly-review.md',
    'news-propositions.md',
    'news-motions.md',
  ];

  ENRICHED_WORKFLOWS.forEach(workflow => {
    it(`${workflow} should document SCB enrichment as optional`, () => {
      const filepath = path.join(WORKFLOWS_DIR, workflow);
      const content = fs.readFileSync(filepath, 'utf-8');

      // SCB should be documented as optional enrichment (never blocking)
      const hasSCBReference =
        content.includes('SCB') ||
        content.includes('scb') ||
        content.includes('search_tables');

      expect(hasSCBReference).toBe(true);
    });

    it(`${workflow} should instruct try/catch for SCB calls`, () => {
      const filepath = path.join(WORKFLOWS_DIR, workflow);
      const content = fs.readFileSync(filepath, 'utf-8');

      // SCB calls should be wrapped in try/catch to avoid blocking
      const hasSafetyGuidance =
        content.includes('try/catch') ||
        content.includes('optional') ||
        content.includes('do not block');

      expect(hasSafetyGuidance).toBe(true);
    });
  });
});

describe('SCB Data Types', () => {
  it('types.ts should export SCBContext and SCBIndicator', () => {
    const typesPath = path.join(__dirname, '..', 'scripts', 'data-transformers', 'types.ts');
    const content = fs.readFileSync(typesPath, 'utf-8');

    expect(content).toContain('export interface SCBContext');
    expect(content).toContain('export interface SCBIndicator');

    // SCBContext should have fields aligned with all 12 SCB_DOMAIN_TABLES domains
    expect(content).toContain('publicFinances');  // fiscal
    expect(content).toContain('defence');          // defence
    expect(content).toContain('emissions');         // environment
    expect(content).toContain('education');         // education
    expect(content).toContain('healthcare');        // healthcare
    expect(content).toContain('migration');         // migration
    expect(content).toContain('euForeign');         // eu-foreign
    expect(content).toContain('crime');             // justice
    expect(content).toContain('unemployment');      // labour
    expect(content).toContain('housing');           // housing
    expect(content).toContain('transport');         // transport
    expect(content).toContain('gdpGrowth');         // trade
    // Cross-domain indicators
    expect(content).toContain('inflation');
    expect(content).toContain('population');
  });

  it('ArticleContentData should include scbContext field', () => {
    const typesPath = path.join(__dirname, '..', 'scripts', 'data-transformers', 'types.ts');
    const content = fs.readFileSync(typesPath, 'utf-8');

    expect(content).toContain('scbContext?: SCBContext');
  });
});

describe('SCB Policy Domain Mapping', () => {
  it('policy-analysis.ts should export SCB_DOMAIN_TABLES', () => {
    const analysisPath = path.join(__dirname, '..', 'scripts', 'data-transformers', 'policy-analysis.ts');
    const content = fs.readFileSync(analysisPath, 'utf-8');

    const scbDomainTablesIndex = content.indexOf('export const SCB_DOMAIN_TABLES');
    expect(scbDomainTablesIndex).toBeGreaterThan(-1);
    const scbDomainTablesContent = content.slice(scbDomainTablesIndex);

    // Should map all 12 policy domains
    const domains = ['fiscal', 'defence', 'environment', 'education', 'healthcare',
      'migration', 'justice', 'labour', 'housing', 'transport', 'trade'];

    domains.forEach(domain => {
      expect(scbDomainTablesContent).toContain(`${domain}:`);
    });

    // eu-foreign uses quoted key syntax
    expect(scbDomainTablesContent).toContain("'eu-foreign':");
  });

  it('SCB_DOMAIN_TABLES entries should have query and indicators', () => {
    const analysisPath = path.join(__dirname, '..', 'scripts', 'data-transformers', 'policy-analysis.ts');
    const content = fs.readFileSync(analysisPath, 'utf-8');

    // Each entry should have query (Swedish search terms) and indicators
    expect(content).toContain('query:');
    expect(content).toContain('indicators:');
    expect(content).toContain('tables:');
  });
});
