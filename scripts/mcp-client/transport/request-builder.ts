/**
 * @module mcp-client/transport/request-builder
 * @description Pure helpers for constructing JSON-RPC 2.0 request envelopes
 * and HTTP request headers for the MCP transport.
 *
 * Extracted from `jsonrpc.ts` (Hack23/riksdagsmonitor#2578 follow-up) so the
 * wire-level dispatcher stays focused on request/response orchestration.
 * These helpers are deterministic (id allocator aside) and trivially unit-
 * testable in isolation.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { JsonRpcRequest } from '../../types/mcp.js';

/** Module-scoped JSON-RPC id counter — monotonically increasing across instances. */
let jsonRpcId = 1;

/** Returns the next monotonic JSON-RPC id and post-increments the counter. */
export function nextJsonRpcId(): number {
  return jsonRpcId++;
}

/** Test-only reset of the id counter. Not part of the public API. */
export function _resetJsonRpcIdForTests(value = 1): void {
  jsonRpcId = value;
}

/** Validate that an MCP tool name only contains safe characters. */
export function assertValidToolName(tool: string): void {
  if (!tool || typeof tool !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(tool)) {
    throw new Error(
      `Invalid tool name: ${tool}. Tool names must contain only alphanumeric characters, hyphens, and underscores.`,
    );
  }
}

/** Build a `tools/call` JSON-RPC 2.0 request envelope. */
export function buildJsonRpcRequest(
  tool: string,
  params: Record<string, unknown>,
  id: number = nextJsonRpcId(),
): JsonRpcRequest {
  return {
    jsonrpc: '2.0',
    id,
    method: 'tools/call',
    params: { name: tool, arguments: params },
  };
}

/**
 * Build the HTTP request headers for an MCP JSON-RPC POST. Runtime headers
 * (`Authorization`, `Mcp-Session-Id`) always override any same-named keys
 * in `customHeaders` from the constructor.
 */
export function buildRequestHeaders(
  customHeaders: Readonly<Record<string, string>>,
  authToken: string | null | undefined,
  sessionId: string | null | undefined,
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    ...customHeaders,
  };
  if (authToken) headers['Authorization'] = authToken;
  if (sessionId) headers['Mcp-Session-Id'] = sessionId;
  return headers;
}
