/**
 * Transport — JSON-RPC dispatcher tests.
 *
 * Covers the wire-level orchestration in
 * `scripts/mcp-client/transport/jsonrpc.ts`:
 *   - request envelope construction (`tools/call`)
 *   - header composition + runtime override of config Authorization
 *   - JSON-RPC error response → thrown Error mapping
 *   - HTTP non-OK responses → thrown server-error
 *   - tool-name prefix behaviour for direct vs. gateway URLs
 *   - basic statistics counter increments
 *
 * Pure transient-network retry tests live in `./retry.test.ts`.
 *
 * Migrated from `tests/mcp-client-core-part1.test.ts` lines 571-829
 * (Hack23/riksdagsmonitor#2578 follow-up).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPClient } from '../../../scripts/mcp-client.js';
import type { MCPStats } from '../../../scripts/types/mcp.js';

interface JsonRpcBody {
  jsonrpc: string;
  id: number;
  method: string;
  params: { name: string; arguments: Record<string, unknown> };
}

describe('MCPClient.request — JSON-RPC dispatcher', () => {
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

  it('should make successful HTTP request with JSON-RPC 2.0', async () => {
    const mockJsonRpcResponse = {
      jsonrpc: '2.0',
      id: 1,
      result: { data: [], success: true },
    };
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockJsonRpcResponse) }),
    ) as unknown as typeof global.fetch;

    const result = await client.request('test_tool', { param: 'value' });
    expect(result).toEqual({ data: [], success: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should send correct JSON-RPC 2.0 request format', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: {} }) }),
    ) as unknown as typeof global.fetch;

    await client.request('test_tool', { key: 'val' });

    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    const callArgs = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(callArgs[0]).toBe('https://riksdag-regering-ai.onrender.com/mcp');
    expect(callArgs[1].method).toBe('POST');
    expect((callArgs[1].headers as Record<string, string>)['Content-Type']).toBe('application/json');

    const body: JsonRpcBody = JSON.parse(callArgs[1].body as string);
    expect(body.jsonrpc).toBe('2.0');
    expect(body.id).toBeDefined();
    expect(body.method).toBe('tools/call');
    expect(body.params).toEqual({ name: 'test_tool', arguments: { key: 'val' } });
  });

  it('should include custom headers from config in requests', async () => {
    const c = new MCPClient({
      baseURL: 'https://test.example.com',
      headers: { 'X-Custom-Header': 'custom-value', 'X-API-Key': 'secret123' },
    });
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: {} }) }),
    ) as unknown as typeof global.fetch;

    await c.request('test_tool', {});

    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    const callArgs = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = callArgs[1].headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-Custom-Header']).toBe('custom-value');
    expect(headers['X-API-Key']).toBe('secret123');
  });

  it('should not override runtime headers with custom headers', async () => {
    const c = new MCPClient({
      baseURL: 'https://test.example.com',
      authToken: 'runtime-token',
      headers: { Authorization: 'config-token', 'X-Custom': 'value' },
    });
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: {} }) }),
    ) as unknown as typeof global.fetch;

    await c.request('test_tool', {});

    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    const callArgs = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = callArgs[1].headers as Record<string, string>;
    expect(headers['Authorization']).toBe('runtime-token');
    expect(headers['X-Custom']).toBe('value');
  });

  it('should handle JSON-RPC error responses', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, error: { code: -32601, message: 'Method not found' } }),
      }),
    ) as unknown as typeof global.fetch;
    await expect(client.request('unknown_tool', {})).rejects.toThrow('MCP tool error: Method not found');
  });

  it('should throw on non-ok HTTP response', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error details'),
      }),
    ) as unknown as typeof global.fetch;
    await expect(client.request('test_tool', {})).rejects.toThrow('MCP server error: 500 Internal Server Error');
  });

  it('should throw on 404 response', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, status: 404, statusText: 'Not Found', text: () => Promise.resolve('') }),
    ) as unknown as typeof global.fetch;
    await expect(client.request('bad_tool', {})).rejects.toThrow('404 Not Found');
  });

  it('should not retry on non-network errors', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, status: 400, statusText: 'Bad Request', text: () => Promise.resolve('') }),
    ) as unknown as typeof global.fetch;
    await expect(client.request('test_tool', {})).rejects.toThrow('MCP server error');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should track statistics', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { success: true } }) }),
    ) as unknown as typeof global.fetch;

    const statsBefore: MCPStats = client.getStats();
    expect(statsBefore.requests).toBe(0);

    await client.request('test_tool', {});

    const statsAfter: MCPStats = client.getStats();
    expect(statsAfter.requests).toBe(1);
    expect(statsAfter.errors).toBe(0);
  });

  it('should use default empty params when none provided', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { ok: true } }) }),
    ) as unknown as typeof global.fetch;

    await client.request('test_tool');
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    const callArgs = mockFetch.mock.calls[0] as [string, RequestInit];
    const body: JsonRpcBody = JSON.parse(callArgs[1].body as string);
    expect(body.params.arguments).toEqual({});
  });

  it('should not add prefix when using direct server URL', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { success: true } }) }),
    ) as unknown as typeof global.fetch;

    await client.request('test_tool', {});
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    const body: JsonRpcBody = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.params.name).toBe('test_tool');
  });

  it('should use bare tool names when using MCP gateway URL', async () => {
    const gw = new MCPClient({ baseURL: 'http://host.docker.internal:80/mcp/riksdag-regering' });
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { success: true } }) }),
    ) as unknown as typeof global.fetch;

    await gw.request('test_tool', {});
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    const body: JsonRpcBody = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.params.name).toBe('test_tool');
  });

  it('should throw on Internal error from gateway without retry', async () => {
    const gw = new MCPClient({ baseURL: 'http://host.docker.internal:80/mcp/riksdag-regering' });
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, error: { code: -32603, message: 'Internal error' } }),
      }),
    ) as unknown as typeof global.fetch;
    await expect(gw.request('test_tool', {})).rejects.toThrow('MCP tool error: Internal error');
  });
});
