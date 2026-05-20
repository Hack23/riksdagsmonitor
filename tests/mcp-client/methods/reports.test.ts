/**
 * Methods — reports / propositions / committee reports.
 *
 * Covers `scripts/mcp-client/methods/reports.ts`:
 *   - fetchCommitteeReports → get_betankanden
 *   - fetchPropositions → get_propositioner
 *
 * (Sibling tests for fetchMotions / searchDocuments live in
 *  `tests/mcp-client-core-part2.test.ts` to keep this issue's scope
 *  bounded — see Hack23/riksdagsmonitor#2578 "Disjoint scope" note.)
 *
 * Migrated from `tests/mcp-client-core-part1.test.ts` lines 882-967
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

describe('methods/reports — fetchCommitteeReports', () => {
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

  it('should fetch committee reports with limit', async () => {
    const mockReports = [
      { title: 'Report 1', organ: 'UbU' },
      { title: 'Report 2', organ: 'SoU' },
    ];
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { reports: mockReports } }),
      }),
    ) as unknown as typeof global.fetch;

    const reports = await client.fetchCommitteeReports(10);
    expect(reports).toHaveLength(2);
  });

  it('should pass optional rm and organ parameters', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { reports: [] } }),
      }),
    ) as unknown as typeof global.fetch;

    await client.fetchCommitteeReports(5, '2025/26', 'UbU');
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    const body: JsonRpcBody = JSON.parse(
      (mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string,
    );
    expect(body.params.arguments).toEqual({ limit: 5, rm: '2025/26', organ: 'UbU' });
  });

  it('should return empty array when response has no reports key', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: {} }),
      }),
    ) as unknown as typeof global.fetch;
    const reports = await client.fetchCommitteeReports();
    expect(reports).toEqual([]);
  });
});

describe('methods/reports — fetchPropositions', () => {
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

  it('should fetch propositions with default limit', async () => {
    const mockProps = [{ title: 'Prop 1' }];
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { propositions: mockProps } }),
      }),
    ) as unknown as typeof global.fetch;

    const props = await client.fetchPropositions();
    expect(props).toHaveLength(1);
    expect((props[0] as Record<string, unknown>).title).toBe('Prop 1');
  });

  it('should pass optional rm parameter', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { propositions: [] } }),
      }),
    ) as unknown as typeof global.fetch;

    await client.fetchPropositions(5, '2025/26');
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    const body: JsonRpcBody = JSON.parse(
      (mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string,
    );
    expect(body.params.arguments).toEqual({ limit: 5, rm: '2025/26' });
  });

  it('should call correct tool name (get_propositioner)', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { propositions: [] } }),
      }),
    ) as unknown as typeof global.fetch;

    await client.fetchPropositions();
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    const body: JsonRpcBody = JSON.parse(
      (mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string,
    );
    expect(body.params.name).toBe('get_propositioner');
  });

  it('should return empty array when response has no propositions key', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: {} }),
      }),
    ) as unknown as typeof global.fetch;
    const props = await client.fetchPropositions();
    expect(props).toEqual([]);
  });
});
