/**
 * @module mcp-client/methods/calendar
 * @description Calendar / kalender domain methods for the MCP client.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { MCPTransportClient } from '../transport/jsonrpc.js';
import { isDegradedKalenderSentinel } from '../../fetch-calendar/mcp/errors.js';

/**
 * Fetch parliamentary calendar events between two dates, optionally
 * filtered by organ (committee) and aktivitet (event type).
 *
 * Throws when the riksdag-regering server returns its degraded-kalender
 * sentinel (an empty `events` array alongside an `error`/`rawHtml` field,
 * emitted when `data.riksdagen.se/kalender/` serves an HTML error page).
 * Surfacing the failure lets callers fall back to the public-page scraper
 * via {@link module:scripts/fetch-calendar} instead of trusting a fake
 * zero-event window.
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

  if (isDegradedKalenderSentinel(response)) {
    const errorText = response['error'];
    throw new Error(
      `get_calendar_events degraded: ${typeof errorText === 'string' ? errorText : 'upstream HTML error from data.riksdagen.se/kalender/'}`,
    );
  }

  return (response['kalender'] ?? response['events'] ?? []) as unknown[];
}
