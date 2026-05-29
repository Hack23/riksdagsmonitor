/**
 * Methods — calendar (`get_calendar_events`).
 *
 * Migrated from `tests/mcp-client-core-part1.test.ts` lines 841-880
 * (Hack23/riksdagsmonitor#2578 follow-up).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPClient } from '../../../scripts/mcp-client.js';

interface JsonRpcBody {
  jsonrpc: string;
  id: number;
  method: string;
  params: { name: string; arguments: Record<string, unknown> };
}

describe('methods/calendar — fetchCalendarEvents', () => {
  let client: MCPClient;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    client = new MCPClient();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it('should fetch calendar events with date range', async () => {
    const mockEvents = [
      { title: 'Event 1', start: '2026-02-10T10:00:00' },
      { title: 'Event 2', start: '2026-02-11T14:00:00' },
    ];

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { events: mockEvents } }),
      }),
    ) as unknown as typeof global.fetch;

    const events = await client.fetchCalendarEvents('2026-02-10', '2026-02-17');
    expect(events).toHaveLength(2);
    expect((events[0] as Record<string, unknown>).title).toBe('Event 1');
  });

  it('should pass optional org and akt parameters', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { events: [] } }),
      }),
    ) as unknown as typeof global.fetch;

    await client.fetchCalendarEvents('2026-02-10', '2026-02-17', 'kammaren', 'debatt');
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    const callArgs = mockFetch.mock.calls[0] as [string, RequestInit];
    const body: JsonRpcBody = JSON.parse(callArgs[1].body as string);
    expect(body.params.arguments).toEqual({
      from: '2026-02-10',
      tom: '2026-02-17',
      org: 'kammaren',
      akt: 'debatt',
    });
  });

  it('should return empty array when response has no events key', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: {} }),
      }),
    ) as unknown as typeof global.fetch;

    const events = await client.fetchCalendarEvents('2026-02-10', '2026-02-17');
    expect(events).toEqual([]);
  });

  it('should throw when the server returns the degraded-kalender sentinel', async () => {
    // Upstream data.riksdagen.se/kalender/ served HTML: the MCP server wraps
    // this in a "successful" result with an empty events array plus an error
    // field. Returning [] would mask the outage, so the method must throw.
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            jsonrpc: '2.0',
            id: 1,
            result: {
              content: [
                {
                  text: JSON.stringify({
                    count: 0,
                    events: [],
                    rawHtml: '<script>…</script>',
                    error: 'Riksdagens kalender-API returnerade HTML istället för JSON.',
                  }),
                },
              ],
            },
          }),
      }),
    ) as unknown as typeof global.fetch;

    await expect(
      client.fetchCalendarEvents('2026-02-10', '2026-02-17'),
    ).rejects.toThrow(/degraded/i);
  });
});
