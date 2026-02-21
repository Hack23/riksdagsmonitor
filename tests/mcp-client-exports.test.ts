/**
 * Unit Tests for MCP Client
 * Tests HTTP client for riksdag-regering-mcp server
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  MCPClient,
  getDefaultClient,
  fetchCalendarEvents,
  fetchCommitteeReports,
  fetchPropositions,
  fetchMotions,
  searchDocuments,
  searchSpeeches,
  fetchMPs,
  fetchVotingRecords,
  fetchGovernmentDocuments
} from '../scripts/mcp-client.js';

interface MockResponse {
  ok: boolean;
  json?: () => Promise<Record<string, unknown>>;
  status?: number;
  statusText?: string;
  text?: () => Promise<string>;
}

describe('Module convenience exports', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();  // Clear mock data to prevent memory leaks
  });

  it('should export getDefaultClient function', () => {
    expect(typeof getDefaultClient).toBe('function');
  });

  it('should return MCPClient instance from getDefaultClient', () => {
    const client: MCPClient = getDefaultClient();
    expect(client).toBeInstanceOf(MCPClient);
  });

  it('should return same instance on repeated getDefaultClient calls', () => {
    const client1: MCPClient = getDefaultClient();
    const client2: MCPClient = getDefaultClient();
    expect(client1).toBe(client2);
  });

  it('should export all convenience functions', () => {
    expect(typeof fetchCalendarEvents).toBe('function');
    expect(typeof fetchCommitteeReports).toBe('function');
    expect(typeof fetchPropositions).toBe('function');
    expect(typeof fetchMotions).toBe('function');
    expect(typeof searchDocuments).toBe('function');
    expect(typeof searchSpeeches).toBe('function');
    expect(typeof fetchMPs).toBe('function');
    expect(typeof fetchVotingRecords).toBe('function');
    expect(typeof fetchGovernmentDocuments).toBe('function');
  });

  it('convenience fetchCalendarEvents should delegate to default client', async () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { events: [{ title: 'E1' }] } })
    })) as unknown as typeof global.fetch;

    const events = await fetchCalendarEvents('2026-01-01', '2026-01-07');
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('E1');
  });

  it('convenience fetchPropositions should delegate to default client', async () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { propositions: [{ title: 'P1' }] } })
    })) as unknown as typeof global.fetch;

    const props = await fetchPropositions(5);
    expect(props).toHaveLength(1);
  });

  it('convenience searchDocuments should delegate to default client', async () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { documents: [] } })
    })) as unknown as typeof global.fetch;

    const docs = await searchDocuments({ sok: 'budget' });
    expect(docs).toEqual([]);
  });

  it('convenience fetchMPs should delegate to default client', async () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { mps: [{ name: 'A' }] } })
    })) as unknown as typeof global.fetch;

    const mps = await fetchMPs({ parti: 'S' });
    expect(mps).toHaveLength(1);
  });

  it('convenience fetchMotions should delegate to default client', async () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { motions: [{ title: 'M1' }] } })
    })) as unknown as typeof global.fetch;

    const motions = await fetchMotions(5);
    expect(motions).toHaveLength(1);
  });

  it('convenience searchSpeeches should delegate to default client', async () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { speeches: [] } })
    })) as unknown as typeof global.fetch;

    const speeches = await searchSpeeches({ sok: 'test' });
    expect(speeches).toEqual([]);
  });

  it('convenience fetchVotingRecords should delegate to default client', async () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { votes: [{ id: 'v1' }] } })
    })) as unknown as typeof global.fetch;

    const votes = await fetchVotingRecords({ rm: '2025/26' });
    expect(votes).toHaveLength(1);
  });

  it('convenience fetchGovernmentDocuments should delegate to default client', async () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { documents: [{ title: 'D1' }] } })
    })) as unknown as typeof global.fetch;

    const docs = await fetchGovernmentDocuments({ type: 'SOU' });
    expect(docs).toHaveLength(1);
  });

  it('convenience fetchCommitteeReports should delegate to default client', async () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { reports: [{ title: 'R1' }] } })
    })) as unknown as typeof global.fetch;

    const reports = await fetchCommitteeReports(5);
    expect(reports).toHaveLength(1);
  });
});
