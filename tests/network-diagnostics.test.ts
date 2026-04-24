/**
 * Test Suite for Network Diagnostics Configuration
 *
 * Validates that all agentic news workflows have consistent and correct
 * network configuration, MCP server URLs, health gate patterns, and
 * safe-output domain allowlists.
 *
 * Root cause from PR #1711: the "Network and MCP diagnostics" step ran
 * as a pre-flight check BEFORE the MCP Gateway was started by gh-aw.
 * It tested direct HTTPS to external endpoints (which passed), but the
 * agent actually routes through the MCP Gateway at host.docker.internal
 * (port 80 in gh-aw <0.69, port 8080 in gh-aw >=0.69; resolved dynamically
 * (started later). The gateway returned 0 tools, causing analysis-only
 * fallback — despite diagnostics showing all green.
 *
 * This test suite enforces:
 * - Pre-flight step is clearly named to avoid false confidence
 * - In-prompt gateway diagnostics exist (run AFTER gateway is up)
 * - Both direct and gateway routing are tested in the agent prompt
 * - Network allowed domains are consistent across all 12 workflows
 * - MCP health gate (get_sync_status + safeoutputs___noop) present
 * - Safe-output allowed-domains cover required external services
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readWorkflowWithImports } from './helpers/workflow-imports.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKFLOWS_DIR = path.join(__dirname, '..', '.github', 'workflows');
const SCRIPTS_DIR = path.join(__dirname, '..', 'scripts');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** All 12 news workflow .md files */
const ALL_NEWS_WORKFLOWS: readonly string[] = [
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

/** MCP gateway URL pattern used inside AWF sandbox (port resolved dynamically
 * by mcp-setup.sh — gh-aw <0.69 used 80, gh-aw >=0.69 uses 8080). */
const MCP_GATEWAY_URL_PATTERN = /http:\/\/\$\{MCP_GATEWAY_DOMAIN\}:\$\{MCP_GATEWAY_PORT\}\/mcp\/riksdag-regering/;

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

    it('all 11 news workflows should exist', () => {
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

    it('network.allowed should include "defaults" for gh-aw built-in domains', () => {
      workflowDomains.forEach((domains, workflow) => {
        expect(
          domains,
          `${workflow} missing "defaults" in network.allowed`
        ).toContain('defaults');
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

      expect(content).toMatch(MCP_GATEWAY_URL_PATTERN);
      expect(content).toContain('MCP_SERVER_URL');
      expect(content).toContain('MCP_AUTH_TOKEN');
      expect(content).toContain('MCP_CLIENT_TIMEOUT_MS');
      // Gateway port must be resolved dynamically (env > config > 8080 default)
      expect(content).toContain('MCP_GATEWAY_PORT');
      expect(content).toContain('MCP_GATEWAY_DOMAIN');
    });
  });

  describe('MCP Health Gate Patterns', () => {
    ALL_NEWS_WORKFLOWS.forEach(workflow => {
      it(`${workflow} should document get_sync_status() health check`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        // The health-gate rule (call `get_sync_status` up to 3× at workflow
        // start) lives in the imported `../prompts/02-mcp-access.md` module.
        const content = readWorkflowWithImports(filepath);

        expect(
          content,
          `${workflow} missing get_sync_status() MCP health gate`
        ).toContain('get_sync_status');
      });

      it(`${workflow} should have safeoutputs___noop fallback on MCP failure`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        // The MCP-unreachable no-op policy lives in the imported
        // `../prompts/07-commit-and-pr.md` module (referenced from
        // `../prompts/02-mcp-access.md`).
        const content = readWorkflowWithImports(filepath);

        expect(
          content,
          `${workflow} missing safeoutputs___noop fallback for MCP failure`
        ).toContain('safeoutputs___noop');
      });

      it(`${workflow} should use object payload for noop calls`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = readWorkflowWithImports(filepath);

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

  describe('Pre-flight External Reachability Check (runs before MCP Gateway)', () => {
    it('all workflows should label pre-flight step correctly', () => {
      // The pre-flight step tests DIRECT external HTTPS — not gateway routing.
      // It MUST be clearly named to avoid false confidence (see PR #1711).
      ALL_NEWS_WORKFLOWS.forEach(workflow => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');
        const fm = extractFrontmatter(content);

        // Must NOT use the misleading old name
        expect(
          fm,
          `${workflow} still uses misleading "Network and MCP diagnostics" step name`
        ).not.toContain('- name: Network and MCP diagnostics');

        // Must use the clarified name
        expect(
          fm,
          `${workflow} missing pre-flight step with clarified name`
        ).toContain('Pre-flight external endpoint reachability check');
      });
    });

    it('news-propositions.md should have canonical diagnostics content', () => {
      const filepath = path.join(WORKFLOWS_DIR, 'news-propositions.md');
      const content = fs.readFileSync(filepath, 'utf-8');

      expect(content).toContain('DNS Resolution Tests');
      expect(content).toContain('HTTPS Connectivity Tests');
      expect(content).toContain('MCP Server Tool Count');
    });

    it('diagnostics block should test all required domains', () => {
      const filepath = path.join(WORKFLOWS_DIR, 'news-propositions.md');
      const content = fs.readFileSync(filepath, 'utf-8');

      REQUIRED_MCP_DOMAINS.forEach(domain => {
        expect(
          content,
          `Diagnostics block missing domain check for: ${domain}`
        ).toContain(domain);
      });
    });
  });

  describe('In-Prompt MCP Gateway Diagnostics (runs after MCP Gateway)', () => {
    // The dedicated "MCP Quick Diagnostic" in-prompt block that existed in
    // the pre-modularisation architecture is now replaced by the health gate
    // in `../prompts/02-mcp-access.md` (3× `get_sync_status` at workflow
    // start, then proceed). The CI `steps:` block handles external DNS /
    // HTTPS pre-flight checks, and the MCP-unreachable no-op policy lives
    // in `../prompts/07-commit-and-pr.md`. We therefore verify the effective
    // prompt exposes the health gate rather than a specific legacy heading.
    const CONTENT_GENERATION_WORKFLOWS = ALL_NEWS_WORKFLOWS.filter(w => w !== 'news-translate.md');

    CONTENT_GENERATION_WORKFLOWS.forEach(workflow => {
      it(`${workflow} should expose MCP health gate in effective prompt`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = readWorkflowWithImports(filepath);

        // Health-gate rule from `../prompts/02-mcp-access.md`:
        //   1. call `get_sync_status({})`, retry up to 3× 20 s apart,
        //   2. on third failure, apply the MCP-unreachable no-op policy.
        expect(
          content,
          `${workflow} missing in-prompt MCP health gate (get_sync_status)`
        ).toContain('get_sync_status');
        expect(
          content,
          `${workflow} missing MCP-unreachable no-op policy (safeoutputs___noop)`
        ).toContain('safeoutputs___noop');
      });

      it(`${workflow} should test external MCP reachability in frontmatter pre-flight step`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');
        const fm = extractFrontmatter(content);

        // External HTTPS reachability to the MCP server is verified by the
        // frontmatter pre-flight step, not by an in-prompt diagnostic block.
        expect(
          fm,
          `${workflow} missing pre-flight external reachability check`
        ).toContain('Pre-flight external endpoint reachability check');
        expect(
          fm,
          `${workflow} pre-flight step should probe the Render MCP endpoint`
        ).toContain('riksdag-regering-ai.onrender.com');
      });
    });
  });

  describe('Pre-warm and Keep-alive Patterns', () => {
    it('news-propositions.md should have MCP pre-warm step', () => {
      const filepath = path.join(WORKFLOWS_DIR, 'news-propositions.md');
      const content = fs.readFileSync(filepath, 'utf-8');

      // The single `curl`-based pre-warm `steps:` block is canonical
      // (see `../prompts/02-mcp-access.md` §"Pre-warm step"). We no longer
      // keep long-running keep-alive pingers — the `safeoutputs` session is
      // kept alive by completing work inside its ~30-minute idle window.
      expect(content).toContain('Pre-warm MCP server');
      expect(content).toContain('tools/list');
    });

    ALL_NEWS_WORKFLOWS.forEach(workflow => {
      it(`${workflow} should reference MCP pre-warm or health check`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = readWorkflowWithImports(filepath);

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

  describe('Step Ordering Awareness', () => {
    it('pre-flight steps should be in frontmatter, health gate in prompt body', () => {
      // Validates the architectural split:
      // - Pre-flight external reachability checks (frontmatter `steps:`) run
      //   BEFORE the agent starts, proving DNS + HTTPS to the Render MCP
      //   endpoint work from the runner.
      // - The in-prompt MCP health gate (`get_sync_status` + noop fallback)
      //   runs INSIDE the agent, proving the MCP Gateway routes tool calls
      //   correctly. That rule lives in `../prompts/02-mcp-access.md`.
      const contentWorkflows = ALL_NEWS_WORKFLOWS.filter(w => w !== 'news-translate.md');
      contentWorkflows.forEach(workflow => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');
        const fm = extractFrontmatter(content);
        const effective = readWorkflowWithImports(filepath);

        // Pre-flight reachability should be in frontmatter steps.
        expect(
          fm,
          `${workflow} missing pre-flight check in frontmatter steps`
        ).toContain('Pre-flight external endpoint reachability');

        // Health gate should be reachable from the effective prompt surface
        // (workflow body + imported modules).
        expect(
          effective,
          `${workflow} missing MCP health gate in effective prompt`
        ).toContain('get_sync_status');
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
      // Skip news-translate.md — it only translates existing EN/SV articles
      // into 12 additional languages; it does not generate original analysis.
      if (workflow === 'news-translate.md') return;

      it(`${workflow} should reference stakeholder-perspectives artifact`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        // The `stakeholder-perspectives.md` artifact requirement lives in
        // `../prompts/04-analysis-pipeline.md` / `05-analysis-gate.md` /
        // `06-article-generation.md` / `07-commit-and-pr.md`, so read the
        // effective prompt surface.
        const content = readWorkflowWithImports(filepath);

        expect(
          content,
          `${workflow} missing stakeholder-perspectives artifact reference`
        ).toContain('stakeholder-perspectives');
      });
    });
  });
});
