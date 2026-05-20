/**
 * Defaults tests for `scripts/mcp-client/config/defaults.ts`.
 *
 * Covers the constants and the `MCP_CLIENT_TIMEOUT_MS` env-var override
 * implemented by `getDefaultTimeout()`. Asserts the defaults that the
 * retry policy (`RETRY_AFTER_CAP_MS`-equivalent) and the news Timer A
 * budget depend on (see Hack23/riksdagsmonitor#2578 §Security/ISMS).
 *
 * New file for Hack23/riksdagsmonitor#2578 follow-up.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

describe('config/defaults', () => {
  const orig = process.env['MCP_CLIENT_TIMEOUT_MS'];

  afterEach(async () => {
    if (orig !== undefined) process.env['MCP_CLIENT_TIMEOUT_MS'] = orig;
    else delete process.env['MCP_CLIENT_TIMEOUT_MS'];
    await vi.resetModules();
  });

  it('should expose DEFAULT_MAX_RETRIES = 3', async () => {
    const { DEFAULT_MAX_RETRIES } = await import('../../../scripts/mcp-client/config/defaults.js');
    expect(DEFAULT_MAX_RETRIES).toBe(3);
  });

  it('should expose RETRY_DELAY = 2000 ms', async () => {
    const { RETRY_DELAY } = await import('../../../scripts/mcp-client/config/defaults.js');
    expect(RETRY_DELAY).toBe(2000);
  });

  it('should resolve a non-empty DEFAULT_MCP_SERVER_URL', async () => {
    const { DEFAULT_MCP_SERVER_URL } = await import('../../../scripts/mcp-client/config/defaults.js');
    expect(typeof DEFAULT_MCP_SERVER_URL).toBe('string');
    expect(DEFAULT_MCP_SERVER_URL.length).toBeGreaterThan(0);
  });

  it('getDefaultTimeout() should default to 30000 ms when MCP_CLIENT_TIMEOUT_MS is unset', async () => {
    delete process.env['MCP_CLIENT_TIMEOUT_MS'];
    await vi.resetModules();
    const { getDefaultTimeout } = await import('../../../scripts/mcp-client/config/defaults.js');
    expect(getDefaultTimeout()).toBe(30_000);
  });

  it('getDefaultTimeout() should honour numeric MCP_CLIENT_TIMEOUT_MS', async () => {
    process.env['MCP_CLIENT_TIMEOUT_MS'] = '5000';
    await vi.resetModules();
    const { getDefaultTimeout } = await import('../../../scripts/mcp-client/config/defaults.js');
    expect(getDefaultTimeout()).toBe(5_000);
  });

  it('getDefaultTimeout() should fall back to 30000 ms on invalid MCP_CLIENT_TIMEOUT_MS', async () => {
    process.env['MCP_CLIENT_TIMEOUT_MS'] = 'not-a-number';
    await vi.resetModules();
    const { getDefaultTimeout } = await import('../../../scripts/mcp-client/config/defaults.js');
    expect(getDefaultTimeout()).toBe(30_000);
  });
});
