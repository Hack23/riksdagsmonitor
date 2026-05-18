/**
 * @module mcp-client/config/auth
 * @description Single sink for MCP auth-token **value** resolution.
 *
 * All token-bearing env vars and config-file token values are read here and
 * nowhere else. Per `.github/skills/Authentication-and-Credentials-for-
 * Agentic-Workflows`, this keeps the secret-value surface auditable: a new
 * credential source is a one-file change, and a security review only needs
 * to read this module to enumerate every place the client could pull a
 * token *value* from.
 *
 * Scope note: non-secret routing keys from the same MCP config file
 * (`gateway.port`, `gateway.domain`, and presence-only checks for
 * `gateway.apiKey` / `headers.Authorization`) are read in
 * `config/gateway-resolver.ts`. Those reads never return a token value to
 * the caller — they only steer URL selection — so the "single sink" rule
 * here covers every place a secret token can leak into the rest of the
 * client.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import fs from 'fs';

/**
 * Resolve the default MCP auth token.
 * Priority (the first non-empty value wins; every returned value has any
 * legacy `Bearer ` prefix stripped because the MCP gateway expects a raw
 * API key):
 *   1. MCP_AUTH_TOKEN env var (Bearer prefix stripped)
 *   2. MCP_GATEWAY_API_KEY env var (raw API key)
 *   3. gateway.apiKey from MCP config file (Bearer prefix stripped)
 *   4. mcpServers['riksdag-regering'].headers.Authorization from MCP config
 *      file (Bearer prefix stripped — the `Authorization` header is the
 *      legacy storage location for a raw API key in pre-v0.69 mcp-config.json)
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

/**
 * Non-secret presence check for the `MCP_GATEWAY_API_KEY` env var.
 *
 * Returns only a boolean — the token value never leaves this module. Routing
 * logic in `config/gateway-resolver.ts` calls this helper instead of reading
 * the env var directly so that every secret-bearing env access remains
 * auditable in a single file (per the
 * `Authentication-and-Credentials-for-Agentic-Workflows` skill).
 */
export function hasMcpGatewayApiKey(): boolean {
  const value = process.env['MCP_GATEWAY_API_KEY'];
  return typeof value === 'string' && value.length > 0;
}
