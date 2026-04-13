/**
 * Test Suite for Network Diagnostics Configuration
 *
 * Validates that all agentic news workflows have consistent and correct
 * network configuration, MCP server URLs, health gate patterns, and
 * safe-output domain allowlists.
 *
 * Prevents regressions like PR #1711 where MCP gateway unavailability
 * caused analysis-only fallback due to misconfigured network or missing
 * health gates.
 *
 * Verifies:
 * - Network allowed domains are consistent across all 12 news workflows
 * - MCP server URLs match expected endpoints
 * - MCP health gate (get_sync_status + safeoutputs___noop) present
 * - MCP client defaults align with workflow configuration
 * - Safe-output allowed-domains cover required external services
 * - mcp-setup.sh gateway URL is properly configured
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
const SCRIPTS_DIR = path.join(__dirname, '..', 'scripts');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** All 12 news workflow .md files */
const ALL_NEWS_WORKFLOWS: readonly string[] = [
  'news-article-generator.md',
  'news-committee-reports.md',
  'news-evening-analysis.md',
  'news-interpellations.md',
  'news-month-ahead.md',
  'news-monthly-review.md',
  'news-motions.md',
  'news-propositions.md',
  'news-realtime-monitor.md',
  'news-translate.md',
  'news-week-ahead.md',
  'news-weekly-review.md',
];

/** Core MCP and data service domains that must be in every workflow */
const REQUIRED_MCP_DOMAINS: readonly string[] = [
  'riksdag-regering-ai.onrender.com',
  'api.scb.se',
  'api.worldbank.org',
  'data.riksdagen.se',
  'www.riksdagen.se',
  'www.regeringen.se',
];

/** Canonical MCP server URL for riksdag-regering */
const RIKSDAG_MCP_URL = 'https://riksdag-regering-ai.onrender.com/mcp';

/** MCP gateway URL used inside AWF sandbox (via mcp-setup.sh) */
const MCP_GATEWAY_URL = 'http://host.docker.internal:80/mcp/riksdag-regering';

/** SCB MCP server URL */
const SCB_MCP_URL = 'https://scb-mcp.onrender.com/mcp';

/** Expected tool count for riksdag-regering MCP server */
const EXPECTED_TOOL_COUNT = 32;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract YAML frontmatter from a workflow .md file.
 * Returns content between opening and closing `---` markers.
 */
function extractFrontmatter(content: string): string {
  const lines = content.split('\n');
  const start = lines.indexOf('---');
  if (start === -1) return '';

  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      end = i;
      break;
    }
  }
  if (end === -1) return '';
  return lines.slice(start + 1, end).join('\n');
}

/**
 * Parse the network.allowed list from frontmatter YAML.
 * Simple line-based parser — no YAML library needed for flat lists.
 */
function parseNetworkAllowed(frontmatter: string): string[] {
  const domains: string[] = [];
  let inNetwork = false;
  let inAllowed = false;

  for (const line of frontmatter.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === 'network:') {
      inNetwork = true;
      continue;
    }
    if (inNetwork && trimmed === 'allowed:') {
      inAllowed = true;
      continue;
    }
    if (inAllowed) {
      if (trimmed.startsWith('- ')) {
        domains.push(trimmed.slice(2).trim());
      } else if (trimmed && !trimmed.startsWith('#')) {
        break; // End of allowed list
      }
    }
  }
  return domains;
}

/**
 * Parse the safe-outputs.allowed-domains list from frontmatter YAML.
 */
function parseSafeOutputDomains(frontmatter: string): string[] {
  const domains: string[] = [];
  let inSafeOutputs = false;
  let inAllowedDomains = false;

  for (const line of frontmatter.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === 'safe-outputs:') {
      inSafeOutputs = true;
      continue;
    }
    if (inSafeOutputs && trimmed === 'allowed-domains:') {
      inAllowedDomains = true;
      continue;
    }
    if (inAllowedDomains) {
      if (trimmed.startsWith('- ')) {
        domains.push(trimmed.slice(2).trim());
      } else if (trimmed && !trimmed.startsWith('#')) {
        break;
      }
    }
  }
  return domains;
}

/**
 * Parse the mcp-servers section to extract riksdag-regering URL.
 */
