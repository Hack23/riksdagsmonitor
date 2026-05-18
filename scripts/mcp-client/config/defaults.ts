/**
 * @module mcp-client/config/defaults
 * @description Default timeout, retry, and server URL constants for the
 * MCPClient. Resolution is centralised here so a single edit changes the
 * timeout/retry behaviour for all riksdag-regering callers.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { getDefaultMcpServerUrl } from './gateway-resolver.js';

export const DEFAULT_MAX_RETRIES = 3;
export const RETRY_DELAY = 2000;

/**
 * Server URL snapshot resolved once at module load. Mirrors the legacy
 * `DEFAULT_MCP_SERVER_URL` constant from the monolithic client.
 */
export const DEFAULT_MCP_SERVER_URL: string = getDefaultMcpServerUrl();

/**
 * Resolve the per-request timeout (ms) from `MCP_CLIENT_TIMEOUT_MS` env var.
 * Falls back to 30 s. Invalid values fall back to 30 s as well.
 */
export function getDefaultTimeout(): number {
  const envVal = process.env['MCP_CLIENT_TIMEOUT_MS'];
  return envVal ? (Number.parseInt(envVal, 10) || 30_000) : 30_000;
}
