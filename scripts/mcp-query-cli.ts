/**
 * @module mcp-query-cli
 * @description Lightweight CLI wrapper around MCPClient for querying individual
 * MCP tools from bash. Designed as the proper fallback for agentic workflows
 * that cannot use framework MCP tool calls directly.
 *
 * Usage:
 *   npx tsx scripts/mcp-query-cli.ts <tool_name> [json_params]
 *
 * Examples:
 *   npx tsx scripts/mcp-query-cli.ts get_sync_status
 *   npx tsx scripts/mcp-query-cli.ts get_betankanden '{"limit":20,"rm":"2025/26"}'
 *   npx tsx scripts/mcp-query-cli.ts get_calendar_events '{"from":"2026-02-25","tom":"2026-02-26"}'
 *   npx tsx scripts/mcp-query-cli.ts search_regering '{"from_date":"2026-02-25","limit":10}'
 *
 * Environment variables (set via `source scripts/mcp-setup.sh`):
 *   MCP_SERVER_URL        - MCP gateway URL
 *   MCP_AUTH_TOKEN         - Bearer token for gateway auth
 *   MCP_CLIENT_TIMEOUT_MS  - Request timeout in ms
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { MCPClient } from './mcp-client/index.js';

async function main(): Promise<void> {
  const toolName = process.argv[2];
  if (!toolName) {
    console.error('Usage: npx tsx scripts/mcp-query-cli.ts <tool_name> [json_params]');
    console.error('');
    console.error('Examples:');
    console.error('  npx tsx scripts/mcp-query-cli.ts get_sync_status');
    console.error('  npx tsx scripts/mcp-query-cli.ts get_betankanden \'{"limit":20}\'');
    console.error('  npx tsx scripts/mcp-query-cli.ts get_calendar_events \'{"from":"2026-02-25","tom":"2026-02-26"}\'');
    process.exit(1);
  }

  const rawParams = process.argv[3] ?? '{}';
  let params: Record<string, unknown>;
  try {
    params = JSON.parse(rawParams) as Record<string, unknown>;
  } catch {
    console.error(`Invalid JSON params: ${rawParams}`);
    process.exit(1);
  }

  const client = new MCPClient();
  try {
    const result = await client.request(toolName, params);
    console.log(JSON.stringify(result, null, 2));
  } catch (error: unknown) {
    const msg = (error as Error).message ?? String(error);
    console.error(`MCP query failed: ${msg}`);
    process.exit(1);
  }
}

main();
