/**
 * @module mcp-client/transport/response-parser
 * @description Pure helpers for parsing JSON-RPC 2.0 response payloads and
 * reading the MCP gateway side-channel payload file.
 *
 * Extracted from `jsonrpc.ts` (Hack23/riksdagsmonitor#2578 follow-up) so the
 * wire-level dispatcher stays focused on orchestration, and the path-
 * traversal defence on `payloadPath` is reviewable in one bounded file.
 *
 * @author Hack23 AB
 * @license Apache-2.0
 */

import type { JsonRpcResponse } from '../../types/mcp.js';
import { parseSSEResponse } from './session.js';

/** Inspect a fetch `Response`'s `content-type` header defensively. */
export function getResponseContentType(response: {
  headers?: { get?: (name: string) => string | null };
}): string {
  return response.headers && typeof response.headers.get === 'function'
    ? (response.headers.get('content-type') ?? '')
    : '';
}

/**
 * Parse a `Response` body into a {@link JsonRpcResponse} envelope.
 * Branches on `content-type: text/event-stream` (SSE-framed) vs. plain JSON.
 */
export async function parseJsonRpcEnvelope(response: {
  text(): Promise<string>;
  json(): Promise<unknown>;
  headers?: { get?: (name: string) => string | null };
}): Promise<JsonRpcResponse> {
  const contentType = getResponseContentType(response);
  if (contentType.includes('text/event-stream')) {
    const text = await response.text();
    return parseSSEResponse(text);
  }
  return (await response.json()) as JsonRpcResponse;
}

/**
 * Read a large MCP gateway response from a side-channel `payloadPath`.
 *
 * The MCP gateway returns oversized JSON-RPC results via a file path pointer
 * (`{ "payloadPath": "/tmp/.../mcp-payload-….json" }`) instead of inlining
 * megabytes of text in the JSON-RPC envelope. That path is controlled by the
 * MCP gateway, so a compromised or buggy gateway could direct us at arbitrary
 * local files (e.g. `/etc/passwd`, `~/.copilot/mcp-config.json`) and
 * exfiltrate their contents back into `RawDocument` records.
 *
 * Defence-in-depth — the path is accepted only when ALL of the following hold:
 *   - it is a non-empty string;
 *   - it ends in `.json`;
 *   - it contains no NUL byte;
 *   - it resolves (after `path.resolve`) inside an allowed temp root —
 *     either `os.tmpdir()` or `/tmp`.
 *
 * On any policy violation, `null` is returned and the original inline `parsed`
 * object is surfaced to the caller as a graceful degradation.
 */
export async function readGatewayPayload(
  rawPath: string,
): Promise<Record<string, unknown> | null> {
  if (typeof rawPath !== 'string' || rawPath.length === 0) return null;
  if (rawPath.includes('\0')) return null;
  if (!rawPath.toLowerCase().endsWith('.json')) return null;

  const [pathMod, fsMod, osMod] = await Promise.all([
    import('path'),
    import('fs'),
    import('os'),
  ]);
  const resolved = pathMod.resolve(rawPath);
  const allowedRoots = [pathMod.resolve(osMod.tmpdir()), pathMod.resolve('/tmp')];
  const inAllowedRoot = allowedRoots.some((root) => {
    const rootWithSep = root.endsWith(pathMod.sep) ? root : root + pathMod.sep;
    return resolved === root || resolved.startsWith(rootWithSep);
  });
  if (!inAllowedRoot) {
    console.warn(
      `⚠️ Refusing to read MCP gateway payload outside allowed temp roots: ${resolved}`,
    );
    return null;
  }

  try {
    return JSON.parse(fsMod.readFileSync(resolved, 'utf8')) as Record<string, unknown>;
  } catch (err) {
    console.warn(
      `⚠️ Could not read MCP gateway payload ${resolved}: ${(err as Error).message}`,
    );
    return null;
  }
}

/**
 * Resolve the `result.content[0].text` payload from a JSON-RPC envelope into
 * a plain object. When the content holds a `payloadPath` pointer, dereferences
 * it via {@link readGatewayPayload} subject to the temp-root allow-list.
 *
 * Falls back to `{ text: <raw> }` on JSON parse failure, mirroring the legacy
 * single-blob client behaviour relied on by older callers.
 */
export async function resolveResultContent(
  result: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const content = result['content'] as Array<{ text?: string }> | undefined;
  if (!Array.isArray(content) || !content[0]?.text) return result;

  try {
    const parsed = JSON.parse(content[0].text) as Record<string, unknown>;
    if (!parsed['payloadPath']) return parsed;

    const payloadRaw = await readGatewayPayload(parsed['payloadPath'] as string);
    if (!payloadRaw) return parsed;

    const payloadContent = payloadRaw['content'] as Array<{ text?: string }> | undefined;
    const payloadText = payloadContent?.[0]?.text;
    if (!payloadText) return payloadRaw;

    try {
      return JSON.parse(payloadText) as Record<string, unknown>;
    } catch {
      return { text: payloadText };
    }
  } catch {
    return { text: content[0].text };
  }
}