function parseMcpServerUrl(frontmatter: string): string | null {
  let inMcpServers = false;
  let inRiksdagRegering = false;

  for (const line of frontmatter.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === 'mcp-servers:') {
      inMcpServers = true;
      continue;
    }
    if (inMcpServers && trimmed === 'riksdag-regering:') {
      inRiksdagRegering = true;
      continue;
    }
    if (inRiksdagRegering && trimmed.startsWith('url:')) {
      return trimmed.replace('url:', '').trim();
    }
    // Reset if we hit a new top-level key
    if (inRiksdagRegering && !line.startsWith(' ') && !line.startsWith('\t') && trimmed) {
      break;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Network Diagnostics Configuration', () => {
  describe('Network Allowed Domains Consistency', () => {
    const workflowDomains = new Map<string, string[]>();

    // Pre-load all workflow domains
    ALL_NEWS_WORKFLOWS.forEach(workflow => {
      const filepath = path.join(WORKFLOWS_DIR, workflow);
      if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, 'utf-8');
        const fm = extractFrontmatter(content);
        workflowDomains.set(workflow, parseNetworkAllowed(fm));
      }
    });

    it('all 12 news workflows should exist', () => {
      ALL_NEWS_WORKFLOWS.forEach(workflow => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        expect(fs.existsSync(filepath), `Missing workflow: ${workflow}`).toBe(true);
      });
    });

    it('all workflows should have network.allowed configuration', () => {
      workflowDomains.forEach((domains, workflow) => {
        expect(
          domains.length,
          `${workflow} has no network.allowed domains`
        ).toBeGreaterThan(0);
      });
    });

    it('all workflows should include required MCP service domains', () => {
      workflowDomains.forEach((domains, workflow) => {
        REQUIRED_MCP_DOMAINS.forEach(domain => {
          expect(
            domains,
            `${workflow} missing required domain: ${domain}`
          ).toContain(domain);
        });
      });
    });

    it('all workflows should have identical network.allowed domain sets', () => {
      const reference = workflowDomains.get(ALL_NEWS_WORKFLOWS[0]);
      expect(reference).toBeDefined();
      const refSorted = [...reference!].sort();

      workflowDomains.forEach((domains, workflow) => {
        const sorted = [...domains].sort();
        expect(
          sorted,
          `${workflow} has different network.allowed domains than ${ALL_NEWS_WORKFLOWS[0]}`
        ).toEqual(refSorted);
      });
    });

    it('network.allowed should include "default" for gh-aw built-in domains', () => {
      workflowDomains.forEach((domains, workflow) => {
        expect(
          domains,
          `${workflow} missing "default" in network.allowed`
        ).toContain('default');
      });
    });

    it('network.allowed should include "node" for npm registry access', () => {
      workflowDomains.forEach((domains, workflow) => {
        expect(
          domains,
          `${workflow} missing "node" in network.allowed`
        ).toContain('node');
      });
    });
  });

  describe('MCP Server URL Configuration', () => {
    ALL_NEWS_WORKFLOWS.forEach(workflow => {
      it(`${workflow} should configure riksdag-regering MCP with correct URL`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');
        const fm = extractFrontmatter(content);
        const url = parseMcpServerUrl(fm);

        expect(url, `${workflow} missing riksdag-regering MCP server config`).not.toBeNull();
        expect(url).toBe(RIKSDAG_MCP_URL);
      });
    });

    it('MCP client default URL should match workflow configuration', () => {
      const clientPath = path.join(SCRIPTS_DIR, 'mcp-client', 'client.ts');
      const content = fs.readFileSync(clientPath, 'utf-8');

      expect(content).toContain(RIKSDAG_MCP_URL);
    });

    it('SCB client default URL should be correctly configured', () => {
      const clientPath = path.join(SCRIPTS_DIR, 'scb-client.ts');
      const content = fs.readFileSync(clientPath, 'utf-8');

      expect(content).toContain(SCB_MCP_URL);
    });

    it('mcp-setup.sh should configure gateway URL for AWF sandbox', () => {
      const setupPath = path.join(SCRIPTS_DIR, 'mcp-setup.sh');
      const content = fs.readFileSync(setupPath, 'utf-8');

      expect(content).toContain(MCP_GATEWAY_URL);
      expect(content).toContain('MCP_SERVER_URL');
      expect(content).toContain('MCP_AUTH_TOKEN');
      expect(content).toContain('MCP_CLIENT_TIMEOUT_MS');
    });
  });

  describe('MCP Health Gate Patterns', () => {
    ALL_NEWS_WORKFLOWS.forEach(workflow => {
      it(`${workflow} should document get_sync_status() health check`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');

        expect(
          content,
          `${workflow} missing get_sync_status() MCP health gate`
        ).toContain('get_sync_status');
      });

      it(`${workflow} should have safeoutputs___noop fallback on MCP failure`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');

        expect(
          content,
          `${workflow} missing safeoutputs___noop fallback for MCP failure`
        ).toContain('safeoutputs___noop');
      });

      it(`${workflow} should use object payload for noop calls`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');

        // Verify noop uses object payload form: safeoutputs___noop({"message": "..."})
        // not bare string: safeoutputs___noop("...")
        const noopCalls = content.match(/safeoutputs___noop\([^)]+\)/g) || [];
        noopCalls.forEach(call => {
          expect(
            call,
            `${workflow} has noop call without object payload: ${call}`
          ).toMatch(/safeoutputs___noop\(\s*\{/);
        });
      });
    });
  });

  describe('Safe-Output Allowed Domains', () => {
    ALL_NEWS_WORKFLOWS.forEach(workflow => {
      it(`${workflow} should have safe-outputs.allowed-domains covering MCP services`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');
        const fm = extractFrontmatter(content);
        const safeOutputDomains = parseSafeOutputDomains(fm);

        // Safe-output domains should cover the core MCP service domains
        REQUIRED_MCP_DOMAINS.forEach(domain => {
          expect(
            safeOutputDomains,
            `${workflow} safe-outputs missing domain: ${domain}`
          ).toContain(domain);
        });
      });
    });

    it('safe-output domains should be a subset of network.allowed domains', () => {
      ALL_NEWS_WORKFLOWS.forEach(workflow => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');
        const fm = extractFrontmatter(content);
        const networkDomains = parseNetworkAllowed(fm);
        const safeOutputDomains = parseSafeOutputDomains(fm);

        safeOutputDomains.forEach(domain => {
          expect(
            networkDomains,
            `${workflow} safe-output domain "${domain}" not in network.allowed`
          ).toContain(domain);
        });
      });
    });
  });

  describe('Network Diagnostics Bash Block', () => {
    it('news-article-generator.md should have canonical network diagnostics block', () => {
      const filepath = path.join(WORKFLOWS_DIR, 'news-article-generator.md');
      const content = fs.readFileSync(filepath, 'utf-8');

      // Verify the diagnostic block pattern
      expect(content).toContain('Network Diagnostics');
      expect(content).toContain('DNS Resolution Tests');
      expect(content).toContain('HTTPS Connectivity Tests');
      expect(content).toContain('MCP Server Tool Count');
    });

    it('diagnostics block should test all required domains', () => {
      const filepath = path.join(WORKFLOWS_DIR, 'news-article-generator.md');
      const content = fs.readFileSync(filepath, 'utf-8');

      REQUIRED_MCP_DOMAINS.forEach(domain => {
        expect(
          content,
          `Diagnostics block missing domain check for: ${domain}`
        ).toContain(domain);
      });
    });
  });

  describe('Pre-warm and Keep-alive Patterns', () => {
    it('news-article-generator.md should have MCP pre-warm step', () => {
      const filepath = path.join(WORKFLOWS_DIR, 'news-article-generator.md');
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toContain('Pre-warm MCP server');
      expect(content).toContain('tools/list');
      expect(content).toContain('keep-alive');
    });

    ALL_NEWS_WORKFLOWS.forEach(workflow => {
      it(`${workflow} should reference MCP pre-warm or health check`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');

        const hasPreWarm = content.includes('Pre-warm') || content.includes('pre-warm');
        const hasHealthGate = content.includes('get_sync_status');
        const hasToolsList = content.includes('tools/list');

        expect(
          hasPreWarm || hasHealthGate || hasToolsList,
          `${workflow} has no MCP warm-up or health check mechanism`
        ).toBe(true);
      });
    });
  });

  describe('MCP Tool Count Reference', () => {
    it('MCP client should reference expected tool count in documentation or code', () => {
      const clientPath = path.join(SCRIPTS_DIR, 'mcp-client', 'client.ts');
      const content = fs.readFileSync(clientPath, 'utf-8');

      // The client docstring mentions 32 tools
      expect(content).toContain(`${EXPECTED_TOOL_COUNT}`);
    });

    it('agentic workflow MCP queries test should exist', () => {
      const testPath = path.join(__dirname, 'agentic-workflow-mcp-queries.test.ts');
      expect(fs.existsSync(testPath)).toBe(true);
    });
  });

  describe('Stakeholder Perspectives Reference', () => {
    ALL_NEWS_WORKFLOWS.forEach(workflow => {
      // Skip translate workflow — it doesn't generate original analysis
      if (workflow === 'news-translate.md') return;

      it(`${workflow} should reference stakeholder-perspectives.md`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');

        expect(
          content,
          `${workflow} missing stakeholder-perspectives.md reference`
        ).toContain('stakeholder-perspectives');
      });
    });
  });
});
