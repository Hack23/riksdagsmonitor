/**
 * @module mcp-client/config/auth
 * @description Single sink for MCP auth-token resolution.
 *
 * All token-bearing env vars and config-file paths are read here and
 * nowhere else. Per `.github/skills/Authentication-and-Credentials-for-
 * Agentic-Workflows`, this keeps the auth surface auditable: a new credential
 * source is a one-file change, and a security review only needs to read this
 * module to enumerate every place the client could pull a token from.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs';

/**
 * Resolve the default MCP auth token.
 * Priority:
 *   1. MCP_AUTH_TOKEN env var (strips "Bearer " prefix if present)
 *   2. MCP_GATEWAY_API_KEY env var (raw API key)
 *   3. gateway.apiKey from MCP config file (legacy — raw API key)
 *   4. mcpServers['riksdag-regering'].headers.Authorization from MCP config file
 *      (raw API key — used as-is)
 *
 * The MCP gateway expects a raw API key (no "Bearer " prefix). If a legacy
 * "Bearer <key>" value is stored in the config, the prefix is stripped
 * automatically.
 */
export function getDefaultAuthToken(): string {
  if (process.env['MCP_AUTH_TOKEN']) return process.env['MCP_AUTH_TOKEN'].replace(/^Bearer\s+/i, '');
  if (process.env['MCP_GATEWAY_API_KEY']) return process.env['MCP_GATEWAY_API_KEY'];

  const configPath = process.env['GH_AW_MCP_CONFIG'] ?? '/home/runner/.copilot/mcp-config.json';
  try {
    if (fs.existsSync(configPath)) {
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Record<string, unknown>;

      const gateway = raw['gateway'] as Record<string, unknown> | undefined;
      const apiKey = gateway?.['apiKey'] as string | undefined;
      if (apiKey) return apiKey.replace(/^Bearer\s+/i, '');

      const mcpServers = raw['mcpServers'] as Record<string, unknown> | undefined;
      const rrServer = mcpServers?.['riksdag-regering'] as Record<string, unknown> | undefined;
      const headers = rrServer?.['headers'] as Record<string, unknown> | undefined;
      const authHeader = headers?.['Authorization'] as string | undefined;
      if (authHeader) return authHeader.replace(/^Bearer\s+/i, '');
    }
  } catch {
    // Config file read is best-effort — fall through to empty token
  }
  return '';
}

/**
 * Token snapshot resolved once at module load. Mirrors the legacy
 * `DEFAULT_MCP_AUTH_TOKEN` constant from the monolithic client.
 */
export const DEFAULT_MCP_AUTH_TOKEN: string = getDefaultAuthToken();
