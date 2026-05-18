/**
 * @module mcp-client/methods/speeches
 * @description Speech / anförande domain methods for the MCP client.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { MCPTransportClient } from '../transport/jsonrpc.js';
import type { SearchSpeechesParams } from '../../types/mcp.js';

export async function searchSpeeches(
  transport: MCPTransportClient,
  searchParams: SearchSpeechesParams,
): Promise<unknown[]> {
  const response = await transport.request(
    'search_anforanden',
    searchParams as unknown as Record<string, unknown>,
  );
  return (response['anforanden'] ?? response['speeches'] ?? []) as unknown[];
}
