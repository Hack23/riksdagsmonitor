/**
 * MCP transport client — callMcpCalendarEvents.
 *
 * Migrated verbatim from tests/fetch-calendar.test.ts (describe
 * 'callMcpCalendarEvents'). Helpers (jsonFetch/htmlFetch/errorFetch/
 * mcpJsonRpcResponse/mockMcpEvent) are duplicated per spec.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import { describe, it, expect, vi } from 'vitest';
import {
  callMcpCalendarEvents,
  CalendarMcpError,
} from '../../../scripts/fetch-calendar.js';

// ---------------------------------------------------------------------------
// Helpers (per-file duplicates of the cross-module helper block)
// ---------------------------------------------------------------------------

function jsonFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(async () => new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })) as unknown as typeof fetch;
}

function htmlFetch(html: string, status = 200): typeof fetch {
  return vi.fn(async () => new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html' },
  })) as unknown as typeof fetch;
}

function errorFetch(message = 'network error'): typeof fetch {
  return vi.fn(async () => { throw new Error(message); }) as unknown as typeof fetch;
}

function mcpJsonRpcResponse(events: unknown[]): object {
  return {
    jsonrpc: '2.0',
    id: 1,
    result: { content: [{ text: JSON.stringify({ kalender: events }) }] },
  };
}

function mockMcpEvent(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    dtstart: '2026-04-28T10:00:00',
    organ: 'FiU',
    akt: 'votering',
    summary: 'Slutlig rösträkning — Budget 2026',
    dok_id: 'H901FiU10',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------

describe('callMcpCalendarEvents', () => {
  it('returns events from a valid MCP JSON-RPC `kalender` response', async () => {
    const events = [mockMcpEvent(), mockMcpEvent({ dtstart: '2026-04-29T09:00:00' })];
    const config = {
      mcpUrl: 'https://mcp.test/mcp',
      timeout: 3_000,
      fetchFn: jsonFetch(mcpJsonRpcResponse(events)),
    };

    const result = await callMcpCalendarEvents('2026-04-28', '2026-05-04', config);
    expect(result).toHaveLength(2);
  });

  it('returns events from a direct `result.kalender` response (no content wrapper)', async () => {
    const events = [mockMcpEvent()];
    const config = {
      mcpUrl: 'https://mcp.test/mcp',
      timeout: 3_000,
      fetchFn: jsonFetch({ jsonrpc: '2.0', id: 1, result: { kalender: events } }),
    };

    const result = await callMcpCalendarEvents('2026-04-28', '2026-05-04', config);
    expect(result).toHaveLength(1);
  });

  it('returns events from a `result.events` key', async () => {
    const events = [mockMcpEvent()];
    const config = {
      mcpUrl: 'https://mcp.test/mcp',
      timeout: 3_000,
      fetchFn: jsonFetch({ jsonrpc: '2.0', id: 1, result: { events } }),
    };

    const result = await callMcpCalendarEvents('2026-04-28', '2026-05-04', config);
    expect(result).toHaveLength(1);
  });

  it('throws CalendarMcpError(html) when MCP returns an HTML document', async () => {
    const config = {
      mcpUrl: 'https://mcp.test/mcp',
      timeout: 3_000,
      fetchFn: htmlFetch('<!DOCTYPE html><html><body>Error 503</body></html>'),
    };

    await expect(
      callMcpCalendarEvents('2026-04-28', '2026-05-04', config),
    ).rejects.toThrow(CalendarMcpError);

    await expect(
      callMcpCalendarEvents('2026-04-28', '2026-05-04', config),
    ).rejects.toMatchObject({ kind: 'html' });
  });

  it('throws CalendarMcpError(http) on a non-OK HTTP status with non-HTML body', async () => {
    const config = {
      mcpUrl: 'https://mcp.test/mcp',
      timeout: 3_000,
      fetchFn: jsonFetch({ error: 'internal' }, 500),
    };

    await expect(
      callMcpCalendarEvents('2026-04-28', '2026-05-04', config),
    ).rejects.toMatchObject({ kind: 'http' });
  });

  it('throws CalendarMcpError(network) on a fetch network error', async () => {
    const config = {
      mcpUrl: 'https://mcp.test/mcp',
      timeout: 3_000,
      fetchFn: errorFetch('ECONNREFUSED'),
    };

    await expect(
      callMcpCalendarEvents('2026-04-28', '2026-05-04', config),
    ).rejects.toMatchObject({ kind: 'network' });
  });

  it('throws CalendarMcpError(tool) when the JSON-RPC response has an `error` field', async () => {
    const config = {
      mcpUrl: 'https://mcp.test/mcp',
      timeout: 3_000,
      fetchFn: jsonFetch({
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32000, message: 'Tool execution failed' },
      }),
    };

    await expect(
      callMcpCalendarEvents('2026-04-28', '2026-05-04', config),
    ).rejects.toMatchObject({ kind: 'tool' });
  });

  it('returns an empty array when `result.kalender` is an empty array', async () => {
    const config = {
      mcpUrl: 'https://mcp.test/mcp',
      timeout: 3_000,
      fetchFn: jsonFetch(mcpJsonRpcResponse([])),
    };

    const result = await callMcpCalendarEvents('2026-04-28', '2026-05-04', config);
    expect(result).toEqual([]);
  });

  it('returns an empty array when `result` has no recognised events key', async () => {
    const config = {
      mcpUrl: 'https://mcp.test/mcp',
      timeout: 3_000,
      fetchFn: jsonFetch({ jsonrpc: '2.0', id: 1, result: { something: 'else' } }),
    };

    const result = await callMcpCalendarEvents('2026-04-28', '2026-05-04', config);
    expect(result).toEqual([]);
  });

  it('throws CalendarMcpError(html) on the degraded-kalender sentinel in content text', async () => {
    // The server wraps an upstream HTML error in a "successful" envelope whose
    // empty events array must NOT be read as a legitimate zero-event window.
    const sentinel = {
      count: 0,
      events: [],
      rawHtml: '<script>window.location…</script>',
      error: 'Riksdagens kalender-API returnerade HTML istället för JSON.',
    };
    const config = {
      mcpUrl: 'https://mcp.test/mcp',
      timeout: 3_000,
      fetchFn: jsonFetch({
        jsonrpc: '2.0',
        id: 1,
        result: { content: [{ text: JSON.stringify(sentinel) }] },
      }),
    };

    await expect(
      callMcpCalendarEvents('2026-04-28', '2026-05-04', config),
    ).rejects.toMatchObject({ kind: 'html' });
  });

  it('throws CalendarMcpError(html) on a degraded sentinel in a direct result (no content wrapper)', async () => {
    const config = {
      mcpUrl: 'https://mcp.test/mcp',
      timeout: 3_000,
      fetchFn: jsonFetch({
        jsonrpc: '2.0',
        id: 1,
        result: {
          count: 0,
          events: [],
          error: 'Riksdagens kalender-API returnerade HTML istället för JSON.',
        },
      }),
    };

    await expect(
      callMcpCalendarEvents('2026-04-28', '2026-05-04', config),
    ).rejects.toMatchObject({ kind: 'html' });
  });
});
