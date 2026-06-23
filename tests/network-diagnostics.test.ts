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
 * - Network allowed domains are consistent across all 14 workflows
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
/**
 * Shared composite action that contains the canonical pre-warm + pre-flight
 * diagnostics for every `news-*.md` agentic workflow. Introduced in PR #2008
 * to deduplicate ~80 lines of identical YAML across 11 workflows. The
 * frontmatter `steps:` block in each workflow references this action via
 * `uses: ./.github/actions/news-prewarm`, so the diagnostics literals
 * (e.g. "Pre-flight external endpoint reachability check", "DNS Resolution
 * Tests") now live in the action file rather than each workflow.
 */
const NEWS_PREWARM_ACTION = path.join(
  __dirname,
  '..',
  '.github',
  'actions',
  'news-prewarm',
  'action.yml'
);
const NEWS_PREWARM_USES_REF = './.github/actions/news-prewarm';
// A `uses:` reference to the shared news-prewarm composite action may appear as
// the bare local form (`./.github/actions/news-prewarm`) or the SHA-pinned
// remote form (`<owner>/<repo>/.github/actions/news-prewarm@<sha>`) that
// `gh aw compile` emits under strict action pinning. Match either form.
const NEWS_PREWARM_USES_RE =
  /uses:\s*(?:\.\/|[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/)\.github\/actions\/news-prewarm(?:@[0-9a-fA-F]+)?/;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** All 14 news workflow .md files */
const ALL_NEWS_WORKFLOWS: readonly string[] = [
  'news-committee-reports.md',
  'news-election-cycle.md',
  'news-evening-analysis.md',
  'news-interpellations.md',
  'news-month-ahead.md',
  'news-monthly-review.md',
  'news-motions.md',
  'news-propositions.md',
  'news-quarter-ahead.md',
  'news-realtime-monitor.md',
  'news-translate.md',
  'news-week-ahead.md',
  'news-weekly-review.md',
  'news-year-ahead.md',
];

/**
 * Ecosystem identifiers in `network.allowed` are gh-aw shorthand for a set of
 * upstream FQDNs (see gh-aw v0.74.7 `network.md`). The subset assertion below
 * (`safe-output domains should be a subset of network.allowed domains`) needs
 * to know what each identifier expands to so it can recognise that, e.g.,
 * `raw.githubusercontent.com` listed in `safe-outputs.allowed-domains` is
 * already covered by the `github` ecosystem identifier in `network.allowed`
 * — even though no literal `raw.githubusercontent.com` appears there.
 *
 * Source: https://github.com/github/gh-aw/blob/v0.74.7/.github/aw/network.md
 *
 * Only the FQDNs we actually use in `safe-outputs.allowed-domains` need to be
 * listed here; the map is opt-in and conservative.
 */
const ECOSYSTEM_DOMAIN_COVERAGE: Record<string, readonly string[]> = {
  github: [
    'github.com',
    'api.github.com',
    'raw.githubusercontent.com',
    'codeload.github.com',
    'objects.githubusercontent.com',
    'uploads.github.com',
    'gist.githubusercontent.com',
  ],
  node: [
    'registry.npmjs.org',
    'registry.yarnpkg.com',
  ],
  containers: [
    'docker.io',
    'registry-1.docker.io',
    'auth.docker.io',
    'production.cloudflare.docker.com',
    'ghcr.io',
  ],
};

/**
 * Returns true if `fqdn` is either literally in `networkDomains` or is
 * covered by an ecosystem identifier present in `networkDomains`.
 */
function isCoveredByNetwork(fqdn: string, networkDomains: readonly string[]): boolean {
  if (networkDomains.includes(fqdn)) return true;
  for (const [ecosystem, covered] of Object.entries(ECOSYSTEM_DOMAIN_COVERAGE)) {
    if (networkDomains.includes(ecosystem) && covered.includes(fqdn)) {
      return true;
    }
  }
  return false;
}

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

    it('all 14 news workflows should exist', () => {
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
      // The direct onrender HTTPS endpoint lives in the gateway-resolver
      // module after the mcp-client refactor (PR #2588); it is re-exported
      // via `scripts/mcp-client/index.ts` and remains the single source of
      // truth consumed by `client.ts` through `getDefaultMcpServerUrl()`.
      const resolverPath = path.join(
        SCRIPTS_DIR,
        'mcp-client',
        'config',
        'gateway-resolver.ts',
      );
      const content = fs.readFileSync(resolverPath, 'utf-8');

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
      it(`${workflow} should set threat detection to warning-only mode`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');
        const fm = extractFrontmatter(content);

        expect(
          fm,
          `${workflow} missing safe-outputs.threat-detection.continue-on-error: true`
        ).toMatch(/safe-outputs:[\s\S]*^\s{2}threat-detection:\n^\s{4}continue-on-error:\s+true\b/m);
      });
    });

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

    it('safe-output domains should be a subset of network.allowed domains (literal or via ecosystem identifier)', () => {
      ALL_NEWS_WORKFLOWS.forEach(workflow => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');
        const fm = extractFrontmatter(content);
        const networkDomains = parseNetworkAllowed(fm);
        const safeOutputDomains = parseSafeOutputDomains(fm);

        safeOutputDomains.forEach(domain => {
          expect(
            isCoveredByNetwork(domain, networkDomains),
            `${workflow} safe-output domain "${domain}" not covered by network.allowed ` +
              `(neither as a literal entry nor via an ecosystem identifier such as ` +
              `'github', 'node', or 'containers')`
          ).toBe(true);
        });
      });
    });
  });

  describe('Pre-flight External Reachability Check (runs before MCP Gateway)', () => {
    // The pre-flight diagnostics were extracted in PR #2008 into the shared
    // composite action `.github/actions/news-prewarm/action.yml` and every
    // news workflow now references it via `uses: ./.github/actions/news-prewarm`.
    // We therefore validate (a) the composite action carries the canonical
    // diagnostics content, and (b) every workflow wires the action into its
    // frontmatter `steps:` block — instead of grepping each workflow file for
    // the inline YAML literals (which no longer exist).

    it('shared news-prewarm composite action exists', () => {
      expect(
        fs.existsSync(NEWS_PREWARM_ACTION),
        `Missing shared pre-warm action at ${NEWS_PREWARM_ACTION}`
      ).toBe(true);
    });

    it('shared news-prewarm action labels pre-flight step correctly', () => {
      const action = fs.readFileSync(NEWS_PREWARM_ACTION, 'utf-8');

      // Must NOT use the misleading old name from PR #1711.
      expect(
        action,
        'news-prewarm still uses misleading "Network and MCP diagnostics" step name'
      ).not.toContain('- name: Network and MCP diagnostics');

      // Must use the clarified name.
      expect(
        action,
        'news-prewarm missing pre-flight step with clarified name'
      ).toContain('Pre-flight external endpoint reachability check');
    });

    it('all workflows reference the shared news-prewarm composite action', () => {
      ALL_NEWS_WORKFLOWS.forEach(workflow => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');
        const fm = extractFrontmatter(content);

        // Each workflow must wire the shared composite action so the
        // pre-flight + pre-warm diagnostics run before the MCP Gateway.
        expect(
          fm,
          `${workflow} does not reference shared composite action ${NEWS_PREWARM_USES_REF}`
        ).toMatch(NEWS_PREWARM_USES_RE);

        // And it must NOT have re-introduced the misleading inline name.
        expect(
          fm,
          `${workflow} still uses misleading "Network and MCP diagnostics" inline step`
        ).not.toContain('- name: Network and MCP diagnostics');
      });
    });

    it('shared news-prewarm action has canonical diagnostics content', () => {
      const action = fs.readFileSync(NEWS_PREWARM_ACTION, 'utf-8');

      expect(action).toContain('DNS Resolution Tests');
      expect(action).toContain('HTTPS Connectivity Tests');
      expect(action).toContain('MCP Server Tool Count');
    });

    it('shared news-prewarm action probes all required MCP/data domains', () => {
      const action = fs.readFileSync(NEWS_PREWARM_ACTION, 'utf-8');

      REQUIRED_MCP_DOMAINS.forEach(domain => {
        expect(
          action,
          `news-prewarm action missing domain check for: ${domain}`
        ).toContain(domain);
      });
    });
  });

  describe('In-Prompt MCP Gateway Diagnostics (runs after MCP Gateway)', () => {
    // The dedicated "MCP Quick Diagnostic" in-prompt block that existed in
    // the pre-modularisation architecture is now replaced by the health gate
    // in `../prompts/02-mcp-access.md` (3× `get_sync_status` at workflow
    // start, then proceed). The frontmatter `steps:` block references the
    // shared composite action `./.github/actions/news-prewarm` (PR #2008)
    // which handles external DNS / HTTPS pre-flight checks; the
    // MCP-unreachable no-op policy lives in `../prompts/07-commit-and-pr.md`.
    // We therefore verify the effective prompt exposes the health gate and
    // that the workflow wires in the shared pre-flight composite action.
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

      it(`${workflow} should wire shared pre-flight composite action`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');
        const fm = extractFrontmatter(content);

        // External HTTPS reachability to the MCP server is verified by the
        // frontmatter `steps:` block, which references the shared composite
        // action `./.github/actions/news-prewarm` rather than inlining the
        // pre-flight YAML in every workflow (PR #2008 deduplication).
        expect(
          fm,
          `${workflow} missing reference to shared pre-flight action ${NEWS_PREWARM_USES_REF}`
        ).toMatch(NEWS_PREWARM_USES_RE);
      });
    });

    it('shared news-prewarm action probes the Render MCP endpoint', () => {
      // The shared composite action is the single place where the external
      // HTTPS reachability check runs, so the Render MCP endpoint probe must
      // live there (either as a literal default or via the `mcp-url` input).
      const action = fs.readFileSync(NEWS_PREWARM_ACTION, 'utf-8');
      expect(
        action,
        'news-prewarm action does not probe riksdag-regering-ai.onrender.com'
      ).toContain('riksdag-regering-ai.onrender.com');
    });
  });

  describe('Pre-warm and Keep-alive Patterns', () => {
    it('shared news-prewarm action contains MCP pre-warm step', () => {
      // The single `curl`-based pre-warm `steps:` block is canonical and now
      // lives in the shared composite action `.github/actions/news-prewarm/`
      // (see `../prompts/02-mcp-access.md` §"Pre-warm step" and PR #2008).
      // We no longer keep long-running keep-alive pingers — the `safeoutputs`
      // session is kept alive by completing work inside its ~30-minute idle
      // window.
      const action = fs.readFileSync(NEWS_PREWARM_ACTION, 'utf-8');
      expect(action).toContain('Pre-warm MCP server');
      expect(action).toContain('tools/list');
    });

    ALL_NEWS_WORKFLOWS.forEach(workflow => {
      it(`${workflow} should reference MCP pre-warm or health check`, () => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = readWorkflowWithImports(filepath);
        const fm = extractFrontmatter(fs.readFileSync(filepath, 'utf-8'));

        const hasPreWarmReference =
          content.includes('Pre-warm') ||
          content.includes('pre-warm') ||
          NEWS_PREWARM_USES_RE.test(fm);
        const hasHealthGate = content.includes('get_sync_status');
        const hasToolsList = content.includes('tools/list');

        expect(
          hasPreWarmReference || hasHealthGate || hasToolsList,
          `${workflow} has no MCP warm-up or health check mechanism`
        ).toBe(true);
      });
    });
  });

  describe('Step Ordering Awareness', () => {
    it('pre-flight steps should be in frontmatter (via shared action), health gate in prompt body', () => {
      // Validates the architectural split:
      // - Pre-flight external reachability checks run BEFORE the agent starts
      //   via the shared composite action `./.github/actions/news-prewarm`
      //   wired into the frontmatter `steps:` block (PR #2008). This proves
      //   DNS + HTTPS to the Render MCP endpoint work from the runner.
      // - The in-prompt MCP health gate (`get_sync_status` + noop fallback)
      //   runs INSIDE the agent, proving the MCP Gateway routes tool calls
      //   correctly. That rule lives in `../prompts/02-mcp-access.md`.
      const contentWorkflows = ALL_NEWS_WORKFLOWS.filter(w => w !== 'news-translate.md');
      contentWorkflows.forEach(workflow => {
        const filepath = path.join(WORKFLOWS_DIR, workflow);
        const content = fs.readFileSync(filepath, 'utf-8');
        const fm = extractFrontmatter(content);
        const effective = readWorkflowWithImports(filepath);

        // Pre-flight reachability is wired via the shared composite action
        // referenced from the frontmatter `steps:` block.
        expect(
          fm,
          `${workflow} missing shared pre-flight composite action ${NEWS_PREWARM_USES_REF}`
        ).toMatch(NEWS_PREWARM_USES_RE);

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
