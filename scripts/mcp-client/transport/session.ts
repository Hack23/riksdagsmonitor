/**
 * @module mcp-client/transport/session
 * @description MCP session bootstrap + SSE response parsing helpers.
 *
 * Extracted from `jsonrpc.ts` so the wire-level request loop stays focused
 * on JSON-RPC dispatch + retry, while session lifecycle (initialize +
 * notifications/initialized) lives in one auditable place.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { JsonRpcResponse } from '../../types/mcp.js';
import { performPost } from '../transport.js';

/**
 * Parse an SSE-framed JSON-RPC response. Falls back to plain-JSON parsing
 * when no `data:` lines are present.
 */
export function parseSSEResponse(text: string): JsonRpcResponse {
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      return JSON.parse(line.substring(6)) as JsonRpcResponse;
    }
  }
  return JSON.parse(text) as JsonRpcResponse;
}

export interface SessionInitContext {
  readonly baseURL: string;
  readonly timeout: number;
  readonly customHeaders: Readonly<Record<string, string>>;
  readonly authToken: string;
  sessionId: string | null;
  nextJsonRpcId(): number;
}

/**
 * Perform the MCP session handshake (initialize + notifications/initialized).
 *
 * No-op when the context already has a session id or when no auth token is
 * configured (anonymous gateway). On success, `ctx.sessionId` is mutated
 * with the returned `Mcp-Session-Id` header value (when present).
 */
export async function initializeSession(ctx: SessionInitContext): Promise<void> {
  if (ctx.sessionId || !ctx.authToken) return;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ctx.timeout);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...ctx.customHeaders,
    };
    if (ctx.authToken) headers['Authorization'] = ctx.authToken;

    const response = await performPost(
      ctx.baseURL,
      headers,
      JSON.stringify({
        jsonrpc: '2.0',
        id: ctx.nextJsonRpcId(),
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'riksdagsmonitor-news', version: '1.0.0' },
        },
      }),
      controller.signal,
    );

    if (!response.ok) {
      throw new Error(`Session init failed: ${response.status} ${response.statusText}`);
    }

    const sessionId =
      response.headers && typeof response.headers.get === 'function'
        ? response.headers.get('Mcp-Session-Id')
        : null;

    if (sessionId) {
      ctx.sessionId = sessionId;
      console.log(`  🔗 MCP session initialized: ${sessionId.substring(0, 8)}...`);
    }

    await performPost(
      ctx.baseURL,
      {
        ...headers,
        ...(ctx.sessionId ? { 'Mcp-Session-Id': ctx.sessionId } : {}),
      },
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      }),
      controller.signal,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
