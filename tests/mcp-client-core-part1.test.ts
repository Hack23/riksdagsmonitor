/**
 * Unit Tests for MCP Client
 * Tests HTTP client for riksdag-regering-mcp server
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  MCPClient,
} from '../scripts/mcp-client.js';
import type { MCPStats } from '../scripts/types/mcp.js';

interface JsonRpcBody {
  jsonrpc: string;
  id: number;
  method: string;
  params: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

describe('MCPClient', () => {
  let client: MCPClient;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    client = new MCPClient();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();  // Clear mock data to prevent memory leaks
  });

  describe('constructor', () => {
    it('should create client with default configuration', () => {
      expect(client).toBeDefined();
      expect(client.baseURL).toBe('https://riksdag-regering-ai.onrender.com/mcp');
      expect(client.timeout).toBe(30000);
      expect(client.maxRetries).toBe(3);
    });

    it('should accept custom configuration', () => {
      const customClient = new MCPClient({
        baseURL: 'https://custom.example.com',
        timeout: 10000,
        maxRetries: 5
      });
      expect(customClient.baseURL).toBe('https://custom.example.com');
      expect(customClient.timeout).toBe(10000);
      expect(customClient.maxRetries).toBe(5);
    });

    it('should accept string URL for backwards compatibility', () => {
      const customClient = new MCPClient('https://legacy.example.com');
      expect(customClient.baseURL).toBe('https://legacy.example.com');
      expect(customClient.timeout).toBe(30000);
      expect(customClient.maxRetries).toBe(3);
    });

    it('should accept serverUrl alias in config', () => {
      const customClient = new MCPClient({ serverUrl: 'https://alias.example.com' });
      expect(customClient.baseURL).toBe('https://alias.example.com');
    });

    it('should initialize request and error counts to zero', () => {
      expect(client.requestCount).toBe(0);
      expect(client.errorCount).toBe(0);
    });

    it('should accept custom headers in config', () => {
      const customClient = new MCPClient({
        baseURL: 'https://custom.example.com',
        headers: {
          'X-Custom-Header': 'custom-value',
          'X-API-Key': 'abc123'
        }
      });
      expect(customClient.customHeaders).toEqual({
        'X-Custom-Header': 'custom-value',
        'X-API-Key': 'abc123'
      });
    });

    it('should initialize empty customHeaders when no headers provided', () => {
      expect(client.customHeaders).toEqual({});
    });

    it('should initialize empty customHeaders for string URL config', () => {
      const stringClient = new MCPClient('https://test.com');
      expect(stringClient.customHeaders).toEqual({});
    });

    it('should use MCP_GATEWAY_API_KEY env var as auth token when MCP_AUTH_TOKEN is not set', async () => {
      const origAuth = process.env['MCP_AUTH_TOKEN'];
      const origGw = process.env['MCP_GATEWAY_API_KEY'];

      delete process.env['MCP_AUTH_TOKEN'];
      process.env['MCP_GATEWAY_API_KEY'] = 'test-gw-key-123';

      try {
        // Reset module cache so defaults are re-evaluated with new env vars
        await vi.resetModules();

        // Dynamically import to pick up updated environment for default auth token logic
        const { getDefaultClient } = await import('../scripts/mcp-client.js');
        const gwClient = getDefaultClient();

        expect(gwClient.authToken).toBe('test-gw-key-123');
      } finally {
        if (origAuth !== undefined) {
          process.env['MCP_AUTH_TOKEN'] = origAuth;
        } else {
          delete process.env['MCP_AUTH_TOKEN'];
        }

        if (origGw !== undefined) {
          process.env['MCP_GATEWAY_API_KEY'] = origGw;
        } else {
          delete process.env['MCP_GATEWAY_API_KEY'];
        }

        // Ensure subsequent tests see a clean module state
        await vi.resetModules();
      }
    });

    it('should read gateway API key from MCP config file when env vars are unset', async () => {
      const origAuth = process.env['MCP_AUTH_TOKEN'];
      const origGw = process.env['MCP_GATEWAY_API_KEY'];
      const origConfig = process.env['GH_AW_MCP_CONFIG'];

      delete process.env['MCP_AUTH_TOKEN'];
      delete process.env['MCP_GATEWAY_API_KEY'];

      // Write a temp MCP config file with a gateway API key
      const tmpDir = '/tmp/mcp-test-config-' + Date.now();
      const fs = await import('fs');
      fs.mkdirSync(tmpDir, { recursive: true });
      const configPath = `${tmpDir}/mcp-config.json`;
      fs.writeFileSync(configPath, JSON.stringify({
        gateway: { apiKey: 'file-based-key-456', port: 80, domain: 'host.docker.internal' }
      }));
      process.env['GH_AW_MCP_CONFIG'] = configPath;

      try {
        await vi.resetModules();
        const { getDefaultClient } = await import('../scripts/mcp-client.js');
        const fileClient = getDefaultClient();
        expect(fileClient.authToken).toBe('file-based-key-456');
      } finally {
        if (origAuth !== undefined) process.env['MCP_AUTH_TOKEN'] = origAuth;
        else delete process.env['MCP_AUTH_TOKEN'];
        if (origGw !== undefined) process.env['MCP_GATEWAY_API_KEY'] = origGw;
        else delete process.env['MCP_GATEWAY_API_KEY'];
        if (origConfig !== undefined) process.env['GH_AW_MCP_CONFIG'] = origConfig;
        else delete process.env['GH_AW_MCP_CONFIG'];
        fs.rmSync(tmpDir, { recursive: true, force: true });
        await vi.resetModules();
      }
    });

    it('should return empty auth token when config file has malformed JSON', async () => {
      const origAuth = process.env['MCP_AUTH_TOKEN'];
      const origGw = process.env['MCP_GATEWAY_API_KEY'];
      const origConfig = process.env['GH_AW_MCP_CONFIG'];

      delete process.env['MCP_AUTH_TOKEN'];
      delete process.env['MCP_GATEWAY_API_KEY'];

      const tmpDir = '/tmp/mcp-test-malformed-' + Date.now();
      const fs = await import('fs');
      fs.mkdirSync(tmpDir, { recursive: true });
      const configPath = `${tmpDir}/mcp-config.json`;
      fs.writeFileSync(configPath, '{ invalid json !!!');
      process.env['GH_AW_MCP_CONFIG'] = configPath;

      try {
        await vi.resetModules();
        const { getDefaultClient } = await import('../scripts/mcp-client.js');
        const client = getDefaultClient();
        expect(client.authToken).toBe('');
      } finally {
        if (origAuth !== undefined) process.env['MCP_AUTH_TOKEN'] = origAuth;
        else delete process.env['MCP_AUTH_TOKEN'];
        if (origGw !== undefined) process.env['MCP_GATEWAY_API_KEY'] = origGw;
        else delete process.env['MCP_GATEWAY_API_KEY'];
        if (origConfig !== undefined) process.env['GH_AW_MCP_CONFIG'] = origConfig;
        else delete process.env['GH_AW_MCP_CONFIG'];
        fs.rmSync(tmpDir, { recursive: true, force: true });
        await vi.resetModules();
      }
    });

    it('should return empty auth token when config file is missing gateway field and mcpServers has no riksdag-regering', async () => {
      const origAuth = process.env['MCP_AUTH_TOKEN'];
      const origGw = process.env['MCP_GATEWAY_API_KEY'];
      const origConfig = process.env['GH_AW_MCP_CONFIG'];

      delete process.env['MCP_AUTH_TOKEN'];
      delete process.env['MCP_GATEWAY_API_KEY'];

      const tmpDir = '/tmp/mcp-test-nogateway-' + Date.now();
      const fs = await import('fs');
      fs.mkdirSync(tmpDir, { recursive: true });
      const configPath = `${tmpDir}/mcp-config.json`;
      fs.writeFileSync(configPath, JSON.stringify({ mcpServers: {} }));
      process.env['GH_AW_MCP_CONFIG'] = configPath;

      try {
        await vi.resetModules();
        const { getDefaultClient } = await import('../scripts/mcp-client.js');
        const client = getDefaultClient();
        expect(client.authToken).toBe('');
      } finally {
        if (origAuth !== undefined) process.env['MCP_AUTH_TOKEN'] = origAuth;
        else delete process.env['MCP_AUTH_TOKEN'];
        if (origGw !== undefined) process.env['MCP_GATEWAY_API_KEY'] = origGw;
        else delete process.env['MCP_GATEWAY_API_KEY'];
        if (origConfig !== undefined) process.env['GH_AW_MCP_CONFIG'] = origConfig;
        else delete process.env['GH_AW_MCP_CONFIG'];
        fs.rmSync(tmpDir, { recursive: true, force: true });
        await vi.resetModules();
      }
    });

    it('should read auth from mcpServers riksdag-regering headers when gateway.apiKey is absent', async () => {
      const origAuth = process.env['MCP_AUTH_TOKEN'];
      const origGw = process.env['MCP_GATEWAY_API_KEY'];
      const origConfig = process.env['GH_AW_MCP_CONFIG'];

      delete process.env['MCP_AUTH_TOKEN'];
      delete process.env['MCP_GATEWAY_API_KEY'];

      const tmpDir = '/tmp/mcp-test-mcpservers-' + Date.now();
      const fs = await import('fs');
      fs.mkdirSync(tmpDir, { recursive: true });
      const configPath = `${tmpDir}/mcp-config.json`;
      fs.writeFileSync(configPath, JSON.stringify({
        mcpServers: {
          'riksdag-regering': {
            type: 'http',
            url: 'https://riksdag-regering-ai.onrender.com/mcp',
            headers: {
              Authorization: 'Bearer mcpserver-token-abc'
            }
          }
        }
      }));
      process.env['GH_AW_MCP_CONFIG'] = configPath;

      try {
        await vi.resetModules();
        const { getDefaultClient } = await import('../scripts/mcp-client.js');
        const client = getDefaultClient();
        expect(client.authToken).toBe('mcpserver-token-abc');
      } finally {
        if (origAuth !== undefined) process.env['MCP_AUTH_TOKEN'] = origAuth;
        else delete process.env['MCP_AUTH_TOKEN'];
        if (origGw !== undefined) process.env['MCP_GATEWAY_API_KEY'] = origGw;
        else delete process.env['MCP_GATEWAY_API_KEY'];
        if (origConfig !== undefined) process.env['GH_AW_MCP_CONFIG'] = origConfig;
        else delete process.env['GH_AW_MCP_CONFIG'];
        fs.rmSync(tmpDir, { recursive: true, force: true });
        await vi.resetModules();
      }
    });

    it('should prefer gateway.apiKey over mcpServers when both are present', async () => {
      const origAuth = process.env['MCP_AUTH_TOKEN'];
      const origGw = process.env['MCP_GATEWAY_API_KEY'];
      const origConfig = process.env['GH_AW_MCP_CONFIG'];

      delete process.env['MCP_AUTH_TOKEN'];
      delete process.env['MCP_GATEWAY_API_KEY'];

      const tmpDir = '/tmp/mcp-test-priority-' + Date.now();
      const fs = await import('fs');
      fs.mkdirSync(tmpDir, { recursive: true });
      const configPath = `${tmpDir}/mcp-config.json`;
      fs.writeFileSync(configPath, JSON.stringify({
        gateway: { apiKey: 'gateway-key-wins' },
        mcpServers: {
          'riksdag-regering': {
            headers: { Authorization: 'Bearer server-key-loses' }
          }
        }
      }));
      process.env['GH_AW_MCP_CONFIG'] = configPath;

      try {
        await vi.resetModules();
        const { getDefaultClient } = await import('../scripts/mcp-client.js');
        const client = getDefaultClient();
        // gateway.apiKey takes priority — returned as raw API key
        expect(client.authToken).toBe('gateway-key-wins');
      } finally {
        if (origAuth !== undefined) process.env['MCP_AUTH_TOKEN'] = origAuth;
        else delete process.env['MCP_AUTH_TOKEN'];
        if (origGw !== undefined) process.env['MCP_GATEWAY_API_KEY'] = origGw;
        else delete process.env['MCP_GATEWAY_API_KEY'];
        if (origConfig !== undefined) process.env['GH_AW_MCP_CONFIG'] = origConfig;
        else delete process.env['GH_AW_MCP_CONFIG'];
        fs.rmSync(tmpDir, { recursive: true, force: true });
        await vi.resetModules();
      }
    });

    it('should return empty auth token when config file does not exist', async () => {
      const origAuth = process.env['MCP_AUTH_TOKEN'];
      const origGw = process.env['MCP_GATEWAY_API_KEY'];
      const origConfig = process.env['GH_AW_MCP_CONFIG'];

      delete process.env['MCP_AUTH_TOKEN'];
      delete process.env['MCP_GATEWAY_API_KEY'];
      process.env['GH_AW_MCP_CONFIG'] = '/tmp/nonexistent-mcp-config-' + Date.now() + '.json';

      try {
        await vi.resetModules();
        const { getDefaultClient } = await import('../scripts/mcp-client.js');
        const client = getDefaultClient();
        expect(client.authToken).toBe('');
      } finally {
        if (origAuth !== undefined) process.env['MCP_AUTH_TOKEN'] = origAuth;
        else delete process.env['MCP_AUTH_TOKEN'];
        if (origGw !== undefined) process.env['MCP_GATEWAY_API_KEY'] = origGw;
        else delete process.env['MCP_GATEWAY_API_KEY'];
        if (origConfig !== undefined) process.env['GH_AW_MCP_CONFIG'] = origConfig;
        else delete process.env['GH_AW_MCP_CONFIG'];
        await vi.resetModules();
      }
    });

    it('should respect GH_AW_MCP_CONFIG environment variable for config path', async () => {
      const origAuth = process.env['MCP_AUTH_TOKEN'];
      const origGw = process.env['MCP_GATEWAY_API_KEY'];
      const origConfig = process.env['GH_AW_MCP_CONFIG'];

      delete process.env['MCP_AUTH_TOKEN'];
      delete process.env['MCP_GATEWAY_API_KEY'];

      const tmpDir = '/tmp/mcp-test-custom-path-' + Date.now();
      const fs = await import('fs');
      fs.mkdirSync(tmpDir, { recursive: true });
      const customConfigPath = `${tmpDir}/custom-mcp.json`;
      fs.writeFileSync(customConfigPath, JSON.stringify({
        gateway: { apiKey: 'custom-path-key-789' }
      }));
      process.env['GH_AW_MCP_CONFIG'] = customConfigPath;

      try {
        await vi.resetModules();
        const { getDefaultClient } = await import('../scripts/mcp-client.js');
        const client = getDefaultClient();
        expect(client.authToken).toBe('custom-path-key-789');
      } finally {
        if (origAuth !== undefined) process.env['MCP_AUTH_TOKEN'] = origAuth;
        else delete process.env['MCP_AUTH_TOKEN'];
        if (origGw !== undefined) process.env['MCP_GATEWAY_API_KEY'] = origGw;
        else delete process.env['MCP_GATEWAY_API_KEY'];
        if (origConfig !== undefined) process.env['GH_AW_MCP_CONFIG'] = origConfig;
        else delete process.env['GH_AW_MCP_CONFIG'];
        fs.rmSync(tmpDir, { recursive: true, force: true });
        await vi.resetModules();
      }
    });
  });

  describe('request', () => {
    it('should make successful HTTP request with JSON-RPC 2.0', async () => {
      const mockJsonRpcResponse = { 
        jsonrpc: '2.0',
        id: 1,
        result: { data: [], success: true }
      };
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockJsonRpcResponse)
      })) as unknown as typeof global.fetch;

      const result = await client.request('test_tool', { param: 'value' });
      expect(result).toEqual({ data: [], success: true });
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should send correct JSON-RPC 2.0 request format', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: {} })
      })) as unknown as typeof global.fetch;

      await client.request('test_tool', { key: 'val' });
      
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      const callArgs = mockFetch.mock.calls[0] as [string, RequestInit];
      // JSON-RPC posts to base URL, not /tools/{tool}
      expect(callArgs[0]).toBe('https://riksdag-regering-ai.onrender.com/mcp');
      expect(callArgs[1].method).toBe('POST');
      expect((callArgs[1].headers as Record<string, string>)['Content-Type']).toBe('application/json');
      
      const body: JsonRpcBody = JSON.parse(callArgs[1].body as string);
      expect(body.jsonrpc).toBe('2.0');
      expect(body.id).toBeDefined();
      expect(body.method).toBe('tools/call');
      // Direct server URL: tool names are NOT prefixed
      expect(body.params).toEqual({
        name: 'test_tool',
        arguments: { key: 'val' }
      });
    });

    it('should include custom headers from config in requests', async () => {
      const clientWithHeaders = new MCPClient({
        baseURL: 'https://test.example.com',
        headers: {
          'X-Custom-Header': 'custom-value',
          'X-API-Key': 'secret123'
        }
      });

      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: {} })
      })) as unknown as typeof global.fetch;

      await clientWithHeaders.request('test_tool', {});
      
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      const callArgs = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = callArgs[1].headers as Record<string, string>;
      
      // Should include both custom headers and Content-Type
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['X-Custom-Header']).toBe('custom-value');
      expect(headers['X-API-Key']).toBe('secret123');
    });

    it('should not override runtime headers with custom headers', async () => {
      const clientWithHeaders = new MCPClient({
        baseURL: 'https://test.example.com',
        authToken: 'runtime-token',
        headers: {
          'Authorization': 'config-token',  // Should be overridden
          'X-Custom': 'value'
        }
      });

      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: {} })
      })) as unknown as typeof global.fetch;

      await clientWithHeaders.request('test_tool', {});
      
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      const callArgs = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = callArgs[1].headers as Record<string, string>;
      
      // Runtime authToken should override config Authorization header
      expect(headers['Authorization']).toBe('runtime-token');
      expect(headers['X-Custom']).toBe('value');
    });

    it('should handle JSON-RPC error responses', async () => {
      const jsonRpcError = {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      };
      
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(jsonRpcError)
      })) as unknown as typeof global.fetch;

      await expect(client.request('unknown_tool', {})).rejects.toThrow('MCP tool error: Method not found');
    });

    it('should throw on non-ok HTTP response', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: () => Promise.resolve('Server error details')
      })) as unknown as typeof global.fetch;

      await expect(client.request('test_tool', {})).rejects.toThrow('MCP server error: 500 Internal Server Error');
    });

    it('should throw on 404 response', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('')
      })) as unknown as typeof global.fetch;

      await expect(client.request('bad_tool', {})).rejects.toThrow('404 Not Found');
    });

    it('should retry on network error', async () => {
      let attempt = 0;
      global.fetch = vi.fn(() => {
        attempt++;
        if (attempt < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { success: true } })
        });
      }) as unknown as typeof global.fetch;

      const result = await client.request('test_tool', {});
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should retry on ECONNREFUSED error', async () => {
      let attempt = 0;
      global.fetch = vi.fn(() => {
        attempt++;
        if (attempt < 2) {
          return Promise.reject(new Error('ECONNREFUSED'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { ok: true } })
        });
      }) as unknown as typeof global.fetch;

      const result = await client.request('test_tool', {});
      expect(result).toEqual({ ok: true });
    });

    it('should fail after max retries', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as unknown as typeof global.fetch;

      await expect(client.request('test_tool', {})).rejects.toThrow('Network error');
      expect(global.fetch).toHaveBeenCalledTimes(3); // maxRetries
    });

    it('should not retry on non-network errors', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: () => Promise.resolve('')
      })) as unknown as typeof global.fetch;

      // Non-network errors (HTTP errors) are not retried — they throw immediately
      await expect(client.request('test_tool', {})).rejects.toThrow('MCP server error');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should track statistics', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { success: true } })
      })) as unknown as typeof global.fetch;

      const statsBefore: MCPStats = client.getStats();
      expect(statsBefore.requests).toBe(0);

      await client.request('test_tool', {});
      
      const statsAfter: MCPStats = client.getStats();
      expect(statsAfter.requests).toBe(1);
      expect(statsAfter.errors).toBe(0);
    });

    it('should use default empty params when none provided', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { ok: true } })
      })) as unknown as typeof global.fetch;

      await client.request('test_tool');
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      const callArgs = mockFetch.mock.calls[0] as [string, RequestInit];
      const body: JsonRpcBody = JSON.parse(callArgs[1].body as string);
      expect(body.params.arguments).toEqual({});
    });

    it('should not add prefix when using direct server URL', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { success: true } })
      })) as unknown as typeof global.fetch;

      await client.request('test_tool', {});
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      const body: JsonRpcBody = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
      // Direct server URL: no prefix
      expect(body.params.name).toBe('test_tool');
    });

    it('should add prefix when using MCP gateway URL', async () => {
      const gatewayClient = new MCPClient({ baseURL: 'http://host.docker.internal:80/mcp/riksdag-regering' });
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { success: true } })
      })) as unknown as typeof global.fetch;

      await gatewayClient.request('test_tool', {});
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      const body: JsonRpcBody = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
      // Gateway URL: prefix added
      expect(body.params.name).toBe('riksdag-regering--test_tool');
    });

    it('should try without prefix if gateway returns Internal error', async () => {
      const gatewayClient = new MCPClient({ baseURL: 'http://host.docker.internal:80/mcp/riksdag-regering' });
      let callCount = 0;
      global.fetch = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          // First call with prefix fails with Internal error
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              jsonrpc: '2.0',
              id: 1,
              error: { code: -32603, message: 'Internal error' }
            })
          });
        }
        // Second call without prefix succeeds
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ jsonrpc: '2.0', id: 2, result: { success: true } })
        });
      }) as unknown as typeof global.fetch;

      const result = await gatewayClient.request('test_tool', {});
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(2);
      
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      // First call should have prefix
      const firstCall: JsonRpcBody = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
      expect(firstCall.params.name).toBe('riksdag-regering--test_tool');
      
      // Second call should not have prefix
      const secondCall: JsonRpcBody = JSON.parse((mockFetch.mock.calls[1] as [string, RequestInit])[1].body as string);
      expect(secondCall.params.name).toBe('test_tool');
    });
  });

  describe('sleep', () => {
    it('should resolve after specified delay', async () => {
      const start: number = Date.now();
      await client.sleep(50);
      const elapsed: number = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40); // Allow some tolerance
    });
  });

  describe('fetchCalendarEvents', () => {
    it('should fetch calendar events with date range', async () => {
      const mockEvents = [
        { title: 'Event 1', start: '2026-02-10T10:00:00' },
        { title: 'Event 2', start: '2026-02-11T14:00:00' }
      ];

      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { events: mockEvents } })
      })) as unknown as typeof global.fetch;

      const events = await client.fetchCalendarEvents('2026-02-10', '2026-02-17');
      expect(events).toHaveLength(2);
      expect((events[0] as Record<string, unknown>).title).toBe('Event 1');
    });

    it('should pass optional org and akt parameters', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { events: [] } })
      })) as unknown as typeof global.fetch;

      await client.fetchCalendarEvents('2026-02-10', '2026-02-17', 'kammaren', 'debatt');
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      const callArgs = mockFetch.mock.calls[0] as [string, RequestInit];
      const body: JsonRpcBody = JSON.parse(callArgs[1].body as string);
      expect(body.params.arguments).toEqual({ from: '2026-02-10', tom: '2026-02-17', org: 'kammaren', akt: 'debatt' });
    });

    it('should return empty array when response has no events key', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: "2.0", id: 1, result: {} })
      })) as unknown as typeof global.fetch;

      const events = await client.fetchCalendarEvents('2026-02-10', '2026-02-17');
      expect(events).toEqual([]);
    });
  });

  describe('fetchCommitteeReports', () => {
    it('should fetch committee reports with limit', async () => {
      const mockReports = [
        { title: 'Report 1', organ: 'UbU' },
        { title: 'Report 2', organ: 'SoU' }
      ];

      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { reports: mockReports } })
      })) as unknown as typeof global.fetch;

      const reports = await client.fetchCommitteeReports(10);
      expect(reports).toHaveLength(2);
    });

    it('should pass optional rm and organ parameters', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { reports: [] } })
      })) as unknown as typeof global.fetch;

      await client.fetchCommitteeReports(5, '2025/26', 'UbU');
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      const body: JsonRpcBody = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
      expect(body.params.arguments).toEqual({ limit: 5, rm: '2025/26', organ: 'UbU' });
    });

    it('should return empty array when response has no reports key', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: "2.0", id: 1, result: {} })
      })) as unknown as typeof global.fetch;

      const reports = await client.fetchCommitteeReports();
      expect(reports).toEqual([]);
    });
  });

  describe('fetchPropositions', () => {
    it('should fetch propositions with default limit', async () => {
      const mockProps = [{ title: 'Prop 1' }];
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { propositions: mockProps } })
      })) as unknown as typeof global.fetch;

      const props = await client.fetchPropositions();
      expect(props).toHaveLength(1);
      expect((props[0] as Record<string, unknown>).title).toBe('Prop 1');
    });

    it('should pass optional rm parameter', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { propositions: [] } })
      })) as unknown as typeof global.fetch;

      await client.fetchPropositions(5, '2025/26');
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      const body: JsonRpcBody = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
      expect(body.params.arguments).toEqual({ limit: 5, rm: '2025/26' });
    });

    it('should call correct tool name', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result: { propositions: [] } })
      })) as unknown as typeof global.fetch;

      await client.fetchPropositions();
      const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
      const body: JsonRpcBody = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string);
      // Direct server URL: unprefixed tool name
      expect(body.params.name).toBe('get_propositioner');
    });

    it('should return empty array when response has no propositions key', async () => {
      global.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jsonrpc: "2.0", id: 1, result: {} })
      })) as unknown as typeof global.fetch;

      const props = await client.fetchPropositions();
      expect(props).toEqual([]);
    });
  });

});
