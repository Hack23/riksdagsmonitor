/**
 * @module scripts/fetch-calendar/mcp/client
 * @description JSON-RPC 2.0 client for the riksdag-regering MCP
 * `get_calendar_events` tool.
 *
 * Throws a typed `CalendarMcpError` on transport, HTTP and protocol errors
 * so the orchestrator can distinguish HTML error pages (no retry — fall
 * straight back to the web scraper) from network blips (retry).
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { CalendarFetchConfig } from '../types.js';
import { CalendarMcpError, isDegradedKalenderSentinel, isHtmlErrorResponse } from './errors.js';

export const DEFAULT_MCP_URL =
  process.env['MCP_SERVER_URL'] ?? 'https://riksdag-regering-ai.onrender.com/mcp';
export const DEFAULT_TIMEOUT = 15_000;
export const DEFAULT_MAX_RETRIES = 2;
/** Retry base delay (ms); doubled on each subsequent attempt. */
export const RETRY_BASE_DELAY_MS = 1_000;

/** Minimum JSON-RPC 2.0 envelope for a `tools/call` request. */
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: 'tools/call';
  params: { name: string; arguments: Record<string, unknown> };
}

/** Partial shape of a JSON-RPC 2.0 response (only the fields we use). */
interface JsonRpcResponse {
  result?: {
    content?: Array<{ text?: string }>;
    kalender?: unknown[];
    events?: unknown[];
    [key: string]: unknown;
  };
  error?: { message?: string; [key: string]: unknown };
  [key: string]: unknown;
}

let _rpcId = 1;

/**
 * Call the riksdag-regering MCP `get_calendar_events` tool via a single
 * JSON-RPC 2.0 POST.  Throws a typed `CalendarMcpError` on any transport,
 * HTTP, or protocol error so callers can distinguish HTML responses from
 * genuine tool failures.
 */
export async function callMcpCalendarEvents(
  from: string,
  tom: string,
  config: Required<Pick<CalendarFetchConfig, 'mcpUrl' | 'timeout' | 'fetchFn'>>,
): Promise<unknown[]> {
  const body: JsonRpcRequest = {
    jsonrpc: '2.0',
    id: _rpcId++,
    method: 'tools/call',
    params: { name: 'get_calendar_events', arguments: { from, tom } },
  };

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), config.timeout);

  let responseText: string;
  try {
    const response = await config.fetchFn(config.mcpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    responseText = await response.text();

    if (!response.ok) {
      throw new CalendarMcpError(
        `MCP HTTP error: ${response.status} ${response.statusText}`,
        isHtmlErrorResponse(responseText) ? 'html' : 'http',
        responseText,
      );
    }
  } catch (err) {
    if (err instanceof CalendarMcpError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new CalendarMcpError(`MCP fetch failed: ${msg}`, 'network');
  } finally {
    clearTimeout(tid);
  }

  if (isHtmlErrorResponse(responseText)) {
    throw new CalendarMcpError('MCP returned HTML instead of JSON', 'html', responseText);
  }

  let rpc: JsonRpcResponse;
  try {
    rpc = JSON.parse(responseText) as JsonRpcResponse;
  } catch {
    throw new CalendarMcpError(
      `MCP response is not valid JSON: ${responseText.slice(0, 120)}`,
      'json',
    );
  }

  if (rpc.error) {
    const msg = rpc.error.message ?? JSON.stringify(rpc.error);
    throw new CalendarMcpError(`MCP tool error: ${msg}`, 'tool');
  }

  const result = rpc.result ?? {};

  const content = result['content'] as Array<{ text?: string }> | undefined;
  if (Array.isArray(content) && content[0]?.text) {
    let inner: Record<string, unknown>;
    try {
      inner = JSON.parse(content[0].text) as Record<string, unknown>;
    } catch {
      throw new CalendarMcpError(
        `MCP content text is not valid JSON: ${content[0].text.slice(0, 120)}`,
        'json',
      );
    }
    // The server wraps an upstream HTML error in a "successful" envelope with
    // an empty events array — detect it so the orchestrator falls back to the
    // web scraper instead of trusting a fake zero-event window.
    if (isDegradedKalenderSentinel(inner)) {
      throw new CalendarMcpError(
        `MCP kalender API degraded: ${String(inner['error'] ?? 'upstream HTML error')}`,
        'html',
        typeof inner['rawHtml'] === 'string' ? inner['rawHtml'] : undefined,
      );
    }
    const events = inner['kalender'] ?? inner['events'];
    if (Array.isArray(events)) return events as unknown[];
    return [];
  }

  if (isDegradedKalenderSentinel(result)) {
    throw new CalendarMcpError(
      `MCP kalender API degraded: ${String(result['error'] ?? 'upstream HTML error')}`,
      'html',
      typeof result['rawHtml'] === 'string' ? result['rawHtml'] : undefined,
    );
  }

  const direct = result['kalender'] ?? result['events'];
  if (Array.isArray(direct)) return direct as unknown[];

  return [];
}
