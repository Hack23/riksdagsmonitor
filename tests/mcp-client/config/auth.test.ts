/**
 * Auth-boundary tests for `scripts/mcp-client/config/auth.ts`.
 *
 * Asserts the single-sink rule from
 * `.github/skills/Authentication-and-Credentials-for-Agentic-Workflows`:
 * only `config/auth.ts` may read MCP credential env vars / config-file
 * fields. The tests exercise every documented priority rung.
 *
 * Migrated from `tests/mcp-client-core-part1.test.ts` lines 95-367
 * (Hack23/riksdagsmonitor#2578 follow-up).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

interface EnvSnapshot {
  MCP_AUTH_TOKEN: string | undefined;
  MCP_GATEWAY_API_KEY: string | undefined;
  GH_AW_MCP_CONFIG: string | undefined;
}

function snapshotEnv(): EnvSnapshot {
  return {
    MCP_AUTH_TOKEN: process.env['MCP_AUTH_TOKEN'],
    MCP_GATEWAY_API_KEY: process.env['MCP_GATEWAY_API_KEY'],
    GH_AW_MCP_CONFIG: process.env['GH_AW_MCP_CONFIG'],
  };
}

function restoreEnv(snap: EnvSnapshot): void {
  for (const key of Object.keys(snap) as Array<keyof EnvSnapshot>) {
    const v = snap[key];
    if (v !== undefined) process.env[key] = v;
    else delete process.env[key];
  }
}

function writeConfig(content: unknown): string {
  const tmpDir = fs.mkdtempSync(path.join('/tmp', 'mcp-auth-test-'));
  const configPath = path.join(tmpDir, 'mcp-config.json');
  fs.writeFileSync(configPath, typeof content === 'string' ? content : JSON.stringify(content));
  return configPath;
}

describe('MCPClient — auth token resolution', () => {
  let snap: EnvSnapshot;

  beforeEach(() => {
    snap = snapshotEnv();
    delete process.env['MCP_AUTH_TOKEN'];
    delete process.env['MCP_GATEWAY_API_KEY'];
    delete process.env['GH_AW_MCP_CONFIG'];
  });

  afterEach(async () => {
    restoreEnv(snap);
    await vi.resetModules();
  });

  it('should use MCP_GATEWAY_API_KEY env var as auth token when MCP_AUTH_TOKEN is not set', async () => {
    process.env['MCP_GATEWAY_API_KEY'] = 'test-gw-key-123';
    await vi.resetModules();
    const { getDefaultClient } = await import('../../../scripts/mcp-client.js');
    expect(getDefaultClient().authToken).toBe('test-gw-key-123');
  });

  it('should read gateway API key from MCP config file when env vars are unset', async () => {
    const configPath = writeConfig({
      gateway: { apiKey: 'file-based-key-456', port: 80, domain: 'host.docker.internal' },
    });
    process.env['GH_AW_MCP_CONFIG'] = configPath;
    await vi.resetModules();
    const { getDefaultClient } = await import('../../../scripts/mcp-client.js');
    expect(getDefaultClient().authToken).toBe('file-based-key-456');
    fs.rmSync(path.dirname(configPath), { recursive: true, force: true });
  });

  it('should return empty auth token when config file has malformed JSON', async () => {
    const configPath = writeConfig('{ invalid json !!!');
    process.env['GH_AW_MCP_CONFIG'] = configPath;
    await vi.resetModules();
    const { getDefaultClient } = await import('../../../scripts/mcp-client.js');
    expect(getDefaultClient().authToken).toBe('');
    fs.rmSync(path.dirname(configPath), { recursive: true, force: true });
  });

  it('should return empty auth token when config file is missing gateway field and mcpServers has no riksdag-regering', async () => {
    const configPath = writeConfig({ mcpServers: {} });
    process.env['GH_AW_MCP_CONFIG'] = configPath;
    await vi.resetModules();
    const { getDefaultClient } = await import('../../../scripts/mcp-client.js');
    expect(getDefaultClient().authToken).toBe('');
    fs.rmSync(path.dirname(configPath), { recursive: true, force: true });
  });

  it('should read auth from mcpServers riksdag-regering headers when gateway.apiKey is absent', async () => {
    const configPath = writeConfig({
      mcpServers: {
        'riksdag-regering': {
          type: 'http',
          url: 'https://riksdag-regering-ai.onrender.com/mcp',
          headers: { Authorization: 'Bearer mcpserver-token-abc' },
        },
      },
    });
    process.env['GH_AW_MCP_CONFIG'] = configPath;
    await vi.resetModules();
    const { getDefaultClient } = await import('../../../scripts/mcp-client.js');
    expect(getDefaultClient().authToken).toBe('mcpserver-token-abc');
    fs.rmSync(path.dirname(configPath), { recursive: true, force: true });
  });

  it('should prefer gateway.apiKey over mcpServers when both are present', async () => {
    const configPath = writeConfig({
      gateway: { apiKey: 'gateway-key-wins' },
      mcpServers: {
        'riksdag-regering': { headers: { Authorization: 'Bearer server-key-loses' } },
      },
    });
    process.env['GH_AW_MCP_CONFIG'] = configPath;
    await vi.resetModules();
    const { getDefaultClient } = await import('../../../scripts/mcp-client.js');
    expect(getDefaultClient().authToken).toBe('gateway-key-wins');
    fs.rmSync(path.dirname(configPath), { recursive: true, force: true });
  });

  it('should return empty auth token when config file does not exist', async () => {
    process.env['GH_AW_MCP_CONFIG'] = '/tmp/nonexistent-mcp-config-' + Date.now() + '.json';
    await vi.resetModules();
    const { getDefaultClient } = await import('../../../scripts/mcp-client.js');
    expect(getDefaultClient().authToken).toBe('');
  });

  it('should respect GH_AW_MCP_CONFIG environment variable for config path', async () => {
    const configPath = writeConfig({ gateway: { apiKey: 'custom-path-key-789' } });
    process.env['GH_AW_MCP_CONFIG'] = configPath;
    await vi.resetModules();
    const { getDefaultClient } = await import('../../../scripts/mcp-client.js');
    expect(getDefaultClient().authToken).toBe('custom-path-key-789');
    fs.rmSync(path.dirname(configPath), { recursive: true, force: true });
  });

  it('should strip legacy "Bearer " prefix from MCP_AUTH_TOKEN env var', async () => {
    process.env['MCP_AUTH_TOKEN'] = 'Bearer my-token-xyz';
    await vi.resetModules();
    const { getDefaultClient } = await import('../../../scripts/mcp-client.js');
    expect(getDefaultClient().authToken).toBe('my-token-xyz');
  });

  it('should expose hasMcpGatewayApiKey() without leaking the token value', async () => {
    process.env['MCP_GATEWAY_API_KEY'] = 'secret-gw';
    await vi.resetModules();
    const auth = await import('../../../scripts/mcp-client/config/auth.js');
    expect(auth.hasMcpGatewayApiKey()).toBe(true);

    delete process.env['MCP_GATEWAY_API_KEY'];
    await vi.resetModules();
    const auth2 = await import('../../../scripts/mcp-client/config/auth.js');
    expect(auth2.hasMcpGatewayApiKey()).toBe(false);
  });
});
