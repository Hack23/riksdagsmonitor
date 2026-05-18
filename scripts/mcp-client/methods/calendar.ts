/**
 * @module mcp-client/methods/calendar
 * @description Calendar / kalender domain methods for the MCP client.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { MCPTransportClient } from '../transport/jsonrpc.js';

/**
 * Fetch parliamentary calendar events between two dates, optionally
 * filtered by organ (committee) and aktivitet (event type).
 */
export async function fetchCalendarEvents(
  transport: MCPTransportClient,
  from: string,
  tom: string,
  org: string | null = null,
  akt: string | null = null,
): Promise<unknown[]> {
  const params: Record<string, unknown> = { from, tom };
  if (org) params['org'] = org;
  if (akt) params['akt'] = akt;

  const response = await transport.request('get_calendar_events', params);
  return (response['kalender'] ?? response['events'] ?? []) as unknown[];
}
