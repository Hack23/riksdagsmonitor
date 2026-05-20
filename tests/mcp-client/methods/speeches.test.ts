/**
 * Methods — speeches (search_anforanden).
 *
 * Tool-name + response-shape coverage. Exhaustive `searchSpeeches`
 * coverage lives in `tests/mcp-client-core-part2.test.ts`.
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

describe('methods/speeches — searchSpeeches', () => {
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

  it('routes to search_anforanden tool', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { speeches: [] } }),
      }),
    ) as unknown as typeof global.fetch;

    await client.searchSpeeches({ rm: '2025/26' });
    const fetchSpy = global.fetch as unknown as ReturnType<typeof vi.fn>;
    const body: JsonRpcBody = JSON.parse(
      (fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string,
    );
    expect(body.params.name).toBe('search_anforanden');
  });

  it('returns empty array when result has no speeches key', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: {} }),
      }),
    ) as unknown as typeof global.fetch;

    const speeches = await client.searchSpeeches({ rm: '2025/26' });
    expect(speeches).toEqual([]);
  });
});
