/**
 * @module mcp-client/transport/error-envelope
 * @description JSON-RPC error → Error mapping plus request-failure message
 * formatting for the MCP transport.
 *
 * Extracted from `jsonrpc.ts` (Hack23/riksdagsmonitor#2578 follow-up) so the
 * wire-level dispatcher stays focused on orchestration and error wording is
 * unit-testable in isolation.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { JsonRpcResponse } from '../../types/mcp.js';

/**
 * Classification of a JSON-RPC error envelope returned by the MCP gateway.
 *
 *  - `none` — no `error` field; the call succeeded.
 *  - `session_init` — the gateway reports a stale session and the request
 *    should be retried after re-initialising. The session id MUST be cleared
 *    by the caller before retrying.
 *  - `fatal` — non-recoverable; the caller should throw the rendered message.
 */
export type JsonRpcErrorKind = 'none' | 'session_init' | 'fatal';

export interface JsonRpcErrorOutcome {
  kind: JsonRpcErrorKind;
  /** Pre-rendered, caller-ready error message (never empty when kind !== 'none'). */
  message: string;
}

/**
 * Examine a parsed JSON-RPC response and classify any embedded error. The
 * `session initialization` and `Too Many Requests` triggers signal that the
 * caller should null its `sessionId`, await a backoff, and replay the request
 * (bounded retry — typically 2 attempts).
 */
export function classifyJsonRpcError(response: JsonRpcResponse): JsonRpcErrorOutcome {
  if (!response.error) return { kind: 'none', message: '' };

  const errorMsg = response.error.message || JSON.stringify(response.error);
  const sessionTrigger =
    errorMsg.includes('session initialization') || errorMsg.includes('Too Many Requests');

  if (sessionTrigger) {
    return { kind: 'session_init', message: `MCP tool error: ${errorMsg}` };
  }
  return { kind: 'fatal', message: `MCP tool error: ${errorMsg}` };
}

/**
 * Compose the `MCP request failed: …` message with troubleshooting tips.
 *
 * Two hint blocks are emitted:
 *   - timeout/AbortError → cold-start guidance for Render.com free tier.
 *   - network/ECONNREFUSED/fetch failed → general connectivity guidance.
 */
export function formatRequestFailure(err: Error, baseURL: string): string {
  const errorMsg = (err.message ?? '').toLowerCase();
  let message = `MCP request failed: ${err.message}`;

  if (err.name === 'AbortError' || errorMsg.includes('timeout')) {
    message += `\n\n💡 Troubleshooting tips:
  - The MCP server may be cold starting (Render.com free tier)
  - Try increasing timeout or waiting a few minutes
  - Server URL: ${baseURL}
  - Consider running workflow again in 5-10 minutes`;
  } else if (
    errorMsg.includes('network') ||
    errorMsg.includes('econnrefused') ||
    errorMsg.includes('fetch failed')
  ) {
    message += `\n\n💡 Troubleshooting tips:
  - Check if MCP server is accessible: ${baseURL}
  - Verify network connectivity
  - The server may be temporarily unavailable
  - Try manual workflow dispatch with force_generation=true`;
  }
  return message;
}
