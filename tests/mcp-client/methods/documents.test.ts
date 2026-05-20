/**
 * Methods — documents (get_dokument, search_dokument, fetch_paginated_documents).
 *
 * Tool-name + thin response-shape coverage for
 * `scripts/mcp-client/methods/documents.ts`.
 *
 * Exhaustive coverage of `searchDocuments`, `fetchDocumentDetailsWithCoverage`,
 * and `fetchGovernmentDocuments` lives in
 * `tests/mcp-client-core-part2.test.ts`. This file fulfils the per-domain
 * layout from Hack23/riksdagsmonitor#2578 acceptance criteria.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPClient } from '../../../scripts/mcp-client.js';

interface JsonRpcBody {
  jsonrpc: string;
  id: number;
  method: string;
  params: { name: string; arguments: Record<string, unknown> };
}

function mockOk<T>(result: T): typeof global.fetch {
  return vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result }),
    }),
  ) as unknown as typeof global.fetch;
}

describe('methods/documents — tool-name surface', () => {
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

  it('searchDocuments routes to search_dokument', async () => {
    global.fetch = mockOk({ documents: [] });
    await client.searchDocuments({ rm: '2025/26', sok: 'budget' });
    const fetchSpy = global.fetch as unknown as ReturnType<typeof vi.fn>;
    const body: JsonRpcBody = JSON.parse(
      (fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string,
    );
    expect(body.params.name).toBe('search_dokument');
  });

  it('fetchGovernmentDocuments routes to search_regering', async () => {
    global.fetch = mockOk({ documents: [] });
    await client.fetchGovernmentDocuments({ type: 'pressmeddelanden', limit: 5 });
    const fetchSpy = global.fetch as unknown as ReturnType<typeof vi.fn>;
    const body: JsonRpcBody = JSON.parse(
      (fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string,
    );
    expect(body.params.name).toBe('search_regering');
  });

  it('searchDocuments returns empty array when result has no documents key', async () => {
    global.fetch = mockOk({});
    const docs = await client.searchDocuments({ rm: '2025/26' });
    expect(docs).toEqual([]);
  });

  it('exposes fetchDocumentDetails / fetchDocumentDetailsWithCoverage on the public surface', () => {
    expect(typeof client.fetchDocumentDetails).toBe('function');
    expect(typeof client.fetchDocumentDetailsWithCoverage).toBe('function');
  });
});
