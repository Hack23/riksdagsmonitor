/**
 * @module mcp-client/methods/members
 * @description Member / ledamot domain methods for the MCP client.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { MCPTransportClient } from '../transport/jsonrpc.js';
import type { FetchMPsFilters } from '../../types/mcp.js';

export async function fetchMPs(
  transport: MCPTransportClient,
  filters: FetchMPsFilters = {},
): Promise<unknown[]> {
  const response = await transport.request(
    'search_ledamoter',
    filters as unknown as Record<string, unknown>,
  );
  return (response['mps'] ?? []) as unknown[];
}
