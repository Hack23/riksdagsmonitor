/**
 * Methods — votes (search_voteringar / get_voting_group).
 *
 * Tool-name + response-shape coverage. Exhaustive `fetchVotingRecords`
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

describe('methods/votes', () => {
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

  it('fetchVotingRecords routes to search_voteringar', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { votes: [{ id: 'v1' }] } }),
      }),
    ) as unknown as typeof global.fetch;

    await client.fetchVotingRecords({ rm: '2025/26' });
    const fetchSpy = global.fetch as unknown as ReturnType<typeof vi.fn>;
    const body: JsonRpcBody = JSON.parse(
      (fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string,
    );
    expect(body.params.name).toBe('search_voteringar');
  });

  it('fetchVotingGroup routes to get_voting_group', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { groups: [] } }),
      }),
    ) as unknown as typeof global.fetch;

    await client.fetchVotingGroup({ bet: 'FiU1', rm: '2025/26' });
    const fetchSpy = global.fetch as unknown as ReturnType<typeof vi.fn>;
    const body: JsonRpcBody = JSON.parse(
      (fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string,
    );
    expect(body.params.name).toBe('get_voting_group');
  });

  it('fetchVotingRecords returns empty array when result is empty', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { votes: [] } }),
      }),
    ) as unknown as typeof global.fetch;

    // Comparison riksmöte call also returns empty
    const votes = await client.fetchVotingRecords({ rm: '2025/26' });
    expect(votes).toEqual([]);
  });
});
