/**
 * @module mcp-client/config/gateway-resolver
 * @description Resolve the MCP gateway URL when running inside the AWF
 * sandbox (gh-aw v0.69+ uses port 8080 via `host.docker.internal`).
 *
 * Falls back to the direct onrender HTTPS endpoint for local dev / CI
 * outside the sandbox. All resolution is best-effort: missing config
 * files never raise — they only steer the URL choice.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs';

import { hasMcpGatewayApiKey } from './auth.js';

/**
 * Default MCP gateway port. The `ghcr.io/github/gh-aw-mcpg` container exports
 * `MCP_GATEWAY_PORT` in the compiled `news-*.lock.yml` workflows. Was `80`
 * in gh-aw <0.69 and is `8080` in gh-aw >=0.69. Always resolve dynamically
 * from `mcp-config.json`/env when possible — see {@link getAwfGatewayPort}.
 */
const DEFAULT_MCP_GATEWAY_PORT = 8080;
const DEFAULT_MCP_GATEWAY_DOMAIN = 'host.docker.internal';
const DIRECT_MCP_SERVER_URL = 'https://riksdag-regering-ai.onrender.com/mcp';

/**
 * Resolve the MCP gateway port from (in order):
 *   1. `MCP_GATEWAY_PORT` env var (set by the gh-aw lock file at gateway start)
 *   2. `gateway.port` in mcp-config.json (written by the gh-aw mcp-gateway bootstrap)
 *   3. {@link DEFAULT_MCP_GATEWAY_PORT}
 */
export function getAwfGatewayPort(): number {
  const envPort = process.env['MCP_GATEWAY_PORT'];
  if (envPort) {
    const parsed = Number.parseInt(envPort, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const configPath = process.env['GH_AW_MCP_CONFIG'] ?? '/home/runner/.copilot/mcp-config.json';
  try {
    if (fs.existsSync(configPath)) {
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Record<string, unknown>;
      const gateway = raw['gateway'] as Record<string, unknown> | undefined;
      const port = gateway?.['port'];
      if (typeof port === 'number' && port > 0) return port;
      if (typeof port === 'string') {
        const parsed = Number.parseInt(port, 10);
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
      }
    }
  } catch {
    // Best-effort — fall through to default port
  }
  return DEFAULT_MCP_GATEWAY_PORT;
}

/**
 * Resolve the MCP gateway domain from (in order):
 *   1. `MCP_GATEWAY_DOMAIN` env var
 *   2. `gateway.domain` in mcp-config.json
 *   3. {@link DEFAULT_MCP_GATEWAY_DOMAIN}
 */
export function getAwfGatewayDomain(): string {
  const envDomain = process.env['MCP_GATEWAY_DOMAIN'];
  if (envDomain) return envDomain;
  const configPath = process.env['GH_AW_MCP_CONFIG'] ?? '/home/runner/.copilot/mcp-config.json';
  try {
    if (fs.existsSync(configPath)) {
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Record<string, unknown>;
      const gateway = raw['gateway'] as Record<string, unknown> | undefined;
      const domain = gateway?.['domain'];
      if (typeof domain === 'string' && domain.length > 0) return domain;
    }
  } catch {
    // Best-effort — fall through to default domain
  }
  return DEFAULT_MCP_GATEWAY_DOMAIN;
}

/**
 * Build the AWF gateway URL for a given MCP server name. Used as the routing
 * target inside the AWF sandbox where direct HTTPS to onrender.com is blocked.
 */
export function buildAwfGatewayUrl(serverName: string): string {
  return `http://${getAwfGatewayDomain()}:${getAwfGatewayPort()}/mcp/${serverName}`;
}

/**
 * Detect whether the current process runs inside the AWF sandbox with the
 * MCP gateway active. Heuristic matches `scripts/mcp-setup.sh`:
 *   - `MCP_GATEWAY_API_KEY` env var present (checked via `hasMcpGatewayApiKey`
 *     in `config/auth.ts` — the single auditable sink for token-bearing env
 *     reads), OR
 *   - `gateway.apiKey` present in `mcp-config.json`, OR
 *   - `mcpServers['riksdag-regering'].headers.Authorization` present in
 *     `mcp-config.json` (populated by the gateway bootstrap).
 *
 * When true, the client must route through the gateway domain/port resolved
 * by {@link buildAwfGatewayUrl} rather than the direct onrender HTTPS URL.
 * The AWF api-proxy performs TLS MITM on outbound HTTPS which produces
 * `EPROTO SSL wrong version number` when Node.js hits onrender.com directly,
 * so gateway routing is mandatory inside the sandbox even when
 * `scripts/mcp-setup.sh` was not sourced first.
 */
export function isAwfGatewayActive(): boolean {
  if (hasMcpGatewayApiKey()) return true;
  const configPath = process.env['GH_AW_MCP_CONFIG'] ?? '/home/runner/.copilot/mcp-config.json';
  try {
    if (!fs.existsSync(configPath)) return false;
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Record<string, unknown>;
    const gateway = raw['gateway'] as Record<string, unknown> | undefined;
    if (gateway?.['apiKey']) return true;
    const mcpServers = raw['mcpServers'] as Record<string, unknown> | undefined;
    const rrServer = mcpServers?.['riksdag-regering'] as Record<string, unknown> | undefined;
    const headers = rrServer?.['headers'] as Record<string, unknown> | undefined;
    if (headers?.['Authorization']) return true;
  } catch {
    // Config read is best-effort — absence of config is not an error.
  }
  return false;
}

/**
 * Resolve the default MCP server URL.
 * Priority:
 *   1. `MCP_SERVER_URL` env var (explicit override — e.g. from `mcp-setup.sh`).
 *   2. AWF sandbox auto-detection → gateway URL on the dynamically-resolved
 *      `MCP_GATEWAY_DOMAIN:MCP_GATEWAY_PORT` (gh-aw v0.69+ uses port 8080).
 *   3. Direct onrender HTTPS endpoint (local dev / CI outside AWF sandbox).
 */
export function getDefaultMcpServerUrl(): string {
  const explicit = process.env['MCP_SERVER_URL'];
  if (explicit) return explicit;
  if (isAwfGatewayActive()) return buildAwfGatewayUrl('riksdag-regering');
  return DIRECT_MCP_SERVER_URL;
}
