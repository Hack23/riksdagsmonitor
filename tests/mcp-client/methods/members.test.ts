/**
 * Methods — members (search_ledamoter / fetchMPs).
 *
 * Tool-name + response-shape coverage. Exhaustive `fetchMPs` filter
 * tests live in `tests/mcp-client-core-part2.test.ts`.
 * (Hack23/riksdagsmonitor#2578 follow-up.)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPClient } from '../../../scripts/mcp-client.js';

interface JsonRpcBody {
  jsonrpc: string;
  id: number;
  method: string;
  params: { name: string; arguments: Record<string, unknown> };
}

describe('methods/members — fetchMPs', () => {
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

  it('routes to search_ledamoter tool', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { mps: [] } }),
      }),
    ) as unknown as typeof global.fetch;

    const result = await client.fetchMPs({});
    expect(result).toEqual([]);
    const fetchSpy = global.fetch as unknown as ReturnType<typeof vi.fn>;
    const body: JsonRpcBody = JSON.parse(
      (fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string,
    );
    expect(body.params.name).toBe('search_ledamoter');
  });

  it('passes parti / valkrets / status filters when provided', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { mps: [] } }),
      }),
    ) as unknown as typeof global.fetch;

    await client.fetchMPs({ parti: 'M', status: 'tjanstgorande' });
    const fetchSpy = global.fetch as unknown as ReturnType<typeof vi.fn>;
    const body: JsonRpcBody = JSON.parse(
      (fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string,
    );
    expect(body.params.arguments).toMatchObject({ parti: 'M', status: 'tjanstgorande' });
  });
});
