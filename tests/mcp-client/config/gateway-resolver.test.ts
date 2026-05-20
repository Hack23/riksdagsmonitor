/**
 * Gateway-resolver tests for `scripts/mcp-client/config/gateway-resolver.ts`.
 *
 * Exercises the AWF gateway auto-detect cascade:
 *   1. MCP_SERVER_URL env var (highest priority)
 *   2. MCP_GATEWAY_API_KEY env var → host.docker.internal:8080
 *   3. mcp-config.json gateway.apiKey / mcpServers.riksdag-regering.headers.Authorization
 *   4. gateway.port override (legacy 80 vs gh-aw v0.69+ 8080)
 *   5. fall back to the direct onrender URL
 *
 * Migrated from `tests/mcp-client-core-part1.test.ts` lines 370-569
 * (Hack23/riksdagsmonitor#2578 follow-up).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

interface EnvSnapshot {
  MCP_SERVER_URL: string | undefined;
  MCP_GATEWAY_API_KEY: string | undefined;
  GH_AW_MCP_CONFIG: string | undefined;
  MCP_GATEWAY_PORT: string | undefined;
}

function snapshotEnv(): EnvSnapshot {
  return {
    MCP_SERVER_URL: process.env['MCP_SERVER_URL'],
    MCP_GATEWAY_API_KEY: process.env['MCP_GATEWAY_API_KEY'],
    GH_AW_MCP_CONFIG: process.env['GH_AW_MCP_CONFIG'],
    MCP_GATEWAY_PORT: process.env['MCP_GATEWAY_PORT'],
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
  const tmpDir = fs.mkdtempSync(path.join('/tmp', 'mcp-gw-test-'));
  const configPath = path.join(tmpDir, 'mcp-config.json');
  fs.writeFileSync(configPath, JSON.stringify(content));
  return configPath;
}

describe('MCPClient — default server URL resolution (AWF gateway auto-detect)', () => {
  let snap: EnvSnapshot;
  const created: string[] = [];

  beforeEach(() => {
    snap = snapshotEnv();
    delete process.env['MCP_SERVER_URL'];
    delete process.env['MCP_GATEWAY_API_KEY'];
    delete process.env['GH_AW_MCP_CONFIG'];
    delete process.env['MCP_GATEWAY_PORT'];
  });

  afterEach(async () => {
    restoreEnv(snap);
    for (const dir of created) fs.rmSync(path.dirname(dir), { recursive: true, force: true });
    created.length = 0;
    await vi.resetModules();
  });

  it('should use MCP_SERVER_URL env var when explicitly set', async () => {
    process.env['MCP_SERVER_URL'] = 'http://custom.example/mcp/r';
    await vi.resetModules();
    const { getDefaultClient } = await import('../../../scripts/mcp-client.js');
    expect(getDefaultClient().baseURL).toBe('http://custom.example/mcp/r');
  });

  it('should auto-route to gateway URL when MCP_GATEWAY_API_KEY is set and MCP_SERVER_URL is absent', async () => {
    process.env['MCP_GATEWAY_API_KEY'] = 'gw-key-active';
    await vi.resetModules();
    const { getDefaultClient } = await import('../../../scripts/mcp-client.js');
    expect(getDefaultClient().baseURL).toBe(
      'http://host.docker.internal:8080/mcp/riksdag-regering',
    );
  });

  it('should honour MCP_GATEWAY_PORT env var when present', async () => {
    process.env['MCP_GATEWAY_API_KEY'] = 'gw-key-active';
    process.env['MCP_GATEWAY_PORT'] = '8080';
    await vi.resetModules();
    const { getDefaultClient } = await import('../../../scripts/mcp-client.js');
    expect(getDefaultClient().baseURL).toBe(
      'http://host.docker.internal:8080/mcp/riksdag-regering',
    );
  });

  it('should auto-route to gateway URL when mcp-config.json has gateway.apiKey (AWF sandbox)', async () => {
    const cfg = writeConfig({
      gateway: { apiKey: 'k', port: 80, domain: 'host.docker.internal' },
    });
    created.push(cfg);
    process.env['GH_AW_MCP_CONFIG'] = cfg;
    await vi.resetModules();
    const { getDefaultClient } = await import('../../../scripts/mcp-client.js');
    expect(getDefaultClient().baseURL).toBe(
      'http://host.docker.internal:80/mcp/riksdag-regering',
    );
  });

  it('should auto-route to gateway URL when mcp-config.json has mcpServers riksdag-regering headers Authorization', async () => {
    const cfg = writeConfig({
      mcpServers: { 'riksdag-regering': { headers: { Authorization: 'abc' } } },
    });
    created.push(cfg);
    process.env['GH_AW_MCP_CONFIG'] = cfg;
    await vi.resetModules();
    const { getDefaultClient } = await import('../../../scripts/mcp-client.js');
    expect(getDefaultClient().baseURL).toBe(
      'http://host.docker.internal:8080/mcp/riksdag-regering',
    );
  });

  it('should pick up gateway.port from mcp-config.json (gh-aw v0.69+ uses 8080)', async () => {
    const cfg = writeConfig({
      gateway: { apiKey: 'k', port: 8080, domain: 'host.docker.internal' },
    });
    created.push(cfg);
    process.env['GH_AW_MCP_CONFIG'] = cfg;
    await vi.resetModules();
    const { getDefaultClient } = await import('../../../scripts/mcp-client.js');
    expect(getDefaultClient().baseURL).toBe(
      'http://host.docker.internal:8080/mcp/riksdag-regering',
    );
  });

  it('should fall back to direct onrender URL when no gateway indicators are present', async () => {
    process.env['GH_AW_MCP_CONFIG'] = '/tmp/nonexistent-' + Date.now() + '.json';
    await vi.resetModules();
    const { getDefaultClient } = await import('../../../scripts/mcp-client.js');
    expect(getDefaultClient().baseURL).toBe('https://riksdag-regering-ai.onrender.com/mcp');
  });
});
