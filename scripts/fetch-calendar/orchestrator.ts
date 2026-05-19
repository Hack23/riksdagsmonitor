/**
 * @module scripts/fetch-calendar/orchestrator
 * @description Primary→fallback orchestrator for the Riksdag calendar fetch.
 *
 * 1. **MCP primary**: call `get_calendar_events` on riksdag-regering.
 *    Retries up to `maxRetries` times on transient failures (network/json/tool).
 *    Breaks early on `html` kind — when the endpoint serves an HTML error
 *    page there is no point retrying.
 * 2. **Web fallback**: scrape `riksdagen.se/sv/kalendarium/` instead.
 *
 * Decision lives in **one** function ≤ 80 lines, per the refactor brief.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import {
  callMcpCalendarEvents,
  DEFAULT_MAX_RETRIES,
  DEFAULT_MCP_URL,
  DEFAULT_TIMEOUT,
  RETRY_BASE_DELAY_MS,
} from './mcp/client.js';
import { CalendarMcpError } from './mcp/errors.js';
import { normalizeMcpCalendarEvent } from './mcp/normaliser.js';
import { DEFAULT_WEB_BASE_URL, fetchWebCalendar } from './scraper/parse.js';
import type { CalendarFetchConfig, CalendarFetchResult } from './types.js';

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch Riksdag calendar events for the given date range using a
 * primary→fallback resilience chain.
 *
 * @param from  ISO 8601 date string (inclusive start, e.g. "2026-04-28").
 * @param to    ISO 8601 date string (inclusive end,   e.g. "2026-05-04").
 * @param config Optional overrides for URLs, timeout, retries, and fetch mock.
 */
export async function fetchCalendarWithFallback(
  from: string,
  to: string,
  config: CalendarFetchConfig = {},
): Promise<CalendarFetchResult> {
  const mcpUrl = config.mcpUrl ?? DEFAULT_MCP_URL;
  const webBaseUrl = config.webBaseUrl ?? DEFAULT_WEB_BASE_URL;
  const timeout = config.timeout ?? DEFAULT_TIMEOUT;
  const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
  const fetchFn = config.fetchFn ?? globalThis.fetch;
  const sleepFn = config.sleepFn ?? defaultSleep;
  const fetchedAt = new Date().toISOString();

  const resolved = { mcpUrl, webBaseUrl, timeout, fetchFn, sleepFn };

  let primaryError: string | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1), 30_000);
      console.warn(`  ⚠️  MCP calendar retry ${attempt}/${maxRetries} after ${delay} ms…`);
      await sleepFn(delay);
    }

    try {
      console.error(
        `  🔄 [fetch-calendar] MCP primary attempt ${attempt + 1}/${maxRetries + 1}…`,
      );
      const raw = await callMcpCalendarEvents(from, to, resolved);
      const events = raw.map(normalizeMcpCalendarEvent);
      console.error(`  ✅ [fetch-calendar] MCP primary succeeded — ${events.length} events`);

      return {
        events,
        manifest: {
          date: from,
          dateTo: to,
          path: 'mcp-primary',
          eventCount: events.length,
          fetchedAt,
        },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      primaryError = msg;
      const kind = err instanceof CalendarMcpError ? err.kind : 'unknown';
      console.warn(
        `  ⚠️  [fetch-calendar] MCP attempt ${attempt + 1} failed (${kind}): ${msg.slice(0, 120)}`,
      );
      if (err instanceof CalendarMcpError && err.kind === 'html') break;
    }
  }

  console.error(`  🔄 [fetch-calendar] Falling back to riksdagen.se/sv/kalendarium/…`);
  let fallbackError: string | undefined;
  try {
    const events = await fetchWebCalendar(from, to, resolved);
    console.error(`  ✅ [fetch-calendar] Web fallback succeeded — ${events.length} events`);

    return {
      events,
      manifest: {
        date: from,
        dateTo: to,
        path: 'web-fallback',
        eventCount: events.length,
        primaryError,
        fetchedAt,
      },
    };
  } catch (err) {
    fallbackError = err instanceof Error ? err.message : String(err);
    console.error(`  ❌ [fetch-calendar] Web fallback also failed: ${fallbackError}`);
  }

  return {
    events: [],
    manifest: {
      date: from,
      dateTo: to,
      path: 'none',
      eventCount: 0,
      primaryError,
      fallbackError,
      fetchedAt,
    },
  };
}
